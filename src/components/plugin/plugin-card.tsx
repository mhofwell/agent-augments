"use client";

import { Download, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPluginTypeConfig, formatNumber } from "./plugin-utils";
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
  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={cn(
        "group relative bg-card/50 border border-border rounded-xl hover:border-border/80 hover:bg-card transition-all duration-300 cursor-pointer",
        compact ? "p-4" : "p-5"
      )}
      onClick={onClick}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-2">
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
      </div>

      {/* Bookmark button (appears on hover) */}
      {onBookmarkToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmarkToggle();
          }}
          className={cn(
            "absolute top-3 right-3 p-1.5 rounded-lg transition-all",
            isBookmarked
              ? "bg-amber-500/20 text-amber-400"
              : "opacity-0 group-hover:opacity-100 bg-secondary/80 text-muted-foreground hover:text-foreground",
            (isNew || isOfficial) && "right-16"
          )}
        >
          {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border",
            typeConfig.colorClass,
            typeConfig.bgClass,
            typeConfig.borderClass
          )}
        >
          <TypeIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground font-mono truncate pr-16 group-hover:text-primary transition-colors">
            {plugin.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {plugin.marketplace?.name || `${plugin.marketplace?.github_owner}/${plugin.marketplace?.github_repo}`}
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        className={cn(
          "text-muted-foreground text-sm leading-relaxed mb-4",
          compact ? "line-clamp-2" : "line-clamp-3"
        )}
      >
        {plugin.description || "No description available"}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-md border",
            typeConfig.colorClass,
            typeConfig.bgClass,
            typeConfig.borderClass
          )}
        >
          {typeConfig.label}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
}
