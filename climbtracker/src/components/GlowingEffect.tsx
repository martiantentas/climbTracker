const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

interface GlowingEffectProps {
  blur?:        number
  spread?:      number
  variant?:     'default' | 'white'
  className?:   string
  disabled?:    boolean
  borderWidth?: number
  /** Seconds between sweeps. */
  period?:      number
  /** Seconds offset (negative starts mid-cycle); use it to stagger several cards. */
  delay?:       number
}

// Border glow that sweeps once around its parent every `period` seconds.
// Pure CSS animation (see `glow-sweep` in index.css): no listeners, no JS per frame.
// The parent must be `position: relative` and should set its own border-radius
// (the glow inherits it).
function GlowingEffect({
  blur = 0,
  spread = 40,
  variant = 'default',
  className,
  disabled = false,
  borderWidth = 1,
  period = 10,
  delay = 0,
}: GlowingEffectProps) {
  if (disabled) return null

  return (
    <div
      aria-hidden="true"
      style={
        {
          '--blur': `${blur}px`,
          '--spread': spread,
          '--glowingeffect-border-width': `${borderWidth}px`,
          '--repeating-conic-gradient-times': '5',
          animation: `glow-sweep ${period}s linear ${delay}s infinite`,
          '--gradient':
            variant === 'white'
              ? `repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #fff,
              #fff calc(25% / var(--repeating-conic-gradient-times))
            )`
              : `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
            radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
            radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%),
            radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
            repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #dd7bbb 0%,
              #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
              #5a922c calc(50% / var(--repeating-conic-gradient-times)),
              #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
              #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
            )`,
        } as React.CSSProperties
      }
      className={cx(
        'glow-sweep pointer-events-none absolute inset-0 rounded-[inherit]',
        blur > 0 && 'blur-[var(--blur)]',
        className,
      )}
    >
      <div
        className={cx(
          'rounded-[inherit]',
          'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
          'after:[border:var(--glowingeffect-border-width)_solid_transparent]',
          'after:[background:var(--gradient)] after:[background-attachment:fixed]',
          'after:opacity-[var(--glow-active)]',
          'after:[mask-clip:padding-box,border-box]',
          'after:[mask-composite:intersect]',
          'after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--glow-start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]',
        )}
      />
    </div>
  )
}

export { GlowingEffect }
export default GlowingEffect
