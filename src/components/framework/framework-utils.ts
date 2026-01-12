export const toolColors: Record<string, { bg: string; text: string; border: string }> = {
  npx: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  uv: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  curl: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

export function getToolStyle(tool: string | null | undefined) {
  return toolColors[tool || ""] || toolColors.curl;
}
