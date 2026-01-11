import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/plugins - List plugins with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";
  const marketplace = searchParams.get("marketplace") || "";
  const sort = searchParams.get("sort") || "newest";
  const tab = searchParams.get("tab") || "discover";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);

  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Build query
  let query = supabase.from("plugins").select(
    `
      *,
      marketplace:marketplaces!inner(
        id,
        name,
        github_owner,
        github_repo
      )
    `,
    { count: "exact" }
  );

  // Apply filters
  if (search) {
    // Use text search on name and description
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (type && type !== "all") {
    query = query.eq("plugin_type", type as "skill" | "agent" | "command" | "bundle" | "hook" | "unknown");
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (marketplace && marketplace !== "all") {
    query = query.eq("marketplace_id", marketplace);
  }

  // Apply tab-specific filters
  if (tab === "featured") {
    // Featured = high install count (top 20% or manual flag if we add one)
    query = query.order("install_count", { ascending: false }).limit(limit);
  } else if (tab === "new") {
    // New = created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte("created_at", sevenDaysAgo.toISOString());
  }

  // Apply sorting
  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "installs":
      query = query.order("install_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: plugins, error, count } = await query;

  if (error) {
    console.error("[API] Plugins query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    plugins: plugins || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
