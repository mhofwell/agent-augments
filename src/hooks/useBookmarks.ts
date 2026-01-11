"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { PluginWithMarketplace } from "@/types/database";

interface Bookmark {
  id: string;
  created_at: string;
  plugin: PluginWithMarketplace;
}

interface UseBookmarksResult {
  bookmarks: Bookmark[];
  bookmarkedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  addBookmark: (pluginId: string) => Promise<boolean>;
  removeBookmark: (pluginId: string) => Promise<boolean>;
  toggleBookmark: (pluginId: string) => Promise<boolean>;
  isBookmarked: (pluginId: string) => boolean;
  refetch: () => Promise<void>;
}

export function useBookmarks(): UseBookmarksResult {
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
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
      const response = await fetch("/api/bookmarks");

      if (!response.ok) {
        if (response.status === 401) {
          setBookmarks([]);
          setBookmarkedIds(new Set());
          return;
        }
        throw new Error("Failed to fetch bookmarks");
      }

      const data = await response.json();
      const list = data.bookmarks || [];
      setBookmarks(list);

      // Build set of bookmarked plugin IDs
      const ids = new Set<string>();
      list.forEach((b: Bookmark) => {
        if (b.plugin?.id) {
          ids.add(b.plugin.id);
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
    async (pluginId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugin_id: pluginId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add bookmark");
        }

        // Optimistically update
        setBookmarkedIds((prev) => new Set([...prev, pluginId]));
        // Refetch to get full bookmark data
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
    async (pluginId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        const response = await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugin_id: pluginId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to remove bookmark");
        }

        // Optimistically update
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(pluginId);
          return next;
        });
        setBookmarks((prev) => prev.filter((b) => b.plugin?.id !== pluginId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove bookmark");
        return false;
      }
    },
    [isAuthenticated]
  );

  const toggleBookmark = useCallback(
    async (pluginId: string): Promise<boolean> => {
      if (bookmarkedIds.has(pluginId)) {
        return removeBookmark(pluginId);
      } else {
        return addBookmark(pluginId);
      }
    },
    [bookmarkedIds, addBookmark, removeBookmark]
  );

  const isBookmarked = useCallback(
    (pluginId: string): boolean => {
      return bookmarkedIds.has(pluginId);
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
