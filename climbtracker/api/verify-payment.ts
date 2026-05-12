import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { verifyUser, guardJsonRequest } from './_auth.js'

// ─── HANDLER ──────────────────────────────────────────────────────────────────
// Called by the client on return from Stripe Checkout.
//   1. Verify the Supabase session (so a stranger can't replay a session_id).
//   2. Verify the session was paid with Stripe.
//   3. Confirm the buyer matches the calling user.
//   4. Apply the purchase via the idempotent apply_purchase() RPC. The webhook
//      calls the same RPC; whichever fires first wins, the other one no-ops
//      thanks to the unique constraint on payments.stripe_session_id. This
//      removes a single-point-of-failure on the webhook delivery path.
//   5. Return the updated competition so the UI can patch local state.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!guardJsonRequest(req, res)) return

  const auth = await verifyUser(req)
  if ('error' in auth) return res.status(auth.status).json({ error: auth.error })
  const { user, supabase } = auth

  const { sessionId } = req.body ?? {}
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing sessionId' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Stripe not configured' })

  const stripe = new Stripe(secretKey)
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('[verify-payment] Stripe retrieval failed:', err instanceof Error ? err.message : err)
    return res.status(400).json({ error: 'Invalid or expired session' })
  }

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment not completed' })
  }

  const meta = session.metadata ?? {}
  if (meta.userId && meta.userId !== user.id) {
    return res.status(403).json({ error: 'Session does not belong to this user' })
  }

  const competitionId = meta.competitionId
  if (!competitionId) return res.status(400).json({ error: 'Missing competitionId in session' })

  const type = meta.type
  if (!type) return res.status(400).json({ error: 'Missing purchase type in session' })

  // ── Apply the purchase via the same RPC the webhook uses ─────────────────
  // The RPC is idempotent (unique constraint on stripe_session_id) so this is
  // safe to run even if the webhook already applied it — second caller gets
  // 'duplicate' and the DB state is unchanged.
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('apply_purchase', {
    p_competition_id:    competitionId,
    p_user_id:           user.id,
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
      return res.status(404).json({ error: 'Competition not found' })
    }
    if (msg.includes('invalid purchase_type')) {
      return res.status(400).json({ error: `Unknown type: ${type}` })
    }
    console.error('[verify-payment] apply_purchase failed:', msg)
    return res.status(500).json({ error: 'Failed to apply purchase' })
  }

  // Fetch the freshly-updated competition so the client can patch local state.
  const { data: compRow, error: fetchErr } = await supabase
    .from('competitions')
    .select('data')
    .eq('id', competitionId)
    .single()

  if (fetchErr || !compRow?.data) {
    return res.status(404).json({ error: 'Competition not found' })
  }

  return res.status(200).json({
    success:     true,
    applied:     rpcResult === 'applied',
    duplicate:   rpcResult === 'duplicate',
    competition: compRow.data,
  })
}
