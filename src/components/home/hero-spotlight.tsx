"use client";

import { useState } from "react";
import { Download, Copy, Check, ExternalLink, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getPluginTypeConfig, formatNumber, getInstallCommand, cleanDescription } from "@/components/plugin/plugin-utils";
import { getPublisher, getCategoryDisplayName } from "@/lib/publishers";
import type { PluginWithMarketplace, PluginType } from "@/types/database";

interface HeroSpotlightProps {
  plugins: PluginWithMarketplace[];
  onPluginClick: (plugin: PluginWithMarketplace) => void;
}

export function HeroSpotlight({ plugins, onPluginClick }: HeroSpotlightProps) {
  if (plugins.length === 0) return null;

  const primary = plugins[0];
  const secondary = plugins[1];

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Sparkles size={16} className="text-amber-400" />
        </div>
        <h2 className="font-semibold text-lg">Spotlight</h2>
      </div>

      {/* Spotlight cards */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Primary spotlight */}
        <div className="h-full">
          <SpotlightCard plugin={primary} isPrimary onClick={() => onPluginClick(primary)} />
        </div>

        {/* Secondary spotlight */}
        {secondary && (
          <div className="h-full">
            <SpotlightCard plugin={secondary} onClick={() => onPluginClick(secondary)} />
          </div>
        )}
      </div>
    </section>
  );
}

interface SpotlightCardProps {
  plugin: PluginWithMarketplace;
  isPrimary?: boolean;
  onClick: () => void;
}

function SpotlightCard({ plugin, isPrimary = false, onClick }: SpotlightCardProps) {
  const [copied, setCopied] = useState(false);
  const typeConfig = getPluginTypeConfig(plugin.plugin_type as PluginType);
  const TypeIcon = typeConfig.icon;
  const publisher = getPublisher(plugin.marketplace?.github_owner || "");

  const marketplaceRepo = plugin.marketplace?.github_repo ?? "";
  const installCommand = getInstallCommand(plugin.name, marketplaceRepo);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    toast.success("Copied to clipboard", {
      description: "Paste in Claude Code to install",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl cursor-pointer transition-all duration-300 h-full",
        "bg-gradient-to-br from-card/80 to-card/40",
        "border border-border/50 hover:border-primary/30",
        "backdrop-blur-sm",
        // Glow effect on hover
        "hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.3)]",
        "p-6"
      )}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-type-agent/5" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top row: Type badge + Publisher/Official + Agent */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Type badge */}
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border",
                typeConfig.colorClass,
                typeConfig.bgClass,
                typeConfig.borderClass
              )}
            >
              <TypeIcon size={14} />
              {typeConfig.label}
            </span>

            {/* Publisher badge */}
            {publisher?.isOfficial && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg border border-primary/20">
                Official
              </span>
            )}
          </div>

          {/* Agent badge */}
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Terminal size={12} />
            Claude
          </span>
        </div>

        {/* Name and author */}
        <div className="mb-4">
          <h3 className="font-bold font-mono text-xl group-hover:text-primary transition-colors">
            {plugin.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {plugin.author_name ? (
              <span>by <span className="text-foreground/80">{plugin.author_name}</span></span>
            ) : (
              <span>{plugin.marketplace?.name || `${plugin.marketplace?.github_owner}/${plugin.marketplace?.github_repo}`}</span>
            )}
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-6 line-clamp-4">
          {cleanDescription(plugin.description) || "No description available"}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5">
            <Download size={14} />
            <span className="font-medium text-foreground">{formatNumber(plugin.install_count)}</span>
            installs
          </span>
          {plugin.category && (
            <span className="px-2 py-0.5 bg-secondary rounded-md text-xs">
              {getCategoryDisplayName(plugin.category)}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center justify-center gap-2 min-w-[100px] px-4 py-2.5 rounded-lg font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-lg shadow-primary/20 hover:shadow-primary/30"
            )}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>

          {/* Details button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex items-center justify-center gap-2 min-w-[100px] px-4 py-2.5 rounded-lg font-medium transition-colors bg-secondary hover:bg-secondary/80 text-foreground"
          >
            Details
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
