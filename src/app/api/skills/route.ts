import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/skills - List skills with filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const search = searchParams.get("search") || "";
  const agent = searchParams.get("agent") || ""; // Filter by agent compatibility
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);

  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Build query with plugin join
  let query = supabase.from("skills").select(
    `
      *,
      plugin:plugins(
        id,
        name,
        plugin_type,
        marketplace_id
      )
    `,
    { count: "exact" }
  );

  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (agent && agent !== "all") {
    // Filter by agent compatibility (array contains)
    query = query.contains("agent_compatibility", [agent]);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  // Order by name
  query = query.order("name", { ascending: true });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: skills, error, count } = await query;

  if (error) {
    console.error("[API] Skills query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    skills: skills || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
