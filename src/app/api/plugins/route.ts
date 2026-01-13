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
  const framework = searchParams.get("framework") || "";
  const agent = searchParams.get("agent") || "claude-code"; // Default to claude-code
  const sort = searchParams.get("sort") || "installs";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);

  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // If framework filter is set, get the plugin IDs linked to that framework
  let frameworkPluginIds: string[] | null = null;
  if (framework && framework !== "all") {
    const { data: links } = await supabase
      .from("plugin_frameworks")
      .select("plugin_id")
      .eq("framework_id", framework);

    if (links && links.length > 0) {
      frameworkPluginIds = links.map((l) => l.plugin_id);
    } else {
      // No plugins linked to this framework
      return NextResponse.json({
        plugins: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  }

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

  // Filter by agent (defaults to claude-code, use "all" to show all agents)
  if (agent && agent !== "all") {
    query = query.eq("agent", agent);
  }

  // Filter by framework-linked plugins
  if (frameworkPluginIds) {
    query = query.in("id", frameworkPluginIds);
  }

  // Apply sorting (and time-based filtering for "new")
  switch (sort) {
    case "new":
      // New = created in last 7 days, sorted by newest first
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
      query = query.order("created_at", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "installs":
    default:
      query = query.order("install_count", { ascending: false });
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
