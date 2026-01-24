import { createAdminClient } from "@/lib/supabase/admin";

const GITHUB_API_BASE = "https://api.github.com";
const MIN_STARS = 200;

// Curated frameworks with correct data (ensures these always exist with proper URLs)
const KNOWN_FRAMEWORKS = [
  {
    slug: "gsd",
    name: "Get Shit Done",
    description: "A Claude Code framework for getting shit done efficiently",
    install_command: "npx get-shit-done-cc",
    install_tool: "npx",
    github_url: "https://github.com/glittercowboy/get-shit-done",
    color: "#10b981",
  },
];

interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  owner: {
    login: string;
  };
}

interface SkillInfo {
  name: string;
  slug: string;
  description: string | null;
  filePath: string;
}

interface McpInfo {
  name: string;
  slug: string;
  description: string | null;
}

interface SubagentInfo {
  name: string;
  slug: string;
  description: string | null;
  filePath: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

export interface FrameworkSyncResult {
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

// Generate proper display name from repo name (e.g., "claude-flow" → "Claude Flow")
function generateDisplayName(repoName: string): string {
  return repoName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bClaude\b/gi, "Claude")
    .replace(/\bMcp\b/gi, "MCP")
    .replace(/\bAi\b/gi, "AI")
    .replace(/\bApi\b/gi, "API")
    .trim();
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

// Fetch contributor count using Link header pagination trick
async function fetchContributorCount(owner: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=1&anon=0`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return 0;

    // Check Link header for last page number
    const linkHeader = response.headers.get("Link");
    if (linkHeader) {
      const lastMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
      if (lastMatch) {
        return parseInt(lastMatch[1], 10);
      }
    }

    // If no Link header, count the returned array
    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

// Extract features from README (## Features section)
function extractFeaturesFromReadme(readme: string): string[] {
  const features: string[] = [];
  const lines = readme.split("\n");

  let inFeaturesSection = false;
  for (const line of lines) {
    const trimmed = line.trim();

    // Check for Features section header
    if (/^#{1,3}\s*features?\b/i.test(trimmed)) {
      inFeaturesSection = true;
      continue;
    }

    // End of section when we hit another header
    if (inFeaturesSection && /^#{1,3}\s+\w/.test(trimmed)) {
      break;
    }

    // Extract bullet points
    if (inFeaturesSection && /^[-*]\s+/.test(trimmed)) {
      const feature = trimmed.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").trim();
      if (feature.length > 5 && feature.length < 200) {
        features.push(feature);
      }
    }
  }

  return features.slice(0, 10); // Limit to 10 features
}

// Extract use cases from README (## Best For, ## Use Cases, ## When to Use)
function extractUseCasesFromReadme(readme: string): string[] {
  const useCases: string[] = [];
  const lines = readme.split("\n");

  let inUseCasesSection = false;
  for (const line of lines) {
    const trimmed = line.trim();

    // Check for use cases section headers
    if (/^#{1,3}\s*(best\s+for|use\s*cases?|when\s+to\s+use|ideal\s+for)\b/i.test(trimmed)) {
      inUseCasesSection = true;
      continue;
    }

    // End of section when we hit another header
    if (inUseCasesSection && /^#{1,3}\s+\w/.test(trimmed)) {
      break;
    }

    // Extract bullet points
    if (inUseCasesSection && /^[-*]\s+/.test(trimmed)) {
      const useCase = trimmed.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").trim();
      if (useCase.length > 3 && useCase.length < 100) {
        useCases.push(useCase);
      }
    }
  }

  return useCases.slice(0, 8); // Limit to 8 use cases
}

// Extract skill details from SKILL.md files
async function extractSkillDetails(owner: string, repo: string): Promise<SkillInfo[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.tree || !Array.isArray(data.tree)) return [];

    // Find all SKILL.md files
    const skillFiles = data.tree.filter(
      (item: { path: string; type: string }) =>
        item.type === "blob" && item.path.toLowerCase().endsWith("skill.md")
    );

    const skills: SkillInfo[] = [];

    for (const file of skillFiles.slice(0, 20)) {
      // Limit to 20 skills
      try {
        // Fetch the skill file content
        const contentUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${file.path}`;
        const contentRes = await fetch(contentUrl, {
          headers: {
            ...getHeaders(),
            Accept: "application/vnd.github.v3.raw",
          },
        });

        if (!contentRes.ok) continue;

        const content = await contentRes.text();

        // Extract name from first # heading or filename
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch
          ? nameMatch[1].trim()
          : file.path.split("/").slice(-2, -1)[0] || "Unknown Skill";

        // Extract description from first paragraph after heading
        const descMatch = content.match(/^#.+\n+([^#\n][^\n]+)/m);
        const description = descMatch ? descMatch[1].trim().slice(0, 200) : null;

        // Generate slug from path
        const slug = file.path
          .replace(/\/SKILL\.md$/i, "")
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase();

        skills.push({
          name,
          slug,
          description,
          filePath: file.path,
        });

        // Rate limit
        await new Promise((r) => setTimeout(r, 100));
      } catch {
        continue;
      }
    }

    return skills;
  } catch {
    return [];
  }
}

// Extract MCP details from mcp.json config
async function extractMcpDetails(owner: string, repo: string): Promise<McpInfo[]> {
  const mcpPaths = [
    "mcp.json",
    ".claude/mcp.json",
    ".cursor/mcp.json",
    "mcp_config.json",
  ];

  for (const path of mcpPaths) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          ...getHeaders(),
          Accept: "application/vnd.github.v3.raw",
        },
      });

      if (!response.ok) continue;

      const content = await response.text();
      const config = JSON.parse(content);

      if (config.mcpServers && typeof config.mcpServers === "object") {
        return Object.entries(config.mcpServers).map(([name, serverConfig]) => {
          const server = serverConfig as Record<string, unknown>;
          const command = server.command as string || "";
          const args = (server.args as string[]) || [];

          // Try to extract description from args or generate from command
          let description: string | null = null;
          if (args.length > 0) {
            description = `Runs: ${command} ${args.slice(0, 2).join(" ")}`.slice(0, 150);
          }

          return {
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description,
          };
        });
      }
    } catch {
      continue;
    }
  }

  return [];
}

// Extract subagent details from .claude/agents/ directory
async function extractSubagentDetails(owner: string, repo: string): Promise<SubagentInfo[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/.claude/agents`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];

    const contents = await response.json();
    if (!Array.isArray(contents)) return [];

    const subagents: SubagentInfo[] = [];

    for (const item of contents) {
      if (item.type !== "file" || !item.name.endsWith(".md")) continue;

      try {
        // Fetch the agent file content
        const contentRes = await fetch(item.download_url, {
          headers: getHeaders(),
        });

        if (!contentRes.ok) continue;

        const content = await contentRes.text();

        // Extract name from first # heading or filename
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const name = nameMatch
          ? nameMatch[1].trim()
          : item.name.replace(".md", "");

        // Extract description from first paragraph after heading
        const descMatch = content.match(/^#.+\n+([^#\n][^\n]+)/m);
        const description = descMatch ? descMatch[1].trim().slice(0, 200) : null;

        // Generate slug from filename
        const slug = item.name
          .replace(/\.md$/i, "")
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase();

        subagents.push({
          name,
          slug,
          description,
          filePath: `.claude/agents/${item.name}`,
        });

        // Rate limit
        await new Promise((r) => setTimeout(r, 100));
      } catch {
        continue;
      }
    }

    return subagents;
  } catch {
    return [];
  }
}

// Check if a file exists in a GitHub repo
async function checkFileExists(owner: string, repo: string, path: string): Promise<boolean> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return false;
    const data = await response.json();
    return data.type === "file";
  } catch {
    return false;
  }
}

// Check if a directory exists in a GitHub repo
async function checkDirExists(owner: string, repo: string, path: string): Promise<boolean> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data); // Directories return an array
  } catch {
    return false;
  }
}

// Count subagents by checking for .claude/agents/ directory
async function countSubagents(owner: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/.claude/agents`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) return 0; // Directory doesn't exist

    const contents = await response.json();
    if (!Array.isArray(contents)) return 0;

    // Count .md files (subagent definitions)
    return contents.filter(
      (item: { name: string; type: string }) =>
        item.type === "file" && item.name.endsWith(".md")
    ).length;
  } catch {
    return 0;
  }
}

// Count SKILL.md files using recursive tree API
async function countSkillFiles(owner: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) return 0;

    const data = await response.json();
    if (!data.tree || !Array.isArray(data.tree)) return 0;

    // Count files ending with SKILL.md (case-insensitive)
    return data.tree.filter(
      (item: { path: string; type: string }) =>
        item.type === "blob" && item.path.toLowerCase().endsWith("skill.md")
    ).length;
  } catch {
    return 0;
  }
}

// Detect MCP configuration files and count servers
async function detectMcpConfig(owner: string, repo: string): Promise<{ hasMcp: boolean; count: number }> {
  // MCP config locations to check
  const mcpPaths = [
    "mcp.json",
    ".claude/mcp.json",
    ".cursor/mcp.json",
    "mcp_config.json",
  ];

  for (const path of mcpPaths) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          ...getHeaders(),
          Accept: "application/vnd.github.v3.raw",
        },
      });

      if (!response.ok) continue;

      const content = await response.text();
      try {
        const config = JSON.parse(content);
        // Count mcpServers entries
        if (config.mcpServers && typeof config.mcpServers === "object") {
          return { hasMcp: true, count: Object.keys(config.mcpServers).length };
        }
      } catch {
        // JSON parse failed, file exists but invalid
        return { hasMcp: true, count: 0 };
      }
    } catch {
      continue;
    }
  }

  return { hasMcp: false, count: 0 };
}

// Extract methodology from README content
function extractMethodology(readme: string): string | null {
  const lower = readme.toLowerCase();

  // Priority order - agentic-mesh is most specific
  if (/agentic.?mesh|multi.?agent|orchestrat|delegat|subagent/i.test(readme)) {
    return "agentic-mesh";
  }
  if (/spec.?driven|spec.?first|plan.?first|design\s+doc|specification/i.test(readme)) {
    return "spec-driven";
  }
  if (/\btdd\b|test.?driven|test.?first|\bbdd\b/i.test(readme)) {
    return "test-first";
  }
  if (/\biterative\b|\bincremental\b|\bagile\b|fast\s+iteration/i.test(lower)) {
    return "iterative";
  }

  return null;
}

// Estimate autonomy level from README content and subagent count
function estimateAutonomyLevel(readme: string, subagentsCount: number): string | null {
  const lower = readme.toLowerCase();

  // HIGH: Highly autonomous patterns
  if (subagentsCount > 2 || /auto.?approv|autonomous|hands.?off|fully\s+automat/i.test(readme)) {
    return "HIGH";
  }

  // LOW: Manual/interactive patterns
  if (/\bmanual\b|interactive|step.?by.?step|\bconfirm|approval\s+required/i.test(lower)) {
    return "LOW";
  }

  // MED: Has structure/methodology but not fully autonomous
  if (subagentsCount > 0 || /workflow|process|methodology|framework/i.test(lower)) {
    return "MED";
  }

  return null;
}

// Agent config detection flags
interface AgentConfigFlags {
  hasClaudeMd: boolean;
  hasAgentsMd: boolean;
  hasCursorrules: boolean;
  hasWindsurfrules: boolean;
  hasSubagents: boolean;
  subagentsCount: number;
  skillsCount: number;
  mcpsCount: number;
}

// Detect all agent config files in parallel
async function detectAgentConfigs(owner: string, repo: string): Promise<AgentConfigFlags> {
  const [
    claudeMd,
    claudeDir,
    agentsMd,
    cursorrules,
    cursorRulesDir,
    windsurfrules,
    windsurfRulesDir,
    subagentsCount,
    skillsCount,
    mcpConfig,
  ] = await Promise.all([
    checkFileExists(owner, repo, "CLAUDE.md"),
    checkDirExists(owner, repo, ".claude"),
    checkFileExists(owner, repo, "AGENTS.md"),
    checkFileExists(owner, repo, ".cursorrules"),
    checkDirExists(owner, repo, ".cursor/rules"),
    checkFileExists(owner, repo, ".windsurfrules"),
    checkDirExists(owner, repo, ".windsurf/rules"),
    countSubagents(owner, repo),
    countSkillFiles(owner, repo),
    detectMcpConfig(owner, repo),
  ]);

  return {
    hasClaudeMd: claudeMd || claudeDir,
    hasAgentsMd: agentsMd,
    hasCursorrules: cursorrules || cursorRulesDir,
    hasWindsurfrules: windsurfrules || windsurfRulesDir,
    hasSubagents: subagentsCount > 0,
    subagentsCount,
    skillsCount,
    mcpsCount: mcpConfig.count,
  };
}

// Check if install command is Claude plugin syntax (Claude Code only)
function isClaudePluginInstall(command: string): boolean {
  return command.startsWith("/plugin");
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
    updated: 0,
    skipped: 0,
    errors: [],
  };

  console.log("[FrameworkSync] Starting framework discovery...");
  console.log(`[FrameworkSync] Minimum stars threshold: ${MIN_STARS}`);

  // Get existing frameworks (including enrichment columns)
  const { data: existing, error: fetchError } = await supabase
    .from("frameworks")
    .select("id, github_url, slug, stars, skills_count, mcps_count, methodology, autonomy_level, subagents_count, features, use_cases, contributors_count, last_commit_at, open_issues_count");

  if (fetchError) {
    result.errors.push(`Failed to fetch existing frameworks: ${fetchError.message}`);
    return result;
  }

  const existingByUrl = new Map(
    existing?.map((f) => [f.github_url?.toLowerCase(), f]) || []
  );
  const existingBySlug = new Map(
    existing?.map((f) => [f.slug, f]) || []
  );
  const existingSlugs = new Set(existing?.map((f) => f.slug) || []);

  // Sync known/curated frameworks first (ensures correct URLs)
  console.log("[FrameworkSync] Syncing known frameworks...");
  for (const known of KNOWN_FRAMEWORKS) {
    const existingFramework = existingBySlug.get(known.slug);

    if (existingFramework) {
      // Update if URL is different
      if (existingFramework.github_url?.toLowerCase() !== known.github_url.toLowerCase()) {
        const { error: updateError } = await supabase
          .from("frameworks")
          .update({
            github_url: known.github_url,
            homepage: known.github_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingFramework.id);

        if (updateError) {
          result.errors.push(`Failed to update ${known.slug}: ${updateError.message}`);
        } else {
          result.updated++;
          console.log(`[FrameworkSync] Updated ${known.slug} URL → ${known.github_url}`);
        }
      }
    } else {
      // Insert new known framework
      const { error: insertError } = await supabase.from("frameworks").insert({
        slug: known.slug,
        name: known.name,
        description: known.description,
        install_command: known.install_command,
        install_tool: known.install_tool,
        github_url: known.github_url,
        homepage: known.github_url,
        color: known.color,
        is_active: true,
        sort_order: 0,
      });

      if (insertError) {
        result.errors.push(`Failed to insert ${known.slug}: ${insertError.message}`);
      } else {
        result.added++;
        existingSlugs.add(known.slug);
        console.log(`[FrameworkSync] Added known framework: ${known.name}`);
      }
    }
  }

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
    const existingFramework = existingByUrl.get(repoUrl);

    // If exists, update star count and enrichment columns if needed
    if (existingFramework) {
      // Check if we need to update taxonomy or enrichment columns
      const needsTaxonomyUpdate =
        existingFramework.skills_count === null ||
        existingFramework.mcps_count === null ||
        existingFramework.methodology === null ||
        existingFramework.autonomy_level === null;

      const needsEnrichmentUpdate =
        existingFramework.features === null ||
        existingFramework.use_cases === null ||
        existingFramework.contributors_count === null ||
        existingFramework.last_commit_at === null;

      const needsUpdate = existingFramework.stars !== repo.stargazers_count || needsTaxonomyUpdate || needsEnrichmentUpdate;

      if (needsUpdate) {
        // Build update object with star count and repo stats
        const updateData: Record<string, unknown> = {
          stars: repo.stargazers_count,
          open_issues_count: repo.open_issues_count,
          last_commit_at: repo.pushed_at,
          updated_at: new Date().toISOString(),
        };

        // If taxonomy or enrichment columns need updating, fetch fresh data
        if (needsTaxonomyUpdate || needsEnrichmentUpdate) {
          const [agentConfigs, readme, contributorsCount] = await Promise.all([
            detectAgentConfigs(repo.owner.login, repo.name),
            fetchReadme(repo.owner.login, repo.name),
            needsEnrichmentUpdate ? fetchContributorCount(repo.owner.login, repo.name) : Promise.resolve(0),
          ]);

          // Taxonomy columns
          if (existingFramework.skills_count === null) {
            updateData.skills_count = agentConfigs.skillsCount;
          }
          if (existingFramework.mcps_count === null) {
            updateData.mcps_count = agentConfigs.mcpsCount;
          }
          if (existingFramework.methodology === null && readme) {
            updateData.methodology = extractMethodology(readme);
          }
          if (existingFramework.autonomy_level === null && readme) {
            updateData.autonomy_level = estimateAutonomyLevel(readme, agentConfigs.subagentsCount);
          }

          // Enrichment columns
          if (existingFramework.features === null && readme) {
            const features = extractFeaturesFromReadme(readme);
            updateData.features = features.length > 0 ? features : null;
          }
          if (existingFramework.use_cases === null && readme) {
            const useCases = extractUseCasesFromReadme(readme);
            updateData.use_cases = useCases.length > 0 ? useCases : null;
          }
          if (existingFramework.contributors_count === null && contributorsCount > 0) {
            updateData.contributors_count = contributorsCount;
          }

          // Extract and insert component details if framework has skills/mcps/subagents
          if (agentConfigs.skillsCount > 0 || agentConfigs.mcpsCount > 0 || agentConfigs.subagentsCount > 0) {
            const [skillDetails, mcpDetails, subagentDetails] = await Promise.all([
              agentConfigs.skillsCount > 0 ? extractSkillDetails(repo.owner.login, repo.name) : Promise.resolve([]),
              agentConfigs.mcpsCount > 0 ? extractMcpDetails(repo.owner.login, repo.name) : Promise.resolve([]),
              agentConfigs.subagentsCount > 0 ? extractSubagentDetails(repo.owner.login, repo.name) : Promise.resolve([]),
            ]);

            // Insert skills (upsert to avoid duplicates)
            if (skillDetails.length > 0) {
              const { error: skillsError } = await supabase.from("framework_skills").upsert(
                skillDetails.map((s) => ({
                  framework_id: existingFramework.id,
                  name: s.name,
                  slug: s.slug,
                  description: s.description,
                  file_path: s.filePath,
                })),
                { onConflict: "framework_id,slug" }
              );
              if (skillsError) {
                console.log(`[FrameworkSync] Error upserting skills for ${repo.full_name}: ${skillsError.message}`);
              }
            }

            // Insert MCPs (upsert to avoid duplicates)
            if (mcpDetails.length > 0) {
              const { error: mcpsError } = await supabase.from("framework_mcps").upsert(
                mcpDetails.map((m) => ({
                  framework_id: existingFramework.id,
                  name: m.name,
                  slug: m.slug,
                  description: m.description,
                })),
                { onConflict: "framework_id,slug" }
              );
              if (mcpsError) {
                console.log(`[FrameworkSync] Error upserting MCPs for ${repo.full_name}: ${mcpsError.message}`);
              }
            }

            // Insert subagents (upsert to avoid duplicates)
            if (subagentDetails.length > 0) {
              const { error: subagentsError } = await supabase.from("framework_subagents").upsert(
                subagentDetails.map((s) => ({
                  framework_id: existingFramework.id,
                  name: s.name,
                  slug: s.slug,
                  description: s.description,
                  file_path: s.filePath,
                })),
                { onConflict: "framework_id,slug" }
              );
              if (subagentsError) {
                console.log(`[FrameworkSync] Error upserting subagents for ${repo.full_name}: ${subagentsError.message}`);
              }
            }
          }
        }

        const { error: updateError } = await supabase
          .from("frameworks")
          .update(updateData)
          .eq("id", existingFramework.id);

        if (updateError) {
          result.errors.push(`Failed to update ${repo.full_name}: ${updateError.message}`);
        } else {
          result.updated++;
          const updateInfo = [
            needsTaxonomyUpdate && "taxonomy",
            needsEnrichmentUpdate && "enrichment",
          ].filter(Boolean).join(", ");
          console.log(`[FrameworkSync] Updated ${repo.full_name}: ${existingFramework.stars} → ${repo.stargazers_count}★${updateInfo ? ` (+ ${updateInfo})` : ""}`);
        }
      } else {
        result.skipped++;
      }
      continue;
    }

    // Generate unique slug
    let slug = generateSlug(repo.name);
    let slugSuffix = 1;
    while (existingSlugs.has(slug)) {
      slug = `${generateSlug(repo.name)}-${slugSuffix}`;
      slugSuffix++;
    }

    // Fetch README, contributor count, and agent configs in parallel
    const [readme, contributorsCount, agentConfigs] = await Promise.all([
      fetchReadme(repo.owner.login, repo.name),
      fetchContributorCount(repo.owner.login, repo.name),
      detectAgentConfigs(repo.owner.login, repo.name),
    ]);

    // Extract install command from README
    let installCommand = `git clone ${repo.html_url}.git`;
    let installTool = "bash";

    if (readme) {
      const extracted = extractInstallCommand(readme);
      if (extracted) {
        installCommand = extracted.command;
        installTool = extracted.tool;
      }
    }

    const isPlugin = isClaudePluginInstall(installCommand);

    // Extract methodology, autonomy level, features, and use cases from README
    const methodology = readme ? extractMethodology(readme) : null;
    const autonomyLevel = readme
      ? estimateAutonomyLevel(readme, agentConfigs.subagentsCount)
      : null;
    const features = readme ? extractFeaturesFromReadme(readme) : [];
    const useCases = readme ? extractUseCasesFromReadme(readme) : [];

    // Insert new framework with enrichment data
    const { data: insertedFramework, error: insertError } = await supabase
      .from("frameworks")
      .insert({
        slug,
        name: generateDisplayName(repo.name),
        description: repo.description || `Claude Code framework with ${repo.stargazers_count} stars`,
        install_command: installCommand,
        install_tool: installTool,
        github_url: repo.html_url,
        homepage: repo.homepage || repo.html_url,
        color: getFrameworkColor(sortOrder),
        stars: repo.stargazers_count,
        subagents_count: agentConfigs.subagentsCount,
        skills_count: agentConfigs.skillsCount,
        mcps_count: agentConfigs.mcpsCount,
        methodology,
        autonomy_level: autonomyLevel,
        has_claude_md: agentConfigs.hasClaudeMd,
        has_agents_md: agentConfigs.hasAgentsMd,
        has_cursorrules: agentConfigs.hasCursorrules,
        has_windsurfrules: agentConfigs.hasWindsurfrules,
        is_claude_plugin: isPlugin,
        is_active: true,
        sort_order: sortOrder,
        // New enrichment columns
        features: features.length > 0 ? features : null,
        use_cases: useCases.length > 0 ? useCases : null,
        last_commit_at: repo.pushed_at,
        contributors_count: contributorsCount > 0 ? contributorsCount : null,
        open_issues_count: repo.open_issues_count,
      })
      .select("id")
      .single();

    if (insertError) {
      result.errors.push(`Failed to insert ${repo.full_name}: ${insertError.message}`);
      console.log(`[FrameworkSync] Error inserting ${repo.full_name}: ${insertError.message}`);
    } else {
      result.added++;
      existingSlugs.add(slug);
      existingByUrl.set(repoUrl, {
        id: insertedFramework?.id || "",
        github_url: repoUrl,
        slug,
        stars: repo.stargazers_count,
        skills_count: agentConfigs.skillsCount,
        mcps_count: agentConfigs.mcpsCount,
        methodology,
        autonomy_level: autonomyLevel,
        subagents_count: agentConfigs.subagentsCount,
        features: features.length > 0 ? features : null,
        use_cases: useCases.length > 0 ? useCases : null,
        contributors_count: contributorsCount > 0 ? contributorsCount : null,
        last_commit_at: repo.pushed_at,
        open_issues_count: repo.open_issues_count,
      });
      sortOrder++;

      // Extract and insert component details if framework has skills/mcps/subagents
      if (insertedFramework?.id) {
        const frameworkId = insertedFramework.id;

        // Extract component details in parallel
        const [skillDetails, mcpDetails, subagentDetails] = await Promise.all([
          agentConfigs.skillsCount > 0 ? extractSkillDetails(repo.owner.login, repo.name) : Promise.resolve([]),
          agentConfigs.mcpsCount > 0 ? extractMcpDetails(repo.owner.login, repo.name) : Promise.resolve([]),
          agentConfigs.subagentsCount > 0 ? extractSubagentDetails(repo.owner.login, repo.name) : Promise.resolve([]),
        ]);

        // Insert skills
        if (skillDetails.length > 0) {
          const { error: skillsError } = await supabase.from("framework_skills").insert(
            skillDetails.map((s) => ({
              framework_id: frameworkId,
              name: s.name,
              slug: s.slug,
              description: s.description,
              file_path: s.filePath,
            }))
          );
          if (skillsError) {
            console.log(`[FrameworkSync] Error inserting skills for ${repo.full_name}: ${skillsError.message}`);
          }
        }

        // Insert MCPs
        if (mcpDetails.length > 0) {
          const { error: mcpsError } = await supabase.from("framework_mcps").insert(
            mcpDetails.map((m) => ({
              framework_id: frameworkId,
              name: m.name,
              slug: m.slug,
              description: m.description,
            }))
          );
          if (mcpsError) {
            console.log(`[FrameworkSync] Error inserting MCPs for ${repo.full_name}: ${mcpsError.message}`);
          }
        }

        // Insert subagents
        if (subagentDetails.length > 0) {
          const { error: subagentsError } = await supabase.from("framework_subagents").insert(
            subagentDetails.map((s) => ({
              framework_id: frameworkId,
              name: s.name,
              slug: s.slug,
              description: s.description,
              file_path: s.filePath,
            }))
          );
          if (subagentsError) {
            console.log(`[FrameworkSync] Error inserting subagents for ${repo.full_name}: ${subagentsError.message}`);
          }
        }
      }

      const configInfo = [
        agentConfigs.hasClaudeMd && "CLAUDE.md",
        agentConfigs.hasAgentsMd && "AGENTS.md",
        agentConfigs.hasCursorrules && ".cursorrules",
        agentConfigs.hasWindsurfrules && ".windsurfrules",
        agentConfigs.subagentsCount > 0 && `${agentConfigs.subagentsCount} subagents`,
        agentConfigs.skillsCount > 0 && `${agentConfigs.skillsCount} skills`,
        agentConfigs.mcpsCount > 0 && `${agentConfigs.mcpsCount} MCPs`,
        features.length > 0 && `${features.length} features`,
        useCases.length > 0 && `${useCases.length} use cases`,
        contributorsCount > 0 && `${contributorsCount} contributors`,
        methodology && methodology,
        autonomyLevel && `${autonomyLevel} autonomy`,
      ].filter(Boolean).join(", ");
      console.log(`[FrameworkSync] Added ${repo.full_name} (${repo.stargazers_count}★${configInfo ? `, ${configInfo}` : ""})`);
    }

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(`[FrameworkSync] Complete. Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

  return result;
}
