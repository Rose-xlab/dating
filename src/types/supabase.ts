export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          subscription: 'free' | 'premium'
          analysis_count: number
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          subscription?: 'free' | 'premium'
          analysis_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          subscription?: 'free' | 'premium'
          analysis_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analysis_results: {
        Row: {
          id: string
          user_id: string | null
          created_at: string
          risk_score: number
          trust_score: number
          escalation_index: number
          chat_content: Json
          flags: Json
          timeline: Json
          reciprocity_score: Json
          consistency_analysis: Json
          suggested_replies: Json
          evidence: Json
          metadata: Json
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string
          risk_score: number
          trust_score: number
          escalation_index: number
          chat_content: Json
          flags?: Json
          timeline?: Json
          reciprocity_score: Json
          consistency_analysis: Json
          suggested_replies?: Json
          evidence?: Json
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string
          risk_score?: number
          trust_score?: number
          escalation_index?: number
          chat_content?: Json
          flags?: Json
          timeline?: Json
          reciprocity_score?: Json
          consistency_analysis?: Json
          suggested_replies?: Json
          evidence?: Json
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_analyses: {
        Row: {
          id: string
          user_id: string
          analysis_id: string
          title: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id: string
          title: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string
          title?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_analyses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_analyses_analysis_id_fkey"
            columns: ["analysis_id"]
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          analysis_id: string | null
          user_id: string | null
          flag_id: string
          feedback_type: 'false_positive' | 'false_negative' | 'helpful' | 'not_helpful'
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id?: string | null
          user_id?: string | null
          flag_id: string
          feedback_type: 'false_positive' | 'false_negative' | 'helpful' | 'not_helpful'
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string | null
          user_id?: string | null
          flag_id?: string
          feedback_type?: 'false_positive' | 'false_negative' | 'helpful' | 'not_helpful'
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_analysis_id_fkey"
            columns: ["analysis_id"]
            referencedRelation: "analysis_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string | null
          action_type: 'text_analysis' | 'image_analysis' | 'export_report'
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id?: string | null
          action_type: 'text_analysis' | 'image_analysis' | 'export_report'
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string | null
          action_type?: 'text_analysis' | 'image_analysis' | 'export_report'
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_analysis_count: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      cleanup_old_analyses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}