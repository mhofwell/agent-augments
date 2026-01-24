#!/usr/bin/env bun
/**
 * Script to sync skill publishers (Vercel, Railway, etc.)
 * Run with: bun scripts/sync-publishers.ts
 */

import { syncPublishers } from "@/lib/sync/publisher-sync";

async function main() {
  console.log("[SyncPublishers] Starting...");
  console.log(`[SyncPublishers] Time: ${new Date().toISOString()}`);

  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("[SyncPublishers] Error: NEXT_PUBLIC_SUPABASE_URL not set");
    process.exit(1);
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    console.error("[SyncPublishers] Error: SUPABASE_SECRET_KEY not set");
    process.exit(1);
  }

  if (!process.env.GITHUB_PAT) {
    console.warn("[SyncPublishers] Warning: GITHUB_PAT not set, using unauthenticated requests");
  }

  try {
    const result = await syncPublishers();

    console.log("\n[SyncPublishers] Results:");
    console.log(JSON.stringify(result, null, 2));

    if (result.errors.length > 0) {
      console.log("\n[SyncPublishers] Errors:");
      result.errors.forEach((e) => console.log(`  - ${e}`));
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("[SyncPublishers] Failed:", error);
    process.exit(1);
  }
}

main();
