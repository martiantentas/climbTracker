import { useState } from 'react'
import { X, Check, Tag, CreditCard, Lock, Zap } from 'lucide-react'
import type { Competition } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  competition: Competition
  onClose:     () => void
  onSuccess:   (comp: Competition) => void  // called with the updated (live) competition
  theme:       'light' | 'dark'
}

type Plan = 'one_shot' | 'pro' | 'platinum'

const PLANS: { id: Plan; name: string; price: string; sub: string; desc: string; features: string[] }[] = [
  {
    id: 'one_shot', name: 'One-Shot', price: '$99.99', sub: '/event',
    desc: 'Perfect for a single event.',
    features: ['Up to 150 competitors', 'Live leaderboard', 'Analytics', 'Export results'],
  },
  {
    id: 'pro', name: 'Pro', price: '$14.99', sub: '/mo',
    desc: 'Best for active organizers.',
    features: ['500 competitors/year', 'Advanced analytics', 'Judge management', 'Priority support'],
  },
  {
    id: 'platinum', name: 'Platinum', price: '$19.99', sub: '/mo',
    desc: 'For circuits and series.',
    features: ['1000 competitors/year', 'All Pro features', 'White-label', 'API access'],
  },
]

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

export default function PaymentModal({ competition, onClose, onSuccess, theme }: PaymentModalProps) {
  const dk = theme === 'dark'

  const [step,       setStep]       = useState<'plan' | 'payment' | 'promo'>('plan')
  const [plan,       setPlan]       = useState<Plan>('one_shot')
  const [promoCode,  setPromoCode]  = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoValid, setPromoValid] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [cardNum,    setCardNum]    = useState('')
  const [cardExp,    setCardExp]    = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [cardName,   setCardName]   = useState('')

  const bg     = '#121212'
  const border = 'rgba(255,255,255,0.08)'

  function applyPromo() {
    // Promo codes managed by admin — for now any 6+ char code works as demo
    if (promoCode.trim().length >= 6) {
      setPromoValid(true)
      setPromoError('')
    } else {
      setPromoError('Invalid promo code.')
    }
  }

  function handlePublish() {
    setLoading(true)
    setTimeout(() => {
      const updated: Competition = { ...competition, status: 'LIVE' as any, subscription: plan } as any
      onSuccess(updated)
    }, 1200)
  }

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExp(val: string) {
    return val.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
  }

  const selected = PLANS.find(p => p.id === plan)!

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300..900&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Zap size={16} color="#38bdf8" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8' }}>Go Live</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>Publish Competition</h2>
            <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>Select a plan to publish <strong style={{ color: '#94a3b8' }}>{competition.name}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 32 }}>

          {/* STEP: Plan selection */}
          {step === 'plan' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setPlan(p.id)} style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                    border: `1px solid ${plan === p.id ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    background: plan === p.id ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${plan === p.id ? '#38bdf8' : '#334155'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {plan === p.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{p.name}</span>
                        <span style={{ fontSize: 11, color: '#475569' }}>{p.desc}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 6 }}>
                        {p.features.map(f => (
                          <span key={f} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={10} color="#38bdf8" strokeWidth={3} />{f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 200, color: '#f1f5f9', fontFamily: "'DM Mono', monospace" }}>{p.price}</span>
                      <span style={{ fontSize: 12, color: '#475569', display: 'block' }}>{p.sub}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Promo code toggle */}
              <button
                onClick={() => setStep('promo')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 24 }}
              >
                <Tag size={14} /> Have a promo code?
              </button>

              <button
                onClick={() => setStep('payment')}
                style={{ width: '100%', padding: '15px 0', borderRadius: 12, background: '#38bdf8', color: '#0c1a22', fontSize: 15, fontWeight: 800, cursor: 'pointer', border: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(56,189,248,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                Continue with {selected.name} — {selected.price}{selected.sub}
              </button>
            </>
          )}

          {/* STEP: Promo code */}
          {step === 'promo' && (
            <>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
                Enter your promo code below. Valid codes are managed by ClimbTracker administrators.
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="YOURCODE"
                  style={{ flex: 1, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${promoError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, fontSize: 15, color: '#f1f5f9', outline: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}
                />
                <button onClick={applyPromo} style={{ padding: '14px 20px', borderRadius: 12, background: '#38bdf8', color: '#0c1a22', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>Apply</button>
              </div>
              {promoError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 16 }}>{promoError}</p>}
              {promoValid && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', fontSize: 14, color: '#34d399', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} /> Promo code applied — free access granted!
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('plan')} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Back</button>
                {promoValid && (
                  <button onClick={handlePublish} disabled={loading} style={{ flex: 2, padding: '13px 0', borderRadius: 12, background: '#38bdf8', color: '#0c1a22', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    {loading ? 'Publishing…' : 'Publish for Free'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Selected plan</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8' }}>{selected.name} — {selected.price}{selected.sub}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {/* Card number */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456"
                      style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15, color: '#f1f5f9', outline: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}
                    />
                    <CreditCard size={16} color="#334155" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Expires</label>
                    <input value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))} placeholder="MM/YY"
                      style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15, color: '#f1f5f9', outline: 'none', fontFamily: "'DM Mono', monospace" }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>CVV</label>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="···"
                      style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15, color: '#f1f5f9', outline: 'none', fontFamily: "'DM Mono', monospace" }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Name</label>
                    <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="A. Honnold"
                      style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15, color: '#f1f5f9', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: '#334155' }}>
                <Lock size={12} /> Payments are processed securely. Card data is never stored.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep('plan')} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Back</button>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  style={{ flex: 2, padding: '13px 0', borderRadius: 12, background: loading ? '#0e3a50' : '#38bdf8', color: loading ? '#475569' : '#0c1a22', fontSize: 15, fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                  {loading ? 'Publishing…' : `Pay ${selected.price} & Go Live`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}