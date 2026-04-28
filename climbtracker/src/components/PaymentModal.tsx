import { useState } from 'react'
import { X, Check, Lock, Zap, ArrowLeft, Sparkles, Palette } from 'lucide-react'
// Check is used in the plan feature lists below
import type { Competition } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  competition:     Competition
  competitorCount: number
  onClose:         () => void
  onSuccess:       (comp: Competition) => void
  theme:           'light' | 'dark'
}

type Tier = 'standard' | 'premium'

// ─── PRICING ─────────────────────────────────────────────────────────────────

const TIERS = {
  standard: {
    label:       'Standard',
    basePrice:   129,
    baseUsers:   300,
    overageRate: 0.12,
    features: [
      'Up to 300 participants',
      'Live leaderboard',
      'Analytics & exports',
      'Judge management',
      'Extra capacity bundles',
    ],
  },
  premium: {
    label:       'Premium',
    basePrice:   209,
    baseUsers:   500,
    overageRate: 0.10,
    features: [
      'Up to 500 participants',
      'White-label branding',
      'Custom logo & color scheme',
      'Live leaderboard',
      'Analytics & exports',
      'Judge management',
      'Extra capacity bundles',
    ],
  },
} as const

function calcTotal(count: number, tier: Tier): number {
  const { basePrice, baseUsers, overageRate } = TIERS[tier]
  const overage = Math.max(0, count - baseUsers)
  return basePrice + overage * overageRate
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

export default function PaymentModal({
  competition,
  competitorCount,
  onClose,
  onSuccess: _onSuccess,  // kept in props for API compat; result now comes via Stripe webhook
}: PaymentModalProps) {
  const [step,           setStep]           = useState<'plan' | 'confirm' | 'payment'>('plan')
  const [tier,           setTier]           = useState<Tier>('standard')
  const [confirmedCount, setConfirmedCount] = useState(Math.max(competitorCount, 1))
  const [loading,        setLoading]        = useState(false)
  const [stripeError,    setStripeError]    = useState('')

  async function handleStripeRedirect() {
    setLoading(true)
    setStripeError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            'base_plan',
          competitionId:   competition.id,
          competitionName: competition.name,
          tier,
          participantCount: confirmedCount,
          userId: (competition as any).ownerId,
        }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setStripeError(data.error ?? 'Could not create checkout session.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setStripeError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const total      = calcTotal(confirmedCount, tier)
  const tierConfig = TIERS[tier]
  const overage    = Math.max(0, confirmedCount - tierConfig.baseUsers)

  const btnBack = `
    flex items-center gap-1.5 py-3.5 px-4 rounded text-sm font-medium border transition-colors duration-[330ms]
    bg-transparent border-white/10 text-[#5C5E62] hover:text-[#D0D1D2] hover:border-white/20
  `

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#121212] border border-white/[0.08] rounded w-full max-w-[520px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={15} className="text-[#7F8BAD]" />
              <span className="text-[11px] font-medium text-[#7F8BAD]">Go Live</span>
            </div>
            <h2 className="text-xl font-medium text-[#EEEEEE]">Publish Competition</h2>
            <p className="text-sm text-[#5C5E62] mt-1">
              <span className="font-medium text-[#8E8E8E]">{competition.name}</span>
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

          {/* STEP: Plan selection */}
          {step === 'plan' && (
            <>
              <p className="text-sm text-[#5C5E62] mb-5 leading-relaxed">
                Choose the plan that fits your event. Both include a one-time payment per competition.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {/* Standard */}
                <button
                  onClick={() => setTier('standard')}
                  className={`text-left px-5 py-4 rounded border transition-colors duration-[330ms] ${
                    tier === 'standard'
                      ? 'bg-[#7F8BAD]/[0.06] border-[#7F8BAD]/50'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${tier === 'standard' ? 'border-[#7F8BAD]' : 'border-white/20'}`}>
                      {tier === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-[#7F8BAD]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#EEEEEE]">Standard</span>
                        <div className="text-right">
                          <span className="text-lg font-medium text-[#EEEEEE] font-mono">from €129</span>
                          <span className="text-xs text-[#5C5E62] ml-1">/event</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#5C5E62] mb-2">300 participants included · €0.12/extra</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {TIERS.standard.features.map(f => (
                          <span key={f} className="text-[11px] text-[#5C5E62] flex items-center gap-1">
                            <Check size={10} className="text-[#7F8BAD]" strokeWidth={3} />{f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Premium */}
                <button
                  onClick={() => setTier('premium')}
                  className={`text-left px-5 py-4 rounded border transition-colors duration-[330ms] ${
                    tier === 'premium'
                      ? 'bg-[#7F8BAD]/[0.06] border-[#7F8BAD]/50'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${tier === 'premium' ? 'border-[#7F8BAD]' : 'border-white/20'}`}>
                      {tier === 'premium' && <div className="w-2.5 h-2.5 rounded-full bg-[#7F8BAD]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#EEEEEE]">Premium</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#7F8BAD]/20 text-[#7F8BAD] flex items-center gap-1">
                            <Sparkles size={9} /> White-label
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-medium text-[#EEEEEE] font-mono">from €209</span>
                          <span className="text-xs text-[#5C5E62] ml-1">/event</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#5C5E62] mb-2">500 participants included · €0.10/extra</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {TIERS.premium.features.map(f => (
                          <span key={f} className={`text-[11px] flex items-center gap-1 ${f.includes('White') || f.includes('Custom') ? 'text-[#7F8BAD]' : 'text-[#5C5E62]'}`}>
                            <Check size={10} className="text-[#7F8BAD]" strokeWidth={3} />{f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-2.5">
                <button onClick={onClose} className={btnBack}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-[2] py-3.5 rounded text-sm font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
                >
                  Continue with {tierConfig.label}
                </button>
              </div>
            </>
          )}

          {/* STEP: Confirm participant count */}
          {step === 'confirm' && (
            <>
              <p className="text-sm text-[#5C5E62] mb-5 leading-relaxed">
                Set the maximum number of participants. You can always purchase extra capacity later.
              </p>

              {/* Editable participant count */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-[#5C5E62] mb-2">Number of participants</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={confirmedCount}
                    onChange={e => setConfirmedCount(Math.max(1, Number(e.target.value) || 1))}
                    className="flex-1 px-4 py-3 rounded border outline-none text-lg bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50 transition-colors duration-[330ms] font-mono"
                  />
                  {competitorCount > 0 && confirmedCount !== competitorCount && (
                    <button
                      onClick={() => setConfirmedCount(competitorCount)}
                      className="px-3 py-3 rounded border border-white/10 text-xs text-[#5C5E62] hover:text-[#D0D1D2] hover:border-white/20 transition-colors duration-[330ms] flex-shrink-0"
                    >
                      Reset ({competitorCount})
                    </button>
                  )}
                </div>
                {competitorCount > 0 && (
                  <p className="text-[11px] text-[#5C5E62] mt-1.5">
                    {competitorCount} participant{competitorCount !== 1 ? 's' : ''} currently registered
                  </p>
                )}
              </div>

              {/* Pricing summary */}
              <div className={`px-5 py-4 rounded border mb-6 transition-colors duration-[330ms] ${overage > 0 ? 'bg-amber-400/[0.03] border-amber-400/20' : 'bg-white/[0.02] border-white/[0.07]'}`}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-[#EEEEEE]">{tierConfig.label}</span>
                  <span className="text-2xl font-medium text-[#EEEEEE] font-mono">€{total.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-[#5C5E62] space-y-0.5">
                  <p>€{tierConfig.basePrice} base · first {tierConfig.baseUsers} participants included</p>
                  {overage > 0
                    ? <p className="text-amber-400">+€{(overage * tierConfig.overageRate).toFixed(2)} overage · {overage} × €{tierConfig.overageRate.toFixed(2)}/participant</p>
                    : <p className="text-green-400">{tierConfig.baseUsers - confirmedCount} slots still available at no extra charge</p>
                  }
                </div>
              </div>

              <div className="flex gap-2.5">
                <button onClick={() => setStep('plan')} className={btnBack}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep('payment')}
                  className="flex-[2] py-3.5 rounded text-sm font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
                >
                  Continue — €{total.toFixed(2)}
                </button>
              </div>
            </>
          )}

          {/* STEP: Payment — redirects to Stripe Checkout */}
          {step === 'payment' && (
            <>
              {/* Order summary */}
              <div className="px-4 py-3 rounded border bg-[#7F8BAD]/[0.06] border-[#7F8BAD]/15 mb-6 flex justify-between items-center">
                <div>
                  <span className="text-xs text-[#5C5E62] block mb-0.5">{tierConfig.label} · {confirmedCount} participants</span>
                  {overage > 0 && (
                    <span className="text-[10px] text-amber-400">incl. {overage} × €{tierConfig.overageRate.toFixed(2)} overage</span>
                  )}
                  {tier === 'premium' && (
                    <span className="text-[10px] text-[#7F8BAD] flex items-center gap-1 mt-0.5">
                      <Palette size={9} /> White-label branding included
                    </span>
                  )}
                </div>
                <span className="text-lg font-medium text-[#7F8BAD] font-mono">€{total.toFixed(2)}</span>
              </div>

              {stripeError && (
                <p className="text-xs text-red-400 mb-4">{stripeError}</p>
              )}

              <div className="flex items-center gap-2 mb-5 text-xs text-[#393C41]">
                <Lock size={11} /> You'll be redirected to Stripe's secure checkout. Card data is never stored by Ascendr.
              </div>

              <div className="flex gap-2.5">
                <button onClick={() => setStep('confirm')} className={btnBack}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleStripeRedirect}
                  disabled={loading}
                  className={`
                    flex-[2] py-3.5 rounded text-sm font-medium transition-colors duration-[330ms]
                    ${loading
                      ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed'
                      : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                    }
                  `}
                >
                  {loading ? 'Redirecting to Stripe…' : `Pay €${total.toFixed(2)} & Go Live`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
