"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Search, Shield, Layers, ChevronRight, Sparkles } from "lucide-react";
import { AmbientBackground, SiteHeader, InstallFooter } from "@/components/layout";
import { PluginCard, PluginModal } from "@/components/plugin";
import { FrameworkCard, FrameworkModal } from "@/components/framework";
import { usePlugins, useMarketplaces, useBookmarks, useFrameworkBookmarks, useFrameworks } from "@/hooks";
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
  // Local state
  const [search, setSearch] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithMarketplace | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  // Data hooks
  const { marketplaces, officialIds } = useMarketplaces();
  const { frameworks, isLoading: frameworksLoading } = useFrameworks();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const { bookmarkedIds: frameworkBookmarkedIds, toggleBookmark: toggleFrameworkBookmark } = useFrameworkBookmarks();

  // Fetch plugins - higher limit for better coverage
  const { plugins, isLoading, pagination } = usePlugins({
    search: search || undefined,
    sort: "popular",
    limit: 100, // Fetch more for better section coverage
  });

  // Separate official plugins from community, sorted by install count
  const officialPlugins = useMemo(() => {
    return plugins
      .filter(p => officialIds.has(p.marketplace_id))
      .sort((a, b) => (b.install_count || 0) - (a.install_count || 0));
  }, [plugins, officialIds]);

  const communityPlugins = useMemo(() => {
    return plugins
      .filter(p => !officialIds.has(p.marketplace_id))
      .sort((a, b) => (b.install_count || 0) - (a.install_count || 0));
  }, [plugins, officialIds]);

  // Search results - show when searching
  const searchResults = useMemo(() => {
    if (!search) return [];
    return plugins;
  }, [search, plugins]);

  // Get the selected plugin's official status
  const isSelectedPluginOfficial = selectedPlugin
    ? officialIds.has(selectedPlugin.marketplace_id)
    : false;

  // Count totals - use pagination.total for accurate count
  const totalAugments = pagination.total || plugins.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AmbientBackground />

      <SiteHeader />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Augments for your coding agent
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find curated frameworks, official plugins, and community contributions for Claude Code.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search augments... (e.g. 'PR review', 'documentation', 'testing')"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg"
            />
          </div>
        </section>

        {/* Search Results */}
        {search && (
          <section className="pb-12">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              {searchResults.length} results for "{search}"
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.slice(0, 12).map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isOfficial={officialIds.has(plugin.marketplace_id)}
                    isBookmarked={bookmarkedIds.has(plugin.id)}
                    onClick={() => setSelectedPlugin(plugin)}
                    onBookmarkToggle={() => toggleBookmark(plugin.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No augments found. Try a different search term.
              </p>
            )}
          </section>
        )}

        {/* Main content - only show when not searching */}
        {!search && (
          <>
            {/* Frameworks Section - FIRST */}
            <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Frameworks</h2>
                    <p className="text-sm text-muted-foreground">Collections of augments for common workflows</p>
                  </div>
                </div>
              </div>

              {frameworksLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...frameworks].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 6).map((framework) => (
                    <FrameworkCard
                      key={framework.id}
                      framework={framework}
                      onClick={() => setSelectedFramework(framework)}
                    />
                  ))}
                </div>
              )}

              {frameworks.length > 6 && (
                <button className="mt-4 text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
                  View all {frameworks.length} frameworks
                  <ChevronRight size={16} />
                </button>
              )}
            </section>

            {/* Official Section */}
            <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Shield size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Official</h2>
                    <p className="text-sm text-muted-foreground">From Anthropic's verified marketplace</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-xl bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {officialPlugins.slice(0, 6).map((plugin) => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      isOfficial
                      isBookmarked={bookmarkedIds.has(plugin.id)}
                      onClick={() => setSelectedPlugin(plugin)}
                      onBookmarkToggle={() => toggleBookmark(plugin.id)}
                    />
                  ))}
                </div>
              )}

              {officialPlugins.length > 6 && (
                <Link
                  href="/browse"
                  className="mt-4 text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
                >
                  View all {officialPlugins.length} official augments
                  <ChevronRight size={16} />
                </Link>
              )}
            </section>

            {/* Community Section */}
            <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Sparkles size={20} className="text-violet-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Community</h2>
                    <p className="text-sm text-muted-foreground">From the community marketplaces</p>
                  </div>
                </div>
                {communityPlugins.length > 6 && (
                  <Link
                    href="/browse"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View all {communityPlugins.length}
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityPlugins.slice(0, 6).map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isOfficial={false}
                    isBookmarked={bookmarkedIds.has(plugin.id)}
                    onClick={() => setSelectedPlugin(plugin)}
                    onBookmarkToggle={() => toggleBookmark(plugin.id)}
                  />
                ))}
              </div>

            </section>
          </>
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
