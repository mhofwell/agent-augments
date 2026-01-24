#!/usr/bin/env bun
/**
 * Cron script to sync all marketplaces and discover new frameworks, skills, and MCPs
 * Railway cron schedule: 0 0 * * 0 (weekly on Sunday midnight UTC)
 * Run with: bun scripts/cron-sync.ts
 */

import { syncAllMarketplaces } from "@/lib/sync/marketplace-sync";
import { syncFrameworks } from "@/lib/sync/framework-sync";
import { syncStandaloneSkills } from "@/lib/sync/skill-sync";
import { syncMcps } from "@/lib/sync/mcp-sync";
import { syncPublishers } from "@/lib/sync/publisher-sync";
import { syncUIFrameworks } from "@/lib/sync/ui-sync";

async function main() {
  console.log("[Cron] Starting sync...");
  console.log(`[Cron] Time: ${new Date().toISOString()}`);

  // Validate required env vars
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL"];
  const secretKeyVar = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`[Cron] Error: ${envVar} not set`);
      process.exit(1);
    }
  }

  if (!secretKeyVar) {
    console.error("[Cron] Error: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY not set");
    process.exit(1);
  }

  if (!process.env.GITHUB_PAT) {
    console.warn("[Cron] Warning: GITHUB_PAT not set, using unauthenticated GitHub requests (60/hour limit)");
  }

  try {
    // Sync marketplaces
    console.log("\n[Cron] === Marketplace Sync ===");
    const marketplaceSummary = await syncAllMarketplaces();

    console.log("[Cron] Marketplace sync completed");
    console.log(JSON.stringify({
      totalMarketplaces: marketplaceSummary.totalMarketplaces,
      successfulSyncs: marketplaceSummary.successfulSyncs,
      failedSyncs: marketplaceSummary.failedSyncs,
      totalPlugins: marketplaceSummary.totalPlugins,
      durationMs: marketplaceSummary.duration,
    }, null, 2));

    if (marketplaceSummary.failedSyncs > 0) {
      console.log("[Cron] Failed marketplace syncs:");
      marketplaceSummary.results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.marketplace}: ${r.error}`));
    }

    // Sync frameworks (discover new ones from GitHub)
    console.log("\n[Cron] === Framework Discovery ===");
    const frameworkSummary = await syncFrameworks();

    console.log("[Cron] Framework discovery completed");
    console.log(JSON.stringify({
      discovered: frameworkSummary.discovered,
      added: frameworkSummary.added,
      updated: frameworkSummary.updated,
      skipped: frameworkSummary.skipped,
      errors: frameworkSummary.errors.length,
    }, null, 2));

    if (frameworkSummary.errors.length > 0) {
      console.log("[Cron] Framework sync errors:");
      frameworkSummary.errors.forEach((e) => console.log(`  - ${e}`));
    }

    // Sync standalone skills (SKILL.md repos)
    console.log("\n[Cron] === Standalone Skill Discovery ===");
    const skillSummary = await syncStandaloneSkills();

    console.log("[Cron] Skill discovery completed");
    console.log(JSON.stringify({
      discovered: skillSummary.discovered,
      added: skillSummary.added,
      updated: skillSummary.updated,
      skipped: skillSummary.skipped,
      errors: skillSummary.errors.length,
    }, null, 2));

    if (skillSummary.errors.length > 0) {
      console.log("[Cron] Skill sync errors:");
      skillSummary.errors.forEach((e) => console.log(`  - ${e}`));
    }

    // Sync MCP servers
    console.log("\n[Cron] === MCP Server Discovery ===");
    const mcpSummary = await syncMcps();

    console.log("[Cron] MCP discovery completed");
    console.log(JSON.stringify({
      discovered: mcpSummary.discovered,
      added: mcpSummary.added,
      updated: mcpSummary.updated,
      skipped: mcpSummary.skipped,
      errors: mcpSummary.errors.length,
    }, null, 2));

    if (mcpSummary.errors.length > 0) {
      console.log("[Cron] MCP sync errors:");
      mcpSummary.errors.forEach((e) => console.log(`  - ${e}`));
    }

    // Sync skill publishers (Vercel, Railway, etc.)
    console.log("\n[Cron] === Skill Publisher Sync ===");
    const publisherSummary = await syncPublishers();

    console.log("[Cron] Publisher sync completed");
    console.log(JSON.stringify({
      publishersProcessed: publisherSummary.publishersProcessed,
      skillsAdded: publisherSummary.skillsAdded,
      skillsUpdated: publisherSummary.skillsUpdated,
      errors: publisherSummary.errors.length,
    }, null, 2));

    if (publisherSummary.errors.length > 0) {
      console.log("[Cron] Publisher sync errors:");
      publisherSummary.errors.forEach((e) => console.log(`  - ${e}`));
    }

    // Sync UI frameworks (ShadCN, MagicUI, etc.)
    console.log("\n[Cron] === UI Framework Sync ===");
    const uiSummary = await syncUIFrameworks();

    console.log("[Cron] UI framework sync completed");
    console.log(JSON.stringify({
      frameworksProcessed: uiSummary.frameworksProcessed,
      frameworksAdded: uiSummary.frameworksAdded,
      frameworksUpdated: uiSummary.frameworksUpdated,
      errors: uiSummary.errors.length,
    }, null, 2));

    if (uiSummary.errors.length > 0) {
      console.log("[Cron] UI framework sync errors:");
      uiSummary.errors.forEach((e) => console.log(`  - ${e}`));
    }

    console.log("\n[Cron] All syncs completed successfully");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Cron] Sync failed: ${message}`);
    process.exit(1);
  }
}

main();
