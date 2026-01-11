"use client";

import Link from "next/link";
import { Terminal, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth";
import { cn } from "@/lib/utils";

type Tab = "discover" | "featured" | "new" | "bookmarks";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  bookmarkCount?: number;
}

const tabs: { value: Tab; label: string }[] = [
  { value: "discover", label: "Discover" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New" },
  { value: "bookmarks", label: "Bookmarks" },
];

export function Header({
  activeTab,
  onTabChange,
  bookmarkCount = 0,
}: HeaderProps) {
  return (
    <header className="relative border-b border-border glass-strong sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Terminal size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Plugin Hub</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">for Claude Code</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.value
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {tab.label}
                {tab.value === "bookmarks" && bookmarkCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    {bookmarkCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t border-border">
        <nav className="flex overflow-x-auto px-4 py-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {tab.value === "bookmarks" && bookmarkCount > 0 && (
                <span className="ml-1.5 text-xs text-primary">
                  ({bookmarkCount})
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
