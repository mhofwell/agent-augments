"use client";

import { useState } from "react";
import { Copy, Check, Github, ExternalLink, BookOpen, Layers, Scale, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PublisherSkill, SkillPublisher } from "@/types/database";

// Agent compatibility - Skills work with all agents
const COMPATIBLE_AGENTS = [
  { id: "claude-code", name: "Claude Code", color: "#FF8C00" },
  { id: "cursor", name: "Cursor", color: "#3B82F6" },
  { id: "windsurf", name: "Windsurf", color: "#10B981" },
  { id: "codex", name: "Codex", color: "#FFFFFF" },
];

interface SkillModalProps {
  skill: PublisherSkill | null;
  publisher: SkillPublisher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkillModal({
  skill,
  publisher,
  open,
  onOpenChange,
}: SkillModalProps) {
  const [copied, setCopied] = useState(false);

  if (!skill || !publisher) return null;

  const installCommand = `npx add-skill ${publisher.github_org}/${publisher.github_repo}/${skill.slug}`;
  const githubUrl = `https://github.com/${publisher.github_org}/${publisher.github_repo}/tree/main/${skill.slug}`;
  const rawSkillUrl = `https://raw.githubusercontent.com/${publisher.github_org}/${publisher.github_repo}/main/${skill.slug}/SKILL.md`;

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste in your terminal to install",
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

  // Parse categories
  const categories = Array.isArray(skill.categories) ? skill.categories : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 p-0 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10">
              <BookOpen size={28} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl font-bold break-words text-white">
                  {skill.name}
                </DialogTitle>
                {skill.version && (
                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                    v{skill.version}
                  </Badge>
                )}
                {skill.license && (
                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                    <Scale size={10} className="mr-1" />
                    {skill.license}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                <User size={14} />
                <span>by {skill.author || publisher.name}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator className="bg-zinc-800" />

        {/* Content */}
        <div className="p-6 space-y-6 overflow-hidden">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Description
            </h3>
            <p className="text-zinc-300 leading-relaxed break-words">
              {skill.description || "No description available"}
            </p>
          </div>

          {/* Stats */}
          {(skill.rule_count || skill.category_count) && (
            <div className="flex items-center gap-4">
              {skill.rule_count && skill.rule_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <BookOpen size={16} className="text-cyan-400" />
                  <span className="text-white font-medium">{skill.rule_count}</span> rules
                </div>
              )}
              {skill.category_count && skill.category_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Layers size={16} className="text-cyan-400" />
                  <span className="text-white font-medium">{skill.category_count}</span> categories
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-sm border-zinc-700 text-zinc-300 bg-zinc-800/50"
                  >
                    {typeof category === 'string' ? category : String(category)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Agent Compatibility */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Works With
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMPATIBLE_AGENTS.map((agent) => (
                <Badge
                  key={agent.id}
                  variant="outline"
                  className="text-sm px-3 py-1"
                  style={{
                    borderColor: `${agent.color}50`,
                    backgroundColor: `${agent.color}10`,
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: agent.color }}
                  />
                  {agent.name}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Skills follow the Agent Skills specification and work with any compatible agent.
            </p>
          </div>

          {/* Install Command */}
          <div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Installation
            </h3>
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 min-w-0 px-4 py-3 bg-black rounded-lg font-mono text-sm border border-zinc-800 overflow-x-auto whitespace-nowrap text-cyan-400">
                {installCommand}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={copyCommand}
                className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              asChild
            >
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Github size={18} className="mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button
              variant="secondary"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              asChild
            >
              <a href={rawSkillUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} className="mr-2" />
                View SKILL.md
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
