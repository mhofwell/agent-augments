#!/usr/bin/env bun
/**
 * Cron script to sync all marketplaces and discover new frameworks
 * Railway cron schedule: 0 0 * * 0 (weekly on Sunday midnight UTC)
 * Run with: bun scripts/cron-sync.ts
 */

import { syncAllMarketplaces } from "@/lib/sync/marketplace-sync";
import { syncFrameworks } from "@/lib/sync/framework-sync";

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
      skipped: frameworkSummary.skipped,
      errors: frameworkSummary.errors.length,
    }, null, 2));

    if (frameworkSummary.errors.length > 0) {
      console.log("[Cron] Framework sync errors:");
      frameworkSummary.errors.forEach((e) => console.log(`  - ${e}`));
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
