"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, X, Terminal, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPluginTypeConfig } from "@/components/plugin/plugin-utils";
import type { PluginWithMarketplace, Framework, PluginType } from "@/types/database";

const RECENT_SEARCHES_KEY = "agent-augments-recent-searches";
const MAX_RECENT_SEARCHES = 5;

interface UnifiedSearchProps {
  plugins: PluginWithMarketplace[];
  frameworks: Framework[];
  onPluginSelect: (plugin: PluginWithMarketplace) => void;
  onFrameworkSelect: (framework: Framework) => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

interface SearchResult {
  type: "plugin" | "framework";
  item: PluginWithMarketplace | Framework;
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}

export function UnifiedSearch({
  plugins,
  frameworks,
  onPluginSelect,
  onFrameworkSelect,
  onSearchSubmit,
  className,
}: UnifiedSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [queryVersion, setQueryVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle query change - reset index
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(-1);
    setQueryVersion((v) => v + 1);
  }, []);

  // Search results - recompute when query or data changes
  const results: SearchResult[] = useMemo(() => {
    // Use queryVersion to ensure we recompute on query changes
    void queryVersion;
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedFrameworks = frameworks
      .filter(
        (fw) =>
          fw.name.toLowerCase().includes(q) ||
          fw.description?.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((fw) => ({ type: "framework" as const, item: fw }));

    const matchedPlugins = plugins
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({ type: "plugin" as const, item: p }));

    return [...matchedFrameworks, ...matchedPlugins];
  }, [query, queryVersion, frameworks, plugins]);

  const totalResults = results.length;
  const showDropdown = isOpen && (query.trim() || recentSearches.length > 0);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());
      setQuery("");
      setIsOpen(false);
      if (result.type === "framework") {
        onFrameworkSelect(result.item as Framework);
      } else {
        onPluginSelect(result.item as PluginWithMarketplace);
      }
    },
    [query, onFrameworkSelect, onPluginSelect]
  );

  const handleRecentSearch = useCallback((search: string) => {
    handleQueryChange(search);
    inputRef.current?.focus();
  }, [handleQueryChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalResults - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (query.trim() && onSearchSubmit) {
          saveRecentSearch(query);
          setRecentSearches(getRecentSearches());
          onSearchSubmit(query);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search plugins & frameworks..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 bg-secondary/50 border-border focus-visible:ring-primary/20 w-full"
        />
        {query && (
          <button
            onClick={() => {
              handleQueryChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
          {/* Recent Searches */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentSearch(search)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  <Clock size={14} />
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query.trim() && (
            <>
              {results.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {/* Framework Results */}
                  {results.filter((r) => r.type === "framework").length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Frameworks
                      </div>
                      {results
                        .filter((r) => r.type === "framework")
                        .map((result) => {
                          const fw = result.item as Framework;
                          const globalIndex = results.indexOf(result);
                          return (
                            <button
                              key={fw.id}
                              onClick={() => handleSelect(result)}
                              className={cn(
                                "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors",
                                selectedIndex === globalIndex
                                  ? "bg-secondary"
                                  : "hover:bg-secondary/50"
                              )}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center border"
                                style={{
                                  backgroundColor: `${fw.color}20`,
                                  borderColor: `${fw.color}40`,
                                }}
                              >
                                <Terminal size={16} style={{ color: fw.color || undefined }} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium">{fw.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {fw.description?.slice(0, 60)}...
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-muted-foreground" />
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {/* Plugin Results */}
                  {results.filter((r) => r.type === "plugin").length > 0 && (
                    <div className="p-2 border-t border-border">
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Plugins
                      </div>
                      {results
                        .filter((r) => r.type === "plugin")
                        .map((result) => {
                          const plugin = result.item as PluginWithMarketplace;
                          const globalIndex = results.indexOf(result);
                          const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
                          const TypeIcon = typeConfig.icon;
                          return (
                            <button
                              key={plugin.id}
                              onClick={() => handleSelect(result)}
                              className={cn(
                                "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors",
                                selectedIndex === globalIndex
                                  ? "bg-secondary"
                                  : "hover:bg-secondary/50"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center border",
                                  typeConfig.colorClass,
                                  typeConfig.bgClass,
                                  typeConfig.borderClass
                                )}
                              >
                                <TypeIcon size={16} />
                              </div>
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium font-mono">
                                    {plugin.name}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[10px] px-1.5 py-0.5 rounded",
                                      typeConfig.colorClass,
                                      typeConfig.bgClass
                                    )}
                                  >
                                    {typeConfig.label}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {plugin.description?.slice(0, 50)}...
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-muted-foreground" />
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Keyboard hints */}
              <div className="flex items-center gap-4 px-3 py-2 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">esc</kbd>
                  close
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
