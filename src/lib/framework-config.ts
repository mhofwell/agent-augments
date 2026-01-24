/**
 * Shared configuration for framework display components.
 * Used by FrameworkCard, FrameworkModal, and detail page for consistency.
 */

// Methodology config with icons and descriptions
export const METHODOLOGY_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  "agentic-mesh": {
    label: "Agentic Mesh",
    description: "Multi-agent orchestration with specialized subagents that delegate and coordinate tasks autonomously.",
    color: "violet",
  },
  "spec-driven": {
    label: "Spec Driven",
    description: "Plan-first approach that creates detailed specifications before implementation begins.",
    color: "blue",
  },
  "test-first": {
    label: "Test First",
    description: "Write tests before code to ensure correctness and prevent regressions from the start.",
    color: "emerald",
  },
  "iterative": {
    label: "Iterative",
    description: "Fast feedback loops with incremental improvements and rapid prototyping.",
    color: "amber",
  },
};

// Autonomy level config with descriptions
export const AUTONOMY_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  "HIGH": {
    label: "High Autonomy",
    description: "Agent operates independently with minimal human intervention. Ideal for experienced users.",
    color: "rose",
  },
  "MED": {
    label: "Medium Autonomy",
    description: "Balanced approach with agent guidance and human checkpoints at key decisions.",
    color: "amber",
  },
  "LOW": {
    label: "Low Autonomy",
    description: "Step-by-step collaboration with human approval required for major actions.",
    color: "cyan",
  },
};

// Color mapping for consistent rgba values
export const COLOR_MAP: Record<string, { rgb: string; hex: string }> = {
  violet: { rgb: "139, 92, 246", hex: "#a78bfa" },
  blue: { rgb: "59, 130, 246", hex: "#60a5fa" },
  emerald: { rgb: "16, 185, 129", hex: "#34d399" },
  amber: { rgb: "245, 158, 11", hex: "#fbbf24" },
  rose: { rgb: "244, 63, 94", hex: "#fb7185" },
  cyan: { rgb: "6, 182, 212", hex: "#22d3ee" },
};

// Agent config file types with metadata
export const AGENT_CONFIG_TYPES = [
  {
    key: "has_claude_md" as const,
    name: "CLAUDE.md",
    agent: "Claude Code",
    description: "Project instructions and context for Claude Code CLI",
  },
  {
    key: "has_agents_md" as const,
    name: "AGENTS.md",
    agent: "Multi-agent",
    description: "General agent instructions for Cursor, Codex, and other AI assistants",
  },
  {
    key: "has_cursorrules" as const,
    name: ".cursorrules",
    agent: "Cursor",
    description: "Project configuration for Cursor AI IDE",
  },
  {
    key: "has_windsurfrules" as const,
    name: ".windsurfrules",
    agent: "Windsurf",
    description: "Configuration and memories for Windsurf Cascade AI",
  },
] as const;

export type AgentConfigKey = typeof AGENT_CONFIG_TYPES[number]["key"];

// Framework-specific workflow configuration
// Each framework has its own workflow derived from actual documentation
export interface WorkflowStep {
  id: string;
  command: string;        // The actual CLI command or action
  humanDecision: string;  // What the human decides at this step
  aiAction: string;       // What the AI does after the human decision
  artifact?: string;      // What gets created (optional)
}

export interface FrameworkWorkflow {
  philosophy: string;     // One-liner about the approach
  steps: WorkflowStep[];
}

// Framework workflows keyed by framework slug
export const FRAMEWORK_WORKFLOWS: Record<string, FrameworkWorkflow> = {
  "claude-flow": {
    philosophy: "Orchestrate multi-agent swarms that divide, coordinate, and conquer in parallel",
    steps: [
      {
        id: "init",
        command: "claude-flow init",
        humanDecision: "Pick mode: --verify, --pair, or --enhanced",
        aiAction: "Creates CLAUDE.md with swarm orchestration patterns",
        artifact: "CLAUDE.md",
      },
      {
        id: "hive",
        command: "claude-flow hive init",
        humanDecision: "Choose topology (mesh/hierarchical/star/ring) and agent count",
        aiAction: "Initializes swarm with selected coordination pattern",
        artifact: "Swarm config",
      },
      {
        id: "orchestrate",
        command: "claude-flow orchestrate",
        humanDecision: "Describe task in natural language",
        aiAction: "Distributes work across agents, executes in parallel",
        artifact: "Generated code",
      },
      {
        id: "review",
        command: "Review & approve",
        humanDecision: "Approve outputs or request changes",
        aiAction: "Applies changes or rolls back if verification fails",
        artifact: "Final output",
      },
    ],
  },
};

/**
 * Generate consistent color styles for methodology/autonomy cards.
 */
export function getColorStyles(colorName: string, bgOpacity = 0.05, borderOpacity = 0.2, iconBgOpacity = 0.15) {
  const color = COLOR_MAP[colorName] || COLOR_MAP.cyan;
  return {
    card: {
      backgroundColor: `rgba(${color.rgb}, ${bgOpacity})`,
      borderColor: `rgba(${color.rgb}, ${borderOpacity})`,
    },
    iconBg: {
      backgroundColor: `rgba(${color.rgb}, ${iconBgOpacity})`,
    },
    iconColor: color.hex,
  };
}

/**
 * Get methodology display config, returns null if not found.
 */
export function getMethodologyConfig(methodology: string | null | undefined) {
  if (!methodology) return null;
  return METHODOLOGY_CONFIG[methodology] || null;
}

/**
 * Get autonomy level display config, returns null if not found.
 */
export function getAutonomyConfig(autonomyLevel: string | null | undefined) {
  if (!autonomyLevel) return null;
  return AUTONOMY_CONFIG[autonomyLevel] || null;
}

/**
 * Get framework-specific workflow, returns null if not found.
 * Keyed by framework slug (e.g., "claude-flow").
 */
export function getFrameworkWorkflow(slug: string | null | undefined): FrameworkWorkflow | null {
  if (!slug) return null;
  return FRAMEWORK_WORKFLOWS[slug] || null;
}
