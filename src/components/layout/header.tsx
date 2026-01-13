"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth";
import { UnifiedSearch } from "@/components/search";
import { cn } from "@/lib/utils";
import type { TabOption } from "@/hooks/usePlugins";
import type { PluginWithMarketplace, Framework } from "@/types/database";

interface HeaderProps {
  activeTab: TabOption;
  onTabChange: (tab: TabOption) => void;
  bookmarkCount?: number;
  plugins?: PluginWithMarketplace[];
  frameworks?: Framework[];
  onPluginSelect?: (plugin: PluginWithMarketplace) => void;
  onFrameworkSelect?: (framework: Framework) => void;
  onSearch?: (query: string) => void;
}

const tabs: { value: TabOption; label: string }[] = [
  { value: "plugins", label: "Plugins" },
  { value: "frameworks", label: "Frameworks" },
];

export function Header({
  activeTab,
  onTabChange,
  bookmarkCount = 0,
  plugins = [],
  frameworks = [],
  onPluginSelect,
  onFrameworkSelect,
  onSearch,
}: HeaderProps) {
  return (
    <header className="relative border-b border-border glass-strong sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="https://yafmezgaogzlwujhqxev.supabase.co/storage/v1/object/public/assets/logo/augs-dark.svg"
              alt="Augs"
              width={84}
              height={29}
              preload={true}
              unoptimized
              className="h-7 w-auto"
            />
          </Link>

          {/* Navigation Tabs */}
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
              </button>
            ))}
          </nav>

          {/* Unified Search */}
          <div className="flex-1 max-w-md hidden lg:block">
            <UnifiedSearch
              plugins={plugins}
              frameworks={frameworks}
              onPluginSelect={(plugin) => onPluginSelect?.(plugin)}
              onFrameworkSelect={(framework) => onFrameworkSelect?.(framework)}
              onSearchSubmit={(query) => onSearch?.(query)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Bookmarks Icon */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTabChange("bookmarks")}
              className={cn(
                "relative text-muted-foreground hover:text-foreground",
                activeTab === "bookmarks" && "bg-secondary text-foreground"
              )}
            >
              <Bookmark size={20} />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {bookmarkCount > 99 ? "99+" : bookmarkCount}
                </span>
              )}
              <span className="sr-only">Bookmarks</span>
            </Button>

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
            </button>
          ))}
          <button
            onClick={() => onTabChange("bookmarks")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
              activeTab === "bookmarks"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            )}
          >
            <Bookmark size={14} />
            {bookmarkCount > 0 && (
              <span className="text-xs text-primary">({bookmarkCount})</span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
