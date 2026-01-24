"use client";

import { useState, useEffect, useCallback } from "react";
import type { SkillPublisher, PublisherSkill, SkillTag } from "@/types/database";

export type PublisherSortOption = "stars" | "name" | "newest";

export type SkillPublisherWithSkills = SkillPublisher & {
  skills: PublisherSkill[];
};

interface UseSkillPublishersParams {
  sort?: PublisherSortOption;
  includeSkills?: boolean;
  tag?: SkillTag | null;
}

interface UseSkillPublishersResult {
  publishers: SkillPublisherWithSkills[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

export function useSkillPublishers(
  params: UseSkillPublishersParams = {}
): UseSkillPublishersResult {
  const { sort = "stars", includeSkills = true, tag = null } = params;

  const [publishers, setPublishers] = useState<SkillPublisherWithSkills[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPublishers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("sort", sort);
      searchParams.set("includeSkills", String(includeSkills));
      if (tag) {
        searchParams.set("tag", tag);
      }

      const response = await fetch(`/api/skill-publishers?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch skill publishers");
      }

      const data = await response.json();
      setPublishers(data.publishers);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPublishers([]);
    } finally {
      setIsLoading(false);
    }
  }, [sort, includeSkills, tag]);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  return {
    publishers,
    isLoading,
    error,
    total,
    refetch: fetchPublishers,
  };
}

// Hook for fetching a single publisher by slug
interface UseSkillPublisherResult {
  publisher: SkillPublisherWithSkills | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSkillPublisher(slug: string): UseSkillPublisherResult {
  const [publisher, setPublisher] = useState<SkillPublisherWithSkills | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublisher = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/skill-publishers/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Publisher not found");
        }
        throw new Error("Failed to fetch skill publisher");
      }

      const data = await response.json();
      setPublisher(data.publisher);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPublisher(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPublisher();
  }, [fetchPublisher]);

  return {
    publisher,
    isLoading,
    error,
    refetch: fetchPublisher,
  };
}
