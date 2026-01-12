"use client";

import { useState, useEffect, useCallback } from "react";
import type { PluginWithMarketplace, PluginType } from "@/types/database";

export type SortOption = "downloads" | "updated" | "name";
export type TabOption = "discover" | "featured" | "new" | "frameworks" | "bookmarks";

interface UsePluginsParams {
  search?: string;
  type?: PluginType | "All";
  category?: string;
  marketplace?: string;
  sort?: SortOption;
  tab?: TabOption;
  page?: number;
  limit?: number;
}

interface UsePluginsResult {
  plugins: PluginWithMarketplace[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refetch: () => Promise<void>;
}

export function usePlugins(params: UsePluginsParams = {}): UsePluginsResult {
  const {
    search = "",
    type = "All",
    category = "All",
    marketplace = "All",
    sort = "downloads",
    tab = "discover",
    page = 1,
    limit = 24,
  } = params;

  const [plugins, setPlugins] = useState<PluginWithMarketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
  });

  const fetchPlugins = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (type !== "All") params.set("type", type);
      if (category !== "All") params.set("category", category);
      if (marketplace !== "All") params.set("marketplace", marketplace);
      if (tab !== "discover") params.set("tab", tab);

      // Map sort options to API format
      const sortMap: Record<SortOption, string> = {
        downloads: "installs",
        updated: "newest",
        name: "name",
      };
      params.set("sort", sortMap[sort]);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await fetch(`/api/plugins?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }

      const data = await response.json();
      setPlugins(data.plugins);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPlugins([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, type, category, marketplace, sort, tab, page, limit]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  return {
    plugins,
    isLoading,
    error,
    pagination,
    refetch: fetchPlugins,
  };
}
