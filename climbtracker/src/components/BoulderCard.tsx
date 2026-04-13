import { Check, RotateCcw, ShieldCheck, Plus, Minus } from 'lucide-react'
import type { Boulder, Completion, DifficultyLevel, AttemptTracking } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BoulderCardProps {
  boulder:         Boulder
  completion:      Completion | undefined
  difficulty:      DifficultyLevel | undefined
  points:          number
  basePoints:      number   // un-penalised points — used to show penalty delta
  penalizeAttempts: boolean
  penaltyLabel:    string   // e.g. "−40 pts" or "−20%" pre-formatted
  isOrganizer:     boolean
  isLocked:        boolean
  theme:           'light' | 'dark'
  attemptTracking: AttemptTracking
  maxFixedAttempts: number
  onToggle:        (boulderId: string, attempts: number, forceStatus: boolean) => void
  onEdit?:         (boulder: Boulder) => void
}

// ─── ATTEMPT UI: FIXED OPTIONS ────────────────────────────────────────────────
// Pill buttons: 1, 2, …, N-1, N+

interface FixedAttemptButtonsProps {
  current:  number
  max:      number          // highest labelled number; ≥ max shown as "N+"
  theme:    'light' | 'dark'
  onChange: (attempts: number) => void
}

function FixedAttemptButtons({ current, max, theme, onChange }: FixedAttemptButtonsProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex gap-1 mt-2">
      {options.map(n => {
        const isLast   = n === max
        const label    = isLast ? `${max}+` : String(n)
        const isActive = isLast ? current >= max : current === n

        return (
          <button
            key={n}
            onClick={e => { e.stopPropagation(); onChange(n) }}
            className={`
              flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
              transition-all duration-150
              ${isActive
                ? 'bg-sky-400 text-sky-950'
                : theme === 'dark'
                  ? 'bg-white/10 text-slate-400 hover:bg-white/20'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── ATTEMPT UI: STEPPER ──────────────────────────────────────────────────────

interface StepperProps {
  current:  number
  theme:    'light' | 'dark'
  onChange: (attempts: number) => void
}

function AttemptStepper({ current, theme, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current <= 1}
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center border transition-all
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 disabled:opacity-30'
            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 disabled:opacity-30'
          }
        `}
      >
        <Minus size={11} />
      </button>
      <span className={`text-sm font-black w-6 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
        {current}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center border transition-all
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
          }
        `}
      >
        <Plus size={11} />
      </button>
      <span className={`text-[10px] ml-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
        tries
      </span>
    </div>
  )
}

// ─── BOULDER CARD ─────────────────────────────────────────────────────────────

export default function BoulderCard({
  boulder,
  completion,
  difficulty,
  points,
  basePoints,
  penalizeAttempts,
  penaltyLabel,
  isOrganizer,
  isLocked,
  theme,
  attemptTracking,
  maxFixedAttempts,
  onToggle,
  onEdit,
}: BoulderCardProps) {
  const isTopped = completion !== undefined
  const isFlash  = isTopped && completion.attempts === 1
  const holdColor = boulder.color ?? '#94a3b8'

  // ── Handle card click ─────────────────────────────────────────────────────
  function handleClick() {
    if (isLocked) return
    if (boulder.isPuntuable && !isOrganizer) return
    if (isOrganizer) { onEdit?.(boulder); return }

    if (isTopped) {
      onToggle(boulder.id, completion.attempts, false)
    } else {
      // When toggling on, default to 1 attempt regardless of tracking mode
      onToggle(boulder.id, 1, true)
    }
  }

  function handleAttemptChange(attempts: number) {
    if (isLocked) return
    onToggle(boulder.id, attempts, true)
  }

  // ── Whether to show the attempt controls at all ───────────────────────────
  // Only shown when: topped, not locked, not organizer, not puntuable,
  // and tracking mode is not 'none'.
  const showAttemptControls =
    isTopped &&
    !isLocked &&
    !isOrganizer &&
    !boulder.isPuntuable &&
    attemptTracking !== 'none'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded-2xl border cursor-pointer
        transition-all duration-200 overflow-hidden
        ${isTopped
          ? theme === 'dark'
            ? 'bg-sky-400/10 border-sky-400/30 shadow-lg shadow-sky-400/10'
            : 'bg-sky-50 border-sky-200 shadow-md shadow-sky-100'
          : theme === 'dark'
            ? 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
        }
        ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {/* Colour accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: holdColor }}
      />

      <div className="p-4 pl-5">

        {/* Top row: number + badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: holdColor }}
            />
            <span className={`text-lg font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              #{boulder.number}
            </span>
          </div>

          {isTopped && (
            <div className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
              ${isFlash
                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                : 'bg-sky-400/20 text-sky-400 border border-sky-400/30'
              }
            `}>
              <Check size={9} strokeWidth={3} />
              {isFlash ? 'Flash' : 'Top'}
            </div>
          )}
        </div>

        {/* Name */}
        {boulder.name && (
          <p className={`text-xs font-bold mb-1 truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {boulder.name}
          </p>
        )}

        {/* Style tag */}
        {boulder.style && (
          <span className={`
            inline-block text-[9px] font-black uppercase tracking-widest
            px-2 py-0.5 rounded-md mb-2
            ${theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}
          `}>
            {boulder.style}
          </span>
        )}

        {/* Points + difficulty */}
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className={`
              text-xl font-black leading-none
              ${isTopped ? 'text-sky-400' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}
            `}>
              {points}
            </span>
            <span className={`text-[10px] ml-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              pts
            </span>
            {/* Penalty indicator — only shown when topped with >1 attempt and penalty active */}
            {isTopped && penalizeAttempts && (completion?.attempts ?? 1) > 1 && penaltyLabel && (
              <span className="ml-2 text-[10px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-md">
                {penaltyLabel}
              </span>
            )}
          </div>

          {difficulty && (
            <span className={`
              text-[10px] font-black px-2.5 py-1 rounded-lg border
              ${theme === 'dark'
                ? 'bg-white/10 text-slate-300 border-white/20'
                : 'bg-slate-100 text-slate-600 border-slate-200'
              }
            `}>
              L{difficulty.level}
              {difficulty.label && <span className="ml-1 opacity-60">{difficulty.label}</span>}
            </span>
          )}
        </div>

        {/* ── Judge-required notice ── */}
        {boulder.isPuntuable && !isOrganizer && (
          <div className={`
            flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-xl
            ${theme === 'dark' ? 'bg-purple-400/10 border border-purple-400/20' : 'bg-purple-50 border border-purple-100'}
          `}>
            <ShieldCheck size={11} className="text-purple-400 flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">
              Judge required
            </span>
          </div>
        )}

        {/* ── Attempt controls — mode-aware ── */}
        {showAttemptControls && (
          attemptTracking === 'fixed_options' ? (
            <FixedAttemptButtons
              current={completion.attempts}
              max={maxFixedAttempts}
              theme={theme}
              onChange={handleAttemptChange}
            />
          ) : (
            // 'count' mode
            <AttemptStepper
              current={completion.attempts}
              theme={theme}
              onChange={handleAttemptChange}
            />
          )
        )}

        {/* ── Locked: show attempt summary ── */}
        {isLocked && isTopped && (
          <div className="flex items-center gap-1 mt-2">
            <RotateCcw size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
              {attemptTracking === 'none'
                ? 'Topped'
                : `${completion.attempts} attempt${completion.attempts !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        )}

        {/* ── Organizer edit hint ── */}
        {isOrganizer && (
          <p className={`text-[9px] uppercase tracking-widest mt-2 font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Tap to edit
          </p>
        )}

      </div>
    </div>
  )
}