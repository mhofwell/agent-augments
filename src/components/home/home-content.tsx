"use client";

import { useState, useMemo, Suspense } from "react";
import { Package, Zap, Layers, Github, Terminal } from "lucide-react";
import { AmbientBackground, Header, InstallFooter } from "@/components/layout";
import { PluginGrid, PluginModal } from "@/components/plugin";
import { FrameworkGrid, FrameworkModal } from "@/components/framework";
import { SearchInput, FilterPanel, ViewToggle } from "@/components/filters";
import { usePlugins, useMarketplaces, useBookmarks, useFrameworkBookmarks, useUrlFilters, useFrameworks } from "@/hooks";
import type { PluginWithMarketplace, Framework } from "@/types/database";

// Wrap with Suspense for useSearchParams
export function HomeContent() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContentInner />
    </Suspense>
  );
}

function HomeLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function HomeContentInner() {
  // URL-based filters
  const {
    search,
    type,
    category,
    marketplace,
    sort,
    tab,
    view,
    setSearch,
    setType,
    setCategory,
    setMarketplace,
    setSort,
    setTab,
    setView,
  } = useUrlFilters();

  // Local UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithMarketplace | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  // Data hooks
  const { marketplaces, officialIds } = useMarketplaces();
  const { frameworks, isLoading: frameworksLoading } = useFrameworks();
  const { bookmarks, bookmarkedIds, toggleBookmark, isLoading: bookmarksLoading } = useBookmarks();
  const { bookmarkedIds: frameworkBookmarkedIds, toggleBookmark: toggleFrameworkBookmark } = useFrameworkBookmarks();

  // Fetch plugins based on current filters
  const { plugins, isLoading, pagination } = usePlugins({
    search,
    type,
    category,
    marketplace,
    sort,
    tab: tab === "bookmarks" ? "discover" : tab,
  });

  // For bookmarks tab, use bookmarked plugins
  const displayPlugins = useMemo(() => {
    if (tab === "bookmarks") {
      return bookmarks.map((b) => b.plugin).filter(Boolean) as PluginWithMarketplace[];
    }
    return plugins;
  }, [tab, bookmarks, plugins]);

  // Stats
  const totalPlugins = pagination.total || plugins.length;
  const totalMarketplaces = marketplaces.length;

  // Get the selected plugin's official status
  const isSelectedPluginOfficial = selectedPlugin
    ? officialIds.has(selectedPlugin.marketplace_id)
    : false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AmbientBackground />

      <Header
        activeTab={tab}
        onTabChange={setTab}
        bookmarkCount={bookmarkedIds.size}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {tab === "discover" && "Discover Plugins"}
                {tab === "featured" && "Featured Plugins"}
                {tab === "new" && "New Plugins"}
                {tab === "frameworks" && "Development Frameworks"}
                {tab === "bookmarks" && "Your Bookmarks"}
              </h2>
              <p className="text-muted-foreground">
                {tab === "discover" &&
                  `${totalPlugins} plugins across ${totalMarketplaces} marketplaces`}
                {tab === "featured" && "Hand-picked plugins by the community"}
                {tab === "new" && "Recently added plugins"}
                {tab === "frameworks" && "Structured methodologies for AI-assisted development"}
                {tab === "bookmarks" && `${bookmarkedIds.size} saved plugins`}
              </p>
            </div>

            {/* Quick stats */}
            {tab !== "frameworks" && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border">
                  <Package size={16} className="text-primary" />
                  <span className="font-semibold">{totalPlugins}</span>
                  <span className="text-xs text-muted-foreground">Plugins</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border">
                  <Layers size={16} className="text-type-agent" />
                  <span className="font-semibold">{totalMarketplaces}</span>
                  <span className="text-xs text-muted-foreground">Marketplaces</span>
                </div>
              </div>
            )}
            {tab === "frameworks" && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border">
                  <Terminal size={16} className="text-primary" />
                  <span className="font-semibold">{frameworks.length}</span>
                  <span className="text-xs text-muted-foreground">Frameworks</span>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters (only show on discover tab) */}
          {tab === "discover" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search plugins, commands, agents..."
                />
                <FilterPanel
                  category={category}
                  onCategoryChange={setCategory}
                  type={type}
                  onTypeChange={setType}
                  marketplace={marketplace}
                  onMarketplaceChange={setMarketplace}
                  sortBy={sort}
                  onSortChange={setSort}
                  marketplaces={marketplaces}
                  showFilters={showFilters}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                />
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>
          )}
        </div>

        {/* Featured Section (on discover tab when no filters) */}
        {tab === "discover" &&
          !search &&
          category === "All" &&
          type === "All" &&
          marketplace === "All" && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-amber-400" />
                <h3 className="font-semibold">Featured</h3>
              </div>
              <FeaturedSection
                officialIds={officialIds}
                bookmarkedIds={bookmarkedIds}
                onPluginClick={setSelectedPlugin}
                onBookmarkToggle={toggleBookmark}
              />
            </div>
          )}

        {/* Main Plugin Grid */}
        {tab !== "frameworks" && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              {tab === "discover" && `Showing ${displayPlugins.length} plugins`}
              {tab === "featured" && `${displayPlugins.length} featured plugins`}
              {tab === "new" && `${displayPlugins.length} new plugins`}
              {tab === "bookmarks" && `${bookmarkedIds.size} bookmarked plugins`}
            </p>

            <PluginGrid
              plugins={displayPlugins}
              viewMode={view}
              isLoading={tab === "bookmarks" ? bookmarksLoading : isLoading}
              emptyMessage={
                tab === "bookmarks"
                  ? "No bookmarks yet"
                  : "No plugins found"
              }
              emptyDescription={
                tab === "bookmarks"
                  ? "Click on any plugin and bookmark it for quick access"
                  : "Try adjusting your filters or search query"
              }
              bookmarkedIds={bookmarkedIds}
              officialMarketplaceIds={officialIds}
              onPluginClick={setSelectedPlugin}
              onBookmarkToggle={toggleBookmark}
            />
          </div>
        )}

        {/* Frameworks Grid */}
        {tab === "frameworks" && (
          <div className="mb-6">
            <FrameworkGrid
              frameworks={frameworks}
              isLoading={frameworksLoading}
              onFrameworkClick={setSelectedFramework}
              bookmarkedIds={frameworkBookmarkedIds}
              onToggleBookmark={toggleFrameworkBookmark}
            />
          </div>
        )}

        {/* Marketplaces Section */}
        {tab === "discover" && (
          <MarketplacesSection
            marketplaces={marketplaces}
            officialIds={officialIds}
            onMarketplaceClick={(id) => {
              setMarketplace(id);
              setShowFilters(true);
            }}
          />
        )}
      </main>

      {/* Plugin Detail Modal */}
      <PluginModal
        plugin={selectedPlugin}
        open={!!selectedPlugin}
        onOpenChange={(open) => !open && setSelectedPlugin(null)}
        isBookmarked={selectedPlugin ? bookmarkedIds.has(selectedPlugin.id) : false}
        isOfficial={isSelectedPluginOfficial}
        onBookmarkToggle={
          selectedPlugin ? () => toggleBookmark(selectedPlugin.id) : undefined
        }
      />

      {/* Framework Detail Modal */}
      <FrameworkModal
        framework={selectedFramework}
        open={!!selectedFramework}
        onOpenChange={(open) => !open && setSelectedFramework(null)}
        isBookmarked={selectedFramework ? frameworkBookmarkedIds.has(selectedFramework.id) : false}
        onToggleBookmark={
          selectedFramework ? () => toggleFrameworkBookmark(selectedFramework.id) : undefined
        }
      />

      <InstallFooter />
    </div>
  );
}

// Featured section - fetches featured plugins separately
function FeaturedSection({
  officialIds,
  bookmarkedIds,
  onPluginClick,
  onBookmarkToggle,
}: {
  officialIds: Set<string>;
  bookmarkedIds: Set<string>;
  onPluginClick: (plugin: PluginWithMarketplace) => void;
  onBookmarkToggle: (id: string) => void;
}) {
  const { plugins, isLoading } = usePlugins({ tab: "featured", limit: 3 });

  return (
    <PluginGrid
      plugins={plugins}
      viewMode="grid"
      isLoading={isLoading}
      bookmarkedIds={bookmarkedIds}
      officialMarketplaceIds={officialIds}
      onPluginClick={onPluginClick}
      onBookmarkToggle={onBookmarkToggle}
    />
  );
}

// Marketplaces section
function MarketplacesSection({
  marketplaces,
  officialIds,
  onMarketplaceClick,
}: {
  marketplaces: { id: string; name: string | null; github_owner: string; github_repo: string; plugin_count: number | null }[];
  officialIds: Set<string>;
  onMarketplaceClick: (id: string) => void;
}) {
  if (marketplaces.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <Github size={18} className="text-muted-foreground" />
        <h3 className="font-semibold">Marketplaces</h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {marketplaces.map((m) => (
          <button
            key={m.id}
            onClick={() => onMarketplaceClick(m.id)}
            className="group p-4 bg-card/50 border border-border rounded-xl hover:border-border/80 hover:bg-card transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium group-hover:text-primary transition-colors">
                {m.name || `${m.github_owner}/${m.github_repo}`}
              </span>
              {officialIds.has(m.id) && (
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                  Official
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package size={12} />
                {m.plugin_count ?? 0} plugins
              </span>
            </div>
            <code className="block mt-2 text-xs text-muted-foreground/60 truncate font-mono">
              {m.github_owner}/{m.github_repo}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}
