"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { Framework } from "@/types/database";

interface FrameworkBookmark {
  id: string;
  created_at: string;
  framework: Framework;
}

interface UseFrameworkBookmarksResult {
  bookmarks: FrameworkBookmark[];
  bookmarkedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  addBookmark: (frameworkId: string) => Promise<boolean>;
  removeBookmark: (frameworkId: string) => Promise<boolean>;
  toggleBookmark: (frameworkId: string) => Promise<boolean>;
  isBookmarked: (frameworkId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useFrameworkBookmarks(): UseFrameworkBookmarksResult {
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<FrameworkBookmark[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarks([]);
      setBookmarkedIds(new Set());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/framework-bookmarks");

      if (!response.ok) {
        if (response.status === 401) {
          setBookmarks([]);
          setBookmarkedIds(new Set());
          return;
        }
        throw new Error("Failed to fetch framework bookmarks");
      }

      const data = await response.json();
      const list = data.bookmarks || [];
      setBookmarks(list);

      const ids = new Set<string>();
      list.forEach((b: FrameworkBookmark) => {
        if (b.framework?.id) {
          ids.add(b.framework.id);
        }
      });
      setBookmarkedIds(ids);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = useCallback(
    async (frameworkId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const response = await fetch("/api/framework-bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ framework_id: frameworkId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add bookmark");
        }

        setBookmarkedIds((prev) => new Set([...prev, frameworkId]));
        await fetchBookmarks();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add bookmark");
        return false;
      }
    },
    [isAuthenticated, fetchBookmarks]
  );

  const removeBookmark = useCallback(
    async (frameworkId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const response = await fetch("/api/framework-bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ framework_id: frameworkId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to remove bookmark");
        }

        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(frameworkId);
          return next;
        });
        setBookmarks((prev) => prev.filter((b) => b.framework?.id !== frameworkId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove bookmark");
        return false;
      }
    },
    [isAuthenticated]
  );

  const toggleBookmark = useCallback(
    async (frameworkId: string): Promise<boolean> => {
      if (bookmarkedIds.has(frameworkId)) {
        return removeBookmark(frameworkId);
      } else {
        return addBookmark(frameworkId);
      }
    },
    [bookmarkedIds, addBookmark, removeBookmark]
  );

  const isBookmarked = useCallback(
    (frameworkId: string): boolean => {
      return bookmarkedIds.has(frameworkId);
    },
    [bookmarkedIds]
  );

  return {
    bookmarks,
    bookmarkedIds,
    isLoading,
    error,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    refetch: fetchBookmarks,
  };
}
