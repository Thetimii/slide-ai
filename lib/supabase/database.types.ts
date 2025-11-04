// This file is auto-generated from your Supabase schema
// You can generate this by running: npx supabase gen types typescript --project-id mvynkudqddhmexfpejvh > lib/supabase/database.types.ts

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
          email: string | null
          is_demo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          is_demo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          is_demo?: boolean
          created_at?: string
        }
      }
      presentations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          slides_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          slides_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          slides_json?: Json
          created_at?: string
        }
      }
      prompts_history: {
        Row: {
          id: string
          user_id: string
          input_text: string
          ai_response: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_text: string
          ai_response: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_text?: string
          ai_response?: Json
          created_at?: string
        }
      }
      exports: {
        Row: {
          id: string
          user_id: string
          presentation_id: string
          format: string
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          presentation_id: string
          format: string
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          presentation_id?: string
          format?: string
          file_path?: string | null
          created_at?: string
        }
      }
      transfer_links: {
        Row: {
          id: string
          demo_user_id: string
          real_user_id: string | null
          claimed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          demo_user_id: string
          real_user_id?: string | null
          claimed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          demo_user_id?: string
          real_user_id?: string | null
          claimed?: boolean
          created_at?: string
        }
      }
    }
  }
}
