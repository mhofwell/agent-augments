"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Star, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToolStyle, formatStars } from "./framework-utils";
import type { Framework } from "@/types/database";

interface FrameworkCardProps {
  framework: Framework;
  onClick?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (frameworkId: string) => void;
}

export function FrameworkCard({ framework, onClick, isBookmarked, onToggleBookmark }: FrameworkCardProps) {
  const [copied, setCopied] = useState(false);
  const toolStyle = getToolStyle(framework.install_tool);

  const copyCommand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(framework.install_command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.(framework.id);
  };

  return (
    <div
      className="group relative bg-card/50 border border-border rounded-xl hover:border-border/80 hover:bg-card transition-all duration-300 cursor-pointer p-5"
      style={{ borderLeftColor: framework.color || undefined, borderLeftWidth: "3px" }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {framework.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {framework.install_tool && (
              <Badge
                variant="outline"
                className={cn("text-xs uppercase", toolStyle.bg, toolStyle.text, toolStyle.border)}
              >
                {framework.install_tool}
              </Badge>
            )}
            {framework.stars && framework.stars > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {formatStars(framework.stars)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 transition-opacity",
                isBookmarked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={handleBookmarkClick}
            >
              <Bookmark
                size={14}
                className={cn(
                  isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </Button>
          )}
          {framework.homepage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                window.open(framework.homepage!, "_blank");
              }}
            >
              <ExternalLink size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
        {framework.description || "No description available"}
      </p>

      {/* Prerequisites */}
      {framework.prerequisites && framework.prerequisites.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {framework.prerequisites.map((prereq) => (
            <Badge key={prereq} variant="outline" className="text-xs text-muted-foreground">
              {prereq}
            </Badge>
          ))}
        </div>
      )}

      {/* Install Command */}
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-background rounded-lg font-mono text-xs text-muted-foreground border border-border truncate">
          {framework.install_command}
        </code>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={copyCommand}
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} />
          )}
        </Button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
}
