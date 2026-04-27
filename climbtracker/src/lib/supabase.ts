import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set — running in offline/mock mode')
}

export const supabase = createClient<Database>(
  supabaseUrl  ?? 'http://localhost:54321',
  supabaseAnon ?? 'anon-placeholder',
  {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,  // Let Supabase auto-exchange the PKCE code on callback
      flowType:           'pkce', // Explicit PKCE — required for state validation to work
    },
  }
)
