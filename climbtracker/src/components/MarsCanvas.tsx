import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── IMPROVED PERLIN NOISE ────────────────────────────────────────────────────

const PERM = (() => {
  const p = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,
    30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,
    219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,
    175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,
    230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,
    76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,
    186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,
    59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,
    70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
    178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
    81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,
    115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,
    195,78,66,215,61,156,180,
  ]
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  return perm
})()

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function grad(h: number, x: number, y: number, z: number) {
  h &= 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : (h === 12 || h === 14 ? x : z)
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}
function pnoise(x: number, y: number, z: number) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z)
  const u = fade(x), v = fade(y), w = fade(z)
  const A = PERM[X]+Y, AA = PERM[A]+Z, AB = PERM[A+1]+Z
  const B = PERM[X+1]+Y, BA = PERM[B]+Z, BB = PERM[B+1]+Z
  return lerp(
    lerp(lerp(grad(PERM[AA],  x,   y,   z),   grad(PERM[BA],  x-1, y,   z),   u),
         lerp(grad(PERM[AB],  x,   y-1, z),   grad(PERM[BB],  x-1, y-1, z),   u), v),
    lerp(lerp(grad(PERM[AA+1],x,   y,   z-1), grad(PERM[BA+1],x-1, y,   z-1), u),
         lerp(grad(PERM[AB+1],x,   y-1, z-1), grad(PERM[BB+1],x-1, y-1, z-1), u), v), w)
}

// ─── HEIGHT DATA ──────────────────────────────────────────────────────────────
// Ridge-folded fBm — creates sharp mountain ridges rather than smooth hills.

function generateHeightData(W: number, D: number, offsetY: number): Float32Array {
  const data = new Float32Array(W * D)
  const octaves: [number, number][] = [
    [1, 1], [2, 0.5], [4, 0.25], [8, 0.125], [16, 0.0625],
  ]
  for (let iz = 0; iz < D; iz++) {
    for (let ix = 0; ix < W; ix++) {
      let v = 0
      for (const [freq, amp] of octaves) {
        v += pnoise(ix / W * freq, (iz + offsetY) / D * freq, 1.3) * amp
      }
      // Ridge fold: abs + bias gives sharp peaks instead of sinusoidal bumps
      data[iz * W + ix] = Math.abs(v) * 2.2
    }
  }
  return data
}

// ─── TEXTURE ──────────────────────────────────────────────────────────────────
// Orange/brown Mars palette. Darkened ~30% from the reference to suit the
// site's dark theme — peaks hit ~rgb(190,78,17), valleys near rgb(35,14,3).

const SUN = new THREE.Vector3(1, 1.5, 0.5).normalize()

function makeTexture(data: Float32Array, W: number, D: number, HS: number): THREE.CanvasTexture {
  const vec = new THREE.Vector3()
  const base = document.createElement('canvas')
  base.width = W; base.height = D
  const ctx = base.getContext('2d')!
  const img = ctx.createImageData(W, D)
  const d = img.data

  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const h  = data[j]
    const hL = data[Math.max(j - 1, 0)]
    const hR = data[Math.min(j + 1, W * D - 1)]
    const hU = data[Math.max(j - W, 0)]
    const hD = data[Math.min(j + W, W * D - 1)]
    vec.set((hL - hR) * HS * 2, 2, (hU - hD) * HS * 2).normalize()
    const shade = Math.max(0, vec.dot(SUN))

    const base_ = 0.25 + h  * 0.55
    const lit   = 0.55 + shade * 0.55
    const f     = base_ * lit * 0.86   // ×0.86 darkens for the dark site theme

    d[i]   = Math.min(255, Math.round(220 * f))   // R — dominant orange
    d[i+1] = Math.min(255, Math.round(90  * f))   // G — muted
    d[i+2] = Math.min(255, Math.round(20  * f))   // B — near zero → warm
    d[i+3] = 255
  }
  ctx.putImageData(img, 0, 0)

  // Scale 4× + add grain
  const scaled = document.createElement('canvas')
  scaled.width = W * 4; scaled.height = D * 4
  const cx = scaled.getContext('2d')!
  cx.scale(4, 4); cx.drawImage(base, 0, 0)
  cx.setTransform(1, 0, 0, 1, 0, 0)
  const img2 = cx.getImageData(0, 0, scaled.width, scaled.height)
  const d2 = img2.data
  for (let i = 0; i < d2.length; i += 4) {
    const v = (Math.random() * 6) | 0
    d2[i] += v; d2[i+1] += v; d2[i+2] += v
  }
  cx.putImageData(img2, 0, 0)

  const tex = new THREE.CanvasTexture(scaled)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Slab = { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> }

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function MarsCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const mobile     = window.innerWidth < 768
    const W          = mobile ? 128 : 256
    const D          = mobile ? 128 : 256
    const SLAB_SIZE  = 6000
    const HEIGHT_SCL = 280
    const SLAB_COUNT = mobile ? 3 : 4
    const SPEED      = mobile ? 150 : 200

    const cW = canvas.clientWidth  || window.innerWidth
    const cH = canvas.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias:       !mobile,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.5))
    renderer.setSize(cW, cH, false)

    // Warm-dark sky — reference was #7a6058; darkened to suit the site's #121212 bg
    const SKY = 0x3d2520
    renderer.setClearColor(SKY)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(SKY)
    scene.fog = new THREE.FogExp2(SKY, 0.0014)

    const camera = new THREE.PerspectiveCamera(70, cW / cH, 0.1, 8000)
    camera.position.set(0, 500, 0)

    // ── Build initial slabs ───────────────────────────────────────────────────
    // Slabs are placed behind the camera and move toward +z.
    // Camera stays at z=0 and always looks toward z=-2000.
    let noiseCounter = 0
    const slabs: Slab[] = []

    function spawnSlab(noiseOffset: number, zPos: number): Slab {
      const hData = generateHeightData(W, D, noiseOffset)
      const geo   = new THREE.PlaneGeometry(SLAB_SIZE, SLAB_SIZE, W - 1, D - 1)
      geo.rotateX(-Math.PI / 2)
      const pos = geo.attributes.position.array as Float32Array
      for (let i = 0; i < hData.length; i++) pos[i * 3 + 1] = hData[i] * HEIGHT_SCL
      geo.computeVertexNormals()
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: makeTexture(hData, W, D, HEIGHT_SCL) }))
      mesh.position.z = zPos
      scene.add(mesh)
      return { mesh }
    }

    for (let i = 0; i < SLAB_COUNT; i++) {
      slabs.push(spawnSlab(noiseCounter++ * D, -i * SLAB_SIZE + SLAB_SIZE))
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    let last = performance.now()
    let raf  = 0

    function tick(now: number) {
      raf = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const t = now * 0.0003

      // Advance all slabs toward the camera (+z direction)
      for (const s of slabs) {
        s.mesh.position.z += SPEED * dt

        // When a slab passes 1.5× slab-lengths ahead, recycle it to the back
        if (s.mesh.position.z > SLAB_SIZE * 1.5) {
          const minZ = Math.min(...slabs.map(x => x.mesh.position.z))
          s.mesh.position.z = minZ - SLAB_SIZE

          // Regenerate this slab with fresh noise
          const hData = generateHeightData(W, D, noiseCounter++ * D)
          const pos   = s.mesh.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < hData.length; i++) pos[i * 3 + 1] = hData[i] * HEIGHT_SCL
          s.mesh.geometry.attributes.position.needsUpdate = true
          s.mesh.geometry.computeVertexNormals()
          s.mesh.material.map?.dispose()
          s.mesh.material.map = makeTexture(hData, W, D, HEIGHT_SCL)
          s.mesh.material.needsUpdate = true
        }
      }

      // Camera: fixed position, gentle side sway, always looking forward and down
      camera.position.x = Math.sin(t * 0.5) * 300
      camera.position.y = 480 + Math.sin(t * 0.8) * 20
      camera.lookAt(
        Math.sin(t * 0.5 + 0.4) * 150,
        200,
        camera.position.z - 2000,
      )

      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(tick)

    // ── Resize ────────────────────────────────────────────────────────────────
    function onResize() {
      const w = canvas!.clientWidth  || window.innerWidth
      const h = canvas!.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      for (const s of slabs) {
        scene.remove(s.mesh)
        s.mesh.geometry.dispose()
        s.mesh.material.map?.dispose()
        s.mesh.material.dispose()
      }
      renderer.dispose()
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
