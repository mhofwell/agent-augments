"use client";

import { SkillCard } from "./skill-card";
import type { SkillWithPlugin } from "@/types/database";

interface SkillGridProps {
  skills: SkillWithPlugin[];
  isLoading?: boolean;
  onSkillClick?: (skill: SkillWithPlugin) => void;
}

export function SkillGrid({ skills, isLoading, onSkillClick }: SkillGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-card/50 border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
          <span className="text-2xl">🔧</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No skills found</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Skills are individual capabilities extracted from plugins that work across multiple AI coding agents.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          onClick={() => onSkillClick?.(skill)}
        />
      ))}
    </div>
  );
}
