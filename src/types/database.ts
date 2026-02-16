export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          plugin_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plugin_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plugin_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_bookmarks: {
        Row: {
          created_at: string | null
          framework_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          framework_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          framework_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "framework_bookmarks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          autonomy_level: string | null
          color: string | null
          completeness_score: number | null
          contributors_count: number | null
          created_at: string | null
          description: string | null
          github_url: string | null
          has_agents_md: boolean | null
          has_claude_md: boolean | null
          has_cursorrules: boolean | null
          has_windsurfrules: boolean | null
          homepage: string | null
          how_it_works: string | null
          id: string
          install_command: string
          install_tool: string | null
          is_active: boolean | null
          is_claude_plugin: boolean | null
          last_commit_at: string | null
          mcps_count: number | null
          methodology: string | null
          name: string
          open_issues_count: number | null
          prerequisites: string[] | null
          prose_enriched_at: string | null
          prose_enrichment_error: string | null
          skills_count: number | null
          slug: string
          sort_order: number | null
          stars: number | null
          subagents_count: number | null
          updated_at: string | null
          workflow_enriched_at: string | null
          workflow_enrichment_error: string | null
          workflow_steps: Json | null
        }
        Insert: {
          autonomy_level?: string | null
          color?: string | null
          completeness_score?: number | null
          contributors_count?: number | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          has_agents_md?: boolean | null
          has_claude_md?: boolean | null
          has_cursorrules?: boolean | null
          has_windsurfrules?: boolean | null
          homepage?: string | null
          how_it_works?: string | null
          id?: string
          install_command: string
          install_tool?: string | null
          is_active?: boolean | null
          is_claude_plugin?: boolean | null
          last_commit_at?: string | null
          mcps_count?: number | null
          methodology?: string | null
          name: string
          open_issues_count?: number | null
          prerequisites?: string[] | null
          prose_enriched_at?: string | null
          prose_enrichment_error?: string | null
          skills_count?: number | null
          slug: string
          sort_order?: number | null
          stars?: number | null
          subagents_count?: number | null
          updated_at?: string | null
          workflow_enriched_at?: string | null
          workflow_enrichment_error?: string | null
          workflow_steps?: Json | null
        }
        Update: {
          autonomy_level?: string | null
          color?: string | null
          completeness_score?: number | null
          contributors_count?: number | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          has_agents_md?: boolean | null
          has_claude_md?: boolean | null
          has_cursorrules?: boolean | null
          has_windsurfrules?: boolean | null
          homepage?: string | null
          how_it_works?: string | null
          id?: string
          install_command?: string
          install_tool?: string | null
          is_active?: boolean | null
          is_claude_plugin?: boolean | null
          last_commit_at?: string | null
          mcps_count?: number | null
          methodology?: string | null
          name?: string
          open_issues_count?: number | null
          prerequisites?: string[] | null
          prose_enriched_at?: string | null
          prose_enrichment_error?: string | null
          skills_count?: number | null
          slug?: string
          sort_order?: number | null
          stars?: number | null
          subagents_count?: number | null
          updated_at?: string | null
          workflow_enriched_at?: string | null
          workflow_enrichment_error?: string | null
          workflow_steps?: Json | null
        }
        Relationships: []
      }
      framework_mcps: {
        Row: {
          id: string
          framework_id: string
          name: string
          slug: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          framework_id: string
          name: string
          slug: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          framework_id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_mcps_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          }
        ]
      }
      framework_skills: {
        Row: {
          id: string
          framework_id: string
          name: string
          slug: string
          description: string | null
          file_path: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          framework_id: string
          name: string
          slug: string
          description?: string | null
          file_path?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          framework_id?: string
          name?: string
          slug?: string
          description?: string | null
          file_path?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_skills_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          }
        ]
      }
      framework_subagents: {
        Row: {
          id: string
          framework_id: string
          name: string
          slug: string
          description: string | null
          file_path: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          framework_id: string
          name: string
          slug: string
          description?: string | null
          file_path?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          framework_id?: string
          name?: string
          slug?: string
          description?: string | null
          file_path?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_subagents_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          }
        ]
      }
      install_events: {
        Row: {
          command_type: string
          created_at: string | null
          id: string
          plugin_id: string
          user_id: string | null
        }
        Insert: {
          command_type: string
          created_at?: string | null
          id?: string
          plugin_id: string
          user_id?: string | null
        }
        Update: {
          command_type?: string
          created_at?: string | null
          id?: string
          plugin_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "install_events_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplaces: {
        Row: {
          created_at: string | null
          description: string | null
          github_owner: string
          github_repo: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string | null
          owner_email: string | null
          owner_name: string | null
          owner_url: string | null
          plugin_count: number | null
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          github_owner: string
          github_repo: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_url?: string | null
          plugin_count?: number | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          github_owner?: string
          github_repo?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_url?: string | null
          plugin_count?: number | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcps: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string | null
          github_url: string | null
          id: string
          is_official: boolean | null
          name: string
          slug: string
          stars: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          is_official?: boolean | null
          name: string
          slug: string
          stars?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          is_official?: boolean | null
          name?: string
          slug?: string
          stars?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      memory_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          github_url: string | null
          id: string
          name: string
          pattern_type: string | null
          slug: string
          stars: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name: string
          pattern_type?: string | null
          slug: string
          stars?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name?: string
          pattern_type?: string | null
          slug?: string
          stars?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plugin_frameworks: {
        Row: {
          framework_id: string | null
          id: string
          plugin_id: string | null
        }
        Insert: {
          framework_id?: string | null
          id?: string
          plugin_id?: string | null
        }
        Update: {
          framework_id?: string | null
          id?: string
          plugin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_frameworks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_frameworks_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          agent: string
          author_email: string | null
          author_name: string | null
          author_url: string | null
          category: string | null
          composition: Json | null
          created_at: string | null
          description: string | null
          has_agents: boolean | null
          has_commands: boolean | null
          has_hooks: boolean | null
          has_mcp_servers: boolean | null
          has_skills: boolean | null
          homepage: string | null
          id: string
          install_count: number | null
          marketplace_id: string
          name: string
          plugin_type: Database["public"]["Enums"]["plugin_type"] | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          agent?: string
          author_email?: string | null
          author_name?: string | null
          author_url?: string | null
          category?: string | null
          composition?: Json | null
          created_at?: string | null
          description?: string | null
          has_agents?: boolean | null
          has_commands?: boolean | null
          has_hooks?: boolean | null
          has_mcp_servers?: boolean | null
          has_skills?: boolean | null
          homepage?: string | null
          id?: string
          install_count?: number | null
          marketplace_id: string
          name: string
          plugin_type?: Database["public"]["Enums"]["plugin_type"] | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          agent?: string
          author_email?: string | null
          author_name?: string | null
          author_url?: string | null
          category?: string | null
          composition?: Json | null
          created_at?: string | null
          description?: string | null
          has_agents?: boolean | null
          has_commands?: boolean | null
          has_hooks?: boolean | null
          has_mcp_servers?: boolean | null
          has_skills?: boolean | null
          homepage?: string | null
          id?: string
          install_count?: number | null
          marketplace_id?: string
          name?: string
          plugin_type?: Database["public"]["Enums"]["plugin_type"] | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugins_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          agent_compatibility: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          plugin_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          agent_compatibility?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          plugin_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          agent_compatibility?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          plugin_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_skills: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string | null
          github_url: string | null
          id: string
          install_count: number | null
          is_branded: boolean | null
          marketplace_id: string | null
          name: string
          slug: string
          stars: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          install_count?: number | null
          is_branded?: boolean | null
          marketplace_id?: string | null
          name: string
          slug: string
          stars?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          github_url?: string | null
          id?: string
          install_count?: number | null
          is_branded?: boolean | null
          marketplace_id?: string | null
          name?: string
          slug?: string
          stars?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standalone_skills_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_publishers: {
        Row: {
          id: string
          name: string
          slug: string
          github_org: string
          github_repo: string
          logo_url: string | null
          description: string | null
          website_url: string | null
          is_official: boolean | null
          github_stars: number | null
          github_forks: number | null
          github_watchers: number | null
          contributor_count: number | null
          last_commit_at: string | null
          install_clicks: number | null
          primary_tag: Database["public"]["Enums"]["skill_tag"] | null
          tags: Database["public"]["Enums"]["skill_tag"][] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          github_org: string
          github_repo: string
          logo_url?: string | null
          description?: string | null
          website_url?: string | null
          is_official?: boolean | null
          github_stars?: number | null
          github_forks?: number | null
          github_watchers?: number | null
          contributor_count?: number | null
          last_commit_at?: string | null
          install_clicks?: number | null
          primary_tag?: Database["public"]["Enums"]["skill_tag"] | null
          tags?: Database["public"]["Enums"]["skill_tag"][] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          github_org?: string
          github_repo?: string
          logo_url?: string | null
          description?: string | null
          website_url?: string | null
          is_official?: boolean | null
          github_stars?: number | null
          github_forks?: number | null
          github_watchers?: number | null
          contributor_count?: number | null
          last_commit_at?: string | null
          install_clicks?: number | null
          primary_tag?: Database["public"]["Enums"]["skill_tag"] | null
          tags?: Database["public"]["Enums"]["skill_tag"][] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publisher_skills: {
        Row: {
          id: string
          publisher_id: string | null
          name: string
          slug: string
          description: string
          version: string | null
          license: string | null
          compatibility: string | null
          author: string | null
          rule_count: number | null
          category_count: number | null
          categories: string[] | null
          trigger_phrases: string[] | null
          features: string[] | null
          tags: Database["public"]["Enums"]["skill_tag"][] | null
          install_clicks: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          publisher_id?: string | null
          name: string
          slug: string
          description: string
          version?: string | null
          license?: string | null
          compatibility?: string | null
          author?: string | null
          rule_count?: number | null
          category_count?: number | null
          categories?: string[] | null
          trigger_phrases?: string[] | null
          features?: string[] | null
          tags?: Database["public"]["Enums"]["skill_tag"][] | null
          install_clicks?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          publisher_id?: string | null
          name?: string
          slug?: string
          description?: string
          version?: string | null
          license?: string | null
          compatibility?: string | null
          author?: string | null
          rule_count?: number | null
          category_count?: number | null
          categories?: string[] | null
          trigger_phrases?: string[] | null
          features?: string[] | null
          tags?: Database["public"]["Enums"]["skill_tag"][] | null
          install_clicks?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publisher_skills_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "skill_publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_frameworks: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          has_mcp: boolean | null
          has_skill: boolean | null
          mcp_package: string | null
          mcp_source: string | null
          mcp_install_command: string | null
          mcp_install_commands: Record<string, string> | null
          mcp_cli_package: string | null
          mcp_docs_url: string | null
          skill_install_command: string | null
          skill_github_url: string | null
          skill_source: string | null
          best_for: string[] | null
          docs_url: string | null
          github_url: string | null
          website_url: string | null
          logo_url: string | null
          color: string | null
          github_stars: number | null
          github_forks: number | null
          last_commit_at: string | null
          is_official: boolean | null
          sort_order: number | null
          install_clicks: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          has_mcp?: boolean | null
          has_skill?: boolean | null
          mcp_package?: string | null
          mcp_source?: string | null
          mcp_install_command?: string | null
          mcp_install_commands?: Record<string, string> | null
          mcp_cli_package?: string | null
          mcp_docs_url?: string | null
          skill_install_command?: string | null
          skill_github_url?: string | null
          skill_source?: string | null
          best_for?: string[] | null
          docs_url?: string | null
          github_url?: string | null
          website_url?: string | null
          logo_url?: string | null
          color?: string | null
          github_stars?: number | null
          github_forks?: number | null
          last_commit_at?: string | null
          is_official?: boolean | null
          sort_order?: number | null
          install_clicks?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          has_mcp?: boolean | null
          has_skill?: boolean | null
          mcp_package?: string | null
          mcp_source?: string | null
          mcp_install_command?: string | null
          mcp_install_commands?: Record<string, string> | null
          mcp_cli_package?: string | null
          mcp_docs_url?: string | null
          skill_install_command?: string | null
          skill_github_url?: string | null
          skill_source?: string | null
          best_for?: string[] | null
          docs_url?: string | null
          github_url?: string | null
          website_url?: string | null
          logo_url?: string | null
          color?: string | null
          github_stars?: number | null
          github_forks?: number | null
          last_commit_at?: string | null
          is_official?: boolean | null
          sort_order?: number | null
          install_clicks?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plugin_type: "skill" | "agent" | "command" | "bundle" | "hook" | "unknown"
      skill_tag: "infrastructure" | "ai-ml" | "security" | "payments" | "data-science" | "automation" | "documents" | "development"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plugin_type: ["skill", "agent", "command", "bundle", "hook", "unknown"],
      skill_tag: ["infrastructure", "ai-ml", "security", "payments", "data-science", "automation", "documents", "development"],
    },
  },
} as const

// Helper type aliases for easier use
export type PluginType = Database["public"]["Enums"]["plugin_type"]
export type SkillTag = Database["public"]["Enums"]["skill_tag"]
export type Marketplace = Tables<"marketplaces">
export type Plugin = Tables<"plugins">
export type Bookmark = Tables<"bookmarks">
export type InstallEvent = Tables<"install_events">
export type Framework = Tables<"frameworks">
export type PluginFramework = Tables<"plugin_frameworks">
export type FrameworkBookmark = Tables<"framework_bookmarks">
export type Skill = Tables<"skills">

// New taxonomy types (Phase 1)
export type StandaloneSkill = Tables<"standalone_skills">
export type MCP = Tables<"mcps">
export type MemoryPattern = Tables<"memory_patterns">

// Skill Publishers (Phase 2)
export type SkillPublisher = Tables<"skill_publishers">
export type PublisherSkill = Tables<"publisher_skills">

// Component Libraries (UI component libraries with MCP/SKILL support)
export type ComponentLibrary = Tables<"ui_frameworks">

// Publisher with skills (for joined queries)
export type SkillPublisherWithSkills = SkillPublisher & {
  skills: PublisherSkill[]
}

// Skill with parent plugin info (for joined queries)
export type SkillWithPlugin = Skill & {
  plugin: Pick<Plugin, "id" | "name" | "plugin_type" | "marketplace_id"> | null
}

// Composition type for plugin contents
export type PluginComposition = {
  skills?: number
  commands?: number
  agents?: number
  hooks?: number
  mcp?: number
}

// Plugin with marketplace info (for joined queries)
export type PluginWithMarketplace = Plugin & {
  marketplace: Pick<Marketplace, "id" | "name" | "github_owner" | "github_repo">
}

// Framework component junction tables
export type FrameworkSkill = Tables<"framework_skills">
export type FrameworkMcp = Tables<"framework_mcps">
export type FrameworkSubagent = Tables<"framework_subagents">

// Framework with all component details (for detail page)
export type FrameworkWithComponents = Framework & {
  skills: FrameworkSkill[]
  mcps: FrameworkMcp[]
  subagents: FrameworkSubagent[]
}
