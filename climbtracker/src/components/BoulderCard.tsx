import { Check, RotateCcw, ShieldCheck } from 'lucide-react'
import type { Boulder, Completion, DifficultyLevel } from '../types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BoulderCardProps {
  boulder:     Boulder
  completion:  Completion | undefined  // undefined = not yet topped
  difficulty:  DifficultyLevel | undefined
  points:      number                  // computed points for this boulder
  isOrganizer: boolean
  isLocked:    boolean
  theme:       'light' | 'dark'
  onToggle:    (boulderId: string, attempts: number, forceStatus: boolean) => void
  onEdit?:     (boulder: Boulder) => void  // organizer only
}

// ─── ATTEMPT BUTTONS ──────────────────────────────────────────────────────────
// The 1 / 2 / 3 / 4+ quick-select buttons shown when a boulder is topped

interface AttemptButtonsProps {
  current: number
  theme:   'light' | 'dark'
  onChange: (attempts: number) => void
}

function AttemptButtons({ current, theme, onChange }: AttemptButtonsProps) {
  const options = [1, 2, 3, 4]

  return (
    <div className="flex gap-1 mt-2">
      {options.map(n => {
        const label    = n === 4 ? '4+' : String(n)
        const isActive = n === 4 ? current >= 4 : current === n

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

// ─── BOULDER CARD ─────────────────────────────────────────────────────────────

export default function BoulderCard({
  boulder,
  completion,
  difficulty,
  points,
  isOrganizer,
  isLocked,
  theme,
  onToggle,
  onEdit,
}: BoulderCardProps) {
  const isTopped = completion !== undefined

  // ── Derived display values ────────────────────────────────────────────────
  const isFlash = isTopped && completion.attempts === 1

  // The colour swatch — used as a left border accent and the dot indicator
  const holdColor = boulder.color ?? '#94a3b8'

  // ── Handle card click ─────────────────────────────────────────────────────
  // In handleClick:  
  function handleClick() {
    if (isLocked) return
    if (boulder.isPuntuable && !isOrganizer) return  // ← judges only
    if (isOrganizer) {
        onEdit?.(boulder)
        return
    }
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
      {/* ── Colour accent bar on the left edge ── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: holdColor }}
      />

      <div className="p-4 pl-5">

        {/* ── Top row: number + topped badge ── */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Colour dot */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
              style={{ backgroundColor: holdColor }}
            />
            <span className={`
              text-lg font-black leading-none
              ${theme === 'dark' ? 'text-white' : 'text-slate-900'}
            `}>
              #{boulder.number}
            </span>
          </div>

          {/* Topped / flash badge */}
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

        {/* ── Boulder name (if it has one) ── */}
        {boulder.name && (
          <p className={`text-xs font-bold mb-1 truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            {boulder.name}
          </p>
        )}

        {/* ── Style tag ── */}
        {boulder.style && (
          <span className={`
            inline-block text-[9px] font-black uppercase tracking-widest
            px-2 py-0.5 rounded-md mb-2
            ${theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}
          `}>
            {boulder.style}
          </span>
        )}

        {/* ── Points row ── */}
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
          </div>

          {/* Difficulty badge */}
        {difficulty && (
            <span className={`
                text-[10px] font-black px-2.5 py-1 rounded-lg border
                ${theme === 'dark'
                ? 'bg-white/10 text-slate-300 border-white/20'
                : 'bg-slate-100 text-slate-600 border-slate-200'
                }
            `}>
                L{difficulty.level}
                {difficulty.label && (
                <span className="ml-1 opacity-60">{difficulty.label}</span>
                )}
            </span>
            )}
        </div>

        {/* ── Puntuable indicator — replaces attempt buttons for competitors ── */}
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

        {/* ── Normal attempt buttons — only for non-puntuable boulders ── */}
        {isTopped && !isLocked && !isOrganizer && !boulder.isPuntuable && (
            <AttemptButtons
                current={completion.attempts}
                theme={theme}
                onChange={handleAttemptChange}
            />
        )}

        {/* ── Organizer edit hint ── */}
        {isOrganizer && (
          <p className={`text-[9px] uppercase tracking-widest mt-2 font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Tap to edit
          </p>
        )}

        {/* ── Locked indicator ── */}
        {isLocked && isTopped && (
          <div className="flex items-center gap-1 mt-2">
            <RotateCcw size={10} className="text-slate-500" />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
              {completion.attempts} attempt{completion.attempts !== 1 ? 's' : ''}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}