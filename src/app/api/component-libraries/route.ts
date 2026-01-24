import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/component-libraries - List all component libraries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sort = searchParams.get("sort") || "stars";
  const filter = searchParams.get("filter") || "all"; // all, mcp, skill, both

  const supabase = await createClient();

  // Build query (table is still ui_frameworks in the database)
  let query = supabase.from("ui_frameworks").select("*");

  // Apply filter
  switch (filter) {
    case "mcp":
      query = query.eq("has_mcp", true);
      break;
    case "skill":
      query = query.eq("has_skill", true);
      break;
    case "both":
      query = query.eq("has_mcp", true).eq("has_skill", true);
      break;
    // "all" - no filter
  }

  // Apply sorting
  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "updated":
      query = query.order("last_commit_at", { ascending: false, nullsFirst: false });
      break;
    case "stars":
    default:
      query = query.order("github_stars", { ascending: false, nullsFirst: false });
      break;
  }

  // Secondary sort by sort_order for consistency
  query = query.order("sort_order", { ascending: true });

  const { data: libraries, error } = await query;

  if (error) {
    console.error("[API] Component libraries query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch component libraries" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    libraries: libraries || [],
    total: libraries?.length || 0,
  });
}
