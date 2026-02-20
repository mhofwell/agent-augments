"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Github,
  ExternalLink,
  Terminal,
  Star,
  Bookmark,
  BadgeCheck,
  Clock,
  Zap,
  Bot,
  Plug,
  Users,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getToolStyle,
  formatStars,
  formatRelativeTime,
  isVerified,
  extractAuthor,
  parseWorkflowSteps,
} from "./framework-utils";
import { AgentCompatibilityRow } from "./shared/AgentCompatibilityRow";
import { usePluginFrameworks } from "@/hooks/usePluginFrameworks";
import { useFrameworkBookmarks } from "@/hooks/useFrameworkBookmarks";
import {
  getPluginTypeConfig,
  formatNumber,
  cleanDescription,
} from "@/components/plugin/plugin-utils";
import type {
  Framework,
  PluginWithMarketplace,
  PluginType,
} from "@/types/database";

type ComponentItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

interface FrameworkDetailProps {
  framework: Framework & {
    skills: ComponentItem[];
    mcps: ComponentItem[];
    subagents: ComponentItem[];
  };
}

// ---------------------------------------------------------------------------
// What's Included -- collapsible composition breakdown
// ---------------------------------------------------------------------------

const INITIAL_VISIBLE = 4;

/** Find the longest shared prefix (2+ segments) among slugs so we can dim it. */
function findCommonPrefix(slugs: string[]): string {
  if (slugs.length < 2) return "";
  const parts = slugs.map((s) => s.split("-"));
  const minLen = Math.min(...parts.map((p) => p.length));
  let shared = 0;
  for (let i = 0; i < minLen; i++) {
    if (parts.every((p) => p[i] === parts[0][i])) shared = i + 1;
    else break;
  }
  if (shared < 2) return "";
  return parts[0].slice(0, shared).join("-") + "-";
}

const TYPE_CONFIG = {
  skill: { icon: Zap, color: "text-type-skill", bg: "bg-type-skill/5", border: "border-type-skill/20", label: "Skills", slugPrefix: "/" },
  agent: { icon: Bot, color: "text-type-agent", bg: "bg-type-agent/5", border: "border-type-agent/20", label: "Agents", slugPrefix: "" },
  mcp: { icon: Plug, color: "text-type-command", bg: "bg-type-command/5", border: "border-type-command/20", label: "MCPs", slugPrefix: "" },
} as const;

function ComponentSection({
  items,
  type,
}: {
  items: ComponentItem[];
  type: keyof typeof TYPE_CONFIG;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  const commonPrefix = findCommonPrefix(items.map((i) => i.slug));
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = items.length - INITIAL_VISIBLE;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={config.color} />
        <span className="text-sm font-medium text-zinc-300">
          {config.label}
        </span>
        <span className="text-xs text-zinc-500">({items.length})</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {visible.map((item) => {
          const hasPrefix = commonPrefix && item.slug.startsWith(commonPrefix);
          const displaySlug = hasPrefix
            ? item.slug.slice(commonPrefix.length)
            : item.slug;

          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:border-zinc-600",
                config.bg,
                config.border,
              )}
            >
              <Icon
                size={14}
                className={cn(config.color, "mt-0.5 shrink-0 opacity-50")}
              />
              <div className="min-w-0 flex-1">
                <span className="font-mono text-sm leading-tight block">
                  {hasPrefix && (
                    <span className="text-zinc-600">
                      {config.slugPrefix}{commonPrefix}
                    </span>
                  )}
                  <span className={config.color}>
                    {!hasPrefix && config.slugPrefix}
                    {displaySlug}
                  </span>
                </span>
                {item.description && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <ChevronDown
            size={12}
            className={cn(
              "transition-transform",
              expanded && "rotate-180"
            )}
          />
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

function WhatsIncluded({
  skills,
  agents,
  mcps,
}: {
  skills: ComponentItem[];
  agents: ComponentItem[];
  mcps: ComponentItem[];
}) {
  const total = skills.length + agents.length + mcps.length;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          What&apos;s Included
        </h3>
        <span className="text-xs text-zinc-600">
          {total} component{total !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-6">
        <ComponentSection items={skills} type="skill" />
        <ComponentSection items={agents} type="agent" />
        <ComponentSection items={mcps} type="mcp" />
      </div>
    </div>
  );
}

export function FrameworkDetail({ framework }: FrameworkDetailProps) {
  const [copied, setCopied] = useState(false);
  const [plugins, setPlugins] = useState<PluginWithMarketplace[]>([]);
  const { getPluginsForFramework } = usePluginFrameworks();
  const { bookmarkedIds, toggleBookmark } = useFrameworkBookmarks();

  useEffect(() => {
    getPluginsForFramework(framework.id).then(setPlugins);
  }, [framework.id, getPluginsForFramework]);

  const toolStyle = getToolStyle(framework.install_tool);
  const author = extractAuthor(framework.github_url);
  const workflow = parseWorkflowSteps(framework.workflow_steps);
  const isBookmarked = bookmarkedIds.has(framework.id);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(framework.install_command);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste in your terminal to install",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const skillCount = framework.skills.length;
  const agentCount = framework.subagents.length;
  const mcpCount = framework.mcps.length;
  const hasComponents = skillCount + agentCount + mcpCount > 0;

  return (
    <div className="py-8">
      {/* Back button */}
      <Link
        href="/frameworks"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to frameworks
      </Link>

      {/* Header card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border bg-lime-500/10 border-lime-500/30"
            >
              <Terminal size={28} className="text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {framework.name}
                </h1>
                {framework.install_tool && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs uppercase",
                      toolStyle.bg,
                      toolStyle.text,
                      toolStyle.border
                    )}
                  >
                    {framework.install_tool}
                  </Badge>
                )}
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {author && (
                  <div className="flex items-center gap-1 text-zinc-400">
                    <span>by</span>
                    <span className="text-zinc-100">{author}</span>
                    {isVerified(author) && (
                      <BadgeCheck
                        size={14}
                        className="text-yellow-500 fill-yellow-500/20"
                      />
                    )}
                  </div>
                )}
                {framework.stars != null && framework.stars > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star
                      size={14}
                      className="text-amber-400 fill-amber-400/30"
                    />
                    <span className="text-zinc-100">
                      {formatStars(framework.stars)}
                    </span>
                    <span className="text-zinc-400">stars</span>
                  </div>
                )}
                {framework.contributors_count != null &&
                  framework.contributors_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-zinc-400" />
                      <span className="text-zinc-100">
                        {formatNumber(framework.contributors_count)}
                      </span>
                      <span className="text-zinc-400">contributors</span>
                    </div>
                  )}
                {framework.last_commit_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-zinc-400" />
                    <span className="text-zinc-400">Updated</span>
                    <span className="text-zinc-100">
                      {formatRelativeTime(framework.last_commit_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Bookmark */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBookmark(framework.id)}
            className="h-8 px-3 self-start"
          >
            <Bookmark
              size={14}
              className={cn(
                "mr-1",
                isBookmarked
                  ? "fill-primary text-primary"
                  : "text-muted-foreground"
              )}
            />
            {isBookmarked ? "Saved" : "Save"}
          </Button>
        </div>

        <p className="text-zinc-400 mb-4">
          {framework.description || "No description available"}
        </p>

        {/* Install command */}
        <div className="flex items-center gap-3 px-4 py-3 bg-black rounded-xl font-mono text-sm border border-zinc-800 mb-4">
          <span className="text-zinc-500 select-none">$</span>
          <code
            className="flex-1 overflow-x-auto whitespace-nowrap text-lime-400"
          >
            {framework.install_command}
          </code>
          <button
            onClick={copyCommand}
            className="flex-shrink-0 p-1.5 hover:bg-zinc-800 rounded transition-colors"
          >
            {copied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} className="text-zinc-500" />
            )}
          </button>
        </div>

        {/* Prerequisites */}
        {framework.prerequisites && framework.prerequisites.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-zinc-500">Requires:</span>
            {framework.prerequisites.map((prereq) => (
              <Badge
                key={prereq}
                variant="outline"
                className="text-xs text-zinc-400 border-zinc-700"
              >
                {prereq}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons + agent compat */}
        <div className="flex items-center gap-3 flex-wrap">
          {framework.homepage && (
            <Button asChild variant="outline" size="sm">
              <a
                href={framework.homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
                Website
              </a>
            </Button>
          )}
          {framework.github_url && (
            <Button asChild variant="outline" size="sm">
              <a
                href={framework.github_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={14} />
                GitHub
              </a>
            </Button>
          )}
          <div className="ml-auto">
            <AgentCompatibilityRow item={framework} size="sm" />
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-8">
          {/* How It Works */}
          {framework.how_it_works && (
            <div>
              <h2 className="text-lg font-semibold mb-3">How It Works</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {framework.how_it_works}
              </p>
            </div>
          )}

          {/* Workflow Steps Timeline */}
          {workflow?.steps && workflow.steps.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Workflow</h2>
              <div className="relative space-y-0">
                {/* Vertical line */}
                <div
                  className="absolute left-[15px] top-2 bottom-2 w-px bg-lime-500/30"
                />
                {workflow.steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
                    {/* Step number circle */}
                    <div
                      className="relative z-10 w-[31px] h-[31px] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border bg-lime-500/10 border-lime-500/30 text-lime-400"
                    >
                      {i + 1}
                    </div>
                    {/* Step content */}
                    <div className="flex-1 min-w-0 pt-0.5 space-y-2">
                      {step.command && (
                        <code
                          className="block text-sm font-mono px-3 py-1.5 bg-black rounded-lg border border-zinc-800 text-lime-400"
                        >
                          {step.command}
                        </code>
                      )}
                      {step.humanDecision && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-white font-bold shrink-0">
                            You decide:
                          </span>
                          <span className="text-zinc-400">
                            {step.humanDecision}
                          </span>
                        </div>
                      )}
                      {step.aiAction && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-white font-bold shrink-0">
                            AI does:
                          </span>
                          <span className="text-zinc-400">
                            {step.aiAction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatible Plugins */}
          {plugins.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Compatible Plugins ({plugins.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {plugins.map((plugin) => {
                  const typeConfig = getPluginTypeConfig(
                    plugin.plugin_type as PluginType
                  );
                  const TypeIcon = typeConfig.icon;
                  return (
                    <div
                      key={plugin.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center border flex-shrink-0",
                          typeConfig.colorClass,
                          typeConfig.bgClass,
                          typeConfig.borderClass
                        )}
                      >
                        <TypeIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium font-mono text-sm truncate">
                          {plugin.name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {cleanDescription(plugin.description) ||
                            "No description"}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 flex-shrink-0">
                        {formatNumber(plugin.install_count)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What's Included */}
          {hasComponents && (
            <WhatsIncluded
              skills={framework.skills}
              agents={framework.subagents}
              mcps={framework.mcps}
            />
          )}
      </div>
    </div>
  );
}
