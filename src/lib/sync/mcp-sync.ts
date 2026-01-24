import { createAdminClient } from "@/lib/supabase/admin";

const GITHUB_API_BASE = "https://api.github.com";
const MIN_STARS = 20; // Lower threshold for MCPs - they're newer

interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

export interface McpSyncResult {
  success: boolean;
  discovered: number;
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agent-augments",
  };

  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }

  return headers;
}

// Search queries to find MCP server repos
const MCP_SEARCH_QUERIES = [
  "MCP server model context protocol",
  "mcp-server in:name",
  "@modelcontextprotocol/server",
  "model context protocol server",
  "claude mcp server",
];

// Official MCP organizations
const OFFICIAL_ORGS = [
  "modelcontextprotocol",
  "anthropics",
];

// Generate slug from repo name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Detect MCP domain from name/description
function detectDomain(name: string, description: string | null): string | null {
  const text = `${name} ${description || ""}`.toLowerCase();

  // Data/database domain
  if (/database|postgres|mysql|redis|elasticsearch|mongo|supabase|prisma|\bsql\b/i.test(text)) {
    return "data";
  }

  // Browser automation
  if (/browser|puppeteer|playwright|selenium|\bweb\b|scrape|chrome/i.test(text)) {
    return "browser";
  }

  // Design tools
  if (/figma|sketch|design|\bui\b|component|shadcn/i.test(text)) {
    return "design";
  }

  // External integrations
  if (/api|integration|webhook|slack|discord|github|notion|linear|stripe|twilio/i.test(text)) {
    return "external";
  }

  return "other";
}

// Check if this is an official MCP
function isOfficialMcp(owner: string): boolean {
  return OFFICIAL_ORGS.includes(owner.toLowerCase());
}

// Search GitHub for MCP repos
export async function searchGitHubMcps(): Promise<GitHubRepo[]> {
  const allRepos: Map<string, GitHubRepo> = new Map();

  for (const query of MCP_SEARCH_QUERIES) {
    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        console.log(`[McpSync] Search failed for "${query}": ${response.statusText}`);
        continue;
      }

      const data = (await response.json()) as GitHubSearchResponse;

      for (const repo of data.items) {
        // Filter by minimum stars (or always include official)
        if (repo.stargazers_count >= MIN_STARS || isOfficialMcp(repo.owner.login)) {
          allRepos.set(repo.full_name, repo);
        }
      }

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.log(`[McpSync] Error searching "${query}": ${err}`);
    }
  }

  return Array.from(allRepos.values()).sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// Verify this is actually an MCP server
function isMcpServer(name: string, description: string | null): boolean {
  const text = `${name} ${description || ""}`.toLowerCase();

  // Must mention MCP or Model Context Protocol
  if (!/\bmcp\b|model\s*context\s*protocol/i.test(text)) {
    return false;
  }

  // Should mention server or be in an official org
  if (/server|tool|integration/i.test(text)) {
    return true;
  }

  return false;
}

// Main sync function
export async function syncMcps(): Promise<McpSyncResult> {
  const supabase = createAdminClient();
  const result: McpSyncResult = {
    success: false,
    discovered: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log("[McpSync] Starting MCP server discovery...");
  console.log(`[McpSync] Minimum stars threshold: ${MIN_STARS} (except official)`);

  // Get existing MCPs
  const { data: existing, error: fetchError } = await supabase
    .from("mcps")
    .select("id, github_url, slug, stars");

  if (fetchError) {
    result.errors.push(`Failed to fetch existing MCPs: ${fetchError.message}`);
    return result;
  }

  const existingByUrl = new Map(
    existing?.map((m) => [m.github_url?.toLowerCase(), m]) || []
  );
  const existingSlugs = new Set(existing?.map((m) => m.slug) || []);

  // Search GitHub
  const repos = await searchGitHubMcps();
  result.discovered = repos.length;

  console.log(`[McpSync] Found ${repos.length} repos`);

  for (const repo of repos) {
    const repoUrl = repo.html_url.toLowerCase();
    const existingMcp = existingByUrl.get(repoUrl);

    // If exists, update star count if changed
    if (existingMcp) {
      if (existingMcp.stars !== repo.stargazers_count) {
        const { error: updateError } = await supabase
          .from("mcps")
          .update({ stars: repo.stargazers_count, updated_at: new Date().toISOString() })
          .eq("id", existingMcp.id);

        if (updateError) {
          result.errors.push(`Failed to update stars for ${repo.full_name}: ${updateError.message}`);
        } else {
          result.updated++;
          console.log(`[McpSync] Updated ${repo.full_name}: ${existingMcp.stars} → ${repo.stargazers_count}★`);
        }
      } else {
        result.skipped++;
      }
      continue;
    }

    // Verify this is actually an MCP server
    const isOfficial = isOfficialMcp(repo.owner.login);
    if (!isOfficial && !isMcpServer(repo.name, repo.description)) {
      result.skipped++;
      continue;
    }

    // Generate unique slug
    let slug = generateSlug(repo.name);
    let slugSuffix = 1;
    while (existingSlugs.has(slug)) {
      slug = `${generateSlug(repo.name)}-${slugSuffix}`;
      slugSuffix++;
    }

    // Detect domain
    const domain = detectDomain(repo.name, repo.description);

    // Insert new MCP
    const { error: insertError } = await supabase.from("mcps").insert({
      slug,
      name: repo.name,
      description: repo.description || `MCP server with ${repo.stargazers_count} stars`,
      github_url: repo.html_url,
      domain,
      stars: repo.stargazers_count,
      is_official: isOfficial,
    });

    if (insertError) {
      result.errors.push(`Failed to insert ${repo.full_name}: ${insertError.message}`);
      console.log(`[McpSync] Error inserting ${repo.full_name}: ${insertError.message}`);
    } else {
      result.added++;
      existingSlugs.add(slug);
      existingByUrl.set(repoUrl, { id: "", github_url: repoUrl, slug, stars: repo.stargazers_count });
      console.log(`[McpSync] Added ${repo.full_name} (${repo.stargazers_count}★, ${domain}${isOfficial ? ", official" : ""})`);
    }

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(`[McpSync] Complete. Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

  return result;
}
