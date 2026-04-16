import { useState } from 'react'
import {
  Save, Plus, Trash2, Globe,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Lock
} from 'lucide-react'
import type { Competition, DifficultyLevel } from '../types'
import { CompetitionStatus, ScoringType } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

interface SettingsPageProps {
  competition: Competition
  theme:       'light' | 'dark'
  lang:        Language
  onUpdate:    (updated: Competition) => void
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
          ? <ToggleRight size={32} className="text-[#3E6AE1]" />
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
  const cls = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#3E6AE1]/50' : 'bg-white border-[#EEEEEE] text-[#171A20] focus:border-[#3E6AE1]'}`
  return (
    <div className="mb-4">
      <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{label}</label>
      <input type={type} value={value} min={min} max={max} onChange={e => onChange(e.target.value)} className={cls} />
      {hint && <p className={`text-xs mt-1.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage({ competition, theme, lang, onUpdate }: SettingsPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const [draft, setDraft] = useState<Competition>({
    ...competition,
    difficultyLevels: competition.difficultyLevels ?? [],
    traits:           (competition as any).traits ?? [],
  })

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

  const inputClass   = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#3E6AE1]/50' : 'bg-white border-[#EEEEEE] text-[#171A20] focus:border-[#3E6AE1]'}`
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
          <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>{t.settings}</h1>
          <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>{competition.name}</p>
        </div>
        <button
          onClick={() => onUpdate(draft)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3E6AE1] text-white rounded font-medium text-sm hover:bg-[#3056C7] transition-colors duration-[330ms]"
        >
          <Save size={15} />{t.save}
        </button>
      </div>

      {/* General */}
      <SectionCard title="General" theme={theme}>
        <InputField label={t.name}        value={draft.name}        theme={theme} onChange={v => set('name', v)} />
        <InputField label={t.location}    value={draft.location}    theme={theme} onChange={v => set('location', v)} />
        <div className="mb-4">
          <label className={labelCls}>{t.description}</label>
          <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="datetime-local" value={draft.startDate.slice(0, 16)} onChange={e => set('startDate', new Date(e.target.value).toISOString())} className={inputClass} />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="datetime-local" value={draft.endDate.slice(0, 16)} onChange={e => set('endDate', new Date(e.target.value).toISOString())} className={inputClass} />
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className={labelCls}>Status</label>
          <div className="flex gap-2 flex-wrap">
            {([CompetitionStatus.DRAFT, CompetitionStatus.LIVE, CompetitionStatus.FINISHED, CompetitionStatus.ARCHIVED] as CompetitionStatus[]).map(s => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={`px-4 py-2 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.status === s ? statusColors[s] : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Invite code */}
        <div>
          <label className={labelCls}>Invite Code</label>
          <div className={`flex items-center gap-3 px-4 py-3 rounded border ${dk ? 'bg-white/5 border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <Globe size={14} className="text-[#8E8E8E]" />
            <span className="font-medium text-[#3E6AE1] text-sm tracking-widest">{draft.inviteCode}</span>
            <button
              onClick={() => navigator.clipboard.writeText(draft.inviteCode)}
              className={`ml-auto text-xs font-medium px-3 py-1.5 rounded transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10' : 'bg-[#EEEEEE] text-[#5C5E62] hover:bg-[#D0D1D2]'}`}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Visibility */}
        <div className="mt-4">
          <label className={labelCls}>Visibility</label>
          <p className={`text-xs mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            Public events appear in the discover list. Private events are invite-only.
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
                        ? 'bg-[#3E6AE1]/10 text-[#3E6AE1]'
                        : 'bg-amber-400/10 text-amber-500'
                      : dk
                        ? 'text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/5'
                        : 'text-[#8E8E8E] hover:text-[#5C5E62] hover:bg-[#F4F4F4]'
                    }
                  `}
                >
                  {v === 'public' ? '🌐' : '🔒'} {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Join Password */}
        <div className="mt-4">
          <label className={labelCls}>Join Password</label>
          <p className={`text-xs mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            Competitors must enter this password after using the invite code. Leave blank for open access.
          </p>
          <div className="relative">
            <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
            <input
              type="text"
              value={draft.joinPassword ?? ''}
              onChange={e => set('joinPassword', e.target.value || undefined)}
              placeholder="Leave blank for open access"
              className={`${inputClass} pl-9`}
            />
          </div>
          {draft.joinPassword && (
            <p className="text-xs mt-1.5 text-amber-500">⚠ Stored in plain text — avoid reusing sensitive passwords.</p>
          )}
        </div>
      </SectionCard>

      {/* Scoring */}
      <SectionCard title="Scoring" theme={theme}>
        <div className="mb-6">
          <label className={labelCls}>{t.scoringSystem}</label>
          <div className="flex gap-2">
            {[ScoringType.TRADITIONAL, ScoringType.DYNAMIC].map(s => (
              <button
                key={s}
                onClick={() => set('scoringType', s)}
                className={`flex-1 py-3 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.scoringType === s ? 'bg-[#3E6AE1]/10 text-[#3E6AE1] border-[#3E6AE1]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
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

        <InputField label="Top K Boulders" value={draft.topKBoulders ?? ''} type="number" theme={theme} onChange={v => set('topKBoulders', v ? Number(v) : undefined)} hint="Only count the best N boulders. Leave empty to count all." />

        {/* Attempt Tracking */}
        <div className="mt-2 mb-6">
          <label className={labelCls}>Attempt Tracking (default for all boulders)</label>
          <p className={`text-xs mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Judge-required boulders always use "Free count". Individual boulders can override this.</p>
          <div className="flex flex-col gap-2 mb-4">
            {([
              { value: 'none',          label: 'Top / No top only', desc: 'Just record whether topped — no attempt count' },
              { value: 'fixed_options', label: 'Fixed options',     desc: 'Pill buttons (1 / 2 / … / N+) — quick to tap on mobile' },
              { value: 'count',         label: 'Free count',        desc: '+/− stepper — records any number precisely' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('attemptTracking', opt.value)}
                className={`text-left px-4 py-3 rounded border transition-colors duration-[330ms] ${draft.attemptTracking === opt.value ? 'bg-[#3E6AE1]/10 border-[#3E6AE1]/30' : dk ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.attemptTracking === opt.value ? 'border-[#3E6AE1] bg-[#3E6AE1]' : dk ? 'border-[#5C5E62]' : 'border-[#D0D1D2]'}`}>
                    {draft.attemptTracking === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${draft.attemptTracking === opt.value ? 'text-[#3E6AE1]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {draft.attemptTracking === 'fixed_options' && (
            <InputField
              label="Max fixed attempts (N)"
              value={draft.maxFixedAttempts}
              type="number" min={2} max={10}
              theme={theme}
              onChange={v => set('maxFixedAttempts', Math.max(2, Math.min(10, Number(v))))}
              hint={`Buttons: 1, 2, … ${draft.maxFixedAttempts - 1}, ${draft.maxFixedAttempts}+`}
            />
          )}
        </div>

        {/* Zone Scoring */}
        <div className="mb-6">
          <label className={labelCls}>Zone Scoring</label>
          <div className="flex gap-2">
            {([
              { value: 'adds_to_score',    label: 'Adds to score',    desc: 'Zone points add even without a top' },
              { value: 'tie_breaker_only', label: 'Tie-breaker only', desc: 'Zone does not add points' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('zoneScoring', opt.value)}
                className={`flex-1 py-3 px-4 rounded text-xs font-medium border transition-colors duration-[330ms] text-left ${draft.zoneScoring === opt.value ? 'bg-[#3E6AE1]/10 text-[#3E6AE1] border-[#3E6AE1]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="font-medium mb-1">{opt.label}</div>
                <div className={`text-[10px] font-normal ${draft.zoneScoring === opt.value ? 'text-[#3E6AE1]/70' : dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Judging Method */}
        <div className="mb-6">
          <label className={labelCls}>Judging Method</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'self_scoring',      title: 'Fully self-scoring',          desc: 'Competitors log all their own tops.' },
              { value: 'self_with_approval', title: 'Self-scoring with approval', desc: 'Competitors log, a judge approves.' },
              { value: 'judge_required',    title: 'Judge logging (hybrid)',       desc: 'Puntuable boulders require a judge.' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => set('scoringMethod', opt.value)}
                className={`text-left px-4 py-4 rounded border transition-colors duration-[330ms] ${draft.scoringMethod === opt.value ? 'bg-[#3E6AE1]/10 border-[#3E6AE1]/30' : dk ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.scoringMethod === opt.value ? 'border-[#3E6AE1] bg-[#3E6AE1]' : dk ? 'border-[#5C5E62]' : 'border-[#D0D1D2]'}`}>
                    {draft.scoringMethod === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${draft.scoringMethod === opt.value ? 'text-[#3E6AE1]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{opt.title}</p>
                    <p className={`text-xs mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Penalty */}
        <div className={`p-4 rounded border ${dk ? 'border-white/10 bg-white/[0.02]' : 'border-[#EEEEEE] bg-[#F4F4F4]'}`}>
          <ToggleRow label="Penalize Attempts" desc="Deduct points for extra attempts beyond the first" value={draft.penalizeAttempts} theme={theme} onChange={v => set('penalizeAttempts', v)} />
          {draft.penalizeAttempts && (
            <div className={`grid grid-cols-2 gap-4 mt-4 pt-4 border-t ${dk ? 'border-white/5' : 'border-[#EEEEEE]'}`}>
              <div>
                <label className={labelCls}>Penalty Type</label>
                <div className="flex gap-2">
                  {(['fixed', 'percent'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => set('penaltyType', pt)}
                      className={`flex-1 py-2 rounded text-xs font-medium border transition-colors duration-[330ms] ${draft.penaltyType === pt ? 'bg-[#3E6AE1]/10 text-[#3E6AE1] border-[#3E6AE1]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE]'}`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <InputField
                label={`Penalty Value (${draft.penaltyType === 'percent' ? '%' : 'pts'})`}
                value={draft.penaltyValue} type="number"
                theme={theme}
                onChange={v => set('penaltyValue', Number(v))}
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Traits / Divisions */}
      <SectionCard title="Traits / Divisions" theme={theme}>
        <p className={`text-xs mb-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          Traits are freeform labels competitors self-select when joining — e.g. "Open Men", "Youth U18", "Masters 40+". Competitors can hold multiple traits simultaneously.
        </p>
        <ToggleRow
          label="Require trait selection on join"
          desc="Competitors must pick at least one trait before they can join"
          value={draft.requireTraits ?? false}
          theme={theme}
          onChange={v => set('requireTraits', v)}
        />
        <div className={`h-px my-3 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`} />
        <div className="space-y-2 mb-4">
          {(draft.traits ?? []).length === 0 && (
            <p className={`text-xs text-center py-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              No traits defined yet — add one below.
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
            placeholder="e.g. Open Men, Youth U18, Masters 40+…"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={addTrait}
            disabled={!newTraitName.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-[#3E6AE1] text-white rounded font-medium text-sm hover:bg-[#3056C7] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={14} />Add
          </button>
        </div>
      </SectionCard>

      {/* Difficulty Levels */}
      <SectionCard title="Difficulty Levels" theme={theme} defaultOpen={false}>
        <div className={`grid grid-cols-[40px_1fr_120px_120px_44px] gap-2 px-3 py-2 mb-2 text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <div>Lvl</div><div>Label</div><div>Top pts</div><div>Zone pts</div><div></div>
        </div>
        <div className="space-y-2 mb-4">
          {(draft.difficultyLevels ?? []).map(d => (
            <div key={d.id} className="grid grid-cols-[40px_1fr_120px_120px_44px] gap-2 items-center">
              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${dk ? 'bg-white/5 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>{d.level}</div>
              <input type="text"   value={d.label}      onChange={e => updateDifficulty(d.id, 'label',      e.target.value)}        className={`${inputClass} py-2 text-sm`} />
              <input type="number" value={d.basePoints} onChange={e => updateDifficulty(d.id, 'basePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
              <input type="number" value={d.zonePoints} onChange={e => updateDifficulty(d.id, 'zonePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
              <button
                onClick={() => removeDifficulty(d.id)}
                disabled={draft.difficultyLevels.length <= 1}
                className={`p-2 rounded transition-colors duration-[330ms] flex-shrink-0 ${dk ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10' : 'text-[#D0D1D2] hover:text-red-500 hover:bg-red-50'} disabled:opacity-20 disabled:cursor-not-allowed`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addDifficulty}
          className={`w-full py-3 rounded border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-[330ms] ${dk ? 'border-white/10 text-[#5C5E62] hover:border-[#3E6AE1]/30 hover:text-[#3E6AE1]' : 'border-[#EEEEEE] text-[#8E8E8E] hover:border-[#3E6AE1]/40 hover:text-[#3E6AE1]'}`}
        >
          <Plus size={14} />Add Difficulty Level
        </button>
      </SectionCard>

      {/* Access Control */}
      <SectionCard title="Access Control" theme={theme}>
        <ToggleRow label="Self Scoring"  desc="Allow competitors to log their own tops and attempts" value={draft.canSelfScore} theme={theme} onChange={v => set('canSelfScore', v)} />
        <div className={`h-px my-2 ${dk ? 'bg-white/5' : 'bg-[#EEEEEE]'}`} />
        <ToggleRow label="Lock Results" desc="Freeze all scores — competitors can no longer log tops"  value={draft.isLocked}    theme={theme} onChange={v => set('isLocked', v)} />
      </SectionCard>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => onUpdate(draft)}
          className="flex items-center gap-2 px-6 py-3 bg-[#3E6AE1] text-white rounded font-medium text-sm hover:bg-[#3056C7] transition-colors duration-[330ms]"
        >
          <Save size={15} />{t.save}
        </button>
      </div>
    </div>
  )
}
