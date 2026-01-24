"use client";

import { Bot } from "lucide-react";
import { getMethodologyConfig } from "@/lib/framework-config";
import { cn } from "@/lib/utils";

interface MethodologyCardProps {
  methodology: string | null | undefined;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Displays methodology with greyscale card styling.
 * Returns null if methodology is not set or not found in config.
 */
export function MethodologyCard({
  methodology,
  variant = "default",
  className,
}: MethodologyCardProps) {
  const config = getMethodologyConfig(methodology);
  if (!config) return null;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50",
          className
        )}
      >
        <Bot size={14} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-200">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn("p-4 rounded-xl border border-zinc-800 bg-zinc-900/50", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-800">
          <Bot size={20} className="text-zinc-300" />
        </div>
        <div>
          <div className="font-semibold text-white mb-1">{config.label}</div>
          <div className="text-sm text-zinc-400 leading-relaxed">{config.description}</div>
        </div>
      </div>
    </div>
  );
}
