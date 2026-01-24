#!/usr/bin/env bun
/**
 * Add a framework to the database
 * Usage: bun scripts/add-framework.ts
 */

import { createAdminClient } from "../src/lib/supabase/admin";

const framework = {
  slug: "compound-engineering",
  name: "Compound Engineering",
  description:
    "A Claude Code plugin that makes each unit of engineering work easier than the last. Implements a Plan → Work → Review → Compound workflow where each cycle compounds: plans inform future plans, reviews catch more issues, patterns get documented.",
  install_command:
    "/plugin marketplace add https://github.com/EveryInc/compound-engineering-plugin",
  install_tool: "claude",
  prerequisites: ["Claude Code"],
  homepage: "https://github.com/EveryInc/compound-engineering-plugin",
  github_url: "https://github.com/EveryInc/compound-engineering-plugin",
  color: "#10b981", // emerald
  is_active: true,
  stars: 4800,
  // Agent compatibility detection flags
  subagents_count: 0,
  has_claude_md: true,
  has_agents_md: false,
  has_cursorrules: false,
  has_windsurfrules: false,
  is_claude_plugin: true, // /plugin syntax = Claude Code only
};

async function main() {
  const supabase = createAdminClient();

  // Check if it already exists
  const { data: existing } = await supabase
    .from("frameworks")
    .select("id")
    .eq("slug", framework.slug)
    .single();

  if (existing) {
    console.log(`Framework "${framework.name}" already exists, updating...`);
    const { error } = await supabase
      .from("frameworks")
      .update(framework)
      .eq("slug", framework.slug);

    if (error) {
      console.error("Error updating framework:", error);
      process.exit(1);
    }
    console.log("Updated successfully!");
  } else {
    console.log(`Adding framework "${framework.name}"...`);
    const { error } = await supabase.from("frameworks").insert(framework);

    if (error) {
      console.error("Error adding framework:", error);
      process.exit(1);
    }
    console.log("Added successfully!");
  }
}

main();
