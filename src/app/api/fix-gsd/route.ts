import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const GSD_DATA = {
  slug: "gsd",
  name: "GSD",
  description: "A light-weight and powerful meta-prompting, context engineering and spec-driven development system for Claude Code by TÂCHES.",
  install_command: "npx get-shit-done-cc",
  install_tool: "npx",
  github_url: "https://github.com/glittercowboy/get-shit-done",
  homepage: "https://github.com/glittercowboy/get-shit-done",
  stars: 2686,
  color: "#10b981",
  prerequisites: ["Node.js 18+"],
};

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Check if GSD exists
  const { data: existing, error: fetchError } = await supabase
    .from("frameworks")
    .select("*")
    .eq("slug", "gsd")
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return NextResponse.json(
      { error: `Fetch error: ${fetchError.message}` },
      { status: 500 }
    );
  }

  if (existing) {
    // Update existing record
    const { error: updateError } = await supabase
      .from("frameworks")
      .update({
        name: GSD_DATA.name,
        description: GSD_DATA.description,
        install_command: GSD_DATA.install_command,
        install_tool: GSD_DATA.install_tool,
        github_url: GSD_DATA.github_url,
        homepage: GSD_DATA.homepage,
        stars: GSD_DATA.stars,
        color: GSD_DATA.color,
        prerequisites: GSD_DATA.prerequisites,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", "gsd");

    if (updateError) {
      return NextResponse.json(
        { error: `Update error: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "updated",
      data: GSD_DATA,
    });
  } else {
    // Insert new record
    const { data: maxOrder } = await supabase
      .from("frameworks")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (maxOrder?.sort_order || 0) + 1;

    const { error: insertError } = await supabase.from("frameworks").insert({
      ...GSD_DATA,
      is_active: true,
      sort_order: sortOrder,
    });

    if (insertError) {
      return NextResponse.json(
        { error: `Insert error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "inserted",
      data: GSD_DATA,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to fix GSD framework data",
    expectedData: GSD_DATA,
  });
}
