import { motion } from 'motion/react'

interface ToggleProps {
  checked:   boolean
  onChange:  () => void
  theme:     'light' | 'dark'
  size?:     'sm' | 'default'
  disabled?: boolean
}

// Compact pill switch (shadcn-style): small track, round thumb that slides with a spring.
export default function Toggle({ checked, onChange, theme, size = 'default', disabled = false }: ToggleProps) {
  const trackOn  = '#7F8BAD'
  const trackOff = theme === 'dark' ? 'rgba(255,255,255,0.20)' : '#D0D1D2'

  const dims = size === 'sm'
    ? { track: 'w-6 h-[14px]', thumb: 'w-3 h-3',   travel: 10 }
    : { track: 'w-8 h-[18px]', thumb: 'w-4 h-4',   travel: 14 }

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`relative flex-shrink-0 rounded-full outline-none after:absolute after:-inset-x-3 after:-inset-y-2 after:content-[''] focus-visible:ring-[3px] focus-visible:ring-[#7F8BAD]/40 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <motion.div
        className={`${dims.track} rounded-full border border-transparent flex items-center`}
        animate={{ backgroundColor: checked ? trackOn : trackOff }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className={`${dims.thumb} rounded-full bg-white shadow-sm pointer-events-none`}
          animate={{ x: checked ? dims.travel : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.7 }}
        />
      </motion.div>
    </button>
  )
}
