"use client";

import { memo } from "react";
import { Star, BadgeCheck, Sparkles, Clock } from "lucide-react";
import { isVerified, extractAuthor, formatStars, formatRelativeTime } from "./framework-utils";
import type { Framework } from "@/types/database";

interface FrameworkCardProps {
  framework: Framework;
  onClick: () => void;
  featured?: boolean;
}

export const FrameworkCard = memo(function FrameworkCard({ framework, onClick, featured = false }: FrameworkCardProps) {
  const author = extractAuthor(framework.github_url);

  const content = (
    <>
      {/* Featured badge */}
      {featured && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles size={14} className="text-lime-400 fill-lime-400/30" />
            <span className="uppercase tracking-wide font-medium text-lime-400">Featured</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {framework.stars && framework.stars > 0 && (
              <div className="flex items-center gap-1 text-amber-400/80">
                <Star size={14} className="fill-amber-400/80" />
                <span>{formatStars(framework.stars)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className={`font-semibold text-foreground group-hover:text-lime-400 transition-colors ${featured ? "text-xl" : "text-lg"}`}>
          {framework.name}
        </h3>
        {!featured && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            {framework.stars && framework.stars > 0 && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span>{formatStars(framework.stars)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Author */}
      {author && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <span>by</span>
          <span className="text-foreground/70">{author}</span>
          {isVerified(author) && (
            <BadgeCheck size={14} className="text-yellow-500 fill-yellow-500/20" />
          )}
        </div>
      )}

      {/* Description */}
      <p className={`text-muted-foreground text-sm leading-relaxed mb-4 ${featured ? "line-clamp-3" : "line-clamp-2"}`}>
        {framework.description}
      </p>

      {/* Last commit */}
      {framework.last_commit_at && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>{formatRelativeTime(framework.last_commit_at)}</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-lime-500/5 to-transparent rounded-xl" />
      </div>
    </>
  );

  const className = featured
    ? "group/featured relative rounded-xl border border-lime-500/30 hover:border-lime-400/60 transition-all duration-300 featured-glow block cursor-pointer"
    : "group relative bg-card/50 border border-border rounded-xl p-6 hover:border-lime-500/30 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-lime-500/5 transition-all duration-300 ease-out block";

  // Wrap content with inner styling for featured variant
  const wrappedContent = featured ? (
    <div className="rounded-xl p-6 h-full bg-gradient-to-br from-orange-950/20 via-zinc-900/50 to-transparent">
      {content}
    </div>
  ) : content;

  return (
    <div className={className} onClick={onClick} style={{ cursor: "pointer" }}>
      {wrappedContent}
    </div>
  );
});
