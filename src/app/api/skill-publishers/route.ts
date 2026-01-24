import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { SkillTag } from "@/types/database";

// Valid skill tags for validation
const VALID_TAGS: SkillTag[] = [
  "infrastructure",
  "ai-ml",
  "security",
  "payments",
  "data-science",
  "automation",
  "documents",
  "development",
];

// GET /api/skill-publishers - List all skill publishers with their skills
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const includeSkills = searchParams.get("includeSkills") !== "false";
  const sort = searchParams.get("sort") || "stars";
  const tag = searchParams.get("tag") as SkillTag | null;

  const supabase = await createClient();

  // Build query for publishers
  let query = supabase.from("skill_publishers").select(
    includeSkills
      ? `
        *,
        skills:publisher_skills(*)
      `
      : "*"
  );

  // Filter by tag if provided
  if (tag && VALID_TAGS.includes(tag)) {
    // Filter by primary_tag or if tag is in tags array
    query = query.or(`primary_tag.eq.${tag},tags.cs.{${tag}}`);
  }

  // Apply sorting
  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "stars":
    default:
      query = query.order("github_stars", { ascending: false });
      break;
  }

  const { data: publishers, error } = await query;

  if (error) {
    console.error("[API] Skill publishers query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill publishers" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    publishers: publishers || [],
    total: publishers?.length || 0,
  });
}
