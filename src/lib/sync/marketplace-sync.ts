import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMarketplaceJson, RawPlugin } from "@/lib/github/api";
import type { PluginType, Tables } from "@/types/database";

type Marketplace = Tables<"marketplaces">;

export interface SyncResult {
  marketplace: string;
  success: boolean;
  pluginsAdded: number;
  pluginsUpdated: number;
  error?: string;
}

export interface SyncSummary {
  totalMarketplaces: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalPlugins: number;
  results: SyncResult[];
  duration: number;
}

// Detect plugin type from plugin data
export function detectPluginType(plugin: RawPlugin): PluginType {
  // Check explicit component arrays
  if (plugin.skills && Array.isArray(plugin.skills) && plugin.skills.length > 0) {
    return "skill";
  }
  if (plugin.agents && Array.isArray(plugin.agents) && plugin.agents.length > 0) {
    return "agent";
  }
  if (plugin.commands && Array.isArray(plugin.commands) && plugin.commands.length > 0) {
    return "command";
  }
  if (plugin.hooks && Array.isArray(plugin.hooks) && plugin.hooks.length > 0) {
    return "hook";
  }

  // Check description for keywords
  const desc = (plugin.description || "").toLowerCase();
  const name = (plugin.name || "").toLowerCase();
  const combined = `${name} ${desc}`;

  if (combined.includes("skill")) return "skill";
  if (combined.includes("agent")) return "agent";
  if (combined.includes("command") || combined.includes("slash")) return "command";
  if (combined.includes("hook")) return "hook";
  if (
    combined.includes("bundle") ||
    combined.includes("kit") ||
    combined.includes("toolkit") ||
    combined.includes("suite")
  ) {
    return "bundle";
  }

  // Check category
  const category = (plugin.category || "").toLowerCase();
  if (category === "skill" || category === "skills") return "skill";
  if (category === "agent" || category === "agents") return "agent";
  if (category === "command" || category === "commands") return "command";

  return "unknown";
}

// Sync a single marketplace
export async function syncMarketplace(marketplace: Marketplace): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = {
    marketplace: `${marketplace.github_owner}/${marketplace.github_repo}`,
    success: false,
    pluginsAdded: 0,
    pluginsUpdated: 0,
  };

  console.log(`[Sync] Starting sync for ${result.marketplace}`);

  // Fetch marketplace.json from GitHub
  const { data, error: fetchError } = await fetchMarketplaceJson(
    marketplace.github_owner,
    marketplace.github_repo
  );

  if (fetchError) {
    result.error = fetchError.message;

    // Update marketplace with error
    await supabase
      .from("marketplaces")
      .update({
        sync_error: fetchError.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", marketplace.id);

    // If 404, mark as inactive
    if (fetchError.isNotFound) {
      await supabase
        .from("marketplaces")
        .update({ is_active: false })
        .eq("id", marketplace.id);
    }

    console.log(`[Sync] Error for ${result.marketplace}: ${fetchError.message}`);
    return result;
  }

  if (!data || !data.plugins || !Array.isArray(data.plugins)) {
    result.error = "No plugins array found in marketplace.json";
    await supabase
      .from("marketplaces")
      .update({
        sync_error: result.error,
        updated_at: new Date().toISOString(),
      })
      .eq("id", marketplace.id);

    console.log(`[Sync] No plugins for ${result.marketplace}`);
    return result;
  }

  // Update marketplace metadata
  await supabase
    .from("marketplaces")
    .update({
      name: data.name || marketplace.name,
      description: data.metadata?.description || null,
      owner_name: data.owner?.name || null,
      owner_email: data.owner?.email || null,
      owner_url: data.owner?.url || null,
      last_synced_at: new Date().toISOString(),
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", marketplace.id);

  // Prepare plugins for upsert
  const plugins = data.plugins.map((p) => ({
    marketplace_id: marketplace.id,
    name: p.name,
    description: p.description || null,
    version: p.version || null,
    source: typeof p.source === "string" ? p.source : p.source?.url || null,
    category: p.category || null,
    author_name: p.author?.name || null,
    author_email: p.author?.email || null,
    author_url: p.author?.url || null,
    plugin_type: detectPluginType(p),
    tags: p.tags || [],
    homepage: p.homepage || null,
    has_skills: !!(p.skills && Array.isArray(p.skills) && p.skills.length > 0),
    has_agents: !!(p.agents && Array.isArray(p.agents) && p.agents.length > 0),
    has_commands: !!(p.commands && Array.isArray(p.commands) && p.commands.length > 0),
    has_hooks: !!(p.hooks && Array.isArray(p.hooks) && p.hooks.length > 0),
    has_mcp_servers: !!p.mcpServers,
    updated_at: new Date().toISOString(),
  }));

  // Upsert plugins
  const { error: upsertError } = await supabase.from("plugins").upsert(plugins, {
    onConflict: "marketplace_id,name",
    ignoreDuplicates: false,
  });

  if (upsertError) {
    result.error = `Failed to upsert plugins: ${upsertError.message}`;
    console.log(`[Sync] Upsert error for ${result.marketplace}: ${upsertError.message}`);
    return result;
  }

  // Update plugin count
  await supabase
    .from("marketplaces")
    .update({ plugin_count: plugins.length })
    .eq("id", marketplace.id);

  result.success = true;
  result.pluginsAdded = plugins.length; // Simplified - could track actual adds vs updates
  console.log(`[Sync] Success for ${result.marketplace}: ${plugins.length} plugins`);

  return result;
}

// Sync all active marketplaces
export async function syncAllMarketplaces(): Promise<SyncSummary> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  console.log("[Sync] Starting full sync...");

  // Get all active marketplaces
  const { data: marketplaces, error } = await supabase
    .from("marketplaces")
    .select("*")
    .eq("is_active", true);

  if (error || !marketplaces) {
    console.log(`[Sync] Failed to fetch marketplaces: ${error?.message}`);
    return {
      totalMarketplaces: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalPlugins: 0,
      results: [],
      duration: Date.now() - startTime,
    };
  }

  console.log(`[Sync] Found ${marketplaces.length} active marketplaces`);

  // Sync each marketplace
  const results: SyncResult[] = [];
  for (const marketplace of marketplaces) {
    const result = await syncMarketplace(marketplace);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Calculate totals
  const { count: totalPlugins } = await supabase
    .from("plugins")
    .select("*", { count: "exact", head: true });

  const summary: SyncSummary = {
    totalMarketplaces: marketplaces.length,
    successfulSyncs: results.filter((r) => r.success).length,
    failedSyncs: results.filter((r) => !r.success).length,
    totalPlugins: totalPlugins ?? 0,
    results,
    duration: Date.now() - startTime,
  };

  console.log(
    `[Sync] Complete. ${summary.successfulSyncs}/${summary.totalMarketplaces} successful, ${summary.totalPlugins} total plugins, ${summary.duration}ms`
  );

  return summary;
}
