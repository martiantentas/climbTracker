import { useState } from 'react'
import { X, CreditCard, Lock, CheckCircle2, Tag, Check } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  /** Short title shown in the modal header */
  title:       string
  /** One-line description shown below the title */
  subtitle?:   string
  /** Amount in euros */
  amount:      number
  /** Label appended to the pay button */
  ctaLabel?:   string
  /** When true, shows a promo code input above the card form */
  showPromo?:  boolean
  onClose:     () => void
  /** Called after the simulated payment / promo activation succeeds */
  onSuccess:   () => void
}

// ─── CHECKOUT MODAL ───────────────────────────────────────────────────────────

export default function CheckoutModal({
  title,
  subtitle,
  amount,
  ctaLabel,
  showPromo = false,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [cardNum,      setCardNum]      = useState('')
  const [cardExp,      setCardExp]      = useState('')
  const [cardCvv,      setCardCvv]      = useState('')
  const [cardName,     setCardName]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [done,         setDone]         = useState(false)

  const [promoCode,    setPromoCode]    = useState('')
  const [promoError,   setPromoError]   = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const isFree = promoApplied

  function applyPromo() {
    if (promoCode.trim().length >= 6) {
      setPromoApplied(true)
      setPromoError('')
    } else {
      setPromoError('Invalid promo code. Codes are at least 6 characters.')
    }
  }

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExp(v: string) {
    return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
  }

  function handleConfirm() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setDone(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    }, 1200)
  }

  const inputCls = `
    w-full px-4 py-3.5 rounded border outline-none text-sm transition-colors duration-[330ms]
    bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#7F8BAD]/50
  `

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#121212] border border-white/[0.08] rounded w-full max-w-[460px]">

        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-[#EEEEEE] mb-0.5">{title}</h2>
            {subtitle && <p className="text-xs text-[#5C5E62]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className={`text-xl font-medium font-mono transition-colors duration-[330ms] ${isFree ? 'line-through text-[#5C5E62]' : 'text-[#EEEEEE]'}`}>
              €{amount.toFixed(2)}
            </span>
            {isFree && <span className="text-sm font-medium text-green-400">Free</span>}
            <button
              onClick={onClose}
              className="text-[#5C5E62] hover:text-[#D0D1D2] transition-colors duration-[330ms] p-1"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="p-7">
          {done ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 size={44} className="text-green-400 mb-3" />
              <p className="text-sm font-medium text-[#EEEEEE]">
                {isFree ? 'Promo applied successfully' : 'Payment confirmed'}
              </p>
              <p className="text-xs text-[#5C5E62] mt-1">Applying changes…</p>
            </div>
          ) : (
            <>
              {/* Order summary */}
              <div className="px-4 py-3 rounded border bg-[#7F8BAD]/[0.06] border-[#7F8BAD]/15 mb-5 flex items-center justify-between">
                <span className="text-xs text-[#5C5E62]">{title}</span>
                <span className={`text-sm font-medium font-mono ${isFree ? 'line-through text-[#5C5E62]' : 'text-[#7F8BAD]'}`}>
                  €{amount.toFixed(2)}
                </span>
              </div>

              {/* ── Promo code section ── */}
              {showPromo && (
                <div className="mb-5">
                  <p className="text-[11px] font-medium text-[#5C5E62] mb-2 flex items-center gap-1.5">
                    <Tag size={11} /> Promo code
                  </p>
                  {promoApplied ? (
                    <div className="px-4 py-3 rounded border bg-green-400/10 border-green-400/20 text-xs text-green-400 flex items-center gap-2">
                      <Check size={13} strokeWidth={3} />
                      Promo applied — upgrade is free!
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
                          placeholder="YOURCODE"
                          className={`${inputCls} font-mono tracking-widest flex-1 py-3`}
                        />
                        <button
                          onClick={applyPromo}
                          disabled={!promoCode.trim()}
                          className="px-4 py-3 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <p className="text-[11px] text-red-400 mt-2">{promoError}</p>}
                    </>
                  )}
                </div>
              )}

              {/* ── Card form — hidden when promo is applied ── */}
              {!isFree && (
                <>
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
                        <CreditCard size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#393C41]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-[#5C5E62]">Expires</label>
                        <input
                          value={cardExp}
                          onChange={e => setCardExp(formatExp(e.target.value))}
                          placeholder="MM/YY"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-[#5C5E62]">CVV</label>
                        <input
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="···"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-[#5C5E62]">Name</label>
                        <input
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          placeholder="A. Honnold"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-5 text-xs text-[#393C41]">
                    <Lock size={11} /> Payments are processed securely. Card data is never stored.
                  </div>
                </>
              )}

              {/* ── CTA ── */}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`
                  w-full py-3.5 rounded text-sm font-medium transition-colors duration-[330ms]
                  ${loading
                    ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed'
                    : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                  }
                `}
              >
                {loading
                  ? 'Processing…'
                  : isFree
                    ? `Activate for Free${ctaLabel ? ` — ${ctaLabel}` : ''}`
                    : `Pay €${amount.toFixed(2)}${ctaLabel ? ` — ${ctaLabel}` : ''}`
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
