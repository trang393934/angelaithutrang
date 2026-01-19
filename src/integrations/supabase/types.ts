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
      chat_questions: {
        Row: {
          ai_response_preview: string | null
          created_at: string
          id: string
          is_greeting: boolean | null
          is_rewarded: boolean | null
          is_spam: boolean | null
          likes_count: number | null
          purity_score: number | null
          question_hash: string
          question_text: string
          replies_count: number | null
          reward_amount: number | null
          user_id: string
        }
        Insert: {
          ai_response_preview?: string | null
          created_at?: string
          id?: string
          is_greeting?: boolean | null
          is_rewarded?: boolean | null
          is_spam?: boolean | null
          likes_count?: number | null
          purity_score?: number | null
          question_hash: string
          question_text: string
          replies_count?: number | null
          reward_amount?: number | null
          user_id: string
        }
        Update: {
          ai_response_preview?: string | null
          created_at?: string
          id?: string
          is_greeting?: boolean | null
          is_rewarded?: boolean | null
          is_spam?: boolean | null
          likes_count?: number | null
          purity_score?: number | null
          question_hash?: string
          question_text?: string
          replies_count?: number | null
          reward_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      coin_withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
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
          community_helps_rewarded: number
          created_at: string
          feedbacks_rewarded: number
          id: string
          ideas_submitted: number
          journals_rewarded: number
          knowledge_uploads: number
          logins_rewarded: number
          question_hashes: string[] | null
          questions_rewarded: number
          reward_date: string
          shares_rewarded: number
          total_coins_today: number
          updated_at: string
          user_id: string
        }
        Insert: {
          community_helps_rewarded?: number
          created_at?: string
          feedbacks_rewarded?: number
          id?: string
          ideas_submitted?: number
          journals_rewarded?: number
          knowledge_uploads?: number
          logins_rewarded?: number
          question_hashes?: string[] | null
          questions_rewarded?: number
          reward_date?: string
          shares_rewarded?: number
          total_coins_today?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          community_helps_rewarded?: number
          created_at?: string
          feedbacks_rewarded?: number
          id?: string
          ideas_submitted?: number
          journals_rewarded?: number
          knowledge_uploads?: number
          logins_rewarded?: number
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
      is_admin: { Args: never; Returns: boolean }
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
      request_coin_withdrawal: {
        Args: { _amount: number; _user_id: string; _wallet_address: string }
        Returns: {
          message: string
          success: boolean
          withdrawal_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      ],
      energy_level: ["very_high", "high", "neutral", "low", "very_low"],
      suspension_type: ["temporary", "permanent"],
    },
  },
} as const
