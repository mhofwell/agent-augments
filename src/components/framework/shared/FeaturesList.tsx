"use client";

import { cn } from "@/lib/utils";

interface FeaturesListProps {
  features: string[] | null | undefined;
  maxItems?: number;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Displays features as a bulleted list.
 * Returns null if no features are available.
 */
export function FeaturesList({
  features,
  maxItems,
  variant = "default",
  className,
}: FeaturesListProps) {
  if (!features || features.length === 0) return null;

  const displayFeatures = maxItems ? features.slice(0, maxItems) : features;
  const remaining = maxItems && features.length > maxItems ? features.length - maxItems : 0;

  if (variant === "compact") {
    return (
      <ul className={cn("space-y-1", className)}>
        {displayFeatures.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
            <span className="text-emerald-400 mt-0.5">•</span>
            <span className="line-clamp-1">{feature}</span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="text-xs text-zinc-500 pl-4">
            +{remaining} more features
          </li>
        )}
      </ul>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {displayFeatures.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-zinc-300">
          <span className="text-emerald-400 mt-1">•</span>
          <span>{feature}</span>
        </li>
      ))}
      {remaining > 0 && (
        <li className="text-zinc-500 pl-6">
          +{remaining} more features
        </li>
      )}
    </ul>
  );
}
