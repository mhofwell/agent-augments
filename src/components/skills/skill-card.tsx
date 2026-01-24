"use client";

import { useState } from "react";
import { Copy, Check, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PublisherSkill } from "@/types/database";

interface SkillCardProps {
  skill: PublisherSkill;
  publisherSlug: string;
  publisherOrg: string;
  publisherRepo: string;
  onClick?: () => void;
}

export function SkillCard({
  skill,
  publisherSlug,
  publisherOrg,
  publisherRepo,
  onClick,
}: SkillCardProps) {
  const [copied, setCopied] = useState(false);

  const installCommand = `npx add-skill ${publisherOrg}/${publisherRepo}/${skill.slug}`;

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
        body: JSON.stringify({ skill_id: skill.id, type: "skill" }),
      }).catch(() => {
        // Silently fail - tracking shouldn't block user action
      });
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Parse categories if it's a JSON string
  const categories = Array.isArray(skill.categories)
    ? skill.categories
    : [];
  const displayCategories = categories.slice(0, 3);

  return (
    <div
      className="group relative bg-card/50 border border-border rounded-lg hover:border-cyan-500/30 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 ease-out cursor-pointer p-4 flex flex-col"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-foreground group-hover:text-cyan-400 transition-colors">
          {skill.name}
        </h4>
        {skill.version && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            v{skill.version}
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
        {skill.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        {skill.rule_count && skill.rule_count > 0 && (
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {skill.rule_count} rules
          </span>
        )}
        {skill.category_count && skill.category_count > 0 && (
          <span className="flex items-center gap-1">
            <Layers size={12} />
            {skill.category_count} categories
          </span>
        )}
      </div>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {displayCategories.map((cat, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[10px] text-muted-foreground/80"
            >
              {typeof cat === 'string' ? cat : String(cat)}
            </Badge>
          ))}
          {categories.length > 3 && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground/60">
              +{categories.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Install button */}
      <div className="flex items-center gap-2 mt-auto">
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
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent rounded-lg" />
      </div>
    </div>
  );
}
