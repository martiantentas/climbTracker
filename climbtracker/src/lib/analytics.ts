type EventParams = Record<string, unknown>

function pushToDataLayer(message: EventParams) {
  const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer
  if (Array.isArray(dl)) dl.push(message)
}

// ─── GA4 (existing) ───────────────────────────────────────────────────────────
// Plain events for Google Tag Manager. Consent is enforced by GTM (Consent Mode).

export function trackEvent(name: string, params: EventParams = {}) {
  pushToDataLayer({ event: name, ...params })
}

// ─── AMPLITUDE ────────────────────────────────────────────────────────────────
// The app never talks to Amplitude. It leaves three kinds of messages in the
// dataLayer and the "Amplitude - Dispatcher" tag in GTM forwards them (see
// docs/amplitude/amplitude-guide.md, section 3).
//
// The data goes in ONE JSON string (amp_payload), never as nested objects.
// GTM merges objects pushed to the dataLayer and keeps old values, so event
// properties (and insert ids) would leak from one event into the next. A
// string is replaced whole every time.
//
// Nothing is sent without stored consent. GTM checks consent too, but this is
// a second barrier: if a tag is ever misconfigured, no message leaves the app.

// Same key the cookie banner writes and index.html reads.
export const COOKIE_CONSENT_KEY = 'ascendr_cookie_consent'

export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted' } catch { return false }
}

// Properties added to every event (language, competition and role).
let context: EventParams = {}

export function setAnalyticsContext(ctx: { language?: string; competitionId?: string; competitionRole?: string | null }) {
  context = clean({
    // Not 'language': the SDK already sends the browser language under that name (ca-ES).
    // This one is the language of the app interface (ca, es, en).
    'app language':     ctx.language,
    'competition id':   ctx.competitionId || undefined,
    'competition role': ctx.competitionRole || undefined,
  })
}

// Amplitude drops nothing silently: undefined values would arrive as null.
function clean(obj: EventParams): EventParams {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))
}

// Event names and property names follow docs/amplitude/ascendr-tracking-plan.xlsx:
// event names in Title Case, property names in lowercase with spaces.
// Never pass an email, a name, a phone number or free text.
export function track(name: string, props: EventParams = {}, opts: { insertId?: string } = {}) {
  if (!hasAnalyticsConsent()) return
  pushToDataLayer({
    event:       'amplitude_event',
    amp_payload: JSON.stringify({
      name,
      props: { ...context, ...clean(props) },
      ...(opts.insertId ? { insertId: opts.insertId } : {}),
    }),
  })
}

// The last identity is kept in memory so it can be sent again the moment the
// person accepts cookies. Before that it was blocked, and GTM does not replay
// messages it blocked.
let lastIdentity: { userId: string; props: EventParams } | null = null

function sendIdentity() {
  if (!lastIdentity || !hasAnalyticsConsent()) return
  pushToDataLayer({
    event:       'amplitude_identify',
    amp_payload: JSON.stringify({ userId: lastIdentity.userId, props: lastIdentity.props }),
  })
}

// Call on every load with a session (also when a saved session is restored),
// so profile properties of existing users fill in.
export function identify(userId: string, props: EventParams = {}) {
  lastIdentity = { userId, props: clean(props) }
  sendIdentity()
}

// Called by the cookie banner right after the person accepts.
export function resendIdentity() {
  sendIdentity()
}

// Call on logout. Without it the next person on the same browser inherits the identity.
export function resetIdentity() {
  lastIdentity = null
  if (hasAnalyticsConsent()) pushToDataLayer({ event: 'amplitude_reset' })
}

// ─── LOGIN vs RESTORED SESSION ────────────────────────────────────────────────
// "Logged In" means the person actively signed in, not that a saved session was
// restored on page load. The auth page leaves a short-lived flag before it
// signs in (it survives the Google redirect because it lives in sessionStorage).

const INTENT_KEY    = 'ascendr_login_intent'
const INTENT_MAX_MS = 10 * 60_000

// Only stored with consent: the flag exists solely for analytics, so writing it
// to the device without consent would itself need consent.
export function markLoginIntent() {
  if (!hasAnalyticsConsent()) return
  try { sessionStorage.setItem(INTENT_KEY, String(Date.now())) } catch { /* storage blocked */ }
}

export function clearLoginIntent() {
  try { sessionStorage.removeItem(INTENT_KEY) } catch { /* storage blocked */ }
}

// True once, if the flag exists and is recent. Always removes it.
export function consumeLoginIntent(now = Date.now()): boolean {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    sessionStorage.removeItem(INTENT_KEY)
    const at = Number(raw)
    return !!raw && Number.isFinite(at) && now - at >= 0 && now - at <= INTENT_MAX_MS
  } catch { return false }
}

// First sign-in ever: the last sign-in is recent and happened within 2 minutes of
// the moment the account became usable (created, or its email was confirmed).
// A person who confirms the email and signs in manually much later counts as
// "Logged In", not "Signed Up".
export function isFirstSignIn(
  user: { created_at?: string; email_confirmed_at?: string; last_sign_in_at?: string },
  now = Date.now(),
): boolean {
  const last = Date.parse(user.last_sign_in_at ?? '')
  if (!Number.isFinite(last) || now - last > INTENT_MAX_MS) return false
  const usable = Math.max(Date.parse(user.created_at ?? '') || 0, Date.parse(user.email_confirmed_at ?? '') || 0)
  return usable > 0 && Math.abs(last - usable) <= 2 * 60_000
}
