import { motion } from 'motion/react'

interface ToggleProps {
  checked:  boolean
  onChange: () => void
  theme:    'light' | 'dark'
}

// Animated track + spring-knob toggle that can be reused anywhere.
export default function Toggle({ checked, onChange, theme }: ToggleProps) {
  const trackOn  = '#7F8BAD'
  const trackOff = theme === 'dark' ? 'rgba(255,255,255,0.10)' : '#D0D1D2'

  return (
    <button
      type="button"
      onClick={onChange}
      className="flex-shrink-0 focus:outline-none"
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        className="w-12 h-6 rounded-full relative"
        animate={{ backgroundColor: checked ? trackOn : trackOff }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? 28 : 4 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
        />
      </motion.div>
    </button>
  )
}
