import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/component-libraries/track-install - Track install click for component library
export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { library_id, type } = body;

  if (!type || !["mcp", "skill"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'mcp' or 'skill'" },
      { status: 400 }
    );
  }

  if (!library_id) {
    return NextResponse.json(
      { error: "library_id is required" },
      { status: 400 }
    );
  }

  try {
    // Get current count and increment (table is still ui_frameworks in database)
    const { data: current } = await adminClient
      .from("ui_frameworks")
      .select("install_clicks")
      .eq("id", library_id)
      .single();

    await adminClient
      .from("ui_frameworks")
      .update({ install_clicks: (current?.install_clicks || 0) + 1 })
      .eq("id", library_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[API] Track component install error:", error);
    return NextResponse.json(
      { error: "Failed to track install" },
      { status: 500 }
    );
  }
}
