#!/usr/bin/env bun
/**
 * Standalone script to enrich frameworks with structured workflow data
 * Populates `workflow_steps` field for "How It Works" UI display
 *
 * Run with: ANTHROPIC_API_KEY=xxx bun run scripts/enrich-workflows.ts
 *
 * Options:
 *   --force       Re-enrich all frameworks (ignore existing workflow_steps)
 *   --slug=xxx    Only enrich specific framework
 *   --dry-run     Extract but don't save to database
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { enrichFrameworkWorkflow, type FrameworkWorkflow } from "@/lib/sync/framework-sync";
import { calculateCompletenessScore } from "@/lib/framework-completeness";
import type { Framework } from "@/types/database";

const GITHUB_API_BASE = "https://api.github.com";
const RATE_LIMIT_MS = 2000; // 2 seconds between LLM calls (separate from prose)

interface EnrichmentStats {
  total: number;
  enriched: number;
  skipped: number;
  lowConfidence: number;
  errors: string[];
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agent-augments-workflow-enricher",
  };

  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }

  return headers;
}

/**
 * Fetch README content from GitHub
 */
async function fetchReadme(githubUrl: string): Promise<string | null> {
  // Parse owner/repo from GitHub URL
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    console.log(`  [Skip] Invalid GitHub URL: ${githubUrl}`);
    return null;
  }

  const [, owner, repo] = match;
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`;

  try {
    const response = await fetch(url, {
      headers: {
        ...getHeaders(),
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.log(`  [Rate Limited] Waiting 60s...`);
        await new Promise((r) => setTimeout(r, 60000));
        return fetchReadme(githubUrl); // Retry
      }
      console.log(`  [Skip] README not found (${response.status})`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.log(`  [Error] Failed to fetch README: ${error}`);
    return null;
  }
}

function parseArgs(): { force: boolean; slug: string | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  let force = false;
  let slug: string | null = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg === "--force") {
      force = true;
    } else if (arg.startsWith("--slug=")) {
      slug = arg.replace("--slug=", "");
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  return { force, slug, dryRun };
}

async function main() {
  const { force, slug, dryRun } = parseArgs();

  console.log("[WorkflowEnrich] Starting workflow enrichment...");
  console.log(`[WorkflowEnrich] Time: ${new Date().toISOString()}`);
  console.log(`[WorkflowEnrich] Options: force=${force}, slug=${slug || "all"}, dryRun=${dryRun}`);

  // Validate required env vars
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[WorkflowEnrich] Error: ANTHROPIC_API_KEY not set");
    console.error("Usage: ANTHROPIC_API_KEY=xxx bun run scripts/enrich-workflows.ts");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("[WorkflowEnrich] Error: NEXT_PUBLIC_SUPABASE_URL not set");
    process.exit(1);
  }

  const secretKeyVar =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKeyVar) {
    console.error(
      "[WorkflowEnrich] Error: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY not set"
    );
    process.exit(1);
  }

  if (!process.env.GITHUB_PAT) {
    console.warn(
      "[WorkflowEnrich] Warning: GITHUB_PAT not set, using unauthenticated GitHub requests (60/hour limit)"
    );
  }

  const supabase = createAdminClient();

  const stats: EnrichmentStats = {
    total: 0,
    enriched: 0,
    skipped: 0,
    lowConfidence: 0,
    errors: [],
  };

  // Build query for frameworks needing workflow enrichment
  let query = supabase
    .from("frameworks")
    .select("id, slug, name, github_url, install_command, workflow_steps, workflow_enriched_at")
    .eq("is_active", true)
    .order("stars", { ascending: false });

  // Filter by slug if provided
  if (slug) {
    query = query.eq("slug", slug);
  }

  // Only get frameworks without workflow unless --force
  if (!force) {
    query = query.is("workflow_steps", null);
  }

  const { data: frameworks, error: fetchError } = await query;

  if (fetchError) {
    console.error(`[WorkflowEnrich] Failed to fetch frameworks: ${fetchError.message}`);
    process.exit(1);
  }

  if (!frameworks || frameworks.length === 0) {
    console.log("[WorkflowEnrich] No frameworks need workflow enrichment");
    if (!force && !slug) {
      console.log("[WorkflowEnrich] Tip: Use --force to re-enrich all frameworks");
    }
    process.exit(0);
  }

  stats.total = frameworks.length;
  console.log(`[WorkflowEnrich] Found ${frameworks.length} frameworks to process\n`);

  for (const framework of frameworks) {
    console.log(`[${framework.slug}] Processing ${framework.name}...`);

    if (!framework.github_url) {
      console.log(`  [Skip] No GitHub URL`);
      stats.skipped++;
      continue;
    }

    // Fetch README from GitHub
    const readme = await fetchReadme(framework.github_url);
    if (!readme) {
      stats.skipped++;

      if (!dryRun) {
        // Record the error in DB
        await supabase
          .from("frameworks")
          .update({
            workflow_enrichment_error: "README not found or too short",
          })
          .eq("id", framework.id);
      }

      continue;
    }

    // Rate limit before LLM call
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

    // Call workflow extraction
    const result = await enrichFrameworkWorkflow(
      readme,
      framework.name,
      framework.install_command
    );

    if (!result.success) {
      console.log(`  [Skip] ${result.error.error}`);
      stats.skipped++;

      if (!dryRun) {
        await supabase
          .from("frameworks")
          .update({
            workflow_enrichment_error: result.error.error,
          })
          .eq("id", framework.id);
      }

      continue;
    }

    const { workflow, confidence } = result.data;

    // Skip low-confidence extractions (log for manual review)
    if (confidence === "low") {
      console.log(`  [LowConfidence] Skipping - workflow not clear in docs`);
      console.log(`    Philosophy: "${workflow.philosophy}"`);
      console.log(`    Steps: ${workflow.steps.length}`);
      stats.lowConfidence++;

      if (!dryRun) {
        await supabase
          .from("frameworks")
          .update({
            workflow_enrichment_error: `Low confidence extraction (${workflow.steps.length} steps)`,
          })
          .eq("id", framework.id);
      }

      continue;
    }

    // Log the extracted workflow
    console.log(`  [${confidence}] Philosophy: "${workflow.philosophy}"`);
    console.log(`  [${confidence}] Steps: ${workflow.steps.length}`);
    workflow.steps.forEach((step, i) => {
      console.log(`    ${i + 1}. ${step.command}`);
    });

    if (dryRun) {
      console.log(`  [DryRun] Would save workflow_steps`);
      stats.enriched++;
      continue;
    }

    // Update database
    const updateData: Record<string, unknown> = {
      workflow_steps: workflow as unknown as FrameworkWorkflow,
      workflow_enriched_at: new Date().toISOString(),
      workflow_enrichment_error: null,
    };

    // Calculate updated completeness score
    const updatedFramework = { ...framework, ...updateData } as unknown as Framework;
    const completeness = calculateCompletenessScore(updatedFramework);
    updateData.completeness_score = completeness.score;

    const { error: updateError } = await supabase
      .from("frameworks")
      .update(updateData)
      .eq("id", framework.id);

    if (updateError) {
      stats.errors.push(`${framework.slug}: DB update failed - ${updateError.message}`);
      console.log(`  [Error] DB update failed: ${updateError.message}`);
      continue;
    }

    stats.enriched++;
    console.log(`  [Done] Saved workflow (${confidence} confidence)`);
    console.log(`  [Done] completeness_score: ${completeness.score}%`);
  }

  // Summary
  console.log("\n[WorkflowEnrich] === Summary ===");
  console.log(`Total frameworks: ${stats.total}`);
  console.log(`Enriched: ${stats.enriched}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Low confidence (not saved): ${stats.lowConfidence}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\nErrors:");
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Verification query
  console.log("\n[WorkflowEnrich] Verification query:");
  console.log(`
SELECT slug,
  workflow_steps->'philosophy' as philosophy,
  jsonb_array_length(workflow_steps->'steps') as step_count,
  workflow_enriched_at
FROM frameworks
WHERE workflow_steps IS NOT NULL
ORDER BY stars DESC;
  `);

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main();
