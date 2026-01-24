"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UseCasesBadgesProps {
  useCases: string[] | null | undefined;
  variant?: "default" | "compact";
  maxItems?: number;
  className?: string;
}

/**
 * Displays use cases as styled badges.
 * Returns null if no use cases are available.
 */
export function UseCasesBadges({
  useCases,
  variant = "default",
  maxItems,
  className,
}: UseCasesBadgesProps) {
  if (!useCases || useCases.length === 0) return null;

  const displayCases = maxItems ? useCases.slice(0, maxItems) : useCases;
  const remaining = maxItems && useCases.length > maxItems ? useCases.length - maxItems : 0;

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {displayCases.map((useCase, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 px-2 py-0.5 text-xs"
          >
            {useCase}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge
            variant="secondary"
            className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50 px-2 py-0.5 text-xs"
          >
            +{remaining} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayCases.map((useCase, i) => (
        <Badge
          key={i}
          variant="secondary"
          className="bg-zinc-800/50 text-zinc-300 border-zinc-700/50 px-3 py-1.5"
        >
          {useCase}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge
          variant="secondary"
          className="bg-zinc-800/50 text-zinc-500 border-zinc-700/50 px-3 py-1.5"
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}
