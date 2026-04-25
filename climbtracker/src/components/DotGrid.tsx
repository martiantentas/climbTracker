import { useEffect, useRef } from 'react'

interface DotGridProps {
  color?:   string
  spacing?: number
  radius?:  number
}

export default function DotGrid({ color = '#7F8BAD', spacing = 26, radius = 120 }: DotGridProps) {
  const ref   = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    let W = 0, H = 0, dpr = 1, raf = 0
    let t0 = performance.now()

    function resize() {
      dpr = Math.min(devicePixelRatio, 2)
      const rect = canvas!.getBoundingClientRect()
      W = rect.width
      H = rect.height
      canvas!.width  = Math.round(W * dpr)
      canvas!.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    function draw() {
      raf = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, W, H)

      const t  = (performance.now() - t0) / 1000
      // Whole grid drifts slowly as one piece — gives the "floating layer" feel
      const ox = Math.sin(t * 0.22) * 4
      const oy = Math.cos(t * 0.17) * 4

      const mx = mouse.current.x
      const my = mouse.current.y

      for (let col = 0; col * spacing < W + spacing * 2; col++) {
        for (let row = 0; row * spacing < H + spacing * 2; row++) {
          const x = col * spacing + (ox % spacing)
          const y = row * spacing + (oy % spacing)

          const dx   = x - mx
          const dy   = y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          const prox = Math.max(0, 1 - dist / radius)
          const ease = prox * prox * (3 - 2 * prox)  // smooth-step

          // Base state: subtle but visible unified grid
          const dotR  = 1.0 + 3.0 * ease
          const alpha = 0.11 + 0.44 * ease

          ctx.beginPath()
          ctx.arc(x, y, dotR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          ctx.fill()
        }
      }
    }
    draw()

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onMouseLeave() {
      mouse.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      ro.disconnect()
    }
  }, [color, spacing, radius])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
        // Fade edges so it blends seamlessly with the sections above and below
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
      }}
    />
  )
}
