"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Marketplace } from "@/types/database";

interface UseMarketplacesResult {
  marketplaces: Marketplace[];
  isLoading: boolean;
  error: string | null;
  officialIds: Set<string>;
}

// Known official marketplace identifiers
const OFFICIAL_OWNERS = ["anthropics"];

export function useMarketplaces(): UseMarketplacesResult {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officialIds, setOfficialIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchMarketplaces() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("marketplaces")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (queryError) throw queryError;

        const list = data || [];
        setMarketplaces(list);

        // Identify official marketplaces
        const officials = new Set<string>();
        list.forEach((m) => {
          if (OFFICIAL_OWNERS.includes(m.github_owner.toLowerCase())) {
            officials.add(m.id);
          }
        });
        setOfficialIds(officials);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch marketplaces");
        setMarketplaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarketplaces();
  }, []);

  return {
    marketplaces,
    isLoading,
    error,
    officialIds,
  };
}
