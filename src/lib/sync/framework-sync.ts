import { createAdminClient } from "@/lib/supabase/admin";

const GITHUB_API_BASE = "https://api.github.com";
const MIN_STARS = 200;

interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

export interface FrameworkSyncResult {
  success: boolean;
  discovered: number;
  added: number;
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

// Search queries to find Claude Code frameworks
const SEARCH_QUERIES = [
  "claude code framework",
  "claude code methodology",
  "CLAUDE.md framework",
];

// Generate slug from repo name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fetch README to extract install command
async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`;

  try {
    const response = await fetch(url, {
      headers: {
        ...getHeaders(),
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// Extract install command from README
function extractInstallCommand(readme: string): { command: string; tool: string } | null {
  const lines = readme.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Look for installation section
    if (line.includes("install") || line.includes("quick start") || line.includes("getting started")) {
      // Search next 20 lines for a code block
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        const codeLine = lines[j].trim();

        // npx command
        if (codeLine.startsWith("npx ")) {
          return { command: codeLine, tool: "npx" };
        }

        // curl command
        if (codeLine.startsWith("curl ")) {
          return { command: codeLine, tool: "bash" };
        }

        // git clone
        if (codeLine.startsWith("git clone")) {
          return { command: codeLine, tool: "bash" };
        }

        // bun/npm install
        if (codeLine.startsWith("bun ") || codeLine.startsWith("npm ")) {
          return { command: codeLine, tool: codeLine.startsWith("bun") ? "bun" : "npm" };
        }
      }
    }
  }

  return null;
}

// Assign a color based on index
function getFrameworkColor(index: number): string {
  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
  ];
  return colors[index % colors.length];
}

export async function searchGitHubFrameworks(): Promise<GitHubRepo[]> {
  const allRepos: Map<string, GitHubRepo> = new Map();

  for (const query of SEARCH_QUERIES) {
    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        console.log(`[FrameworkSync] Search failed for "${query}": ${response.statusText}`);
        continue;
      }

      const data = (await response.json()) as GitHubSearchResponse;

      for (const repo of data.items) {
        // Filter by minimum stars
        if (repo.stargazers_count >= MIN_STARS) {
          allRepos.set(repo.full_name, repo);
        }
      }

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.log(`[FrameworkSync] Error searching "${query}": ${err}`);
    }
  }

  return Array.from(allRepos.values()).sort((a, b) => b.stargazers_count - a.stargazers_count);
}

export async function syncFrameworks(): Promise<FrameworkSyncResult> {
  const supabase = createAdminClient();
  const result: FrameworkSyncResult = {
    success: false,
    discovered: 0,
    added: 0,
    skipped: 0,
    errors: [],
  };

  console.log("[FrameworkSync] Starting framework discovery...");
  console.log(`[FrameworkSync] Minimum stars threshold: ${MIN_STARS}`);

  // Get existing frameworks
  const { data: existing, error: fetchError } = await supabase
    .from("frameworks")
    .select("github_url, slug");

  if (fetchError) {
    result.errors.push(`Failed to fetch existing frameworks: ${fetchError.message}`);
    return result;
  }

  const existingUrls = new Set(existing?.map((f) => f.github_url?.toLowerCase()) || []);
  const existingSlugs = new Set(existing?.map((f) => f.slug) || []);

  // Search GitHub
  const repos = await searchGitHubFrameworks();
  result.discovered = repos.length;

  console.log(`[FrameworkSync] Found ${repos.length} repos with ${MIN_STARS}+ stars`);

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from("frameworks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  let sortOrder = (maxOrder?.sort_order || 0) + 1;

  for (const repo of repos) {
    const repoUrl = repo.html_url.toLowerCase();

    // Skip if already exists
    if (existingUrls.has(repoUrl)) {
      console.log(`[FrameworkSync] Skipping ${repo.full_name} (already exists)`);
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

    // Fetch README and extract install command
    const readme = await fetchReadme(repo.owner.login, repo.name);
    let installCommand = `git clone ${repo.html_url}.git`;
    let installTool = "bash";

    if (readme) {
      const extracted = extractInstallCommand(readme);
      if (extracted) {
        installCommand = extracted.command;
        installTool = extracted.tool;
      }
    }

    // Insert new framework
    const { error: insertError } = await supabase.from("frameworks").insert({
      slug,
      name: repo.name,
      description: repo.description || `Claude Code framework with ${repo.stargazers_count} stars`,
      install_command: installCommand,
      install_tool: installTool,
      github_url: repo.html_url,
      homepage: repo.homepage || repo.html_url,
      color: getFrameworkColor(sortOrder),
      is_active: true,
      sort_order: sortOrder,
    });

    if (insertError) {
      result.errors.push(`Failed to insert ${repo.full_name}: ${insertError.message}`);
      console.log(`[FrameworkSync] Error inserting ${repo.full_name}: ${insertError.message}`);
    } else {
      result.added++;
      existingSlugs.add(slug);
      existingUrls.add(repoUrl);
      sortOrder++;
      console.log(`[FrameworkSync] Added ${repo.full_name} (${repo.stargazers_count}★)`);
    }

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(`[FrameworkSync] Complete. Added: ${result.added}, Skipped: ${result.skipped}`);

  return result;
}
