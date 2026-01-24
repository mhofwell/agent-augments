import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/skill-publishers/[slug] - Get a single publisher with all skills
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();

  // Fetch publisher with skills
  const { data: publisher, error } = await supabase
    .from("skill_publishers")
    .select(
      `
      *,
      skills:publisher_skills(*)
    `
    )
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }
    console.error("[API] Skill publisher query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill publisher" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publisher });
}
