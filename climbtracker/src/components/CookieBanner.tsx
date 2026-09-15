import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const COOKIE_CONSENT_KEY = 'ascendr_cookie_consent'
type Consent = 'accepted' | 'rejected'

// ─── CONSENT LOGIC ────────────────────────────────────────────────────────────

function updateConsentMode(value: Consent) {
  const granted = value === 'accepted'
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag
  if (typeof g === 'function') {
    g('consent', 'update', {
      analytics_storage:  granted ? 'granted' : 'denied',
      ad_storage:         'denied',
      ad_user_data:       'denied',
      ad_personalization: 'denied',
    })
  }
  ;(window as unknown as { dataLayer: unknown[] }).dataLayer?.push({
    event:             'cookie_consent_update',
    analytics_consent: granted ? 'granted' : 'denied',
  })
}

// Call this from any "Manage cookies" link to re-open the banner
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent('ascendr:show-cookie-banner'))
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!saved) {
      setVisible(true)
    } else {
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
    <>
      {/* Full-screen overlay — blocks all interaction until user chooses */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
        }}
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
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
          padding:      '24px 28px',
          maxWidth:     600, width: '100%',
          display:      'flex', flexDirection: 'column', gap: 18,
          boxShadow:    '0 8px 48px rgba(0,0,0,0.75)',
        }}>

          {/* Title */}
          <p style={{ fontSize: 14, fontWeight: 700, color: '#EEEEEE', margin: 0, letterSpacing: '-0.01em' }}>
            We use cookies
          </p>

          {/* Body */}
          <p style={{ fontSize: 13, color: '#8E8E8E', lineHeight: 1.7, margin: 0 }}>
            Ascendr uses first- and third-party cookies to keep the site working correctly and to understand how you navigate — so we can improve what matters.
            {' '}We take your privacy seriously: we only use an encrypted unique identifier with your explicit consent.{' '}
            <button
              onClick={() => navigate('/en/privacy')}
              style={{ ...F, background: 'none', border: 'none', color: '#7F8BAD', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Privacy policy
            </button>
          </p>

          {/* Actions — equal size (AEPD compliant) */}
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
              Reject
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
              Accept
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
