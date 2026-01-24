import type { Framework, StandaloneSkill, MCP } from "@/types/database";

// AI coding agents that frameworks can work with
export interface Agent {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string; // Path to icon SVG in /public
}

/**
 * Generic interface for items that can have compatibility derived.
 * Works with Frameworks, Skills, MCPs, or any item with these properties.
 */
export interface CompatibleItem {
  subagents_count?: number | null;
  is_claude_plugin?: boolean | null;
  // File detection flags - which instruction files does this item have?
  has_claude_md?: boolean | null;
  has_agents_md?: boolean | null;
  has_cursorrules?: boolean | null;
  has_windsurfrules?: boolean | null;
  has_skill_md?: boolean | null; // SKILL.md - supported by ALL agents
}

/**
 * Reasons why an agent may be incompatible with an item.
 */
export type IncompatibilityReason =
  | "claude-only-plugin"
  | "requires-subagents"
  | "no-claude-md"
  | "no-agents-md"
  | "no-cursorrules"
  | "no-windsurfrules"
  | null;

export const agents: Agent[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    shortName: "Claude",
    color: "#D97706", // amber
    icon: "/claude-star-dark.svg",
  },
  {
    id: "cursor",
    name: "Cursor",
    shortName: "Cursor",
    color: "#8B5CF6", // violet
    icon: "/cursor-dark.svg",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    shortName: "Windsurf",
    color: "#06B6D4", // cyan
    icon: "/windsurf-dark.svg",
  },
  {
    id: "codex",
    name: "Codex CLI",
    shortName: "Codex",
    color: "#10B981", // emerald
    icon: "/openai-dark.svg",
  },
];

/**
 * Derive agent compatibility from item properties.
 *
 * Each agent reads specific instruction files:
 * - Claude Code: CLAUDE.md, SKILL.md
 * - Cursor: AGENTS.md, .cursorrules, SKILL.md
 * - Windsurf: AGENTS.md, .windsurfrules, SKILL.md (but NO subagent support)
 * - Codex: AGENTS.md, SKILL.md
 *
 * SKILL.md is an open standard supported by ALL agents.
 *
 * @param item - Any item with compatibility-related properties
 * @returns Array of compatible agents
 */
export function deriveCompatibility(item?: CompatibleItem | null): Agent[] {
  if (!item) {
    return agents; // Unknown item, assume all compatible
  }

  // Claude-only plugins (legacy /plugin install syntax)
  if (item.is_claude_plugin) {
    return agents.filter((a) => a.id === "claude-code");
  }

  const hasSubagents = item.subagents_count && item.subagents_count > 0;

  // SKILL.md is supported by ALL agents (except Windsurf can't use subagents)
  if (item.has_skill_md) {
    if (hasSubagents) {
      return agents.filter((a) => a.id !== "windsurf");
    }
    return agents;
  }

  const compatible: string[] = [];

  // Claude Code: requires CLAUDE.md
  if (item.has_claude_md) {
    compatible.push("claude-code");
  }

  // Cursor: requires AGENTS.md or .cursorrules
  if (item.has_agents_md || item.has_cursorrules) {
    compatible.push("cursor");
  }

  // Windsurf: requires AGENTS.md or .windsurfrules, AND no subagents
  const hasWindsurfInstructions = item.has_agents_md || item.has_windsurfrules;
  if (hasWindsurfInstructions && !hasSubagents) {
    compatible.push("windsurf");
  }

  // Codex: requires AGENTS.md
  if (item.has_agents_md) {
    compatible.push("codex");
  }

  // If no instruction files detected at all, show all agents as a fallback
  // (the item might be a generic tool/MCP that works everywhere)
  if (compatible.length === 0) {
    return agents;
  }

  return agents.filter((a) => compatible.includes(a.id));
}

/**
 * Get the reason why an agent is incompatible with an item.
 *
 * @param item - The item to check compatibility for
 * @param agentId - The agent ID to check
 * @returns The reason for incompatibility, or null if compatible
 */
export function getIncompatibilityReason(
  item?: CompatibleItem | null,
  agentId?: string
): IncompatibilityReason {
  if (!item || !agentId) return null;

  // Check if this is a Claude-only plugin
  if (item.is_claude_plugin && agentId !== "claude-code") {
    return "claude-only-plugin";
  }

  // SKILL.md is supported by ALL agents
  if (item.has_skill_md) {
    // Only check subagent restriction for Windsurf
    if (agentId === "windsurf" && item.subagents_count && item.subagents_count > 0) {
      return "requires-subagents";
    }
    return null; // SKILL.md = compatible with all
  }

  // If no instruction files detected, assume compatible (generic tool)
  const hasAnyInstructions =
    item.has_claude_md ||
    item.has_agents_md ||
    item.has_cursorrules ||
    item.has_windsurfrules;

  if (!hasAnyInstructions) {
    return null; // Generic tool, compatible with all
  }

  // Check agent-specific incompatibilities
  switch (agentId) {
    case "claude-code":
      if (!item.has_claude_md) {
        return "no-claude-md";
      }
      break;

    case "cursor":
      if (!item.has_agents_md && !item.has_cursorrules) {
        return "no-cursorrules";
      }
      break;

    case "windsurf":
      if (item.subagents_count && item.subagents_count > 0) {
        return "requires-subagents";
      }
      if (!item.has_agents_md && !item.has_windsurfrules) {
        return "no-windsurfrules";
      }
      break;

    case "codex":
      if (!item.has_agents_md) {
        return "no-agents-md";
      }
      break;
  }

  return null;
}

/**
 * Get human-readable message for an incompatibility reason.
 */
export function getIncompatibilityMessage(
  reason: IncompatibilityReason
): string | null {
  switch (reason) {
    case "claude-only-plugin":
      return "Uses Claude Code plugin syntax";
    case "requires-subagents":
      return "Windsurf doesn't support subagents";
    case "no-claude-md":
      return "No CLAUDE.md file";
    case "no-agents-md":
      return "No AGENTS.md file";
    case "no-cursorrules":
      return "No AGENTS.md or .cursorrules";
    case "no-windsurfrules":
      return "No AGENTS.md or .windsurfrules";
    default:
      return null;
  }
}

/**
 * Skills are universally compatible (no subagents).
 */
export function getSkillCompatibility(_skill?: StandaloneSkill | null): Agent[] {
  return agents; // All agents support SKILL.md
}

/**
 * MCPs are universally compatible.
 */
export function getMcpCompatibility(_mcp?: MCP | null): Agent[] {
  return agents; // All agents support MCP
}

/**
 * @deprecated Use deriveCompatibility() instead
 * Kept for backwards compatibility with existing code.
 */
export function getCompatibleAgents(framework?: Framework | null): Agent[] {
  return deriveCompatibility(framework);
}
