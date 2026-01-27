"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, Star, Copy, Check, ArrowRight, Sparkles, Command } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock framework data - in production, this would come from a hook
const ALL_FRAMEWORKS = [
  {
    id: 1,
    name: "Spec Kit",
    slug: "spec-kit",
    command: "npx spec-kit init",
    stars: 1200,
    description: "Spec-driven development for AI coding agents",
    keywords: ["spec", "planning", "specification", "incremental", "github"],
  },
  {
    id: 2,
    name: "BMAD Method",
    slug: "bmad-method",
    command: "npx bmad-method init",
    stars: 890,
    description: "Breakthrough Method of Agile AI-Driven Development",
    keywords: ["agile", "method", "workflow", "process", "bmad"],
  },
  {
    id: 3,
    name: "Cline Memory Bank",
    slug: "cline-memory",
    command: "npx @anthropic/cline-memory init",
    stars: 756,
    description: "Persistent context and memory for Cline agents",
    keywords: ["memory", "context", "persistence", "cline", "recall"],
  },
  {
    id: 4,
    name: "Roo Code",
    slug: "roo-code",
    command: "npx roo-code init",
    stars: 623,
    description: "Boomerang task orchestration with specialized subagents",
    keywords: ["orchestration", "subagents", "boomerang", "tasks", "delegation"],
  },
  {
    id: 5,
    name: "Claude Architect",
    slug: "claude-architect",
    command: "npx claude-architect init",
    stars: 512,
    description: "System design and architecture planning for large projects",
    keywords: ["architecture", "design", "system", "planning", "structure"],
  },
  {
    id: 6,
    name: "Test First AI",
    slug: "test-first-ai",
    command: "npx test-first-ai init",
    stars: 445,
    description: "TDD-focused framework with automatic test generation",
    keywords: ["testing", "tdd", "test", "quality", "coverage"],
  },
];

// Suggested queries for empty state
const SUGGESTIONS = [
  "plan my features",
  "write tests first",
  "remember context",
  "orchestrate tasks",
];

interface FrameworkResult {
  id: number;
  name: string;
  slug: string;
  command: string;
  stars: number;
  description: string;
  keywords: string[];
}

function ResultCard({
  framework,
  index,
  onCopy
}: {
  framework: FrameworkResult;
  index: number;
  onCopy: (command: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(framework.command);
      setCopied(true);
      onCopy(framework.command);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [framework.command, onCopy]);

  return (
    <Link
      href={`/frameworks/${framework.slug}`}
      className={cn(
        "group block p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30",
        "hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{framework.name}</h3>
            <div className="flex items-center gap-1 text-amber-400/70 text-sm shrink-0">
              <Star size={12} className="fill-current" />
              <span>{framework.stars >= 1000 ? `${(framework.stars / 1000).toFixed(1)}k` : framework.stars}</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-1">{framework.description}</p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            "shrink-0 p-2 rounded-lg border transition-all duration-150",
            "opacity-0 group-hover:opacity-100",
            copied
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          )}
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-zinc-400" />
          )}
        </button>
      </div>

      {/* Install command preview */}
      <div className="mt-3 flex items-center gap-2">
        <code className="text-xs font-mono text-cyan-400/70 truncate">
          {framework.command}
        </code>
        <ArrowRight size={12} className="text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export function SearchConversationHome() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive results from query (no effect needed for derived state)
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(/\s+/);

    return ALL_FRAMEWORKS.filter((fw) => {
      const searchable = [
        fw.name.toLowerCase(),
        fw.description.toLowerCase(),
        ...fw.keywords,
      ].join(" ");

      return searchTerms.every((term) => searchable.includes(term));
    }).sort((a, b) => b.stars - a.stars);
  }, [query]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleCopy = (command: string) => {
    toast.success("Copied to clipboard", {
      description: command,
    });
  };

  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Ambient glow - responds to focus */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          isFocused || hasQuery ? "opacity-40" : "opacity-20"
        )}
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(34, 211, 238, 0.1), transparent)`,
        }}
      />

      {/* Minimal header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            <span className="font-semibold tracking-tight">augs.dev</span>
          </div>
          <Link
            href="/frameworks"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Browse all
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col px-6 relative z-10 transition-all duration-500",
        hasResults ? "pt-8" : "justify-center -mt-20"
      )}>
        <div className="w-full max-w-2xl mx-auto">
          {/* Search input */}
          <div className={cn(
            "relative transition-all duration-500",
            hasResults && "mb-8"
          )}>
            {/* Pre-label */}
            <div className={cn(
              "text-center mb-6 transition-all duration-300",
              (isFocused || hasQuery) && "opacity-0 -translate-y-4 pointer-events-none"
            )}>
              <p className="text-zinc-500 text-lg">
                What do you want your agent to do?
              </p>
            </div>

            {/* Input container */}
            <div className={cn(
              "relative rounded-2xl border transition-all duration-300",
              isFocused || hasQuery
                ? "border-zinc-700 bg-zinc-900/80 shadow-lg shadow-cyan-500/5"
                : "border-zinc-800 bg-zinc-900/50"
            )}>
              <Search
                size={20}
                className={cn(
                  "absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-200",
                  isFocused || hasQuery ? "text-cyan-400" : "text-zinc-600"
                )}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search frameworks..."
                className={cn(
                  "w-full pl-14 pr-14 py-5 bg-transparent rounded-2xl",
                  "text-lg placeholder:text-zinc-600",
                  "focus:outline-none"
                )}
              />
              {/* Keyboard shortcut hint */}
              <div className={cn(
                "absolute right-5 top-1/2 -translate-y-1/2 transition-opacity duration-200",
                (isFocused || hasQuery) ? "opacity-0" : "opacity-100"
              )}>
                <kbd className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-500">
                  <Command size={10} />
                  <span>K</span>
                </kbd>
              </div>
              {/* Clear button */}
              {hasQuery && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-xs text-zinc-500">Clear</span>
                </button>
              )}
            </div>

            {/* Suggestions - only show when empty and not focused */}
            <div className={cn(
              "flex items-center justify-center gap-2 mt-4 transition-all duration-300",
              (hasQuery || isFocused) && "opacity-0 translate-y-2 pointer-events-none"
            )}>
              <span className="text-xs text-zinc-600">Try:</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {hasResults && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 mb-4">
                {results.length} framework{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((framework, index) => (
                <ResultCard
                  key={framework.id}
                  framework={framework}
                  index={index}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}

          {/* No results state */}
          {hasQuery && !hasResults && (
            <div className="text-center py-12 animate-in fade-in duration-300">
              <p className="text-zinc-500 mb-4">No frameworks found for &ldquo;{query}&rdquo;</p>
              <Link
                href="/frameworks"
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Browse all frameworks
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer - only visible when no results */}
      <footer className={cn(
        "relative z-10 px-6 py-8 transition-all duration-500",
        hasResults && "opacity-0 pointer-events-none"
      )}>
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <span><span className="text-zinc-400">12</span> frameworks</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span><span className="text-zinc-400">156</span> skills</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span>Claude, Cursor, Windsurf</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
