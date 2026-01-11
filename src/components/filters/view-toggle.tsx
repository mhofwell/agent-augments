"use client";

import { Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-3 transition-colors",
          value === "grid"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Grid size={18} />
        <span className="sr-only">Grid view</span>
      </button>
      <button
        onClick={() => onChange("list")}
        className={cn(
          "p-3 transition-colors",
          value === "list"
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List size={18} />
        <span className="sr-only">List view</span>
      </button>
    </div>
  );
}
