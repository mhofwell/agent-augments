import { createAdminClient } from "@/lib/supabase/admin";

const GITHUB_API_BASE = "https://api.github.com";

// Known UI frameworks with official MCP server support
const KNOWN_UI_FRAMEWORKS: Array<{
  slug: string;
  name: string;
  description: string;
  has_mcp: boolean;
  has_skill: boolean;
  mcp_package: string | null;
  mcp_source: string | null;
  mcp_install_command: string | null;
  mcp_docs_url: string | null;
  skill_install_command: string | null;
  skill_github_url: string | null;
  skill_source: string | null;
  best_for: string[];
  docs_url: string;
  github_url: string;
  github_owner: string;
  github_repo: string;
  website_url: string;
  color: string;
  is_official: boolean;
}> = [
  {
    slug: "shadcn-ui",
    name: "ShadCN UI",
    description: "Beautifully designed components built with Radix UI and Tailwind CSS. Copy and paste into your apps.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "Built-in CLI",
    mcp_source: "official",
    mcp_install_command: "npx shadcn@latest init",
    mcp_docs_url: "https://ui.shadcn.com/docs/mcp",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["React apps", "Next.js projects", "Tailwind CSS", "Radix primitives"],
    docs_url: "https://ui.shadcn.com/docs",
    github_url: "https://github.com/shadcn-ui/ui",
    github_owner: "shadcn-ui",
    github_repo: "ui",
    website_url: "https://ui.shadcn.com",
    color: "#000000",
    is_official: true,
  },
  {
    slug: "magic-ui",
    name: "Magic UI",
    description: "UI library for design engineers with animated components and stunning visual effects built with React and Tailwind CSS.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "@magicuidesign/mcp",
    mcp_source: "official",
    mcp_install_command: "npx @magicuidesign/cli@latest install",
    mcp_docs_url: "https://magicui.design/docs/mcp",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Animations", "Visual effects", "Landing pages", "Tailwind CSS"],
    docs_url: "https://magicui.design/docs",
    github_url: "https://github.com/magicuidesign/magicui",
    github_owner: "magicuidesign",
    github_repo: "magicui",
    website_url: "https://magicui.design",
    color: "#8B5CF6",
    is_official: true,
  },
  {
    slug: "material-ui",
    name: "Material UI",
    description: "Ready-to-use React components implementing Google's Material Design. Comprehensive documentation access for AI assistants.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "@mui/mcp",
    mcp_source: "official",
    mcp_install_command: "npx -y @mui/mcp@latest",
    mcp_docs_url: "https://mui.com/material-ui/getting-started/mcp/",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Enterprise apps", "React", "Material Design", "Accessible components"],
    docs_url: "https://mui.com/material-ui/getting-started/",
    github_url: "https://github.com/mui/material-ui",
    github_owner: "mui",
    github_repo: "material-ui",
    website_url: "https://mui.com",
    color: "#007FFF",
    is_official: true,
  },
  {
    slug: "chakra-ui",
    name: "Chakra UI",
    description: "Simple, modular and accessible component library for React. MCP provides v2→v3 migration assistance and theming support.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "@chakra-ui/react-mcp",
    mcp_source: "official",
    mcp_install_command: "npm install @chakra-ui/react-mcp",
    mcp_docs_url: "https://chakra-ui.com/docs/get-started/ai/mcp-server",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Theming", "Accessibility", "React", "v2→v3 migration"],
    docs_url: "https://chakra-ui.com/docs/getting-started",
    github_url: "https://github.com/chakra-ui/chakra-ui",
    github_owner: "chakra-ui",
    github_repo: "chakra-ui",
    website_url: "https://chakra-ui.com",
    color: "#319795",
    is_official: true,
  },
  {
    slug: "storybook",
    name: "Storybook",
    description: "Frontend workshop for building UI components in isolation. MCP addon enables visual testing and component discovery.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "@storybook/addon-mcp",
    mcp_source: "official",
    mcp_install_command: "npm install @storybook/addon-mcp",
    mcp_docs_url: "https://storybook.js.org/addons/@storybook/addon-mcp",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Visual testing", "Component documentation", "Any framework", "Design systems"],
    docs_url: "https://storybook.js.org/docs",
    github_url: "https://github.com/storybookjs/storybook",
    github_owner: "storybookjs",
    github_repo: "storybook",
    website_url: "https://storybook.js.org",
    color: "#FF4785",
    is_official: true,
  },
  {
    slug: "flowbite",
    name: "Flowbite",
    description: "Open-source UI component library based on Tailwind CSS. MCP supports Figma→code conversion and theme generation.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "flowbite-mcp",
    mcp_source: "official",
    mcp_install_command: "npx flowbite-mcp",
    mcp_docs_url: "https://flowbite.com/docs/getting-started/mcp/",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Figma→code", "Theme generation", "Tailwind CSS", "Multiple frameworks"],
    docs_url: "https://flowbite.com/docs/getting-started/introduction/",
    github_url: "https://github.com/themesberg/flowbite",
    github_owner: "themesberg",
    github_repo: "flowbite",
    website_url: "https://flowbite.com",
    color: "#1C64F2",
    is_official: true,
  },
  {
    slug: "daisyui",
    name: "DaisyUI",
    description: "Most popular Tailwind CSS component library. Blueprint MCP helps convert existing Tailwind to daisyUI components.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "Blueprint MCP",
    mcp_source: "official",
    mcp_install_command: null,
    mcp_docs_url: "https://daisyui.com/blueprint/",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["Tailwind conversion", "Rapid prototyping", "Clean components", "Themes"],
    docs_url: "https://daisyui.com/docs/install/",
    github_url: "https://github.com/saadeghi/daisyui",
    github_owner: "saadeghi",
    github_repo: "daisyui",
    website_url: "https://daisyui.com",
    color: "#5B21B6",
    is_official: true,
  },
  {
    slug: "flyonui",
    name: "FlyonUI",
    description: "Tailwind CSS component library with AI builder. Generate production-ready UI components with natural language.",
    has_mcp: true,
    has_skill: false,
    mcp_package: "FlyonUI MCP",
    mcp_source: "official",
    mcp_install_command: null,
    mcp_docs_url: "https://flyonui.com/mcp",
    skill_install_command: null,
    skill_github_url: null,
    skill_source: null,
    best_for: ["AI Builder", "Tailwind CSS", "Production components", "Natural language"],
    docs_url: "https://flyonui.com/docs/getting-started/quick-start/",
    github_url: "https://github.com/themeselection/flyonui",
    github_owner: "themeselection",
    github_repo: "flyonui",
    website_url: "https://flyonui.com",
    color: "#7C3AED",
    is_official: true,
  },
];

interface GitHubRepoStats {
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
}

export interface UISyncResult {
  success: boolean;
  frameworksProcessed: number;
  frameworksAdded: number;
  frameworksUpdated: number;
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
async function fetchRepoStats(owner: string, repo: string): Promise<GitHubRepoStats | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function syncUIFrameworks(): Promise<UISyncResult> {
  const supabase = createAdminClient();
  const result: UISyncResult = {
    success: false,
    frameworksProcessed: 0,
    frameworksAdded: 0,
    frameworksUpdated: 0,
    errors: [],
  };

  console.log("[UISync] Starting UI frameworks sync...");

  for (let i = 0; i < KNOWN_UI_FRAMEWORKS.length; i++) {
    const framework = KNOWN_UI_FRAMEWORKS[i];
    console.log(`[UISync] Processing ${framework.name}...`);

    try {
      // Fetch GitHub stats
      const stats = await fetchRepoStats(framework.github_owner, framework.github_repo);

      if (!stats) {
        console.log(`[UISync] Warning: Could not fetch stats for ${framework.github_owner}/${framework.github_repo}`);
      }

      // Check if framework exists
      const { data: existing } = await supabase
        .from("ui_frameworks")
        .select("id")
        .eq("slug", framework.slug)
        .single();

      const frameworkData = {
        slug: framework.slug,
        name: framework.name,
        description: framework.description,
        has_mcp: framework.has_mcp,
        has_skill: framework.has_skill,
        mcp_package: framework.mcp_package,
        mcp_source: framework.mcp_source,
        mcp_install_command: framework.mcp_install_command,
        mcp_docs_url: framework.mcp_docs_url,
        skill_install_command: framework.skill_install_command,
        skill_github_url: framework.skill_github_url,
        skill_source: framework.skill_source,
        best_for: framework.best_for,
        docs_url: framework.docs_url,
        github_url: framework.github_url,
        website_url: framework.website_url,
        color: framework.color,
        github_stars: stats?.stargazers_count || null,
        github_forks: stats?.forks_count || null,
        last_commit_at: stats?.pushed_at || null,
        is_official: framework.is_official,
        sort_order: i,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from("ui_frameworks")
          .update(frameworkData)
          .eq("id", existing.id);

        if (updateError) {
          result.errors.push(`Failed to update ${framework.name}: ${updateError.message}`);
        } else {
          result.frameworksUpdated++;
          console.log(`[UISync] Updated: ${framework.name} (${stats?.stargazers_count || 0}★)`);
        }
      } else {
        const { error: insertError } = await supabase
          .from("ui_frameworks")
          .insert(frameworkData);

        if (insertError) {
          result.errors.push(`Failed to insert ${framework.name}: ${insertError.message}`);
        } else {
          result.frameworksAdded++;
          console.log(`[UISync] Added: ${framework.name} (${stats?.stargazers_count || 0}★)`);
        }
      }

      result.frameworksProcessed++;
    } catch (err) {
      result.errors.push(`Error processing ${framework.name}: ${err}`);
    }

    // Rate limit between frameworks
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  result.success = result.errors.length === 0;
  console.log(
    `[UISync] Complete. Processed: ${result.frameworksProcessed}, Added: ${result.frameworksAdded}, Updated: ${result.frameworksUpdated}`
  );

  return result;
}
