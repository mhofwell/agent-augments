"use client";

import { useState, useEffect, useCallback } from "react";
import type { SkillWithPlugin } from "@/types/database";
import type { AgentId } from "./usePlugins";

interface UseSkillsParams {
  search?: string;
  agent?: AgentId;
  category?: string;
  page?: number;
  limit?: number;
}

interface UseSkillsResult {
  skills: SkillWithPlugin[];
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

export function useSkills(params: UseSkillsParams = {}): UseSkillsResult {
  const {
    search = "",
    agent = "all",
    category = "all",
    page = 1,
    limit = 24,
  } = params;

  const [skills, setSkills] = useState<SkillWithPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
  });

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (agent && agent !== "all") params.set("agent", agent);
      if (category && category !== "all") params.set("category", category);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await fetch(`/api/skills?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch skills");
      }

      const data = await response.json();
      setSkills(data.skills);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, agent, category, page, limit]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    isLoading,
    error,
    pagination,
    refetch: fetchSkills,
  };
}
