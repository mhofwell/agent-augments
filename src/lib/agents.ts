// AI coding agents that frameworks can work with
export interface Agent {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export const agents: Agent[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    shortName: "Claude",
    color: "#D97706", // amber
  },
  {
    id: "cursor",
    name: "Cursor",
    shortName: "Cursor",
    color: "#8B5CF6", // violet
  },
  {
    id: "windsurf",
    name: "Windsurf",
    shortName: "Windsurf",
    color: "#06B6D4", // cyan
  },
  {
    id: "codex",
    name: "Codex CLI",
    shortName: "Codex",
    color: "#10B981", // emerald
  },
];

// For now, all frameworks work with all agents since they're methodologies
// In the future, this could be stored in the database per-framework
export function getCompatibleAgents(_frameworkId?: string): Agent[] {
  return agents;
}
