"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { FrameworkSkill, FrameworkMcp, FrameworkSubagent } from "@/types/database";

interface FrameworkComponents {
  skills: FrameworkSkill[];
  mcps: FrameworkMcp[];
  subagents: FrameworkSubagent[];
}

interface UseFrameworkComponentsResult {
  components: FrameworkComponents | null;
  isLoading: boolean;
  error: string | null;
}

export function useFrameworkComponents(slug: string | null | undefined): UseFrameworkComponentsResult {
  const [data, setData] = useState<{ slug: string; components: FrameworkComponents } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComponents = useCallback(async (targetSlug: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/frameworks/${targetSlug}`);
      if (!res.ok) throw new Error("Failed to fetch framework components");
      const result = await res.json();
      setData({
        slug: targetSlug,
        components: {
          skills: result.skills || [],
          mcps: result.mcps || [],
          subagents: result.subagents || [],
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchComponents(slug);
    }
  }, [slug, fetchComponents]);

  // Return null components when slug is cleared or doesn't match cached data
  const components = useMemo(() => {
    if (!slug || !data || data.slug !== slug) return null;
    return data.components;
  }, [slug, data]);

  return { components, isLoading, error };
}
