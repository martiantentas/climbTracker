// Auto-generated Supabase database types.
// Run `npx supabase gen types typescript --project-id <your-id>` to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── ROW TYPES ────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:           string     // uuid — references auth.users
          email:        string
          display_name: string | null
          avatar_url:   string | null
          emoji:        string | null
          lang:         string     // 'en' | 'es' | 'ca'
          theme:        string     // 'light' | 'dark'
          location:     string | null
          bio:          string | null
          trait_ids:    string[]
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }

      competitions: {
        Row: {
          id:          string
          owner_id:    string     // uuid — references auth.users
          status:      string     // 'DRAFT' | 'LIVE' | 'FINISHED' | 'ARCHIVED'
          visibility:  string     // 'public' | 'private'
          invite_code: string | null
          data:        Json       // full Competition object
          created_at:  string
          updated_at:  string
        }
        Insert: Omit<Database['public']['Tables']['competitions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['competitions']['Insert']>
        Relationships: []
      }

      boulders: {
        Row: {
          id:             string
          competition_id: string
          position:       number
          data:           Json    // full Boulder object
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['boulders']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['boulders']['Insert']>
        Relationships: []
      }

      competition_members: {
        Row: {
          competition_id: string
          user_id:        string  // uuid — references auth.users
          role:           string  // 'competitor' | 'judge' | 'organizer'
          status:         string  // 'active' | 'waitlisted'
          bib_number:     number | null
          trait_ids:      string[]
          gender:         string | null
          joined_at:      string
        }
        Insert: Omit<Database['public']['Tables']['competition_members']['Row'], 'joined_at'>
        Update: Partial<Database['public']['Tables']['competition_members']['Insert']>
        Relationships: []
      }

      completions: {
        Row: {
          competition_id: string
          competitor_id:  string  // uuid — references auth.users
          boulder_id:     string
          data:           Json    // full Completion object
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['completions']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['completions']['Insert']>
        Relationships: []
      }

      payments: {
        Row: {
          id:                string
          competition_id:    string
          user_id:           string
          stripe_payment_id: string | null
          stripe_session_id: string | null
          amount_cents:      number
          currency:          string
          status:            string  // 'pending' | 'succeeded' | 'failed' | 'refunded'
          tier:              string
          participant_limit: number
          created_at:        string
          updated_at:        string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
    }

    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}

// ─── CONVENIENCE ALIASES ──────────────────────────────────────────────────────

export type Profile           = Database['public']['Tables']['profiles']['Row']
export type CompetitionRow    = Database['public']['Tables']['competitions']['Row']
export type BoulderRow        = Database['public']['Tables']['boulders']['Row']
export type MemberRow         = Database['public']['Tables']['competition_members']['Row']
export type CompletionRow     = Database['public']['Tables']['completions']['Row']
export type Payment           = Database['public']['Tables']['payments']['Row']
