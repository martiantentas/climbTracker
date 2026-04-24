import { User } from 'lucide-react'

/**
 * Renders a user avatar correctly regardless of format:
 *  - URL string  (Google photo)  → <img>
 *  - Short string (emoji)        → <span>
 *  - Empty / undefined           → fallback (icon or initial letter)
 */
interface UserAvatarProps {
  avatar?:      string
  displayName?: string
  /** Tailwind size class applied to the wrapper, e.g. "w-9 h-9" */
  sizeClass?:   string
  /** Extra classes for the wrapper div */
  className?:   string
  /** Size for the fallback <User> icon */
  iconSize?:    number
  /** Font size class for the emoji, e.g. "text-xl" */
  emojiClass?:  string
}

function isUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')
}

export default function UserAvatar({
  avatar,
  displayName,
  sizeClass  = 'w-9 h-9',
  className  = '',
  iconSize   = 18,
  emojiClass = 'text-xl',
}: UserAvatarProps) {
  const base = `${sizeClass} rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`

  if (avatar && isUrl(avatar)) {
    return (
      <div className={base}>
        <img
          src={avatar}
          alt={displayName ?? 'avatar'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  if (avatar) {
    return (
      <div className={base}>
        <span className={emojiClass}>{avatar}</span>
      </div>
    )
  }

  return (
    <div className={base}>
      {displayName
        ? <span className="text-sm font-medium text-[#7F8BAD]">{displayName.charAt(0).toUpperCase()}</span>
        : <User size={iconSize} className="text-[#7F8BAD]" />
      }
    </div>
  )
}
