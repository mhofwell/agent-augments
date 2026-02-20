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

// Autonomy level display config
export const autonomyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: "You Drive", color: "text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/30" },
  MED: { label: "Balanced", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  HIGH: { label: "AI Drives", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

// Workflow step types (matches framework-sync.ts)
export type WorkflowStep = {
  id: string;
  command: string;
  humanDecision: string;
  aiAction: string;
  artifact?: string;
};

export type WorkflowSteps = {
  philosophy: string;
  steps: WorkflowStep[];
};

export function parseWorkflowSteps(raw: unknown): WorkflowSteps | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!obj.philosophy || !Array.isArray(obj.steps) || obj.steps.length === 0) return null;
  return obj as unknown as WorkflowSteps;
}

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
