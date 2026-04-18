import { useState, useEffect, useMemo } from 'react'
import { X, Save, Trash2, AlertCircle } from 'lucide-react'
import type { Boulder, Competition, AttemptTracking } from '../types'

interface BoulderModalProps {
  boulder?:         Boulder
  existingBoulders: Boulder[]
  competition:      Competition
  theme:            'light' | 'dark'
  onSave:           (boulder: Boulder) => void
  onDelete?:        (boulderId: string) => void
  onClose:          () => void
}

const HOLD_COLORS = [
  { label: 'Red',        value: '#ff0000' },
  { label: 'Pink',       value: '#ff3fc3' },
  { label: 'Dark Blue',  value: '#2e61f0' },
  { label: 'Green',      value: '#3eb700' },
  { label: 'Lilac',      value: '#6700b3' },
  { label: 'Orange',     value: '#ff9e1c' },
  { label: 'Black',      value: '#000000' },
  { label: 'White',      value: '#ffffff' },
  { label: 'Light Blue', value: '#80ffff' },
  { label: 'Yellow',     value: '#f7f300' },
]

const STYLES = ['Slab', 'Overhang', 'Dyno', 'Crimp', 'Volume', 'Cave', 'Vertical', 'Other']

const TRACKING_OPTIONS: { value: AttemptTracking | 'inherit'; label: string; desc: string }[] = [
  { value: 'inherit',       label: 'Inherit from event', desc: 'Use the default set in competition settings' },
  { value: 'none',          label: 'Top / No top only',  desc: 'Only record whether topped — no attempt count' },
  { value: 'fixed_options', label: 'Fixed options',      desc: 'Pill buttons (1 / 2 / … / N+) — quickest to tap' },
  { value: 'count',         label: 'Free count',         desc: '+/− stepper — records any number of attempts precisely' },
]

export default function BoulderModal({
  boulder, existingBoulders, competition, theme, onSave, onDelete, onClose,
}: BoulderModalProps) {
  const isEditing = !!boulder
  const dk        = theme === 'dark'

  const nextNumber = existingBoulders
    .filter(b => b.status !== 'removed')
    .reduce((max, b) => Math.max(max, b.number), 0) + 1
  const [number,           setNumber]           = useState(boulder?.number           ?? nextNumber)
  const [name,             setName]             = useState(boulder?.name             ?? '')
  const [color,            setColor]            = useState(boulder?.color            ?? HOLD_COLORS[0].value)
  const [difficultyId,     setDifficultyId]     = useState(boulder?.difficultyId     ?? competition.difficultyLevels[0]?.id ?? '')
  const [style,            setStyle]            = useState(boulder?.style            ?? '')
  const [isPuntuable,      setIsPuntuable]      = useState(boulder?.isPuntuable      ?? false)
  const [maxPoints,        setMaxPoints]        = useState(boulder?.maxPoints        ?? competition.dynamicPot ?? 1000)
  const [status,           setStatus]           = useState<Boulder['status']>(boulder?.status ?? 'active')
  const [zoneCount,        setZoneCount]        = useState(boulder?.zoneCount        ?? 0)
  const [trackingOverride, setTrackingOverride] = useState<AttemptTracking | 'inherit'>(
    boulder?.attemptTrackingOverride ?? 'inherit'
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const numberError = useMemo((): string | null => {
    if (number < 1) return 'Boulder number must be at least 1.'
    const clash = existingBoulders.find(
      b => b.number === number && b.status !== 'removed' && b.id !== boulder?.id
    )
    return clash ? `Boulder #${number} already exists in this competition.` : null
  }, [number, existingBoulders, boulder?.id])

  const canSave = !numberError

  function handleSave() {
    if (!canSave) return
    onSave({
      id:                      boulder?.id ?? `b-${Date.now()}`,
      number,
      name:                    name.trim() || undefined,
      color,
      difficultyId:            difficultyId || undefined,
      style:                   style || undefined,
      isPuntuable,
      maxPoints,
      tags:                    boulder?.tags ?? [],
      status,
      zoneCount,
      attemptTrackingOverride: trackingOverride === 'inherit' ? undefined : trackingOverride,
    })
    onClose()
  }

  const inputCls = `
    w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms]
    ${dk
      ? 'bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#3E6AE1]/50'
      : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#121212] placeholder:text-[#8E8E8E] focus:border-[#3E6AE1]'
    }
  `
  const labelCls = `block text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`

  const pillBtn = (active: boolean, danger = false) => `
    px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-[330ms]
    ${active
      ? danger
        ? 'bg-red-400/10 text-red-400 border-red-400/30'
        : 'bg-[#3E6AE1]/10 text-[#3E6AE1] border-[#3E6AE1]/30'
      : dk
        ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10'
        : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'
    }
  `

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500] max-w-lg mx-auto
        rounded border max-h-[90vh] overflow-y-auto
        ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}
      `}>

        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          <h2 className={`text-base font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {isEditing ? `Edit Boulder #${boulder.number}` : 'Add Boulder'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#5C5E62]' : 'hover:bg-[#F4F4F4] text-[#8E8E8E]'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">

          {/* Number + Name */}
          <div className="grid grid-cols-[100px_1fr] gap-3 mb-5">
            <div>
              <label className={labelCls}>Number *</label>
              <input
                type="number" min={1} value={number}
                onChange={e => setNumber(Number(e.target.value))}
                className={`${inputCls} ${numberError ? dk ? '!border-red-400/60' : '!border-red-400' : ''}`}
              />
              {numberError && (
                <div className="flex items-start gap-1 mt-1.5">
                  <AlertCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-400 font-medium leading-tight">{numberError}</p>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Name (optional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Beta Blaster" className={inputCls} />
            </div>
          </div>

          {/* Hold colour */}
          <div className="mb-5">
            <label className={labelCls}>Hold Colour</label>
            <div className="flex flex-wrap gap-2">
              {HOLD_COLORS.map(c => (
                <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                  className={`w-9 h-9 rounded transition-all border-2 ${color === c.value ? 'border-[#3E6AE1] scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.value }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border-2 border-transparent hover:scale-105 transition-all" title="Custom colour" />
            </div>
            <p className={`text-[10px] mt-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Selected: <span className="font-medium" style={{ color }}>{color}</span></p>
          </div>

          {/* Difficulty */}
          {competition.difficultyLevels.length > 0 && (
            <div className="mb-5">
              <label className={labelCls}>Difficulty Level</label>
              <div className="flex flex-wrap gap-2">
                {competition.difficultyLevels.map(d => (
                  <button key={d.id} onClick={() => setDifficultyId(d.id)}
                    className={pillBtn(difficultyId === d.id)}>
                    {d.label}<span className="ml-1.5 text-[10px] opacity-50">{d.basePoints}pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Style */}
          <div className="mb-5">
            <label className={labelCls}>Style (optional)</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map(s => (
                <button key={s} onClick={() => setStyle(style === s ? '' : s)} className={pillBtn(style === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Attempt tracking override */}
          <div className="mb-5">
            <label className={labelCls}>Attempt Tracking</label>
            <p className={`text-[11px] mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              Competition default: <span className="font-medium">{competition.attemptTracking}</span>
              {competition.attemptTracking === 'fixed_options' && ` (up to ${competition.maxFixedAttempts}+)`}
            </p>
            <div className="flex flex-col gap-2">
              {TRACKING_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setTrackingOverride(opt.value)}
                  className={`text-left px-4 py-3 rounded border transition-colors duration-[330ms] ${trackingOverride === opt.value ? 'bg-[#3E6AE1]/10 border-[#3E6AE1]/30' : dk ? 'bg-white/5 border-white/10 hover:bg-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${trackingOverride === opt.value ? 'border-[#3E6AE1] bg-[#3E6AE1]' : dk ? 'border-[#5C5E62]' : 'border-[#D0D1D2]'}`}>
                      {trackingOverride === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${trackingOverride === opt.value ? 'text-[#3E6AE1]' : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{opt.label}</p>
                      <p className={`text-[10px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{opt.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Judge required */}
          <div className={`flex items-center justify-between p-4 rounded border mb-5 ${dk ? 'bg-white/[0.02] border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <div>
              <p className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>Judge Required</p>
              <p className={`text-xs mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Only judges can log attempts and validate this boulder</p>
            </div>
            <button onClick={() => setIsPuntuable(p => !p)}>
              <div className={`w-12 h-6 rounded-full transition-colors duration-[330ms] relative ${isPuntuable ? 'bg-[#3E6AE1]' : dk ? 'bg-white/10' : 'bg-[#D0D1D2]'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-[330ms] ${isPuntuable ? 'left-7' : 'left-1'}`} />
              </div>
            </button>
          </div>

          {/* Zones */}
          {isPuntuable && (
            <div className="mb-5">
              <label className={labelCls}>Number of Zones</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setZoneCount(n)} className={`flex-1 py-2.5 rounded text-sm font-medium border transition-colors duration-[330ms] ${zoneCount === n ? 'bg-[#3E6AE1]/10 text-[#3E6AE1] border-[#3E6AE1]/30' : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}>
                    {n === 0 ? 'None' : n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic pot override */}
          {competition.scoringType === 'DYNAMIC' && (
            <div className="mb-5">
              <label className={labelCls}>Points Override (Dynamic)</label>
              <input type="number" min={0} value={maxPoints} onChange={e => setMaxPoints(Number(e.target.value))} className={inputCls} />
              <p className={`text-[11px] mt-1.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Overrides the competition default pot ({competition.dynamicPot ?? 1000} pts)</p>
            </div>
          )}

          {/* Status */}
          <div className="mb-5">
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {(['active', 'hidden', 'removed'] as Boulder['status'][]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded text-xs font-medium border transition-colors duration-[330ms] ${
                    status === s
                      ? s === 'active'  ? 'bg-green-400/10 text-green-400 border-green-400/30'
                      : s === 'hidden'  ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                                        : 'bg-red-400/10 text-red-400 border-red-400/30'
                      : dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10'
                           : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex items-center justify-between gap-3 px-6 py-4 border-t ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          {isEditing && onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Sure?</span>
                <button onClick={() => { onDelete(boulder.id); onClose() }} className="px-3 py-2 rounded text-xs font-medium bg-red-400 text-white hover:bg-red-500 transition-colors duration-[330ms]">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className={`px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#8E8E8E]'}`}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10' : 'text-[#8E8E8E] hover:text-red-500 hover:bg-red-50'}`}>
                <Trash2 size={13} /> Delete boulder
              </button>
            )
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded text-sm font-medium border transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
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
