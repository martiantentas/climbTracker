import { supabase } from './supabase'
import type { Competitor } from '../types'

// ─── REDIRECT URL ─────────────────────────────────────────────────────────────

const REDIRECT_URL = import.meta.env.DEV
  ? 'http://localhost:5173'
  : 'https://ascendr.top'

// ─── USER MAPPING ─────────────────────────────────────────────────────────────
// Maps a Supabase user + profiles row into the app's Competitor shape.

export function supabaseUserToCompetitor(
  user: { id: string; email?: string; user_metadata?: Record<string, string> },
  profile: Record<string, unknown> | null,
): Competitor {
  const meta        = user.user_metadata ?? {}
  const displayName = (profile?.display_name as string | null)
    ?? (meta.full_name as string | null)
    ?? (meta.name as string | null)
    ?? user.email
    ?? ''
  const parts     = displayName.trim().split(' ')
  const firstName = (meta.given_name  as string | null) ?? parts[0]  ?? ''
  const lastName  = (meta.family_name as string | null) ?? parts.slice(1).join(' ') ?? ''

  return {
    id:          user.id,
    email:       user.email ?? '',
    firstName,
    lastName,
    displayName,
    avatar:      (profile?.avatar_url as string | null) ?? (meta.avatar_url as string | null) ?? undefined,
    emoji:       (profile?.emoji as string | null) ?? undefined,
    gender:      '',
    categoryId:  '',
    traitIds:    (profile?.trait_ids as string[] | null) ?? [],
    bibNumber:   0,
    role:        'competitor',
  } as unknown as Competitor
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertProfile(
  userId: string,
  updates: Partial<{
    display_name: string
    avatar_url:   string
    emoji:        string
    lang:         string
    theme:        string
    location:     string
    bio:          string
    trait_ids:    string[]
  }>,
) {
  return supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
}

// ─── AUTH METHODS ─────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: displayName, display_name: displayName },
    },
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  { redirectTo: REDIRECT_URL },
  })
}

export async function signOutUser() {
  return supabase.auth.signOut()
}
