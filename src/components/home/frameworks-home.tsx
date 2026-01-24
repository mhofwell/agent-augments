"use client";

import { useState } from "react";
import { Search, ArrowUpDown, ChevronDown, X } from "lucide-react";
import { SiteHeader } from "@/components/layout";
import { AgentCarousel } from "@/components/skills/agent-carousel";
import { FrameworkCard } from "@/components/framework/framework-card";
import { useFrameworks } from "@/hooks";

export function FrameworksHome() {
  const [search, setSearch] = useState("");
  const { frameworks, isLoading } = useFrameworks();

  // Sort state
  type SortOption = "stars" | "name" | "updated";
  const [sortBy, setSortBy] = useState<SortOption>("stars");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "stars", label: "Most Stars" },
    { value: "name", label: "Name (A-Z)" },
    { value: "updated", label: "Recently Updated" },
  ];

  // Featured framework is the one with lowest sort_order (or first by stars)
  const featuredFramework = frameworks.length > 0
    ? [...frameworks].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0]
    : null;

  // Filter and sort frameworks
  const filteredFrameworks = frameworks
    .filter((f) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(searchLower) ||
        f.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return (b.stars ?? 0) - (a.stars ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
          return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-lime-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/5 via-transparent to-transparent pointer-events-none" />

      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Hero - two column layout */}
        <section className="pt-16 md:pt-24 pb-2 grid md:grid-cols-2 gap-12 items-start">
          {/* Left column - Title and description */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Equip your agent with superpowers
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Frameworks are packages of workflows, skills, MCPs and more bundled together for your agent.
            </p>

          </div>

          {/* Right column - Featured framework */}
          {featuredFramework ? (
            <FrameworkCard framework={featuredFramework} featured />
          ) : (
            <div className="rounded-xl border border-zinc-800 p-6 bg-zinc-900/50 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-20 mb-4" />
              <div className="h-6 bg-zinc-800 rounded w-32 mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          )}
        </section>

        {/* Agent carousel */}
        <AgentCarousel />

        {/* Header with search and sort */}
        <section className="flex flex-col gap-4 pb-8 border-b border-zinc-800 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">All Frameworks</h3>
              <div className="text-sm text-zinc-400">
                <span className="text-white font-semibold">{filteredFrameworks.length}</span> frameworks
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortMenuOpen(!sortMenuOpen)}
                  onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                >
                  <ArrowUpDown size={14} />
                  <span className="hidden sm:inline">{sortOptions.find(o => o.value === sortBy)?.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
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
                          sortBy === option.value ? "text-lime-400" : "text-zinc-400 hover:text-white"
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
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search frameworks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Framework grid */}
        <section className="pb-24">
          {isLoading ? (
            <div className="text-zinc-500">Loading frameworks...</div>
          ) : filteredFrameworks.length === 0 ? (
            <div className="text-zinc-500">No frameworks found</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredFrameworks.map((framework) => (
                <FrameworkCard key={framework.id} framework={framework} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-zinc-500">
          Curated with care. Submit a framework on GitHub.
        </div>
      </footer>
    </div>
  );
}
