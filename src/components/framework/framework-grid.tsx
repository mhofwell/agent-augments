"use client";

import { FrameworkCard } from "./framework-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import type { Framework } from "@/types/database";

interface FrameworkGridProps {
  frameworks: Framework[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onFrameworkClick?: (framework: Framework) => void;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (frameworkId: string) => void;
}

export function FrameworkGrid({
  frameworks,
  isLoading = false,
  emptyMessage = "No frameworks found",
  emptyDescription = "Check back later for development frameworks",
  onFrameworkClick,
  bookmarkedIds,
  onToggleBookmark,
}: FrameworkGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <FrameworkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (frameworks.length === 0) {
    return (
      <div className="text-center py-16">
        <Layers size={48} className="mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-muted-foreground/70">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {frameworks.map((framework) => (
        <FrameworkCard
          key={framework.id}
          framework={framework}
          onClick={() => onFrameworkClick?.(framework)}
          isBookmarked={bookmarkedIds?.has(framework.id)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
}

function FrameworkCardSkeleton() {
  return (
    <div className="bg-card/50 border border-border rounded-xl p-5 border-l-[3px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-1.5 mb-4">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
