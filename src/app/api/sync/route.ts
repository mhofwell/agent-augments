import { syncAllMarketplaces } from "@/lib/sync/marketplace-sync";
import { NextRequest, NextResponse } from "next/server";

// POST /api/sync - Trigger marketplace sync
// Protected with CRON_SECRET header
export async function POST(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  // Allow either Bearer token or direct match
  const token = authHeader?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if GITHUB_PAT is configured
  if (!process.env.GITHUB_PAT) {
    console.warn("[Sync] Warning: GITHUB_PAT not configured, using unauthenticated requests");
  }

  try {
    const summary = await syncAllMarketplaces();

    return NextResponse.json({
      success: true,
      summary: {
        totalMarketplaces: summary.totalMarketplaces,
        successfulSyncs: summary.successfulSyncs,
        failedSyncs: summary.failedSyncs,
        totalPlugins: summary.totalPlugins,
        durationMs: summary.duration,
      },
      results: summary.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Sync] Error:", message);

    return NextResponse.json(
      { error: `Sync failed: ${message}` },
      { status: 500 }
    );
  }
}
