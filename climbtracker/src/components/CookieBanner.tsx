import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const COOKIE_CONSENT_KEY = 'ascendr_cookie_consent'
type Consent = 'accepted' | 'rejected'
type Lang    = 'en' | 'es' | 'ca'

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const copy: Record<Lang, { title: string; body: string; accept: string; reject: string; policy: string }> = {
  en: {
    title:  'We use cookies',
    body:   'Ascendr uses Google Analytics to understand how the site is used and improve it. No advertising cookies are used.',
    accept: 'Accept',
    reject: 'Reject',
    policy: 'Privacy policy',
  },
  es: {
    title:  'Usamos cookies',
    body:   'Ascendr usa Google Analytics para entender cómo se usa el sitio y mejorarlo. No usamos cookies publicitarias.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    policy: 'Política de privacidad',
  },
  ca: {
    title:  "Usem cookies",
    body:   "Ascendr utilitza Google Analytics per entendre com s'utilitza el lloc i millorar-lo. No fem servir cookies publicitàries.",
    accept: 'Acceptar',
    reject: 'Rebutjar',
    policy: 'Política de privacitat',
  },
}

// ─── CONSENT LOGIC ────────────────────────────────────────────────────────────

function updateConsentMode(value: Consent) {
  const granted = value === 'accepted'
  // Google Consent Mode v2
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag
  if (typeof g === 'function') {
    g('consent', 'update', {
      analytics_storage:  granted ? 'granted' : 'denied',
      ad_storage:         'denied',
      ad_user_data:       'denied',
      ad_personalization: 'denied',
    })
  }
  // GTM dataLayer event (for custom triggers in GTM)
  ;(window as unknown as { dataLayer: unknown[] }).dataLayer?.push({
    event:             'cookie_consent_update',
    analytics_consent: granted ? 'granted' : 'denied',
  })
}

// Call this from any footer "Manage cookies" link to re-open the banner
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent('ascendr:show-cookie-banner'))
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()

  const lang: Lang = location.pathname.startsWith('/en') ? 'en'
                   : location.pathname.startsWith('/es') ? 'es'
                   : 'ca'
  const c = copy[lang]

  useEffect(() => {
    // Show banner only if no prior choice
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!saved) {
      setVisible(true)
    } else {
      // Re-apply the stored consent on every page load so Consent Mode is
      // always in the right state (the HTML script handles the very first
      // load; this effect covers client-side navigations and rehydration).
      updateConsentMode(saved as Consent)
    }

    const show = () => { localStorage.removeItem(COOKIE_CONSENT_KEY); setVisible(true) }
    window.addEventListener('ascendr:show-cookie-banner', show)
    return () => window.removeEventListener('ascendr:show-cookie-banner', show)
  }, [])

  function choose(value: Consent) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
    updateConsentMode(value)
    setVisible(false)
  }

  if (!visible) return null

  const F = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={c.title}
      style={{
        position: 'fixed', bottom: 24, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        padding: '0 16px', zIndex: 9999,
      }}
    >
      <div style={{
        ...F,
        background:   '#1A1D24',
        border:       '1px solid rgba(255,255,255,0.10)',
        borderRadius: 14,
        padding:      '20px 24px',
        maxWidth:     560, width: '100%',
        display:      'flex', flexDirection: 'column', gap: 14,
        boxShadow:    '0 8px 48px rgba(0,0,0,0.65)',
      }}>
        {/* Text */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#EEEEEE', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            {c.title}
          </p>
          <p style={{ fontSize: 13, color: '#8E8E8E', lineHeight: 1.65, margin: 0 }}>
            {c.body}{' '}
            <button
              onClick={() => navigate(`/${lang}/privacy`)}
              style={{ ...F, background: 'none', border: 'none', color: '#7F8BAD', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              {c.policy}
            </button>
          </p>
        </div>

        {/* Actions — Reject and Accept have identical padding/size (AEPD requirement) */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={() => choose('rejected')}
            style={{
              ...F,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: '#8E8E8E', fontSize: 13, fontWeight: 600,
              padding: '9px 22px', borderRadius: 7, cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {c.reject}
          </button>
          <button
            onClick={() => choose('accepted')}
            style={{
              ...F,
              background: '#7F8BAD', border: '1px solid #7F8BAD',
              color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '9px 22px', borderRadius: 7, cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
