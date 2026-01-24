"use client";

import { cn } from "@/lib/utils";
import type { SkillTag } from "@/types/database";
import {
  Cloud,
  Brain,
  Shield,
  CreditCard,
  BarChart3,
  Zap,
  FileText,
  Code,
} from "lucide-react";

export interface TagOption {
  value: SkillTag | null;
  label: string;
  icon: React.ElementType;
  color: string;
}

export const TAG_OPTIONS: TagOption[] = [
  { value: null, label: "All", icon: Zap, color: "text-zinc-400" },
  { value: "infrastructure", label: "Infrastructure", icon: Cloud, color: "text-orange-400" },
  { value: "ai-ml", label: "AI/ML", icon: Brain, color: "text-purple-400" },
  { value: "security", label: "Security", icon: Shield, color: "text-rose-400" },
  { value: "payments", label: "Payments", icon: CreditCard, color: "text-emerald-400" },
  { value: "data-science", label: "Data Science", icon: BarChart3, color: "text-blue-400" },
  { value: "automation", label: "Automation", icon: Zap, color: "text-amber-400" },
  { value: "documents", label: "Documents", icon: FileText, color: "text-cyan-400" },
  { value: "development", label: "Development", icon: Code, color: "text-green-400" },
];

// Get tag display info for a specific tag
export function getTagInfo(tag: SkillTag | null): TagOption {
  return TAG_OPTIONS.find((t) => t.value === tag) || TAG_OPTIONS[0];
}

interface TagFilterProps {
  selectedTag: SkillTag | null;
  onTagChange: (tag: SkillTag | null) => void;
  className?: string;
}

export function TagFilter({ selectedTag, onTagChange, className }: TagFilterProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {TAG_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedTag === option.value;

        return (
          <button
            key={option.value ?? "all"}
            onClick={() => onTagChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
              isSelected
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-white"
            )}
          >
            <Icon size={14} className={isSelected ? "text-cyan-400" : option.color} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Compact badge for displaying a tag on cards
interface TagBadgeProps {
  tag: SkillTag;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const info = getTagInfo(tag);
  const Icon = info.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-zinc-800/50 border border-zinc-700",
        className
      )}
    >
      <Icon size={10} className={info.color} />
      <span className="text-zinc-400">{info.label}</span>
    </span>
  );
}
