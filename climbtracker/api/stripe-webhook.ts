import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable body parsing so we receive the raw bytes for Stripe signature verification
export const config = { api: { bodyParser: false } }

// ─── RAW BODY HELPER ──────────────────────────────────────────────────────────
function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: unknown) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
    })
    req.on('end',   () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for applying Stripe purchase outcomes.
// `verify-payment` is read-only and never mutates competition state — that
// removes the dual-write that previously double-granted bundle capacity.
//
// Idempotency: the `payments` table has a unique index on stripe_session_id.
// We attempt the insert first; if it conflicts (Stripe retry, duplicate
// delivery), we skip the state mutation entirely.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const secretKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl   = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error('[stripe-webhook] Missing env vars')
    return res.status(500).end()
  }

  const rawBody = await getRawBody(req)
  if (!rawBody.length) return res.status(400).send('Empty body')

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).send('Missing stripe-signature header')

  const stripe = new Stripe(secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    return res.status(400).send('Invalid signature')
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta    = session.metadata ?? {}
  const { type, competitionId, userId } = meta

  if (!type || !competitionId || !userId) {
    console.error('[stripe-webhook] Missing metadata in session:', session.id)
    return res.status(400).json({ error: 'Missing metadata' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // ── Idempotency gate: insert payment row first ─────────────────────────────
  // The unique index on stripe_session_id means a retry will return a conflict
  // here, and we'll know not to apply the mutation a second time.
  const { data: inserted, error: insertErr } = await supabase
    .from('payments')
    .insert({
      competition_id:    competitionId,
      user_id:           userId,
      stripe_session_id: session.id,
      stripe_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      amount_cents:      session.amount_total ?? 0,
      currency:          session.currency     ?? 'eur',
      status:            'paid',
      tier:              meta.tier ?? type,
      participant_limit: Number(meta.participantCount) || 0,
    })
    .select('id')
    .maybeSingle()

  if (insertErr) {
    // Duplicate (Stripe retry) — the row already exists; ack and skip.
    if ((insertErr as { code?: string }).code === '23505') {
      console.log('[stripe-webhook] duplicate delivery, skipping:', session.id)
      return res.status(200).json({ received: true, duplicate: true })
    }
    console.error('[stripe-webhook] payments insert failed:', insertErr.message)
    // Return 500 so Stripe retries; we have not yet mutated state.
    return res.status(500).json({ error: 'Failed to record payment' })
  }

  if (!inserted) {
    // Shouldn't happen, but treat as duplicate and ack.
    console.log('[stripe-webhook] insert returned no row, treating as duplicate')
    return res.status(200).json({ received: true })
  }

  // ── Fetch competition and apply the purchase ───────────────────────────────
  const { data: compRow, error: fetchErr } = await supabase
    .from('competitions')
    .select('data')
    .eq('id', competitionId)
    .single()

  if (fetchErr || !compRow?.data) {
    console.error('[stripe-webhook] competition fetch failed:', fetchErr?.message)
    // Roll back the payment row so the next delivery can retry the full flow.
    await supabase.from('payments').delete().eq('id', inserted.id)
    return res.status(500).json({ error: 'Competition not found' })
  }

  const comp = compRow.data as Record<string, unknown>
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
    console.error('[stripe-webhook] Unknown purchase type:', type)
    await supabase.from('payments').delete().eq('id', inserted.id)
    return res.status(400).json({ error: `Unknown type: ${type}` })
  }

  const { error: updateErr } = await supabase
    .from('competitions')
    .update({
      data:       updated,
      status:     String(updated.status     ?? comp.status     ?? 'DRAFT'),
      visibility: String(updated.visibility ?? comp.visibility ?? 'private'),
    })
    .eq('id', competitionId)

  if (updateErr) {
    console.error('[stripe-webhook] competition update failed:', updateErr.message)
    // Roll back payment row so Stripe retry can re-attempt.
    await supabase.from('payments').delete().eq('id', inserted.id)
    return res.status(500).json({ error: 'Failed to update competition' })
  }

  console.log('[stripe-webhook] applied:', { competitionId, type, sessionId: session.id })
  return res.status(200).json({ received: true })
}
