import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mountain, Eye, EyeOff, ArrowLeft, CheckCircle2, Users, Settings, Check, ChevronRight, User } from 'lucide-react'
import type { Competitor, Competition } from '../types'
import { MOCK_COMPETITORS, MOCK_COMPETITION } from '../constants'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuthPageProps {
  onLogin: (user: Competitor) => void
  theme:   'light' | 'dark'
}

type Tab  = 'signin' | 'signup'
type Role = 'organizer' | 'competitor'

// ─── MOCK USER STORE ──────────────────────────────────────────────────────────

const MOCK_PASSWORDS: Record<string, string> = {
  'admin@climbtracker.com': 'admin123',
  'alex@example.com':       'alex123',
  'janja@example.com':      'janja123',
  'adam@example.com':       'adam123',
  'brooke@example.com':     'brooke123',
}

const REGISTERED_USERS: Competitor[] = [...MOCK_COMPETITORS]

function findUser(email: string): Competitor | undefined {
  return REGISTERED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
}

function registerUser(user: Competitor, password: string): Competitor {
  REGISTERED_USERS.push(user)
  MOCK_PASSWORDS[user.email.toLowerCase()] = password
  return user
}

// Updates an existing user's record in the auth store (e.g. after profile edit).
// If the email changed, migrates the password to the new email key.
export function updateAuthUser(updated: Competitor, oldEmail: string): void {
  const idx = REGISTERED_USERS.findIndex(u => u.email.toLowerCase() === oldEmail.toLowerCase())
  if (idx !== -1) REGISTERED_USERS[idx] = updated
  const newEmail = updated.email.toLowerCase()
  const old = oldEmail.toLowerCase()
  if (newEmail !== old && MOCK_PASSWORDS[old]) {
    MOCK_PASSWORDS[newEmail] = MOCK_PASSWORDS[old]
    delete MOCK_PASSWORDS[old]
  }
}

import PostRegistrationModal from '../components/PostRegistrationModal'
// ─── HELPERS ──────────────────────────────────────────────────────────────────

function Field({ label, type, value, onChange, error, placeholder, right }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  error?: string; placeholder?: string; right?: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>{label}</label>
        {right}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : 'email'}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isPassword ? '14px 44px 14px 16px' : '14px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, fontSize: 15, color: '#f1f5f9',
            outline: 'none', transition: 'border-color 0.2s',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
          onFocus={e => (e.target.style.borderColor = '#38bdf8')}
          onBlur={e => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)')}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}
    </div>
  )
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────

export default function AuthPage({ onLogin, theme }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [tab,       setTab]       = useState<Tab>(params.get('tab') === 'signup' ? 'signup' : 'signin')
  const [role,      setRole]      = useState<Role>('organizer')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [pendingUser, setPendingUser] = useState<Competitor | null>(null) // triggers post-reg modal

  // Sync tab from URL
  useEffect(() => {
    const t = params.get('tab')
    if (t === 'signup' || t === 'signin') setTab(t)
  }, [params])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'At least 6 characters'
    if (tab === 'signup') {
      if (!firstName.trim()) e.firstName = 'First name is required'
      if (!lastName.trim()) e.lastName = 'Last name is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    // Simulate async
    setTimeout(() => {
      if (tab === 'signin') {
        const user = findUser(email)
        const pass = MOCK_PASSWORDS[email.toLowerCase()]
        if (!user || pass !== password) {
          setErrors({ _global: 'Invalid email or password.' })
          setLoading(false)
          return
        }
        setSuccess(true)
        setTimeout(() => {
          onLogin(user)
          navigate('/competitions', { replace: true })
        }, 600)
      } else {
        // Sign up
        const existing = findUser(email)
        if (existing) {
          setErrors({ email: 'An account with this email already exists.' })
          setLoading(false)
          return
        }
        const newUser: Competitor = {
          id:          `u-${Date.now()}`,
          firstName:   firstName.trim(),
          lastName:    lastName.trim(),
          displayName: `${firstName.trim()} ${lastName.trim().charAt(0)}.`,
          email:       email.trim().toLowerCase(),
          gender:      '',
          categoryId:  '',
          traitIds:    [],
          bibNumber:   0,
          role:        role,
        } as any
        registerUser(newUser, password)
        setSuccess(true)
        setTimeout(() => {
          if (role === 'competitor') {
            // Show post-registration modal to collect gender + traits
            setPendingUser(newUser)
            setLoading(false)
          } else {
            // Organizers go straight in
            onLogin(newUser)
            navigate('/competitions', { replace: true })
          }
        }, 600)
      }
    }, 800)
  }

  const BG = '#121212'

  // Post-registration modal — shown after competitor signup to collect gender + traits
  if (pendingUser) {
    return (
      <PostRegistrationModal
        user={pendingUser}
        competition={MOCK_COMPETITION}
        theme={theme}
        onComplete={updated => {
          setPendingUser(null)
          onLogin(updated)
          navigate('/competitions', { replace: true })
        }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300..900&display=swap');
        * { box-sizing: border-box; }
        .auth-input::placeholder { color: #334155; }
      `}</style>

      {/* Left panel — branding */}
      <div style={{ flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'space-between', padding: 56, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f1a24 0%, #121212 60%)' }}
        className="auth-left-panel"
      >
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <Mountain size={24} color="#38bdf8" strokeWidth={2.5} />
          <span style={{ fontWeight: 900, fontSize: 20, color: '#f1f5f9', letterSpacing: '-0.03em' }}>ClimbTracker</span>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 40, fontWeight: 200, lineHeight: 1.15, letterSpacing: '-0.04em', color: '#f1f5f9', margin: '0 0 20px' }}>
            The competition<br /><span style={{ fontWeight: 900, color: '#38bdf8' }}>platform that climbs</span><br />with you.
          </h2>
          <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: '0 0 40px' }}>
            Real-time scoring. Dynamic leaderboards. Self-log. Analytics. Everything you need, nothing you don't.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Live leaderboard — zero refresh', 'Dynamic Pot & Traditional scoring', 'Self-log or judge-approval mode', 'Category & gender breakdowns'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#64748b' }}>
                <CheckCircle2 size={16} color="#38bdf8" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#1e3a4a', position: 'relative' }}>© 2024 ClimbTracker</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: '0 0 100%', maxWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 40px', overflowY: 'auto' }}
        className="auth-right-panel"
      >
        {/* Back to landing */}
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 40, width: 'fit-content', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <ArrowLeft size={14} /> Back to home
        </button>

        {/* Logo (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          <Mountain size={20} color="#38bdf8" strokeWidth={2.5} />
          <span style={{ fontWeight: 900, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.03em' }}>ClimbTracker</span>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 36 }}>
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: tab === t ? '#38bdf8' : 'transparent',
              color: tab === t ? '#0c1a22' : '#475569',
            }}>
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', margin: '0 0 6px' }}>
          {tab === 'signin' ? 'Welcome back' : 'Get started'}
        </h1>
        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 32px' }}>
          {tab === 'signin'
            ? 'Sign in to manage your competitions'
            : 'Create your account and run your first event'}
        </p>

        {/* Role picker — signup only */}
        {tab === 'signup' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {([['organizer', 'Organizer', 'Create & manage events', Settings], ['competitor', 'Competitor', 'Join competitions', Users]] as const).map(([r, label, desc, Icon]) => (
              <button key={r} onClick={() => setRole(r)} style={{
                padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', border: `1px solid ${role === r ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.07)'}`,
                background: role === r ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)', transition: 'all 0.2s',
              }}>
                <Icon size={18} color={role === r ? '#38bdf8' : '#475569'} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 800, color: role === r ? '#38bdf8' : '#94a3b8', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Success state */}
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
            <CheckCircle2 size={48} color="#38bdf8" />
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
              {tab === 'signin' ? 'Welcome back!' : 'Account created!'}
            </p>
            <p style={{ fontSize: 14, color: '#475569' }}>Redirecting you now…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Global error */}
            {errors._global && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 14, color: '#ef4444' }}>
                {errors._global}
              </div>
            )}

            {/* Name fields — signup only */}
            {tab === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="First name" type="text" value={firstName} onChange={setFirstName} error={errors.firstName} placeholder="Alex" />
                <Field label="Last name" type="text" value={lastName} onChange={setLastName} error={errors.lastName} placeholder="Honnold" />
              </div>
            )}

            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder="········"
              right={
                tab === 'signin'
                  ? <button type="button" style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>FORGOT?</button>
                  : undefined
              }
            />

            {/* Organizer note */}
            {tab === 'signup' && role === 'organizer' && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 13, color: '#38bdf8', lineHeight: 1.5 }}>
                <strong>Organizer account</strong> — you'll be able to create competitions in Draft mode immediately. A subscription is required to take a competition Live.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8, padding: '15px 0', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                background: loading ? '#0e3a50' : '#38bdf8',
                color: loading ? '#475569' : '#0c1a22',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1e293b' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: '#334155' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Social stubs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['Google', 'Apple'].map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => alert(`${provider} OAuth coming soon.`)}
                  style={{ padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                >
                  {provider}
                </button>
              ))}
            </div>

            {/* Switch tab hint */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#475569', marginTop: 4 }}>
              {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')} style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}>
                {tab === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            {/* Dev shortcuts — remove in production */}
            <div style={{ marginTop: 16, padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', margin: '0 0 10px' }}>Dev shortcuts</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setEmail('admin@climbtracker.com'); setPassword('admin123'); setTab('signin') }} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>
                  Admin
                </button>
                <button type="button" onClick={() => { setEmail('alex@example.com'); setPassword('alex123'); setTab('signin') }} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', cursor: 'pointer', fontWeight: 700 }}>
                  Competitor
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; }
          .auth-right-panel { flex: 0 0 480px !important; max-width: 480px !important; }
        }
      `}</style>
    </div>
  )
}