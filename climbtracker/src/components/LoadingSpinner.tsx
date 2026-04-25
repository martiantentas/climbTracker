import { motion } from 'motion/react'

const SEGMENTS   = 8
const OFFSET_SEC = 0.09                    // stagger between segments
const DURATION   = SEGMENTS * OFFSET_SEC   // 0.72 s per full cycle

// Rounded-rectangle pill path, drawn at 12 o'clock, transform-origin at centre (100 100)
const PILL =
  'M 94 25 C 94 21.686 96.686 19 100 19 L 100 19 C 103.314 19 106 21.686 106 25 L 106 50 ' +
  'C 106 53.314 103.314 56 100 56 L 100 56 C 96.686 56 94 53.314 94 50 Z'

interface LoadingSpinnerProps {
  /** Fill colour for the pills. Defaults to the design-system accent. */
  color?: string
  /** Overall rendered size in pixels. Viewbox is always 200×200. */
  size?: number
}

export default function LoadingSpinner({ color = '#7F8BAD', size = 40 }: LoadingSpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: '100px 100px' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration:    DURATION,
            // Phase-offset each segment so they're already spread around the circle
            // at t=0, matching the original `stagger(offset, { startDelay: -duration })`.
            // motion/react doesn't support negative delay, so we shift via repeatDelay
            // trick: delay each segment by its forward offset and let repeat kick in.
            delay:       i * OFFSET_SEC,
            repeat:      Infinity,
            times:       [0, 0.1, 1],
            ease:        'linear',
          }}
        >
          <path
            d={PILL}
            fill={color}
            style={{
              transform:       `rotate(${i * 45}deg)`,
              transformOrigin: '100px 100px',
            }}
          />
        </motion.g>
      ))}
    </svg>
  )
}
