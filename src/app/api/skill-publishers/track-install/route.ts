import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/skill-publishers/track-install - Track install click for publisher or skill
export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { publisher_id, skill_id, type } = body;

  if (!type || !["publisher", "skill"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'publisher' or 'skill'" },
      { status: 400 }
    );
  }

  if (type === "publisher" && !publisher_id) {
    return NextResponse.json(
      { error: "publisher_id is required for publisher type" },
      { status: 400 }
    );
  }

  if (type === "skill" && !skill_id) {
    return NextResponse.json(
      { error: "skill_id is required for skill type" },
      { status: 400 }
    );
  }

  try {
    if (type === "publisher") {
      // Get current count and increment
      const { data: current } = await adminClient
        .from("skill_publishers")
        .select("install_clicks")
        .eq("id", publisher_id)
        .single();

      await adminClient
        .from("skill_publishers")
        .update({ install_clicks: (current?.install_clicks || 0) + 1 })
        .eq("id", publisher_id);
    } else {
      // Get current count and increment for skill
      const { data: current } = await adminClient
        .from("publisher_skills")
        .select("install_clicks")
        .eq("id", skill_id)
        .single();

      await adminClient
        .from("publisher_skills")
        .update({ install_clicks: (current?.install_clicks || 0) + 1 })
        .eq("id", skill_id);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] Track install error:", error);
    return NextResponse.json(
      { error: "Failed to track install" },
      { status: 500 }
    );
  }
}
