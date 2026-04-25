import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── GLSL ─────────────────────────────────────────────────────────────────────
// Bird-view cloud flyover: camera high up, looking nearly straight down.
// Terrain represents cloud tops — white at peaks, dark-blue gaps between clouds.
// Slow drift gives a peaceful "flying over a low-density cloudscape" feel.

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
  // Fewer octaves → broader, rounder cloud shapes
  return vn(p)*0.500+vn(p*1.97)*0.280+vn(p*3.91)*0.140+vn(p*7.83)*0.060+vn(p*15.7)*0.020;
}
// height in [-1.5, 8.0] — broader range makes clouds look puffier
float th(vec2 p){ return fbm(p)*9.5-1.5; }

void main(){
  // Slow scroll: 4 units/sec, negative → approaching
  float tz = uTime * 4.0;
  vec2  nc = vec2(position.x/48.0, (position.z-tz)/48.0);
  float h  = th(nc);
  vH = h;

  float d = 1.0;
  float hL=th(vec2((position.x-d)/48.0,(position.z-tz)/48.0));
  float hR=th(vec2((position.x+d)/48.0,(position.z-tz)/48.0));
  float hB=th(vec2( position.x/48.0,(position.z-d-tz)/48.0));
  float hF=th(vec2( position.x/48.0,(position.z+d-tz)/48.0));
  vN = normalize(vec3(hL-hR, 2.5*d, hB-hF));

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
  // t=0: dark sky gaps, t=1: bright cloud tops
  float t = clamp((vH+1.5)/9.5, 0.0, 1.0);

  // Mars stone palette: dark basalt → orange dust → rust → warm tan peaks
  vec3 c0=vec3(0.09,0.03,0.01);   // deep basalt / shadowed crevice
  vec3 c1=vec3(0.28,0.10,0.03);   // dark rust
  vec3 c2=vec3(0.52,0.22,0.07);   // mid orange-brown
  vec3 c3=vec3(0.72,0.40,0.18);   // warm orange
  vec3 c4=vec3(0.88,0.62,0.38);   // dusty tan / sunlit ridge
  vec3 col;
  if(t<0.18)      col=mix(c0,c1,t/0.18);
  else if(t<0.40) col=mix(c1,c2,(t-0.18)/0.22);
  else if(t<0.68) col=mix(c2,c3,(t-0.40)/0.28);
  else            col=mix(c3,c4,(t-0.68)/0.32);

  // Gentle top-light diffuse (sun nearly overhead)
  float diff=max(dot(normalize(vN),normalize(uSun)),0.0);
  col *= 0.40+0.60*diff;

  float depth=gl_FragCoord.z/gl_FragCoord.w;
  float ff=1.0-exp(-(uFogD*uFogD)*depth*depth);
  gl_FragColor=vec4(mix(col,uFog,clamp(ff,0.0,1.0)),1.0);
}
`

// ─── JS terrain mirror ────────────────────────────────────────────────────────
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
  return jv(x,y)*0.500+jv(x*1.97,y*1.97)*0.280+jv(x*3.91,y*3.91)*0.140+jv(x*7.83,y*7.83)*0.060+jv(x*15.7,y*15.7)*0.020
}
function terrainAt(wx: number, wz: number, t: number) {
  return jfbm(wx/48, (wz - t*4)/48)*9.5 - 1.5
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

    // Dark Mars rust — hazy upper-atmosphere feel
    const SKY = new THREE.Color(0x100401)
    renderer.setClearColor(SKY)

    const scene  = new THREE.Scene()
    // Wide FOV for the top-down bird-view sprawl
    const camera = new THREE.PerspectiveCamera(65, W/H, 0.5, 500)
    camera.position.set(0, 22, 0)

    // Wider, deeper plane to fill the bird-view frame
    const geo = new THREE.PlaneGeometry(380, 380, 220, 220)
    geo.rotateX(-Math.PI/2)
    geo.translate(0, 0, -140)

    const uniforms = {
      uTime: { value: 0 },
      // Sun nearly directly overhead → brings out cloud tops clearly
      uSun:  { value: new THREE.Vector3(0.2, 1.0, 0.15).normalize() },
      uFog:  { value: new THREE.Vector3(SKY.r, SKY.g, SKY.b) },
      uFogD: { value: 0.008 },
    }
    scene.add(new THREE.Mesh(geo, new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
    })))

    const clock = new THREE.Clock()
    let camY = 22
    let camX = 0
    let raf  = 0

    function tick() {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      uniforms.uTime.value = t

      // Slow, wide serpentine drift — bird circling high above
      const targetX = Math.sin(t * 0.08) * 24 + Math.sin(t * 0.05) * 12
      camX += (targetX - camX) * 0.008

      // Stay high — just float gently over cloud terrain
      const hNow   = terrainAt(camX,   0, t)
      const hAhead = terrainAt(camX, -40, t)
      const targetY = Math.max(hNow, hAhead) + 18   // always high above clouds
      camY += (targetY - camY) * 0.025

      camera.position.set(camX, camY, 0)

      // Very steep downward angle — bird's eye, slight forward tilt so you see horizon
      const driftSpeed = Math.cos(t * 0.08) * 0.08 * 24 + Math.cos(t * 0.05) * 0.05 * 12
      const bankAngle  = -driftSpeed * 0.004
      camera.up.set(Math.sin(bankAngle), Math.cos(bankAngle), 0)

      // Look far ahead but mostly down — clouds spread below you
      const lookX = camX * 0.15
      camera.lookAt(lookX, 0, -55)

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
