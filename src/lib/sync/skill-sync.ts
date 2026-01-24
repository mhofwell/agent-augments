import { createAdminClient } from "@/lib/supabase/admin";

const GITHUB_API_BASE = "https://api.github.com";
const MIN_STARS = 50; // Lower threshold for skills than frameworks

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

export interface SkillSyncResult {
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

// Search queries to find SKILL.md repos
const SKILL_SEARCH_QUERIES = [
  "SKILL.md in:path",
  "claude code skill",
  "cursor skill SKILL.md",
  "windsurf skill",
  "agent skill SKILL.md",
];

// Known branded skills (company/tool names)
const BRANDED_NAMES = [
  "railway",
  "vercel",
  "supabase",
  "netlify",
  "cloudflare",
  "github",
  "gitlab",
  "bitbucket",
  "stripe",
  "twilio",
  "sendgrid",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "prisma",
  "postgres",
  "redis",
  "mongodb",
  "openai",
  "anthropic",
  "linear",
  "notion",
  "slack",
  "discord",
  "figma",
];

// Generate slug from repo name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Detect skill domain from name/description
function detectDomain(name: string, description: string | null): string | null {
  const text = `${name} ${description || ""}`.toLowerCase();

  // Infrastructure/deployment
  if (/deploy|infrastructure|docker|kubernetes|railway|vercel|aws|azure|gcp|netlify|cloudflare/i.test(text)) {
    return "infra";
  }

  // Git operations
  if (/\bgit\b|commit|branch|merge|\bpr\b|pull\s*request/i.test(text)) {
    return "git";
  }

  // Testing
  if (/\btest|jest|vitest|pytest|testing|spec\b/i.test(text)) {
    return "testing";
  }

  // Database
  if (/database|postgres|mysql|supabase|prisma|\bsql\b|redis|mongo/i.test(text)) {
    return "db";
  }

  // Design/UI
  if (/design|figma|\bui\b|\bux\b|\bcss\b|tailwind|component/i.test(text)) {
    return "design";
  }

  // Documentation
  if (/documentation|readme|\bdocs?\b|markdown/i.test(text)) {
    return "docs";
  }

  return "other";
}

// Check if this is a branded skill
function isBrandedSkill(name: string, description: string | null): boolean {
  const text = `${name} ${description || ""}`.toLowerCase();
  return BRANDED_NAMES.some((brand) => text.includes(brand));
}

// Check if repo has SKILL.md file
async function hasSkillFile(owner: string, repo: string): Promise<boolean> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.tree || !Array.isArray(data.tree)) return false;

    return data.tree.some(
      (item: { path: string; type: string }) =>
        item.type === "blob" && item.path.toLowerCase().endsWith("skill.md")
    );
  } catch {
    return false;
  }
}

// Search GitHub for skill repos
export async function searchGitHubSkills(): Promise<GitHubRepo[]> {
  const allRepos: Map<string, GitHubRepo> = new Map();

  for (const query of SKILL_SEARCH_QUERIES) {
    const url = `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const response = await fetch(url, { headers: getHeaders() });

      if (!response.ok) {
        console.log(`[SkillSync] Search failed for "${query}": ${response.statusText}`);
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
      console.log(`[SkillSync] Error searching "${query}": ${err}`);
    }
  }

  return Array.from(allRepos.values()).sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// Main sync function
export async function syncStandaloneSkills(): Promise<SkillSyncResult> {
  const supabase = createAdminClient();
  const result: SkillSyncResult = {
    success: false,
    discovered: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log("[SkillSync] Starting standalone skill discovery...");
  console.log(`[SkillSync] Minimum stars threshold: ${MIN_STARS}`);

  // Get existing skills
  const { data: existing, error: fetchError } = await supabase
    .from("standalone_skills")
    .select("id, github_url, slug, stars");

  if (fetchError) {
    result.errors.push(`Failed to fetch existing skills: ${fetchError.message}`);
    return result;
  }

  const existingByUrl = new Map(
    existing?.map((s) => [s.github_url?.toLowerCase(), s]) || []
  );
  const existingSlugs = new Set(existing?.map((s) => s.slug) || []);

  // Search GitHub
  const repos = await searchGitHubSkills();
  result.discovered = repos.length;

  console.log(`[SkillSync] Found ${repos.length} repos with ${MIN_STARS}+ stars`);

  for (const repo of repos) {
    const repoUrl = repo.html_url.toLowerCase();
    const existingSkill = existingByUrl.get(repoUrl);

    // If exists, update star count if changed
    if (existingSkill) {
      if (existingSkill.stars !== repo.stargazers_count) {
        const { error: updateError } = await supabase
          .from("standalone_skills")
          .update({ stars: repo.stargazers_count, updated_at: new Date().toISOString() })
          .eq("id", existingSkill.id);

        if (updateError) {
          result.errors.push(`Failed to update stars for ${repo.full_name}: ${updateError.message}`);
        } else {
          result.updated++;
          console.log(`[SkillSync] Updated ${repo.full_name}: ${existingSkill.stars} → ${repo.stargazers_count}★`);
        }
      } else {
        result.skipped++;
      }
      continue;
    }

    // Verify this is actually a skill repo
    const hasSkill = await hasSkillFile(repo.owner.login, repo.name);
    if (!hasSkill) {
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

    // Detect domain and branded status
    const domain = detectDomain(repo.name, repo.description);
    const isBranded = isBrandedSkill(repo.name, repo.description);

    // Insert new skill
    const { error: insertError } = await supabase.from("standalone_skills").insert({
      slug,
      name: repo.name,
      description: repo.description || `Claude Code skill with ${repo.stargazers_count} stars`,
      github_url: repo.html_url,
      domain,
      stars: repo.stargazers_count,
      is_branded: isBranded,
      install_count: 0,
    });

    if (insertError) {
      result.errors.push(`Failed to insert ${repo.full_name}: ${insertError.message}`);
      console.log(`[SkillSync] Error inserting ${repo.full_name}: ${insertError.message}`);
    } else {
      result.added++;
      existingSlugs.add(slug);
      existingByUrl.set(repoUrl, { id: "", github_url: repoUrl, slug, stars: repo.stargazers_count });
      console.log(`[SkillSync] Added ${repo.full_name} (${repo.stargazers_count}★, ${domain}${isBranded ? ", branded" : ""})`);
    }

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(`[SkillSync] Complete. Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

  return result;
}
