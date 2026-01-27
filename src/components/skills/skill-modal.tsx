"use client";

import { useState } from "react";
import { Copy, Check, Github, ExternalLink, BookOpen, Layers, HelpCircle, ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PUBLISHER_LOGOS } from "./publisher-logos";
import type { PublisherSkill, SkillPublisher } from "@/types/database";

type InstallScope = "user" | "project" | "local";

const scopeOptions: { value: InstallScope; label: string; description: string }[] = [
  {
    value: "user",
    label: "User (recommended)",
    description: "Available in all your projects",
  },
  {
    value: "project",
    label: "Project",
    description: "Shared with your team via project config",
  },
  {
    value: "local",
    label: "Local",
    description: "This project only, not version controlled",
  },
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
  const [selectedScope, setSelectedScope] = useState<InstallScope>("user");
  const [helpOpen, setHelpOpen] = useState(false);

  if (!skill || !publisher) return null;

  const baseCommand = `npx add-skill ${publisher.github_org}/${publisher.github_repo}/${skill.slug}`;
  const installCommand = `${baseCommand} --scope ${selectedScope}`;
  const githubUrl = `https://github.com/${publisher.github_org}/${publisher.github_repo}/tree/main/${skill.slug}`;
  const rawSkillUrl = `https://raw.githubusercontent.com/${publisher.github_org}/${publisher.github_repo}/main/${skill.slug}/SKILL.md`;

  // Get publisher logo
  const publisherSlug = publisher.slug || publisher.github_org.toLowerCase();
  const publisherLogo = PUBLISHER_LOGOS[publisherSlug];

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
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Publisher logo */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10">
              {publisherLogo ? (
                <img
                  src={publisherLogo}
                  alt={publisher.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <BookOpen size={28} className="text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl font-bold break-words text-foreground">
                  {skill.name}
                </DialogTitle>
                {skill.version && (
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                    v{skill.version}
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                by {skill.author || publisher.name}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="p-6 space-y-6 overflow-hidden">
          {/* Description - no header, just the text */}
          <p className="text-muted-foreground leading-relaxed break-words">
            {skill.description || "No description available"}
          </p>

          {/* Stats */}
          {(skill.rule_count || skill.category_count) && (
            <div className="flex items-center gap-4">
              {skill.rule_count && skill.rule_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen size={16} className="text-cyan-400" />
                  <span className="text-foreground font-medium">{skill.rule_count}</span> rules
                </div>
              )}
              {skill.category_count && skill.category_count > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers size={16} className="text-cyan-400" />
                  <span className="text-foreground font-medium">{skill.category_count}</span> categories
                </div>
              )}
            </div>
          )}

          {/* Categories - no header */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-sm border-border text-muted-foreground bg-secondary/50"
                >
                  {typeof category === 'string' ? category : String(category)}
                </Badge>
              ))}
            </div>
          )}

          {/* Installation with scope selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Installation
            </h3>

            {/* Scope selection */}
            <div className="space-y-2">
              {scopeOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedScope === option.value
                      ? "bg-cyan-500/5 border-cyan-500/50"
                      : "bg-background border-border hover:border-border/80"
                  )}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={selectedScope === option.value}
                    onChange={() => setSelectedScope(option.value)}
                    className="mt-0.5 accent-cyan-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Install command */}
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 min-w-0 px-4 py-3 bg-background rounded-lg font-mono text-sm border border-border overflow-x-auto whitespace-nowrap text-cyan-400">
                {installCommand}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={copyCommand}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>

            {/* First time? Help section */}
            <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle size={14} />
                <span>First time installing skills?</span>
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", helpOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-background rounded-lg border border-border p-4 space-y-3 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open your terminal in any project directory</li>
                    <li>Run the install command above</li>
                    <li>The skill will be downloaded and configured automatically</li>
                    <li>Skills work with any agent supporting the Agent Skills spec</li>
                  </ol>
                  <Separator />
                  <a
                    href="https://agentskills.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    Learn more about Agent Skills
                    <ExternalLink size={12} />
                  </a>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              asChild
            >
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Github size={18} className="mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
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
