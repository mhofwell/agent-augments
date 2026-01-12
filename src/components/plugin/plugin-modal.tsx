"use client";

import { useState } from "react";
import {
  Download,
  Star,
  Github,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getPluginTypeConfig,
  formatNumber,
  formatDate,
  getInstallCommand,
  getMarketplaceCommand,
} from "./plugin-utils";
import type { PluginWithMarketplace, PluginType } from "@/types/database";

interface PluginModalProps {
  plugin: PluginWithMarketplace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBookmarked?: boolean;
  isOfficial?: boolean;
  onBookmarkToggle?: () => void;
  onInstallClick?: (command: string) => void;
}

export function PluginModal({
  plugin,
  open,
  onOpenChange,
  isBookmarked = false,
  isOfficial = false,
  onBookmarkToggle,
  onInstallClick,
}: PluginModalProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  if (!plugin) return null;

  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
  const TypeIcon = typeConfig.icon;

  const marketplaceOwner = plugin.marketplace?.github_owner ?? "";
  const marketplaceRepo = plugin.marketplace?.github_repo ?? "";
  const marketplaceCommand = getMarketplaceCommand(marketplaceOwner, marketplaceRepo);
  const installCommand = getInstallCommand(plugin.name, marketplaceRepo);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    onInstallClick?.(text);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const githubUrl = `https://github.com/${marketplaceOwner}/${marketplaceRepo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0">
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
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl font-bold font-mono">
                    {plugin.name}
                  </DialogTitle>
                  {isOfficial && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      Official
                    </Badge>
                  )}
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

          {/* Install Commands */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Installation
            </h3>
            <div className="space-y-2">
              {/* Marketplace command */}
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-background rounded-lg font-mono text-sm text-emerald-400 border border-border overflow-x-auto">
                  <span className="text-muted-foreground"># Add marketplace first</span>
                  <br />
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

              {/* Install command */}
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-background rounded-lg font-mono text-sm text-primary border border-border overflow-x-auto">
                  <span className="text-muted-foreground"># Install plugin</span>
                  <br />
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
            </div>
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
