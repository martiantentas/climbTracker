import { useState } from 'react'
import {
  Save, Plus, Trash2, Lock, Unlock, Globe, Calendar,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp
} from 'lucide-react'

import type { Competition, Category, DifficultyLevel } from '../types'
import { CompetitionStatus, ScoringType } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SettingsPageProps {
  competition:  Competition
  theme:        'light' | 'dark'
  lang:         Language
  onUpdate:     (updated: Competition) => void
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title:    string
  children: React.ReactNode
  theme:    'light' | 'dark'
  defaultOpen?: boolean
}

function SectionCard({ title, children, theme, defaultOpen = true }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`
      rounded-2xl border overflow-hidden mb-4
      ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}
    `}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between px-6 py-4 text-left
          transition-colors
          ${theme === 'dark'
            ? 'bg-white/[0.03] hover:bg-white/[0.05]'
            : 'bg-slate-50 hover:bg-slate-100'
          }
        `}
      >
        <span className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {title}
        </span>
        {open
          ? <ChevronUp size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
          : <ChevronDown size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
        }
      </button>
      {open && (
        <div className={`p-6 ${theme === 'dark' ? 'bg-transparent' : 'bg-white'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── TOGGLE ROW ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label:    string
  desc:     string
  value:    boolean
  theme:    'light' | 'dark'
  onChange: (v: boolean) => void
}

function ToggleRow({ label, desc, value, theme, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          {desc}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="flex-shrink-0 transition-all"
      >
        {value
          ? <ToggleRight size={32} className="text-sky-400" />
          : <ToggleLeft  size={32} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} />
        }
      </button>
    </div>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────

interface InputProps {
  label:    string
  value:    string | number
  type?:    string
  theme:    'light' | 'dark'
  onChange: (v: string) => void
  hint?:    string
}

function Input({ label, value, type = 'text', theme, onChange, hint }: InputProps) {
  return (
    <div className="mb-4">
      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50'
            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'
          }
        `}
      />
      {hint && (
        <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

export default function SettingsPage({
  competition,
  theme,
  lang,
  onUpdate,
}: SettingsPageProps) {
  const t = translations[lang]

  // ── Local draft state — all edits are local until Save is clicked ─────────
  const [draft, setDraft] = useState<Competition>({ ...competition })

  // Helper to update a single field on the draft
  function set<K extends keyof Competition>(key: K, value: Competition[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  // ── Categories ───────────────────────────────────────────────────────────
  const [newCatName, setNewCatName] = useState('')

  function addCategory() {
    if (!newCatName.trim()) return
    const newCat: Category = {
      id:   `cat-${Date.now()}`,
      name: newCatName.trim(),
    }
    set('categories', [...draft.categories, newCat])
    setNewCatName('')
  }

  function removeCategory(id: string) {
    set('categories', draft.categories.filter(c => c.id !== id))
  }

  // ── Difficulty levels ────────────────────────────────────────────────────
  function updateDifficulty(id: string, field: keyof DifficultyLevel, value: number) {
    set('difficultyLevels', draft.difficultyLevels.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ))
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    onUpdate(draft)
  }

  // ── Status cycle ─────────────────────────────────────────────────────────
  const statusOptions: CompetitionStatus[] = [
    CompetitionStatus.DRAFT,
    CompetitionStatus.LIVE,
    CompetitionStatus.FINISHED,
    CompetitionStatus.ARCHIVED,
  ]

  const statusColors: Record<CompetitionStatus, string> = {
    [CompetitionStatus.DRAFT]:    'bg-slate-400/10 text-slate-400 border-slate-400/20',
    [CompetitionStatus.LIVE]:     'bg-green-400/10 text-green-400 border-green-400/20',
    [CompetitionStatus.FINISHED]: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    [CompetitionStatus.ARCHIVED]: 'bg-red-400/10 text-red-400 border-red-400/20',
  }

  const inputClass = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'
    }
  `

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.settings}
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {competition.name}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"
        >
          <Save size={16} />
          {t.save}
        </button>
      </div>

      {/* ── General ── */}
      <SectionCard title="General" theme={theme}>

        <Input
          label={t.name}
          value={draft.name}
          theme={theme}
          onChange={v => set('name', v)}
        />
        <Input
          label={t.location}
          value={draft.location}
          theme={theme}
          onChange={v => set('location', v)}
        />
        <div className="mb-4">
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.description}
          </label>
          <textarea
            value={draft.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Start Date
            </label>
            <input
              type="datetime-local"
              value={draft.startDate.slice(0, 16)}
              onChange={e => set('startDate', new Date(e.target.value).toISOString())}
              className={inputClass}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              End Date
            </label>
            <input
              type="datetime-local"
              value={draft.endDate.slice(0, 16)}
              onChange={e => set('endDate', new Date(e.target.value).toISOString())}
              className={inputClass}
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Status
          </label>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={`
                  px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest
                  border transition-all
                  ${draft.status === s
                    ? statusColors[s]
                    : theme === 'dark'
                      ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Invite code */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Invite Code
          </label>
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border
            ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
          `}>
            <Globe size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            <span className="font-black tracking-widest text-sky-400 text-sm">
              {draft.inviteCode}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(draft.inviteCode)}
              className={`ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
            >
              Copy
            </button>
          </div>
        </div>

      </SectionCard>

      {/* ── Scoring ── */}
      <SectionCard title="Scoring" theme={theme}>

        {/* Scoring system */}
        <div className="mb-6">
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.scoringSystem}
          </label>
          <div className="flex gap-2">
            {[ScoringType.TRADITIONAL, ScoringType.DYNAMIC].map(s => (
              <button
                key={s}
                onClick={() => set('scoringType', s)}
                className={`
                  flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest
                  border transition-all
                  ${draft.scoringType === s
                    ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
                    : theme === 'dark'
                      ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                  }
                `}
              >
                {s === ScoringType.TRADITIONAL ? t.traditional : t.dynamic}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic-specific settings */}
        {draft.scoringType === ScoringType.DYNAMIC && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Input
              label={t.dynamicPot}
              value={draft.dynamicPot ?? 1000}
              type="number"
              theme={theme}
              onChange={v => set('dynamicPot', Number(v))}
              hint="Total points shared per boulder"
            />
            <Input
              label={t.minPoints}
              value={draft.minDynamicPoints ?? 0}
              type="number"
              theme={theme}
              onChange={v => set('minDynamicPoints', Number(v))}
              hint="Minimum points per completion"
            />
          </div>
        )}

        {/* Top K boulders */}
        <Input
          label="Top K Boulders"
          value={draft.topKBoulders ?? ''}
          type="number"
          theme={theme}
          onChange={v => set('topKBoulders', v ? Number(v) : undefined)}
          hint="Only count the best N boulders per competitor. Leave empty to count all."
        />

        {/* Attempt penalties */}
        <div className={`mt-2 p-4 rounded-xl border ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
          <ToggleRow
            label="Penalize Attempts"
            desc="Deduct points for extra attempts beyond the first"
            value={draft.penalizeAttempts}
            theme={theme}
            onChange={v => set('penalizeAttempts', v)}
          />
          {draft.penalizeAttempts && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Penalty Type
                </label>
                <div className="flex gap-2">
                  {(['fixed', 'percent'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => set('penaltyType', pt)}
                      className={`
                        flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest
                        border transition-all
                        ${draft.penaltyType === pt
                          ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
                          : theme === 'dark'
                            ? 'bg-white/5 text-slate-500 border-white/10'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }
                      `}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label={`Penalty Value (${draft.penaltyType === 'percent' ? '%' : 'pts'})`}
                value={draft.penaltyValue}
                type="number"
                theme={theme}
                onChange={v => set('penaltyValue', Number(v))}
              />
            </div>
          )}
        </div>

      </SectionCard>

      {/* ── Categories ── */}
      <SectionCard title="Categories" theme={theme}>

        <div className="space-y-2 mb-4">
          {draft.categories.map(cat => (
            <div
              key={cat.id}
              className={`
                flex items-center justify-between px-4 py-3 rounded-xl border
                ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
              `}
            >
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                {cat.name}
              </span>
              <button
                onClick={() => removeCategory(cat.id)}
                className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add category */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="e.g. Open Women, Youth A, Masters..."
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={addCategory}
            disabled={!newCatName.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            {t.addCategory}
          </button>
        </div>

      </SectionCard>

      {/* ── Difficulty levels ── */}
      <SectionCard title="Difficulty Levels" theme={theme} defaultOpen={false}>

        <div className={`
          grid grid-cols-[40px_1fr_140px] gap-2 px-3 py-2 mb-2
          text-[10px] font-black uppercase tracking-widest
          ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}
        `}>
          <div>Level</div>
          <div>Label</div>
          <div>Base Points</div>
        </div>

        <div className="space-y-2">
          {draft.difficultyLevels.map(d => (
            <div key={d.id} className="grid grid-cols-[40px_1fr_140px] gap-2 items-center">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                text-xs font-black
                ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}
              `}>
                {d.level}
              </div>
              <div className={`
                px-3 py-2 rounded-xl border text-sm
                ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}
              `}>
                Level {d.level}
              </div>
              <input
                type="number"
                value={d.basePoints}
                onChange={e => updateDifficulty(d.id, 'basePoints', Number(e.target.value))}
                className={`${inputClass} py-2`}
              />
            </div>
          ))}
        </div>

      </SectionCard>

      {/* ── Access control ── */}
      <SectionCard title="Access Control" theme={theme} defaultOpen={false}>

        <ToggleRow
          label="Self Scoring"
          desc="Allow competitors to log their own tops and attempts"
          value={draft.canSelfScore}
          theme={theme}
          onChange={v => set('canSelfScore', v)}
        />

        <div className={`h-px my-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`} />

        <ToggleRow
          label="Lock Results"
          desc="Freeze all scores — competitors can no longer log tops"
          value={draft.isLocked}
          theme={theme}
          onChange={v => set('isLocked', v)}
        />

        {draft.isLocked && (
          <div className={`
            flex items-center gap-3 mt-3 p-3 rounded-xl
            ${theme === 'dark' ? 'bg-amber-400/5 border border-amber-400/10' : 'bg-amber-50 border border-amber-100'}
          `}>
            <Lock size={14} className="text-amber-400 flex-shrink-0" />
            <p className={`text-[11px] ${theme === 'dark' ? 'text-amber-300/70' : 'text-amber-700'}`}>
              Results are locked. Competitors cannot log new tops until you unlock.
            </p>
          </div>
        )}

      </SectionCard>

      {/* ── Save button (bottom) ── */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"
        >
          <Save size={16} />
          {t.save}
        </button>
      </div>

    </div>
  )
}