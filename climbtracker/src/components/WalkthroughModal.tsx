import { useState } from 'react'
import { X, Trophy, Target, BarChart2, Settings, Mountain, Zap } from 'lucide-react'
import { translations, type Language } from '../translations'

interface WalkthroughModalProps {
  variant: 'login' | 'purchase'
  theme:   'light' | 'dark'
  lang:    Language
  onDismiss: () => void
}

const LOGIN_KEY    = 'ascendr_walkthrough_login_seen'
const PURCHASE_KEY = 'ascendr_walkthrough_purchase_seen'

export function markWalkthroughSeen(variant: 'login' | 'purchase') {
  try { localStorage.setItem(variant === 'login' ? LOGIN_KEY : PURCHASE_KEY, '1') } catch { /* ignore */ }
}

export function shouldShowWalkthrough(variant: 'login' | 'purchase'): boolean {
  try { return !localStorage.getItem(variant === 'login' ? LOGIN_KEY : PURCHASE_KEY) } catch { return false }
}

export default function WalkthroughModal({ variant, theme, lang, onDismiss }: WalkthroughModalProps) {
  const [step, setStep] = useState(0)
  const t = translations[lang]
  const isDark = theme === 'dark'

  const loginSteps = [
    { Icon: Trophy,   title: t.walkthroughLoginStep1Title, desc: t.walkthroughLoginStep1Desc },
    { Icon: Target,   title: t.walkthroughLoginStep2Title, desc: t.walkthroughLoginStep2Desc },
    { Icon: BarChart2,title: t.walkthroughLoginStep3Title, desc: t.walkthroughLoginStep3Desc },
  ]
  const purchaseSteps = [
    { Icon: Settings, title: t.walkthroughPurchaseStep1Title, desc: t.walkthroughPurchaseStep1Desc },
    { Icon: Mountain, title: t.walkthroughPurchaseStep2Title, desc: t.walkthroughPurchaseStep2Desc },
    { Icon: Zap,      title: t.walkthroughPurchaseStep3Title, desc: t.walkthroughPurchaseStep3Desc },
  ]

  const steps   = variant === 'login' ? loginSteps : purchaseSteps
  const current = steps[step]
  const isLast  = step === steps.length - 1

  function dismiss() {
    markWalkthroughSeen(variant)
    onDismiss()
  }

  function next() {
    if (isLast) { dismiss() } else { setStep(s => s + 1) }
  }

  // Colors
  const bg      = isDark ? '#1A1D24' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.10)' : '#EEEEEE'
  const titleC  = isDark ? '#EEEEEE' : '#121212'
  const descC   = isDark ? '#8E8E8E' : '#666666'
  const accent  = '#7F8BAD'
  const F       = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 9000,
        }}
        onClick={dismiss}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          zIndex: 9001,
          pointerEvents: 'none',
        }}
      >
        <div style={{
          ...F,
          background:    bg,
          border:        `1px solid ${border}`,
          borderRadius:  16,
          padding:       '32px 28px 24px',
          width:         '100%',
          maxWidth:      440,
          display:       'flex',
          flexDirection: 'column',
          gap:           24,
          boxShadow:     '0 16px 64px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
          position:      'relative',
        }}>

          {/* Close */}
          <button
            onClick={dismiss}
            style={{
              ...F,
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              color: descC, padding: 4, lineHeight: 1,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: isDark ? 'rgba(127,139,173,0.12)' : 'rgba(127,139,173,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <current.Icon size={24} color={accent} />
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: titleC, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {current.title}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: descC, lineHeight: 1.7 }}>
              {current.desc}
            </p>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? accent : (isDark ? 'rgba(255,255,255,0.15)' : '#DDDDDD'),
                  transition: 'width 200ms ease',
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={dismiss}
              style={{
                ...F,
                background: 'none', border: 'none', cursor: 'pointer',
                color: descC, fontSize: 13, fontWeight: 500, padding: '8px 0',
              }}
            >
              {t.walkthroughSkip}
            </button>
            <button
              onClick={next}
              style={{
                ...F,
                background: accent, border: `1px solid ${accent}`,
                color: '#fff', fontSize: 13, fontWeight: 600,
                padding: '9px 24px', borderRadius: 8, cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              {isLast ? t.walkthroughDone : t.walkthroughNext}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
