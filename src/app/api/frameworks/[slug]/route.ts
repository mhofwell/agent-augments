import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("frameworks")
      .select(`
        *,
        skills:framework_skills(id, name, slug, description, file_path),
        mcps:framework_mcps(id, name, slug, description),
        subagents:framework_subagents(id, name, slug, description, file_path)
      `)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Framework not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching framework:", error);
    return NextResponse.json(
      { error: "Failed to fetch framework" },
      { status: 500 }
    );
  }
}
