"use client";

import { useState, Suspense, useMemo } from "react";
import {
  Star,
  Sparkles,
  BadgeCheck,
  Check,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  Copy,
  Palette,
  Plug,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { ComponentCard } from "./component-card";
import { ComponentModal } from "./component-modal";
import { AgentCarousel } from "@/components/skills/agent-carousel";
import {
  useComponentLibraries,
  trackComponentInstall,
} from "@/hooks/useComponentLibraries";
import type { ComponentLibrary } from "@/types/database";

// Tech stack icons for libraries
type TechStack = "react" | "tailwind" | "radix";

const LIBRARY_TECH_STACKS: Record<string, TechStack[]> = {
  "shadcn-ui": ["react", "tailwind", "radix"],
  "magic-ui": ["react", "tailwind"],
  "material-ui": ["react"],
  "chakra-ui": ["react"],
  "flowbite": ["tailwind"],
  "daisyui": ["tailwind"],
  "flyonui": ["tailwind"],
  "frontend-design": ["react", "tailwind"],
};

const TECH_ICONS: Record<TechStack, { icon: string; label: string }> = {
  react: { icon: "/react-dark.svg", label: "React" },
  tailwind: { icon: "/tailwind-dark.svg", label: "Tailwind" },
  radix: { icon: "/radix-dark.svg", label: "Radix" },
};

export function ComponentContent() {
  return (
    <Suspense fallback={<ComponentLoading />}>
      <ComponentContentInner />
    </Suspense>
  );
}

function ComponentLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-zinc-500">Loading component libraries...</div>
    </div>
  );
}

function ComponentContentInner() {
  const { libraries, isLoading, error } = useComponentLibraries();
  const [featuredCopied, setFeaturedCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedLibrary, setSelectedLibrary] = useState<ComponentLibrary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sort and filter state
  type SortOption = "stars" | "name" | "updated";
  type FilterOption = "all" | "mcp";
  const [sortBy, setSortBy] = useState<SortOption>("stars");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "stars", label: "Most Stars" },
    { value: "name", label: "Name (A-Z)" },
    { value: "updated", label: "Recently Updated" },
  ];

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mcp", label: "MCP Only" },
  ];

  const openModal = (library: ComponentLibrary) => {
    setSelectedLibrary(library);
    setModalOpen(true);
  };

  // Filter and sort libraries
  const filteredLibraries = useMemo(() => {
    const result = libraries.filter((library) => {
      // Apply filter
      if (filterBy === "mcp" && !library.has_mcp) return false;

      // Apply search
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchesName = library.name.toLowerCase().includes(query);
      const matchesDescription = library.description?.toLowerCase().includes(query);
      const matchesBestFor = library.best_for?.some((b) => b.toLowerCase().includes(query));
      return matchesName || matchesDescription || matchesBestFor;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return (b.github_stars ?? 0) - (a.github_stars ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
          return (
            new Date(b.last_commit_at ?? 0).getTime() -
            new Date(a.last_commit_at ?? 0).getTime()
          );
        default:
          return 0;
      }
    });
  }, [libraries, searchQuery, sortBy, filterBy]);

  // Get featured library (ShadCN or first one)
  const featuredLibrary =
    libraries.find((f) => f.slug === "shadcn-ui") || libraries[0];

  // All libraries for display
  const displayLibraries = filteredLibraries;

  const copyFeaturedCommand = async () => {
    if (featuredLibrary?.mcp_install_command) {
      try {
        await navigator.clipboard.writeText(featuredLibrary.mcp_install_command);
        setFeaturedCopied(true);
        toast.success("Install command copied to clipboard");
        setTimeout(() => setFeaturedCopied(false), 2000);
        trackComponentInstall(featuredLibrary.id, "mcp");
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-violet-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero - two column layout */}
        <section className="pt-16 md:pt-24 pb-2 grid md:grid-cols-2 gap-12 items-start">
          {/* Left column - Title and description */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Component libraries with MCP servers
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Official{" "}
              <a
                href="https://modelcontextprotocol.io/docs/getting-started/intro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 hover:underline transition-colors"
              >
                MCP servers
              </a>{" "}
              for popular component libraries.
              Build beautiful interfaces faster with AI assistance.
            </p>

          </div>

          {/* Right column - Featured library */}
          {featuredLibrary && (
            <div
              className="group/featured relative rounded-xl border border-violet-500/30 hover:border-violet-400/60 transition-all duration-300 featured-glow-violet cursor-pointer"
              onClick={() => openModal(featuredLibrary)}
            >
              <div className="rounded-xl p-6 h-full bg-gradient-to-br from-violet-950/20 via-zinc-900/50 to-transparent">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles size={14} className="text-violet-400 fill-violet-400/30" />
                    <span className="uppercase tracking-wide font-medium shimmer-text">
                      Featured
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400/80 text-sm">
                    <Star size={14} className="fill-amber-400/80" />
                    <span>
                      {featuredLibrary.github_stars
                        ? featuredLibrary.github_stars >= 1000
                          ? `${(featuredLibrary.github_stars / 1000).toFixed(1)}k`
                          : featuredLibrary.github_stars
                        : 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/10">
                    <img src="/shadcn-dark.svg" alt="ShadCN" className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    {featuredLibrary.name}
                    {featuredLibrary.is_official && (
                      <BadgeCheck size={16} className="text-yellow-500 fill-yellow-500/20" />
                    )}
                  </h3>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
                  {featuredLibrary.description}
                </p>

                {/* Tech stack */}
                {LIBRARY_TECH_STACKS[featuredLibrary.slug] && (
                  <div className="flex items-center gap-2 mb-4">
                    {LIBRARY_TECH_STACKS[featuredLibrary.slug].map((tech) => {
                      const { icon, label } = TECH_ICONS[tech];
                      return (
                        <img
                          key={tech}
                          src={icon}
                          alt={label}
                          title={label}
                          className="w-5 h-5"
                        />
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                {featuredLibrary.mcp_install_command && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <code className="flex-1 px-3 py-2 bg-black/50 rounded-lg font-mono text-xs text-violet-400 border border-zinc-800 truncate">
                      {featuredLibrary.mcp_install_command}
                    </code>
                    <button
                      onClick={copyFeaturedCommand}
                      className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
                    >
                      {featuredCopied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} className="text-zinc-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Agent compatibility carousel */}
        <AgentCarousel />

        {/* Libraries header with search, filter, and sort */}
        <section className="flex flex-col gap-4 pb-8 border-b border-zinc-800 mb-8">
          {/* Title and controls row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">All Component Libraries</h3>
              <div className="text-sm text-zinc-400">
                <span className="text-white font-semibold">{filteredLibraries.length}</span>{" "}
                libraries
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                  onBlur={() => setTimeout(() => setFilterMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <Plug size={14} />
                  <span className="hidden sm:inline">
                    {filterOptions.find((o) => o.value === filterBy)?.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${filterMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {filterMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterBy(option.value);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                          filterBy === option.value
                            ? "text-violet-400"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <ArrowUpDown size={14} />
                  <span className="hidden sm:inline">
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${sortMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {sortMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 transition-colors ${
                          sortBy === option.value
                            ? "text-violet-400"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Search input */}
              <div className="relative w-full md:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Search libraries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-24">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-zinc-500">
              <p>Failed to load component libraries: {error}</p>
            </div>
          ) : libraries.length === 0 ? (
            <div className="text-center py-16">
              <Palette size={48} className="mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No component libraries yet</h3>
              <p className="text-zinc-500">
                Component libraries will appear here once they&apos;re synced.
              </p>
            </div>
          ) : filteredLibraries.length === 0 ? (
            <div className="text-center py-16">
              <Search size={48} className="mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-zinc-500 mb-4">
                No libraries match &quot;{searchQuery}&quot;
                {filterBy !== "all" && ` with ${filterBy.toUpperCase()} filter`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayLibraries.map((library) => (
                  <ComponentCard
                    key={library.id}
                    library={library}
                    onClick={() => openModal(library)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      {/* Library Detail Modal */}
      <ComponentModal
        library={selectedLibrary}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
