#!/usr/bin/env bun
/**
 * Standalone script to enrich frameworks with LLM-generated prose
 * Populates `how_it_works` and improves `description` fields
 *
 * Run with: ANTHROPIC_API_KEY=xxx bun run scripts/enrich-frameworks.ts
 */

import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import type { Framework } from "@/types/database";
import { calculateCompletenessScore } from "@/lib/framework-completeness";

const GITHUB_API_BASE = "https://api.github.com";
const RATE_LIMIT_MS = 1000; // 1 second between LLM calls

// Prose enrichment prompt (from framework-sync.ts)
const PROSE_ENRICHMENT_PROMPT = `You are analyzing a GitHub repository for an AI coding framework/methodology.

Based on the README content below, provide:
1. A concise description (1-2 sentences, max 200 chars) summarizing what this framework does
2. A "how it works" explanation (2-4 sentences, max 500 chars) describing the workflow/process

README:
---
{README_CONTENT}
---

Respond in JSON format:
{
  "description": "...",
  "how_it_works": "..."
}

Rules:
- Be factual, not promotional
- Focus on what makes this framework unique
- For "how_it_works", describe the actual steps/flow a developer follows
- If the README lacks sufficient detail, provide a reasonable summary based on available info
- Never say "This framework..." - start with action verbs or the framework's core concept`;

interface ProseEnrichmentResult {
  description: string;
  how_it_works: string;
}

interface EnrichmentStats {
  total: number;
  enriched: number;
  skipped: number;
  errors: string[];
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agent-augments-enricher",
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

/**
 * Enrich framework with LLM-generated prose
 */
async function enrichWithClaude(
  readme: string,
  anthropic: Anthropic
): Promise<ProseEnrichmentResult | null> {
  // Skip if README is too short
  if (readme.length < 100) {
    console.log(`  [Skip] README too short (${readme.length} chars)`);
    return null;
  }

  // Truncate README to avoid token limits (first 8000 chars)
  const truncatedReadme = readme.slice(0, 8000);

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: PROSE_ENRICHMENT_PROMPT.replace(
            "{README_CONTENT}",
            truncatedReadme
          ),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ProseEnrichmentResult;

    // Validate required fields
    if (!parsed.description || !parsed.how_it_works) {
      throw new Error("Missing required fields in response");
    }

    // Enforce length limits
    return {
      description: parsed.description.slice(0, 500),
      how_it_works: parsed.how_it_works.slice(0, 1000),
    };
  } catch (error) {
    console.log(
      `  [Error] LLM enrichment failed: ${error instanceof Error ? error.message : error}`
    );
    return null;
  }
}

async function main() {
  console.log("[Enrich] Starting framework enrichment...");
  console.log(`[Enrich] Time: ${new Date().toISOString()}`);

  // Validate required env vars
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[Enrich] Error: ANTHROPIC_API_KEY not set");
    console.error("Usage: ANTHROPIC_API_KEY=xxx bun run scripts/enrich-frameworks.ts");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("[Enrich] Error: NEXT_PUBLIC_SUPABASE_URL not set");
    process.exit(1);
  }

  const secretKeyVar =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKeyVar) {
    console.error(
      "[Enrich] Error: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY not set"
    );
    process.exit(1);
  }

  if (!process.env.GITHUB_PAT) {
    console.warn(
      "[Enrich] Warning: GITHUB_PAT not set, using unauthenticated GitHub requests (60/hour limit)"
    );
  }

  const supabase = createAdminClient();
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const stats: EnrichmentStats = {
    total: 0,
    enriched: 0,
    skipped: 0,
    errors: [],
  };

  // Query frameworks needing enrichment
  const { data: frameworks, error: fetchError } = await supabase
    .from("frameworks")
    .select("id, slug, name, github_url, description, how_it_works, prose_enriched_at")
    .is("how_it_works", null)
    .eq("is_active", true)
    .order("stars", { ascending: false });

  if (fetchError) {
    console.error(`[Enrich] Failed to fetch frameworks: ${fetchError.message}`);
    process.exit(1);
  }

  if (!frameworks || frameworks.length === 0) {
    console.log("[Enrich] No frameworks need enrichment (all have how_it_works)");
    process.exit(0);
  }

  stats.total = frameworks.length;
  console.log(`[Enrich] Found ${frameworks.length} frameworks needing enrichment\n`);

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

      // Record the error in DB
      await supabase
        .from("frameworks")
        .update({
          prose_enrichment_error: "README not found or too short",
        })
        .eq("id", framework.id);

      continue;
    }

    // Rate limit before LLM call
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

    // Call Anthropic API
    const enrichment = await enrichWithClaude(readme, anthropic);
    if (!enrichment) {
      stats.errors.push(`${framework.slug}: LLM enrichment failed`);

      // Record the error in DB
      await supabase
        .from("frameworks")
        .update({
          prose_enrichment_error: "LLM enrichment failed",
        })
        .eq("id", framework.id);

      continue;
    }

    // Update database
    const updateData: Record<string, unknown> = {
      description: enrichment.description,
      how_it_works: enrichment.how_it_works,
      prose_enriched_at: new Date().toISOString(),
      prose_enrichment_error: null,
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
    console.log(`  [Done] description: "${enrichment.description.slice(0, 60)}..."`);
    console.log(`  [Done] how_it_works: "${enrichment.how_it_works.slice(0, 60)}..."`);
    console.log(`  [Done] completeness_score: ${completeness.score}%`);
  }

  // Summary
  console.log("\n[Enrich] === Summary ===");
  console.log(`Total frameworks: ${stats.total}`);
  console.log(`Enriched: ${stats.enriched}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\nErrors:");
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Verification query
  console.log("\n[Enrich] Verification query:");
  console.log(`
SELECT name,
  CASE WHEN how_it_works IS NOT NULL THEN 'YES' ELSE 'NO' END as enriched,
  prose_enriched_at
FROM frameworks
WHERE is_active = true
ORDER BY stars DESC;
  `);

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main();
