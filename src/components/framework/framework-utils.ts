export type ToolStyle = {
  bg: string;
  text: string;
  border: string;
};

export const toolColors: Record<string, ToolStyle> = {
  npx: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  npm: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  bun: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  uv: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  bash: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  curl: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

export function getToolStyle(tool: string | null | undefined): ToolStyle {
  return toolColors[tool || ""] || toolColors.bash;
}

export function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return stars.toString();
}

// Verified organizations for badge display
const VERIFIED_ORGS = new Set([
  "github",
  "anthropics",
  "anthropic",
  "EveryInc",
  "openai",
]);

export function isVerified(author: string | null): boolean {
  if (!author) return false;
  return VERIFIED_ORGS.has(author) || VERIFIED_ORGS.has(author.toLowerCase());
}

export function extractAuthor(githubUrl: string | null): string | null {
  if (!githubUrl) return null;
  const match = githubUrl.match(/github\.com\/([^\/]+)/);
  return match ? match[1] : null;
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
