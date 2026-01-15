"use client";

import { Terminal, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanDescription } from "@/components/plugin/plugin-utils";
import type { SkillWithPlugin } from "@/types/database";

// Agent display config
const agentConfig: Record<string, { label: string; color: string }> = {
  "claude-code": { label: "Claude", color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  cursor: { label: "Cursor", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
  windsurf: { label: "Windsurf", color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30" },
  codex: { label: "Codex", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
};

interface SkillCardProps {
  skill: SkillWithPlugin;
  onClick?: () => void;
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  const agents = skill.agent_compatibility || [];

  return (
    <div
      className={cn(
        "group relative bg-card/50 border border-border rounded-xl",
        "hover:border-border/80 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        "transition-all duration-300 ease-out cursor-pointer flex flex-col p-5"
      )}
      onClick={onClick}
    >
      {/* Top row: Skill badge */}
      <div className="flex items-start justify-between mb-3">
        {/* Skill type badge */}
        <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border text-cyan-400 bg-cyan-500/20 border-cyan-500/30">
          <Terminal size={12} />
          Skill
        </span>

        {/* Category badge if exists */}
        {skill.category && (
          <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-muted-foreground rounded-full">
            {skill.category}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="mb-3">
        <h3 className="font-semibold text-foreground font-mono group-hover:text-primary transition-colors">
          {skill.name}
        </h3>
        {/* Parent plugin */}
        {skill.plugin && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Package size={10} />
            from {skill.plugin.name}
          </p>
        )}
      </div>

      {/* Description - 2 lines by default, expands on hover */}
      <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1 line-clamp-2 group-hover:line-clamp-4 transition-all duration-200">
        {cleanDescription(skill.description) || "No description available"}
      </p>

      {/* Compatible agents */}
      <div className="flex flex-wrap gap-1.5">
        {agents.length > 0 ? (
          agents.map((agent) => {
            const config = agentConfig[agent] || {
              label: agent,
              color: "text-muted-foreground bg-secondary border-border",
            };
            return (
              <span
                key={agent}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
                  config.color
                )}
              >
                <Terminal size={10} />
                {config.label}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground">Universal</span>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
}
