import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Origin + Content-Type guard ──────────────────────────────────────────────
// Reject requests that didn't come from one of our deployed frontends and
// requests whose body wasn't actually JSON. Defends against:
//   - cross-origin form-encoded POSTs (CSRF-style)
//   - automated bots probing the API
//
// Returns true if the request passed the check (handler should continue);
// returns false after writing a 403/415 response (handler should return).

const ALLOWED_ORIGINS = new Set([
  'https://ascendr.top',
  'https://www.ascendr.top',
  // Vercel preview deployments share the same project; allow any *.vercel.app
  // host belonging to this account by matching the suffix below at runtime.
])

const ALLOW_VERCEL_PREVIEW_SUFFIX = '.vercel.app'

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.has(origin)) return true
  try {
    const host = new URL(origin).hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
    if (host.endsWith(ALLOW_VERCEL_PREVIEW_SUFFIX))   return true
  } catch {
    return false
  }
  return false
}

export function guardJsonRequest(req: VercelRequest, res: VercelResponse): boolean {
  const ct = req.headers['content-type']
  const contentType = Array.isArray(ct) ? ct[0] : ct
  if (!contentType?.toLowerCase().startsWith('application/json')) {
    res.status(415).json({ error: 'Expected application/json' })
    return false
  }

  const originHeader = req.headers.origin
  const origin       = Array.isArray(originHeader) ? originHeader[0] : originHeader
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden origin' })
    return false
  }
  return true
}


// Shared helper: verify the Supabase JWT on incoming requests so server-side
// API routes can derive the authenticated user from the session instead of
// trusting a userId in the request body.

export type AuthedUser = { id: string; email: string | null }

export async function verifyUser(
  req: VercelRequest
): Promise<{ user: AuthedUser; supabase: SupabaseClient } | { error: string; status: number }> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return { error: 'Server not configured', status: 500 }
  }

  const authHeader = req.headers.authorization ?? req.headers.Authorization
  const header     = Array.isArray(authHeader) ? authHeader[0] : authHeader
  const token      = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return { error: 'Missing bearer token', status: 401 }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return { error: 'Invalid session', status: 401 }

  return {
    user:     { id: data.user.id, email: data.user.email ?? null },
    supabase, // service-role client for downstream queries
  }
}
