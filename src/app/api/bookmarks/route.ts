import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/bookmarks - Get user's bookmarks
export async function GET() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get bookmarks with plugin details
  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select(
      `
      id,
      created_at,
      plugin:plugins(
        *,
        marketplace:marketplaces(
          id,
          name,
          github_owner,
          github_repo
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Bookmarks query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    bookmarks: bookmarks || [],
  });
}

// POST /api/bookmarks - Add a bookmark
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { plugin_id } = body;

  if (!plugin_id) {
    return NextResponse.json(
      { error: "plugin_id is required" },
      { status: 400 }
    );
  }

  // Check if plugin exists
  const { data: plugin } = await supabase
    .from("plugins")
    .select("id")
    .eq("id", plugin_id)
    .single();

  if (!plugin) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  // Create bookmark
  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      plugin_id,
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already bookmarked" },
        { status: 409 }
      );
    }
    console.error("[API] Bookmark insert error:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookmark }, { status: 201 });
}

// DELETE /api/bookmarks - Remove a bookmark
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { plugin_id } = body;

  if (!plugin_id) {
    return NextResponse.json(
      { error: "plugin_id is required" },
      { status: 400 }
    );
  }

  // Delete bookmark
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("plugin_id", plugin_id);

  if (error) {
    console.error("[API] Bookmark delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
