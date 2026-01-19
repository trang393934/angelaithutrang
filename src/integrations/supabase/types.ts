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
      daily_gratitude: {
        Row: {
          created_at: string
          gratitude_text: string
          id: string
          light_points_earned: number | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gratitude_text: string
          id?: string
          light_points_earned?: number | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          gratitude_text?: string
          id?: string
          light_points_earned?: number | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      healing_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          read_at: string | null
          title: string
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type: string
          read_at?: string | null
          title: string
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          read_at?: string | null
          title?: string
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          extracted_content: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          is_processed: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          extracted_content?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id?: string | null
          id?: string
          is_processed?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          extracted_content?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          is_processed?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_folders: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      light_points: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          source_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          source_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          analyzed_at: string | null
          answer: string
          created_at: string
          energy_keywords: string[] | null
          id: string
          question_key: string
          question_text: string
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          answer: string
          created_at?: string
          energy_keywords?: string[] | null
          id?: string
          question_key: string
          question_text: string
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          answer?: string
          created_at?: string
          energy_keywords?: string[] | null
          id?: string
          question_key?: string
          question_text?: string
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          content_preview: string | null
          created_at: string
          energy_impact: Database["public"]["Enums"]["energy_level"] | null
          id: string
          metadata: Json | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          activity_type: string
          content_preview?: string | null
          created_at?: string
          energy_impact?: Database["public"]["Enums"]["energy_level"] | null
          id?: string
          metadata?: Json | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          activity_type?: string
          content_preview?: string | null
          created_at?: string
          energy_impact?: Database["public"]["Enums"]["energy_level"] | null
          id?: string
          metadata?: Json | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_energy_status: {
        Row: {
          admin_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          current_energy_level:
            | Database["public"]["Enums"]["energy_level"]
            | null
          id: string
          last_activity_at: string | null
          light_shared_count: number | null
          negative_interactions_count: number | null
          overall_sentiment_score: number | null
          positive_interactions_count: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_energy_level?:
            | Database["public"]["Enums"]["energy_level"]
            | null
          id?: string
          last_activity_at?: string | null
          light_shared_count?: number | null
          negative_interactions_count?: number | null
          overall_sentiment_score?: number | null
          positive_interactions_count?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          current_energy_level?:
            | Database["public"]["Enums"]["energy_level"]
            | null
          id?: string
          last_activity_at?: string | null
          light_shared_count?: number | null
          negative_interactions_count?: number | null
          overall_sentiment_score?: number | null
          positive_interactions_count?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_light_agreements: {
        Row: {
          agreed_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agreed_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agreed_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_light_totals: {
        Row: {
          current_level: number | null
          id: string
          lifetime_points: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number | null
          id?: string
          lifetime_points?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number | null
          id?: string
          lifetime_points?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          created_by: string | null
          healing_message: string | null
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          suspended_at: string
          suspended_until: string | null
          suspension_type: Database["public"]["Enums"]["suspension_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          healing_message?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          suspended_at?: string
          suspended_until?: string | null
          suspension_type: Database["public"]["Enums"]["suspension_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          healing_message?: string | null
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          suspended_at?: string
          suspended_until?: string | null
          suspension_type?: Database["public"]["Enums"]["suspension_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_light_points: {
        Args: {
          _points: number
          _reason: string
          _source_type: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected" | "trial"
      energy_level: "very_high" | "high" | "neutral" | "low" | "very_low"
      suspension_type: "temporary" | "permanent"
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
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected", "trial"],
      energy_level: ["very_high", "high", "neutral", "low", "very_low"],
      suspension_type: ["temporary", "permanent"],
    },
  },
} as const
