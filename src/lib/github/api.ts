// GitHub API wrapper for fetching marketplace.json files

export interface GitHubError {
  message: string;
  status: number;
  isRateLimit: boolean;
  isNotFound: boolean;
}

export interface RawMarketplaceJson {
  name?: string;
  owner?: {
    name?: string;
    email?: string;
    url?: string;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  plugins?: RawPlugin[];
}

export interface RawPlugin {
  name: string;
  description?: string;
  version?: string;
  source?: string | { url?: string };
  category?: string;
  author?: {
    name?: string;
    email?: string;
    url?: string;
  };
  tags?: string[];
  homepage?: string;
  // Component indicators
  skills?: unknown[];
  agents?: unknown[];
  commands?: unknown[];
  hooks?: unknown[];
  mcpServers?: unknown;
}

const GITHUB_API_BASE = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "cc-plugin-marketplace",
  };

  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }

  return headers;
}

export async function fetchMarketplaceJson(
  owner: string,
  repo: string
): Promise<{ data: RawMarketplaceJson | null; error: GitHubError | null }> {
  const path = ".claude-plugin/marketplace.json";
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    // Check rate limit
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const resetTime = response.headers.get("X-RateLimit-Reset");

    if (remaining === "0") {
      const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date();
      return {
        data: null,
        error: {
          message: `GitHub rate limit exceeded. Resets at ${resetDate.toISOString()}`,
          status: 429,
          isRateLimit: true,
          isNotFound: false,
        },
      };
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: `GitHub API error: ${response.statusText}`,
          status: response.status,
          isRateLimit: response.status === 403 && remaining === "0",
          isNotFound: response.status === 404,
        },
      };
    }

    const data = (await response.json()) as RawMarketplaceJson;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      data: null,
      error: {
        message: `Failed to fetch marketplace.json: ${message}`,
        status: 500,
        isRateLimit: false,
        isNotFound: false,
      },
    };
  }
}

// Fetch repo metadata (stars, forks) - optional enhancement
export async function fetchRepoStats(
  owner: string,
  repo: string
): Promise<{ stars: number; forks: number } | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

  try {
    const response = await fetch(url, {
      headers: {
        ...getHeaders(),
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
    };
  } catch {
    return null;
  }
}
