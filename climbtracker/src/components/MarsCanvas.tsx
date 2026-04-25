import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── GLSL ─────────────────────────────────────────────────────────────────────
// Terrain scrolls forward by incrementing tz = uTime * SPEED (in world units).
// SPEED = 40  →  noise coord shifts 40/SCALE = 40/32 ≈ 1.25 noise-units/sec
// → each hill (~1 noise-unit wide) passes the camera in ~0.8 s.  Very visible.

const vert = /* glsl */`
uniform float uTime;
varying float vH;
varying vec3  vN;

float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}
float vn(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  return vn(p)*0.500+vn(p*2.13)*0.250+vn(p*4.37)*0.125+vn(p*8.91)*0.0625;
}
// height: [-2, 7]
float th(vec2 p){ return fbm(p)*9.0-2.0; }

void main(){
  // world-z scroll: 8 units/sec, negative → terrain approaches camera (fly-in feel)
  float tz = uTime * 8.0;
  vec2  nc = vec2(position.x/32.0, (position.z-tz)/32.0);
  float h  = th(nc);
  vH = h;

  // finite-difference normal for lighting
  float d = 1.0;
  float hL=th(vec2((position.x-d)/32.0,(position.z-tz)/32.0));
  float hR=th(vec2((position.x+d)/32.0,(position.z-tz)/32.0));
  float hB=th(vec2( position.x/32.0,(position.z-d-tz)/32.0));
  float hF=th(vec2( position.x/32.0,(position.z+d-tz)/32.0));
  vN = normalize(vec3(hL-hR, 2.0*d, hB-hF));

  gl_Position = projectionMatrix*modelViewMatrix*vec4(position.x,h,position.z,1.0);
}
`

const frag = /* glsl */`
varying float vH;
varying vec3  vN;
uniform vec3  uSun;
uniform vec3  uFog;
uniform float uFogD;

void main(){
  float t = clamp((vH+2.0)/9.0, 0.0, 1.0);
  vec3 c0=vec3(0.14,0.04,0.01), c1=vec3(0.40,0.13,0.04),
       c2=vec3(0.62,0.26,0.09), c3=vec3(0.76,0.44,0.22), c4=vec3(0.87,0.64,0.43);
  vec3 col;
  if(t<0.20)      col=mix(c0,c1,t/0.20);
  else if(t<0.45) col=mix(c1,c2,(t-0.20)/0.25);
  else if(t<0.72) col=mix(c2,c3,(t-0.45)/0.27);
  else            col=mix(c3,c4,(t-0.72)/0.28);

  float diff=max(dot(normalize(vN),normalize(uSun)),0.0);
  col *= 0.25+0.75*diff;

  float depth=gl_FragCoord.z/gl_FragCoord.w;
  float ff=1.0-exp(-(uFogD*uFogD)*depth*depth);
  gl_FragColor=vec4(mix(col,uFog,clamp(ff,0.0,1.0)),1.0);
}
`

// ─── JS terrain mirror — must match shader exactly ────────────────────────────
function jh(x: number, y: number) {
  const s = Math.sin(x*127.1+y*311.7)*43758.5453
  return s - Math.floor(s)
}
function jv(x: number, y: number) {
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy
  const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy)
  const a=jh(ix,iy), b=jh(ix+1,iy), c=jh(ix,iy+1), d=jh(ix+1,iy+1)
  return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v
}
function jfbm(x: number, y: number) {
  return jv(x,y)*0.500+jv(x*2.13,y*2.13)*0.250+jv(x*4.37,y*4.37)*0.125+jv(x*8.91,y*8.91)*0.0625
}
// Matches shader: tz = t * 8; nc = (wx/32, (wz-tz)/32)
function terrainAt(wx: number, wz: number, t: number) {
  return jfbm(wx/32, (wz - t*8)/32)*9 - 2
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MarsCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const W = rect.width  || window.innerWidth
    const H = rect.height || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setSize(W, H, false)

    const SKY = new THREE.Color(0x130401)
    renderer.setClearColor(SKY)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, W/H, 0.5, 400)
    camera.position.set(0, 10, 0)

    // Plane is wide and DEEP — camera sits near one end and looks forward
    const geo = new THREE.PlaneGeometry(300, 300, 200, 200)
    geo.rotateX(-Math.PI/2)
    // Shift plane so most of it is AHEAD of the camera (in -z direction)
    geo.translate(0, 0, -120)

    const uniforms = {
      uTime: { value: 0 },
      uSun:  { value: new THREE.Vector3(-0.3, 1.0, 0.3).normalize() },
      uFog:  { value: new THREE.Vector3(SKY.r, SKY.g, SKY.b) },
      uFogD: { value: 0.012 },
    }
    scene.add(new THREE.Mesh(geo, new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
    })))

    const clock = new THREE.Clock()
    let camY = 10
    let camX = 0
    let raf  = 0

    function tick() {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      uniforms.uTime.value = t

      // Autonomous serpentine drift
      const targetX = Math.sin(t * 0.14) * 18 + Math.sin(t * 0.09) * 9
      camX += (targetX - camX) * 0.015

      // Terrain height at camera (z=0) and 30 units ahead (z=-30)
      const hNow   = terrainAt(camX,   0, t)
      const hAhead = terrainAt(camX, -30, t)
      const targetY = Math.max(hNow, hAhead) + 5.5
      camY += (targetY - camY) * 0.06

      camera.position.set(camX, camY, 0)

      // Look ahead and slightly down — horizontal fly-through feel
      // Bank into the drift by tilting the up vector
      const driftSpeed = Math.cos(t * 0.14) * 0.14 * 18 + Math.cos(t * 0.09) * 0.09 * 9
      const bankAngle  = -driftSpeed * 0.006   // subtle roll into turns
      camera.up.set(Math.sin(bankAngle), Math.cos(bankAngle), 0)

      const lookX = camX * 0.2
      const lookY = camY - 2.0
      camera.lookAt(lookX, lookY, -60)

      renderer.render(scene, camera)
    }
    tick()

    function onResize() {
      const r = canvas!.getBoundingClientRect()
      const w = r.width  || window.innerWidth
      const h = r.height || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
