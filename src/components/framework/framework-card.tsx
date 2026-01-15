"use client";

import { useState } from "react";
import { Copy, Check, Star, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToolStyle, formatStars } from "./framework-utils";
import { getCompatibleAgents } from "@/lib/agents";
import type { Framework } from "@/types/database";

interface FrameworkCardProps {
  framework: Framework;
  onClick?: () => void;
}

export function FrameworkCard({ framework, onClick }: FrameworkCardProps) {
  const [copied, setCopied] = useState(false);
  const toolStyle = getToolStyle(framework.install_tool);
  const compatibleAgents = getCompatibleAgents(framework.id);

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

  return (
    <div
      className="group relative bg-card/50 border border-border rounded-xl hover:border-border/80 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 ease-out cursor-pointer p-5 flex flex-col"
      style={{ borderLeftColor: framework.color || undefined, borderLeftWidth: "3px" }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
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
          </div>
        </div>
        {framework.stars && framework.stars > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Github size={11} className="text-muted-foreground/70" />
            <Star size={11} className="text-amber-400 fill-amber-400" />
            {formatStars(framework.stars)}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
        {framework.description || "No description available"}
      </p>

      {/* Compatible agents - just the colored dots */}
      <div className="flex items-center gap-1 mb-3">
        {compatibleAgents.map((agent, idx) => (
          <span key={agent.id} className="flex items-center text-xs text-muted-foreground">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: agent.color }}
            />
            <span>{agent.shortName}</span>
            {idx < compatibleAgents.length - 1 && (
              <span className="mx-1 text-border">·</span>
            )}
          </span>
        ))}
      </div>

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
