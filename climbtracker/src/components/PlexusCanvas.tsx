import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number
}

const DEFAULT_ACCENT = { r: 127, g: 139, b: 173 }   // #7F8BAD
const MAX_DIST   = 170
const BASE_SPEED = 0.35
const MAX_SPEED  = BASE_SPEED * 2.5
const DOT_ALPHA  = 0.65
const LINE_ALPHA = 0.28

interface PlexusCanvasProps {
  accent?: { r: number; g: number; b: number }
}

export default function PlexusCanvas({ accent = DEFAULT_ACCENT }: PlexusCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const accentRef = useRef(accent)
  accentRef.current = accent  // sync on every render so tick() always reads the current color

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let w = 0, h = 0, raf = 0
    const mouse = { x: -9999, y: -9999 }
    const particles: Particle[] = []

    function resize() {
      const dpr  = Math.min(devicePixelRatio, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width; h = rect.height
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
    }

    function spawn(forcePos?: { x: number; y: number }): Particle {
      const angle = Math.random() * Math.PI * 2
      const speed = BASE_SPEED * (0.4 + Math.random() * 0.6)
      return {
        x: forcePos?.x ?? Math.random() * w,
        y: forcePos?.y ?? Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.3 + Math.random() * 1.2,
      }
    }

    function init() {
      particles.length = 0
      // density: ~1 particle per 14 000px² of canvas area
      const count = Math.max(40, Math.min(120, Math.round((w * h) / 14000)))
      for (let i = 0; i < count; i++) particles.push(spawn())
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // Gentle mouse repulsion
        const mdx = p.x - mouse.x
        const mdy = p.y - mouse.y
        const mdist = Math.hypot(mdx, mdy)
        if (mdist < 110 && mdist > 0) {
          const force = ((110 - mdist) / 110) * 0.025
          p.vx += (mdx / mdist) * force
          p.vy += (mdy / mdist) * force
        }

        // Speed cap
        const spd = Math.hypot(p.vx, p.vy)
        if (spd > MAX_SPEED) { p.vx = (p.vx / spd) * MAX_SPEED; p.vy = (p.vy / spd) * MAX_SPEED }

        p.x += p.vx; p.y += p.vy

        // Soft wrap — particles that exit one edge re-enter the opposite
        if (p.x < -20)    p.x = w + 20
        if (p.x > w + 20) p.x = -20
        if (p.y < -20)    p.y = h + 20
        if (p.y > h + 20) p.y = -20
      }

      // Lines — O(n²) but n≤120, so ~7 000 checks/frame, well within budget
      ctx.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d  = Math.hypot(dx, dy)
          if (d >= MAX_DIST) continue
          const alpha = LINE_ALPHA * (1 - d / MAX_DIST)
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${accentRef.current.r},${accentRef.current.g},${accentRef.current.b},${alpha.toFixed(3)})`
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // Dots
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${accentRef.current.r},${accentRef.current.g},${accentRef.current.b},${DOT_ALPHA})`
        ctx.fill()
      }
    }

    resize()
    init()
    tick()

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    const ro = new ResizeObserver(() => { resize(); init() })
    ro.observe(canvas)
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
