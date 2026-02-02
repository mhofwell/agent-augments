"use client";

import { memo, useState } from "react";
import { Copy, Check, Star, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatStars } from "@/components/plugin/plugin-utils";
import { PUBLISHER_LOGOS } from "./publisher-logos";
import type { SkillPublisherWithSkills } from "@/hooks/useSkillPublishers";

interface PublisherCardProps {
  publisher: SkillPublisherWithSkills;
  onClick?: () => void;
}

export const PublisherCard = memo(function PublisherCard({ publisher, onClick }: PublisherCardProps) {
  const [copied, setCopied] = useState(false);

  const installCommand = `npx add-skill ${publisher.github_org}/${publisher.github_repo}`;
  const skillCount = publisher.skills?.length || 0;
  const displaySkills = publisher.skills?.slice(0, 3) || [];
  const remainingCount = skillCount > 3 ? skillCount - 3 : 0;

  const copyCommand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste in Claude Code to install",
      });
      setTimeout(() => setCopied(false), 2000);

      // Track install click
      fetch("/api/skill-publishers/track-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisher_id: publisher.id, type: "publisher" }),
      }).catch(() => {
        // Silently fail - tracking shouldn't block user action
      });
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className="group relative bg-card/50 border border-border rounded-xl hover:border-cyan-500/30 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 ease-out cursor-pointer p-5 flex flex-col"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo */}
          {PUBLISHER_LOGOS[publisher.slug] && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
              <img
                src={PUBLISHER_LOGOS[publisher.slug]}
                alt={`${publisher.name} logo`}
                className="w-6 h-6 object-contain"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-cyan-400 transition-colors">
                {publisher.name}
              </h3>
              {publisher.is_official && (
                <BadgeCheck size={16} className="text-yellow-500 fill-yellow-500/20 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          {formatStars(publisher.github_stars)}
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
        {publisher.description || "Skills from this publisher"}
      </p>

      {/* Skills tree */}
      <div className="mb-4 font-mono text-[11px] leading-5 flex-1">
        {skillCount > 0 ? (
          <div className="text-zinc-500">
            {displaySkills.map((skill, idx) => {
              const isLast = idx === displaySkills.length - 1 && remainingCount === 0;
              return (
                <div key={skill.id} className="flex items-center">
                  <span className="text-zinc-600 select-none">{isLast ? "└─" : "├─"}</span>
                  <span className="ml-1.5 text-zinc-300">{skill.name}</span>
                </div>
              );
            })}
            {remainingCount > 0 && (
              <div className="flex items-center">
                <span className="text-zinc-600 select-none">└─</span>
                <span className="ml-1.5 text-zinc-500">+{remainingCount} more</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic">
            Skills coming soon
          </span>
        )}
      </div>

      {/* Install Command */}
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-background rounded-lg font-mono text-xs text-cyan-400 border border-border truncate">
          {installCommand}
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
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
});
