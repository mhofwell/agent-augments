import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCompletenessScore } from "@/lib/framework-completeness";
import Anthropic from "@anthropic-ai/sdk";
import type { Framework } from "@/types/database";

const GITHUB_API_BASE = "https://api.github.com";
const MIN_STARS = 200;
const COMPLETENESS_THRESHOLD = 70; // Re-enrich frameworks below this score
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const PROSE_ENRICHMENT_RATE_LIMIT_MS = 1000; // Rate limit for LLM calls

// Curated frameworks with correct data (ensures these always exist with proper URLs)
const KNOWN_FRAMEWORKS = [
  {
    slug: "gsd",
    name: "Get Shit Done",
    description: "A light-weight spec-driven development system that solves context rot in Claude Code",
    install_command: "npx get-shit-done-cc",
    install_tool: "npx",
    github_url: "https://github.com/glittercowboy/get-shit-done",
    color: "#10b981",
  },
  {
    slug: "bmad",
    name: "BMAD",
    description: "AI-driven agile development framework with 21 specialized agents and 50+ guided workflows",
    install_command: "npx bmad-method install",
    install_tool: "npx",
    github_url: "https://github.com/bmadcode/bmad-method",
    color: "#8b5cf6",
  },
  {
    slug: "claude-flow",
    name: "Claude Flow",
    description: "Multi-agent orchestration framework with 60+ specialized agents",
    install_command: "npx claude-flow@v3alpha init",
    install_tool: "npx",
    github_url: "https://github.com/ruvnet/claude-flow",
    color: "#06b6d4",
  },
  {
    slug: "compound-engineering",
    name: "Compound Engineering",
    description: "Plugin-based methodology for compound engineering workflows at scale",
    install_command: "/plugin marketplace add https://github.com/EveryInc/compound-engineering-plugin",
    install_tool: "plugin",
    github_url: "https://github.com/EveryInc/compound-engineering-plugin",
    color: "#f59e0b",
  },
  {
    slug: "moai",
    name: "MOAI",
    description: "Modular AI development kit with LSP integration and diagnostic tracking",
    install_command: "curl -LsSf https://modu-ai.github.io/moai-adk/install.sh | sh",
    install_tool: "bash",
    github_url: "https://github.com/modu-ai/moai-adk",
    color: "#ec4899",
  },
  {
    slug: "superclaude-framework",
    name: "SuperClaude",
    description: "Enhanced Claude Code experience with advanced prompting and capabilities",
    install_command: "npx superclaude install",
    install_tool: "npx",
    github_url: "https://github.com/SuperClaude-Org/SuperClaude_Framework",
    color: "#eab308",
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

// Prose enrichment types
interface ProseEnrichmentResult {
  description: string;
  how_it_works: string;
}

interface ProseEnrichmentError {
  error: string;
  timestamp: Date;
}

type ProseEnrichmentOutcome =
  | { success: true; data: ProseEnrichmentResult }
  | { success: false; error: ProseEnrichmentError };

// Workflow extraction types
export interface WorkflowStep {
  id: string;
  command: string;
  humanDecision: string;
  aiAction: string;
  artifact?: string;
}

export interface FrameworkWorkflow {
  philosophy: string;
  steps: WorkflowStep[];
}

interface WorkflowExtractionResult {
  workflow: FrameworkWorkflow;
  confidence: "high" | "medium" | "low";
}

type WorkflowEnrichmentOutcome =
  | { success: true; data: WorkflowExtractionResult }
  | { success: false; error: ProseEnrichmentError };

const PROSE_ENRICHMENT_PROMPT = `You are analyzing a GitHub repository for an AI coding framework/methodology.

Based on the README content below, provide:
1. A concise description (1-2 sentences, max 200 chars) summarizing what this framework does
2. A "how it works" explanation (2-4 sentences, max 500 chars) describing the workflow/process

README:
---
{README_CONTENT}
---

Respond in JSON format:
{
  "description": "...",
  "how_it_works": "..."
}

Rules:
- Be factual, not promotional
- Focus on what makes this framework unique
- For "how_it_works", describe the actual steps/flow a developer follows
- If the README lacks sufficient detail, provide a reasonable summary based on available info
- Never say "This framework..." - start with action verbs or the framework's core concept`;

const WORKFLOW_EXTRACTION_PROMPT = `You are analyzing a GitHub repository for an AI coding framework/methodology.

Extract the typical workflow/steps a developer follows when using this framework.

README:
---
{README_CONTENT}
---

Framework: {FRAMEWORK_NAME}
Install command: {INSTALL_COMMAND}

Respond in JSON format:
{
  "philosophy": "One sentence describing the core approach (max 100 chars)",
  "steps": [
    {
      "id": "unique-id",
      "command": "The CLI command or action (e.g., 'npx my-tool init')",
      "humanDecision": "What the human decides at this step",
      "aiAction": "What the AI does after the human decision",
      "artifact": "What gets created (optional, can be null)"
    }
  ],
  "confidence": "high" | "medium" | "low"
}

Rules:
- Extract 3-6 workflow steps maximum
- Commands should be actual CLI syntax from the docs, not generic descriptions
- "humanDecision" describes what choice the user makes
- "aiAction" describes what the agent/framework does in response
- "artifact" is optional - only include if something tangible is created (file, config, etc.)
- Set confidence based on documentation clarity:
  - "high": Clear step-by-step workflow documented
  - "medium": Workflow can be inferred from examples/commands
  - "low": Very sparse documentation, mostly guessing
- If no discernible workflow exists, return: {"philosophy": null, "steps": [], "confidence": "low"}
- Focus on the MAIN workflow, not every possible feature`;

/**
 * Enrich framework with LLM-generated prose (description and how_it_works)
 */
async function enrichFrameworkProse(
  readme: string,
  _repoName: string,
  _githubDescription: string | null
): Promise<ProseEnrichmentOutcome> {
  // Skip if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: {
        error: "ANTHROPIC_API_KEY not configured",
        timestamp: new Date(),
      },
    };
  }

  // Skip if README is too short
  if (readme.length < 100) {
    return {
      success: false,
      error: {
        error: "README too short for analysis",
        timestamp: new Date(),
      },
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Truncate README to avoid token limits (first 8000 chars)
    const truncatedReadme = readme.slice(0, 8000);

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: PROSE_ENRICHMENT_PROMPT.replace("{README_CONTENT}", truncatedReadme),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ProseEnrichmentResult;

    // Validate required fields
    if (!parsed.description || !parsed.how_it_works) {
      throw new Error("Missing required fields in response");
    }

    // Enforce length limits
    return {
      success: true,
      data: {
        description: parsed.description.slice(0, 500),
        how_it_works: parsed.how_it_works.slice(0, 1000),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      },
    };
  }
}

/**
 * Extract structured workflow from README using LLM
 */
export async function enrichFrameworkWorkflow(
  readme: string,
  frameworkName: string,
  installCommand: string
): Promise<WorkflowEnrichmentOutcome> {
  // Skip if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: {
        error: "ANTHROPIC_API_KEY not configured",
        timestamp: new Date(),
      },
    };
  }

  // Skip if README is too short
  if (readme.length < 200) {
    return {
      success: false,
      error: {
        error: "README too short for workflow extraction",
        timestamp: new Date(),
      },
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Truncate README to avoid token limits (first 12000 chars for workflow)
    const truncatedReadme = readme.slice(0, 12000);

    const prompt = WORKFLOW_EXTRACTION_PROMPT
      .replace("{README_CONTENT}", truncatedReadme)
      .replace("{FRAMEWORK_NAME}", frameworkName)
      .replace("{INSTALL_COMMAND}", installCommand);

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      philosophy: string | null;
      steps: WorkflowStep[];
      confidence: "high" | "medium" | "low";
    };

    // Validate - require philosophy and at least 2 steps for valid workflow
    if (!parsed.philosophy || !parsed.steps || parsed.steps.length < 2) {
      return {
        success: false,
        error: {
          error: "No discernible workflow in documentation",
          timestamp: new Date(),
        },
      };
    }

    // Validate each step has required fields
    for (const step of parsed.steps) {
      if (!step.id || !step.command || !step.humanDecision || !step.aiAction) {
        throw new Error("Invalid step structure in response");
      }
    }

    return {
      success: true,
      data: {
        workflow: {
          philosophy: parsed.philosophy.slice(0, 150),
          steps: parsed.steps.slice(0, 6), // Max 6 steps
        },
        confidence: parsed.confidence,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      },
    };
  }
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

/**
 * Helper to retry fetch with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Rate limiting - wait and retry
      if (response.status === 403 || response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`[FrameworkSync] Rate limited, waiting ${waitTime}ms...`);
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      console.log(`[FrameworkSync] Fetch error (attempt ${attempt + 1}/${retries}):`, error);
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt)));
      }
    }
  }
  return null;
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

// Fetch README to extract install command (with retry)
async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`;

  const response = await fetchWithRetry(url, {
    headers: {
      ...getHeaders(),
      Accept: "application/vnd.github.v3.raw",
    },
  });

  if (!response || !response.ok) return null;
  return await response.text();
}

// Fetch contributor count using Link header pagination trick (with retry)
async function fetchContributorCount(owner: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=1&anon=0`;

  const response = await fetchWithRetry(url, { headers: getHeaders() });
  if (!response || !response.ok) return 0;

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
}

// NOTE: extractFeaturesFromReadme and extractUseCasesFromReadme have been removed
// in favor of LLM-based prose enrichment (enrichFrameworkProse function above)

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

  // Get existing frameworks (including enrichment columns and completeness score)
  const { data: existing, error: fetchError } = await supabase
    .from("frameworks")
    .select("id, github_url, slug, stars, skills_count, mcps_count, methodology, autonomy_level, subagents_count, how_it_works, prose_enriched_at, prose_enrichment_error, contributors_count, last_commit_at, open_issues_count, has_claude_md, completeness_score, name, description, install_command");

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

  // Sync known/curated frameworks first (ensures correct URLs and enrichment)
  console.log("[FrameworkSync] Syncing known frameworks...");
  for (const known of KNOWN_FRAMEWORKS) {
    const existingFramework = existingBySlug.get(known.slug);

    if (existingFramework) {
      // Check if enrichment is needed
      const currentCompleteness = calculateCompletenessScore(existingFramework as Framework);
      // Force enrichment if: low completeness, zero score, OR missing prose enrichment
      const needsEnrichment = currentCompleteness.score < COMPLETENESS_THRESHOLD ||
        currentCompleteness.score === 0 ||
        existingFramework.prose_enriched_at === null ||
        existingFramework.prose_enrichment_error !== null;

      // Update if URL is different OR needs enrichment
      if (existingFramework.github_url?.toLowerCase() !== known.github_url.toLowerCase() || needsEnrichment) {
        // Parse owner/repo from GitHub URL
        const urlMatch = known.github_url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (urlMatch && needsEnrichment) {
          const [, owner, repo] = urlMatch;
          console.log(`[FrameworkSync] Enriching known framework ${known.slug} (${currentCompleteness.score}% complete)`);

          // Fetch enrichment data
          const [readme, contributorsCount, agentConfigs] = await Promise.all([
            fetchReadme(owner, repo),
            fetchContributorCount(owner, repo),
            detectAgentConfigs(owner, repo),
          ]);

          // Fetch repo stats
          const repoResponse = await fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${owner}/${repo}`,
            { headers: getHeaders() }
          );
          const repoData = repoResponse?.ok ? await repoResponse.json() : null;

          const methodology = readme ? extractMethodology(readme) : null;
          const autonomyLevel = readme ? estimateAutonomyLevel(readme, agentConfigs.subagentsCount) : null;

          // Build update object
          const updateData: Record<string, unknown> = {
            github_url: known.github_url,
            homepage: known.github_url,
            updated_at: new Date().toISOString(),
            skills_count: agentConfigs.skillsCount,
            mcps_count: agentConfigs.mcpsCount,
            subagents_count: agentConfigs.subagentsCount,
            has_claude_md: agentConfigs.hasClaudeMd,
            has_agents_md: agentConfigs.hasAgentsMd,
            has_cursorrules: agentConfigs.hasCursorrules,
            has_windsurfrules: agentConfigs.hasWindsurfrules,
            methodology,
            autonomy_level: autonomyLevel,
            contributors_count: contributorsCount > 0 ? contributorsCount : null,
          };

          // LLM prose enrichment (description and how_it_works)
          if (readme && process.env.ANTHROPIC_API_KEY && !process.env.SKIP_PROSE_ENRICHMENT) {
            await new Promise((r) => setTimeout(r, PROSE_ENRICHMENT_RATE_LIMIT_MS));
            const proseResult = await enrichFrameworkProse(readme, known.name, known.description);
            if (proseResult.success) {
              updateData.description = proseResult.data.description;
              updateData.how_it_works = proseResult.data.how_it_works;
              updateData.prose_enriched_at = new Date().toISOString();
              updateData.prose_enrichment_error = null;
              console.log(`[FrameworkSync] Prose enriched ${known.slug}`);
            } else {
              updateData.prose_enrichment_error = proseResult.error.error;
              console.log(`[FrameworkSync] Prose enrichment failed for ${known.slug}: ${proseResult.error.error}`);
            }
          }

          if (repoData) {
            updateData.stars = repoData.stargazers_count;
            updateData.open_issues_count = repoData.open_issues_count;
            updateData.last_commit_at = repoData.pushed_at;
          }

          // Calculate new completeness score
          const updatedFramework = { ...existingFramework, ...updateData } as Framework;
          const newCompleteness = calculateCompletenessScore(updatedFramework);
          updateData.completeness_score = newCompleteness.score;

          const { error: updateError } = await supabase
            .from("frameworks")
            .update(updateData)
            .eq("id", existingFramework.id);

          if (updateError) {
            result.errors.push(`Failed to enrich ${known.slug}: ${updateError.message}`);
          } else {
            result.updated++;
            console.log(`[FrameworkSync] Enriched ${known.slug}: ${currentCompleteness.score}% → ${newCompleteness.score}%`);
          }

          // Rate limit delay
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (existingFramework.github_url?.toLowerCase() !== known.github_url.toLowerCase()) {
          // Just update URL
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
      // Calculate current completeness score to determine if enrichment is needed
      const currentCompleteness = calculateCompletenessScore(existingFramework as Framework);
      const needsCompletenessEnrichment = currentCompleteness.score < COMPLETENESS_THRESHOLD;

      // Check if we need to update taxonomy or enrichment columns (null check or low completeness)
      const needsTaxonomyUpdate =
        existingFramework.skills_count === null ||
        existingFramework.mcps_count === null ||
        existingFramework.methodology === null ||
        existingFramework.autonomy_level === null ||
        needsCompletenessEnrichment;

      const needsProseEnrichment =
        existingFramework.prose_enriched_at === null ||
        existingFramework.prose_enrichment_error !== null ||
        needsCompletenessEnrichment;

      const needsEnrichmentUpdate =
        needsProseEnrichment ||
        existingFramework.contributors_count === null ||
        existingFramework.last_commit_at === null ||
        needsCompletenessEnrichment;

      const needsUpdate = existingFramework.stars !== repo.stargazers_count || needsTaxonomyUpdate || needsEnrichmentUpdate;

      if (needsCompletenessEnrichment) {
        console.log(`[FrameworkSync] ${repo.full_name} completeness ${currentCompleteness.score}% < ${COMPLETENESS_THRESHOLD}%, forcing enrichment`);
      }

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
          // Always fetch all data when enriching to ensure completeness
          const [agentConfigs, readme, contributorsCount] = await Promise.all([
            detectAgentConfigs(repo.owner.login, repo.name),
            fetchReadme(repo.owner.login, repo.name),
            fetchContributorCount(repo.owner.login, repo.name),
          ]);

          // Taxonomy columns - update if null OR if we're forcing enrichment
          if (existingFramework.skills_count === null || needsCompletenessEnrichment) {
            updateData.skills_count = agentConfigs.skillsCount;
            updateData.subagents_count = agentConfigs.subagentsCount;
            updateData.has_claude_md = agentConfigs.hasClaudeMd;
            updateData.has_agents_md = agentConfigs.hasAgentsMd;
            updateData.has_cursorrules = agentConfigs.hasCursorrules;
            updateData.has_windsurfrules = agentConfigs.hasWindsurfrules;
          }
          if (existingFramework.mcps_count === null || needsCompletenessEnrichment) {
            updateData.mcps_count = agentConfigs.mcpsCount;
          }
          if ((existingFramework.methodology === null || needsCompletenessEnrichment) && readme) {
            updateData.methodology = extractMethodology(readme);
          }
          if ((existingFramework.autonomy_level === null || needsCompletenessEnrichment) && readme) {
            updateData.autonomy_level = estimateAutonomyLevel(readme, agentConfigs.subagentsCount);
          }

          // Prose enrichment - update if null OR if we're forcing enrichment
          if (needsProseEnrichment && readme && process.env.ANTHROPIC_API_KEY && !process.env.SKIP_PROSE_ENRICHMENT) {
            await new Promise((r) => setTimeout(r, PROSE_ENRICHMENT_RATE_LIMIT_MS));
            const proseResult = await enrichFrameworkProse(readme, repo.name, repo.description);
            if (proseResult.success) {
              updateData.description = proseResult.data.description;
              updateData.how_it_works = proseResult.data.how_it_works;
              updateData.prose_enriched_at = new Date().toISOString();
              updateData.prose_enrichment_error = null;
            } else {
              updateData.prose_enrichment_error = proseResult.error.error;
            }
          }
          if ((existingFramework.contributors_count === null || needsCompletenessEnrichment) && contributorsCount > 0) {
            updateData.contributors_count = contributorsCount;
          }

          // Calculate new completeness score with updated data
          const updatedFramework = { ...existingFramework, ...updateData } as Framework;
          const newCompleteness = calculateCompletenessScore(updatedFramework);
          updateData.completeness_score = newCompleteness.score;

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

    // Extract methodology and autonomy level from README
    const methodology = readme ? extractMethodology(readme) : null;
    const autonomyLevel = readme
      ? estimateAutonomyLevel(readme, agentConfigs.subagentsCount)
      : null;

    // LLM prose enrichment for new frameworks
    let proseDescription = repo.description || `Claude Code framework with ${repo.stargazers_count} stars`;
    let howItWorks: string | null = null;
    let proseEnrichedAt: string | null = null;
    let proseEnrichmentError: string | null = null;

    if (readme && process.env.ANTHROPIC_API_KEY && !process.env.SKIP_PROSE_ENRICHMENT) {
      await new Promise((r) => setTimeout(r, PROSE_ENRICHMENT_RATE_LIMIT_MS));
      const proseResult = await enrichFrameworkProse(readme, repo.name, repo.description);
      if (proseResult.success) {
        proseDescription = proseResult.data.description;
        howItWorks = proseResult.data.how_it_works;
        proseEnrichedAt = new Date().toISOString();
      } else {
        proseEnrichmentError = proseResult.error.error;
      }
    }

    // Build framework data for insert
    const frameworkData = {
      slug,
      name: generateDisplayName(repo.name),
      description: proseDescription,
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
      how_it_works: howItWorks,
      prose_enriched_at: proseEnrichedAt,
      prose_enrichment_error: proseEnrichmentError,
      last_commit_at: repo.pushed_at,
      contributors_count: contributorsCount > 0 ? contributorsCount : null,
      open_issues_count: repo.open_issues_count,
    };

    // Calculate completeness score for new framework
    const completeness = calculateCompletenessScore(frameworkData as Framework);

    // Insert new framework with enrichment data and completeness score
    const { data: insertedFramework, error: insertError } = await supabase
      .from("frameworks")
      .insert({
        ...frameworkData,
        completeness_score: completeness.score,
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
        name: frameworkData.name,
        description: frameworkData.description,
        install_command: frameworkData.install_command,
        stars: repo.stargazers_count,
        skills_count: agentConfigs.skillsCount,
        mcps_count: agentConfigs.mcpsCount,
        methodology,
        autonomy_level: autonomyLevel,
        subagents_count: agentConfigs.subagentsCount,
        how_it_works: howItWorks,
        prose_enriched_at: proseEnrichedAt,
        prose_enrichment_error: proseEnrichmentError,
        contributors_count: contributorsCount > 0 ? contributorsCount : null,
        last_commit_at: repo.pushed_at,
        open_issues_count: repo.open_issues_count,
        has_claude_md: agentConfigs.hasClaudeMd,
        completeness_score: completeness.score,
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
        `${completeness.score}% complete`,
        agentConfigs.hasClaudeMd && "CLAUDE.md",
        agentConfigs.hasAgentsMd && "AGENTS.md",
        agentConfigs.hasCursorrules && ".cursorrules",
        agentConfigs.hasWindsurfrules && ".windsurfrules",
        agentConfigs.subagentsCount > 0 && `${agentConfigs.subagentsCount} subagents`,
        agentConfigs.skillsCount > 0 && `${agentConfigs.skillsCount} skills`,
        agentConfigs.mcpsCount > 0 && `${agentConfigs.mcpsCount} MCPs`,
        proseEnrichedAt && "prose enriched",
        contributorsCount > 0 && `${contributorsCount} contributors`,
        methodology && methodology,
        autonomyLevel && `${autonomyLevel} autonomy`,
      ].filter(Boolean).join(", ");
      console.log(`[FrameworkSync] Added ${repo.full_name} (${repo.stargazers_count}★, ${configInfo})`);
    }

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(`[FrameworkSync] Complete. Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}`);

  return result;
}
