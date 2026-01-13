"use client";

import { useState, useMemo, Suspense } from "react";
import { Package, Zap, Layers, Github, Terminal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AmbientBackground, Header, InstallFooter } from "@/components/layout";
import { PluginGrid, PluginModal } from "@/components/plugin";
import { FrameworkGrid, FrameworkModal } from "@/components/framework";
import { SearchInput, FilterPanel, ViewToggle, TypeQuickFilter } from "@/components/filters";
import { usePlugins, useMarketplaces, useBookmarks, useFrameworkBookmarks, useUrlFilters, useFrameworks } from "@/hooks";
import type { PluginWithMarketplace, Framework } from "@/types/database";
import { agents } from "@/lib/agents";

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
    framework,
    agent,
    sort,
    tab,
    view,
    setSearch,
    setType,
    setCategory,
    setMarketplace,
    setFramework,
    setAgent,
    setSort,
    setTab,
    setView,
  } = useUrlFilters();

  // Local UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithMarketplace | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [frameworkSearch, setFrameworkSearch] = useState("");
  const [frameworkTool, setFrameworkTool] = useState("All");

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
    framework,
    agent,
    sort,
  });

  // For bookmarks tab, use bookmarked plugins
  const displayPlugins = useMemo(() => {
    if (tab === "bookmarks") {
      return bookmarks.map((b) => b.plugin).filter(Boolean) as PluginWithMarketplace[];
    }
    return plugins;
  }, [tab, bookmarks, plugins]);

  // Filter frameworks by search and tool
  const filteredFrameworks = useMemo(() => {
    let result = frameworks;

    if (frameworkSearch) {
      const searchLower = frameworkSearch.toLowerCase();
      result = result.filter(
        (fw) =>
          fw.name.toLowerCase().includes(searchLower) ||
          fw.description?.toLowerCase().includes(searchLower)
      );
    }

    if (frameworkTool !== "All") {
      result = result.filter((fw) => fw.install_tool === frameworkTool);
    }

    return result;
  }, [frameworks, frameworkSearch, frameworkTool]);

  // Get unique install tools for filter dropdown
  const frameworkTools = useMemo(() => {
    const tools = new Set(frameworks.map((fw) => fw.install_tool).filter(Boolean));
    return Array.from(tools).sort();
  }, [frameworks]);

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
        plugins={plugins}
        frameworks={frameworks}
        onPluginSelect={setSelectedPlugin}
        onFrameworkSelect={(framework) => {
          setTab("frameworks");
          setSelectedFramework(framework);
        }}
        onSearch={(query) => {
          setTab("plugins");
          setSearch(query);
        }}
      />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {tab === "plugins" && "Plugins"}
                {tab === "frameworks" && "Frameworks"}
                {tab === "bookmarks" && "Bookmarks"}
              </h2>
              <p className="text-muted-foreground">
                {tab === "plugins" &&
                  `${totalPlugins} plugins across ${totalMarketplaces} marketplaces`}
                {tab === "frameworks" && "Structured methodologies for AI-assisted development"}
                {tab === "bookmarks" && `${bookmarkedIds.size + frameworkBookmarkedIds.size} saved items`}
              </p>
            </div>

            {/* Quick stats */}
            {tab === "plugins" && (
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
                  <span className="font-semibold">{filteredFrameworks.length}</span>
                  <span className="text-xs text-muted-foreground">
                    {filteredFrameworks.length === frameworks.length ? "Frameworks" : `of ${frameworks.length}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters (only show on plugins tab) */}
          {tab === "plugins" && (
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
                  framework={framework}
                  onFrameworkChange={setFramework}
                  sortBy={sort}
                  onSortChange={setSort}
                  marketplaces={marketplaces}
                  frameworks={frameworks}
                  showFilters={showFilters}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                />
                <ViewToggle value={view} onChange={setView} />
              </div>

              {/* Agent selector and quick type filters */}
              <div className="flex items-center gap-3">
                {/* Agent selector (currently only Claude Code) */}
                <Select value={agent} onValueChange={(value) => setAgent(value as typeof agent)}>
                  <SelectTrigger className="w-[140px] bg-secondary border-border">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id} disabled={a.id !== "claude-code"}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: a.color }}
                          />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <TypeQuickFilter value={type} onChange={setType} />
              </div>
            </div>
          )}

          {/* Search and Filters for Frameworks tab */}
          {tab === "frameworks" && (
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  value={frameworkSearch}
                  onChange={(e) => setFrameworkSearch(e.target.value)}
                  placeholder="Search frameworks..."
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              {frameworkTools.length > 1 && (
                <Select value={frameworkTool} onValueChange={setFrameworkTool}>
                  <SelectTrigger className="w-40 bg-secondary border-border">
                    <SelectValue placeholder="All Tools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tools</SelectItem>
                    {frameworkTools.map((tool) => (
                      <SelectItem key={tool} value={tool!}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Featured Section (on plugins tab when no filters and sorted by popular) */}
        {tab === "plugins" &&
          !search &&
          category === "All" &&
          type === "All" &&
          marketplace === "All" &&
          sort === "popular" && (
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
        {(tab === "plugins" || tab === "bookmarks") && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              {tab === "plugins" && `Showing ${displayPlugins.length} plugins`}
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
              frameworks={filteredFrameworks}
              isLoading={frameworksLoading}
              onFrameworkClick={setSelectedFramework}
              bookmarkedIds={frameworkBookmarkedIds}
              onToggleBookmark={toggleFrameworkBookmark}
              emptyMessage={frameworkSearch || frameworkTool !== "All" ? "No frameworks match your filters" : "No frameworks found"}
              emptyDescription={frameworkSearch || frameworkTool !== "All" ? "Try adjusting your search or filters" : "Check back later for development frameworks"}
            />
          </div>
        )}

        {/* Marketplaces Section */}
        {tab === "plugins" && (
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
        onFrameworkClick={(framework) => {
          setSelectedPlugin(null);
          setSelectedFramework(framework);
        }}
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
        onPluginClick={(plugin) => {
          setSelectedFramework(null);
          setSelectedPlugin(plugin);
        }}
      />

      <InstallFooter />
    </div>
  );
}

// Featured section - fetches top plugins by popularity
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
  const { plugins, isLoading } = usePlugins({ sort: "popular", limit: 3 });

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
