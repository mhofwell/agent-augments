"use client";

import { useState } from "react";
import { Copy, Check, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatStars } from "@/components/plugin/plugin-utils";
import { trackComponentInstall } from "@/hooks/useComponentLibraries";
import type { ComponentLibrary } from "@/types/database";

// Component library logo mapping (official integrations only)
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

interface ComponentCardProps {
  library: ComponentLibrary;
  onClick?: () => void;
}

export function ComponentCard({ library, onClick }: ComponentCardProps) {
  const [copied, setCopied] = useState(false);

  // Use MCP install command if available, otherwise skill install command
  const primaryCommand = library.mcp_install_command || library.skill_install_command || "";
  const installType = library.mcp_install_command ? "mcp" : "skill";

  // Get tech stack badges
  const techStack = LIBRARY_TECH_STACKS[library.slug] || [];

  const copyCommand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primaryCommand) return;

    try {
      await navigator.clipboard.writeText(primaryCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track install click
      trackComponentInstall(library.id, installType);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className="group relative bg-card/50 border border-border rounded-xl hover:border-violet-500/30 hover:bg-card hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 ease-out cursor-pointer p-5 flex flex-col"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo placeholder - colored circle */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${library.color}20` }}
          >
            {COMPONENT_LOGOS[library.slug] ? (
              <img
                src={COMPONENT_LOGOS[library.slug]}
                alt={`${library.name} logo`}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: library.color || "#8B5CF6" }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-violet-400 transition-colors truncate">
                {library.name}
              </h3>
              {library.is_official && (
                <BadgeCheck size={16} className="text-yellow-500 fill-yellow-500/20 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          {formatStars(library.github_stars)}
        </div>
      </div>


      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
        {library.description}
      </p>

      {/* Tech stack icons */}
      {techStack.length > 0 && (
        <div className="flex items-center gap-2 py-3">
          {techStack.map((tech) => {
            const { icon, label } = TECH_ICONS[tech];
            return (
              <img
                key={tech}
                src={icon}
                alt={label}
                title={label}
                className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
              />
            );
          })}
        </div>
      )}

      {/* Spacer to push install command to bottom */}
      <div className="flex-1" />

      {/* Install Command */}
      {primaryCommand && (
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-background rounded-lg font-mono text-xs text-violet-400 border border-border truncate">
            {primaryCommand}
          </code>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={copyCommand}
          >
            {copied ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </Button>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent rounded-xl" />
      </div>
    </div>
  );
}
