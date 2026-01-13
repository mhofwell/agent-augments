"use client";

import { cn } from "@/lib/utils";
import { pluginTypeConfig } from "@/components/plugin/plugin-utils";
import type { PluginType } from "@/types/database";

const typeOrder: PluginType[] = ["skill", "agent", "command", "hook", "bundle"];

interface TypeQuickFilterProps {
  value: PluginType | "All";
  onChange: (type: PluginType | "All") => void;
}

export function TypeQuickFilter({ value, onChange }: TypeQuickFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("All")}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          value === "All"
            ? "bg-foreground text-background"
            : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        )}
      >
        All
      </button>
      {typeOrder.map((type) => {
        const config = pluginTypeConfig[type];
        const Icon = config.icon;
        const isActive = value === type;

        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              isActive
                ? cn(config.bgClass, config.colorClass, "ring-1", config.borderClass)
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Icon size={14} className={isActive ? config.colorClass : ""} />
            {config.label}s
          </button>
        );
      })}
    </div>
  );
}
