"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Star,
  Github,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Terminal,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
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
import {
  getPluginTypeConfig,
  formatNumber,
  formatDate,
  getMarketplaceCommand,
} from "./plugin-utils";
import { usePluginFrameworks } from "@/hooks/usePluginFrameworks";
import { formatStars } from "@/components/framework/framework-utils";
import type { PluginWithMarketplace, PluginType, Framework } from "@/types/database";

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
    description: "Shared with your team via .claude/settings.json",
  },
  {
    value: "local",
    label: "Local",
    description: "This project only, not version controlled",
  },
];

function getInstallCommandWithScope(pluginName: string, marketplaceRepo: string, scope: InstallScope): string {
  return `/plugin install ${pluginName}@${marketplaceRepo} --scope ${scope}`;
}

interface PluginModalProps {
  plugin: PluginWithMarketplace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBookmarked?: boolean;
  isOfficial?: boolean;
  onBookmarkToggle?: () => void;
  onInstallClick?: (command: string) => void;
  onFrameworkClick?: (framework: Framework) => void;
}

export function PluginModal({
  plugin,
  open,
  onOpenChange,
  isBookmarked = false,
  isOfficial = false,
  onBookmarkToggle,
  onInstallClick,
  onFrameworkClick,
}: PluginModalProps) {
  const [selectedScope, setSelectedScope] = useState<InstallScope>("user");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const { getFrameworksForPlugin } = usePluginFrameworks();

  // Fetch frameworks when modal opens with a plugin
  useEffect(() => {
    if (open && plugin?.id) {
      getFrameworksForPlugin(plugin.id).then(setFrameworks);
    }
  }, [open, plugin?.id, getFrameworksForPlugin]);

  if (!plugin) return null;

  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
  const TypeIcon = typeConfig.icon;

  const marketplaceOwner = plugin.marketplace?.github_owner ?? "";
  const marketplaceRepo = plugin.marketplace?.github_repo ?? "";
  const marketplaceCommand = getMarketplaceCommand(marketplaceOwner, marketplaceRepo);
  const installCommand = getInstallCommandWithScope(plugin.name, marketplaceRepo, selectedScope);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    onInstallClick?.(text);
    toast.success("Copied to clipboard", {
      description: "Paste in Claude Code to install",
    });
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const githubUrl = `https://github.com/${marketplaceOwner}/${marketplaceRepo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center border",
                  typeConfig.colorClass,
                  typeConfig.bgClass,
                  typeConfig.borderClass
                )}
              >
                <TypeIcon size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-2xl font-bold font-mono">
                    {plugin.name}
                  </DialogTitle>
                  {isOfficial && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      Official
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <Terminal size={12} className="mr-1" />
                    Claude Code
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  by {plugin.author_name || plugin.marketplace?.name || `${marketplaceOwner}/${marketplaceRepo}`}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {plugin.description || "No description available"}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Download size={16} />
              <span className="text-foreground font-medium">
                {formatNumber(plugin.install_count)}
              </span>
              <span className="text-sm">installs</span>
            </div>
            {plugin.category && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star size={16} />
                <span className="text-foreground font-medium">{plugin.category}</span>
              </div>
            )}
            {plugin.updated_at && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                Updated {formatDate(plugin.updated_at)}
              </div>
            )}
          </div>

          {/* Tags */}
          {plugin.tags && plugin.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plugin.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Plugin capabilities */}
          {(plugin.has_skills || plugin.has_agents || plugin.has_commands || plugin.has_hooks || plugin.has_mcp_servers) && (
            <div className="flex flex-wrap gap-2">
              {plugin.has_skills && (
                <Badge variant="secondary" className="bg-type-skill/10 text-type-skill border-type-skill/30">
                  Skills
                </Badge>
              )}
              {plugin.has_agents && (
                <Badge variant="secondary" className="bg-type-agent/10 text-type-agent border-type-agent/30">
                  Agents
                </Badge>
              )}
              {plugin.has_commands && (
                <Badge variant="secondary" className="bg-type-command/10 text-type-command border-type-command/30">
                  Commands
                </Badge>
              )}
              {plugin.has_hooks && (
                <Badge variant="secondary" className="bg-type-hook/10 text-type-hook border-type-hook/30">
                  Hooks
                </Badge>
              )}
              {plugin.has_mcp_servers && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  MCP Servers
                </Badge>
              )}
            </div>
          )}

          {/* Works with Frameworks */}
          {frameworks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Works with
              </h3>
              <div className="flex flex-wrap gap-2">
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => onFrameworkClick?.(fw)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                    style={{ borderColor: `${fw.color}40` }}
                  >
                    <Terminal size={14} style={{ color: fw.color || undefined }} />
                    <span className="text-sm font-medium">{fw.name}</span>
                    {fw.stars && fw.stars > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        {formatStars(fw.stars)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Installation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Installation
            </h3>

            {/* Marketplace command (first time only) */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Add marketplace (first time only):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-background rounded-lg font-mono text-sm text-emerald-400 border border-border overflow-x-auto">
                  {marketplaceCommand}
                </code>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => copyToClipboard(marketplaceCommand, "marketplace")}
                  className="flex-shrink-0"
                >
                  {copiedCommand === "marketplace" ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </div>
            </div>

            {/* Scope selection */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Choose installation scope:
              </p>
              <div className="space-y-2">
                {scopeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedScope === option.value
                        ? "bg-primary/5 border-primary/50"
                        : "bg-background border-border hover:border-border/80"
                    )}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={option.value}
                      checked={selectedScope === option.value}
                      onChange={() => setSelectedScope(option.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Install command */}
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-background rounded-lg font-mono text-sm text-primary border border-border overflow-x-auto">
                {installCommand}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => copyToClipboard(installCommand, "install")}
                className="flex-shrink-0"
              >
                {copiedCommand === "install" ? (
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
                <span>First time installing plugins?</span>
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", helpOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-background rounded-lg border border-border p-4 space-y-3 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open Claude Code in your terminal</li>
                    <li>Run the marketplace command above (only needed once per marketplace)</li>
                    <li>Run the install command to add the plugin</li>
                    <li>The plugin will be available in your next Claude Code session</li>
                  </ol>
                  <Separator />
                  <a
                    href="https://docs.anthropic.com/en/docs/claude-code/plugins"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    Learn more in the Claude Code docs
                    <ExternalLink size={12} />
                  </a>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" asChild>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Github size={18} className="mr-2" />
                View Repository
                <ExternalLink size={14} className="ml-2 opacity-50" />
              </a>
            </Button>
            {onBookmarkToggle && (
              <Button
                variant={isBookmarked ? "default" : "secondary"}
                size="icon"
                onClick={onBookmarkToggle}
                className={cn(
                  isBookmarked && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                )}
              >
                {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
