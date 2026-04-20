import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendia.png'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const C = {
  bg:     '#121212',
  bgAlt:  '#13161B',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7F8BAD',
  txt:    '#EEEEEE',
  txtMid: '#8E8E8E',
  txtLow: '#5C5E62',
  font:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
}

interface DemoPageProps {
  lang: Language
}

// ─── DEMO PAGE ────────────────────────────────────────────────────────────────

export default function DemoPage({ lang }: DemoPageProps) {
  const navigate = useNavigate()
  const t        = translations[lang]

  const [name,      setName]      = useState('')
  const [company,   setCompany]   = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [message,   setMessage]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors,    setErrors]    = useState<{ name?: string; email?: string }>({})

  function validate(): boolean {
    const next: { name?: string; email?: string } = {}
    if (!name.trim())  next.name  = t.demoErrName
    if (!email.trim()) next.email = t.demoErrEmail
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t.demoErrEmailInvalid
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setSubmitted(true)
  }

  const labelCls: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: C.txtLow, marginBottom: 7, letterSpacing: '0.02em',
    textTransform: 'uppercase',
  }

  const inputCls: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)',
    color: C.txt, fontSize: 14, fontFamily: C.font, outline: 'none',
    transition: 'border-color 0.25s', boxSizing: 'border-box',
  }

  const inputErrCls: React.CSSProperties = {
    ...inputCls, borderColor: 'rgba(248,113,113,0.6)',
  }

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: C.font, minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={ascendiaLogo} alt="Ascendia" style={{ height: 26, objectFit: 'contain' }} />
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.txtLow, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'color 0.33s', fontFamily: C.font }}
            onMouseEnter={e => (e.currentTarget.style.color = C.txt)}
            onMouseLeave={e => (e.currentTarget.style.color = C.txtLow)}
          >
            <ArrowLeft size={14} /> {t.back}
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 96px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>
            {t.demoPageLabel}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.03em', color: C.txt, margin: '0 0 12px' }}>
            {t.demoPageTitle} <span style={{ fontWeight: 700 }}>{t.demoPageTitle2}</span>
          </h1>
          <p style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.75, margin: 0 }}>
            {t.demoPageDesc}
          </p>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle size={52} style={{ color: C.accent, margin: '0 auto 20px' }} strokeWidth={1.5} />
            <h2 style={{ fontSize: 24, fontWeight: 600, color: C.txt, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              {t.demoSuccessTitle}
            </h2>
            <p style={{ fontSize: 14, color: C.txtMid, lineHeight: 1.75, maxWidth: 400, margin: '0 auto 32px' }}>
              {t.demoSuccessDesc}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, transition: 'background 0.25s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6D799B')}
              onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
            >
              {t.demoBackHome}
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Name + Company */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelCls}>{t.demoName} *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }}
                  placeholder={t.demoNamePlaceholder}
                  style={errors.name ? inputErrCls : inputCls}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.name ? 'rgba(248,113,113,0.6)' : C.border }}
                />
                {errors.name && <p style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>{errors.name}</p>}
              </div>
              <div>
                <label style={labelCls}>{t.demoCompany}</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder={t.demoCompanyPlaceholder}
                  style={inputCls}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelCls}>{t.demoEmail} *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })) }}
                  placeholder={t.demoEmailPlaceholder}
                  style={errors.email ? inputErrCls : inputCls}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.email ? 'rgba(248,113,113,0.6)' : C.border }}
                />
                {errors.email && <p style={{ fontSize: 11, color: '#f87171', marginTop: 5 }}>{errors.email}</p>}
              </div>
              <div>
                <label style={labelCls}>{t.demoPhone}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t.demoPhonePlaceholder}
                  style={inputCls}
                  onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.border }}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label style={labelCls}>{t.demoMessage}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t.demoMessagePlaceholder}
                rows={5}
                style={{ ...inputCls, resize: 'vertical', minHeight: 120 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.accent }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border }}
              />
            </div>

            {/* Submit row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>
              <p style={{ fontSize: 11, color: C.txtLow, margin: 0 }}>{t.demoRequired}</p>
              <button
                type="submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, letterSpacing: '-0.01em', transition: 'background 0.25s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#6D799B')}
                onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
              >
                {t.demoSubmit}
              </button>
            </div>

          </form>
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: C.txtLow, margin: 0 }}>© 2026 Ascendia · All rights reserved</p>
      </footer>
    </div>
  )
}
