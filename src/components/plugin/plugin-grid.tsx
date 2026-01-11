"use client";

import { cn } from "@/lib/utils";
import { PluginCard } from "./plugin-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import type { PluginWithMarketplace } from "@/types/database";

interface PluginGridProps {
  plugins: PluginWithMarketplace[];
  viewMode?: "grid" | "list";
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  bookmarkedIds?: Set<string>;
  officialMarketplaceIds?: Set<string>;
  onPluginClick?: (plugin: PluginWithMarketplace) => void;
  onBookmarkToggle?: (pluginId: string) => void;
}

export function PluginGrid({
  plugins,
  viewMode = "grid",
  isLoading = false,
  emptyMessage = "No plugins found",
  emptyDescription = "Try adjusting your filters or search query",
  bookmarkedIds = new Set(),
  officialMarketplaceIds = new Set(),
  onPluginClick,
  onBookmarkToggle,
}: PluginGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          viewMode === "grid"
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PluginCardSkeleton key={i} compact={viewMode === "list"} />
        ))}
      </div>
    );
  }

  // Empty state
  if (plugins.length === 0) {
    return (
      <div className="text-center py-16">
        <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-muted-foreground/70">{emptyDescription}</p>
      </div>
    );
  }

  // Check if a plugin is "new" (updated in last 7 days)
  const isNewPlugin = (plugin: PluginWithMarketplace) => {
    if (!plugin.updated_at) return false;
    const updated = new Date(plugin.updated_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return updated > weekAgo;
  };

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
      )}
    >
      {plugins.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          compact={viewMode === "list"}
          isNew={isNewPlugin(plugin)}
          isOfficial={officialMarketplaceIds.has(plugin.marketplace_id)}
          isBookmarked={bookmarkedIds.has(plugin.id)}
          onClick={() => onPluginClick?.(plugin)}
          onBookmarkToggle={
            onBookmarkToggle ? () => onBookmarkToggle(plugin.id) : undefined
          }
        />
      ))}
    </div>
  );
}

function PluginCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "bg-card/50 border border-border rounded-xl",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        {!compact && <Skeleton className="h-4 w-1/2" />}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </div>
  );
}
