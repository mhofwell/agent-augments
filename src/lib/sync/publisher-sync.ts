import { createAdminClient } from "@/lib/supabase/admin";
import type { SkillPublisher, PublisherSkill, SkillTag } from "@/types/database";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

// Known skill publishers to sync
const KNOWN_PUBLISHERS: Array<{
  name: string;
  slug: string;
  github_org: string;
  github_repo: string;
  description: string;
  website_url?: string;
  is_official: boolean;
  primary_tag: SkillTag;
  tags: SkillTag[];
}> = [
  {
    name: "Vercel",
    slug: "vercel",
    github_org: "vercel-labs",
    github_repo: "agent-skills",
    description: "Performance optimization guidelines from Vercel Engineering",
    website_url: "https://vercel.com",
    is_official: true,
    primary_tag: "development",
    tags: ["development", "infrastructure"],
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    github_org: "anthropics",
    github_repo: "skills",
    description: "Official skills from Anthropic for document creation, design, and development workflows",
    website_url: "https://anthropic.com",
    is_official: true,
    primary_tag: "documents",
    tags: ["documents", "development"],
  },
  {
    name: "Railway",
    slug: "railway",
    github_org: "railwayapp",
    github_repo: "railway-skills",
    description: "Agent skills for deploying and managing infrastructure on Railway",
    website_url: "https://railway.app",
    is_official: true,
    primary_tag: "infrastructure",
    tags: ["infrastructure"],
  },
  {
    name: "OpenAI",
    slug: "openai",
    github_org: "openai",
    github_repo: "skills",
    description: "Official skills from OpenAI for AI/ML workflows and model integration",
    website_url: "https://openai.com",
    is_official: true,
    primary_tag: "ai-ml",
    tags: ["ai-ml", "development"],
  },
  {
    name: "Hugging Face",
    slug: "huggingface",
    github_org: "huggingface",
    github_repo: "skills",
    description: "Machine learning and NLP skills from the Hugging Face team",
    website_url: "https://huggingface.co",
    is_official: true,
    primary_tag: "ai-ml",
    tags: ["ai-ml", "data-science"],
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    github_org: "cloudflare",
    github_repo: "skills",
    description: "Edge computing and infrastructure skills from Cloudflare",
    website_url: "https://cloudflare.com",
    is_official: true,
    primary_tag: "infrastructure",
    tags: ["infrastructure", "security"],
  },
  {
    name: "Trail of Bits",
    slug: "trailofbits",
    github_org: "trailofbits",
    github_repo: "skills",
    description: "Security analysis and auditing skills from Trail of Bits",
    website_url: "https://trailofbits.com",
    is_official: true,
    primary_tag: "security",
    tags: ["security", "development"],
  },
  {
    name: "Stripe",
    slug: "stripe",
    github_org: "stripe",
    github_repo: "ai",
    description: "Payment integration and financial workflow skills from Stripe",
    website_url: "https://stripe.com",
    is_official: true,
    primary_tag: "payments",
    tags: ["payments", "development"],
  },
  {
    name: "Posit",
    slug: "posit",
    github_org: "posit-dev",
    github_repo: "skills",
    description: "Data science and analytics skills from Posit (formerly RStudio)",
    website_url: "https://posit.co",
    is_official: true,
    primary_tag: "data-science",
    tags: ["data-science", "development"],
  },
  {
    name: "Apify",
    slug: "apify",
    github_org: "apify",
    github_repo: "agent-skills",
    description: "Web scraping and automation skills from Apify",
    website_url: "https://apify.com",
    is_official: true,
    primary_tag: "automation",
    tags: ["automation", "development"],
  },
  {
    name: "AWS",
    slug: "aws",
    github_org: "aws-samples",
    github_repo: "sample-strands-agents-agentskills",
    description: "Cloud infrastructure and AWS service integration skills",
    website_url: "https://aws.amazon.com",
    is_official: true,
    primary_tag: "infrastructure",
    tags: ["infrastructure", "ai-ml"],
  },
];

interface GitHubRepoStats {
  stargazers_count: number;
  forks_count: number;
  subscribers_count: number;
  pushed_at: string;
}

interface GitHubContributor {
  login: string;
  avatar_url: string;
}

interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: {
    author?: string;
    version?: string;
    [key: string]: string | undefined;
  };
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  categories: string[];
  ruleCount: number;
  categoryCount: number;
  triggerPhrases: string[];
}

export interface PublisherSyncResult {
  success: boolean;
  publishersProcessed: number;
  skillsAdded: number;
  skillsUpdated: number;
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

// Fetch repo stats from GitHub API
async function fetchRepoStats(org: string, repo: string): Promise<GitHubRepoStats | null> {
  const url = `${GITHUB_API_BASE}/repos/${org}/${repo}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Fetch contributor count
async function fetchContributorCount(org: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_BASE}/repos/${org}/${repo}/contributors?per_page=1`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return 0;

    // GitHub returns Link header with total count
    const linkHeader = response.headers.get("Link");
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (match) return parseInt(match[1], 10);
    }

    const contributors = await response.json();
    return Array.isArray(contributors) ? contributors.length : 0;
  } catch {
    return 0;
  }
}

// Find all SKILL.md files in a repo
async function findSkillFiles(org: string, repo: string): Promise<string[]> {
  const url = `${GITHUB_API_BASE}/repos/${org}/${repo}/git/trees/HEAD?recursive=1`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.tree || !Array.isArray(data.tree)) return [];

    return data.tree
      .filter(
        (item: { path: string; type: string }) =>
          item.type === "blob" && item.path.toLowerCase().endsWith("skill.md")
      )
      .map((item: { path: string }) => item.path);
  } catch {
    return [];
  }
}

// Fetch raw SKILL.md content
async function fetchSkillContent(org: string, repo: string, path: string): Promise<string | null> {
  const url = `${GITHUB_RAW_BASE}/${org}/${repo}/main/${path}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// Parse YAML frontmatter from SKILL.md
function parseFrontmatter(content: string): { frontmatter: SkillFrontmatter; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const [, yamlContent, body] = match;

  // Simple YAML parsing (handles basic key: value and nested metadata)
  const frontmatter: SkillFrontmatter = {
    name: "",
    description: "",
  };

  const lines = yamlContent.split("\n");
  let currentKey = "";
  let inMetadata = false;
  const metadata: Record<string, string> = {};

  for (const line of lines) {
    // Check for metadata block
    if (line.trim() === "metadata:") {
      inMetadata = true;
      continue;
    }

    if (inMetadata) {
      // Nested metadata field
      const metaMatch = line.match(/^\s{2}(\w+):\s*"?([^"]*)"?$/);
      if (metaMatch) {
        metadata[metaMatch[1]] = metaMatch[2];
        continue;
      }
      // Exit metadata block on non-indented line
      if (!line.startsWith("  ") && line.trim()) {
        inMetadata = false;
      }
    }

    if (!inMetadata) {
      // Top-level field
      const fieldMatch = line.match(/^(\w+[-\w]*):\s*(.*)$/);
      if (fieldMatch) {
        const [, key, value] = fieldMatch;
        currentKey = key;

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "").trim();

        switch (key) {
          case "name":
            frontmatter.name = cleanValue;
            break;
          case "description":
            frontmatter.description = cleanValue;
            break;
          case "license":
            frontmatter.license = cleanValue;
            break;
          case "compatibility":
            frontmatter.compatibility = cleanValue;
            break;
        }
      }
    }
  }

  if (Object.keys(metadata).length > 0) {
    frontmatter.metadata = metadata;
  }

  // Validate required fields
  if (!frontmatter.name || !frontmatter.description) {
    return null;
  }

  return { frontmatter, body };
}

// Extract categories from SKILL.md body
function extractCategories(body: string): string[] {
  const categories: string[] = [];

  // Look for category tables or lists
  // Pattern: | Category | or ### Category Name
  const tableMatch = body.match(/\|\s*Category\s*\|[\s\S]*?\n((?:\|[^\n]+\n)+)/i);
  if (tableMatch) {
    const rows = tableMatch[1].split("\n").filter((r) => r.trim());
    for (const row of rows) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0 && !cells[0].includes("---")) {
        categories.push(cells[0]);
      }
    }
  }

  // Also look for ### headers that might be categories
  const headers = body.match(/^###\s+\d+\.\s+(.+)$/gm);
  if (headers) {
    for (const header of headers) {
      const match = header.match(/^###\s+\d+\.\s+(.+)$/);
      if (match) {
        categories.push(match[1].trim());
      }
    }
  }

  return categories;
}

// Count rules in SKILL.md body
function countRules(body: string): number {
  // Look for rule patterns like `rule-name` or - `rule-name`
  const rulePattern = /`([a-z]+-[a-z-]+)`/g;
  const matches = body.match(rulePattern);
  return matches ? matches.length : 0;
}

// Extract trigger phrases ("Use when..." or "**Use when:**")
function extractTriggerPhrases(body: string): string[] {
  const phrases: string[] = [];

  // Look for "Use when:" sections
  const useWhenMatch = body.match(/\*\*Use when[:\*]*\*\*\s*([\s\S]*?)(?=\n\n|\*\*[A-Z]|\n#)/i);
  if (useWhenMatch) {
    const lines = useWhenMatch[1].split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^[-*]\s*/, "").trim();
      if (cleaned && !cleaned.startsWith("**")) {
        phrases.push(cleaned);
      }
    }
  }

  return phrases;
}

// Parse a full SKILL.md file
function parseSkillMd(content: string): ParsedSkill | null {
  const parsed = parseFrontmatter(content);
  if (!parsed) return null;

  const { frontmatter, body } = parsed;
  const categories = extractCategories(body);
  const ruleCount = countRules(body);
  const triggerPhrases = extractTriggerPhrases(body);

  return {
    frontmatter,
    body,
    categories,
    ruleCount,
    categoryCount: categories.length,
    triggerPhrases,
  };
}

// Infer tags for a skill based on its name and description
function inferSkillTags(name: string, description: string, publisherTags: SkillTag[]): SkillTag[] {
  const text = `${name} ${description}`.toLowerCase();
  const tags: Set<SkillTag> = new Set();

  // Infrastructure keywords
  if (/deploy|database|infra|server|cloud|kubernetes|docker|ci\/cd|pipeline|hosting|aws|gcp|azure|railway|vercel|cloudflare|domain|dns|ssl|cdn/.test(text)) {
    tags.add("infrastructure");
  }

  // AI/ML keywords
  if (/ai|ml|machine learning|model|neural|llm|gpt|embeddings|training|inference|transformer|nlp|vision|huggingface|openai/.test(text)) {
    tags.add("ai-ml");
  }

  // Security keywords
  if (/security|auth|authentication|authorization|encrypt|vulnerability|audit|penetration|compliance|oauth|jwt|rbac|permissions/.test(text)) {
    tags.add("security");
  }

  // Payments keywords
  if (/payment|stripe|checkout|invoice|subscription|billing|transaction|merchant|refund|pricing/.test(text)) {
    tags.add("payments");
  }

  // Data science keywords
  if (/data science|analytics|statistics|visualization|dashboard|pandas|numpy|jupyter|r studio|posit|dataset|analysis/.test(text)) {
    tags.add("data-science");
  }

  // Automation keywords
  if (/automat|scrape|crawl|bot|workflow|schedule|cron|trigger|webhook|apify|puppeteer|playwright/.test(text)) {
    tags.add("automation");
  }

  // Documents keywords
  if (/document|pdf|docx|xlsx|pptx|markdown|export|report|template|format|convert/.test(text)) {
    tags.add("documents");
  }

  // Development keywords
  if (/code|develop|test|debug|lint|format|react|next|typescript|javascript|python|api|sdk|cli|git|build/.test(text)) {
    tags.add("development");
  }

  // If no tags inferred, inherit from publisher
  if (tags.size === 0 && publisherTags.length > 0) {
    tags.add(publisherTags[0]);
  }

  return Array.from(tags);
}

// Generate slug from skill name
function generateSkillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Get skill directory name from path
function getSkillDirName(path: string): string {
  // path like "skills/react-best-practices/SKILL.md" -> "react-best-practices"
  const parts = path.split("/");
  return parts.length > 1 ? parts[parts.length - 2] : parts[0].replace(/\.md$/i, "");
}

export async function syncPublishers(): Promise<PublisherSyncResult> {
  const supabase = createAdminClient();
  const result: PublisherSyncResult = {
    success: false,
    publishersProcessed: 0,
    skillsAdded: 0,
    skillsUpdated: 0,
    errors: [],
  };

  console.log("[PublisherSync] Starting skill publisher sync...");

  for (const publisher of KNOWN_PUBLISHERS) {
    console.log(`[PublisherSync] Processing ${publisher.name}...`);

    try {
      // Fetch GitHub stats
      const [stats, contributorCount] = await Promise.all([
        fetchRepoStats(publisher.github_org, publisher.github_repo),
        fetchContributorCount(publisher.github_org, publisher.github_repo),
      ]);

      if (!stats) {
        result.errors.push(`Failed to fetch stats for ${publisher.github_org}/${publisher.github_repo}`);
        continue;
      }

      // Upsert publisher
      const { data: publisherData, error: publisherError } = await supabase
        .from("skill_publishers")
        .upsert(
          {
            name: publisher.name,
            slug: publisher.slug,
            github_org: publisher.github_org,
            github_repo: publisher.github_repo,
            description: publisher.description,
            website_url: publisher.website_url,
            is_official: publisher.is_official,
            github_stars: stats.stargazers_count,
            github_forks: stats.forks_count,
            github_watchers: stats.subscribers_count,
            contributor_count: contributorCount,
            last_commit_at: stats.pushed_at,
            primary_tag: publisher.primary_tag,
            tags: publisher.tags,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        )
        .select()
        .single();

      if (publisherError) {
        result.errors.push(`Failed to upsert publisher ${publisher.name}: ${publisherError.message}`);
        continue;
      }

      result.publishersProcessed++;
      console.log(
        `[PublisherSync] ${publisher.name}: ${stats.stargazers_count}★, ${stats.forks_count} forks, ${contributorCount} contributors`
      );

      // Find and process SKILL.md files
      const skillPaths = await findSkillFiles(publisher.github_org, publisher.github_repo);
      console.log(`[PublisherSync] Found ${skillPaths.length} SKILL.md files`);

      for (const skillPath of skillPaths) {
        const content = await fetchSkillContent(publisher.github_org, publisher.github_repo, skillPath);
        if (!content) {
          result.errors.push(`Failed to fetch ${skillPath}`);
          continue;
        }

        const parsed = parseSkillMd(content);
        if (!parsed) {
          result.errors.push(`Failed to parse ${skillPath}`);
          continue;
        }

        const skillSlug = generateSkillSlug(parsed.frontmatter.name) || getSkillDirName(skillPath);

        // Upsert skill
        const { data: existingSkill } = await supabase
          .from("publisher_skills")
          .select("id")
          .eq("publisher_id", publisherData.id)
          .eq("slug", skillSlug)
          .single();

        // Infer tags for the skill
        const skillTags = inferSkillTags(
          parsed.frontmatter.name,
          parsed.frontmatter.description,
          publisher.tags
        );

        const skillData = {
          publisher_id: publisherData.id,
          name: parsed.frontmatter.name,
          slug: skillSlug,
          description: parsed.frontmatter.description,
          version: parsed.frontmatter.metadata?.version || null,
          license: parsed.frontmatter.license || null,
          compatibility: parsed.frontmatter.compatibility || null,
          author: parsed.frontmatter.metadata?.author || null,
          rule_count: parsed.ruleCount || null,
          category_count: parsed.categoryCount || null,
          categories: parsed.categories,
          trigger_phrases: parsed.triggerPhrases,
          tags: skillTags,
          updated_at: new Date().toISOString(),
        };

        if (existingSkill) {
          const { error: updateError } = await supabase
            .from("publisher_skills")
            .update(skillData)
            .eq("id", existingSkill.id);

          if (updateError) {
            result.errors.push(`Failed to update skill ${skillSlug}: ${updateError.message}`);
          } else {
            result.skillsUpdated++;
            console.log(`[PublisherSync] Updated skill: ${parsed.frontmatter.name}`);
          }
        } else {
          const { error: insertError } = await supabase.from("publisher_skills").insert(skillData);

          if (insertError) {
            result.errors.push(`Failed to insert skill ${skillSlug}: ${insertError.message}`);
          } else {
            result.skillsAdded++;
            console.log(
              `[PublisherSync] Added skill: ${parsed.frontmatter.name} (${parsed.ruleCount} rules, ${parsed.categoryCount} categories)`
            );
          }
        }

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      result.errors.push(`Error processing ${publisher.name}: ${err}`);
    }

    // Rate limit between publishers
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  result.success = result.errors.length === 0;
  console.log(
    `[PublisherSync] Complete. Publishers: ${result.publishersProcessed}, Skills added: ${result.skillsAdded}, updated: ${result.skillsUpdated}`
  );

  return result;
}
