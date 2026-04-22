import { useState, useRef, useEffect } from 'react'
import {
  Save, Plus, Trash2, Globe, Check,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Lock, Users, Package,
  Palette, Upload, Sparkles, RefreshCw,
} from 'lucide-react'
import type { Competition, DifficultyLevel } from '../types'
import { CompetitionStatus, ScoringType } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import CheckoutModal from '../components/CheckoutModal'

interface SettingsPageProps {
  competition:     Competition
  theme:           'light' | 'dark'
  lang:            Language
  onUpdate:        (updated: Competition) => void
  competitorCount?: number
}

function SectionCard({ title, children, theme, defaultOpen = true }: {
  title: string; children: React.ReactNode; theme: 'light' | 'dark'; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const dk = theme === 'dark'
  return (
    <div className={`rounded border overflow-hidden mb-4 ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors duration-[330ms] ${dk ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-[#F4F4F4] hover:bg-[#EEEEEE]'}`}
      >
        <span className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{title}</span>
        {open
          ? <ChevronUp size={15} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
          : <ChevronDown size={15} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
        }
      </button>
      {open && <div className={`p-6 ${dk ? 'bg-transparent' : 'bg-white'}`}>{children}</div>}
    </div>
  )
}

function ToggleRow({ label, desc, value, theme, onChange }: {
  label: string; desc: string; value: boolean; theme: 'light' | 'dark'; onChange: (v: boolean) => void
}) {
  const dk = theme === 'dark'
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <p className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className="flex-shrink-0">
        {value
          ? <ToggleRight size={32} className="text-[#7F8BAD]" />
          : <ToggleLeft  size={32} className={dk ? 'text-[#5C5E62]' : 'text-[#D0D1D2]'} />
        }
      </button>
    </div>
  )
}

function InputField({ label, value, type = 'text', theme, onChange, hint, min, max }: {
  label: string; value: string | number; type?: string; theme: 'light' | 'dark'
  onChange: (v: string) => void; hint?: string; min?: number; max?: number
}) {
  const dk  = theme === 'dark'
  const cls = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]'}`
  return (
    <div className="mb-4">
      <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{label}</label>
      <input type={type} value={value} min={min} max={max} onChange={e => onChange(e.target.value)} className={cls} />
      {hint && <p className={`text-xs mt-1.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{hint}</p>}
    </div>
  )
}

// ─── BUNDLE DEFINITIONS ───────────────────────────────────────────────────────

const BUNDLES = [
  { id: '150', label: '150 extra participants', users: 150, price: 14.99 },
  { id: '300', label: '300 extra participants', users: 300, price: 29.99 },
] as const

const PROMO_GRANT = 100 // free participants granted by a valid promo code

function BillingSection({ competition, competitorCount, theme, lang, onUpdate }: {
  competition:     Competition
  competitorCount: number
  theme:           'light' | 'dark'
  lang:            Language
  onUpdate:        (updated: Competition) => void
}) {
  const dk              = theme === 'dark'
  const t               = translations[lang]
  const comp            = competition as any
  const baseLimit       = comp.participantLimit ?? 300
  const extraCapacity   = comp.additionalCapacity ?? 0
  const totalCapacity   = baseLimit + extraCapacity
  const remaining       = Math.max(0, totalCapacity - competitorCount)
  const isFull          = competitorCount >= totalCapacity

  const [customQty,    setCustomQty]    = useState(500)
  const [promoCode,    setPromoCode]    = useState('')
  const [promoError,   setPromoError]   = useState('')
  const [promoValid,   setPromoValid]   = useState(false)
  const [promoApplied, setPromoApplied] = useState(false)

  // Checkout state — null means closed
  const [checkout, setCheckout] = useState<{
    title:    string
    subtitle: string
    amount:   number
    ctaLabel: string
    users:    number
  } | null>(null)

  function openBundleCheckout(users: number, label: string, price: number) {
    setCheckout({
      title:    label,
      subtitle: t.bundleOneTime,
      amount:   price,
      ctaLabel: t.addParticipants(users),
      users,
    })
  }

  function onBundlePaid() {
    if (!checkout) return
    onUpdate({ ...competition, additionalCapacity: extraCapacity + checkout.users } as any)
  }

  function applyPromo() {
    if (promoApplied) return
    if (promoCode.trim().length >= 6) {
      setPromoValid(true)
      setPromoError('')
    } else {
      setPromoError(t.promoInvalid)
    }
  }

  function redeemPromo() {
    onUpdate({ ...competition, additionalCapacity: extraCapacity + PROMO_GRANT } as any)
    setPromoApplied(true)
    setPromoValid(false)
    setPromoCode('')
  }

  const inputCls    = `px-3 py-2 rounded border outline-none text-sm transition-colors duration-[330ms] w-24 ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]'}`
  const inputFullCls = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50 placeholder:text-[#5C5E62]' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD] placeholder:text-[#8E8E8E]'}`

  return (
    <SectionCard title={t.billingSection} theme={theme} defaultOpen={false}>

      {/* Current usage */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded border flex-1 ${dk ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <Users size={14} className="text-[#7F8BAD] flex-shrink-0" />
          <div>
            <p className={`text-[10px] font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.registered2}</p>
            <p className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
              {competitorCount}
              <span className={`font-normal text-xs ml-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>/ {totalCapacity}</span>
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded border flex-1 ${dk ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <Package size={14} className="text-[#7F8BAD] flex-shrink-0" />
          <div>
            <p className={`text-[10px] font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.remaining}</p>
            <p className={`text-sm font-medium ${isFull ? 'text-red-400' : dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
              {isFull ? t.full : remaining}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded border flex-1 ${dk ? 'bg-white/[0.03] border-white/[0.07]' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <Package size={14} className="text-[#7F8BAD] flex-shrink-0" />
          <div>
            <p className={`text-[10px] font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.limit}</p>
            <p className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{totalCapacity}</p>
          </div>
        </div>
      </div>

      {isFull && (
        <div className={`px-4 py-3 rounded border mb-5 text-xs font-medium text-red-400 bg-red-400/10 border-red-400/20`}>
          {t.limitReached}
        </div>
      )}

      <p className={`text-xs mb-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
        {t.bundlesNote}
      </p>

      {/* Bundles */}
      <div className="flex flex-col gap-2.5 mb-6">
        {BUNDLES.map(b => (
          <div key={b.id} className={`flex items-center justify-between px-4 py-3.5 rounded border ${dk ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <div>
              <p className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{b.label}</p>
              <p className={`text-[11px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>€{b.price.toFixed(2)} · one-time</p>
            </div>
            <button
              onClick={() => openBundleCheckout(b.users, b.label, b.price)}
              className="px-4 py-2 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
            >
              {t.addLabel} {b.users}
            </button>
          </div>
        ))}

        {/* Custom 500+ */}
        <div className={`flex items-center justify-between px-4 py-3.5 rounded border ${dk ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <div className="flex-1">
            <p className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.customBundle}</p>
            <p className={`text-[11px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              €0.12/participant · min 500 · total €{(customQty * 0.12).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="number"
              min={500}
              value={customQty}
              onChange={e => setCustomQty(Math.max(500, Number(e.target.value)))}
              className={inputCls}
            />
            <button
              onClick={() => openBundleCheckout(customQty, `${t.customBundle} — ${customQty}`, customQty * 0.12)}
              className="px-4 py-2 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
            >
              {t.addLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className={`h-px mb-6 ${dk ? 'bg-white/[0.06]' : 'bg-[#EEEEEE]'}`} />

      {/* Promo code */}
      <div>
        <p className={`text-xs font-medium mb-3 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.promoCode}</p>
        <p className={`text-xs mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {t.promoDesc(PROMO_GRANT)}
        </p>
        {promoApplied ? (
          <div className={`px-4 py-3 rounded border text-xs font-medium text-green-400 bg-green-400/10 border-green-400/20 flex items-center gap-2`}>
            <Check size={13} strokeWidth={3} /> {t.promoApplied(PROMO_GRANT)}
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
                placeholder="YOURCODE"
                className={`${inputFullCls} font-mono tracking-widest flex-1`}
              />
              <button
                onClick={applyPromo}
                disabled={!promoCode.trim()}
                className="px-4 py-2.5 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.apply}
              </button>
            </div>
            {promoError && <p className="text-[11px] text-red-400 mb-3">{promoError}</p>}
            {promoValid && (
              <div className={`px-4 py-3 rounded border text-xs bg-green-400/10 border-green-400/20 text-green-400 mb-3 flex items-center justify-between`}>
                <span className="flex items-center gap-2"><Check size={13} strokeWidth={3} /> {t.promoValid(PROMO_GRANT)}</span>
                <button
                  onClick={redeemPromo}
                  className="font-medium underline hover:no-underline transition-all"
                >
                  {t.redeem}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bundle checkout modal */}
      {checkout && (
        <CheckoutModal
          title={checkout.title}
          subtitle={checkout.subtitle}
          amount={checkout.amount}
          ctaLabel={checkout.ctaLabel}
          onClose={() => setCheckout(null)}
          onSuccess={() => { onBundlePaid(); setCheckout(null) }}
        />
      )}
    </SectionCard>
  )
}

// ─── BRANDING SECTION (PREMIUM) ───────────────────────────────────────────────

function BrandingSection({ competition, theme, lang, onUpdate }: {
  competition: Competition
  theme:       'light' | 'dark'
  lang:        Language
  onUpdate:    (updated: Competition) => void
}) {
  const dk      = theme === 'dark'
  const t       = translations[lang]
  const comp    = competition as any
  const isPremium = comp.tier === 'premium'

  const branding = comp.branding ?? {}
  const accent   = branding.accentColor ?? '#7F8BAD'
  const lightBg  = branding.lightBg     ?? '#FFFFFF'
  const darkBg   = branding.darkBg      ?? '#121212'
  const logoUrl  = branding.logoDataUrl  ?? ''

  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      onUpdate({ ...competition, branding: { ...branding, logoDataUrl: ev.target?.result as string } } as any)
      // Reset so the same file can be re-selected next time
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  function updateBranding(patch: Record<string, string>) {
    onUpdate({ ...competition, branding: { ...branding, ...patch } } as any)
  }

  function resetBranding() {
    onUpdate({ ...competition, branding: {} } as any)
  }

  const colorRow = (label: string, value: string, key: string) => {
    const inputId = `brand-color-${key}`
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <p className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{label}</p>
          <p className={`text-xs mt-0.5 font-mono ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{value}</p>
        </div>
        <label
          htmlFor={inputId}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10' : 'bg-[#EEEEEE] text-[#5C5E62] hover:bg-[#D0D1D2]'}`}
        >
          <span
            className="w-4 h-4 rounded-sm border border-black/10 flex-shrink-0 inline-block"
            style={{ backgroundColor: value }}
          />
          {t.changeLabel}
          <input
            id={inputId}
            type="color"
            value={value}
            onChange={e => updateBranding({ [key]: e.target.value })}
            className="sr-only"
          />
        </label>
      </div>
    )
  }

  const [showUpgradeCheckout, setShowUpgradeCheckout] = useState(false)

  if (!isPremium) {
    return (
      <>
        <SectionCard title={t.brandingSection} theme={theme} defaultOpen={false}>
          <div className={`flex flex-col items-center text-center py-6 px-4 rounded border border-dashed ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
            <div className="w-10 h-10 rounded bg-[#7F8BAD]/10 flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-[#7F8BAD]" />
            </div>
            <p className={`text-sm font-medium mb-1 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.premiumFeature}</p>
            <p className={`text-xs leading-relaxed mb-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.brandingLocked}
            </p>
            <button
              onClick={() => setShowUpgradeCheckout(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#7F8BAD] text-white rounded text-sm font-medium hover:bg-[#6D799B] transition-colors duration-[330ms]"
            >
              <Sparkles size={14} /> {t.upgradePremiumBtn}
            </button>
          </div>
        </SectionCard>

        {showUpgradeCheckout && (
          <CheckoutModal
            title={t.upgradePremium}
            subtitle={t.upgradeDesc}
            amount={50}
            ctaLabel={t.upgradePremium}
            showPromo
            onClose={() => setShowUpgradeCheckout(false)}
            onSuccess={() => {
              onUpdate({ ...competition, tier: 'premium', subscription: 'premium' } as any)
              setShowUpgradeCheckout(false)
            }}
          />
        )}
      </>
    )
  }

  return (
    <SectionCard title={t.brandingSection} theme={theme} defaultOpen>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {t.brandingDesc}
        </p>
        <button
          onClick={resetBranding}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}
        >
          <RefreshCw size={12} /> {t.resetDefaults}
        </button>
      </div>

      {/* Logo */}
      <div className={`mb-5 pb-5 border-b ${dk ? 'border-white/[0.06]' : 'border-[#EEEEEE]'}`}>
        <p className={`text-xs font-medium mb-3 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.logoLabel}</p>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded border flex items-center justify-center flex-shrink-0 overflow-hidden ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            {logoUrl
              ? <img src={logoUrl} alt="Custom logo" className="w-full h-full object-contain p-1" />
              : <Palette size={20} className={dk ? 'text-[#5C5E62]' : 'text-[#D0D1D2]'} />
            }
          </div>
          <div className="flex-1">
            <p className={`text-xs mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.logoHint}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 hover:text-[#EEEEEE]' : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] hover:text-[#121212]'}`}
              >
                <Upload size={12} /> {t.upload}
              </button>
              {logoUrl && (
                <button
                  onClick={() => updateBranding({ logoDataUrl: '' })}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] text-red-400 hover:bg-red-400/10`}
                >
                  {t.remove}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
          </div>
        </div>
      </div>

      {/* Colors */}
      <p className={`text-xs font-medium mb-2 ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.coloursLabel}</p>
      <div className={`divide-y ${dk ? 'divide-white/[0.06]' : 'divide-[#F4F4F4]'}`}>
        {colorRow(t.accentColour,   accent,  'accentColor')}
        {colorRow(t.lightBgLabel,   lightBg, 'lightBg')}
        {colorRow(t.darkBgLabel,    darkBg,  'darkBg')}
      </div>
    </SectionCard>
  )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

export default function SettingsPage({ competition, theme, lang, onUpdate, competitorCount = 0 }: SettingsPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const [draft, setDraft] = useState<Competition>({
    ...competition,
    difficultyLevels: competition.difficultyLevels ?? [],
    traits:           (competition as any).traits ?? [],
  })

  // Full re-init when the user switches to a different competition.
  // Without this, the draft retains the previous competition's branding/logo
  // and can bleed it into the new competition on the first save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDraft({
      ...competition,
      difficultyLevels: competition.difficultyLevels ?? [],
      traits:           (competition as any).traits ?? [],
    } as any)
  }, [competition.id])

  // Keep billing/tier/branding fields in sync with the competition prop.
  // BrandingSection and PaymentModal call onUpdate directly (bypassing the draft),
  // so without this effect the draft would be stale and clobber those fields on save.
  const comp = competition as any
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDraft(prev => ({
      ...prev,
      subscription:       comp.subscription,
      tier:               comp.tier,
      participantLimit:   comp.participantLimit,
      additionalCapacity: comp.additionalCapacity,
      branding:           comp.branding,
    } as any))
  }, [comp.subscription, comp.tier, comp.participantLimit, comp.additionalCapacity, comp.branding])

  function set<K extends keyof Competition>(key: K, value: Competition[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const [newTraitName, setNewTraitName] = useState('')

  function addTrait() {
    if (!newTraitName.trim()) return
    set('traits', [...(draft.traits ?? []), { id: `trait-${Date.now()}`, name: newTraitName.trim() }])
    setNewTraitName('')
  }
  function removeTrait(id: string) { set('traits', (draft.traits ?? []).filter(t => t.id !== id)) }

  function addDifficulty() {
    const maxLevel = Math.max(...(draft.difficultyLevels ?? []).map(d => d.level), 0)
    set('difficultyLevels', [...draft.difficultyLevels, {
      id: `diff-${Date.now()}`, level: maxLevel + 1,
      label: `Level ${maxLevel + 1}`, basePoints: (maxLevel + 1) * 100, zonePoints: (maxLevel + 1) * 50,
    }])
  }
  function removeDifficulty(id: string) {
    if (draft.difficultyLevels.length <= 1) return
    set('difficultyLevels', draft.difficultyLevels.filter(d => d.id !== id))
  }
  function updateDifficulty(id: string, field: keyof DifficultyLevel, value: string | number) {
    set('difficultyLevels', (draft.difficultyLevels ?? []).map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const inputClass   = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]'}`
  const labelCls     = `block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`

  const statusColors: Record<CompetitionStatus, string> = {
    DRAFT:    dk ? 'bg-[#8E8E8E]/10 text-[#8E8E8E] border-[#8E8E8E]/30'    : 'bg-[#8E8E8E]/10 text-[#5C5E62] border-[#8E8E8E]/30',
    LIVE:     'bg-green-400/10 text-green-500 border-green-400/30',
    FINISHED: 'bg-orange-400/10 text-orange-500 border-orange-400/30',
    ARCHIVED: 'bg-red-400/10 text-red-400 border-red-400/30',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.settings}</h1>
          <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>{competition.name}</p>
        </div>
        <button
          onClick={() => onUpdate(draft)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
        >
          <Save size={15} />{t.save}
        </button>
      </div>

      {/* General */}
      <SectionCard title={t.settingsGeneral} theme={theme}>
        <InputField label={t.name}        value={draft.name}        theme={theme} onChange={v => set('name', v)} />
        <InputField label={t.location}    value={draft.location}    theme={theme} onChange={v => set('location', v)} />
        <div className="mb-4">
          <label className={labelCls}>{t.description}</label>
          <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>{t.startDate}</label>
            <input type="datetime-local" value={draft.startDate.slice(0, 16)} onChange={e => set('startDate', e.target.value + ':00')} className={inputClass} />
          </div>
          <div>
            <label className={labelCls}>{t.endDate}</label>
            <input type="datetime-local" value={draft.endDate.slice(0, 16)} onChange={e => set('endDate', e.target.value + ':00')} className={inputClass} />
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className={labelCls}>{t.statusLabel}</label>
          <div className="flex gap-2 flex-wrap">
            {([CompetitionStatus.DRAFT, CompetitionStatus.LIVE, CompetitionStatus.FINISHED, CompetitionStatus.ARCHIVED] as CompetitionStatus[]).map(s => {
              const statusLabelMap: Record<CompetitionStatus, string> = {
                [CompetitionStatus.DRAFT]:    t.statusDraft,
                [CompetitionStatus.LIVE]:     t.statusLive,
                [CompetitionStatus.FINISHED]: t.statusFinished,
                [CompetitionStatus.ARCHIVED]: t.statusArchived,
              }
              return (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={`px-4 py-2 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.status === s ? statusColors[s] : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                {statusLabelMap[s]}
              </button>
            )})}
          </div>
        </div>

        {/* Invite code */}
        <div>
          <label className={labelCls}>{t.inviteCodeLabel}</label>
          <div className={`flex items-center gap-3 px-4 py-3 rounded border ${dk ? 'bg-white/5 border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <Globe size={14} className="text-[#8E8E8E]" />
            <span className="font-medium text-[#7F8BAD] text-sm tracking-widest">{draft.inviteCode}</span>
            <button
              onClick={() => navigator.clipboard.writeText(draft.inviteCode)}
              className={`ml-auto text-xs font-medium px-3 py-1.5 rounded transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10' : 'bg-[#EEEEEE] text-[#5C5E62] hover:bg-[#D0D1D2]'}`}
            >
              {t.copyLabel}
            </button>
          </div>
        </div>

        {/* Visibility */}
        <div className="mt-4">
          <label className={labelCls}>{t.visibility}</label>
          <p className={`text-xs mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {t.visibilityDesc}
          </p>
          <div className={`flex rounded border overflow-hidden ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
            {(['public', 'private'] as const).map((v, i) => {
              const active = (draft as any).visibility === v || (!(draft as any).visibility && v === 'private')
              return (
                <button
                  key={v}
                  onClick={() => set('visibility' as any, v)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors duration-[330ms]
                    ${i > 0 ? dk ? 'border-l border-white/10' : 'border-l border-[#EEEEEE]' : ''}
                    ${active
                      ? v === 'public'
                        ? 'bg-[#7F8BAD]/10 text-[#7F8BAD]'
                        : 'bg-amber-400/10 text-amber-500'
                      : dk
                        ? 'text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/5'
                        : 'text-[#8E8E8E] hover:text-[#5C5E62] hover:bg-[#F4F4F4]'
                    }
                  `}
                >
                  {v === 'public' ? '🌐' : '🔒'} {v === 'public' ? t.visibilityPublic : t.visibilityPrivate}
                </button>
              )
            })}
          </div>
        </div>

        {/* Join Password */}
        <div className="mt-4">
          <label className={labelCls}>{t.joinPassword}</label>
          <p className={`text-xs mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {t.joinPasswordDesc}
          </p>
          <div className="relative">
            <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
            <input
              type="text"
              value={draft.joinPassword ?? ''}
              onChange={e => set('joinPassword', e.target.value || undefined)}
              placeholder={t.leaveBlank}
              className={`${inputClass} pl-9`}
            />
          </div>
          {draft.joinPassword && (
            <p className="text-xs mt-1.5 text-amber-500">⚠ {t.joinPasswordHint}</p>
          )}
        </div>
      </SectionCard>

      {/* Scoring */}
      <SectionCard title={t.settingsScoring} theme={theme}>
        <div className="mb-6">
          <label className={labelCls}>{t.scoringSystem}</label>
          <div className="flex gap-2">
            {[ScoringType.TRADITIONAL, ScoringType.DYNAMIC].map(s => (
              <button
                key={s}
                onClick={() => set('scoringType', s)}
                className={`flex-1 py-3 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.scoringType === s ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                {s === ScoringType.TRADITIONAL ? t.traditional : t.dynamic}
              </button>
            ))}
          </div>
        </div>

        {draft.scoringType === ScoringType.DYNAMIC && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InputField label={t.dynamicPot}  value={draft.dynamicPot ?? 1000}        type="number" theme={theme} onChange={v => set('dynamicPot', Number(v))}          hint="Total points shared per boulder" />
            <InputField label={t.minPoints}   value={draft.minDynamicPoints ?? 0}     type="number" theme={theme} onChange={v => set('minDynamicPoints', Number(v))}     hint="Minimum points per completion" />
          </div>
        )}

        <InputField label={t.topKBoulders} value={draft.topKBoulders ?? ''} type="number" theme={theme} onChange={v => set('topKBoulders', v ? Number(v) : undefined)} hint={t.topKHint} />

        {/* Attempt Tracking */}
        <div className="mt-2 mb-6">
          <label className={labelCls}>{t.attemptTracking}</label>
          <p className={`text-xs mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.attemptTrackingHint}</p>
          <div className="flex flex-col gap-2 mb-4">
            {([
              { value: 'none',          label: t.optTopOnly,      desc: t.optTopOnlyDesc },
              { value: 'fixed_options', label: t.optFixedOptions,  desc: t.optFixedOptionsDesc },
              { value: 'count',         label: t.optFreeCount,     desc: t.optFreeCountDesc },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('attemptTracking', opt.value)}
                className={`text-left px-4 py-3 rounded border transition-colors duration-[330ms] ${draft.attemptTracking === opt.value ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/30' : dk ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.attemptTracking === opt.value ? 'border-[#7F8BAD] bg-[#7F8BAD]' : dk ? 'border-[#5C5E62]' : 'border-[#D0D1D2]'}`}>
                    {draft.attemptTracking === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${draft.attemptTracking === opt.value ? 'text-[#7F8BAD]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {draft.attemptTracking === 'fixed_options' && (
            <InputField
              label={t.maxFixedAttempts}
              value={draft.maxFixedAttempts}
              type="number" min={2} max={10}
              theme={theme}
              onChange={v => set('maxFixedAttempts', Math.max(2, Math.min(10, Number(v))))}
              hint={t.maxFixedAttemptsHint(draft.maxFixedAttempts)}
            />
          )}
        </div>

        {/* Zone Scoring */}
        <div className="mb-6">
          <label className={labelCls}>{t.zoneScoring}</label>
          <div className="flex gap-2">
            {([
              { value: 'adds_to_score',    label: t.zoneAddsScore,        desc: t.zoneAddsScoreDesc },
              { value: 'tie_breaker_only', label: t.zoneTiebreakerOnly,   desc: t.zoneTiebreakerDesc },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('zoneScoring', opt.value)}
                className={`flex-1 py-3 px-4 rounded text-xs font-medium border transition-colors duration-[330ms] text-left ${draft.zoneScoring === opt.value ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="font-medium mb-1">{opt.label}</div>
                <div className={`text-[10px] font-normal ${draft.zoneScoring === opt.value ? 'text-[#7F8BAD]/70' : dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Judging Method */}
        <div className="mb-6">
          <label className={labelCls}>{t.judgingMethod}</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'self_scoring',       title: t.judgingFull,     desc: t.judgingFullDesc },
              { value: 'self_with_approval', title: t.judgingApproval, desc: t.judgingApprovalDesc },
              { value: 'judge_required',     title: t.judgingHybrid,   desc: t.judgingHybridDesc },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('scoringMethod', opt.value)}
                className={`text-left px-4 py-4 rounded border transition-colors duration-[330ms] ${draft.scoringMethod === opt.value ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/30' : dk ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.scoringMethod === opt.value ? 'border-[#7F8BAD] bg-[#7F8BAD]' : dk ? 'border-[#5C5E62]' : 'border-[#D0D1D2]'}`}>
                    {draft.scoringMethod === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${draft.scoringMethod === opt.value ? 'text-[#7F8BAD]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{opt.title}</p>
                    <p className={`text-xs mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Penalty */}
        <div className={`p-4 rounded border ${dk ? 'border-white/10 bg-white/[0.02]' : 'border-[#EEEEEE] bg-[#F4F4F4]'}`}>
          <ToggleRow label={t.penalizeAttempts} desc={t.penalizeDesc} value={draft.penalizeAttempts} theme={theme} onChange={v => set('penalizeAttempts', v)} />
          {draft.penalizeAttempts && (
            <div className={`grid grid-cols-2 gap-4 mt-4 pt-4 border-t ${dk ? 'border-white/5' : 'border-[#EEEEEE]'}`}>
              <div>
                <label className={labelCls}>{t.penaltyType}</label>
                <div className="flex gap-2">
                  {(['fixed', 'percent'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => set('penaltyType', pt)}
                      className={`flex-1 py-2 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.penaltyType === pt ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE]'}`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <InputField
                label={draft.penaltyType === 'percent' ? t.penaltyValuePct : t.penaltyValuePts}
                value={draft.penaltyValue} type="number"
                theme={theme}
                onChange={v => set('penaltyValue', Number(v))}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Traits / Divisions */}
      <SectionCard title={t.traitsSection} theme={theme}>
        <p className={`text-xs mb-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {t.traitsDesc}
        </p>
        <ToggleRow
          label={t.requireTraits}
          desc={t.requireTraitsDesc}
          value={draft.requireTraits ?? false}
          theme={theme}
          onChange={v => set('requireTraits', v)}
        />
        <div className={`h-px my-3 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`} />
        <div className="space-y-2 mb-4">
          {(draft.traits ?? []).length === 0 && (
            <p className={`text-xs text-center py-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.noTraits}
            </p>
          )}
          {(draft.traits ?? []).map(trait => (
            <div key={trait.id} className={`flex items-center justify-between px-4 py-3 rounded border ${dk ? 'bg-white/5 border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
              <span className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{trait.name}</span>
              <button
                onClick={() => removeTrait(trait.id)}
                className={`p-1.5 rounded transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10' : 'text-[#D0D1D2] hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTraitName}
            onChange={e => setNewTraitName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTrait()}
            placeholder={t.traitPlaceholder}
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={addTrait}
            disabled={!newTraitName.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} />{t.addLabel}
          </button>
        </div>
      </SectionCard>

      {/* Difficulty Levels */}
      <SectionCard title={t.difficultyLevels} theme={theme} defaultOpen={false}>
        <div className="space-y-2 mb-4">
          {(draft.difficultyLevels ?? []).map(d => (
            <div key={d.id} className={`rounded border p-3 ${dk ? 'border-white/10 bg-white/[0.02]' : 'border-[#EEEEEE] bg-[#FAFAFA]'}`}>
              {/* Row 1: Lvl badge + Label input */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${dk ? 'bg-white/10 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>
                  {d.level}
                </div>
                <input
                  type="text"
                  value={d.label}
                  onChange={e => updateDifficulty(d.id, 'label', e.target.value)}
                  placeholder={t.labelHint}
                  className={`${inputClass} py-2 text-sm flex-1`}
                />
              </div>
              {/* Row 2: Top pts + Zone pts + Delete */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className={`text-[10px] font-medium mb-1 block ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.topPts}</label>
                  <input type="number" value={d.basePoints} onChange={e => updateDifficulty(d.id, 'basePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
                </div>
                <div className="flex-1">
                  <label className={`text-[10px] font-medium mb-1 block ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.zonePts}</label>
                  <input type="number" value={d.zonePoints} onChange={e => updateDifficulty(d.id, 'zonePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
                </div>
                <button
                  onClick={() => removeDifficulty(d.id)}
                  disabled={draft.difficultyLevels.length <= 1}
                  className={`p-2 rounded transition-colors duration-[330ms] flex-shrink-0 mt-5 ${dk ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10' : 'text-[#D0D1D2] hover:text-red-500 hover:bg-red-50'} disabled:opacity-20 disabled:cursor-not-allowed`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addDifficulty}
          className={`w-full py-3 rounded border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-[330ms] ${dk ? 'border-white/10 text-[#5C5E62] hover:border-[#7F8BAD]/30 hover:text-[#7F8BAD]' : 'border-[#EEEEEE] text-[#8E8E8E] hover:border-[#7F8BAD]/40 hover:text-[#7F8BAD]'}`}
        >
          <Plus size={14} />{t.addDifficultyLevel}
        </button>
      </SectionCard>

      {/* Billing & Capacity — only shown once competition has a subscription */}
      {(competition as any).subscription && <BillingSection
        competition={competition}
        competitorCount={competitorCount}
        theme={theme}
        lang={lang}
        onUpdate={onUpdate}
      />}

      {/* Branding — shown when subscription exists; premium gates the editor */}
      {(competition as any).subscription && <BrandingSection
        competition={competition}
        theme={theme}
        lang={lang}
        onUpdate={onUpdate}
      />}

      {/* Access Control */}
      <SectionCard title={t.accessControl} theme={theme}>
        <ToggleRow label={t.selfScoring}  desc={t.selfScoringDesc} value={draft.canSelfScore} theme={theme} onChange={v => set('canSelfScore', v)} />
        <div className={`h-px my-2 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`} />
        <ToggleRow label={t.lockResults}  desc={t.lockDesc}        value={draft.isLocked}    theme={theme} onChange={v => set('isLocked', v)} />
      </SectionCard>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => onUpdate(draft)}
          className="flex items-center gap-2 px-6 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
        >
          <Save size={15} />{t.save}
        </button>
      </div>
    </div>
  )
}
