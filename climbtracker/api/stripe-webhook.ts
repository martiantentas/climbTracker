import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable body parsing so we receive the raw bytes for Stripe signature verification
export const config = { api: { bodyParser: false } }

// ─── RAW BODY HELPER ──────────────────────────────────────────────────────────
// Uses the Node.js event API instead of `for await` — more reliable on Vercel's
// Node.js runtime where the async iterator may not behave as expected.

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const secretKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl   = process.env.VITE_SUPABASE_URL
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    console.error('[stripe-webhook] Missing env vars:', {
      hasSecretKey:     !!secretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl:   !!supabaseUrl,
      hasServiceKey:    !!serviceKey,
    })
    return res.status(500).end()
  }

  const rawBody = await getRawBody(req)

  if (!rawBody.length) {
    console.error('[stripe-webhook] Empty raw body — cannot verify Stripe signature')
    return res.status(400).send('Empty body')
  }

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

    // ── Fetch current competition ──────────────────────────────────────────
    const { data: compRow, error: fetchErr } = await supabase
      .from('competitions')
      .select('data')
      .eq('id', competitionId)
      .single()

    if (fetchErr || !compRow?.data) {
      console.error('[stripe-webhook] competition fetch:', fetchErr, '| id:', competitionId)
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
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }

    // ── Update competition — keep top-level columns in sync with data blob ──
    // upsertCompetition() writes status + visibility as dedicated columns;
    // the webhook must mirror that or public/status queries return stale values.
    const { error: updateErr } = await supabase
      .from('competitions')
      .update({
        data:       updated,
        status:     String(updated.status     ?? comp.status     ?? 'DRAFT'),
        visibility: String(updated.visibility ?? comp.visibility ?? 'private'),
      })
      .eq('id', competitionId)

    if (updateErr) {
      console.error('[stripe-webhook] competition update:', updateErr)
      return res.status(500).json({ error: 'Failed to update competition' })
    }

    console.log('[stripe-webhook] competition updated:', competitionId, type)

    // ── Record the payment (non-fatal if it fails) ──────────────────────────
    const { error: paymentErr } = await supabase.from('payments').insert({
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
    if (paymentErr) console.error('[stripe-webhook] payments insert:', paymentErr)
  }

  return res.status(200).json({ received: true })
}
