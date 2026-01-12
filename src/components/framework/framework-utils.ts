export const toolColors: Record<string, { bg: string; text: string; border: string }> = {
  npx: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  npm: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  bun: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  uv: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  bash: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  curl: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

export function getToolStyle(tool: string | null | undefined) {
  return toolColors[tool || ""] || toolColors.bash;
}

export function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return stars.toString();
}
