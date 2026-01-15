"use client";

import { useRef } from "react";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { PluginCard } from "@/components/plugin";
import { getCategoryDisplayName } from "@/lib/publishers";
import type { PluginWithMarketplace } from "@/types/database";

interface CategorySectionProps {
  category: string;
  plugins: PluginWithMarketplace[];
  totalCount: number;
  bookmarkedIds: Set<string>;
  officialMarketplaceIds: Set<string>;
  onPluginClick: (plugin: PluginWithMarketplace) => void;
  onBookmarkToggle: (id: string) => void;
  onViewAll: () => void;
}

export function CategorySection({
  category,
  plugins,
  totalCount,
  bookmarkedIds,
  officialMarketplaceIds,
  onPluginClick,
  onBookmarkToggle,
  onViewAll,
}: CategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 340; // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (plugins.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{getCategoryDisplayName(category)}</h3>
          <span className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "plugin" : "plugins"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll buttons - only show if we have more than 3 plugins */}
          {plugins.length > 3 && (
            <div className="hidden md:flex items-center gap-1 mr-2">
              <button
                onClick={() => scroll("left")}
                className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* View all link */}
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="flex-shrink-0 w-[320px] snap-start"
          >
            <PluginCard
              plugin={plugin}
              compact
              isBookmarked={bookmarkedIds.has(plugin.id)}
              isOfficial={officialMarketplaceIds.has(plugin.marketplace_id)}
              onClick={() => onPluginClick(plugin)}
              onBookmarkToggle={() => onBookmarkToggle(plugin.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Component to render multiple category sections
interface CategoryBrowseProps {
  pluginsByCategory: Map<string, PluginWithMarketplace[]>;
  categoryTotals: Map<string, number>;
  bookmarkedIds: Set<string>;
  officialMarketplaceIds: Set<string>;
  onPluginClick: (plugin: PluginWithMarketplace) => void;
  onBookmarkToggle: (id: string) => void;
  onCategorySelect: (category: string) => void;
  isLoading?: boolean;
}

export function CategoryBrowse({
  pluginsByCategory,
  categoryTotals,
  bookmarkedIds,
  officialMarketplaceIds,
  onPluginClick,
  onBookmarkToggle,
  onCategorySelect,
  isLoading = false,
}: CategoryBrowseProps) {
  // Sort categories by total count (most popular first)
  const sortedCategories = Array.from(pluginsByCategory.entries())
    .sort((a, b) => (categoryTotals.get(b[0]) || 0) - (categoryTotals.get(a[0]) || 0));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No categories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedCategories.map(([category, plugins]) => (
        <CategorySection
          key={category}
          category={category}
          plugins={plugins.slice(0, 6)} // Show max 6 per category
          totalCount={categoryTotals.get(category) || plugins.length}
          bookmarkedIds={bookmarkedIds}
          officialMarketplaceIds={officialMarketplaceIds}
          onPluginClick={onPluginClick}
          onBookmarkToggle={onBookmarkToggle}
          onViewAll={() => onCategorySelect(category)}
        />
      ))}
    </div>
  );
}
