import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/framework-bookmarks - Get user's framework bookmarks
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bookmarks, error } = await supabase
    .from("framework_bookmarks")
    .select(
      `
      id,
      created_at,
      framework:frameworks(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Framework bookmarks query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch framework bookmarks" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    bookmarks: bookmarks || [],
  });
}

// POST /api/framework-bookmarks - Add a framework bookmark
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { framework_id } = body;

  if (!framework_id) {
    return NextResponse.json(
      { error: "framework_id is required" },
      { status: 400 }
    );
  }

  // Check if framework exists
  const { data: framework } = await supabase
    .from("frameworks")
    .select("id")
    .eq("id", framework_id)
    .single();

  if (!framework) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }

  const { data: bookmark, error } = await supabase
    .from("framework_bookmarks")
    .insert({
      user_id: user.id,
      framework_id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already bookmarked" },
        { status: 409 }
      );
    }
    console.error("[API] Framework bookmark insert error:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookmark }, { status: 201 });
}

// DELETE /api/framework-bookmarks - Remove a framework bookmark
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { framework_id } = body;

  if (!framework_id) {
    return NextResponse.json(
      { error: "framework_id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("framework_bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("framework_id", framework_id);

  if (error) {
    console.error("[API] Framework bookmark delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
