import { useState } from 'react'
import { Check, ChevronRight, User } from 'lucide-react'
import type { Competitor, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

export interface PostRegistrationModalProps {
  user:        Competitor
  competition: Competition
  onComplete:  (updated: Competitor) => void
  theme:       'light' | 'dark'
  lang:        Language
}

export default function PostRegistrationModal({ user, competition, onComplete, theme, lang }: PostRegistrationModalProps) {
  const dk = theme === 'dark'
  const t  = translations[lang]
  const GENDERS = [t.profileMale, t.profileFemale, t.profileNonBinary, t.profilePreferNot]
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

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
      <div className={`rounded border w-full max-w-[480px] overflow-hidden ${dk ? 'bg-[#121212] border-white/[0.08]' : 'bg-white border-[#EEEEEE]'}`}>

        {/* Progress bar */}
        <div className={`h-0.5 ${dk ? 'bg-white/[0.06]' : 'bg-[#F4F4F4]'}`}>
          <div
            className="h-full bg-[#7F8BAD] transition-all duration-[330ms]"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-9">
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div className={`w-11 h-11 rounded flex items-center justify-center border ${dk ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/20' : 'bg-[#7F8BAD]/10 border-[#7F8BAD]/20'}`}>
              <User size={20} className="text-[#7F8BAD]" />
            </div>
            <div>
              <h2 className={`text-lg font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                {step === 1 ? t.postRegYourProfile : t.postRegYourCategories}
              </h2>
              <p className={`text-sm mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.postRegStepOf(step, 2, step === 1 ? t.postRegGenderLabel : competition.name)}
              </p>
            </div>
          </div>

          {/* Step 1 — Gender */}
          {step === 1 && (
            <>
              <p className={`text-sm mb-5 leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.postRegGenderHelps}
              </p>
              <div className="flex flex-col gap-2.5">
                {GENDERS.map(g => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`
                      flex items-center justify-between px-4 py-3.5 rounded border cursor-pointer transition-colors duration-[330ms] text-left
                      ${gender === g
                        ? 'bg-[#7F8BAD]/[0.08] border-[#7F8BAD]/50'
                        : dk
                          ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'
                          : 'bg-[#F4F4F4] border-[#EEEEEE] hover:border-[#D0D1D2]'
                      }
                    `}
                  >
                    <span className={`text-sm font-medium ${gender === g ? 'text-[#7F8BAD]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
                      {g}
                    </span>
                    {gender === g && (
                      <div className="w-5 h-5 rounded-full bg-[#7F8BAD] flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed1}
                className={`
                  mt-6 w-full py-3.5 rounded text-sm font-medium transition-colors duration-[330ms]
                  flex items-center justify-center gap-2
                  ${canProceed1
                    ? 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                    : dk ? 'bg-white/[0.06] text-[#5C5E62] cursor-not-allowed' : 'bg-[#F4F4F4] text-[#8E8E8E] cursor-not-allowed'
                  }
                `}
              >
                {t.postRegContinue} <ChevronRight size={17} />
              </button>
            </>
          )}

          {/* Step 2 — Traits */}
          {step === 2 && (
            <>
              {availableTraits.length > 0 ? (
                <>
                  <p className={`text-sm mb-5 leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                    {t.postRegSelectCats(competition.name)}
                  </p>
                  <div className="flex flex-wrap gap-2.5 mb-6">
                    {availableTraits.map(trait => {
                      const active = selectedIds.includes(trait.id)
                      return (
                        <button
                          key={trait.id}
                          onClick={() => toggleTrait(trait.id)}
                          className={`
                            px-4 py-2.5 rounded border cursor-pointer text-sm font-medium transition-colors duration-[330ms]
                            flex items-center gap-2
                            ${active
                              ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/50 text-[#7F8BAD]'
                              : dk
                                ? 'bg-white/[0.03] border-white/[0.08] text-[#D0D1D2] hover:border-white/15'
                                : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#393C41] hover:border-[#D0D1D2]'
                            }
                          `}
                        >
                          {active && <Check size={13} strokeWidth={3} />}{trait.name}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className={`text-sm mb-6 leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                  {t.postRegNoCats}
                </p>
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3.5 rounded text-sm font-medium border transition-colors duration-[330ms] ${dk ? 'border-white/10 text-[#5C5E62] hover:text-[#D0D1D2]' : 'border-[#EEEEEE] text-[#8E8E8E] hover:text-[#393C41]'}`}
                >
                  {t.postRegBack}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!canProceed2}
                  className={`
                    flex-[2] py-3.5 rounded text-sm font-medium transition-colors duration-[330ms]
                    ${canProceed2
                      ? 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                      : dk ? 'bg-white/[0.06] text-[#5C5E62] cursor-not-allowed' : 'bg-[#F4F4F4] text-[#8E8E8E] cursor-not-allowed'
                    }
                  `}
                >
                  {availableTraits.length === 0 ? t.enterCompetition : t.postRegSaveAndContinue}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
