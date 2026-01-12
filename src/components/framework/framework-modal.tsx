"use client";

import { useState } from "react";
import { Copy, Check, Github, ExternalLink, Terminal } from "lucide-react";
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
import { getToolStyle } from "./framework-utils";
import type { Framework } from "@/types/database";

interface FrameworkModalProps {
  framework: Framework | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FrameworkModal({
  framework,
  open,
  onOpenChange,
}: FrameworkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!framework) return null;

  const toolStyle = getToolStyle(framework.install_tool);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(framework.install_command);
      setCopied(true);
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
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Development Framework
              </p>
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
