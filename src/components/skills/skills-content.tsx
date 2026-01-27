"use client";

import { useState, Suspense, useMemo } from "react";
import { Star, Verified, BookOpen, ArrowLeft, Sparkles, BadgeCheck, Check, Search, X, ArrowUpDown, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/layout";
import { PublisherCard } from "./publisher-card";
import { SkillCard } from "./skill-card";
import { SkillModal } from "./skill-modal";
import { AgentCarousel } from "./agent-carousel";
import { PUBLISHER_LOGOS } from "./publisher-logos";
import { formatStars } from "@/components/plugin/plugin-utils";
import { useSkillPublishers, type SkillPublisherWithSkills } from "@/hooks/useSkillPublishers";
import type { PublisherSkill } from "@/types/database";

export function SkillsContent() {
  return (
    <Suspense fallback={<SkillsLoading />}>
      <SkillsContentInner />
    </Suspense>
  );
}

function SkillsLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-zinc-500">Loading skills...</div>
    </div>
  );
}

function SkillsContentInner() {
  const { publishers, isLoading, error } = useSkillPublishers();
  const [selectedPublisher, setSelectedPublisher] = useState<SkillPublisherWithSkills | null>(null);
  const [featuredCopied, setFeaturedCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Skill modal state
  const [selectedSkill, setSelectedSkill] = useState<PublisherSkill | null>(null);
  const [skillModalPublisher, setSkillModalPublisher] = useState<SkillPublisherWithSkills | null>(null);
  const [skillModalOpen, setSkillModalOpen] = useState(false);

  // Sort state
  type SortOption = "stars" | "skills" | "name" | "updated";
  const [sortBy, setSortBy] = useState<SortOption>("stars");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "stars", label: "Most Stars" },
    { value: "skills", label: "Most Skills" },
    { value: "name", label: "Name (A-Z)" },
    { value: "updated", label: "Recently Updated" },
  ];

  const openSkillModal = (skill: PublisherSkill, publisher: SkillPublisherWithSkills) => {
    setSelectedSkill(skill);
    setSkillModalPublisher(publisher);
    setSkillModalOpen(true);
  };

  // Filter and sort publishers
  const filteredPublishers = useMemo(() => {
    const result = publishers.filter((publisher) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const matchesName = publisher.name.toLowerCase().includes(query);
      const matchesOrg = publisher.github_org.toLowerCase().includes(query);
      const matchesDescription = publisher.description?.toLowerCase().includes(query);
      const matchesSkills = publisher.skills?.some((skill) =>
        skill.name.toLowerCase().includes(query) || skill.description?.toLowerCase().includes(query)
      );
      return matchesName || matchesOrg || matchesDescription || matchesSkills;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return (b.github_stars ?? 0) - (a.github_stars ?? 0);
        case "skills":
          return (b.skills?.length ?? 0) - (a.skills?.length ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "updated":
          return new Date(b.last_commit_at ?? 0).getTime() - new Date(a.last_commit_at ?? 0).getTime();
        default:
          return 0;
      }
    });
  }, [publishers, searchQuery, sortBy]);

  // Get featured publisher (Vercel or first one)
  const featuredPublisher = publishers.find(p => p.slug === "vercel") || publishers[0];

  const copyFeaturedCommand = async () => {
    if (featuredPublisher) {
      const command = `npx add-skill ${featuredPublisher.github_org}/${featuredPublisher.github_repo}`;
      try {
        await navigator.clipboard.writeText(command);
        setFeaturedCopied(true);
        toast.success("Install command copied to clipboard");
        setTimeout(() => setFeaturedCopied(false), 2000);

        // Track install click
        fetch("/api/skill-publishers/track-install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publisher_id: featuredPublisher.id, type: "publisher" }),
        }).catch(() => {
          // Silently fail - tracking shouldn't block user action
        });
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/5 via-transparent to-transparent pointer-events-none" />

      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {selectedPublisher ? (
          <PublisherDetail
            publisher={selectedPublisher}
            onBack={() => setSelectedPublisher(null)}
            onSkillClick={(skill) => openSkillModal(skill, selectedPublisher)}
          />
        ) : (
          <>
            {/* Hero - two column layout */}
            <section className="pt-16 md:pt-24 pb-2 grid md:grid-cols-2 gap-12 items-start">
              {/* Left column - Title and description */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  Official Skills from trusted publishers
                </h2>
                <p className="text-lg text-zinc-400 mb-8">
                  Powerful skills from companies like Anthropic, Vercel and Railway. Compatible with any agent supporting the{" "}
                  <a href="https://agentskills.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Agent Skills</a> standard.
                </p>

              </div>

              {/* Right column - Featured publisher */}
              {featuredPublisher && (
                <div
                  className="group/featured relative rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 featured-glow cursor-pointer"
                  onClick={() => setSelectedPublisher(featuredPublisher)}
                >
                  <div className="rounded-xl p-6 h-full bg-gradient-to-br from-cyan-950/20 via-zinc-900/50 to-transparent">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles size={14} className="text-cyan-400 fill-cyan-400/30" />
                        <span className="uppercase tracking-wide font-medium shimmer-text">Featured</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400/80 text-sm">
                        <Star size={14} className="fill-amber-400/80" />
                        <span>{formatStars(featuredPublisher.github_stars)}</span>
                      </div>
                    </div>

                    {/* ASCII file tree */}
                    <div className="font-mono text-sm mb-4">
                      {/* Root with publisher name */}
                      <div className="flex items-center gap-2 mb-2">
                        {PUBLISHER_LOGOS[featuredPublisher.slug] && (
                          <img
                            src={PUBLISHER_LOGOS[featuredPublisher.slug]}
                            alt={`${featuredPublisher.name} logo`}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span className="text-white font-semibold">{featuredPublisher.name}</span>
                        {featuredPublisher.is_official && (
                          <BadgeCheck size={12} className="text-yellow-500 fill-yellow-500/20" />
                        )}
                      </div>

                      {/* Skills as file tree */}
                      {featuredPublisher.skills && featuredPublisher.skills.length > 0 && (
                        <div className="ml-2 text-zinc-500">
                          {featuredPublisher.skills.slice(0, 4).map((skill, idx) => {
                            const isLast = idx === Math.min(featuredPublisher.skills!.length, 4) - 1 && featuredPublisher.skills!.length <= 4;
                            return (
                              <div key={skill.id} className="flex items-center leading-6">
                                <span className="text-zinc-700 select-none">{isLast ? "└─" : "├─"}</span>
                                <span className="ml-1 text-cyan-400/80">{skill.name}</span>
                              </div>
                            );
                          })}
                          {featuredPublisher.skills.length > 4 && (
                            <div className="flex items-center leading-6">
                              <span className="text-zinc-700 select-none">└─</span>
                              <span className="ml-1 text-zinc-600">+{featuredPublisher.skills.length - 4} more</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                      {featuredPublisher.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <code className="flex-1 px-3 py-2 bg-black/50 rounded-lg font-mono text-xs text-cyan-400 border border-zinc-800 truncate">
                        npx add-skill {featuredPublisher.github_org}/{featuredPublisher.github_repo}
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
                  </div>
                </div>
              )}
            </section>

            {/* Agent compatibility carousel */}
            <AgentCarousel />

            {/* Publishers header with search and sort */}
            <section className="flex flex-col gap-4 pb-8 border-b border-zinc-800 mb-8">
              {/* Title and controls row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">All Publishers</h3>
                  <div className="text-sm text-zinc-400">
                    <span className="text-white font-semibold">{filteredPublishers.length}</span> publishers · <span className="text-white font-semibold">{filteredPublishers.reduce((acc, p) => acc + (p.skills?.length || 0), 0)}</span> skills
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
                            sortBy === option.value ? "text-cyan-400" : "text-zinc-400 hover:text-white"
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
                    placeholder="Search publishers or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
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
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-48 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>Failed to load skills: {error}</p>
                </div>
              ) : publishers.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen size={48} className="mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No publishers yet</h3>
                  <p className="text-zinc-500">
                    Skill publishers will appear here once they&apos;re synced.
                  </p>
                </div>
              ) : filteredPublishers.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={48} className="mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-zinc-500 mb-4">
                    No publishers or skills match &quot;{searchQuery}&quot;
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredPublishers.map((publisher) => (
                    <PublisherCard
                      key={publisher.id}
                      publisher={publisher}
                      onClick={() => setSelectedPublisher(publisher)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter />

      {/* Skill Detail Modal */}
      <SkillModal
        skill={selectedSkill}
        publisher={skillModalPublisher}
        open={skillModalOpen}
        onOpenChange={setSkillModalOpen}
      />
    </div>
  );
}

interface PublisherDetailProps {
  publisher: SkillPublisherWithSkills;
  onBack: () => void;
  onSkillClick?: (skill: PublisherSkill) => void;
}

function PublisherDetail({ publisher, onBack, onSkillClick }: PublisherDetailProps) {
  const [copied, setCopied] = useState(false);
  const githubUrl = `https://github.com/${publisher.github_org}/${publisher.github_repo}`;
  const installCommand = `npx add-skill ${publisher.github_org}/${publisher.github_repo}`;

  const copyInstallCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);

      // Track install click
      fetch("/api/skill-publishers/track-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisher_id: publisher.id, type: "publisher" }),
      }).catch(() => {});
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to publishers
      </button>

      {/* Publisher header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Logo */}
            {PUBLISHER_LOGOS[publisher.slug] && (
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                <img
                  src={PUBLISHER_LOGOS[publisher.slug]}
                  alt={`${publisher.name} logo`}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold">{publisher.name}</h2>
                {publisher.is_official && (
                  <Verified size={18} className="text-cyan-400" />
                )}
              </div>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {publisher.github_org}/{publisher.github_repo}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={16} className="fill-amber-400" />
            <span className="font-medium">
              {publisher.github_stars?.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-zinc-400 mb-4">{publisher.description}</p>

        {/* Install command */}
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 px-4 py-2.5 bg-black rounded-lg font-mono text-sm border border-zinc-800 overflow-x-auto whitespace-nowrap text-cyan-400">
            {installCommand}
          </code>
          <button
            onClick={copyInstallCommand}
            className="flex-shrink-0 p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
          >
            {copied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} className="text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Skills grid */}
      <h3 className="text-lg font-semibold mb-4">
        Skills ({publisher.skills?.length || 0})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {publisher.skills?.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            publisherOrg={publisher.github_org}
            publisherRepo={publisher.github_repo}
            onClick={() => onSkillClick?.(skill)}
          />
        ))}
      </div>
    </div>
  );
}
