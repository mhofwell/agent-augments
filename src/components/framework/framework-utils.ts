// Re-export shared formatters from plugin-utils
export { formatStars, formatRelativeTime } from "@/components/plugin/plugin-utils";

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
