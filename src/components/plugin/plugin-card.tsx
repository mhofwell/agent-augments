"use client";

import { Download, Star, Bookmark, BookmarkCheck, Copy, Check, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getPluginTypeConfig, formatNumber, getInstallCommand } from "./plugin-utils";
import type { PluginWithMarketplace, PluginType } from "@/types/database";

interface PluginCardProps {
  plugin: PluginWithMarketplace;
  compact?: boolean;
  isNew?: boolean;
  isOfficial?: boolean;
  isBookmarked?: boolean;
  onClick?: () => void;
  onBookmarkToggle?: () => void;
}

export function PluginCard({
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
        "group relative bg-card/50 border border-border rounded-xl hover:border-border/80 hover:bg-card transition-all duration-300 cursor-pointer flex flex-col",
        compact ? "p-4" : "p-5"
      )}
      onClick={onClick}
    >
      {/* Top row: Type badge left, badges + bookmark right */}
      <div className="flex items-start justify-between mb-3">
        {/* Type badge - top left */}
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
          {/* Bookmark button */}
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

      {/* Description */}
      <p
        className={cn(
          "text-muted-foreground text-sm leading-relaxed mb-4 flex-1",
          compact ? "line-clamp-2" : "line-clamp-3"
        )}
      >
        {plugin.description || "No description available"}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Download size={12} />
          {formatNumber(plugin.install_count)}
        </span>
        {plugin.category && (
          <span className="flex items-center gap-1">
            <Star size={12} />
            {plugin.category}
          </span>
        )}
      </div>

      {/* Install command with copy button */}
      <div
        className="flex items-center gap-2 bg-background rounded-lg border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <code className="flex-1 px-3 py-2 font-mono text-xs text-primary truncate">
          {installCommand}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-2 hover:bg-secondary transition-colors border-l border-border"
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} className="text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
}
