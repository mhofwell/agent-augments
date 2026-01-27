"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Star, BadgeCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isVerified, extractAuthor, formatStars } from "./framework-utils";
import { AgentCompatibilityRow } from "./shared";
import type { Framework } from "@/types/database";

interface FrameworkCardProps {
  framework: Framework;
  onClick?: () => void;
  featured?: boolean;
}

export function FrameworkCard({ framework, onClick, featured = false }: FrameworkCardProps) {
  const [copied, setCopied] = useState(false);
  const author = extractAuthor(framework.github_url);

  const copyCommand = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const content = (
    <>
      {/* Featured badge */}
      {featured && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles size={14} className="text-lime-400 fill-lime-400/30" />
            <span className="uppercase tracking-wide font-medium text-lime-400">Featured</span>
          </div>
          {framework.stars && framework.stars > 0 && (
            <div className="flex items-center gap-1 text-amber-400/80 text-sm">
              <Star size={14} className="fill-amber-400/80" />
              <span>{formatStars(framework.stars)}</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h3 className={`font-semibold text-foreground group-hover:text-lime-400 transition-colors ${featured ? "text-xl" : "text-lg"}`}>
          {framework.name}
        </h3>
        {!featured && framework.stars && framework.stars > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span>{formatStars(framework.stars)}</span>
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

      {/* Agent compatibility + component stats */}
      {(() => {
        const stats = [
          framework.skills_count && `${framework.skills_count} ${framework.skills_count === 1 ? "skill" : "skills"}`,
          framework.subagents_count && `${framework.subagents_count} ${framework.subagents_count === 1 ? "agent" : "agents"}`,
          framework.mcps_count && `${framework.mcps_count} ${framework.mcps_count === 1 ? "MCP" : "MCPs"}`,
        ].filter(Boolean);

        if (featured) {
          return (
            <AgentCompatibilityRow
              item={framework}
              size="sm"
              className="mb-4"
            />
          );
        }

        return (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5 flex-wrap">
            <AgentCompatibilityRow item={framework} size="sm" />
            {stats.length > 0 && (
              <>
                <span className="text-border">|</span>
                <span>{stats.join(" · ")}</span>
              </>
            )}
          </div>
        );
      })()}

      {/* Install command */}
      {framework.install_command && (
        <div className="flex items-center gap-2" onClick={featured ? (e) => e.preventDefault() : undefined}>
          <code className={`flex-1 px-3 py-2 rounded-lg font-mono text-xs text-lime-400 border truncate ${
            featured ? "bg-black/50 border-zinc-800" : "bg-background border-border"
          }`}>
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

  // If onClick is provided, use a div with onClick; otherwise use Link
  if (onClick) {
    return (
      <div className={className} onClick={onClick} style={{ cursor: "pointer" }}>
        {wrappedContent}
      </div>
    );
  }

  return (
    <Link href={`/frameworks/${framework.slug}`} className={className}>
      {wrappedContent}
    </Link>
  );
}
