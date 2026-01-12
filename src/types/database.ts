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
      frameworks: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          install_command: string
          install_tool: string | null
          prerequisites: string[] | null
          homepage: string | null
          github_url: string | null
          color: string | null
          is_active: boolean | null
          sort_order: number | null
          stars: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          install_command: string
          install_tool?: string | null
          prerequisites?: string[] | null
          homepage?: string | null
          github_url?: string | null
          color?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          stars?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          install_command?: string
          install_tool?: string | null
          prerequisites?: string[] | null
          homepage?: string | null
          github_url?: string | null
          color?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          stars?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      framework_bookmarks: {
        Row: {
          id: string
          user_id: string
          framework_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          framework_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          framework_id?: string
          created_at?: string | null
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
      plugin_frameworks: {
        Row: {
          id: string
          plugin_id: string
          framework_id: string
        }
        Insert: {
          id?: string
          plugin_id: string
          framework_id: string
        }
        Update: {
          id?: string
          plugin_id?: string
          framework_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_frameworks_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_frameworks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          author_email: string | null
          author_name: string | null
          author_url: string | null
          category: string | null
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
          author_email?: string | null
          author_name?: string | null
          author_url?: string | null
          category?: string | null
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
          author_email?: string | null
          author_name?: string | null
          author_url?: string | null
          category?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plugin_type: "skill" | "agent" | "command" | "bundle" | "hook" | "unknown"
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

// Helper type aliases for easier use
export type PluginType = Database["public"]["Enums"]["plugin_type"]
export type Marketplace = Tables<"marketplaces">
export type Plugin = Tables<"plugins">
export type Bookmark = Tables<"bookmarks">
export type InstallEvent = Tables<"install_events">
export type Framework = Tables<"frameworks">
export type PluginFramework = Tables<"plugin_frameworks">
export type FrameworkBookmark = Tables<"framework_bookmarks">

// Plugin with marketplace info (for joined queries)
export type PluginWithMarketplace = Plugin & {
  marketplace: Pick<Marketplace, "id" | "name" | "github_owner" | "github_repo">
}
