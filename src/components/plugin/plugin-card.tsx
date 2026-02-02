"use client";

import { Bookmark, BookmarkCheck, Copy, Check, Terminal, Star } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getPluginTypeConfig, formatNumber, getInstallCommand, cleanDescription } from "./plugin-utils";
import { getCategoryDisplayName } from "@/lib/publishers";
import { CompositionBadges } from "./composition-badges";
import type { PluginWithMarketplace, PluginType, PluginComposition } from "@/types/database";

interface PluginCardProps {
  plugin: PluginWithMarketplace;
  compact?: boolean;
  isNew?: boolean;
  isOfficial?: boolean;
  isBookmarked?: boolean;
  onClick?: () => void;
  onBookmarkToggle?: () => void;
}

export const PluginCard = memo(function PluginCard({
  plugin,
  compact = false,
  isNew = false,
  isOfficial = false,
  isBookmarked = false,
  onClick,
  onBookmarkToggle,
}: PluginCardProps) {
  const [copied, setCopied] = useState(false);
  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
  const TypeIcon = typeConfig.icon;

  const marketplaceRepo = plugin.marketplace?.github_repo ?? "";
  const installCommand = getInstallCommand(plugin.name, marketplaceRepo);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    toast.success("Copied to clipboard", {
      description: "Paste in Claude Code to install",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative bg-card/50 border border-border rounded-xl",
        "hover:border-border/80 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        "transition-all duration-300 ease-out cursor-pointer flex flex-col overflow-hidden",
        compact ? "p-4" : "p-5"
      )}
      onClick={onClick}
    >
      {/* Top row: Type badge + installs left, badges + bookmark right */}
      <div className="flex items-start justify-between mb-3">
        {/* Type badge and install count - top left */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border",
              typeConfig.colorClass,
              typeConfig.bgClass,
              typeConfig.borderClass
            )}
          >
            <TypeIcon size={12} />
            {typeConfig.label}
          </span>
          {/* Install count as quality signal */}
          {(plugin.install_count || 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {formatNumber(plugin.install_count)}
            </span>
          )}
        </div>

        {/* Right side: New/Official badges + Agent badge + Bookmark */}
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full animate-pulse">
              New
            </span>
          )}
          {isOfficial && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              Official
            </span>
          )}
          {/* Agent badge - shows Claude for now */}
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
            <Terminal size={10} />
            Claude
          </span>
          {/* Bookmark button - always visible when bookmarked, otherwise on hover */}
          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle();
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isBookmarked
                  ? "bg-amber-500/20 text-amber-400"
                  : "opacity-0 group-hover:opacity-100 bg-secondary/80 text-muted-foreground hover:text-foreground"
              )}
            >
              {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Name and source */}
      <div className="mb-3">
        <h3 className="font-semibold text-foreground font-mono group-hover:text-primary transition-colors">
          {plugin.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {plugin.marketplace?.name || `${plugin.marketplace?.github_owner}/${plugin.marketplace?.github_repo}`}
        </p>
      </div>

      {/* Description - 2 lines by default, expands on hover */}
      <p
        className={cn(
          "text-muted-foreground text-sm leading-relaxed flex-1 transition-all duration-200",
          compact ? "line-clamp-2 mb-3" : "line-clamp-2 group-hover:line-clamp-4 mb-3"
        )}
      >
        {cleanDescription(plugin.description) || "No description available"}
      </p>

      {/* Category badge */}
      {plugin.category && (
        <div className="mb-3">
          <span className="px-1.5 py-0.5 bg-secondary/30 group-hover:bg-secondary/50 rounded text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            {getCategoryDisplayName(plugin.category)}
          </span>
        </div>
      )}

      {/* Composition badges - visible by default */}
      <CompositionBadges
        composition={plugin.composition as PluginComposition | null}
        className="mb-0"
      />

      {/* Install command - slides up on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transform transition-transform duration-300 ease-out",
          "translate-y-full group-hover:translate-y-0",
          "bg-background/95 backdrop-blur-sm border-t border-border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <code className="flex-1 px-4 py-3 font-mono text-xs text-primary truncate">
            {installCommand}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-auto w-auto p-3 rounded-none border-l border-border flex-shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </Button>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
});
