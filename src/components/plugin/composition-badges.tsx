import { memo } from "react";
import { Sparkles, Bot, Command, Webhook, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PluginComposition } from "@/types/database";

interface CompositionBadgesProps {
  composition: PluginComposition | null;
  className?: string;
  expanded?: boolean;
}

// Config for each composition type
const compositionConfig = {
  skills: {
    icon: Sparkles,
    label: "skill",
    colorClass: "text-type-skill",
  },
  commands: {
    icon: Command,
    label: "command",
    colorClass: "text-type-command",
  },
  agents: {
    icon: Bot,
    label: "agent",
    colorClass: "text-type-agent",
  },
  hooks: {
    icon: Webhook,
    label: "hook",
    colorClass: "text-type-hook",
  },
  mcp: {
    icon: Server,
    label: "MCP server",
    colorClass: "text-type-command", // emerald - servers/tools are command-like
  },
} as const;

type CompositionKey = keyof typeof compositionConfig;

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

export const CompositionBadges = memo(function CompositionBadges({ composition, className, expanded = false }: CompositionBadgesProps) {
  if (!composition) return null;

  // Get non-zero composition items
  const items = (Object.keys(compositionConfig) as CompositionKey[])
    .filter((key) => composition[key] && composition[key]! > 0)
    .map((key) => ({
      key,
      count: composition[key]!,
      config: compositionConfig[key],
    }));

  if (items.length === 0) return null;

  if (expanded) {
    // Expanded view for modal - shows icons with labels
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {items.map(({ key, count, config }) => {
          const Icon = config.icon;
          return (
            <span
              key={key}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                "bg-secondary/50 border border-border",
                config.colorClass
              )}
            >
              <Icon size={12} />
              {count} {pluralize(count, config.label)}
            </span>
          );
        })}
      </div>
    );
  }

  // Compact view for card - inline text format
  return (
    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {items.map(({ key, count, config }, index) => {
        const Icon = config.icon;
        return (
          <span key={key} className="flex items-center gap-1">
            {index > 0 && <span className="text-border">·</span>}
            <Icon size={10} className={config.colorClass} />
            <span>{count}</span>
          </span>
        );
      })}
    </div>
  );
});
