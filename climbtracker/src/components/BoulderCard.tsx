import { Check, RotateCcw, ShieldCheck, Plus, Minus, Trash2 } from 'lucide-react'
import type { Boulder, Completion, DifficultyLevel, AttemptTracking } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BoulderCardProps {
  boulder:          Boulder
  completion:       Completion | undefined
  difficulty:       DifficultyLevel | undefined
  points:           number
  basePoints:       number
  penalizeAttempts: boolean
  penaltyLabel:     string
  isOrganizer:      boolean
  isLocked:         boolean
  theme:            'light' | 'dark'
  attemptTracking:  AttemptTracking
  maxFixedAttempts: number
  onToggle:         (boulderId: string, attempts: number, forceStatus: boolean) => void
  onEdit?:          (boulder: Boulder) => void
  onDelete?:        () => void
}

// ─── ATTEMPT UI: FIXED OPTIONS ────────────────────────────────────────────────

interface FixedAttemptButtonsProps {
  current:  number
  max:      number
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
              flex-1 py-1 rounded text-[10px] font-medium
              transition-colors duration-[330ms]
              ${isActive
                ? 'bg-[#3E6AE1] text-white'
                : theme === 'dark'
                  ? 'bg-white/10 text-[#8E8E8E] hover:bg-white/20'
                  : 'bg-[#EEEEEE] text-[#5C5E62] hover:bg-[#D0D1D2]'
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
          w-7 h-7 rounded flex items-center justify-center border transition-colors duration-[330ms]
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-[#8E8E8E] hover:bg-white/10 disabled:opacity-30'
            : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#5C5E62] hover:bg-[#EEEEEE] disabled:opacity-30'
          }
        `}
      >
        <Minus size={11} />
      </button>
      <span className={`text-sm font-medium w-6 text-center ${theme === 'dark' ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
        {current}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        className={`
          w-7 h-7 rounded flex items-center justify-center border transition-colors duration-[330ms]
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-[#8E8E8E] hover:bg-white/10'
            : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#5C5E62] hover:bg-[#EEEEEE]'
          }
        `}
      >
        <Plus size={11} />
      </button>
      <span className={`text-[10px] ml-1 ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
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
  basePoints: _basePoints,
  penalizeAttempts,
  penaltyLabel,
  isOrganizer,
  isLocked,
  theme,
  attemptTracking,
  maxFixedAttempts,
  onToggle,
  onEdit,
  onDelete,
}: BoulderCardProps) {
  const isTopped = completion !== undefined
  const isFlash  = isTopped && completion.attempts === 1
  const holdColor = boulder.color ?? '#94a3b8'

  function handleClick() {
    if (isLocked) return
    if (boulder.isPuntuable && !isOrganizer) return
    if (isOrganizer) { onEdit?.(boulder); return }

    if (isTopped) {
      onToggle(boulder.id, completion.attempts, false)
    } else {
      onToggle(boulder.id, 1, true)
    }
  }

  function handleAttemptChange(attempts: number) {
    if (isLocked) return
    onToggle(boulder.id, attempts, true)
  }

  const showAttemptControls =
    isTopped &&
    !isLocked &&
    !isOrganizer &&
    !boulder.isPuntuable &&
    attemptTracking !== 'none'

  return (
    <div
      onClick={handleClick}
      className={`
        relative rounded border cursor-pointer
        transition-colors duration-[330ms] overflow-hidden
        ${isTopped
          ? theme === 'dark'
            ? 'bg-[#3E6AE1]/10 border-[#3E6AE1]/30'
            : 'bg-[#3E6AE1]/5 border-[#3E6AE1]/20'
          : theme === 'dark'
            ? 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
            : 'bg-white border-[#EEEEEE] hover:bg-[#F4F4F4] hover:border-[#D0D1D2]'
        }
        ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {/* Colour accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: holdColor }}
      />

      <div className="p-4 pl-5">

        {/* Top row: number + badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: holdColor }}
            />
            <span className={`text-lg font-medium leading-none ${theme === 'dark' ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
              #{boulder.number}
            </span>
          </div>

          {isTopped && (
            <div className={`
              flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium
              ${isFlash
                ? 'bg-amber-400/15 text-amber-500 border border-amber-400/30'
                : 'bg-[#3E6AE1]/15 text-[#3E6AE1] border border-[#3E6AE1]/30'
              }
            `}>
              <Check size={9} strokeWidth={3} />
              {isFlash ? 'Flash' : 'Top'}
            </div>
          )}
        </div>

        {/* Name */}
        {boulder.name && (
          <p className={`text-xs font-medium mb-1 truncate ${theme === 'dark' ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
            {boulder.name}
          </p>
        )}

        {/* Style tag */}
        {boulder.style && (
          <span className={`
            inline-block text-[9px] font-medium
            px-2 py-0.5 rounded mb-2
            ${theme === 'dark' ? 'bg-white/10 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}
          `}>
            {boulder.style}
          </span>
        )}

        {/* Points + difficulty */}
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className={`
              text-xl font-medium leading-none
              ${isTopped ? 'text-[#3E6AE1]' : theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}
            `}>
              {points}
            </span>
            <span className={`text-[10px] ml-1 ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              pts
            </span>
            {isTopped && penalizeAttempts && (completion?.attempts ?? 1) > 1 && penaltyLabel && (
              <span className="ml-2 text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                {penaltyLabel}
              </span>
            )}
          </div>

          {difficulty && (
            <span className={`
              text-[10px] font-medium px-2.5 py-1 rounded border
              ${theme === 'dark'
                ? 'bg-white/5 text-[#D0D1D2] border-white/10'
                : 'bg-[#F4F4F4] text-[#5C5E62] border-[#EEEEEE]'
              }
            `}>
              L{difficulty.level}
              {difficulty.label && <span className="ml-1 opacity-60">{difficulty.label}</span>}
            </span>
          )}
        </div>

        {/* Judge-required notice */}
        {boulder.isPuntuable && !isOrganizer && (
          <div className={`
            flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded
            ${theme === 'dark' ? 'bg-purple-400/10 border border-purple-400/20' : 'bg-purple-50 border border-purple-100'}
          `}>
            <ShieldCheck size={11} className="text-purple-400 flex-shrink-0" />
            <span className="text-[9px] font-medium text-purple-400">
              Judge required
            </span>
          </div>
        )}

        {/* Attempt controls */}
        {showAttemptControls && (
          attemptTracking === 'fixed_options' ? (
            <FixedAttemptButtons
              current={completion.attempts}
              max={maxFixedAttempts}
              theme={theme}
              onChange={handleAttemptChange}
            />
          ) : (
            <AttemptStepper
              current={completion.attempts}
              theme={theme}
              onChange={handleAttemptChange}
            />
          )
        )}

        {/* Locked: show attempt summary */}
        {isLocked && isTopped && (
          <div className="flex items-center gap-1 mt-2">
            <RotateCcw size={10} className="text-[#8E8E8E]" />
            <span className="text-[9px] text-[#8E8E8E] font-medium">
              {attemptTracking === 'none'
                ? 'Topped'
                : `${completion.attempts} attempt${completion.attempts !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        )}

        {/* Organizer controls */}
        {isOrganizer && (
          <div className="flex items-center justify-between mt-2">
            <p className={`text-[9px] font-medium ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              Tap to edit
            </p>
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className={`
                  p-1.5 rounded transition-colors duration-[330ms]
                  ${theme === 'dark'
                    ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10'
                    : 'text-[#D0D1D2] hover:text-red-500 hover:bg-red-50'
                  }
                `}
                title="Delete boulder"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
