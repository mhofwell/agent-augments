"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Framework, PluginWithMarketplace, PluginFramework } from "@/types/database";

interface UsePluginFrameworksResult {
  getFrameworksForPlugin: (pluginId: string) => Promise<Framework[]>;
  getPluginsForFramework: (frameworkId: string) => Promise<PluginWithMarketplace[]>;
  getAllLinks: () => Promise<PluginFramework[]>;
  isLoading: boolean;
  error: string | null;
}

export function usePluginFrameworks(): UsePluginFrameworksResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFrameworksForPlugin = useCallback(async (pluginId: string): Promise<Framework[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get framework IDs linked to this plugin
      const { data: links, error: linksError } = await supabase
        .from("plugin_frameworks")
        .select("framework_id")
        .eq("plugin_id", pluginId);

      if (linksError) throw new Error(linksError.message);
      if (!links || links.length === 0) return [];

      const frameworkIds = links
        .map(l => l.framework_id)
        .filter((id): id is string => id !== null);

      // Get the actual frameworks
      const { data: frameworks, error: frameworksError } = await supabase
        .from("frameworks")
        .select("*")
        .in("id", frameworkIds)
        .eq("is_active", true)
        .order("stars", { ascending: false, nullsFirst: false });

      if (frameworksError) throw new Error(frameworksError.message);
      return frameworks || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch frameworks for plugin";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPluginsForFramework = useCallback(async (frameworkId: string): Promise<PluginWithMarketplace[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get plugin IDs linked to this framework
      const { data: links, error: linksError } = await supabase
        .from("plugin_frameworks")
        .select("plugin_id")
        .eq("framework_id", frameworkId);

      if (linksError) throw new Error(linksError.message);
      if (!links || links.length === 0) return [];

      const pluginIds = links
        .map(l => l.plugin_id)
        .filter((id): id is string => id !== null);

      // Get the actual plugins with marketplace info
      const { data: plugins, error: pluginsError } = await supabase
        .from("plugins")
        .select(`
          *,
          marketplace:marketplaces(id, name, github_owner, github_repo)
        `)
        .in("id", pluginIds)
        .order("install_count", { ascending: false, nullsFirst: false });

      if (pluginsError) throw new Error(pluginsError.message);
      return (plugins || []) as PluginWithMarketplace[];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch plugins for framework";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllLinks = useCallback(async (): Promise<PluginFramework[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("plugin_frameworks")
        .select("*");

      if (fetchError) throw new Error(fetchError.message);
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch plugin-framework links";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getFrameworksForPlugin,
    getPluginsForFramework,
    getAllLinks,
    isLoading,
    error,
  };
}
