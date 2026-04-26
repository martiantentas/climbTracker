// Auto-generated Supabase database types.
// Run `npx supabase gen types typescript --project-id <your-id>` to regenerate
// once you've run the schema migrations.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── ROW TYPES ────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:              string          // uuid, references auth.users
          email:           string
          display_name:    string | null
          avatar_url:      string | null
          emoji:           string | null
          lang:            string          // 'en' | 'es' | 'ca'
          theme:           string          // 'light' | 'dark'
          location:        string | null
          bio:             string | null
          trait_ids:       string[]
          created_at:      string
          updated_at:      string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      competitions: {
        Row: {
          id:                   string
          owner_id:             string    // references profiles.id
          name:                 string
          location:             string | null
          start_date:           string    // ISO timestamp
          end_date:             string    // ISO timestamp
          status:               string    // 'DRAFT' | 'LIVE' | 'FINISHED' | 'ARCHIVED'
          visibility:           string    // 'public' | 'private'
          invite_code:          string | null
          scoring_mode:         string    // 'admin' | 'self' | 'judges'
          description:          string | null
          rules:                string | null
          tier:                 string | null    // 'standard' | 'premium'
          subscription:         string | null
          participant_limit:    number | null
          additional_capacity:  number | null
          branding:             Json | null
          created_at:           string
          updated_at:           string
        }
        Insert: Omit<Database['public']['Tables']['competitions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['competitions']['Insert']>
      }

      competition_members: {
        Row: {
          id:             string
          competition_id: string
          user_id:        string
          role:           string    // 'organizer' | 'judge' | 'competitor'
          bib_number:     number | null
          trait_ids:      string[]
          joined_at:      string
        }
        Insert: Omit<Database['public']['Tables']['competition_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['competition_members']['Insert']>
      }

      boulders: {
        Row: {
          id:             string
          competition_id: string
          name:           string
          color:          string | null
          points:         number
          bonus_points:   number
          zone_points:    number
          is_active:      boolean
          sort_order:     number
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['boulders']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['boulders']['Insert']>
      }

      completions: {
        Row: {
          id:             string
          competition_id: string
          boulder_id:     string
          user_id:        string
          topped:         boolean
          zone:           boolean
          attempts:       number
          recorded_by:    string | null   // user_id of judge/admin who recorded
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['completions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['completions']['Insert']>
      }

      payments: {
        Row: {
          id:                   string
          competition_id:       string
          user_id:              string
          stripe_payment_id:    string | null
          stripe_session_id:    string | null
          amount_cents:         number
          currency:             string
          status:               string    // 'pending' | 'succeeded' | 'failed' | 'refunded'
          tier:                 string
          participant_limit:    number
          created_at:           string
          updated_at:           string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }

    Views:    Record<string, never>
    Functions: Record<string, never>
    Enums:    Record<string, never>
  }
}

// ─── CONVENIENCE ALIASES ──────────────────────────────────────────────────────

export type Profile          = Database['public']['Tables']['profiles']['Row']
export type Competition      = Database['public']['Tables']['competitions']['Row']
export type CompetitionMember = Database['public']['Tables']['competition_members']['Row']
export type Boulder          = Database['public']['Tables']['boulders']['Row']
export type Completion       = Database['public']['Tables']['completions']['Row']
export type Payment          = Database['public']['Tables']['payments']['Row']
