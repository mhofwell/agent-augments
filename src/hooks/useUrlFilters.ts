"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { PluginType } from "@/types/database";
import type { SortOption, TabOption } from "./usePlugins";

interface UrlFilters {
  search: string;
  type: PluginType | "All";
  category: string;
  marketplace: string;
  sort: SortOption;
  tab: TabOption;
  view: "grid" | "list";
}

const DEFAULTS: UrlFilters = {
  search: "",
  type: "All",
  category: "All",
  marketplace: "All",
  sort: "downloads",
  tab: "discover",
  view: "grid",
};

export function useUrlFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current filters from URL
  const filters = useMemo<UrlFilters>(() => {
    return {
      search: searchParams.get("q") || DEFAULTS.search,
      type: (searchParams.get("type") as PluginType | "All") || DEFAULTS.type,
      category: searchParams.get("category") || DEFAULTS.category,
      marketplace: searchParams.get("marketplace") || DEFAULTS.marketplace,
      sort: (searchParams.get("sort") as SortOption) || DEFAULTS.sort,
      tab: (searchParams.get("tab") as TabOption) || DEFAULTS.tab,
      view: (searchParams.get("view") as "grid" | "list") || DEFAULTS.view,
    };
  }, [searchParams]);

  // Update URL with new filters
  const setFilters = useCallback(
    (updates: Partial<UrlFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        const paramKey = key === "search" ? "q" : key;
        const defaultValue = DEFAULTS[key as keyof UrlFilters];

        if (value && value !== defaultValue) {
          params.set(paramKey, value);
        } else {
          params.delete(paramKey);
        }
      });

      // Update URL without full page reload
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Individual setters for convenience
  const setSearch = useCallback(
    (search: string) => setFilters({ search }),
    [setFilters]
  );

  const setType = useCallback(
    (type: PluginType | "All") => setFilters({ type }),
    [setFilters]
  );

  const setCategory = useCallback(
    (category: string) => setFilters({ category }),
    [setFilters]
  );

  const setMarketplace = useCallback(
    (marketplace: string) => setFilters({ marketplace }),
    [setFilters]
  );

  const setSort = useCallback(
    (sort: SortOption) => setFilters({ sort }),
    [setFilters]
  );

  const setTab = useCallback(
    (tab: TabOption) => setFilters({ tab }),
    [setFilters]
  );

  const setView = useCallback(
    (view: "grid" | "list") => setFilters({ view }),
    [setFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    ...filters,
    setSearch,
    setType,
    setCategory,
    setMarketplace,
    setSort,
    setTab,
    setView,
    setFilters,
    clearFilters,
  };
}
