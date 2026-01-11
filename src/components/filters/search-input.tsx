"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search plugins, commands, agents...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        size={20}
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-12 pr-10 py-3 h-auto bg-card border-border focus-visible:ring-primary/20"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
