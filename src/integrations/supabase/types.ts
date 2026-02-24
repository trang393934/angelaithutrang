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
      ai_usage_tracking: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          usage_count: number
          usage_date: string
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      api_key_usage: {
        Row: {
          api_key_id: string
          id: string
          request_count: number
          tokens_used: number
          usage_date: string
        }
        Insert: {
          api_key_id: string
          id?: string
          request_count?: number
          tokens_used?: number
          usage_date?: string
        }
        Update: {
          api_key_id?: string
          id?: string
          request_count?: number
          tokens_used?: number
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_submissions: {
        Row: {
          admin_feedback: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reward_earned: number | null
          status: string
          submission_content: string
          submission_url: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_earned?: number | null
          status?: string
          submission_content: string
          submission_url?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_earned?: number | null
          status?: string
          submission_content?: string
          submission_url?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "bounty_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_tasks: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          current_completions: number
          deadline: string | null
          description: string
          difficulty_level: string
          id: string
          max_completions: number | null
          requirements: string | null
          reward_amount: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_completions?: number
          deadline?: string | null
          description: string
          difficulty_level?: string
          id?: string
          max_completions?: number | null
          requirements?: string | null
          reward_amount?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_completions?: number
          deadline?: string | null
          description?: string
          difficulty_level?: string
          id?: string
          max_completions?: number | null
          requirements?: string | null
          reward_amount?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      build_ideas: {
        Row: {
          admin_feedback: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          is_rewarded: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          reward_amount: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          admin_feedback?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_rewarded?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_amount?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          admin_feedback?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_rewarded?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reward_amount?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: []
      }
      cached_responses: {
        Row: {
          created_at: string | null
          hit_count: number | null
          id: string
          last_used_at: string | null
          question_keywords: string[]
          question_normalized: string
          response: string
        }
        Insert: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          question_keywords: string[]
          question_normalized: string
          response: string
        }
        Update: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          question_keywords?: string[]
          question_normalized?: string
          response?: string
        }
        Relationships: []
      }
      camly_coin_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      camly_coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          purity_score: number | null
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          purity_score?: number | null
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          purity_score?: number | null
          transaction_type?: Database["public"]["Enums"]["coin_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          answer_text: string
          created_at: string
          feedback_type: string
          id: string
          question_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          feedback_type: string
          id?: string
          question_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          feedback_type?: string
          id?: string
          question_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          answer_text: string
          created_at: string
          folder_id: string | null
          id: string
          is_rewarded: boolean | null
          purity_score: number | null
          question_id: string | null
          question_text: string
          reward_amount: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          folder_id?: string | null
          id?: string
          is_rewarded?: boolean | null
          purity_score?: number | null
          question_id?: string | null
          question_text: string
          reward_amount?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          is_rewarded?: boolean | null
          purity_score?: number | null
          question_id?: string | null
          question_text?: string
          reward_amount?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "chat_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "chat_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_questions: {
        Row: {
          ai_response_preview: string | null
          created_at: string
          id: string
          is_greeting: boolean | null
          is_response_recycled: boolean | null
          is_rewarded: boolean | null
          is_spam: boolean | null
          likes_count: number | null
          purity_score: number | null
          question_hash: string
          question_text: string
          recycling_similarity_score: number | null
          replies_count: number | null
          reward_amount: number | null
          user_id: string
        }
        Insert: {
          ai_response_preview?: string | null
          created_at?: string
          id?: string
          is_greeting?: boolean | null
          is_response_recycled?: boolean | null
          is_rewarded?: boolean | null
          is_spam?: boolean | null
          likes_count?: number | null
          purity_score?: number | null
          question_hash: string
          question_text: string
          recycling_similarity_score?: number | null
          replies_count?: number | null
          reward_amount?: number | null
          user_id: string
        }
        Update: {
          ai_response_preview?: string | null
          created_at?: string
          id?: string
          is_greeting?: boolean | null
          is_response_recycled?: boolean | null
          is_rewarded?: boolean | null
          is_spam?: boolean | null
          likes_count?: number | null
          purity_score?: number | null
          question_hash?: string
          question_text?: string
          recycling_similarity_score?: number | null
          replies_count?: number | null
          reward_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "community_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_gifts: {
        Row: {
          amount: number
          context_id: string | null
          context_type: string
          created_at: string
          gift_type: string
          id: string
          message: string | null
          receipt_public_id: string | null
          receiver_id: string
          sender_id: string
          tx_hash: string | null
        }
        Insert: {
          amount: number
          context_id?: string | null
          context_type?: string
          created_at?: string
          gift_type?: string
          id?: string
          message?: string | null
          receipt_public_id?: string | null
          receiver_id: string
          sender_id: string
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          context_id?: string | null
          context_type?: string
          created_at?: string
          gift_type?: string
          id?: string
          message?: string | null
          receipt_public_id?: string | null
          receiver_id?: string
          sender_id?: string
          tx_hash?: string | null
        }
        Relationships: []
      }
      coin_withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          celebrated_at: string | null
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          retry_count: number | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          celebrated_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          celebrated_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          retry_count?: number | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      community_circles: {
        Row: {
          circle_type: string
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_official: boolean | null
          max_members: number | null
          name: string
          updated_at: string
        }
        Insert: {
          circle_type?: string
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_official?: boolean | null
          max_members?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          circle_type?: string
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_official?: boolean | null
          max_members?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          content_length: number
          created_at: string
          id: string
          is_rewarded: boolean | null
          post_id: string
          reward_amount: number | null
          user_id: string
        }
        Insert: {
          content: string
          content_length: number
          created_at?: string
          id?: string
          is_rewarded?: boolean | null
          post_id: string
          reward_amount?: number | null
          user_id: string
        }
        Update: {
          content?: string
          content_length?: number
          created_at?: string
          id?: string
          is_rewarded?: boolean | null
          post_id?: string
          reward_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_helps: {
        Row: {
          coins_earned: number | null
          created_at: string
          help_content: string | null
          help_type: string
          helped_user_id: string
          helper_id: string
          id: string
          is_rewarded: boolean | null
          is_verified: boolean | null
          question_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          coins_earned?: number | null
          created_at?: string
          help_content?: string | null
          help_type: string
          helped_user_id: string
          helper_id: string
          id?: string
          is_rewarded?: boolean | null
          is_verified?: boolean | null
          question_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          coins_earned?: number | null
          created_at?: string
          help_content?: string | null
          help_type?: string
          helped_user_id?: string
          helper_id?: string
          id?: string
          is_rewarded?: boolean | null
          is_verified?: boolean | null
          question_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_helps_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "chat_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_rewarded: boolean | null
          likes_count: number | null
          reward_amount: number | null
          shares_count: number | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_rewarded?: boolean | null
          likes_count?: number | null
          reward_amount?: number | null
          shares_count?: number | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_rewarded?: boolean | null
          likes_count?: number | null
          reward_amount?: number | null
          shares_count?: number | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_owner_rewarded: boolean | null
          sharer_id: string
          sharer_rewarded: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_owner_rewarded?: boolean | null
          sharer_id: string
          sharer_rewarded?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_owner_rewarded?: boolean | null
          sharer_id?: string
          sharer_rewarded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "community_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      community_story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "community_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_shares: {
        Row: {
          coins_earned: number | null
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          is_verified: boolean | null
          share_type: string
          share_url: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          coins_earned?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          share_type: string
          share_url?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          coins_earned?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          share_type?: string
          share_url?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      coordinator_chat_messages: {
        Row: {
          ai_role: string | null
          content: string
          created_at: string
          id: string
          mode: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          ai_role?: string | null
          content: string
          created_at?: string
          id?: string
          mode?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          ai_role?: string | null
          content?: string
          created_at?: string
          id?: string
          mode?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordinator_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "coordinator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinator_project_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          id: string
          project_id: string
          snapshot_data: Json | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id: string
          snapshot_data?: Json | null
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          id?: string
          project_id?: string
          snapshot_data?: Json | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "coordinator_project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "coordinator_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinator_projects: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name: string
          platform_type: string
          status: string
          token_flow_model: string | null
          updated_at: string
          user_id: string
          value_model: string | null
          vision_statement: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          platform_type?: string
          status?: string
          token_flow_model?: string | null
          updated_at?: string
          user_id: string
          value_model?: string | null
          vision_statement?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          platform_type?: string
          status?: string
          token_flow_model?: string | null
          updated_at?: string
          user_id?: string
          value_model?: string | null
          vision_statement?: string | null
        }
        Relationships: []
      }
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
      daily_login_tracking: {
        Row: {
          coins_earned: number
          created_at: string
          id: string
          login_date: string
          streak_count: number
          user_id: string
        }
        Insert: {
          coins_earned?: number
          created_at?: string
          id?: string
          login_date?: string
          streak_count?: number
          user_id: string
        }
        Update: {
          coins_earned?: number
          created_at?: string
          id?: string
          login_date?: string
          streak_count?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_reward_tracking: {
        Row: {
          comments_rewarded: number | null
          community_helps_rewarded: number
          created_at: string
          feedbacks_rewarded: number
          id: string
          ideas_submitted: number
          journals_rewarded: number
          knowledge_uploads: number
          logins_rewarded: number
          posts_rewarded: number | null
          question_hashes: string[] | null
          questions_rewarded: number
          reward_date: string
          shares_rewarded: number
          total_coins_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_rewarded?: number | null
          community_helps_rewarded?: number
          created_at?: string
          feedbacks_rewarded?: number
          id?: string
          ideas_submitted?: number
          journals_rewarded?: number
          knowledge_uploads?: number
          logins_rewarded?: number
          posts_rewarded?: number | null
          question_hashes?: string[] | null
          questions_rewarded?: number
          reward_date?: string
          shares_rewarded?: number
          total_coins_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_rewarded?: number | null
          community_helps_rewarded?: number
          created_at?: string
          feedbacks_rewarded?: number
          id?: string
          ideas_submitted?: number
          journals_rewarded?: number
          knowledge_uploads?: number
          logins_rewarded?: number
          posts_rewarded?: number | null
          question_hashes?: string[] | null
          questions_rewarded?: number
          reward_date?: string
          shares_rewarded?: number
          total_coins_today?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          is_read: boolean
          message_type: string | null
          metadata: Json | null
          reactions: Json | null
          read_at: string | null
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
          tip_gift_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_read?: boolean
          message_type?: string | null
          metadata?: Json | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
          tip_gift_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_read?: boolean
          message_type?: string | null
          metadata?: Json | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
          tip_gift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_tip_gift_id_fkey"
            columns: ["tip_gift_id"]
            isOneToOne: false
            referencedRelation: "coin_gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopter_rewards: {
        Row: {
          created_at: string
          id: string
          is_rewarded: boolean
          registered_at: string
          reward_amount: number
          rewarded_at: string | null
          updated_at: string
          user_id: string
          valid_questions_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_rewarded?: boolean
          registered_at?: string
          reward_amount?: number
          rewarded_at?: string | null
          updated_at?: string
          user_id: string
          valid_questions_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_rewarded?: boolean
          registered_at?: string
          reward_amount?: number
          rewarded_at?: string | null
          updated_at?: string
          user_id?: string
          valid_questions_count?: number
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          action_taken: string | null
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          is_reviewed: boolean | null
          matched_pattern: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_reviewed?: boolean | null
          matched_pattern?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          is_reviewed?: boolean | null
          matched_pattern?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fun_distribution_logs: {
        Row: {
          action_id: string
          actor_id: string
          created_at: string
          fund_processed_at: string | null
          fund_processing_status: string
          fund_tx_hashes: Json | null
          genesis_amount: number
          genesis_percentage: number
          id: string
          mint_request_id: string | null
          partners_amount: number
          partners_percentage: number
          platform_amount: number
          platform_percentage: number
          total_reward: number
          user_amount: number
          user_percentage: number
        }
        Insert: {
          action_id: string
          actor_id: string
          created_at?: string
          fund_processed_at?: string | null
          fund_processing_status?: string
          fund_tx_hashes?: Json | null
          genesis_amount?: number
          genesis_percentage?: number
          id?: string
          mint_request_id?: string | null
          partners_amount?: number
          partners_percentage?: number
          platform_amount?: number
          platform_percentage?: number
          total_reward: number
          user_amount: number
          user_percentage: number
        }
        Update: {
          action_id?: string
          actor_id?: string
          created_at?: string
          fund_processed_at?: string | null
          fund_processing_status?: string
          fund_tx_hashes?: Json | null
          genesis_amount?: number
          genesis_percentage?: number
          id?: string
          mint_request_id?: string | null
          partners_amount?: number
          partners_percentage?: number
          platform_amount?: number
          platform_percentage?: number
          total_reward?: number
          user_amount?: number
          user_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "fun_distribution_logs_mint_request_id_fkey"
            columns: ["mint_request_id"]
            isOneToOne: false
            referencedRelation: "pplp_mint_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_pool_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          pool_label: string
          pool_name: string
          retention_rate: number
          tier_order: number
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pool_label: string
          pool_name: string
          retention_rate?: number
          tier_order?: number
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pool_label?: string
          pool_name?: string
          retention_rate?: number
          tier_order?: number
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      gratitude_journal: {
        Row: {
          content: string
          content_length: number
          created_at: string
          id: string
          is_rewarded: boolean | null
          journal_date: string
          journal_type: string
          purity_score: number | null
          reward_amount: number | null
          user_id: string
        }
        Insert: {
          content: string
          content_length: number
          created_at?: string
          id?: string
          is_rewarded?: boolean | null
          journal_date?: string
          journal_type: string
          purity_score?: number | null
          reward_amount?: number | null
          user_id: string
        }
        Update: {
          content?: string
          content_length?: number
          created_at?: string
          id?: string
          is_rewarded?: boolean | null
          journal_date?: string
          journal_type?: string
          purity_score?: number | null
          reward_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      handle_audit_log: {
        Row: {
          created_at: string
          id: string
          new_handle: string
          old_handle: string | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_handle: string
          old_handle?: string | null
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_handle?: string
          old_handle?: string | null
          source?: string
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
      idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "build_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      image_history: {
        Row: {
          created_at: string
          id: string
          image_type: string
          image_url: string
          prompt: string
          response_text: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type: string
          image_url: string
          prompt: string
          response_text?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          prompt?: string
          response_text?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          category: string | null
          chunk_order: number | null
          chunk_text: string
          created_at: string | null
          document_id: string | null
          id: string
          keywords: string[] | null
        }
        Insert: {
          category?: string | null
          chunk_order?: number | null
          chunk_text: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          keywords?: string[] | null
        }
        Update: {
          category?: string | null
          chunk_order?: number | null
          chunk_text?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          keywords?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
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
      lixi_claims: {
        Row: {
          camly_amount: number
          claimed_at: string
          error_message: string | null
          fun_amount: number
          id: string
          notification_id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          camly_amount: number
          claimed_at?: string
          error_message?: string | null
          fun_amount: number
          id?: string
          notification_id: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          camly_amount?: number
          claimed_at?: string
          error_message?: string | null
          fun_amount?: number
          id?: string
          notification_id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lixi_claims_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
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
      pending_rewards: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          description: string | null
          frozen_reason: string | null
          id: string
          metadata: Json | null
          purity_score: number | null
          reason: string
          release_at: string
          released_at: string | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          created_at?: string
          description?: string | null
          frozen_reason?: string | null
          id?: string
          metadata?: Json | null
          purity_score?: number | null
          reason?: string
          release_at: string
          released_at?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          description?: string | null
          frozen_reason?: string | null
          id?: string
          metadata?: Json | null
          purity_score?: number | null
          reason?: string
          release_at?: string
          released_at?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pplp_action_caps: {
        Row: {
          action_type: string
          base_reward: number
          cooldown_seconds: number | null
          created_at: string
          diminishing_factor: number | null
          diminishing_threshold: number | null
          id: string
          is_active: boolean
          max_global_daily: number | null
          max_per_user_daily: number | null
          max_per_user_weekly: number | null
          min_quality_score: number | null
          multiplier_ranges: Json
          platform_id: string
          thresholds: Json
          updated_at: string
        }
        Insert: {
          action_type: string
          base_reward?: number
          cooldown_seconds?: number | null
          created_at?: string
          diminishing_factor?: number | null
          diminishing_threshold?: number | null
          id?: string
          is_active?: boolean
          max_global_daily?: number | null
          max_per_user_daily?: number | null
          max_per_user_weekly?: number | null
          min_quality_score?: number | null
          multiplier_ranges?: Json
          platform_id?: string
          thresholds?: Json
          updated_at?: string
        }
        Update: {
          action_type?: string
          base_reward?: number
          cooldown_seconds?: number | null
          created_at?: string
          diminishing_factor?: number | null
          diminishing_threshold?: number | null
          id?: string
          is_active?: boolean
          max_global_daily?: number | null
          max_per_user_daily?: number | null
          max_per_user_weekly?: number | null
          min_quality_score?: number | null
          multiplier_ranges?: Json
          platform_id?: string
          thresholds?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pplp_actions: {
        Row: {
          action_type: string
          action_type_enum:
            | Database["public"]["Enums"]["pplp_action_type"]
            | null
          actor_id: string
          canonical_hash: string | null
          created_at: string
          evidence_hash: string | null
          id: string
          impact: Json
          integrity: Json
          metadata: Json
          mint_request_hash: string | null
          minted_at: string | null
          platform_id: string
          policy_snapshot: Json | null
          policy_version: string
          scored_at: string | null
          status: Database["public"]["Enums"]["pplp_action_status"]
          target_id: string | null
        }
        Insert: {
          action_type: string
          action_type_enum?:
            | Database["public"]["Enums"]["pplp_action_type"]
            | null
          actor_id: string
          canonical_hash?: string | null
          created_at?: string
          evidence_hash?: string | null
          id?: string
          impact?: Json
          integrity?: Json
          metadata?: Json
          mint_request_hash?: string | null
          minted_at?: string | null
          platform_id?: string
          policy_snapshot?: Json | null
          policy_version?: string
          scored_at?: string | null
          status?: Database["public"]["Enums"]["pplp_action_status"]
          target_id?: string | null
        }
        Update: {
          action_type?: string
          action_type_enum?:
            | Database["public"]["Enums"]["pplp_action_type"]
            | null
          actor_id?: string
          canonical_hash?: string | null
          created_at?: string
          evidence_hash?: string | null
          id?: string
          impact?: Json
          integrity?: Json
          metadata?: Json
          mint_request_hash?: string | null
          minted_at?: string | null
          platform_id?: string
          policy_snapshot?: Json | null
          policy_version?: string
          scored_at?: string | null
          status?: Database["public"]["Enums"]["pplp_action_status"]
          target_id?: string | null
        }
        Relationships: []
      }
      pplp_audits: {
        Row: {
          action_id: string | null
          action_taken: string | null
          actor_id: string
          audit_status: string
          audit_type: string
          audited_score: Json | null
          auditor_id: string | null
          completed_at: string | null
          created_at: string
          finding: string | null
          id: string
          original_score: Json | null
          penalty_amount: number | null
        }
        Insert: {
          action_id?: string | null
          action_taken?: string | null
          actor_id: string
          audit_status?: string
          audit_type: string
          audited_score?: Json | null
          auditor_id?: string | null
          completed_at?: string | null
          created_at?: string
          finding?: string | null
          id?: string
          original_score?: Json | null
          penalty_amount?: number | null
        }
        Update: {
          action_id?: string | null
          action_taken?: string | null
          actor_id?: string
          audit_status?: string
          audit_type?: string
          audited_score?: Json | null
          auditor_id?: string | null
          completed_at?: string | null
          created_at?: string
          finding?: string | null
          id?: string
          original_score?: Json | null
          penalty_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pplp_audits_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_device_registry: {
        Row: {
          device_hash: string
          first_seen: string
          flag_reason: string | null
          id: string
          is_flagged: boolean
          last_seen: string
          usage_count: number
          user_id: string
        }
        Insert: {
          device_hash: string
          first_seen?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          last_seen?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          device_hash?: string
          first_seen?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          last_seen?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      pplp_disputes: {
        Row: {
          action_id: string
          assigned_to: string | null
          created_at: string
          evidence: Json
          id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["pplp_dispute_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          action_id: string
          assigned_to?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["pplp_dispute_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          assigned_to?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["pplp_dispute_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pplp_disputes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_epoch_caps: {
        Row: {
          action_counts: Json
          created_at: string
          epoch_date: string
          epoch_type: string
          id: string
          total_minted: number
          unique_users: number
          updated_at: string
        }
        Insert: {
          action_counts?: Json
          created_at?: string
          epoch_date?: string
          epoch_type?: string
          id?: string
          total_minted?: number
          unique_users?: number
          updated_at?: string
        }
        Update: {
          action_counts?: Json
          created_at?: string
          epoch_date?: string
          epoch_type?: string
          id?: string
          total_minted?: number
          unique_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      pplp_evidences: {
        Row: {
          action_id: string
          anchor_chain: string | null
          anchor_tx_hash: string | null
          anchored_at: string | null
          content_hash: string
          created_at: string
          evidence_type: string
          evidence_type_enum:
            | Database["public"]["Enums"]["pplp_evidence_type"]
            | null
          id: string
          metadata: Json
          uri: string | null
        }
        Insert: {
          action_id: string
          anchor_chain?: string | null
          anchor_tx_hash?: string | null
          anchored_at?: string | null
          content_hash: string
          created_at?: string
          evidence_type: string
          evidence_type_enum?:
            | Database["public"]["Enums"]["pplp_evidence_type"]
            | null
          id?: string
          metadata?: Json
          uri?: string | null
        }
        Update: {
          action_id?: string
          anchor_chain?: string | null
          anchor_tx_hash?: string | null
          anchored_at?: string | null
          content_hash?: string
          created_at?: string
          evidence_type?: string
          evidence_type_enum?:
            | Database["public"]["Enums"]["pplp_evidence_type"]
            | null
          id?: string
          metadata?: Json
          uri?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pplp_evidences_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_fraud_signals: {
        Row: {
          action_id: string | null
          actor_id: string
          created_at: string
          details: Json
          id: string
          is_resolved: boolean
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number
          signal_type: string
          source: string
        }
        Insert: {
          action_id?: string | null
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          is_resolved?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          signal_type: string
          source?: string
        }
        Update: {
          action_id?: string | null
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          is_resolved?: boolean
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          signal_type?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "pplp_fraud_signals_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_mint_requests: {
        Row: {
          action_hash: string
          action_id: string
          actor_id: string
          amount: number
          created_at: string
          evidence_hash: string
          id: string
          minted_at: string | null
          nonce: number
          on_chain_error: string | null
          policy_version: number
          recipient_address: string
          signature: string | null
          signer_address: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          valid_after: string
          valid_before: string
        }
        Insert: {
          action_hash: string
          action_id: string
          actor_id: string
          amount: number
          created_at?: string
          evidence_hash: string
          id?: string
          minted_at?: string | null
          nonce: number
          on_chain_error?: string | null
          policy_version?: number
          recipient_address: string
          signature?: string | null
          signer_address?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          valid_after?: string
          valid_before?: string
        }
        Update: {
          action_hash?: string
          action_id?: string
          actor_id?: string
          amount?: number
          created_at?: string
          evidence_hash?: string
          id?: string
          minted_at?: string | null
          nonce?: number
          on_chain_error?: string | null
          policy_version?: number
          recipient_address?: string
          signature?: string | null
          signer_address?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          valid_after?: string
          valid_before?: string
        }
        Relationships: [
          {
            foreignKeyName: "pplp_mint_requests_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: true
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_policies: {
        Row: {
          action_configs: Json | null
          activated_at: string | null
          approved_by: string[] | null
          arweave_tx: string | null
          caps: Json | null
          changelog: string | null
          created_at: string
          created_by: string | null
          deprecated_at: string | null
          deprecation_reason: string | null
          description: string | null
          formulas: Json | null
          ipfs_cid: string | null
          is_active: boolean
          policy_hash: string | null
          policy_json: Json
          required_approvals: number | null
          thresholds: Json | null
          updated_at: string | null
          version: string
          version_int: number | null
        }
        Insert: {
          action_configs?: Json | null
          activated_at?: string | null
          approved_by?: string[] | null
          arweave_tx?: string | null
          caps?: Json | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          description?: string | null
          formulas?: Json | null
          ipfs_cid?: string | null
          is_active?: boolean
          policy_hash?: string | null
          policy_json: Json
          required_approvals?: number | null
          thresholds?: Json | null
          updated_at?: string | null
          version: string
          version_int?: number | null
        }
        Update: {
          action_configs?: Json | null
          activated_at?: string | null
          approved_by?: string[] | null
          arweave_tx?: string | null
          caps?: Json | null
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          deprecated_at?: string | null
          deprecation_reason?: string | null
          description?: string | null
          formulas?: Json | null
          ipfs_cid?: string | null
          is_active?: boolean
          policy_hash?: string | null
          policy_json?: Json
          required_approvals?: number | null
          thresholds?: Json | null
          updated_at?: string | null
          version?: string
          version_int?: number | null
        }
        Relationships: []
      }
      pplp_policy_changes: {
        Row: {
          block_number: number | null
          change_type: string
          changed_at: string
          changed_by: string | null
          field_changed: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          policy_version: string
          reason: string | null
          tx_hash: string | null
        }
        Insert: {
          block_number?: number | null
          change_type: string
          changed_at?: string
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          policy_version: string
          reason?: string | null
          tx_hash?: string | null
        }
        Update: {
          block_number?: number | null
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          policy_version?: string
          reason?: string | null
          tx_hash?: string | null
        }
        Relationships: []
      }
      pplp_policy_onchain: {
        Row: {
          block_number: number
          chain_id: number
          contract_address: string
          id: string
          policy_hash: string
          policy_version: string
          registered_at: string
          signer_address: string
          tx_hash: string
        }
        Insert: {
          block_number: number
          chain_id?: number
          contract_address: string
          id?: string
          policy_hash: string
          policy_version: string
          registered_at?: string
          signer_address: string
          tx_hash: string
        }
        Update: {
          block_number?: number
          chain_id?: number
          contract_address?: string
          id?: string
          policy_hash?: string
          policy_version?: string
          registered_at?: string
          signer_address?: string
          tx_hash?: string
        }
        Relationships: []
      }
      pplp_scores: {
        Row: {
          action_id: string
          base_reward: number
          created_at: string
          decision: Database["public"]["Enums"]["pplp_decision"]
          decision_reason: string | null
          final_reward: number
          id: string
          light_score: number
          multiplier_i: number
          multiplier_k: number
          multiplier_q: number
          pillar_c: number
          pillar_h: number
          pillar_s: number
          pillar_t: number
          pillar_u: number
          policy_version: string
          scored_by: string
        }
        Insert: {
          action_id: string
          base_reward?: number
          created_at?: string
          decision?: Database["public"]["Enums"]["pplp_decision"]
          decision_reason?: string | null
          final_reward?: number
          id?: string
          light_score?: number
          multiplier_i?: number
          multiplier_k?: number
          multiplier_q?: number
          pillar_c?: number
          pillar_h?: number
          pillar_s?: number
          pillar_t?: number
          pillar_u?: number
          policy_version?: string
          scored_by?: string
        }
        Update: {
          action_id?: string
          base_reward?: number
          created_at?: string
          decision?: Database["public"]["Enums"]["pplp_decision"]
          decision_reason?: string | null
          final_reward?: number
          id?: string
          light_score?: number
          multiplier_i?: number
          multiplier_k?: number
          multiplier_q?: number
          pillar_c?: number
          pillar_h?: number
          pillar_s?: number
          pillar_t?: number
          pillar_u?: number
          policy_version?: string
          scored_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pplp_scores_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: true
            referencedRelation: "pplp_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      pplp_signers: {
        Row: {
          address: string
          created_at: string
          deactivated_at: string | null
          id: string
          is_active: boolean
          name: string
          weight: number
        }
        Insert: {
          address: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          weight?: number
        }
        Update: {
          address?: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          weight?: number
        }
        Relationships: []
      }
      pplp_user_caps: {
        Row: {
          action_counts: Json
          created_at: string
          epoch_date: string
          epoch_type: string
          id: string
          last_action_at: string | null
          total_minted: number
          updated_at: string
          user_id: string
        }
        Insert: {
          action_counts?: Json
          created_at?: string
          epoch_date?: string
          epoch_type?: string
          id?: string
          last_action_at?: string | null
          total_minted?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          action_counts?: Json
          created_at?: string
          epoch_date?: string
          epoch_type?: string
          id?: string
          last_action_at?: string | null
          total_minted?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pplp_user_nonces: {
        Row: {
          current_nonce: number
          last_used_at: string
          user_id: string
        }
        Insert: {
          current_nonce?: number
          last_used_at?: string
          user_id: string
        }
        Update: {
          current_nonce?: number
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pplp_user_tiers: {
        Row: {
          cap_multiplier: number
          community_vouches: number
          created_at: string
          failed_actions: number
          fraud_flags: number
          known_device_hashes: string[] | null
          last_device_hash: string | null
          last_tier_change: string | null
          passed_actions: number
          stake_locked_until: string | null
          staked_amount: number
          tier: number
          tier_change_reason: string | null
          total_actions_scored: number
          trust_score: number
          updated_at: string
          user_id: string
          verified_connections: number
        }
        Insert: {
          cap_multiplier?: number
          community_vouches?: number
          created_at?: string
          failed_actions?: number
          fraud_flags?: number
          known_device_hashes?: string[] | null
          last_device_hash?: string | null
          last_tier_change?: string | null
          passed_actions?: number
          stake_locked_until?: string | null
          staked_amount?: number
          tier?: number
          tier_change_reason?: string | null
          total_actions_scored?: number
          trust_score?: number
          updated_at?: string
          user_id: string
          verified_connections?: number
        }
        Update: {
          cap_multiplier?: number
          community_vouches?: number
          created_at?: string
          failed_actions?: number
          fraud_flags?: number
          known_device_hashes?: string[] | null
          last_device_hash?: string | null
          last_tier_change?: string | null
          passed_actions?: number
          stake_locked_until?: string | null
          staked_amount?: number
          tier?: number
          tier_change_reason?: string | null
          total_actions_scored?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
          verified_connections?: number
        }
        Relationships: []
      }
      profile_public_settings: {
        Row: {
          allow_public_follow: boolean
          allow_public_message: boolean
          allow_public_transfer: boolean
          badge_type: string | null
          created_at: string
          enabled_modules: Json | null
          featured_items: Json | null
          public_profile_enabled: boolean
          show_donation_button: boolean
          show_friends_count: boolean
          show_modules: boolean
          show_stats: boolean
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_public_follow?: boolean
          allow_public_message?: boolean
          allow_public_transfer?: boolean
          badge_type?: string | null
          created_at?: string
          enabled_modules?: Json | null
          featured_items?: Json | null
          public_profile_enabled?: boolean
          show_donation_button?: boolean
          show_friends_count?: boolean
          show_modules?: boolean
          show_stats?: boolean
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_public_follow?: boolean
          allow_public_message?: boolean
          allow_public_transfer?: boolean
          badge_type?: string | null
          created_at?: string
          enabled_modules?: Json | null
          featured_items?: Json | null
          public_profile_enabled?: boolean
          show_donation_button?: boolean
          show_friends_count?: boolean
          show_modules?: boolean
          show_stats?: boolean
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_view_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          profile_user_id: string
          referrer_handle: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          profile_user_id: string
          referrer_handle?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          profile_user_id?: string
          referrer_handle?: string | null
          viewer_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          handle_updated_at: string | null
          id: string
          popl_badge_level: string | null
          popl_verified: boolean | null
          popl_verified_at: string | null
          response_style: string | null
          social_links: Json | null
          soul_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          handle_updated_at?: string | null
          id?: string
          popl_badge_level?: string | null
          popl_verified?: boolean | null
          popl_verified_at?: string | null
          response_style?: string | null
          social_links?: Json | null
          soul_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          handle_updated_at?: string | null
          id?: string
          popl_badge_level?: string | null
          popl_verified?: boolean | null
          popl_verified_at?: string | null
          response_style?: string | null
          social_links?: Json | null
          soul_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_donations: {
        Row: {
          amount: number
          created_at: string
          donation_type: string
          donor_id: string
          id: string
          message: string | null
          status: string
          tx_hash: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donation_type?: string
          donor_id: string
          id?: string
          message?: string | null
          status?: string
          tx_hash?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donation_type?: string
          donor_id?: string
          id?: string
          message?: string | null
          status?: string
          tx_hash?: string | null
        }
        Relationships: []
      }
      project_fund: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_distributed: number
          total_received: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_distributed?: number
          total_received?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_distributed?: number
          total_received?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_likes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "chat_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_handles: {
        Row: {
          created_at: string
          word: string
        }
        Insert: {
          created_at?: string
          word: string
        }
        Update: {
          created_at?: string
          word?: string
        }
        Relationships: []
      }
      slug_history: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          new_slug: string
          old_slug: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type?: string
          created_at?: string
          id?: string
          new_slug: string
          old_slug: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          new_slug?: string
          old_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      sybil_pattern_registry: {
        Row: {
          created_at: string | null
          description: string | null
          flagged_by: string | null
          id: string
          is_active: boolean | null
          pattern_type: string
          pattern_value: string
          severity: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flagged_by?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type: string
          pattern_value: string
          severity?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flagged_by?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type?: string
          pattern_value?: string
          severity?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_partner_id: string
          id: string
          is_typing: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_partner_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_partner_id?: string
          id?: string
          is_typing?: boolean | null
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
      user_api_keys: {
        Row: {
          created_at: string
          daily_limit: number
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          total_requests: number
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          total_requests?: number
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          total_requests?: number
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
      user_feedback: {
        Row: {
          admin_response: string | null
          coins_earned: number | null
          content: string
          content_length: number
          created_at: string
          feedback_type: string
          id: string
          is_helpful: boolean | null
          is_rewarded: boolean | null
          rating: number | null
          responded_at: string | null
          responded_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          coins_earned?: number | null
          content: string
          content_length?: number
          created_at?: string
          feedback_type: string
          id?: string
          is_helpful?: boolean | null
          is_rewarded?: boolean | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          coins_earned?: number | null
          content?: string
          content_length?: number
          created_at?: string
          feedback_type?: string
          id?: string
          is_helpful?: boolean | null
          is_rewarded?: boolean | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          title?: string
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
          last_score_update: string | null
          lifetime_points: number | null
          negative_actions: number | null
          popl_score: number | null
          positive_actions: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number | null
          id?: string
          last_score_update?: string | null
          lifetime_points?: number | null
          negative_actions?: number | null
          popl_score?: number | null
          positive_actions?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number | null
          id?: string
          last_score_update?: string | null
          lifetime_points?: number | null
          negative_actions?: number | null
          popl_score?: number | null
          positive_actions?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_online_status: {
        Row: {
          id: string
          is_online: boolean | null
          last_seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_online?: boolean | null
          last_seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_online?: boolean | null
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rate_limits: {
        Row: {
          ban_reason: string | null
          created_at: string
          id: string
          is_temp_banned: boolean | null
          last_question_at: string | null
          questions_last_hour: number | null
          suspicious_activity_count: number | null
          temp_ban_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_reason?: string | null
          created_at?: string
          id?: string
          is_temp_banned?: boolean | null
          last_question_at?: string | null
          questions_last_hour?: number | null
          suspicious_activity_count?: number | null
          temp_ban_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_reason?: string | null
          created_at?: string
          id?: string
          is_temp_banned?: boolean | null
          last_question_at?: string | null
          questions_last_hour?: number | null
          suspicious_activity_count?: number | null
          temp_ban_until?: string | null
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
      user_wallet_addresses: {
        Row: {
          change_count_this_month: number
          created_at: string
          id: string
          last_change_month: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          change_count_this_month?: number
          created_at?: string
          id?: string
          last_change_month?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          change_count_this_month?: number
          created_at?: string
          id?: string
          last_change_month?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_withdrawal_stats: {
        Row: {
          created_at: string
          id: string
          last_withdrawal_at: string | null
          successful_withdrawals: number
          total_requests: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_withdrawal_at?: string | null
          successful_withdrawals?: number
          total_requests?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_withdrawal_at?: string | null
          successful_withdrawals?: number
          total_requests?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vision_boards: {
        Row: {
          completed_goals_count: number | null
          created_at: string
          description: string | null
          goals: Json | null
          id: string
          images: Json | null
          is_first_board: boolean | null
          is_public: boolean | null
          is_rewarded: boolean | null
          reward_amount: number | null
          title: string
          total_goals_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_goals_count?: number | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          id?: string
          images?: Json | null
          is_first_board?: boolean | null
          is_public?: boolean | null
          is_rewarded?: boolean | null
          reward_amount?: number | null
          title: string
          total_goals_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_goals_count?: number | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          id?: string
          images?: Json | null
          is_first_board?: boolean | null
          is_public?: boolean | null
          is_rewarded?: boolean | null
          reward_amount?: number | null
          title?: string
          total_goals_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_camly_coins: {
        Args: {
          _amount: number
          _description?: string
          _metadata?: Json
          _purity_score?: number
          _transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          _user_id: string
        }
        Returns: number
      }
      add_light_points: {
        Args: {
          _points: number
          _reason: string
          _source_type: string
          _user_id: string
        }
        Returns: undefined
      }
      add_pending_or_instant_reward: {
        Args: {
          _amount: number
          _description: string
          _metadata?: Json
          _purity_score?: number
          _transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
          _user_id: string
        }
        Returns: Json
      }
      auto_suspend_high_risk: {
        Args: { _risk_score: number; _signals?: Json; _user_id: string }
        Returns: Json
      }
      calculate_light_score: {
        Args: { _c: number; _h: number; _s: number; _t: number; _u: number }
        Returns: number
      }
      calculate_pplp_reward: {
        Args: { _base_reward: number; _i: number; _k: number; _q: number }
        Returns: number
      }
      check_ai_usage_only: {
        Args: { _daily_limit?: number; _usage_type: string; _user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          daily_limit: number
          message: string
        }[]
      }
      check_and_increment_ai_usage: {
        Args: { _daily_limit?: number; _usage_type: string; _user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          daily_limit: number
          message: string
        }[]
      }
      check_user_cap_and_update: {
        Args: { _action_type: string; _reward_amount: number; _user_id: string }
        Returns: Json
      }
      check_withdrawal_eligibility: {
        Args: { _user_id: string }
        Returns: {
          can_withdraw: boolean
          has_journal_today: boolean
          has_post_today: boolean
          message: string
        }[]
      }
      cleanup_expired_stories: { Args: never; Returns: undefined }
      compute_policy_hash: { Args: { _policy_json: Json }; Returns: string }
      detect_coordinated_timing: {
        Args: never
        Returns: {
          action_count: number
          pattern_days: number
          time_window: string
          user_count: number
          user_ids: string[]
        }[]
      }
      detect_cross_account_content_similarity: {
        Args: never
        Returns: {
          content_hash: string
          detected_at: string
          sample_content: string
          user_count: number
          user_ids: string[]
        }[]
      }
      detect_wallet_clusters: {
        Args: never
        Returns: {
          collector_wallet: string
          first_seen: string
          last_seen: string
          sender_count: number
          sender_user_ids: string[]
          token_types: string[]
          total_amount: number
        }[]
      }
      expire_old_mint_requests: { Args: never; Returns: number }
      freeze_user_pending_rewards: {
        Args: { _reason?: string; _user_id: string }
        Returns: number
      }
      get_account_age_days: { Args: { _user_id: string }; Returns: number }
      get_account_age_gate: {
        Args: { _user_id: string }
        Returns: {
          account_age_days: number
          gate_level: string
          max_actions_per_day: number
          reward_multiplier: number
        }[]
      }
      get_active_policy: {
        Args: never
        Returns: {
          action_configs: Json | null
          activated_at: string | null
          approved_by: string[] | null
          arweave_tx: string | null
          caps: Json | null
          changelog: string | null
          created_at: string
          created_by: string | null
          deprecated_at: string | null
          deprecation_reason: string | null
          description: string | null
          formulas: Json | null
          ipfs_cid: string | null
          is_active: boolean
          policy_hash: string | null
          policy_json: Json
          required_approvals: number | null
          thresholds: Json | null
          updated_at: string | null
          version: string
          version_int: number | null
        }
        SetofOptions: {
          from: "*"
          to: "pplp_policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_activity_history_stats: {
        Args: never
        Returns: {
          rewarded_chats: number
          total_chats: number
          total_rewards: number
          unique_users: number
        }[]
      }
      get_admin_statistics: {
        Args: {
          _date_filter?: string
          _today_start?: string
          _week_start?: string
        }
        Returns: {
          average_per_transaction: number
          today_coins: number
          total_coins_distributed: number
          total_transactions: number
          total_users: number
          unique_recipients: number
          week_coins: number
        }[]
      }
      get_admin_user_management_data: {
        Args: never
        Returns: {
          avatar_url: string
          camly_balance: number
          camly_lifetime_earned: number
          camly_lifetime_spent: number
          comment_count: number
          display_name: string
          fun_money_received: number
          gift_internal_received: number
          gift_internal_sent: number
          gift_web3_received: number
          gift_web3_sent: number
          handle: string
          joined_at: string
          light_score: number
          negative_actions: number
          popl_score: number
          positive_actions: number
          post_count: number
          pplp_action_count: number
          pplp_minted_count: number
          total_withdrawn: number
          user_id: string
          wallet_address: string
          withdrawal_count: number
        }[]
      }
      get_daily_ai_usage: {
        Args: { _user_id: string }
        Returns: {
          daily_limit: number
          usage_count: number
          usage_type: string
        }[]
      }
      get_daily_reward_status: {
        Args: { _user_id: string }
        Returns: {
          can_write_journal: boolean
          journals_remaining: number
          journals_rewarded: number
          questions_remaining: number
          questions_rewarded: number
        }[]
      }
      get_daily_trends: {
        Args: { _date_filter?: string }
        Returns: {
          total_coins: number
          transaction_count: number
          trend_date: string
        }[]
      }
      get_early_adopter_rank: { Args: { p_user_id: string }; Returns: number }
      get_extended_daily_reward_status: {
        Args: { _user_id: string }
        Returns: {
          can_write_journal: boolean
          community_helps_remaining: number
          community_helps_rewarded: number
          current_streak: number
          feedbacks_remaining: number
          feedbacks_rewarded: number
          ideas_remaining: number
          ideas_submitted: number
          journals_remaining: number
          journals_rewarded: number
          knowledge_uploads: number
          knowledge_uploads_remaining: number
          logins_rewarded: number
          questions_remaining: number
          questions_rewarded: number
          shares_remaining: number
          shares_rewarded: number
          total_coins_today: number
        }[]
      }
      get_next_nonce: { Args: { _user_id: string }; Returns: number }
      get_top_recipients: {
        Args: { _date_filter?: string; _limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          total_earned: number
          transaction_count: number
          user_id: string
        }[]
      }
      get_transaction_type_stats: {
        Args: { _date_filter?: string }
        Returns: {
          total_amount: number
          transaction_count: number
          transaction_type: string
        }[]
      }
      get_user_pplp_stats: {
        Args: { _user_id: string }
        Returns: {
          avg_light_score: number
          avg_pillar_c: number
          avg_pillar_h: number
          avg_pillar_s: number
          avg_pillar_t: number
          avg_pillar_u: number
          minted_actions: number
          scored_actions: number
          total_actions: number
          total_rewards: number
        }[]
      }
      get_user_withdrawal_status: {
        Args: { _user_id: string }
        Returns: {
          available_balance: number
          can_withdraw: boolean
          pending_amount: number
          remaining_daily_limit: number
          total_withdrawn: number
          withdrawn_today: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: {
        Args: { _usage_type: string; _user_id: string }
        Returns: number
      }
      increment_api_key_usage: {
        Args: { _api_key_id: string; _tokens_used?: number }
        Returns: undefined
      }
      increment_early_adopter_questions: {
        Args: { p_user_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_coordinator_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
      process_daily_login: {
        Args: { _user_id: string }
        Returns: {
          already_logged_in: boolean
          coins_earned: number
          is_streak_bonus: boolean
          new_balance: number
          streak_count: number
        }[]
      }
      process_early_adopter_reward: {
        Args: { p_user_id: string }
        Returns: {
          coins_awarded: number
          message: string
          success: boolean
          user_rank: number
        }[]
      }
      register_device_fingerprint: {
        Args: { _device_hash: string; _user_id: string }
        Returns: Json
      }
      register_early_adopter: { Args: { p_user_id: string }; Returns: boolean }
      release_pending_rewards: {
        Args: never
        Returns: {
          frozen_count: number
          released_count: number
          total_amount: number
        }[]
      }
      request_coin_withdrawal: {
        Args: { _amount: number; _user_id: string; _wallet_address: string }
        Returns: {
          message: string
          success: boolean
          withdrawal_id: string
        }[]
      }
      run_cross_account_scan: { Args: never; Returns: Json }
      schedule_random_audit: { Args: never; Returns: number }
      update_popl_score: {
        Args: { _action_type: string; _is_positive: boolean; _user_id: string }
        Returns: number
      }
      update_user_tier: {
        Args: { _user_id: string }
        Returns: {
          cap_multiplier: number
          community_vouches: number
          created_at: string
          failed_actions: number
          fraud_flags: number
          known_device_hashes: string[] | null
          last_device_hash: string | null
          last_tier_change: string | null
          passed_actions: number
          stake_locked_until: string | null
          staked_amount: number
          tier: number
          tier_change_reason: string | null
          total_actions_scored: number
          trust_score: number
          updated_at: string
          user_id: string
          verified_connections: number
        }
        SetofOptions: {
          from: "*"
          to: "pplp_user_tiers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_api_key: {
        Args: { _key_hash: string }
        Returns: {
          api_key_id: string
          current_usage: number
          daily_limit: number
          is_rate_limited: boolean
          user_id: string
        }[]
      }
      validate_policy_version: { Args: { _version: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user" | "coordinator"
      approval_status: "pending" | "approved" | "rejected" | "trial"
      coin_transaction_type:
        | "chat_reward"
        | "gratitude_reward"
        | "journal_reward"
        | "engagement_reward"
        | "referral_bonus"
        | "challenge_reward"
        | "spending"
        | "admin_adjustment"
        | "daily_login"
        | "bounty_reward"
        | "build_idea"
        | "content_share"
        | "knowledge_upload"
        | "feedback_reward"
        | "vision_reward"
        | "community_support"
        | "gift_sent"
        | "gift_received"
        | "project_donation"
        | "project_reward"
        | "pplp_reward"
        | "lixi_claim"
      energy_level: "very_high" | "high" | "neutral" | "low" | "very_low"
      pplp_action_status:
        | "pending"
        | "scoring"
        | "scored"
        | "minted"
        | "rejected"
        | "disputed"
      pplp_action_type:
        | "LEARN_COMPLETE"
        | "PROJECT_SUBMIT"
        | "MENTOR_HELP"
        | "COURSE_CREATE"
        | "QUIZ_PASS"
        | "CONTENT_CREATE"
        | "CONTENT_REVIEW"
        | "CONTENT_SHARE"
        | "COMMENT_CREATE"
        | "POST_ENGAGEMENT"
        | "DONATE"
        | "VOLUNTEER"
        | "CAMPAIGN_CREATE"
        | "CAMPAIGN_SUPPORT"
        | "TREE_PLANT"
        | "CLEANUP_EVENT"
        | "CARBON_OFFSET"
        | "ECO_ACTION"
        | "FARM_DELIVERY"
        | "MARKET_FAIR_TRADE"
        | "PRODUCT_REVIEW"
        | "SELLER_VERIFY"
        | "BUG_BOUNTY"
        | "GOV_PROPOSAL"
        | "GOV_VOTE"
        | "DISPUTE_RESOLVE"
        | "POLICY_REVIEW"
        | "DAILY_RITUAL"
        | "GRATITUDE_PRACTICE"
        | "JOURNAL_WRITE"
        | "QUESTION_ASK"
        | "DAILY_LOGIN"
        | "STAKE_LOCK"
        | "LIQUIDITY_PROVIDE"
        | "REFERRAL_INVITE"
        | "PROFILE_COMPLETE"
        | "KYC_VERIFY"
        | "REPUTATION_EARN"
      pplp_decision: "pass" | "fail" | "pending" | "manual_review"
      pplp_dispute_status: "open" | "investigating" | "resolved" | "rejected"
      pplp_evidence_type:
        | "QUIZ_SCORE"
        | "CERTIFICATE"
        | "SCREENSHOT"
        | "TRANSACTION_HASH"
        | "GPS_LOCATION"
        | "PHOTO_PROOF"
        | "VIDEO_PROOF"
        | "DOCUMENT"
        | "API_RESPONSE"
        | "DEVICE_SIGNATURE"
        | "USER_ATTESTATION"
        | "THIRD_PARTY_VERIFY"
        | "IPFS_HASH"
        | "CONTENT_HASH"
      pplp_integrity_signal:
        | "DEVICE_FINGERPRINT"
        | "SESSION_CONTINUITY"
        | "IP_CONSISTENCY"
        | "BEHAVIORAL_PATTERN"
        | "CAPTCHA_PASS"
        | "ANTI_SYBIL_CHECK"
        | "TIME_PATTERN_VALID"
        | "LOCATION_VALID"
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
      app_role: ["admin", "user", "coordinator"],
      approval_status: ["pending", "approved", "rejected", "trial"],
      coin_transaction_type: [
        "chat_reward",
        "gratitude_reward",
        "journal_reward",
        "engagement_reward",
        "referral_bonus",
        "challenge_reward",
        "spending",
        "admin_adjustment",
        "daily_login",
        "bounty_reward",
        "build_idea",
        "content_share",
        "knowledge_upload",
        "feedback_reward",
        "vision_reward",
        "community_support",
        "gift_sent",
        "gift_received",
        "project_donation",
        "project_reward",
        "pplp_reward",
        "lixi_claim",
      ],
      energy_level: ["very_high", "high", "neutral", "low", "very_low"],
      pplp_action_status: [
        "pending",
        "scoring",
        "scored",
        "minted",
        "rejected",
        "disputed",
      ],
      pplp_action_type: [
        "LEARN_COMPLETE",
        "PROJECT_SUBMIT",
        "MENTOR_HELP",
        "COURSE_CREATE",
        "QUIZ_PASS",
        "CONTENT_CREATE",
        "CONTENT_REVIEW",
        "CONTENT_SHARE",
        "COMMENT_CREATE",
        "POST_ENGAGEMENT",
        "DONATE",
        "VOLUNTEER",
        "CAMPAIGN_CREATE",
        "CAMPAIGN_SUPPORT",
        "TREE_PLANT",
        "CLEANUP_EVENT",
        "CARBON_OFFSET",
        "ECO_ACTION",
        "FARM_DELIVERY",
        "MARKET_FAIR_TRADE",
        "PRODUCT_REVIEW",
        "SELLER_VERIFY",
        "BUG_BOUNTY",
        "GOV_PROPOSAL",
        "GOV_VOTE",
        "DISPUTE_RESOLVE",
        "POLICY_REVIEW",
        "DAILY_RITUAL",
        "GRATITUDE_PRACTICE",
        "JOURNAL_WRITE",
        "QUESTION_ASK",
        "DAILY_LOGIN",
        "STAKE_LOCK",
        "LIQUIDITY_PROVIDE",
        "REFERRAL_INVITE",
        "PROFILE_COMPLETE",
        "KYC_VERIFY",
        "REPUTATION_EARN",
      ],
      pplp_decision: ["pass", "fail", "pending", "manual_review"],
      pplp_dispute_status: ["open", "investigating", "resolved", "rejected"],
      pplp_evidence_type: [
        "QUIZ_SCORE",
        "CERTIFICATE",
        "SCREENSHOT",
        "TRANSACTION_HASH",
        "GPS_LOCATION",
        "PHOTO_PROOF",
        "VIDEO_PROOF",
        "DOCUMENT",
        "API_RESPONSE",
        "DEVICE_SIGNATURE",
        "USER_ATTESTATION",
        "THIRD_PARTY_VERIFY",
        "IPFS_HASH",
        "CONTENT_HASH",
      ],
      pplp_integrity_signal: [
        "DEVICE_FINGERPRINT",
        "SESSION_CONTINUITY",
        "IP_CONSISTENCY",
        "BEHAVIORAL_PATTERN",
        "CAPTCHA_PASS",
        "ANTI_SYBIL_CHECK",
        "TIME_PATTERN_VALID",
        "LOCATION_VALID",
      ],
      suspension_type: ["temporary", "permanent"],
    },
  },
} as const
