import { useState } from 'react'
import { X, Check, Tag, CreditCard, Lock, Zap } from 'lucide-react'
import type { Competition } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  competition:     Competition
  competitorCount: number
  onClose:         () => void
  onSuccess:       (comp: Competition) => void
  theme:           'light' | 'dark'
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

// ─── PRICING HELPERS ─────────────────────────────────────────────────────────

const BASE_USERS    = 150
const BASE_PRICE    = 99.99
const OVERAGE_RATE  = 0.30

function calcOneShotTotal(count: number) {
  const overage = Math.max(0, count - BASE_USERS)
  return BASE_PRICE + overage * OVERAGE_RATE
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

export default function PaymentModal({ competition, competitorCount, onClose, onSuccess }: PaymentModalProps) {
  const [step,           setStep]           = useState<'confirm' | 'plan' | 'payment' | 'promo'>('confirm')
  const [confirmedCount, setConfirmedCount] = useState(Math.max(competitorCount, 1))
  const [plan,           setPlan]           = useState<Plan>('one_shot')
  const [promoCode,  setPromoCode]  = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoValid, setPromoValid] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [cardNum,    setCardNum]    = useState('')
  const [cardExp,    setCardExp]    = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [cardName,   setCardName]   = useState('')

  function applyPromo() {
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

  const inputCls = `
    w-full px-4 py-3.5 rounded border outline-none text-sm transition-colors duration-[330ms]
    bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#3E6AE1]/50
  `

  const btnSecondary = `
    flex-1 py-3.5 rounded text-sm font-medium border transition-colors duration-[330ms]
    bg-transparent border-white/10 text-[#5C5E62] hover:text-[#D0D1D2] hover:border-white/20
  `

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#171A20] border border-white/[0.08] rounded w-full max-w-[560px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={15} className="text-[#3E6AE1]" />
              <span className="text-[11px] font-medium text-[#3E6AE1]">Go Live</span>
            </div>
            <h2 className="text-xl font-medium text-[#EEEEEE]">Publish Competition</h2>
            <p className="text-sm text-[#5C5E62] mt-1">
              Select a plan to publish <span className="font-medium text-[#8E8E8E]">{competition.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#5C5E62] hover:text-[#D0D1D2] transition-colors duration-[330ms] p-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">

          {/* STEP: Confirm participant count */}
          {step === 'confirm' && (() => {
            const overage      = Math.max(0, confirmedCount - BASE_USERS)
            const oneShotTotal = calcOneShotTotal(confirmedCount)
            return (
              <>
                <p className="text-sm text-[#5C5E62] mb-5 leading-relaxed">
                  Set the expected number of participants. Pricing adjusts live — you can always buy extra capacity later from Settings.
                </p>

                {/* Editable participant count */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-[#5C5E62] mb-2">Number of participants</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={1}
                        value={confirmedCount}
                        onChange={e => setConfirmedCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-4 py-3 rounded border outline-none text-sm bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#3E6AE1]/50 transition-colors duration-[330ms] font-mono text-lg"
                      />
                    </div>
                    {competitorCount > 0 && confirmedCount !== competitorCount && (
                      <button
                        onClick={() => setConfirmedCount(competitorCount)}
                        className="px-3 py-3 rounded border border-white/10 text-xs text-[#5C5E62] hover:text-[#D0D1D2] hover:border-white/20 transition-colors duration-[330ms] flex-shrink-0"
                      >
                        Reset to current ({competitorCount})
                      </button>
                    )}
                  </div>
                  {competitorCount > 0 && (
                    <p className="text-[11px] text-[#5C5E62] mt-1.5">
                      {competitorCount} participant{competitorCount !== 1 ? 's' : ''} currently registered
                    </p>
                  )}
                </div>

                {/* Per-plan pricing preview */}
                <div className="flex flex-col gap-2 mb-6">
                  {/* One-Shot */}
                  <div className={`px-5 py-4 rounded border transition-colors duration-[330ms] ${overage > 0 ? 'bg-amber-400/[0.03] border-amber-400/20' : 'bg-white/[0.02] border-white/[0.07]'}`}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-[#EEEEEE]">One-Shot</span>
                      <span className="text-lg font-medium text-[#EEEEEE] font-mono">${oneShotTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-[#5C5E62] space-y-0.5">
                      <p>$99.99 base · first {BASE_USERS} participants included</p>
                      {overage > 0
                        ? <p className="text-amber-400">+${(overage * OVERAGE_RATE).toFixed(2)} overage · {overage} × $0.30/participant</p>
                        : <p className="text-green-400">{BASE_USERS - confirmedCount} slots remaining at no extra charge</p>
                      }
                    </div>
                  </div>
                  {/* Pro */}
                  <div className="px-5 py-4 rounded border bg-white/[0.02] border-white/[0.07]">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-[#EEEEEE]">Pro</span>
                      <span className="text-lg font-medium text-[#EEEEEE] font-mono">$14.99<span className="text-xs text-[#5C5E62] font-sans">/mo</span></span>
                    </div>
                    <p className="text-[11px] text-[#5C5E62]">500 competitors/year · extra bundles in Settings</p>
                  </div>
                  {/* Platinum */}
                  <div className="px-5 py-4 rounded border bg-white/[0.02] border-white/[0.07]">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-[#EEEEEE]">Platinum</span>
                      <span className="text-lg font-medium text-[#EEEEEE] font-mono">$19.99<span className="text-xs text-[#5C5E62] font-sans">/mo</span></span>
                    </div>
                    <p className="text-[11px] text-[#5C5E62]">1 000 competitors/year · extra bundles in Settings</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('plan')}
                  className="w-full py-4 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms]"
                >
                  Continue to plan selection
                </button>
              </>
            )
          })()}

          {/* STEP: Plan selection */}
          {step === 'plan' && (() => {
            const oneShotTotal  = calcOneShotTotal(confirmedCount)
            const oneShotOverage = Math.max(0, confirmedCount - BASE_USERS)
            const ctaPrice = plan === 'one_shot'
              ? `$${oneShotTotal.toFixed(2)}`
              : PLANS.find(p => p.id === plan)!.price + PLANS.find(p => p.id === plan)!.sub
            return (
              <>
                <div className="flex flex-col gap-3 mb-6">
                  {PLANS.map(p => {
                    const displayPrice = p.id === 'one_shot'
                      ? `$${oneShotTotal.toFixed(2)}`
                      : p.price
                    const displaySub = p.id === 'one_shot' ? '/event' : p.sub
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlan(p.id)}
                        className={`
                          text-left px-5 py-4 rounded border cursor-pointer transition-colors duration-[330ms]
                          flex items-center gap-4
                          ${plan === p.id
                            ? 'bg-[#3E6AE1]/[0.06] border-[#3E6AE1]/50'
                            : 'bg-white/[0.02] border-white/[0.07] hover:border-white/15'
                          }
                        `}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${plan === p.id ? 'border-[#3E6AE1]' : 'border-[#393C41]'}`}>
                          {plan === p.id && <div className="w-2.5 h-2.5 rounded-full bg-[#3E6AE1]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-[#EEEEEE]">{p.name}</span>
                            <span className="text-[11px] text-[#5C5E62]">{p.desc}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                            {p.features.map(f => (
                              <span key={f} className="text-[11px] text-[#5C5E62] flex items-center gap-1">
                                <Check size={10} className="text-[#3E6AE1]" strokeWidth={3} />{f}
                              </span>
                            ))}
                            {p.id === 'one_shot' && oneShotOverage > 0 && (
                              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                                +{oneShotOverage} × $0.30 overage
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xl font-light text-[#EEEEEE] font-mono">{displayPrice}</span>
                          <span className="text-xs text-[#5C5E62] block">{displaySub}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setStep('promo')}
                  className="flex items-center gap-2 text-[#3E6AE1] text-sm font-medium mb-6 hover:text-[#3056C7] transition-colors duration-[330ms]"
                >
                  <Tag size={14} /> Have a promo code?
                </button>

                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-4 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms]"
                >
                  Continue with {selected.name} — {ctaPrice}
                </button>
              </>
            )
          })()}

          {/* STEP: Promo code */}
          {step === 'promo' && (
            <>
              <p className="text-sm text-[#5C5E62] mb-5 leading-relaxed">
                Enter your promo code below. Valid codes are managed by ClimbTracker administrators.
              </p>
              <div className="flex gap-2.5 mb-4">
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="YOURCODE"
                  className={`${inputCls} font-mono tracking-widest`}
                />
                <button
                  onClick={applyPromo}
                  className="px-5 py-3.5 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms] flex-shrink-0"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-xs text-red-400 mb-4">{promoError}</p>}
              {promoValid && (
                <div className="px-4 py-3 rounded border bg-green-400/10 border-green-400/30 text-sm text-green-400 mb-4 flex items-center gap-2">
                  <Check size={15} /> Promo code applied — free access granted!
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep('plan')} className={btnSecondary}>Back</button>
                {promoValid && (
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="flex-[2] py-3.5 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms] disabled:opacity-40"
                  >
                    {loading ? 'Publishing…' : 'Publish for Free'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <>
              <div className="px-4 py-3 rounded border bg-[#3E6AE1]/[0.06] border-[#3E6AE1]/15 mb-6 flex justify-between items-center">
                <span className="text-sm text-[#5C5E62]">Selected plan</span>
                <span className="text-sm font-medium text-[#3E6AE1]">{selected.name} — {selected.price}{selected.sub}</span>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-[#5C5E62]">Card Number</label>
                  <div className="relative">
                    <input
                      value={cardNum}
                      onChange={e => setCardNum(formatCard(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className={`${inputCls} pr-12 font-mono tracking-wider`}
                    />
                    <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#393C41]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-[#5C5E62]">Expires</label>
                    <input value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))} placeholder="MM/YY" className={`${inputCls} font-mono`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-[#5C5E62]">CVV</label>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="···" className={`${inputCls} font-mono`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-[#5C5E62]">Name</label>
                    <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="A. Honnold" className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5 text-xs text-[#393C41]">
                <Lock size={11} /> Payments are processed securely. Card data is never stored.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('plan')} className={btnSecondary}>Back</button>
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className={`
                    flex-[2] py-3.5 rounded text-sm font-medium transition-colors duration-[330ms]
                    ${loading
                      ? 'bg-[#3E6AE1]/30 text-[#5C5E62] cursor-not-allowed'
                      : 'bg-[#3E6AE1] text-white hover:bg-[#3056C7] cursor-pointer'
                    }
                  `}
                >
                  {loading ? 'Publishing…' : `Pay ${plan === 'one_shot' ? `$${calcOneShotTotal(confirmedCount).toFixed(2)}` : selected.price + selected.sub} & Go Live`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
