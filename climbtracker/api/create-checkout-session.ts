import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

// ─── PRICING CONSTANTS ────────────────────────────────────────────────────────

const BASE_PLANS = {
  standard: { label: 'Standard', basePriceCents: 12900, baseUsers: 300, overageRateCents: 12 },
  premium:  { label: 'Premium',  basePriceCents: 20900, baseUsers: 500, overageRateCents: 10 },
} as const

// Fixed-size bundle pricing at €0.12/slot
const FIXED_BUNDLES = {
  150: { slots: 150, priceCents: 1999 },   // €19.99
  300: { slots: 300, priceCents: 3499 },   // €34.99
} as const

const UPGRADE_PRICE_CENTS  = 8000   // Standard → Premium: €80
const CUSTOM_BUNDLE_RATE   = 0.105  // €0.105 per slot (>500 only)
// Stripe requires integer cents — multiply by 100 and round
function customBundleCents(slots: number) { return Math.round(slots * CUSTOM_BUNDLE_RATE * 100) }

// ─── PRODUCT ID LOOKUP ────────────────────────────────────────────────────────

function productId(key: string): string | undefined {
  return process.env[`STRIPE_PRODUCT_${key}`]
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Stripe not configured' })

  const { type, competitionId, competitionName, userId } = req.body ?? {}

  if (!type || !competitionId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const stripe  = new Stripe(secretKey)
  const appUrl  = process.env.APP_URL ?? 'https://ascendr.top'
  const compEnc = encodeURIComponent(competitionId)

  // Build line item, metadata, and success URL based on the purchase type
  let lineItem: Stripe.Checkout.Session.CreateParams.LineItem
  let metadata: Record<string, string>
  let successUrl: string

  // ── Base plan (Standard or Premium) ───────────────────────────────────────
  if (type === 'base_plan') {
    const { tier, participantCount } = req.body
    const tierKey = tier as 'standard' | 'premium'
    const plan = BASE_PLANS[tierKey]
    if (!plan) return res.status(400).json({ error: 'Invalid tier' })

    const count      = Number(participantCount)
    const overage    = Math.max(0, count - plan.baseUsers)
    const totalCents = plan.basePriceCents + overage * plan.overageRateCents
    const prodId     = productId(tierKey.toUpperCase())

    lineItem = {
      price_data: {
        currency: 'eur',
        ...(prodId ? { product: prodId } : {
          product_data: {
            name:        `Ascendr ${plan.label} — ${competitionName ?? 'Competition'}`,
            description: `${count} participant${count !== 1 ? 's' : ''}${overage > 0 ? ` (incl. ${overage} overage)` : ''}`,
          },
        }),
        unit_amount: totalCents,
      },
      quantity: 1,
    }
    metadata   = { type, competitionId, tier: tierKey, participantCount: String(count), userId }
    successUrl = `${appUrl}/?payment_success=1&session_id={CHECKOUT_SESSION_ID}&comp_id=${compEnc}&type=base_plan&tier=${tierKey}`

  // ── Capacity bundle ────────────────────────────────────────────────────────
  } else if (type === 'bundle') {
    const { slots } = req.body
    const slotCount = Number(slots)
    if (!slotCount || slotCount < 1) return res.status(400).json({ error: 'Invalid slot count' })

    const isFixed    = slotCount === 150 || slotCount === 300
    const totalCents = isFixed
      ? FIXED_BUNDLES[slotCount as 150 | 300].priceCents
      : customBundleCents(slotCount)

    const prodKey = isFixed
      ? `BUNDLE_${slotCount}`
      : 'BUNDLE_CUSTOM'
    const prodId = productId(prodKey)

    lineItem = {
      price_data: {
        currency: 'eur',
        ...(prodId ? { product: prodId } : {
          product_data: {
            name:        `Ascendr Capacity Bundle — ${slotCount} participants`,
            description: `Adds ${slotCount} extra slots to ${competitionName ?? 'your competition'}.`,
          },
        }),
        unit_amount: totalCents,
      },
      quantity: 1,
    }
    metadata   = { type, competitionId, slots: String(slotCount), userId }
    successUrl = `${appUrl}/?payment_success=1&session_id={CHECKOUT_SESSION_ID}&comp_id=${compEnc}&type=bundle&slots=${slotCount}`

  // ── Premium upgrade (Standard → Premium) ──────────────────────────────────
  } else if (type === 'upgrade') {
    const prodId = productId('UPGRADE')

    lineItem = {
      price_data: {
        currency: 'eur',
        ...(prodId ? { product: prodId } : {
          product_data: {
            name:        `Ascendr Premium Upgrade — ${competitionName ?? 'Competition'}`,
            description: 'Upgrades your Standard competition to Premium: white-label branding, custom logo & colour scheme.',
          },
        }),
        unit_amount: UPGRADE_PRICE_CENTS,
      },
      quantity: 1,
    }
    metadata   = { type, competitionId, userId }
    successUrl = `${appUrl}/?payment_success=1&session_id={CHECKOUT_SESSION_ID}&comp_id=${compEnc}&type=upgrade`

  } else {
    return res.status(400).json({ error: `Unknown type: ${type}` })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                  'payment',
      currency:              'eur',
      line_items:            [lineItem],
      metadata,
      allow_promotion_codes: true,   // Stripe handles discount codes securely
      success_url:           successUrl,
      cancel_url:            `${appUrl}/?payment_cancelled=1`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err: unknown) {
    console.error('[stripe] create-checkout-session:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: message })
  }
}
