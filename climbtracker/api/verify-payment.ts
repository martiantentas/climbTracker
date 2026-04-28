import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// ─── HANDLER ──────────────────────────────────────────────────────────────────
// Called by the frontend immediately after returning from Stripe Checkout.
// Verifies the session with Stripe, then updates the competition in Supabase.
// This is more reliable than a webhook because:
//   - No raw body / signature issues
//   - Errors surface immediately to the user (not silently in logs)
//   - No separate webhook registration required in Stripe Dashboard

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { sessionId } = req.body ?? {}
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing sessionId' })
  }

  const secretKey   = process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey || !supabaseUrl || !serviceKey) {
    console.error('[verify-payment] Missing env vars:', {
      hasSecretKey:   !!secretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey:  !!serviceKey,
    })
    return res.status(500).json({ error: 'Server not configured' })
  }

  // ── Verify the session with Stripe ────────────────────────────────────────
  const stripe = new Stripe(secretKey)
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[verify-payment] Stripe session retrieval failed:', err)
    return res.status(400).json({ error: 'Invalid or expired session' })
  }

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment not completed' })
  }

  const meta = session.metadata ?? {}
  const { type, competitionId, userId } = meta

  if (!type || !competitionId || !userId) {
    return res.status(400).json({ error: 'Missing payment metadata' })
  }

  // ── Fetch the competition from Supabase ───────────────────────────────────
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: compRow, error: fetchErr } = await supabase
    .from('competitions')
    .select('data')
    .eq('id', competitionId)
    .single()

  if (fetchErr || !compRow?.data) {
    console.error('[verify-payment] competition fetch failed:', fetchErr, '| id:', competitionId)
    return res.status(404).json({ error: 'Competition not found' })
  }

  const comp = compRow.data as Record<string, unknown>

  // ── Build the updated competition object ──────────────────────────────────
  let updated: Record<string, unknown>

  if (type === 'base_plan') {
    const { tier, participantCount } = meta
    const baseLimit = tier === 'premium' ? 500 : 300
    updated = {
      ...comp,
      status:           'LIVE',
      subscription:     tier,
      tier,
      participantLimit: Number(participantCount) || baseLimit,
    }

  } else if (type === 'bundle') {
    const addedSlots       = Number(meta.slots ?? 0)
    const existingCapacity = Number(comp.additionalCapacity ?? 0)
    updated = {
      ...comp,
      additionalCapacity: existingCapacity + addedSlots,
    }

  } else if (type === 'upgrade') {
    updated = {
      ...comp,
      subscription: 'premium',
      tier:         'premium',
    }

  } else {
    return res.status(400).json({ error: `Unknown type: ${type}` })
  }

  // ── Persist to Supabase — update both data blob AND top-level columns ─────
  // upsertCompetition() in the frontend writes status + visibility as dedicated
  // columns alongside the JSON blob. We must mirror that here or queries that
  // filter on those columns (e.g. public-competition discovery) return stale data.
  const { error: updateErr } = await supabase
    .from('competitions')
    .update({
      data:       updated,
      status:     String(updated.status     ?? comp.status     ?? 'DRAFT'),
      visibility: String(updated.visibility ?? comp.visibility ?? 'private'),
    })
    .eq('id', competitionId)

  if (updateErr) {
    console.error('[verify-payment] competition update failed:', updateErr)
    return res.status(500).json({ error: 'Failed to update competition' })
  }

  console.log('[verify-payment] competition updated:', competitionId, type)

  // Return the updated competition so the frontend can patch local state
  // immediately without waiting for the real-time subscription.
  return res.status(200).json({ success: true, competition: updated })
}
