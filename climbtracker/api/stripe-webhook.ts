import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable body parsing so we receive the raw bytes for Stripe signature verification
export const config = { api: { bodyParser: false } }

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const secretKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl   = process.env.VITE_SUPABASE_URL
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error('[stripe-webhook] Missing env vars')
    return res.status(500).end()
  }

  // Buffer the raw request body (required for Stripe signature verification)
  const chunks: Buffer[] = []
  for await (const chunk of req as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const rawBody = Buffer.concat(chunks)

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).send('Missing stripe-signature header')

  const stripe = new Stripe(secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return res.status(400).send(`Webhook error: ${err instanceof Error ? err.message : err}`)
  }

  // ── Handle checkout.session.completed ─────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta    = session.metadata ?? {}
    const { type, competitionId, userId } = meta

    if (!type || !competitionId || !userId) {
      console.error('[stripe-webhook] Missing metadata in session:', session.id)
      return res.status(400).json({ error: 'Missing metadata' })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Record the payment (shared for all purchase types)
    const { error: paymentErr } = await supabase.from('payments').insert({
      competition_id:    competitionId,
      user_id:           userId,
      stripe_session_id: session.id,
      stripe_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      amount_cents:      session.amount_total,
      currency:          session.currency,
      status:            'paid',
      tier:              meta.tier ?? type,
    })
    if (paymentErr) console.error('[stripe-webhook] payments insert:', paymentErr)

    // Fetch current competition
    const { data: compRow, error: fetchErr } = await supabase
      .from('competitions')
      .select('data')
      .eq('id', competitionId)
      .single()

    if (fetchErr || !compRow?.data) {
      console.error('[stripe-webhook] competition fetch:', fetchErr)
      return res.status(500).json({ error: 'Competition not found' })
    }

    const comp = compRow.data as Record<string, unknown>
    let updated: Record<string, unknown>

    if (type === 'base_plan') {
      // Activate the competition and set tier + participant limit
      const { tier, participantCount } = meta
      updated = {
        ...comp,
        status:           'LIVE',
        subscription:     tier,
        tier,
        participantLimit: Number(participantCount ?? 0) || undefined,
      }

    } else if (type === 'bundle') {
      // Add purchased slots on top of any existing additional capacity
      const addedSlots        = Number(meta.slots ?? 0)
      const existingCapacity  = Number(comp.additionalCapacity ?? 0)
      updated = {
        ...comp,
        additionalCapacity: existingCapacity + addedSlots,
      }

    } else if (type === 'upgrade') {
      // Upgrade tier to premium (keep existing participant limit)
      updated = {
        ...comp,
        subscription: 'premium',
        tier:         'premium',
      }

    } else {
      console.error('[stripe-webhook] Unknown purchase type:', type)
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }

    const { error: updateErr } = await supabase
      .from('competitions')
      .update({ data: updated })
      .eq('id', competitionId)

    if (updateErr) console.error('[stripe-webhook] competition update:', updateErr)
  }

  return res.status(200).json({ received: true })
}
