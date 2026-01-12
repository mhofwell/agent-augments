"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Framework } from "@/types/database";

interface UseFrameworksResult {
  frameworks: Framework[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFrameworks(): UseFrameworksResult {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFrameworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("frameworks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setFrameworks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch frameworks");
      setFrameworks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return {
    frameworks,
    isLoading,
    error,
    refetch: fetchFrameworks,
  };
}
