import { Sparkles, Bot, Command, Package, Webhook, Code, type LucideIcon } from "lucide-react";
import type { PluginType } from "@/types/database";

export const pluginTypeConfig: Record<
  PluginType,
  {
    label: string;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  skill: {
    label: "Skill",
    icon: Sparkles,
    colorClass: "text-type-skill",
    bgClass: "bg-type-skill/10",
    borderClass: "border-type-skill/30",
  },
  agent: {
    label: "Agent",
    icon: Bot,
    colorClass: "text-type-agent",
    bgClass: "bg-type-agent/10",
    borderClass: "border-type-agent/30",
  },
  command: {
    label: "Command",
    icon: Command,
    colorClass: "text-type-command",
    bgClass: "bg-type-command/10",
    borderClass: "border-type-command/30",
  },
  bundle: {
    label: "Bundle",
    icon: Package,
    colorClass: "text-type-bundle",
    bgClass: "bg-type-bundle/10",
    borderClass: "border-type-bundle/30",
  },
  hook: {
    label: "Hook",
    icon: Webhook,
    colorClass: "text-type-hook",
    bgClass: "bg-type-hook/10",
    borderClass: "border-type-hook/30",
  },
  unknown: {
    label: "Plugin",
    icon: Code,
    colorClass: "text-type-unknown",
    bgClass: "bg-type-unknown/10",
    borderClass: "border-type-unknown/30",
  },
};

export function getPluginTypeConfig(type: PluginType | null | undefined) {
  return pluginTypeConfig[type ?? "unknown"];
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function getInstallCommand(pluginName: string, marketplaceRepo: string): string {
  return `/plugin install ${pluginName}@${marketplaceRepo}`;
}

export function getMarketplaceCommand(owner: string, repo: string): string {
  return `/plugin marketplace add ${owner}/${repo}`;
}
