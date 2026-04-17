import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mountain, Zap, BarChart2, Users, Shield,
  ArrowRight, Check, ChevronDown, Trophy,
} from 'lucide-react'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// #121212 = app dark bg, sky-400 = primary accent (matches app)

export default function LandingPage() {
  const navigate   = useNavigate()
  const heroRef    = useRef<HTMLDivElement>(null)

  // Parallax-lite: move hero orbs on scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const orb1 = document.getElementById('orb1')
      const orb2 = document.getElementById('orb2')
      if (orb1) orb1.style.transform = `translateY(${y * 0.18}px)`
      if (orb2) orb2.style.transform = `translateY(${y * -0.12}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goAuth = (tab: 'signin' | 'signup') =>
    navigate(`/auth?tab=${tab}`)

  return (
    <div style={{ background: '#121212', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif" }} className="min-h-screen overflow-x-hidden">

      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200..900;1,9..40,200..900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .ct-accent { color: #38bdf8; }
        .ct-accent-bg { background: #38bdf8; }
        .ct-glow { box-shadow: 0 0 32px rgba(56,189,248,0.25); }
        .ct-glow-text { text-shadow: 0 0 28px rgba(56,189,248,0.4); }
        .ct-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
        }
        .ct-card:hover { transform: translateY(-3px); border-color: rgba(56,189,248,0.3); }
        .ct-card { transition: transform 0.25s ease, border-color 0.25s ease; }
        .ct-btn-primary {
          background: #38bdf8;
          color: #0c1a22;
          font-weight: 800;
          border-radius: 9999px;
          transition: all 0.2s;
        }
        .ct-btn-primary:hover { background: #7dd3fc; box-shadow: 0 0 24px rgba(56,189,248,0.35); transform: scale(1.02); }
        .ct-btn-outline {
          border: 1px solid rgba(56,189,248,0.4);
          color: #38bdf8;
          background: transparent;
          border-radius: 9999px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .ct-btn-outline:hover { background: rgba(56,189,248,0.08); border-color: #38bdf8; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.15); opacity: 0.1; } }
        .anim-1 { animation: fadeUp 0.7s ease both; }
        .anim-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .anim-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .anim-4 { animation: fadeUp 0.7s 0.45s ease both; }
        .orb-pulse { animation: pulse-ring 4s ease-in-out infinite; }
        .feature-icon { 
          width: 48px; height: 48px;
          background: rgba(56,189,248,0.1);
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .tier-popular { border-color: rgba(56,189,248,0.5) !important; }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(18,18,18,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Mountain size={22} color="#38bdf8" strokeWidth={2.5} />
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: '#f1f5f9' }}>ClimbTracker</span>
          </div>
          {/* Nav links */}
          <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 500 }} className="hidden-mobile">
            {[['Features', '#features'], ['Workflow', '#workflow'], ['Pricing', '#pricing'], ['Company', '#company']].map(([label, href]) => (
              <a key={label} href={href} style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >{label}</a>
            ))}
          </div>
          {/* Auth buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => goAuth('signin')} style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 999, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >Sign in</button>
            <button onClick={() => goAuth('signup')} className="ct-btn-primary" style={{ fontSize: 14, padding: '9px 22px', cursor: 'pointer', border: 'none' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div id="orb1" style={{ position: 'absolute', top: '15%', left: '10%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div id="orb2" style={{ position: 'absolute', bottom: '10%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div className="anim-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.07)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#38bdf8' }}>
            <Zap size={12} fill="#38bdf8" />
            The Professional Bouldering Standard
          </div>

          {/* Headline */}
          <h1 className="anim-2" style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.04em', color: '#f8fafc', margin: '0 0 24px' }}>
            Elevate Your<br />
            <span className="ct-glow-text" style={{ fontWeight: 900, color: '#38bdf8' }}>Competition.</span>
          </h1>

          {/* Subheadline */}
          <p className="anim-3" style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.6, color: '#94a3b8', maxWidth: 560, margin: '0 auto 48px' }}>
            Replace spreadsheets with live scoring, real-time leaderboards, and a seamless competitor experience — built for serious bouldering events.
          </p>

          {/* CTAs */}
          <div className="anim-4" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => goAuth('signup')} className="ct-btn-primary ct-glow" style={{ fontSize: 16, padding: '16px 36px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })} className="ct-btn-outline" style={{ fontSize: 16, padding: '16px 32px', cursor: 'pointer' }}>
              See How It Works
            </button>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#475569', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span>Scroll to explore</span>
            <ChevronDown size={16} className="orb-pulse" />
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '120px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 16 }}>Features</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#f1f5f9', margin: 0 }}>
            Everything an organizer<br /><span style={{ fontWeight: 800 }}>actually needs.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

          {/* Large card — Live scoring */}
          <div className="ct-glass ct-card" style={{ gridColumn: 'span 8', borderRadius: 24, padding: 48, position: 'relative', overflow: 'hidden', minHeight: 320 }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)' }} />
            <div className="feature-icon" style={{ marginBottom: 24 }}>
              <Zap size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 12px' }}>Live Recomputed Scoring</h3>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 0 32px' }}>
              Dynamic rank adjustment as scores come in. No refreshing. No spreadsheets. Pure real-time data for Dynamic Pot and Traditional formats.
            </p>
            {/* Mini leaderboard preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['1', 'Adam O.', '840 pts', true], ['2', 'Alex H.', '720 pts', false], ['3', 'Janja G.', '680 pts', false]].map(([rank, name, pts, hi]) => (
                <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, background: hi ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hi ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}` }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: hi ? '#38bdf8' : '#475569', width: 20 }}>{rank}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', fontFamily: "'DM Mono', monospace" }}>{pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="ct-glass ct-card" style={{ gridColumn: 'span 4', borderRadius: 24, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="feature-icon" style={{ marginBottom: 20 }}>
                <BarChart2 size={22} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 10px' }}>Deep Analytics</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>Boulder completion rates, flash stats, gender & category breakdowns.</p>
            </div>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Flash rate', '34%', '#38bdf8'], ['Top rate', '71%', '#34d399'], ['Zone rate', '89%', '#a78bfa']].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: val, height: '100%', background: color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, width: 32 }}>{val}</span>
                  <span style={{ fontSize: 11, color: '#475569', width: 64 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flexible formats */}
          <div className="ct-glass ct-card" style={{ gridColumn: 'span 4', borderRadius: 24, padding: 40 }}>
            <div className="feature-icon" style={{ marginBottom: 20 }}>
              <Trophy size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 10px' }}>Flexible Formats</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>Dynamic Pot, Traditional, or custom point systems. Zone scoring, attempt penalties, Top-K counting.</p>
          </div>

          {/* Competitor self-log */}
          <div className="ct-glass ct-card" style={{ gridColumn: 'span 8', borderRadius: 24, padding: 48, display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ flex: 1 }}>
              <div className="feature-icon" style={{ marginBottom: 20 }}>
                <Shield size={22} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 12px' }}>Self-Log &amp; Judge Approval</h3>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>Climbers log tops and zones instantly. Choose self-scoring, judge approval, or judge-only modes per competition.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {['Self-Scoring', 'Judge Approval', 'Judge Only'].map((m, i) => (
                <div key={m} style={{ padding: '10px 20px', borderRadius: 12, background: i === 0 ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.05)'}`, fontSize: 13, fontWeight: 700, color: i === 0 ? '#38bdf8' : '#475569' }}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Invite system */}
          <div className="ct-glass ct-card" style={{ gridColumn: 'span 12', borderRadius: 24, padding: 48, display: 'flex', alignItems: 'center', gap: 60 }}>
            <div style={{ flex: 1 }}>
              <div className="feature-icon" style={{ marginBottom: 20 }}>
                <Users size={22} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', color: '#f1f5f9', margin: '0 0 12px' }}>Invite Competitors in Seconds</h3>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, maxWidth: 440 }}>Share an invite code or link. Competitors self-register, pick categories, and appear on the live leaderboard instantly.</p>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['4', 'Competitors registered'], ['2', 'Categories'], ['6', 'Active boulders']].map(([n, label]) => (
                <div key={label} style={{ textAlign: 'center', padding: '20px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: '#38bdf8', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ WORKFLOW ═════════════════════════════════════════════════════════ */}
      <section id="workflow" style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 72, flexWrap: 'wrap', gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 12 }}>Workflow</p>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#f1f5f9', margin: 0 }}>
                The Professional<br /><span style={{ fontWeight: 800 }}>Workflow.</span>
              </h2>
            </div>
            <p style={{ color: '#64748b', maxWidth: 360, lineHeight: 1.6 }}>From boulder setting to podium celebrations, ClimbTracker orchestrates the entire journey.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 32, left: 32, right: 32, height: 1, background: 'linear-gradient(90deg, rgba(56,189,248,0.4), rgba(56,189,248,0.1))', pointerEvents: 'none' }} />

            {[
              ['01', 'Setup Competition', 'Configure scoring format, categories, and boulder metadata. Set draft or live status.', '#38bdf8'],
              ['02', 'Invite Competitors', 'Share an invite code. Competitors self-register with automatic BIB assignment.', '#34d399'],
              ['03', 'Go Live & Track', 'Monitor the live leaderboard in real-time. Manage scores, judges, and settings on the fly.', '#f59e0b'],
              ['04', 'Export Results', 'One-click export. Auto-generated standings, category breakdowns, and climber stats.', '#38bdf8'],
            ].map(([num, title, desc, color]) => (
              <div key={num} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#121212', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontWeight: 900, fontSize: 18, color, fontFamily: "'DM Mono', monospace" }}>
                  {num}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>{title}</h4>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '120px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, letterSpacing: '-0.03em', color: '#f1f5f9', margin: 0 }}>
            Simple, transparent<br /><span style={{ fontWeight: 800 }}>pay per event.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginTop: 20, lineHeight: 1.6 }}>
            No subscriptions. No hidden fees. One price, one event.
          </p>
        </div>

        {/* Single plan card */}
        <div className="ct-glass ct-card" style={{ borderRadius: 24, padding: '48px 56px', border: '1px solid rgba(56,189,248,0.3)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 12 }}>One-Shot</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 64, fontWeight: 200, color: '#f1f5f9', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>€99</span>
              <span style={{ fontSize: 16, color: '#475569' }}>/event</span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>+€0.12 per participant above 300</p>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 24px' }}>
              {[
                'Up to 300 participants',
                'Live leaderboard',
                'Analytics & exports',
                'Judge management',
                'Category breakdowns',
                'Extra capacity bundles',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                  <Check size={14} color="#38bdf8" strokeWidth={3} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goAuth('signup')}
              className="ct-btn-primary"
              style={{ padding: '14px 40px', fontSize: 15, cursor: 'pointer', border: 'none' }}
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Extra capacity callout */}
        <div className="ct-glass" style={{ borderRadius: 24, padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Need more participants?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Purchase extra capacity bundles at any time — 150, 300, or custom amounts starting at €0.12/participant.
            </p>
          </div>
          <button onClick={() => goAuth('signup')} className="ct-btn-outline" style={{ padding: '12px 28px', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            See bundles
          </button>
        </div>
      </section>

      {/* ══ COMPANY ══════════════════════════════════════════════════════════ */}
      <section id="company" style={{ padding: '120px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: 20 }}>About</p>
        <blockquote style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 300, fontStyle: 'italic', color: '#f1f5f9', lineHeight: 1.5, margin: '0 0 32px' }}>
          "Engineered for handling the scoring crux."
        </blockquote>
        <p style={{ fontSize: 16, fontWeight: 300, color: '#64748b', lineHeight: 1.7, marginBottom: 48 }}>
          ClimbTracker is built by climbers and developers who believe the struggle on the wall should be physical, not digital. We obsess over every UX detail so event organizers can focus on what matters: the climbing.
        </p>
        <button onClick={() => goAuth('signup')} className="ct-btn-primary" style={{ fontSize: 16, padding: '16px 40px', cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Start Your First Event <ArrowRight size={18} />
        </button>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mountain size={18} color="#38bdf8" />
            <span style={{ fontWeight: 900, fontSize: 16, color: '#38bdf8', letterSpacing: '-0.02em' }}>ClimbTracker</span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Contact', 'Twitter', 'LinkedIn'].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >{link}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>© 2024 ClimbTracker. Engineered for the Digital Alpinist.</p>
        </div>
      </footer>
    </div>
  )
}