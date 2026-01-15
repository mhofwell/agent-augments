"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/layout";
import { SearchInput, TypeQuickFilter, FilterPanel, ViewToggle } from "@/components/filters";
import { PluginGrid, PluginModal } from "@/components/plugin";
import { usePlugins, useMarketplaces, useFrameworks, useBookmarks } from "@/hooks";
import type { PluginWithMarketplace, PluginType } from "@/types/database";
import type { SortOption } from "@/hooks";

export function BrowseContent() {
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [type, setType] = useState<PluginType | "All">(
    (searchParams.get("type") as PluginType) || "All"
  );
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [marketplace, setMarketplace] = useState(searchParams.get("marketplace") || "All");
  const [framework, setFramework] = useState(searchParams.get("framework") || "All");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "popular"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithMarketplace | null>(null);

  // Data hooks
  const { plugins, isLoading, pagination } = usePlugins({
    search: search || undefined,
    type: type === "All" ? undefined : type,
    category: category === "All" ? undefined : category,
    marketplace: marketplace === "All" ? undefined : marketplace,
    framework: framework === "All" ? undefined : framework,
    sort: sortBy,
    limit: 50,
  });

  const { marketplaces } = useMarketplaces();
  const { frameworks } = useFrameworks();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  // Get official marketplace IDs
  const officialIds = new Set(
    marketplaces
      .filter((m) => m.github_owner === "anthropics")
      .map((m) => m.id)
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Page Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Plugins</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {pagination.total} plugins across {marketplaces.length} marketplaces
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                <Package size={14} className="text-primary" />
                {pagination.total} Plugins
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                <Layers size={14} className="text-emerald-400" />
                {marketplaces.length} Marketplaces
              </Badge>
            </div>
          </div>

          {/* Search and filters row */}
          <div className="flex items-center gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search plugins, commands, agents..."
              className="flex-1"
            />
            <FilterPanel
              category={category}
              onCategoryChange={setCategory}
              marketplace={marketplace}
              onMarketplaceChange={setMarketplace}
              framework={framework}
              onFrameworkChange={setFramework}
              sortBy={sortBy}
              onSortChange={setSortBy}
              marketplaces={marketplaces}
              frameworks={frameworks}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          {/* Type quick filter */}
          <TypeQuickFilter value={type} onChange={setType} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {plugins.length} of {pagination.total} plugins
          </p>
        </div>

        {/* Plugin grid */}
        <PluginGrid
          plugins={plugins}
          viewMode={viewMode}
          isLoading={isLoading}
          bookmarkedIds={bookmarkedIds}
          officialMarketplaceIds={officialIds}
          onPluginClick={setSelectedPlugin}
          onBookmarkToggle={toggleBookmark}
          emptyMessage="No plugins found"
          emptyDescription="Try adjusting your filters or search query"
        />
      </div>

      {/* Plugin Modal */}
      <PluginModal
        plugin={selectedPlugin}
        open={!!selectedPlugin}
        onOpenChange={(open) => !open && setSelectedPlugin(null)}
        isBookmarked={selectedPlugin ? bookmarkedIds.has(selectedPlugin.id) : false}
        onBookmarkToggle={() => selectedPlugin && toggleBookmark(selectedPlugin.id)}
      />
    </div>
  );
}
