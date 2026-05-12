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
    console.error('[stripe-webhook] Missing metadata in session:', session.id.slice(0, 12))
    return res.status(400).json({ error: 'Missing metadata' })
  }

  // Short, low-entropy log prefix so logs aren't a leak vector for enumeration.
  const compTag = competitionId.slice(0, 8)

  const supabase = createClient(supabaseUrl, serviceKey)

  // ── Apply the purchase atomically via RPC ─────────────────────────────────
  // The RPC handles idempotency (unique constraint on stripe_session_id) and
  // the payment insert + competition update run inside a single transaction.
  const { data: result, error: rpcErr } = await supabase.rpc('apply_purchase', {
    p_competition_id:    competitionId,
    p_user_id:           userId,
    p_session_id:        session.id,
    p_payment_intent:    typeof session.payment_intent === 'string' ? session.payment_intent : null,
    p_amount_cents:      session.amount_total ?? 0,
    p_currency:          session.currency     ?? 'eur',
    p_purchase_type:     type,
    p_tier:              meta.tier ?? null,
    p_participant_count: Number(meta.participantCount) || 0,
    p_slots:             Number(meta.slots) || 0,
  })

  if (rpcErr) {
    const msg = rpcErr.message ?? ''
    if (msg.includes('competition_not_found')) {
      console.error('[stripe-webhook] competition not found:', compTag)
      // 200 + no retry: the competition was deleted; retrying won't help.
      return res.status(200).json({ received: true, error: 'competition_not_found' })
    }
    if (msg.includes('invalid purchase_type')) {
      console.error('[stripe-webhook] invalid type:', type)
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }
    console.error('[stripe-webhook] apply_purchase failed:', {
      message: rpcErr.message,
      code:    (rpcErr as { code?: string }).code,
      details: (rpcErr as { details?: string }).details,
      hint:    (rpcErr as { hint?: string }).hint,
      comp:    compTag,
      type,
    })
    return res.status(500).json({ error: 'Failed to apply purchase', detail: rpcErr.message })
  }

  console.log('[stripe-webhook]', result, '|', { comp: compTag, type, sid: session.id.slice(0, 12) })
  return res.status(200).json({ received: true, result })
}
