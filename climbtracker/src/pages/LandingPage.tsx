import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Zap, BarChart2, Users, Shield,
  ArrowRight, Check, ChevronDown, Trophy, Palette,
  Layers, Sparkles,
} from 'lucide-react'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Matches the app: Carbon Dark #171A20, Electric Blue #3E6AE1

export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y    = window.scrollY
      const orb1 = document.getElementById('orb1')
      const orb2 = document.getElementById('orb2')
      if (orb1) orb1.style.transform = `translateY(${y * 0.15}px)`
      if (orb2) orb2.style.transform = `translateY(${y * -0.10}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goAuth = (tab: 'signin' | 'signup') => navigate(`/auth?tab=${tab}`)

  // ── shared style helpers ──────────────────────────────────────────────────
  const C = {
    bg:       '#171A20',
    bgAlt:    '#13161B',
    bgCard:   'rgba(255,255,255,0.03)',
    border:   'rgba(255,255,255,0.08)',
    accent:   '#3E6AE1',
    accentHi: '#5580E8',
    accentLo: 'rgba(62,106,225,0.12)',
    txt:      '#EEEEEE',
    txtMid:   '#8E8E8E',
    txtLow:   '#5C5E62',
    font:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    mono:     "'SF Mono', 'Fira Code', 'Consolas', monospace",
  }

  const btnPrimary: React.CSSProperties = {
    background: C.accent,
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    padding: '10px 22px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    transition: 'background 0.33s',
    letterSpacing: '-0.01em',
  }

  const btnOutline: React.CSSProperties = {
    background: 'transparent',
    color: C.txtMid,
    fontWeight: 500,
    fontSize: 14,
    padding: '10px 22px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    transition: 'all 0.33s',
    letterSpacing: '-0.01em',
  }

  const glass: React.CSSProperties = {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
  }

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: C.font, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50%      { opacity: 0.1; transform: scale(1.12); }
        }
        .anim-1 { animation: fadeUp 0.6s ease both; }
        .anim-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .anim-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .anim-4 { animation: fadeUp 0.6s 0.32s ease both; }
        .chevron-pulse { animation: pulse-slow 3s ease-in-out infinite; }
        .lp-card { transition: border-color 0.33s, transform 0.33s; }
        .lp-card:hover { border-color: rgba(62,106,225,0.35) !important; transform: translateY(-2px); }
        .btn-primary:hover { background: #3056C7 !important; }
        .btn-outline:hover { background: rgba(255,255,255,0.05) !important; color: #EEEEEE !important; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .bento-grid { grid-template-columns: 1fr !important; }
          .span-8 { grid-column: span 1 !important; }
          .span-4 { grid-column: span 1 !important; }
          .span-12 { grid-column: span 1 !important; }
          .hero-ctas { flex-direction: column; align-items: stretch; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(23,26,32,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div style={{ width: 30, height: 30, borderRadius: 6, background: `${C.accent}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color={C.accent} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.03em', color: C.txt }}>ClimbTracker</span>
          </div>

          {/* Nav links */}
          <div className="hide-mobile" style={{ display: 'flex', gap: 4 }}>
            {[['Features', '#features'], ['How it works', '#workflow'], ['Pricing', '#pricing']].map(([label, href]) => (
              <a
                key={label} href={href}
                style={{ fontSize: 13, fontWeight: 500, color: C.txtLow, textDecoration: 'none', padding: '6px 14px', borderRadius: 6, transition: 'color 0.33s, background 0.33s' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.txt; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = C.txtLow; e.currentTarget.style.background = 'transparent' }}
              >{label}</a>
            ))}
          </div>

          {/* Auth */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => goAuth('signin')}
              style={{ ...btnOutline, padding: '8px 16px' }}
              className="btn-outline"
            >
              Sign in
            </button>
            <button
              onClick={() => goAuth('signup')}
              style={{ ...btnPrimary, padding: '8px 16px' }}
              className="btn-primary"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Background orbs */}
        <div id="orb1" style={{ position: 'absolute', top: '12%', left: '8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,106,225,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div id="orb2" style={{ position: 'absolute', bottom: '8%', right: '4%',  width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,106,225,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Subtle dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none', opacity: 0.5 }} />

        <div style={{ maxWidth: 720, textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div className="anim-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28, padding: '5px 14px', borderRadius: 999, border: `1px solid ${C.accent}30`, background: `${C.accent}0D`, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
            <Zap size={11} fill={C.accent} />
            Professional Bouldering Competition Software
          </div>

          {/* Headline */}
          <h1 className="anim-2" style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 300, lineHeight: 1.08, letterSpacing: '-0.04em', color: C.txt, margin: '0 0 22px' }}>
            Score smarter.<br />
            <span style={{ fontWeight: 700, color: C.accent }}>Climb harder.</span>
          </h1>

          {/* Sub */}
          <p className="anim-3" style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.65, color: C.txtMid, maxWidth: 520, margin: '0 auto 44px' }}>
            Replace spreadsheets with live scoring, real-time leaderboards, and a seamless competitor experience — built for serious bouldering events.
          </p>

          {/* CTAs */}
          <div className="anim-4 hero-ctas" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => goAuth('signup')}
              style={{ ...btnPrimary, fontSize: 15, padding: '13px 28px' }}
              className="btn-primary"
            >
              Start your first event <ArrowRight size={16} />
            </button>
            <button
              onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ ...btnOutline, fontSize: 15, padding: '13px 28px' }}
              className="btn-outline"
            >
              How it works
            </button>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: C.txtLow, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <ChevronDown size={15} className="chevron-pulse" />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: 0 }}>
            Everything an organizer<br /><span style={{ fontWeight: 700 }}>actually needs.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>

          {/* Live scoring — large */}
          <div className="lp-card span-8" style={{ ...glass, gridColumn: 'span 8', padding: 40, position: 'relative', overflow: 'hidden', minHeight: 300 }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Zap size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>Live Recomputed Scoring</h3>
            <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 0 28px' }}>
              Dynamic Pot and Traditional scoring with automatic rank adjustment as results come in. Zero refreshing, zero spreadsheets.
            </p>
            {/* Mini leaderboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['1', 'Adam O.', '840 pts', true], ['2', 'Alex H.', '720 pts', false], ['3', 'Janja G.', '680 pts', false]].map(([rank, name, pts, hi]) => (
                <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8, background: hi ? `${C.accent}12` : 'rgba(255,255,255,0.025)', border: `1px solid ${hi ? `${C.accent}30` : C.border}` }}>
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
              <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>Deep Analytics</h3>
              <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55 }}>Flash rates, completion stats, and per-category breakdowns across all boulders.</p>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['Flash rate', '34%', C.accent], ['Top rate', '71%', '#34d399'], ['Zone rate', '89%', '#a78bfa']].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: C.txtLow, width: 62 }}>{label}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: val, height: '100%', background: color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 30, textAlign: 'right', fontFamily: C.mono }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring formats */}
          <div className="lp-card span-4" style={{ ...glass, gridColumn: 'span 4', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Trophy size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>Flexible Scoring</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>Dynamic Pot or Traditional with zone scoring, attempt penalties (fixed or % slash), and Top-K boulder counting.</p>
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
              <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>Self-Log &amp; Judge Approval</h3>
              <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6 }}>Choose self-scoring, judge approval, or judge-only modes per competition. Judges get a dedicated flow for quick top/zone validation.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {[['Self-Scoring', true], ['Judge Approval', false], ['Judge Only', false]].map(([mode, active]) => (
                <div key={String(mode)} style={{ padding: '9px 18px', borderRadius: 7, background: active ? `${C.accent}15` : 'rgba(255,255,255,0.025)', border: `1px solid ${active ? `${C.accent}35` : C.border}`, fontSize: 12, fontWeight: 600, color: active ? C.accent : C.txtLow }}>
                  {mode}
                </div>
              ))}
            </div>
          </div>

          {/* Category / traits */}
          <div className="lp-card span-6" style={{ ...glass, gridColumn: 'span 6', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Users size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>Categories &amp; Traits</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 18 }}>Define custom traits (age group, level, region…) per event. Competitors select them at join time. Filter the leaderboard by any combination.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['Open', 'U18', 'Masters', 'Women', 'Elite'].map(tag => (
                <span key={tag} style={{ padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, fontSize: 11, color: C.txtMid, fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Invite system */}
          <div className="lp-card span-6" style={{ ...glass, gridColumn: 'span 6', padding: 36 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.accent}1A`, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Layers size={19} color={C.accent} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 8px' }}>Invite in Seconds</h3>
            <p style={{ color: C.txtLow, fontSize: 13, lineHeight: 1.55, marginBottom: 18 }}>Share an invite code or link. Competitors self-register, get a BIB automatically, and appear on the live leaderboard instantly.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.txtLow }}>Invite code</span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: C.accent, fontFamily: C.mono }}>BLDG24</span>
            </div>
          </div>

          {/* White-label */}
          <div className="lp-card span-12" style={{ ...glass, gridColumn: 'span 12', padding: 40, display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', borderColor: `${C.accent}25` }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '4px 12px', borderRadius: 999, background: `${C.accent}15`, border: `1px solid ${C.accent}30`, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
                <Sparkles size={10} fill={C.accent} /> Premium
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 300, letterSpacing: '-0.02em', color: C.txt, margin: '0 0 10px' }}>White-Label Branding</h3>
              <p style={{ color: C.txtLow, fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>
                Replace the ClimbTracker logo with your own, and customise the accent colour and background to match your event's identity. Premium events look like your platform, not ours.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {[['Custom logo', Palette], ['Accent colour', Palette], ['Light & dark backgrounds', Palette]].map(([label]) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.txtMid }}>
                  <Check size={13} color={C.accent} strokeWidth={2.5} /> {label}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ WORKFLOW ═════════════════════════════════════════════════════════ */}
      <section id="workflow" style={{ padding: '100px 24px', background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>How it works</p>
              <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: 0 }}>
                From setup to<br /><span style={{ fontWeight: 700 }}>podium.</span>
              </h2>
            </div>
            <p style={{ color: C.txtLow, maxWidth: 340, lineHeight: 1.65, fontSize: 14 }}>Four steps from blank slate to live competition. No configuration overhead, no technical expertise required.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 1, background: `linear-gradient(90deg, ${C.accent}50, ${C.accent}10)`, pointerEvents: 'none' }} className="hide-mobile" />

            {[
              ['01', 'Create the event',    'Set scoring format, difficulty levels, boulder count, and invite settings. Publish as draft or go live immediately.',  C.accent],
              ['02', 'Invite competitors',  'Share a 6-character code. Competitors register themselves, pick traits and gender, and get auto-assigned BIBs.',        '#34d399'],
              ['03', 'Track scores live',   'Log tops and zones from the boulder wall. Judges can approve or override. The leaderboard updates in real time.',       '#f59e0b'],
              ['04', 'Analyse & export',    'Review completion rates, flash counts, and category standings. Export results or share the public leaderboard link.',   C.accent],
            ].map(([num, title, desc, color]) => (
              <div key={num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: C.bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontWeight: 700, fontSize: 16, color, fontFamily: C.mono }}>
                  {num}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: C.txt, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{title}</h4>
                <p style={{ fontSize: 13, color: C.txtLow, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '100px 24px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 16px' }}>
            Simple, transparent<br /><span style={{ fontWeight: 700 }}>pay per event.</span>
          </h2>
          <p style={{ fontSize: 15, color: C.txtLow, lineHeight: 1.65, maxWidth: 440, margin: '0 auto' }}>
            No monthly subscriptions. No seat fees. One price per event — scale capacity as you grow.
          </p>
        </div>

        {/* Two-tier grid */}
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Standard */}
          <div className="lp-card" style={{ ...glass, padding: 40, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.txtMid, marginBottom: 16 }}>Standard</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 52, fontWeight: 200, color: C.txt, fontFamily: C.mono, lineHeight: 1 }}>€99</span>
              <span style={{ fontSize: 14, color: C.txtLow }}>/event</span>
            </div>
            <p style={{ fontSize: 12, color: C.txtLow, marginBottom: 28 }}>+€0.12 per participant above 300</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Up to 300 participants',
                'Live leaderboard',
                'Dynamic Pot & Traditional scoring',
                'Zone scoring & attempt penalties',
                'Judge approval & self-log modes',
                'Categories & custom traits',
                'Analytics dashboard',
                'Extra capacity bundles',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: C.txtMid }}>
                  <Check size={13} color={C.accent} strokeWidth={2.5} /> {f}
                </li>
              ))}
            </ul>

            <button onClick={() => goAuth('signup')} style={{ ...btnOutline, justifyContent: 'center', marginTop: 'auto' }} className="btn-outline">
              Get started
            </button>
          </div>

          {/* Premium */}
          <div className="lp-card" style={{ ...glass, padding: 40, display: 'flex', flexDirection: 'column', borderColor: `${C.accent}35`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, margin: 0 }}>Premium</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: `${C.accent}18`, border: `1px solid ${C.accent}35`, fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '0.08em' }}>
                <Sparkles size={9} fill={C.accent} /> Popular
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 52, fontWeight: 200, color: C.txt, fontFamily: C.mono, lineHeight: 1 }}>€199</span>
              <span style={{ fontSize: 14, color: C.txtLow }}>/event</span>
            </div>
            <p style={{ fontSize: 12, color: C.txtLow, marginBottom: 28 }}>+€0.10 per participant above 500</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Up to 500 participants',
                'Everything in Standard',
                'Lower overage rate (€0.10/p)',
                ['White-label logo', true],
                ['Custom accent colour', true],
                ['Light & dark theme colours', true],
              ].map((f) => {
                const isNew    = Array.isArray(f)
                const label    = isNew ? f[0] : f
                return (
                  <li key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: isNew ? C.txt : C.txtMid }}>
                    <Check size={13} color={C.accent} strokeWidth={2.5} />
                    {label}
                    {isNew && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: C.accent, background: `${C.accent}15`, padding: '2px 6px', borderRadius: 4 }}>Premium</span>}
                  </li>
                )
              })}
            </ul>

            <button onClick={() => goAuth('signup')} style={{ ...btnPrimary, justifyContent: 'center', marginTop: 'auto' }} className="btn-primary">
              Get started
            </button>
          </div>
        </div>

        {/* Capacity bundles callout */}
        <div style={{ ...glass, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.txt, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Need more participants mid-event?</h3>
            <p style={{ fontSize: 13, color: C.txtLow, margin: 0, lineHeight: 1.55 }}>
              Purchase extra capacity at any time — 150, 300, or a custom amount. Standard €0.12/p, Premium €0.10/p.
            </p>
          </div>
          <button onClick={() => goAuth('signup')} style={{ ...btnOutline, whiteSpace: 'nowrap' }} className="btn-outline">
            View bundles <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', borderTop: `1px solid ${C.border}`, background: C.bgAlt }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 16px' }}>
            Ready to run your<br /><span style={{ fontWeight: 700 }}>next event?</span>
          </h2>
          <p style={{ fontSize: 15, color: C.txtLow, lineHeight: 1.65, marginBottom: 36 }}>
            Built by climbers for climbers. Set up in minutes, run competitions of any size, get results in real time.
          </p>
          <button onClick={() => goAuth('signup')} style={{ ...btnPrimary, fontSize: 15, padding: '13px 32px' }} className="btn-primary">
            Start your first event <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 5, background: `${C.accent}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={13} color={C.accent} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em', color: C.txt }}>ClimbTracker</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: 12, color: C.txtLow, textDecoration: 'none', padding: '4px 10px', borderRadius: 5, transition: 'color 0.33s, background 0.33s' }}
                onMouseEnter={e => { e.currentTarget.style.color = C.txt; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = C.txtLow; e.currentTarget.style.background = 'transparent' }}
              >{link}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>© 2025 ClimbTracker</p>
        </div>
      </footer>
    </div>
  )
}
