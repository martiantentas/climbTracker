import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Zap, BarChart2, Users, Shield,
  ArrowRight, Check, ChevronDown, Trophy,
  Layers, Sparkles, Moon, Sun,
} from 'lucide-react'
import ascendiaLogo from '../assets/Ascendr.webp'
import type { Language } from '../translations'
import { translations } from '../translations'

import DotPattern    from '../components/DotPattern'
import PlexusCanvas  from '../components/PlexusCanvas'
import { openCookiePreferences } from '../components/CookieBanner'

const THEME_KEY = 'ascendr_landing_theme'

interface LandingPageProps {
  lang:    Language
  setLang: (l: Language) => void
}

export default function LandingPage({ lang, setLang }: LandingPageProps) {
  const navigate = useNavigate()
  const heroRef  = useRef<HTMLDivElement>(null)
  const t = translations[lang]
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark' }
    catch { return 'dark' }
  })

  const isDark = theme === 'dark'

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem(THEME_KEY, next) } catch {}
  }

  const goAuth = (tab: 'signin' | 'signup') => navigate(`/${lang}/auth?tab=${tab}`)

  const C = isDark ? {
    bg:      '#121212',
    bgAlt:   '#13161B',
    bgCard:  'rgba(255,255,255,0.03)',
    border:  'rgba(255,255,255,0.08)',
    navBg:   'rgba(18,18,18,0.88)',
    accent:  '#7F8BAD',
    txt:     '#EEEEEE',
    txtMid:  '#8E8E8E',
    txtLow:  '#5C5E62',
    mono:    "'SF Mono', 'Fira Code', 'Consolas', monospace",
  } : {
    bg:      '#F7F6F3',
    bgAlt:   '#EEECEA',
    bgCard:  'rgba(0,0,0,0.025)',
    border:  'rgba(0,0,0,0.07)',
    navBg:   'rgba(247,246,243,0.92)',
    accent:  '#5E6B8A',
    txt:     '#111111',
    txtMid:  '#555555',
    txtLow:  '#888888',
    mono:    "'SF Mono', 'Fira Code', 'Consolas', monospace",
  }

  const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

  const btnPrimary: React.CSSProperties = {
    background: C.accent, color: '#fff', fontWeight: 600, fontSize: 14,
    padding: '10px 22px', borderRadius: 6, border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'background 0.33s', letterSpacing: '-0.01em', fontFamily: F,
  }
  const btnOutline: React.CSSProperties = {
    background: 'transparent', color: C.txtMid, fontWeight: 500, fontSize: 14,
    padding: '10px 22px', borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7,
    transition: 'all 0.33s', letterSpacing: '-0.01em', fontFamily: F,
  }
  const glass: React.CSSProperties = {
    background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
  }

  const rowBg  = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)'
  const tagBg  = isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.04)'
  const barBg  = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.06)'

  const stdFeatures = [
    'Up to 300 participants', 'Live leaderboard',
    'Dynamic Pot & Traditional scoring', 'Zone scoring & attempt penalties',
    'Judge approval & self-log modes', 'Categories & custom traits',
    'Analytics dashboard', 'Extra capacity bundles',
  ]
  const premFeatures: (string | [string, true])[] = [
    'Up to 500 participants', 'Everything in Standard', 'Lower overage rate (€0.10/p)',
    ['White-label logo', true], ['Custom accent colour', true], ['Light & dark theme colours', true],
  ]
  const freeFeatures = [
    'Join any competition by code',
    'Self-log scores (when enabled)',
    'Live leaderboard access',
    'Public leaderboard view',
  ]

  // Light-mode pricing warm colours (used only in !isDark)
  const LP = {
    bg:      'linear-gradient(148deg, #FBF0E8 0%, #F2E4D4 42%, #EAD8C0 72%, #E2CEAF 100%)',
    txt:     '#1A1206',
    mid:     '#7A6A50',
    low:     '#8A7A60',
    chk:     '#A0906E',
    card:    '#FFFFFF',
    shadow1: '0 4px 32px rgba(0,0,0,0.07)',
    shadow2: '0 8px 48px rgba(0,0,0,0.12)',
  }

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: F, minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.3s, color 0.3s' }}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.1; transform: scale(1.12); } }
        .anim-1 { animation: fadeUp 0.6s ease both; }
        .anim-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .anim-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .anim-4 { animation: fadeUp 0.6s 0.32s ease both; }
        .chevron-pulse { animation: pulse-slow 3s ease-in-out infinite; }
        #features, #workflow, #pricing { scroll-margin-top: 64px; }
        .lp-card { transition: border-color 0.33s, transform 0.33s; }
        .lp-card:hover { border-color: ${isDark ? 'rgba(127,139,173,0.35)' : 'rgba(94,107,138,0.3)'} !important; transform: translateY(-2px); }
        .pricing-card { transition: box-shadow 0.33s, transform 0.33s; }
        .pricing-card:hover { transform: translateY(-3px); }
        .btn-primary:hover { background: ${isDark ? '#6D799B' : '#4A5876'} !important; }
        .btn-outline:hover { background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} !important; color: ${isDark ? '#EEEEEE' : '#111111'} !important; }
        .lp-lang { background: transparent; border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}; color: ${isDark ? '#8E8E8E' : '#555555'}; font-size: 12px; font-weight: 600; padding: 5px 8px; border-radius: 5px; cursor: pointer; outline: none; }
        .lp-lang:hover { border-color: ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'}; color: ${isDark ? '#EEEEEE' : '#111111'}; }
        .nav-btn { font-size: 13px; font-weight: 500; color: ${isDark ? '#5C5E62' : '#888888'}; background: transparent; border: none; cursor: pointer; padding: 6px 14px; border-radius: 6px; transition: color 0.33s, background 0.33s; }
        .nav-btn:hover { color: ${isDark ? '#EEEEEE' : '#111111'} !important; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .bento-grid { grid-template-columns: 1fr !important; }
          .span-8 { grid-column: span 1 !important; }
          .span-4 { grid-column: span 1 !important; }
          .span-12 { grid-column: span 1 !important; }
          .span-6 { grid-column: span 1 !important; }
          .hero-ctas { flex-direction: column; align-items: stretch; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: C.navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, transition: 'background 0.3s, border-color 0.3s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={ascendiaLogo} alt="Ascendr" width="120" height="120" style={{ height: 30, width: 'auto', objectFit: 'contain' }} fetchPriority="high" />
          </div>

          <div className="hide-mobile" style={{ display: 'flex', gap: 4 }}>
            {([[t.navFeatures, 'features'], [t.navHowWorks, 'workflow'], [t.navPricing, 'pricing']] as [string, string][]).map(([label, id]) => (
              <button key={id} className="nav-btn" style={{ fontFamily: F }}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              >{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', color: C.txtMid, transition: 'all 0.3s' }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <select value={lang} onChange={e => setLang(e.target.value as Language)} className="lp-lang" aria-label="Language">
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="ca">CA</option>
            </select>

            <motion.button onClick={() => goAuth('signin')} style={{ ...btnOutline, padding: '8px 16px' }} className="btn-outline"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
              {t.landingSignIn}
            </motion.button>
            <motion.button onClick={() => goAuth('signup')} style={{ ...btnPrimary, padding: '8px 16px' }} className="btn-primary"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
              {t.landingGetStarted}
            </motion.button>
          </div>
        </div>
      </nav>

      <main>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden', background: C.bg }}>
        {!isMobile && <PlexusCanvas accent={isDark ? undefined : { r: 94, g: 107, b: 138 }} />}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to bottom, transparent 0%, ${isDark ? 'rgba(18,18,18,0.7)' : 'rgba(247,246,243,0.7)'} 45%, ${C.bg} 100%)`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="anim-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28, padding: '5px 14px', borderRadius: 999, border: `1px solid ${C.accent}30`, background: `${C.accent}0D`, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
            <Zap size={11} fill={C.accent} />
            {t.landingTagline}
          </div>
          <h1 className="anim-2" style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 300, lineHeight: 1.08, letterSpacing: '-0.04em', color: C.txt, margin: '0 0 22px' }}>
            {t.landingHero1}<br />
            <span style={{ fontWeight: 700, color: C.accent }}>{t.landingHero2}</span>
          </h1>
          <p className="anim-3" style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.65, color: C.txtMid, maxWidth: 520, margin: '0 auto 44px' }}>
            {t.landingHeroDesc}
          </p>
          <div className="anim-4 hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button onClick={() => goAuth('signup')} style={{ ...btnPrimary, fontSize: 15, padding: '13px 28px' }} className="btn-primary"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
              {t.landingStart} <ArrowRight size={16} />
            </motion.button>
            <motion.button onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })} style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }} className="btn-outline"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
              {t.landingHowWorks}
            </motion.button>
          </div>
          <div style={{ marginTop: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: C.txtLow }}>
            <ChevronDown size={15} className="chevron-pulse" />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>{t.landingFeatures}</p>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: 0 }}>
            {t.landingFeatTitle}<br /><span style={{ fontWeight: 700 }}>{t.landingFeatTitle2}</span>
          </h2>
        </div>

        <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>

          {/* Live scoring */}
          <div className="lp-card span-8" style={{ ...glass, gridColumn: 'span 8', padding: 40, position: 'relative', overflow: 'hidden', minHeight: 300 }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Zap size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>{t.featLiveTitle}</h3>
            <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 0 28px' }}>{t.featLiveDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['1', 'Mikel R.', '840 pts', true], ['2', 'Sara P.', '720 pts', false], ['3', 'Marc V.', '680 pts', false]].map(([rank, name, pts, hi]) => (
                <div key={String(rank)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, background: hi ? `${C.accent}12` : rowBg, border: `1px solid ${hi ? `${C.accent}30` : C.border}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hi ? C.accent : C.txtLow, width: 18 }}>{rank}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.txt }}>{name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: C.mono }}>{pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="lp-card span-4" style={{ ...glass, gridColumn: 'span 4', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <BarChart2 size={19} color={C.accent} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>{t.featAnalytics}</h3>
              <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55 }}>{t.featAnalyticsDesc}</p>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Flash rate', '34%', C.accent], ['Top rate', '71%', '#34d399'], ['Zone rate', '89%', '#a78bfa']].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: C.txtLow, width: 62 }}>{label}</span>
                  <div style={{ flex: 1, height: 3, background: barBg, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: val, height: '100%', background: color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 30, textAlign: 'right', fontFamily: C.mono }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flexible scoring */}
          <div className="lp-card span-4" style={{ ...glass, gridColumn: 'span 4', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Trophy size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>{t.featFlexTitle}</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>{t.featFlexDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Dynamic Pot', 'Traditional', 'Zone tie-breaker', '% Slash per attempt'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.txtMid }}>
                  <Check size={12} color={C.accent} strokeWidth={2.5} /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Judge modes */}
          <div className="lp-card span-8" style={{ ...glass, gridColumn: 'span 8', padding: 40, display: 'flex', alignItems: 'center', gap: 36 }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Shield size={19} color={C.accent} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>{t.featSelfLog}</h3>
              <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6 }}>{t.featSelfLogDesc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {[['Self-Scoring', true], ['Judge Approval', false], ['Judge Only', false]].map(([mode, active]) => (
                <div key={String(mode)} style={{ padding: '9px 18px', borderRadius: 7, background: active ? `${C.accent}15` : rowBg, border: `1px solid ${active ? `${C.accent}35` : C.border}`, fontSize: 12, fontWeight: 600, color: active ? C.accent : C.txtLow }}>
                  {mode}
                </div>
              ))}
            </div>
          </div>

          {/* Traits */}
          <div className="lp-card span-6" style={{ ...glass, gridColumn: 'span 6', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Users size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>{t.featTraits}</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 18 }}>{t.featTraitsDesc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['Open', 'U18', 'Masters', 'Women', 'Elite'].map(tag => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 5, background: tagBg, border: `1px solid ${C.border}`, fontSize: 11, color: C.txtMid, fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Invite */}
          <div className="lp-card span-6" style={{ ...glass, gridColumn: 'span 6', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Layers size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>{t.featInvite}</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 18 }}>{t.featInviteDesc}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 7, background: tagBg, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.txtLow }}>{t.inviteCode}</span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: C.accent, fontFamily: C.mono }}>BLDG24</span>
            </div>
          </div>

          {/* White-label */}
          <div className="lp-card span-12" style={{ ...glass, gridColumn: 'span 12', padding: 40, display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', borderColor: `${C.accent}25` }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '4px 12px', borderRadius: 999, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
                <Sparkles size={10} fill={C.accent} /> {t.pricingPrem}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>{t.featBranding}</h3>
              <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>{t.featBrandingDesc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {[t.logoLabel, t.accentColour, t.coloursLabel].map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.txtMid }}>
                  <Check size={13} color={C.accent} strokeWidth={2.5} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ WORKFLOW ═════════════════════════════════════════════════════════ */}
      <section id="workflow" style={{ padding: '100px 24px 0', background: C.bgAlt, borderTop: `1px solid ${C.border}`, position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>{t.landingHowWorks}</p>
              <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: 0 }}>
                {t.workflowTitle}<br /><span style={{ fontWeight: 700 }}>{t.workflowTitle2}</span>
              </h2>
            </div>
            <p style={{ color: C.txtLow, maxWidth: 340, lineHeight: 1.65, fontSize: 14 }}>{t.workflowDesc}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 1, background: `linear-gradient(90deg, ${C.accent}50, ${C.accent}10)`, pointerEvents: 'none' }} className="hide-mobile" />
            {([
              ['01', t.workStep1title, t.workStep1desc, C.accent],
              ['02', t.workStep2title, t.workStep2desc, '#34d399'],
              ['03', t.workStep3title, t.workStep3desc, '#f59e0b'],
              ['04', t.workStep4title, t.workStep4desc, C.accent],
            ] as [string, string, string, string][]).map(([num, title, desc, color]) => (
              <div key={num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: C.bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontWeight: 700, fontSize: 16, color, fontFamily: C.mono }}>{num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.txt, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 13, color: C.txtLow, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 100, background: `linear-gradient(to bottom, ${C.bgAlt}, ${isDark ? C.bg : 'transparent'})`, pointerEvents: 'none' }} />
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', overflow: 'hidden', background: isDark ? C.bg : 'transparent' }}>
        {isDark && !isMobile && <DotPattern baseColor="#2a2f3d" glowColor="#7F8BAD" gap={26} dotSize={2} proximity={140} waveSpeed={0.4} />}
        {!isDark && <div style={{ position: 'absolute', inset: 0, background: LP.bg, pointerEvents: 'none' }} />}

        <section id="pricing" style={{ padding: '100px 24px 120px', maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', color: isDark ? C.txt : LP.txt, margin: '0 0 16px', lineHeight: 1.1 }}>
              {t.pricingTitle}<br />{t.pricingTitle2}
            </h2>
            <p style={{ fontSize: 16, color: isDark ? C.txtMid : LP.mid, lineHeight: 1.65, maxWidth: 440, margin: '0 auto' }}>{t.pricingDesc}</p>
          </div>

          {/* 3-column cards */}
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.08fr 1fr', gap: 16, marginBottom: 20, alignItems: 'start' }}>

            {/* Competitor — free */}
            <div className="pricing-card" style={{
              background: isDark ? '#1A1D24' : LP.card,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 20, padding: '36px 32px 40px',
              display: 'flex', flexDirection: 'column',
              boxShadow: isDark ? 'none' : LP.shadow1,
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? C.txtMid : LP.low, margin: '0 0 20px', letterSpacing: '-0.01em' }}>Competitor</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: isDark ? C.txt : LP.txt, lineHeight: 1, letterSpacing: '-0.03em' }}>€0</span>
              </div>
              <p style={{ fontSize: 13, color: isDark ? C.txtMid : LP.mid, marginBottom: 28, lineHeight: 1.55 }}>
                Participate in any event. Always free.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {freeFeatures.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: isDark ? C.txtMid : '#6A5A44' }}>
                    <Check size={13} color={isDark ? C.accent : LP.chk} strokeWidth={2.5} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => goAuth('signup')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: isDark ? C.accent : C.accent,
                padding: '10px 0', fontFamily: F, letterSpacing: '-0.01em', textAlign: 'left',
              }}>
                {t.landingStart} →
              </button>
            </div>

            {/* Standard — featured */}
            <div className="pricing-card" style={{
              background: isDark ? '#1E2330' : LP.card,
              border: `1.5px solid ${isDark ? C.accent + '40' : 'rgba(0,0,0,0.10)'}`,
              borderRadius: 20, padding: '40px 32px 44px',
              display: 'flex', flexDirection: 'column',
              boxShadow: isDark ? `0 0 40px ${C.accent}12` : LP.shadow2,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Recommended badge */}
              <div style={{
                position: 'absolute', top: 20, right: 20,
                padding: '4px 12px', borderRadius: 999,
                background: isDark ? C.txt : LP.txt,
                color: isDark ? '#121212' : '#FFFFFF',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
              }}>
                {t.pricingPopular}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, margin: '0 0 20px', letterSpacing: '-0.01em' }}>{t.pricingStd}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: isDark ? C.txt : LP.txt, lineHeight: 1, letterSpacing: '-0.03em' }}>€129</span>
                <span style={{ fontSize: 13, color: isDark ? C.txtMid : LP.low }}>{t.pricingPerEvent}</span>
              </div>
              <p style={{ fontSize: 13, color: isDark ? C.txtMid : LP.mid, marginBottom: 28, lineHeight: 1.55 }}>
                Everything you need to run a great competition.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {stdFeatures.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: isDark ? C.txtMid : '#5A4A38' }}>
                    <Check size={13} color={C.accent} strokeWidth={2.5} /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => goAuth('signup')}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                style={{
                  background: isDark ? C.txt : LP.txt,
                  color: isDark ? '#121212' : '#FFFFFF',
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 700,
                  padding: '13px 24px', borderRadius: 10, fontFamily: F,
                  letterSpacing: '-0.01em', transition: 'opacity 0.2s',
                }}>
                {t.landingGetStarted}
              </button>
            </div>

            {/* Premium */}
            <div className="pricing-card" style={{
              background: isDark ? '#1A1D24' : LP.card,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 20, padding: '36px 32px 40px',
              display: 'flex', flexDirection: 'column',
              boxShadow: isDark ? 'none' : LP.shadow1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, margin: 0, letterSpacing: '-0.01em' }}>{t.pricingPrem}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: `${C.accent}18`, fontSize: 10, fontWeight: 700, color: C.accent }}>
                  <Sparkles size={8} fill={C.accent} /> Premium
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: isDark ? C.txt : LP.txt, lineHeight: 1, letterSpacing: '-0.03em' }}>€209</span>
                <span style={{ fontSize: 13, color: isDark ? C.txtMid : LP.low }}>{t.pricingPerEvent}</span>
              </div>
              <p style={{ fontSize: 13, color: isDark ? C.txtMid : LP.mid, marginBottom: 28, lineHeight: 1.55 }}>
                Full brand control for high-profile events.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {premFeatures.map((f) => {
                  const isNew = Array.isArray(f)
                  const label = isNew ? f[0] : f
                  return (
                    <li key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: isDark ? (isNew ? C.txt : C.txtMid) : (isNew ? '#3A2A18' : '#6A5A44') }}>
                      <Check size={13} color={C.accent} strokeWidth={2.5} />
                      {label}
                      {isNew && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: C.accent, background: `${C.accent}15`, padding: '2px 6px', borderRadius: 4 }}>{t.pricingPrem}</span>}
                    </li>
                  )
                })}
              </ul>
              <button onClick={() => goAuth('signup')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = isDark ? C.txt : LP.txt }}
                style={{
                  background: 'none',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  color: isDark ? C.txt : LP.txt,
                  padding: '12px 24px', borderRadius: 10, fontFamily: F,
                  letterSpacing: '-0.01em', transition: 'all 0.2s',
                }}>
                {t.landingGetStarted}
              </button>
            </div>
          </div>

          {/* Bundles callout */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 16, padding: '28px 36px', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: isDark ? C.txt : LP.txt, margin: '0 0 4px', letterSpacing: '-0.01em' }}>{t.pricingBundles}</h3>
              <p style={{ fontSize: 13, color: isDark ? C.txtLow : LP.mid, margin: 0, lineHeight: 1.55 }}>{t.pricingBundlesDesc}</p>
            </div>
            <button onClick={() => goAuth('signup')} style={{
              background: 'none', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.20)'}`,
              color: isDark ? C.txtMid : '#5A4A38', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              padding: '9px 18px', borderRadius: 8, fontFamily: F,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {t.pricingViewBundles} <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <div style={{ height: 80, background: `linear-gradient(to bottom, ${isDark ? C.bg : '#E2CEAF'}, ${C.bgAlt})`, pointerEvents: 'none' }} />
      <section style={{ padding: '0 24px 80px', background: C.bgAlt }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 16px' }}>
            {t.ctaTitle}<br /><span style={{ fontWeight: 700 }}>{t.ctaTitle2}</span>
          </h2>
          <p style={{ fontSize: 15, color: C.txtLow, lineHeight: 1.65, marginBottom: 36 }}>{t.ctaDesc}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <motion.button onClick={() => goAuth('signup')} style={{ ...btnPrimary, fontSize: 15, padding: '13px 32px' }} className="btn-primary"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
              {t.landingStart} <ArrowRight size={16} />
            </motion.button>
            <motion.button onClick={() => navigate(`/${lang}/demo`)} style={{ ...btnOutline, fontSize: 15, padding: '13px 32px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.txt; (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.txtMid; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
              {t.bookDemo}
            </motion.button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <img src={ascendiaLogo} alt="Ascendr" width="120" height="120" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {([
              [t.bookDemo,    '/demo'],
              ['Legal Notice', '/legal'],
              [t.privacy,     '/privacy'],
              [t.terms,       '/terms'],
            ] as [string, string][]).map(([label, path]) => (
              <button
                key={path}
                onClick={() => navigate(`/${lang}${path}`)}
                style={{ fontSize: 12, color: C.txtLow, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 5, transition: 'color 0.33s, background 0.33s', fontFamily: F }}
                onMouseEnter={e => { e.currentTarget.style.color = C.txt; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = C.txtLow; e.currentTarget.style.background = 'transparent' }}
              >{label}</button>
            ))}
            <button
              onClick={openCookiePreferences}
              style={{ fontSize: 12, color: C.txtLow, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 5, transition: 'color 0.33s, background 0.33s', fontFamily: F }}
              onMouseEnter={e => { e.currentTarget.style.color = C.txt; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.color = C.txtLow; e.currentTarget.style.background = 'transparent' }}
            >Cookies</button>
          </div>
          <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>© 2026 Ascendr</p>
        </div>
      </footer>

      </main>
    </div>
  )
}
