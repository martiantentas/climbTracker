// ─── EMOJI AVATAR PICKER ─────────────────────────────────────────────────────

interface EmojiAvatarPickerProps {
  selected: string | undefined
  theme:    'light' | 'dark'
  onSelect: (emoji: string) => void
}

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
      <p className={`text-[10px] font-medium mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
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
                w-full aspect-square rounded text-xl flex items-center justify-center
                transition-all duration-[330ms] border-2
                ${isSelected
                  ? 'border-[#7F8BAD] bg-[#7F8BAD]/10 scale-110'
                  : dk
                    ? 'border-transparent bg-white/5 hover:bg-white/10 hover:scale-105'
                    : 'border-transparent bg-[#F4F4F4] hover:bg-[#EEEEEE] hover:scale-105'
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
          className={`mt-3 text-[10px] font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-red-400' : 'text-[#8E8E8E] hover:text-red-500'}`}
        >
          ✕ Remove avatar
        </button>
      )}
    </div>
  )
}
