import { useState } from 'react'
import {
  Save, Plus, Trash2, Globe,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Lock
} from 'lucide-react'
import type { Competition, Trait, DifficultyLevel } from '../types'
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
  return (
    <div className={`rounded-2xl border overflow-hidden mb-4 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${theme === 'dark' ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-slate-50 hover:bg-slate-100'}`}>
        <span className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{title}</span>
        {open ? <ChevronUp size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} /> : <ChevronDown size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />}
      </button>
      {open && <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>{children}</div>}
    </div>
  )
}

function ToggleRow({ label, desc, value, theme, onChange }: {
  label: string; desc: string; value: boolean; theme: 'light' | 'dark'; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className="flex-shrink-0">
        {value ? <ToggleRight size={32} className="text-sky-400" /> : <ToggleLeft size={32} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} />}
      </button>
    </div>
  )
}

function InputField({ label, value, type = 'text', theme, onChange, hint, min, max }: {
  label: string; value: string | number; type?: string; theme: 'light' | 'dark'
  onChange: (v: string) => void; hint?: string; min?: number; max?: number
}) {
  const cls = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'}`
  return (
    <div className="mb-4">
      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
      <input type={type} value={value} min={min} max={max} onChange={e => onChange(e.target.value)} className={cls} />
      {hint && <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage({ competition, theme, lang, onUpdate }: SettingsPageProps) {
  const t = translations[lang]
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
    set('difficultyLevels', [...draft.difficultyLevels, { id: `diff-${Date.now()}`, level: maxLevel + 1, label: `Level ${maxLevel + 1}`, basePoints: (maxLevel + 1) * 100, zonePoints: (maxLevel + 1) * 50 }])
  }
  function removeDifficulty(id: string) {
    if (draft.difficultyLevels.length <= 1) return
    set('difficultyLevels', draft.difficultyLevels.filter(d => d.id !== id))
  }
  function updateDifficulty(id: string, field: keyof DifficultyLevel, value: string | number) {
    set('difficultyLevels', (draft.difficultyLevels ?? []).map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'}`
  const labelCls   = `block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`
  const statusColors: Record<CompetitionStatus, string> = {
    DRAFT: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
    LIVE: 'bg-green-400/10 text-green-400 border-green-400/20',
    FINISHED: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    ARCHIVED: 'bg-red-400/10 text-red-400 border-red-400/20',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.settings}</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{competition.name}</p>
        </div>
        <button onClick={() => onUpdate(draft)} className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"><Save size={16} />{t.save}</button>
      </div>

      {/* General */}
      <SectionCard title="General" theme={theme}>
        <InputField label={t.name} value={draft.name} theme={theme} onChange={v => set('name', v)} />
        <InputField label={t.location} value={draft.location} theme={theme} onChange={v => set('location', v)} />
        <div className="mb-4"><label className={labelCls}>{t.description}</label><textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} /></div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className={labelCls}>Start Date</label><input type="datetime-local" value={draft.startDate.slice(0, 16)} onChange={e => set('startDate', new Date(e.target.value).toISOString())} className={inputClass} /></div>
          <div><label className={labelCls}>End Date</label><input type="datetime-local" value={draft.endDate.slice(0, 16)} onChange={e => set('endDate', new Date(e.target.value).toISOString())} className={inputClass} /></div>
        </div>
        <div className="mb-4">
          <label className={labelCls}>Status</label>
          <div className="flex gap-2 flex-wrap">
            {([CompetitionStatus.DRAFT, CompetitionStatus.LIVE, CompetitionStatus.FINISHED, CompetitionStatus.ARCHIVED] as CompetitionStatus[]).map(s => (
              <button key={s} onClick={() => set('status', s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${draft.status === s ? statusColors[s] : theme === 'dark' ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Invite Code</label>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <Globe size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            <span className="font-black tracking-widest text-sky-400 text-sm">{draft.inviteCode}</span>
            <button onClick={() => navigator.clipboard.writeText(draft.inviteCode)} className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>Copy</button>
          </div>
        </div>

        {/* ── Visibility ── */}
        <div className="mt-4">
          <label className={labelCls}>Visibility</label>
          <p className={`text-[11px] mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Public events appear in the discover list. Private events are invite-only — only accessible via invite code or direct link.
          </p>
          <div className={`flex rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            {(['public', 'private'] as const).map((v, i) => {
              const active = (draft as any).visibility === v || (!( draft as any).visibility && v === 'private')
              return (
                <button
                  key={v}
                  onClick={() => set('visibility' as any, v)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black transition-all
                    ${i > 0 ? theme === 'dark' ? 'border-l border-white/10' : 'border-l border-slate-200' : ''}
                    ${active
                      ? v === 'public'
                        ? 'bg-sky-400/10 text-sky-400'
                        : 'bg-amber-400/10 text-amber-400'
                      : theme === 'dark'
                        ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {v === 'public' ? '🌐' : '🔒'} {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Join Password (in General so it's always visible) ── */}
        <div className="mt-4">
          <label className={labelCls}>Join Password</label>
          <p className={`text-[11px] mb-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            When set, competitors must enter this password after using the invite code or join link. Leave blank for open access.
          </p>
          <div className="relative">
            <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={draft.joinPassword ?? ''}
              onChange={e => set('joinPassword', e.target.value || undefined)}
              placeholder="Leave blank for open access"
              className={`${inputClass} pl-9`}
            />
          </div>
          {draft.joinPassword && (
            <p className="text-[10px] mt-1.5 text-amber-400">⚠ Stored in plain text — avoid reusing sensitive passwords.</p>
          )}
        </div>
      </SectionCard>

      {/* Scoring */}
      <SectionCard title="Scoring" theme={theme}>
        <div className="mb-6">
          <label className={labelCls}>{t.scoringSystem}</label>
          <div className="flex gap-2">
            {[ScoringType.TRADITIONAL, ScoringType.DYNAMIC].map(s => (
              <button key={s} onClick={() => set('scoringType', s)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${draft.scoringType === s ? 'bg-sky-400/10 text-sky-400 border-sky-400/30' : theme === 'dark' ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
                {s === ScoringType.TRADITIONAL ? t.traditional : t.dynamic}
              </button>
            ))}
          </div>
        </div>
        {draft.scoringType === ScoringType.DYNAMIC && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InputField label={t.dynamicPot} value={draft.dynamicPot ?? 1000} type="number" theme={theme} onChange={v => set('dynamicPot', Number(v))} hint="Total points shared per boulder" />
            <InputField label={t.minPoints} value={draft.minDynamicPoints ?? 0} type="number" theme={theme} onChange={v => set('minDynamicPoints', Number(v))} hint="Minimum points per completion" />
          </div>
        )}
        <InputField label="Top K Boulders" value={draft.topKBoulders ?? ''} type="number" theme={theme} onChange={v => set('topKBoulders', v ? Number(v) : undefined)} hint="Only count the best N boulders. Leave empty to count all." />
        <div className="mt-2 mb-6">
          <label className={labelCls}>Attempt Tracking (default for all boulders)</label>
          <p className={`text-[11px] mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Judge-required boulders always use "Free count". Individual boulders can override this.</p>
          <div className="flex flex-col gap-2 mb-4">
            {([{ value: 'none', label: 'Top / No top only', desc: 'Just record whether topped — no attempt count' }, { value: 'fixed_options', label: 'Fixed options', desc: 'Pill buttons (1 / 2 / … / N+) — quick to tap on mobile' }, { value: 'count', label: 'Free count', desc: '+/− stepper — records any number precisely' }] as const).map(opt => (
              <button key={opt.value} onClick={() => set('attemptTracking', opt.value)} className={`text-left px-4 py-3 rounded-xl border transition-all ${draft.attemptTracking === opt.value ? 'bg-sky-400/10 border-sky-400/30' : theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.attemptTracking === opt.value ? 'border-sky-400 bg-sky-400' : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}`}>
                    {draft.attemptTracking === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-sky-950" />}
                  </div>
                  <div>
                    <p className={`text-xs font-black ${draft.attemptTracking === opt.value ? 'text-sky-400' : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {draft.attemptTracking === 'fixed_options' && (
            <InputField label="Max fixed attempts (N)" value={draft.maxFixedAttempts} type="number" min={2} max={10} theme={theme} onChange={v => set('maxFixedAttempts', Math.max(2, Math.min(10, Number(v))))} hint={`Buttons: 1, 2, … ${draft.maxFixedAttempts - 1}, ${draft.maxFixedAttempts}+`} />
          )}
        </div>
        <div className="mb-6">
          <label className={labelCls}>Zone Scoring</label>
          <div className="flex gap-2">
            {([{ value: 'adds_to_score', label: 'Adds to score', desc: "Zone points add even without a top" }, { value: 'tie_breaker_only', label: 'Tie-breaker only', desc: 'Zone does not add points' }] as const).map(opt => (
              <button key={opt.value} onClick={() => set('zoneScoring', opt.value)} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black border transition-all text-left ${draft.zoneScoring === opt.value ? 'bg-sky-400/10 text-sky-400 border-sky-400/30' : theme === 'dark' ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
                <div className="font-black uppercase tracking-widest text-[10px] mb-1">{opt.label}</div>
                <div className={`text-[10px] font-normal normal-case tracking-normal ${draft.zoneScoring === opt.value ? 'text-sky-300' : theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className={labelCls}>Judging Method</label>
          <div className="flex flex-col gap-2">
            {([{ value: 'self_scoring', title: 'Fully self-scoring', desc: 'Competitors log all their own tops.' }, { value: 'self_with_approval', title: 'Self-scoring with approval', desc: 'Competitors log, a judge approves.' }, { value: 'judge_required', title: 'Judge logging (hybrid)', desc: 'Puntuable boulders require a judge.' }] as const).map(opt => (
              <button key={opt.value} onClick={() => set('scoringMethod', opt.value)} className={`text-left px-4 py-4 rounded-xl border transition-all ${draft.scoringMethod === opt.value ? 'bg-sky-400/10 border-sky-400/30' : theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.scoringMethod === opt.value ? 'border-sky-400 bg-sky-400' : theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}`}>
                    {draft.scoringMethod === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-sky-950" />}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${draft.scoringMethod === opt.value ? 'text-sky-400' : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{opt.title}</p>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
          <ToggleRow label="Penalize Attempts" desc="Deduct points for extra attempts beyond the first" value={draft.penalizeAttempts} theme={theme} onChange={v => set('penalizeAttempts', v)} />
          {draft.penalizeAttempts && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <label className={labelCls}>Penalty Type</label>
                <div className="flex gap-2">
                  {(['fixed', 'percent'] as const).map(pt => <button key={pt} onClick={() => set('penaltyType', pt)} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${draft.penaltyType === pt ? 'bg-sky-400/10 text-sky-400 border-sky-400/30' : theme === 'dark' ? 'bg-white/5 text-slate-500 border-white/10' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{pt}</button>)}
                </div>
              </div>
              <InputField label={`Penalty Value (${draft.penaltyType === 'percent' ? '%' : 'pts'})`} value={draft.penaltyValue} type="number" theme={theme} onChange={v => set('penaltyValue', Number(v))} />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Traits / Divisions */}
      <SectionCard title="Traits / Divisions" theme={theme}>
        <p className={`text-[11px] mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          Traits are freeform labels competitors self-select when joining — e.g. "Open Men", "Youth U18", "Masters 40+". Competitors can hold multiple traits simultaneously.
        </p>

        {/* Require traits toggle */}
        <ToggleRow
          label="Require trait selection on join"
          desc="Competitors must pick at least one trait before they can join the competition"
          value={draft.requireTraits ?? false}
          theme={theme}
          onChange={v => set('requireTraits', v)}
        />

        <div className={`h-px my-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`} />

        {/* Trait list */}
        <div className="space-y-2 mb-4">
          {(draft.traits ?? []).length === 0 && (
            <p className={`text-xs text-center py-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              No traits defined yet — add one below.
            </p>
          )}
          {(draft.traits ?? []).map(trait => (
            <div key={trait.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{trait.name}</span>
              <button onClick={() => removeTrait(trait.id)} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}><Trash2 size={13} /></button>
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
          <button onClick={addTrait} disabled={!newTraitName.trim()} className="flex items-center gap-2 px-4 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus size={15} />Add
          </button>
        </div>
      </SectionCard>

      {/* Difficulty levels */}
      <SectionCard title="Difficulty Levels" theme={theme} defaultOpen={false}>
        <div className={`grid grid-cols-[40px_1fr_120px_120px_44px] gap-2 px-3 py-2 mb-2 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <div>Lvl</div><div>Label</div><div>Top pts</div><div>Zone pts</div><div></div>
        </div>
        <div className="space-y-2 mb-4">
          {(draft.difficultyLevels ?? []).map(d => (
            <div key={d.id} className="grid grid-cols-[40px_1fr_120px_120px_44px] gap-2 items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{d.level}</div>
              <input type="text"   value={d.label}      onChange={e => updateDifficulty(d.id, 'label',      e.target.value)}      className={`${inputClass} py-2 text-sm`} />
              <input type="number" value={d.basePoints} onChange={e => updateDifficulty(d.id, 'basePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
              <input type="number" value={d.zonePoints} onChange={e => updateDifficulty(d.id, 'zonePoints', Number(e.target.value))} className={`${inputClass} py-2`} />
              <button onClick={() => removeDifficulty(d.id)} disabled={draft.difficultyLevels.length <= 1} className={`p-2 rounded-xl transition-all flex-shrink-0 ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'} disabled:opacity-20 disabled:cursor-not-allowed`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button onClick={addDifficulty} className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-black flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'border-white/10 text-slate-600 hover:border-sky-400/30 hover:text-sky-400' : 'border-slate-200 text-slate-400 hover:border-sky-400/50 hover:text-sky-500'}`}>
          <Plus size={15} />Add Difficulty Level
        </button>
      </SectionCard>

      {/* Access Control */}
      <SectionCard title="Access Control" theme={theme} defaultOpen={true}>
        <ToggleRow label="Self Scoring" desc="Allow competitors to log their own tops and attempts" value={draft.canSelfScore} theme={theme} onChange={v => set('canSelfScore', v)} />
        <div className={`h-px my-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`} />
        <ToggleRow label="Lock Results" desc="Freeze all scores — competitors can no longer log tops" value={draft.isLocked} theme={theme} onChange={v => set('isLocked', v)} />
      </SectionCard>

      <div className="flex justify-end mt-6">
        <button onClick={() => onUpdate(draft)} className="flex items-center gap-2 px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"><Save size={16} />{t.save}</button>
      </div>
    </div>
  )
}