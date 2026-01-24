"use client";

import { useState } from "react";
import { Copy, Check, Github, Plug, BookOpen, BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ComponentLibrary } from "@/types/database";
import { trackComponentInstall } from "@/hooks/useComponentLibraries";

// Agent tabs configuration
const AGENTS = [
  { id: "cursor", label: "Cursor" },
  { id: "windsurf", label: "Windsurf" },
  { id: "claude", label: "Claude" },
  { id: "cline", label: "Cline" },
  { id: "roo-cline", label: "Roo-Cline" },
] as const;

type AgentId = typeof AGENTS[number]["id"];

// Package manager tabs configuration
const PACKAGE_MANAGERS = [
  { id: "pnpm", label: "pnpm", prefix: "pnpm dlx" },
  { id: "npm", label: "npm", prefix: "npx" },
  { id: "yarn", label: "yarn", prefix: "yarn dlx" },
  { id: "bun", label: "bun", prefix: "bunx --bun" },
] as const;

type PackageManagerId = typeof PACKAGE_MANAGERS[number]["id"];

// Generate install command from CLI package, agent, and package manager
function generateInstallCommand(cliPackage: string, agent: AgentId, pkgManager: PackageManagerId): string {
  const pm = PACKAGE_MANAGERS.find(p => p.id === pkgManager);
  if (!pm) return "";
  return `${pm.prefix} ${cliPackage} install ${agent}`;
}

// Component library logo mapping
const COMPONENT_LOGOS: Record<string, string> = {
  "shadcn-ui": "/shadcn-dark.svg",
  "magic-ui": "/magicui-light.png",
  "material-ui": "/material-ui.svg",
  "chakra-ui": "/chakra-ui.svg",
  "storybook": "/storybook.svg",
  "flowbite": "/flowbite.svg",
  "daisyui": "/daisyui.svg",
  "flyonui": "/flyonui.svg",
  "frontend-design": "/claude-star-dark.svg",
};

// Tech stack icons for each library
type TechStack = "react" | "tailwind" | "radix";

const LIBRARY_TECH_STACKS: Record<string, TechStack[]> = {
  "shadcn-ui": ["react", "tailwind", "radix"],
  "magic-ui": ["react", "tailwind"],
  "material-ui": ["react"],
  "chakra-ui": ["react"],
  "storybook": ["react"],
  "flowbite": ["tailwind"],
  "daisyui": ["tailwind"],
  "flyonui": ["tailwind"],
  "frontend-design": ["react", "tailwind"],
};

const TECH_ICONS: Record<TechStack, { icon: string; label: string }> = {
  react: { icon: "/react-dark.svg", label: "React" },
  tailwind: { icon: "/tailwind-dark.svg", label: "Tailwind" },
  radix: { icon: "/radix-dark.svg", label: "Radix" },
};

interface ComponentModalProps {
  library: ComponentLibrary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatStars(stars: number | null): string {
  if (!stars) return "0";
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

export function ComponentModal({ library, open, onOpenChange }: ComponentModalProps) {
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("cursor");
  const [selectedPkgManager, setSelectedPkgManager] = useState<PackageManagerId>("pnpm");

  if (!library) return null;

  // Check if we have CLI package for dynamic command generation
  const hasCliPackage = !!library.mcp_cli_package;

  const getCurrentCommand = (): string | null => {
    // If we have a CLI package, generate the command dynamically
    if (hasCliPackage && library.mcp_cli_package) {
      return generateInstallCommand(library.mcp_cli_package, selectedAgent, selectedPkgManager);
    }
    // Fallback to legacy single command
    return library.mcp_install_command || null;
  };

  const copyMcpCommand = async () => {
    const command = getCurrentCommand();
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedMcp(true);
      toast.success("Copied install command", {
        description: "Paste in your terminal to install",
      });
      setTimeout(() => setCopiedMcp(false), 2000);
      trackComponentInstall(library.id, "mcp");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const techStack = LIBRARY_TECH_STACKS[library.slug] || [];
  const logoUrl = COMPONENT_LOGOS[library.slug];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 p-0 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border border-zinc-700"
              style={{ backgroundColor: `${library.color}20` }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={library.name} className="w-8 h-8 object-contain" />
              ) : (
                <Plug size={28} className="text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl font-bold break-words text-white">
                  {library.name}
                </DialogTitle>
                {library.is_official && (
                  <BadgeCheck size={18} className="text-yellow-500 fill-yellow-500/20" />
                )}
                {library.github_stars && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    {formatStars(library.github_stars)}
                  </span>
                )}
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
              {library.description}
            </p>
          </div>

          {/* Tech Stack */}
          {techStack.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Tech Stack
              </h3>
              <div className="flex items-center gap-3">
                {techStack.map((tech) => {
                  const { icon, label } = TECH_ICONS[tech];
                  return (
                    <div key={tech} className="flex items-center gap-2">
                      <img
                        src={icon}
                        alt={label}
                        className="w-6 h-6"
                      />
                      <span className="text-sm text-zinc-300">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MCP Integration */}
          {library.has_mcp && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                MCP Server
              </h3>

              {/* Dynamic install with agent + package manager tabs */}
              {hasCliPackage ? (
                <div className="space-y-3">
                  {/* Agent tabs */}
                  <div className="flex flex-wrap gap-1">
                    {AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          selectedAgent === agent.id
                            ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                            : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {agent.label}
                      </button>
                    ))}
                  </div>

                  {/* Package manager tabs + command */}
                  <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden">
                    {/* Package manager row */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                      {PACKAGE_MANAGERS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => setSelectedPkgManager(pm.id)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            selectedPkgManager === pm.id
                              ? "bg-zinc-700 text-white"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>

                    {/* Command */}
                    <div className="flex items-center gap-2 p-3">
                      <code className="flex-1 font-mono text-sm text-violet-400 overflow-x-auto whitespace-nowrap">
                        {getCurrentCommand()}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyMcpCommand}
                        className="flex-shrink-0 h-8 w-8 hover:bg-zinc-800"
                      >
                        {copiedMcp ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} className="text-zinc-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : library.mcp_install_command ? (
                <div className="flex items-center gap-2 min-w-0">
                  <code className="flex-1 min-w-0 px-4 py-3 bg-black rounded-lg font-mono text-sm border border-zinc-800 overflow-x-auto whitespace-nowrap text-violet-400">
                    {library.mcp_install_command}
                  </code>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={copyMcpCommand}
                    className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                  >
                    {copiedMcp ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {library.github_url && (
              <Button
                variant="secondary"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                asChild
              >
                <a href={library.github_url} target="_blank" rel="noopener noreferrer">
                  <Github size={18} className="mr-2" />
                  GitHub
                </a>
              </Button>
            )}
            {library.docs_url && (
              <Button
                variant="secondary"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                asChild
              >
                <a href={library.docs_url} target="_blank" rel="noopener noreferrer">
                  <BookOpen size={18} className="mr-2" />
                  Docs
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
