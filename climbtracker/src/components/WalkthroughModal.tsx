import { useState, useEffect } from 'react'
import { Trophy, Target, BarChart2, Settings, Mountain, Zap, X } from 'lucide-react'
import { translations, type Language } from '../translations'

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

const LOGIN_KEY    = 'ascendr_walkthrough_login_seen'
const PURCHASE_KEY = 'ascendr_walkthrough_purchase_seen'

export function markWalkthroughSeen(variant: 'login' | 'purchase') {
  try { localStorage.setItem(variant === 'login' ? LOGIN_KEY : PURCHASE_KEY, '1') } catch { /* ignore */ }
}

export function shouldShowWalkthrough(variant: 'login' | 'purchase'): boolean {
  try { return !localStorage.getItem(variant === 'login' ? LOGIN_KEY : PURCHASE_KEY) } catch { return false }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface WalkthroughModalProps {
  variant:   'login' | 'purchase'
  theme:     'light' | 'dark'
  lang:      Language
  onDismiss: () => void
}

interface Anchor { top: number; left: number; width: number; height: number }

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function WalkthroughModal({ variant, theme, lang, onDismiss }: WalkthroughModalProps) {
  const [step,   setStep]   = useState(0)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const t    = translations[lang]
  const isDark = theme === 'dark'

  const loginSteps = [
    { targetId: 'competitions', Icon: Trophy,    title: t.walkthroughLoginStep1Title, desc: t.walkthroughLoginStep1Desc },
    { targetId: 'boulders',     Icon: Target,    title: t.walkthroughLoginStep2Title, desc: t.walkthroughLoginStep2Desc },
    { targetId: 'leaderboard',  Icon: BarChart2, title: t.walkthroughLoginStep3Title, desc: t.walkthroughLoginStep3Desc },
  ]
  const purchaseSteps = [
    { targetId: 'settings',     Icon: Settings,  title: t.walkthroughPurchaseStep1Title, desc: t.walkthroughPurchaseStep1Desc },
    { targetId: 'boulders',     Icon: Mountain,  title: t.walkthroughPurchaseStep2Title, desc: t.walkthroughPurchaseStep2Desc },
    { targetId: 'competitions', Icon: Zap,       title: t.walkthroughPurchaseStep3Title, desc: t.walkthroughPurchaseStep3Desc },
  ]

  const steps   = variant === 'login' ? loginSteps : purchaseSteps
  const current = steps[step]
  const isLast  = step === steps.length - 1

  // Find anchor element position on every step change
  useEffect(() => {
    function measure() {
      const el = document.querySelector<HTMLElement>(`[data-walkthrough="${current.targetId}"]`)
      if (!el) { setAnchor(null); return }
      const r = el.getBoundingClientRect()
      setAnchor({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step, current.targetId])

  function dismiss() { markWalkthroughSeen(variant); onDismiss() }
  function next()    { if (isLast) { dismiss() } else { setStep(s => s + 1) } }

  const accent = '#7F8BAD'
  const bg     = isDark ? '#1A1D24' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#EEEEEE'
  const titleC = isDark ? '#EEEEEE' : '#121212'
  const descC  = isDark ? '#8E8E8E' : '#666666'
  const F      = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }

  // Tooltip position: below the anchor, centered horizontally, clamped to viewport
  const TOOLTIP_W  = 320
  const TOOLTIP_GAP = 14
  let tooltipLeft = 16
  let tooltipTop  = 120 // fallback if no anchor (centered-ish)
  let showArrow   = false

  if (anchor) {
    tooltipTop  = anchor.top + anchor.height + TOOLTIP_GAP
    tooltipLeft = anchor.left + anchor.width / 2 - TOOLTIP_W / 2
    // Clamp within viewport
    tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 12))
    showArrow = true
  }

  // Arrow horizontal position relative to tooltip card
  const arrowLeft = anchor
    ? (anchor.left + anchor.width / 2) - tooltipLeft
    : TOOLTIP_W / 2

  return (
    <>
      {/* Light blur overlay — blocks clicks but stays subtle */}
      <div
        aria-hidden="true"
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 9000,
        }}
      />

      {/* Highlight ring over the target element */}
      {anchor && (
        <div
          aria-hidden="true"
          style={{
            position:     'fixed',
            top:          anchor.top    - 4,
            left:         anchor.left   - 4,
            width:        anchor.width  + 8,
            height:       anchor.height + 8,
            borderRadius: 10,
            boxShadow:    `0 0 0 2px ${accent}, 0 0 0 5px rgba(127,139,173,0.25)`,
            zIndex:       9001,
            pointerEvents: 'none',
            animation:    'ascendr-pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          ...F,
          position:  'fixed',
          top:       tooltipTop,
          left:      tooltipLeft,
          width:     TOOLTIP_W,
          zIndex:    9002,
          background:   bg,
          border:       `1px solid ${border}`,
          borderRadius: 14,
          boxShadow:    '0 8px 40px rgba(0,0,0,0.4)',
          padding:      '20px 20px 16px',
          display:      'flex',
          flexDirection:'column',
          gap:          14,
        }}
      >
        {/* Arrow pointing up to the nav item */}
        {showArrow && (
          <div style={{
            position: 'absolute',
            top:      -7,
            left:     Math.max(12, Math.min(arrowLeft - 7, TOOLTIP_W - 26)),
            width:    14, height: 14,
            background:   bg,
            border:       `1px solid ${border}`,
            borderBottom: 'none',
            borderRight:  'none',
            transform:    'rotate(45deg)',
            borderRadius: '2px 0 0 0',
          }} />
        )}

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: isDark ? 'rgba(127,139,173,0.15)' : 'rgba(127,139,173,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <current.Icon size={16} color={accent} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: titleC, letterSpacing: '-0.01em' }}>
              {current.title}
            </p>
          </div>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: descC, padding: 2, lineHeight: 1 }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 13, color: descC, lineHeight: 1.65 }}>
          {current.desc}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width:  i === step ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === step ? accent : (isDark ? 'rgba(255,255,255,0.15)' : '#DDDDDD'),
                transition: 'width 200ms ease',
              }} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={dismiss}
              style={{ ...F, background: 'none', border: 'none', cursor: 'pointer', color: descC, fontSize: 12, fontWeight: 500, padding: '6px 0' }}
            >
              {t.walkthroughSkip}
            </button>
            <button
              onClick={next}
              style={{ ...F, background: accent, border: `1px solid ${accent}`, color: '#fff', fontSize: 12, fontWeight: 600, padding: '7px 18px', borderRadius: 7, cursor: 'pointer' }}
            >
              {isLast ? t.walkthroughDone : t.walkthroughNext}
            </button>
          </div>
        </div>
      </div>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes ascendr-pulse {
          0%, 100% { box-shadow: 0 0 0 2px ${accent}, 0 0 0 5px rgba(127,139,173,0.25); }
          50%       { box-shadow: 0 0 0 2px ${accent}, 0 0 0 8px rgba(127,139,173,0.10); }
        }
      `}</style>
    </>
  )
}
