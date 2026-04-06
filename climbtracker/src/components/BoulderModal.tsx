import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'

import type { Boulder, Competition } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BoulderModalProps {
  boulder?:    Boulder           // undefined = creating new, defined = editing
  competition: Competition
  theme:       'light' | 'dark'
  onSave:      (boulder: Boulder) => void
  onDelete?:   (boulderId: string) => void
  onClose:     () => void
}

// ─── COLOUR SWATCHES ──────────────────────────────────────────────────────────

const HOLD_COLORS = [
  { label: 'Blue',   value: '#38bdf8' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Red',    value: '#f87171' },
  { label: 'Green',  value: '#4ade80' },
  { label: 'Purple', value: '#c084fc' },
  { label: 'White',  value: '#f8fafc' },
  { label: 'Black',  value: '#1e293b' },
  { label: 'Orange', value: '#fb923c' },
  { label: 'Pink',   value: '#f472b6' },
]

const STYLES = ['Slab', 'Overhang', 'Dyno', 'Crimp', 'Volume', 'Cave', 'Vertical', 'Other']

// ─── BOULDER MODAL ────────────────────────────────────────────────────────────

export default function BoulderModal({
  boulder,
  competition,
  theme,
  onSave,
  onDelete,
  onClose,
}: BoulderModalProps) {
  const isEditing = !!boulder

  // ── Draft state ──────────────────────────────────────────────────────────
  const [number,       setNumber]       = useState(boulder?.number       ?? 1)
  const [name,         setName]         = useState(boulder?.name         ?? '')
  const [color,        setColor]        = useState(boulder?.color        ?? HOLD_COLORS[0].value)
  const [difficultyId, setDifficultyId] = useState(boulder?.difficultyId ?? competition.difficultyLevels[0]?.id ?? '')
  const [style,        setStyle]        = useState(boulder?.style        ?? '')
  const [isPuntuable,  setIsPuntuable]  = useState(boulder?.isPuntuable  ?? false)
  const [maxPoints,    setMaxPoints]    = useState(boulder?.maxPoints    ?? competition.dynamicPot ?? 1000)
  const [status,       setStatus]       = useState<Boulder['status']>(boulder?.status ?? 'active')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    const saved: Boulder = {
      id:           boulder?.id ?? `b-${Date.now()}`,
      number,
      name:         name.trim() || undefined,
      color,
      difficultyId: difficultyId || undefined,
      style:        style || undefined,
      isPuntuable,
      maxPoints:    maxPoints,
      tags:         boulder?.tags ?? [],
      status,
    }
    onSave(saved)
    onClose()
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputCls = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400'
    }
  `
  const labelCls = `block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`
  const sectionCls = `mb-5`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500]
        max-w-lg mx-auto rounded-2xl border shadow-2xl
        max-h-[90vh] overflow-y-auto
        ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}
      `}>

        {/* Header */}
        <div className={`
          sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b
          ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}
        `}>
          <h2 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {isEditing ? `Edit Boulder #${boulder.number}` : 'Add Boulder'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Number + Name row */}
          <div className="grid grid-cols-[100px_1fr] gap-3 mb-5">
            <div>
              <label className={labelCls}>Number *</label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={e => setNumber(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Beta Blaster"
                className={inputCls}
              />
            </div>
          </div>

          {/* Hold colour */}
          <div className={sectionCls}>
            <label className={labelCls}>Hold Colour</label>
            <div className="flex flex-wrap gap-2">
              {HOLD_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`
                    w-9 h-9 rounded-xl transition-all border-2
                    ${color === c.value
                      ? 'border-sky-400 scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: c.value }}
                />
              ))}
              {/* Custom colour picker */}
              <div className="relative">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border-2 border-transparent hover:scale-105 transition-all"
                  title="Custom colour"
                />
              </div>
            </div>
            <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              Selected: <span className="font-black" style={{ color }}>{color}</span>
            </p>
          </div>

          {/* Difficulty */}
          {competition.difficultyLevels.length > 0 && (
            <div className={sectionCls}>
              <label className={labelCls}>Difficulty Level</label>
              <div className="flex flex-wrap gap-2">
                {competition.difficultyLevels.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficultyId(d.id)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-black border transition-all
                      ${difficultyId === d.id
                        ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
                        : theme === 'dark'
                          ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }
                    `}
                  >
                    <span className="opacity-60 mr-1">L{d.level}</span>
                    {d.label}
                    <span className="ml-1 opacity-40">{d.basePoints}pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Style */}
          <div className={sectionCls}>
            <label className={labelCls}>Style (optional)</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(style === s ? '' : s)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-black border transition-all
                    ${style === s
                      ? 'bg-purple-400/10 text-purple-400 border-purple-400/30'
                      : theme === 'dark'
                        ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Judge required toggle */}
          <div className={`
            flex items-center justify-between p-4 rounded-xl border mb-5
            ${theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}
          `}>
            <div>
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                Judge Required
              </p>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Only judges can log attempts and validate this boulder
              </p>
            </div>
            <button onClick={() => setIsPuntuable(p => !p)}>
              <div className={`
                w-12 h-6 rounded-full transition-all relative
                ${isPuntuable
                  ? 'bg-purple-400'
                  : theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'
                }
              `}>
                <div className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all
                  ${isPuntuable ? 'left-7' : 'left-1'}
                `} />
              </div>
            </button>
          </div>

          {/* Dynamic scoring override */}
          {competition.scoringType === 'DYNAMIC' && (
            <div className={sectionCls}>
              <label className={labelCls}>Points Override (Dynamic)</label>
              <input
                type="number"
                min={0}
                value={maxPoints}
                onChange={e => setMaxPoints(Number(e.target.value))}
                className={inputCls}
              />
              <p className={`text-[11px] mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                Overrides the competition default pot ({competition.dynamicPot ?? 1000} pts)
              </p>
            </div>
          )}

          {/* Status */}
          <div className={sectionCls}>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {(['active', 'hidden', 'removed'] as Boulder['status'][]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`
                    flex-1 py-2 rounded-xl text-xs font-black border uppercase tracking-widest transition-all
                    ${status === s
                      ? s === 'active'
                        ? 'bg-green-400/10 text-green-400 border-green-400/30'
                        : s === 'hidden'
                          ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                          : 'bg-red-400/10 text-red-400 border-red-400/30'
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

        </div>

        {/* Footer */}
        <div className={`
          sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t
          ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}
        `}>
          {/* Delete — only when editing */}
          {isEditing && onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Sure?</span>
                <button
                  onClick={() => { onDelete(boulder.id); onClose() }}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-red-400 text-white hover:bg-red-500 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={13} /> Delete boulder
              </button>
            )
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-black border transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
            >
              <Save size={15} />
              {isEditing ? 'Save changes' : 'Add boulder'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}