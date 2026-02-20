"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Layers, Zap, Command, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { useFrameworks } from "@/hooks";
import { useSkillPublishers } from "@/hooks/useSkillPublishers";
import { useComponentLibraries } from "@/hooks/useComponentLibraries";
import { FrameworkCard } from "@/components/framework/framework-card";
import { ComponentCard } from "@/components/component-libraries/component-card";
import { PublisherCard } from "@/components/skills/publisher-card";
import { AgentCarousel } from "@/components/skills/agent-carousel";

export default function Home() {
  const [search, setSearch] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  // Data hooks
  const { frameworks, isLoading: frameworksLoading } = useFrameworks();
  const { publishers, isLoading: publishersLoading } = useSkillPublishers();
  const { libraries, isLoading: librariesLoading } = useComponentLibraries({ sort: "stars" });

  const isLoading = frameworksLoading || publishersLoading || librariesLoading;
  const hasSearch = search.length > 0;

  // Filter frameworks by search
  const filteredFrameworks = frameworks.filter((fw) => {
    if (!search) return true;
    const searchable = `${fw.name} ${fw.description || ""}`.toLowerCase();
    return searchable.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 211, 238, 0.15), transparent 70%)`,
        }}
      />

      <SiteHeader />

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero + Search */}
        <section className={cn(
          "transition-all duration-500 ease-out",
          hasSearch ? "pt-8 pb-6" : "pt-20 pb-6"
        )}>
          {/* Headline - hide when searching */}
          <div className={cn(
            "text-center transition-all duration-300",
            hasSearch && "opacity-0 h-0 overflow-hidden"
          )}>
            <img
              src="/augments-dark.svg"
              alt="Augments"
              className="h-16 md:h-20 mx-auto mb-4"
            />
            <p className="text-zinc-400 text-lg mb-8">
              Discover frameworks, skills, and tools for your AI coding assistant
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-3xl mx-auto">
            <div className={cn(
              "relative rounded-2xl border transition-all duration-200",
              (hasSearch || inputFocused)
                ? "border-zinc-700 bg-zinc-900/80 shadow-lg shadow-cyan-500/5"
                : "border-zinc-800 bg-zinc-900/50"
            )}>
              <Search
                size={20}
                className={cn(
                  "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
                  hasSearch ? "text-cyan-400" : "text-zinc-600"
                )}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Search augments..."
                className="w-full pl-14 pr-14 py-4 bg-transparent rounded-2xl text-lg placeholder:text-zinc-600 focus:outline-none"
              />
              {!hasSearch && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <kbd className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-500">
                    <Command size={10} />
                    <span>K</span>
                  </kbd>
                </div>
              )}
              {hasSearch && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800"
                >
                  <X size={16} className="text-zinc-500" />
                </button>
              )}
            </div>
          </div>

        </section>

        {/* Active filter indicator */}
        {hasSearch && (
          <section className="pb-4">
            <p className="text-xs text-zinc-500">
              {isLoading ? "Searching..." : `${filteredFrameworks.length} frameworks found`}
            </p>
          </section>
        )}

        {/* Search Results - Frameworks only */}
        {hasSearch && (
          <section className="pb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFrameworks.slice(0, 12).map((fw) => (
                <FrameworkCard
                  key={fw.id}
                  framework={fw}
                                  />
              ))}
            </div>
            {filteredFrameworks.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No frameworks match your search
              </div>
            )}
          </section>
        )}

        {/* Agent carousel - trust bar between hero and content */}
        {!hasSearch && (
          <section className="pb-8 -mx-6">
            <AgentCarousel />
          </section>
        )}

        {/* Default state - Featured sections */}
        {!hasSearch && (
          <>
            {/* Featured Frameworks */}
            <section className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lime-500/10">
                    <Layers size={18} className="text-lime-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Popular Frameworks</h2>
                    <p className="text-xs text-zinc-500">Complete development setups</p>
                  </div>
                </div>
                <Link href="/frameworks" className="text-sm text-lime-400 hover:underline">
                  View all
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworks.slice(0, 3).map((fw) => (
                  <FrameworkCard
                    key={fw.id}
                    framework={fw}
                                      />
                ))}
              </div>
            </section>

            {/* Official Skills */}
            {publishers.length > 0 && (
              <section className="pb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Zap size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Official Skills</h2>
                      <p className="text-xs text-zinc-500">From Vercel, Railway, Stripe & more</p>
                    </div>
                  </div>
                  <Link href="/skills" className="text-sm text-cyan-400 hover:underline">
                    View all
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishers.slice(0, 3).map((pub) => (
                    <PublisherCard key={pub.id} publisher={pub} />
                  ))}
                </div>
              </section>
            )}

            {/* Component Libraries */}
            {libraries.length > 0 && (
              <section className="pb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Palette size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Component Libraries</h2>
                      <p className="text-xs text-zinc-500">UI augments for building interfaces</p>
                    </div>
                  </div>
                  <Link href="/components" className="text-sm text-violet-400 hover:underline">
                    View all
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {libraries.slice(0, 3).map((lib) => (
                    <ComponentCard
                      key={lib.id}
                      library={lib}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <SiteFooter />

    </div>
  );
}
