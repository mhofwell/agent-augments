"use client";

import { useState, useEffect, useMemo } from "react";
import type { PluginWithMarketplace } from "@/types/database";

interface CategoryData {
  category: string;
  count: number;
  plugins: PluginWithMarketplace[];
}

interface UsePluginsByCategoryOptions {
  agent?: string;
  perCategory?: number;
}

interface UsePluginsByCategoryResult {
  categories: CategoryData[];
  isLoading: boolean;
  error: Error | null;
  pluginsByCategory: Map<string, PluginWithMarketplace[]>;
  categoryTotals: Map<string, number>;
}

export function usePluginsByCategory(
  options: UsePluginsByCategoryOptions = {}
): UsePluginsByCategoryResult {
  const { agent = "claude-code", perCategory = 6 } = options;

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          agent: agent || "claude-code",
          per_category: perCategory.toString(),
        });

        const response = await fetch(`/api/plugins/categories?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [agent, perCategory]);

  // Transform into Maps for CategoryBrowse component
  const pluginsByCategory = useMemo(() => {
    const map = new Map<string, PluginWithMarketplace[]>();
    for (const cat of categories) {
      map.set(cat.category, cat.plugins);
    }
    return map;
  }, [categories]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of categories) {
      map.set(cat.category, cat.count);
    }
    return map;
  }, [categories]);

  return {
    categories,
    isLoading,
    error,
    pluginsByCategory,
    categoryTotals,
  };
}
