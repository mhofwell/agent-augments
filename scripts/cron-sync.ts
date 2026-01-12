#!/usr/bin/env bun
/**
 * Cron script to sync all marketplaces
 * Railway cron schedule: 0 * * * * (every hour)
 * Run with: bun scripts/cron-sync.ts
 */

import { syncAllMarketplaces } from "@/lib/sync/marketplace-sync";

async function main() {
  console.log("[Cron] Starting marketplace sync...");
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
    const summary = await syncAllMarketplaces();

    console.log("[Cron] Sync completed successfully");
    console.log(JSON.stringify({
      totalMarketplaces: summary.totalMarketplaces,
      successfulSyncs: summary.successfulSyncs,
      failedSyncs: summary.failedSyncs,
      totalPlugins: summary.totalPlugins,
      durationMs: summary.duration,
    }, null, 2));

    if (summary.failedSyncs > 0) {
      console.log("[Cron] Failed syncs:");
      summary.results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.marketplace}: ${r.error}`));
    }

    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Cron] Sync failed: ${message}`);
    process.exit(1);
  }
}

main();
