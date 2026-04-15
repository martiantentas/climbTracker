// ─── EMOJI AVATAR PICKER ─────────────────────────────────────────────────────
// A curated grid of climbing-themed emojis stored as plain unicode strings.
// No npm dependencies — renders natively in every browser.

interface EmojiAvatarPickerProps {
  selected: string | undefined
  theme:    'light' | 'dark'
  onSelect: (emoji: string) => void
}

// Curated set — climbing & outdoors themed
export const AVATAR_EMOJIS = [
  '🧗', '🏔️', '🪨', '🦅', '🐐', '⛰️',
  '🌄', '🏕️', '🎯', '⚡', '🔥', '💪',
  '🦁', '🐺', '🦊', '🐻', '🦎', '🦋',
  '🌊', '🌪️', '☁️', '🌟', '🎖️', '🏆',
]

export default function EmojiAvatarPicker({ selected, theme, onSelect }: EmojiAvatarPickerProps) {
  const dk = theme === 'dark'

  return (
    <div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
        Choose your avatar
      </p>
      <div className="grid grid-cols-8 gap-2">
        {AVATAR_EMOJIS.map(emoji => {
          const isSelected = selected === emoji
          return (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              title={emoji}
              className={`
                w-full aspect-square rounded-xl text-xl flex items-center justify-center
                transition-all duration-150 border-2
                ${isSelected
                  ? 'border-sky-400 bg-sky-400/15 scale-110 shadow-lg shadow-sky-400/20'
                  : dk
                    ? 'border-transparent bg-white/5 hover:bg-white/10 hover:scale-105'
                    : 'border-transparent bg-slate-100 hover:bg-slate-200 hover:scale-105'
                }
              `}
            >
              {emoji}
            </button>
          )
        })}
      </div>
      {selected && (
        <button
          onClick={() => onSelect('')}
          className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-all ${dk ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
        >
          ✕ Remove avatar
        </button>
      )}
    </div>
  )
}