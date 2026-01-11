"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallFooterProps {
  command?: string;
}

export function InstallFooter({
  command = "/plugin marketplace add anthropics/claude-plugins-official",
}: InstallFooterProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Spacer for fixed footer */}
      <div className="h-24" />

      {/* Fixed footer */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-30">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="p-4 bg-card border border-border rounded-2xl shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <Terminal size={20} className="text-primary flex-shrink-0" />
              <code className="flex-1 text-sm font-mono text-muted-foreground truncate">
                {command}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
                <span className="sr-only">Copy command</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
