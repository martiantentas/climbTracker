import { useState } from 'react'
import { Check, ChevronRight, User } from 'lucide-react'
import type { Competitor, Competition } from '../types'

export interface PostRegistrationModalProps {
  user:        Competitor
  competition: Competition
  onComplete:  (updated: Competitor) => void
  theme:       'light' | 'dark'
}

const GENDERS = ['Male', 'Female', 'Prefer not to say']

export default function PostRegistrationModal({ user, competition, onComplete, theme }: PostRegistrationModalProps) {
  const dk = theme === 'dark'
  const comp = competition as any
  const availableTraits: { id: string; name: string }[] =
    comp.traits?.length ? comp.traits : comp.categories?.length ? comp.categories : []

  const [step,        setStep]        = useState<1 | 2>(1)
  const [gender,      setGender]      = useState((user as any).gender ?? '')
  const [selectedIds, setSelectedIds] = useState<string[]>((user as any).traitIds?.length ? (user as any).traitIds : [])

  const toggleTrait = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleFinish = () =>
    onComplete({ ...user, gender, traitIds: selectedIds, categoryId: selectedIds[0] ?? (user as any).categoryId ?? '' } as any)

  const canProceed1 = gender !== ''
  const canProceed2 = availableTraits.length === 0 || selectedIds.length > 0
  const bg = dk ? '#121212' : '#ffffff'
  const border = dk ? 'rgba(255,255,255,0.08)' : '#e2e8f0'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 24, width: '100%', maxWidth: 480, overflow: 'hidden' }}>

        {/* Progress */}
        <div style={{ height: 3, background: dk ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
          <div style={{ height: '100%', borderRadius: 999, background: '#38bdf8', width: step === 1 ? '50%' : '100%', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: 36 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: dk ? '#f1f5f9' : '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {step === 1 ? 'Your profile' : 'Your categories'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
                Step {step} of 2 · {step === 1 ? 'Gender' : competition.name}
              </p>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>This helps organisers set up category filters and leaderboard breakdowns.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GENDERS.map(g => (
                  <button key={g} onClick={() => setGender(g)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, cursor: 'pointer', border: `1px solid ${gender === g ? 'rgba(56,189,248,0.5)' : border}`, background: gender === g ? 'rgba(56,189,248,0.08)' : dk ? 'rgba(255,255,255,0.03)' : '#f8fafc', transition: 'all 0.15s', textAlign: 'left' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: gender === g ? '#38bdf8' : dk ? '#e2e8f0' : '#334155' }}>{g}</span>
                    {gender === g && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="#0c1a22" strokeWidth={3} /></div>}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!canProceed1} style={{ marginTop: 24, width: '100%', padding: '14px 0', borderRadius: 12, background: canProceed1 ? '#38bdf8' : dk ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: canProceed1 ? '#0c1a22' : '#475569', fontSize: 15, fontWeight: 800, border: 'none', cursor: canProceed1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                Continue <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              {availableTraits.length > 0 ? (
                <>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
                    Select your categories for <strong style={{ color: dk ? '#94a3b8' : '#334155' }}>{competition.name}</strong>. You can update these later from Event Settings.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                    {availableTraits.map(trait => {
                      const active = selectedIds.includes(trait.id)
                      return (
                        <button key={trait.id} onClick={() => toggleTrait(trait.id)} style={{ padding: '10px 20px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : border}`, background: active ? 'rgba(56,189,248,0.1)' : dk ? 'rgba(255,255,255,0.03)' : '#f8fafc', fontSize: 14, fontWeight: 700, color: active ? '#38bdf8' : dk ? '#94a3b8' : '#475569', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                          {active && <Check size={13} strokeWidth={3} />}{trait.name}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>No categories defined yet — you can update your profile later from Event Settings.</p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: `1px solid ${border}`, background: 'none', color: '#64748b' }}>Back</button>
                <button onClick={handleFinish} disabled={!canProceed2} style={{ flex: 2, padding: '13px 0', borderRadius: 12, background: canProceed2 ? '#38bdf8' : dk ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: canProceed2 ? '#0c1a22' : '#475569', fontSize: 15, fontWeight: 800, border: 'none', cursor: canProceed2 ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                  {availableTraits.length === 0 ? 'Enter Competition' : 'Save & Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}