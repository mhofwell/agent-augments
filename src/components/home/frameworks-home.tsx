"use client";

import { useState } from "react";
import { Search, Star, Check, Github, Terminal, Sparkles, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useFrameworks } from "@/hooks";
import type { Framework } from "@/types/database";

// Primary button - dark filled
function PrimaryButton({
  children,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-sm text-white transition-colors cursor-pointer"
    >
      {Icon && <Icon size={16} className="text-zinc-400" />}
      {children}
    </button>
  );
}

// Secondary button - subtle outline
function SecondaryButton({
  children,
  href,
  icon: Icon,
}: {
  children: React.ReactNode;
  href: string;
  icon?: React.ElementType;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
    >
      {Icon && <Icon size={16} />}
      {children}
    </a>
  );
}

// Verified organizations
const VERIFIED_ORGS = new Set([
  "github",
  "anthropics",
  "anthropic",
  "EveryInc",
  "openai",
]);

// Check if an author is verified (case-insensitive)
function isVerified(author: string | null): boolean {
  if (!author) return false;
  return VERIFIED_ORGS.has(author) || VERIFIED_ORGS.has(author.toLowerCase());
}

// Extract author/org from GitHub URL
function extractAuthor(githubUrl: string | null): string | null {
  if (!githubUrl) return null;
  const match = githubUrl.match(/github\.com\/([^\/]+)/);
  return match ? match[1] : null;
}

// Minimal framework card with Every.to style buttons
function FrameworkCard({ framework }: { framework: Framework }) {
  const [copied, setCopied] = useState(false);
  const author = extractAuthor(framework.github_url);

  const copyCommand = async () => {
    if (framework.install_command) {
      try {
        await navigator.clipboard.writeText(framework.install_command);
        setCopied(true);
        toast.success("Install command copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  return (
    <div className="group border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className="text-lg font-semibold text-white">
          {framework.name}
        </h3>
        {framework.stars && framework.stars > 0 && (
          <div className="flex items-center gap-1 text-zinc-500 text-sm shrink-0">
            <Star size={14} className="fill-zinc-500" />
            <span>{framework.stars >= 1000 ? `${(framework.stars / 1000).toFixed(1)}k` : framework.stars}</span>
          </div>
        )}
      </div>

      {/* Author */}
      {author && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
          <span>by</span>
          <span className="text-zinc-400">{author}</span>
          {isVerified(author) && (
            <BadgeCheck size={14} className="text-yellow-500 fill-yellow-500/20" />
          )}
        </div>
      )}

      {/* Description */}
      <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
        {framework.description}
      </p>

      {/* Agent compatibility */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs text-zinc-500">Works with:</span>
        <div className="flex items-center gap-2">
          <img src="/claude-star-dark.svg" alt="Claude" className="h-4 w-4 opacity-70" />
          <img src="/openai-dark.svg" alt="OpenAI" className="h-4 w-4 opacity-70" />
          <img src="/cursor-dark.svg" alt="Cursor" className="h-4 w-4 opacity-70" />
          <img src="/windsurf-dark.svg" alt="Windsurf" className="h-4 w-4 opacity-70" />
        </div>
      </div>

      {/* Action buttons - Every.to style */}
      <div className="flex flex-wrap items-center gap-2">
        {framework.install_command && (
          <PrimaryButton onClick={copyCommand} icon={copied ? Check : Terminal}>
            {copied ? "Copied" : "Install"}
          </PrimaryButton>
        )}
        {framework.github_url && (
          <SecondaryButton href={framework.github_url} icon={Github}>
            GitHub
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

// Spec Kit install command
const SPEC_KIT_INSTALL = "npx spec-kit init";

export function FrameworksHome() {
  const [search, setSearch] = useState("");
  const [featuredCopied, setFeaturedCopied] = useState(false);
  const { frameworks, isLoading } = useFrameworks();

  const copyFeaturedCommand = async () => {
    try {
      await navigator.clipboard.writeText(SPEC_KIT_INSTALL);
      setFeaturedCopied(true);
      toast.success("Install command copied to clipboard");
      setTimeout(() => setFeaturedCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Filter frameworks by search
  const filteredFrameworks = frameworks.filter((f) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(searchLower) ||
      f.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">Agentic Frameworks</h1>
            <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">Frameworks</a>
              <a href="#" className="hover:text-white transition-colors">Compare</a>
              <a href="#" className="hover:text-white transition-colors">Submit</a>
            </nav>
          </div>
          <a
            href="https://github.com"
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero - two column layout */}
        <section className="py-16 md:py-24 grid md:grid-cols-2 gap-12 items-start">
          {/* Left column - Title and description */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Find your agentic framework
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Battle-tested development systems for AI-assisted coding.
              Like React and Vue for JavaScript—opinionated, complete solutions
              for Claude Code, Codex, and other AI agents.
            </p>

            {/* Agent logos */}
            <div className="flex flex-wrap items-center gap-6">
              <img src="/claude-full-dark.svg" alt="Claude" className="h-6 opacity-80 hover:opacity-100 transition-opacity" />
              <img src="/openai-full-dark.svg" alt="OpenAI" className="h-6 opacity-80 hover:opacity-100 transition-opacity" />
              <img src="/cursor-full-dark.svg" alt="Cursor" className="h-6 opacity-80 hover:opacity-100 transition-opacity" />
              <img src="/windsurf-full-dark.svg" alt="Windsurf" className="h-6 opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Right column - Featured framework */}
          <div className="group/featured relative rounded-xl border border-zinc-700 hover:border-white/80 transition-colors duration-300">
            <div className="rounded-xl p-6 h-full">
            {/* Content wrapper */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-white">
                <Sparkles size={14} />
                <span className="uppercase tracking-wide font-medium">Featured</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500 text-sm">
                <Star size={14} className="fill-zinc-500" />
                <span>1.2k</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">Spec Kit</h3>
            <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
              <span>by</span>
              <span className="text-zinc-400">GitHub</span>
              <BadgeCheck size={14} className="text-yellow-500 fill-yellow-500/20" />
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              Toolkit for spec-driven development with AI coding agents.
              Define structured specifications, let your agent build incrementally.
              Includes slash commands for planning, building, and reviewing.
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-zinc-500">Works with:</span>
              <div className="flex items-center gap-2">
                <img src="/claude-star-dark.svg" alt="Claude" className="h-4 w-4 opacity-70" />
                <img src="/openai-dark.svg" alt="OpenAI" className="h-4 w-4 opacity-70" />
                <img src="/cursor-dark.svg" alt="Cursor" className="h-4 w-4 opacity-70" />
                <img src="/windsurf-dark.svg" alt="Windsurf" className="h-4 w-4 opacity-70" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton onClick={copyFeaturedCommand} icon={featuredCopied ? Check : Terminal}>
                {featuredCopied ? "Copied" : "Install"}
              </PrimaryButton>
              <SecondaryButton href="https://github.com/github/spec-kit" icon={Github}>
                GitHub
              </SecondaryButton>
            </div>
            </div>
          </div>
        </section>

        {/* Search row with count on right */}
        <section className="flex items-center justify-between gap-6 pb-8 border-b border-zinc-800 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search frameworks..."
              className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div className="text-sm text-zinc-400">
            <span className="text-white font-semibold">{frameworks.length}</span> frameworks
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
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-zinc-500">
          Curated with care. Submit a framework on GitHub.
        </div>
      </footer>
    </div>
  );
}
