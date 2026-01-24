"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentLibrary } from "@/types/database";

export type ComponentSortOption = "stars" | "name" | "updated";
export type ComponentFilterOption = "all" | "mcp" | "skill" | "both";

interface UseComponentLibrariesParams {
  sort?: ComponentSortOption;
  filter?: ComponentFilterOption;
}

interface UseComponentLibrariesResult {
  libraries: ComponentLibrary[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

export function useComponentLibraries(
  params: UseComponentLibrariesParams = {}
): UseComponentLibrariesResult {
  const { sort = "stars", filter = "all" } = params;

  const [libraries, setLibraries] = useState<ComponentLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchLibraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("sort", sort);
      searchParams.set("filter", filter);

      const response = await fetch(`/api/component-libraries?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch component libraries");
      }

      const data = await response.json();
      setLibraries(data.libraries);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLibraries([]);
    } finally {
      setIsLoading(false);
    }
  }, [sort, filter]);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  return {
    libraries,
    isLoading,
    error,
    total,
    refetch: fetchLibraries,
  };
}

// Helper to track install clicks
export async function trackComponentInstall(libraryId: string, type: "mcp" | "skill"): Promise<void> {
  try {
    await fetch("/api/component-libraries/track-install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ library_id: libraryId, type }),
    });
  } catch {
    // Silent fail for tracking
  }
}
