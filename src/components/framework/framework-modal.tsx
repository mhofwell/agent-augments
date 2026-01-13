"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Github, ExternalLink, Terminal, Star, Bookmark, HelpCircle, ChevronDown } from "lucide-react";
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
import { getToolStyle, formatStars } from "./framework-utils";
import { usePluginFrameworks } from "@/hooks/usePluginFrameworks";
import { getPluginTypeConfig, formatNumber } from "@/components/plugin/plugin-utils";
import { getCompatibleAgents } from "@/lib/agents";
import type { Framework, PluginWithMarketplace, PluginType } from "@/types/database";

interface FrameworkModalProps {
  framework: Framework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onPluginClick?: (plugin: PluginWithMarketplace) => void;
}

export function FrameworkModal({
  framework,
  open,
  onOpenChange,
  isBookmarked,
  onToggleBookmark,
  onPluginClick,
}: FrameworkModalProps) {
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [plugins, setPlugins] = useState<PluginWithMarketplace[]>([]);
  const { getPluginsForFramework } = usePluginFrameworks();

  // Fetch plugins when modal opens with a framework
  useEffect(() => {
    if (open && framework?.id) {
      getPluginsForFramework(framework.id).then(setPlugins);
    }
  }, [open, framework?.id, getPluginsForFramework]);

  if (!framework) return null;

  const toolStyle = getToolStyle(framework.install_tool);
  const compatibleAgents = getCompatibleAgents(framework.id);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border border-border"
              style={{ backgroundColor: `${framework.color}20`, borderColor: `${framework.color}50` }}
            >
              <Terminal size={28} style={{ color: framework.color || undefined }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-2xl font-bold">
                  {framework.name}
                </DialogTitle>
                {framework.install_tool && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs uppercase", toolStyle.bg, toolStyle.text, toolStyle.border)}
                  >
                    {framework.install_tool}
                  </Badge>
                )}
                {framework.stars && framework.stars > 0 && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    {formatStars(framework.stars)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm">
                  Development Framework
                </p>
                {onToggleBookmark && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleBookmark}
                    className="h-7 px-2"
                  >
                    <Bookmark
                      size={14}
                      className={cn(
                        "mr-1",
                        isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {framework.description || "No description available"}
          </p>

          {/* Works with agents */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Works With
            </h3>
            <div className="flex flex-wrap gap-2">
              {compatibleAgents.map((agent) => (
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
          </div>

          {/* Prerequisites */}
          {framework.prerequisites && framework.prerequisites.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Prerequisites
              </h3>
              <div className="flex flex-wrap gap-2">
                {framework.prerequisites.map((prereq) => (
                  <Badge key={prereq} variant="outline" className="text-sm">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Install Command */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Installation
            </h3>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-4 py-3 bg-background rounded-lg font-mono text-sm border border-border overflow-x-auto"
                style={{ color: framework.color || undefined }}
              >
                {framework.install_command}
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
                <span>First time using frameworks?</span>
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", helpOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-background rounded-lg border border-border p-4 space-y-3 text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open your terminal in your project directory</li>
                    <li>Copy the install command above</li>
                    <li>Paste and run the command</li>
                    <li>Follow any setup prompts from the framework</li>
                  </ol>
                  <Separator />
                  <p className="text-xs">
                    Frameworks are development methodologies that work with any AI coding agent.
                    They provide structured workflows and best practices for your projects.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {framework.homepage && (
              <Button variant="secondary" className="flex-1" asChild>
                <a href={framework.homepage} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={18} className="mr-2" />
                  Documentation
                </a>
              </Button>
            )}
            {framework.github_url && (
              <Button variant="secondary" className="flex-1" asChild>
                <a href={framework.github_url} target="_blank" rel="noopener noreferrer">
                  <Github size={18} className="mr-2" />
                  Repository
                </a>
              </Button>
            )}
          </div>

          {/* Compatible Plugins */}
          {plugins.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Compatible Plugins ({plugins.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {plugins.map((plugin) => {
                  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
                  const TypeIcon = typeConfig.icon;
                  return (
                    <button
                      key={plugin.id}
                      onClick={() => onPluginClick?.(plugin)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors text-left"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center border",
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
                        <div className="text-xs text-muted-foreground truncate">
                          {plugin.description || "No description"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(plugin.install_count)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
