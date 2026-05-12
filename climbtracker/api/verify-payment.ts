import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { verifyUser, guardJsonRequest } from './_auth'

// ─── HANDLER ──────────────────────────────────────────────────────────────────
// READ-ONLY endpoint called by the client on return from Stripe Checkout.
// It does NOT mutate competition state — that is the webhook's responsibility.
// Its job is to:
//   1. Verify the Supabase session (so a stranger can't replay a session_id).
//   2. Verify the session was paid with Stripe.
//   3. Confirm the buyer matches the calling user.
//   4. Return the latest competition row so the UI can patch local state
//      without waiting on the realtime subscription.
//
// If the webhook hasn't applied the purchase yet, we return `pending: true`
// so the client can show a brief "processing..." state and refresh.

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

  // Look up the payment row — if present, the webhook has applied the purchase.
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

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
    pending:     !payment,                // webhook hasn't run yet
    competition: compRow.data,
  })
}
