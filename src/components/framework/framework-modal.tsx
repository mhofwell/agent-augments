"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Github, ExternalLink, Terminal, Star, Bookmark } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getToolStyle, formatStars } from "./framework-utils";
import {
  AgentCompatibilityRow,
  MethodologyCard,
  AutonomyCard,
  UseCasesBadges,
  FeaturesList,
} from "./shared";
import { usePluginFrameworks } from "@/hooks/usePluginFrameworks";
import { getPluginTypeConfig, formatNumber, cleanDescription } from "@/components/plugin/plugin-utils";
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
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border border-border flex-shrink-0"
                style={{ backgroundColor: `${framework.color}20`, borderColor: `${framework.color}50` }}
              >
                <Terminal size={28} style={{ color: framework.color || undefined }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-2xl font-bold break-words">
                    {framework.name}
                  </DialogTitle>
                  {framework.install_tool && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs uppercase flex-shrink-0", toolStyle.bg, toolStyle.text, toolStyle.border)}
                    >
                      {framework.install_tool}
                    </Badge>
                  )}
                  {framework.stars && framework.stars > 0 && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
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

            {/* Agent compatibility icons */}
            <AgentCompatibilityRow
              item={framework}
              size="md"
              className="flex-shrink-0"
            />
          </div>
        </DialogHeader>

        <Separator />

        {/* Content */}
        <div className="p-6 space-y-6 overflow-hidden">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed break-words">
            {framework.description || "No description available"}
          </p>

          {/* Highlights - Methodology & Autonomy */}
          {(framework.methodology || framework.autonomy_level) && (
            <div className="flex flex-wrap gap-2">
              <MethodologyCard methodology={framework.methodology} variant="compact" />
              <AutonomyCard autonomyLevel={framework.autonomy_level} variant="compact" />
            </div>
          )}

          {/* Best For - Use Cases */}
          {framework.use_cases && framework.use_cases.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Best For
              </h3>
              <UseCasesBadges useCases={framework.use_cases} variant="compact" maxItems={5} />
            </div>
          )}

          {/* Features */}
          {framework.features && framework.features.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Features
              </h3>
              <FeaturesList features={framework.features} variant="compact" maxItems={4} />
            </div>
          )}

          {/* Install Command */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 min-w-0">
              <code
                className="flex-1 min-w-0 px-4 py-3 bg-background rounded-lg font-mono text-sm border border-border overflow-x-auto whitespace-nowrap"
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
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {framework.homepage && (
              <Button variant="secondary" className="flex-1" asChild>
                <a href={framework.homepage} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={18} className="mr-2" />
                  Website
                </a>
              </Button>
            )}
            {framework.github_url && (
              <Button variant="secondary" className="flex-1" asChild>
                <a href={framework.github_url} target="_blank" rel="noopener noreferrer">
                  <Github size={18} className="mr-2" />
                  GitHub
                </a>
              </Button>
            )}
          </div>

          {/* Compatible Plugins */}
          {plugins.length > 0 && (
            <div className="overflow-hidden w-full">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Compatible Plugins ({plugins.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden w-full">
                {plugins.map((plugin) => {
                  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
                  const TypeIcon = typeConfig.icon;
                  return (
                    <button
                      key={plugin.id}
                      onClick={() => onPluginClick?.(plugin)}
                      className="w-full max-w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary transition-colors text-left"
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
                        <div className="text-xs text-muted-foreground truncate max-w-full">
                          {cleanDescription(plugin.description) || "No description"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
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
