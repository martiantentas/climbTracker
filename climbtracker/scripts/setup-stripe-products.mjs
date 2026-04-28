/**
 * One-time script: creates all Ascendr products in Stripe and prints the IDs.
 * Run once: node scripts/setup-stripe-products.mjs
 *
 * Requires STRIPE_SECRET_KEY in your environment or .env.local.
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env.local ──────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.local')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const [k, ...rest] = line.split('=')
    if (k && !k.startsWith('#') && rest.length) {
      process.env[k.trim()] = rest.join('=').trim()
    }
  }
} catch {
  // .env.local not found — rely on shell environment
}

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  console.error('❌  STRIPE_SECRET_KEY not set. Add it to .env.local or your environment.')
  process.exit(1)
}

// ── Stripe API helper ─────────────────────────────────────────────────────────

async function stripe(method, path, body) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message ?? JSON.stringify(json))
  return json
}

// ── Archive stale products (old 50/100 bundles) ───────────────────────────────

async function archiveIfExists(productId, label) {
  if (!productId) return
  try {
    await stripe('POST', `products/${productId}`, { active: 'false' })
    console.log(`🗃   Archived old product (${label}): ${productId}`)
  } catch (e) {
    console.log(`⚠️   Could not archive ${productId}: ${e.message}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Archive the incorrectly-sized old bundles if they exist in env
  await archiveIfExists(process.env.STRIPE_PRODUCT_BUNDLE_50,  'bundle_50')
  await archiveIfExists(process.env.STRIPE_PRODUCT_BUNDLE_100, 'bundle_100')

  console.log('\nCreating Ascendr Stripe products…\n')

  // ── Base plans ─────────────────────────────────────────────────────────────

  const standard = await stripe('POST', 'products', {
    name:             'Ascendr Standard',
    description:      'One-time plan per event — up to 300 participants included. €0.12 per extra participant.',
    'metadata[type]': 'base_plan',
    'metadata[tier]': 'standard',
  })
  console.log('✅  Standard plan:          ', standard.id)

  const premium = await stripe('POST', 'products', {
    name:             'Ascendr Premium',
    description:      'One-time plan per event with white-label branding — up to 500 participants included. €0.10 per extra participant.',
    'metadata[type]': 'base_plan',
    'metadata[tier]': 'premium',
  })
  console.log('✅  Premium plan:           ', premium.id)

  // ── Capacity bundles ───────────────────────────────────────────────────────

  const bundle150 = await stripe('POST', 'products', {
    name:             'Ascendr Capacity Bundle — 150 participants',
    description:      'Add 150 extra participant slots to any active competition.',
    'metadata[type]': 'capacity_bundle',
    'metadata[slots]': '150',
  })
  console.log('✅  Bundle 150 users:       ', bundle150.id)

  const bundle300 = await stripe('POST', 'products', {
    name:             'Ascendr Capacity Bundle — 300 participants',
    description:      'Add 300 extra participant slots to any active competition. Best value.',
    'metadata[type]': 'capacity_bundle',
    'metadata[slots]': '300',
  })
  console.log('✅  Bundle 300 users:       ', bundle300.id)

  // Custom bundle >500 — dynamic amount chosen by the organiser.
  // No fixed price; the checkout session computes the total at €0.12/user.
  const bundleCustom = await stripe('POST', 'products', {
    name:             'Ascendr Capacity Bundle — Custom',
    description:      'Add a custom number of extra participant slots (500+) to any active competition. Billed at €0.12 per slot.',
    'metadata[type]': 'capacity_bundle',
    'metadata[slots]': 'custom',
  })
  console.log('✅  Bundle custom (>500):   ', bundleCustom.id)

  // ── Premium upgrade ────────────────────────────────────────────────────────

  const upgrade = await stripe('POST', 'products', {
    name:             'Ascendr Premium Upgrade',
    description:      'Upgrade an existing Standard competition to Premium — unlocks white-label branding, custom logo & colour scheme.',
    'metadata[type]': 'upgrade',
    'metadata[from]': 'standard',
    'metadata[to]':   'premium',
  })
  console.log('✅  Premium upgrade:        ', upgrade.id)

  console.log(`
────────────────────────────────────────────────────────────────────────
Add ALL of these to Vercel → Settings → Environment Variables
AND to .env.local for local dev:

STRIPE_PRODUCT_STANDARD=${standard.id}
STRIPE_PRODUCT_PREMIUM=${premium.id}
STRIPE_PRODUCT_BUNDLE_150=${bundle150.id}
STRIPE_PRODUCT_BUNDLE_300=${bundle300.id}
STRIPE_PRODUCT_BUNDLE_CUSTOM=${bundleCustom.id}
STRIPE_PRODUCT_UPGRADE=${upgrade.id}
────────────────────────────────────────────────────────────────────────

If not already done, also add to Vercel:
  STRIPE_SECRET_KEY          sk_live_...
  STRIPE_WEBHOOK_SECRET      whsec_...  (Stripe → Webhooks → signing secret)
  SUPABASE_SERVICE_ROLE_KEY             (Supabase → Settings → API → service_role)
  APP_URL                    https://ascendr.top
`)
}

main().catch(err => { console.error('❌ ', err.message); process.exit(1) })
