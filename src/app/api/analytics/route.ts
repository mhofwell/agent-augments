import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/analytics - Track install event
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { plugin_id, command_type } = body;

  if (!plugin_id || !command_type) {
    return NextResponse.json(
      { error: "plugin_id and command_type are required" },
      { status: 400 }
    );
  }

  // Validate command_type
  const validTypes = ["install", "marketplace_add"];
  if (!validTypes.includes(command_type)) {
    return NextResponse.json(
      { error: `command_type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Get user if authenticated (optional)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert install event using admin client (bypasses RLS)
  const { error } = await adminClient.from("install_events").insert({
    plugin_id,
    command_type,
    user_id: user?.id || null,
  });

  if (error) {
    console.error("[API] Analytics insert error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }

  // Note: install_count increment could be added via database trigger

  return NextResponse.json({ success: true }, { status: 201 });
}
