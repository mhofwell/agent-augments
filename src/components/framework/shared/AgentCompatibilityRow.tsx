"use client";

import { cn } from "@/lib/utils";
import {
  agents,
  getIncompatibilityReason,
  getIncompatibilityMessage,
  type CompatibleItem,
} from "@/lib/agents";

interface AgentCompatibilityRowProps {
  item: CompatibleItem | null | undefined;
  size?: "sm" | "md" | "lg";
  showTooltips?: boolean;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * Unified agent icon display with grayscale for incompatible agents.
 * Used consistently across cards, modals, and detail pages.
 */
export function AgentCompatibilityRow({
  item,
  size = "md",
  showTooltips = true,
  showLabel = false,
  className,
}: AgentCompatibilityRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Works with:</span>
      )}
      <div className="flex items-center gap-2">
        {agents.map((agent) => {
          const incompatibilityReason = getIncompatibilityReason(item, agent.id);
          const isCompatible = !incompatibilityReason;
          const reasonMessage = getIncompatibilityMessage(incompatibilityReason);

          return (
            <img
              key={agent.id}
              src={agent.icon}
              alt={agent.name}
              title={showTooltips ? (isCompatible ? agent.name : `${agent.name}: ${reasonMessage}`) : undefined}
              className={cn(
                sizeClasses[size],
                "transition-opacity",
                !isCompatible && "opacity-30 grayscale"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
