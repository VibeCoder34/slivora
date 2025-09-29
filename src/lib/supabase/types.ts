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
          name: string | null
          created_at: string
          subscription_plan: string
          current_tokens: number
          rollover_tokens: number
          tokens_reset_date: string
          total_tokens_used: number
          subscription_status: string
          stripe_customer_id: string | null
          subscription_id: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          subscription_plan?: string
          current_tokens?: number
          rollover_tokens?: number
          tokens_reset_date?: string
          total_tokens_used?: number
          subscription_status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          subscription_plan?: string
          current_tokens?: number
          rollover_tokens?: number
          tokens_reset_date?: string
          total_tokens_used?: number
          subscription_status?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          outline_text: string
          language: string
          theme: string
          slide_count: number
          status: 'draft' | 'generating' | 'ready' | 'error'
          slide_plan: Json | null
          slides_count: number
          last_generated_at: string | null
          generate_error: string | null
          pptx_url: string | null
          export_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          outline_text: string
          language?: string
          theme?: string
          slide_count?: number
          status?: 'draft' | 'generating' | 'ready' | 'error'
          slide_plan?: Json | null
          slides_count?: number
          last_generated_at?: string | null
          generate_error?: string | null
          pptx_url?: string | null
          export_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          outline_text?: string
          language?: string
          theme?: string
          slide_count?: number
          status?: 'draft' | 'generating' | 'ready' | 'error'
          slide_plan?: Json | null
          slides_count?: number
          last_generated_at?: string | null
          generate_error?: string | null
          pptx_url?: string | null
          export_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      slides: {
        Row: {
          id: string
          project_id: string
          slide_number: number
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          slide_number: number
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          slide_number?: number
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          provider: string
          plan: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          plan: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          plan?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      token_usage: {
        Row: {
          id: string
          user_id: string
          action_type: string
          tokens_consumed: number
          project_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          tokens_consumed: number
          project_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          tokens_consumed?: number
          project_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          tokens_amount: number
          amount_paid: number
          currency: string
          payment_provider: string | null
          payment_reference: string | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          tokens_amount: number
          amount_paid?: number
          currency?: string
          payment_provider?: string | null
          payment_reference?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          tokens_amount?: number
          amount_paid?: number
          currency?: string
          payment_provider?: string | null
          payment_reference?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      billing_cycles: {
        Row: {
          id: string
          user_id: string
          cycle_start: string
          cycle_end: string
          tokens_allocated: number
          tokens_used: number
          tokens_rolled_over: number
          subscription_plan: string
          amount_billed: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cycle_start: string
          cycle_end: string
          tokens_allocated: number
          tokens_used?: number
          tokens_rolled_over?: number
          subscription_plan: string
          amount_billed?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cycle_start?: string
          cycle_end?: string
          tokens_allocated?: number
          tokens_used?: number
          tokens_rolled_over?: number
          subscription_plan?: string
          amount_billed?: number
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
