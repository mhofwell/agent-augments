"use client";

import { Filter, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Marketplace, Framework } from "@/types/database";
import type { SortOption } from "@/hooks";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "New (7 days)" },
  { value: "updated", label: "Recently Updated" },
  { value: "name", label: "Name A-Z" },
];

const categories = [
  "All",
  "Development",
  "Code Review",
  "Security",
  "AI Agents",
  "Debugging",
  "Documentation",
  "Testing",
  "Design",
  "DevOps",
  "Database",
  "Productivity",
  "Data",
  "Git",
] as const;

interface FilterPanelProps {
  category: string;
  onCategoryChange: (category: string) => void;
  marketplace: string;
  onMarketplaceChange: (marketplace: string) => void;
  framework: string;
  onFrameworkChange: (framework: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  marketplaces: Marketplace[];
  frameworks: Framework[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function FilterPanel({
  category,
  onCategoryChange,
  marketplace,
  onMarketplaceChange,
  framework,
  onFrameworkChange,
  sortBy,
  onSortChange,
  marketplaces,
  frameworks,
  showFilters,
  onToggleFilters,
}: FilterPanelProps) {
  const hasActiveFilters =
    category !== "All" || marketplace !== "All" || framework !== "All";

  return (
    <div className="space-y-4">
      {/* Filter toggle button */}
      <Button
        variant="outline"
        onClick={onToggleFilters}
        className={cn(
          "transition-colors",
          showFilters && "bg-primary/10 border-primary/30 text-primary"
        )}
      >
        <Filter size={18} className="mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
            Active
          </span>
        )}
      </Button>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-card/50 rounded-xl border border-border animate-in slide-in-from-top-2 duration-200">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Category
            </label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Framework */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Framework
            </label>
            <Select value={framework} onValueChange={onFrameworkChange}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="All Frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Frameworks</SelectItem>
                {frameworks.map((fw) => (
                  <SelectItem key={fw.id} value={fw.id}>
                    <span className="flex items-center gap-2">
                      <Terminal size={12} style={{ color: fw.color || undefined }} />
                      {fw.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marketplace */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Marketplace
            </label>
            <Select value={marketplace} onValueChange={onMarketplaceChange}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="All Marketplaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Marketplaces</SelectItem>
                {marketplaces.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || `${m.github_owner}/${m.github_repo}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Sort By
            </label>
            <Select
              value={sortBy}
              onValueChange={(v) => onSortChange(v as SortOption)}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
