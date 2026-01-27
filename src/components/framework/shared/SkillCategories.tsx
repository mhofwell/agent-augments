"use client";

import type { FrameworkSkill } from "@/types/database";
import { SkillItem } from "./SkillItem";
import { cn } from "@/lib/utils";

export interface SkillCategory {
  name: string;
  skills: FrameworkSkill[];
  color: string;
}

// Category patterns to match against skill names
const CATEGORY_PATTERNS: Array<{
  pattern: RegExp;
  name: string;
  color: string;
}> = [
  { pattern: /^AgentDB\s/i, name: "AgentDB Integration", color: "text-violet-400" },
  { pattern: /^GitHub\s/i, name: "GitHub Automation", color: "text-zinc-300" },
  { pattern: /^Flow\s?Nexus\s/i, name: "Flow Nexus Platform", color: "text-cyan-400" },
  { pattern: /^Memory\s/i, name: "Memory Management", color: "text-amber-400" },
  { pattern: /^Task\s/i, name: "Task Management", color: "text-emerald-400" },
  { pattern: /^Code\s/i, name: "Code Operations", color: "text-rose-400" },
  { pattern: /^API\s/i, name: "API Integration", color: "text-blue-400" },
  { pattern: /^File\s/i, name: "File Operations", color: "text-orange-400" },
  { pattern: /^Data\s/i, name: "Data Processing", color: "text-teal-400" },
  { pattern: /^Debug/i, name: "Debugging", color: "text-red-400" },
  { pattern: /^Test/i, name: "Testing", color: "text-lime-400" },
];

const DEFAULT_CATEGORY = { name: "Other", color: "text-zinc-400" };

/**
 * Categorizes a list of skills based on their name prefixes
 */
export function categorizeSkills(skills: FrameworkSkill[]): SkillCategory[] {
  const categoryMap = new Map<string, { skills: FrameworkSkill[]; color: string }>();

  for (const skill of skills) {
    let matched = false;
    for (const { pattern, name, color } of CATEGORY_PATTERNS) {
      if (pattern.test(skill.name)) {
        if (!categoryMap.has(name)) {
          categoryMap.set(name, { skills: [], color });
        }
        categoryMap.get(name)!.skills.push(skill);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!categoryMap.has(DEFAULT_CATEGORY.name)) {
        categoryMap.set(DEFAULT_CATEGORY.name, { skills: [], color: DEFAULT_CATEGORY.color });
      }
      categoryMap.get(DEFAULT_CATEGORY.name)!.skills.push(skill);
    }
  }

  // Convert to array and sort: named categories first (alphabetically), then "Other" last
  const categories: SkillCategory[] = [];
  const sortedNames = Array.from(categoryMap.keys()).sort((a, b) => {
    if (a === DEFAULT_CATEGORY.name) return 1;
    if (b === DEFAULT_CATEGORY.name) return -1;
    return a.localeCompare(b);
  });

  for (const name of sortedNames) {
    const { skills, color } = categoryMap.get(name)!;
    categories.push({ name, skills, color });
  }

  return categories;
}

interface SkillCategoriesProps {
  skills: FrameworkSkill[];
  className?: string;
}

export function SkillCategories({ skills, className }: SkillCategoriesProps) {
  const categories = categorizeSkills(skills);

  // If only one category and it's "Other", don't show category headers
  const showCategoryHeaders = categories.length > 1 || categories[0]?.name !== DEFAULT_CATEGORY.name;

  return (
    <div className={cn("space-y-6", className)}>
      {categories.map((category) => (
        <div key={category.name}>
          {/* Category header */}
          {showCategoryHeaders && (
            <div className="flex items-center gap-2 mb-2 mt-1">
              <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">
                {category.name}
              </span>
              <span className="text-zinc-700 text-[10px] font-mono">
                {category.skills.length}
              </span>
              <div className="flex-1 h-px bg-zinc-800/40" />
            </div>
          )}

          {/* Skills list with tree connectors */}
          <div className="pl-2">
            {category.skills.map((skill, idx) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                isLast={idx === category.skills.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
