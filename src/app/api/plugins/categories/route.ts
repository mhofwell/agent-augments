import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/plugins/categories - Get plugins grouped by category
// Returns top plugins per category for browse-by-category view
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Number of plugins to show per category (default 6)
  const perCategory = Math.min(
    parseInt(searchParams.get("per_category") || "6", 10),
    12
  );
  const agent = searchParams.get("agent") || "claude-code";

  const supabase = await createClient();

  // First, get all distinct categories with their counts
  let countQuery = supabase
    .from("plugins")
    .select("category", { count: "exact", head: false });

  if (agent && agent !== "all") {
    countQuery = countQuery.eq("agent", agent);
  }

  const { data: allPlugins } = await countQuery;

  // Count plugins per category
  const categoryCounts = new Map<string, number>();
  if (allPlugins) {
    for (const plugin of allPlugins) {
      const cat = plugin.category || "general";
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }
  }

  // Sort categories by count (most popular first)
  const sortedCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  // For each category, get top plugins
  const categoriesWithPlugins: {
    category: string;
    count: number;
    plugins: unknown[];
  }[] = [];

  for (const category of sortedCategories) {
    let query = supabase
      .from("plugins")
      .select(
        `
        *,
        marketplace:marketplaces!inner(
          id,
          name,
          github_owner,
          github_repo
        )
      `
      )
      .eq("category", category)
      .order("install_count", { ascending: false })
      .limit(perCategory);

    if (agent && agent !== "all") {
      query = query.eq("agent", agent);
    }

    const { data: plugins } = await query;

    if (plugins && plugins.length > 0) {
      categoriesWithPlugins.push({
        category,
        count: categoryCounts.get(category) || plugins.length,
        plugins,
      });
    }
  }

  return NextResponse.json({
    categories: categoriesWithPlugins,
    totalCategories: sortedCategories.length,
  });
}
