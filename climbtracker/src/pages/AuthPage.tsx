import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mountain, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { Competitor, Competition } from '../types'
import { MOCK_COMPETITORS, MOCK_COMPETITION } from '../constants'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuthPageProps {
  onLogin: (user: Competitor) => void
  theme:   'light' | 'dark'
}

type Tab = 'signin' | 'signup'

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

// ─── FIELD ────────────────────────────────────────────────────────────────────

function Field({ label, type, value, onChange, error, placeholder, right }: {
  label: string; type: string; value: string; onChange: (v: string) => void
  error?: string; placeholder?: string; right?: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-medium text-[#5C5E62]">{label}</label>
        {right}
      </div>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : 'email'}
          className={`
            w-full py-3.5 rounded border outline-none text-sm transition-colors duration-[330ms]
            bg-white/5 text-[#EEEEEE] placeholder:text-[#5C5E62]
            ${isPassword ? 'pl-4 pr-11' : 'px-4'}
            ${error ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-[#3E6AE1]/50'}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5C5E62] hover:text-[#D0D1D2] transition-colors duration-[330ms]"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────

export default function AuthPage({ onLogin, theme }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [tab,        setTab]        = useState<Tab>(params.get('tab') === 'signup' ? 'signup' : 'signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [pendingUser, setPendingUser] = useState<Competitor | null>(null)

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
      if (!lastName.trim())  e.lastName  = 'Last name is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

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
        setTimeout(() => { onLogin(user); navigate('/competitions', { replace: true }) }, 600)
      } else {
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
          role:        'competitor',
        } as any
        registerUser(newUser, password)
        setSuccess(true)
        setTimeout(() => { setPendingUser(newUser); setLoading(false) }, 600)
      }
    }, 800)
  }

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
    <div className="min-h-screen bg-[#171A20] flex">

      {/* Left panel — branding (hidden on mobile) */}
      <div className="auth-left-panel hidden flex-col justify-between p-14 relative overflow-hidden bg-[#0F1318]">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(62,106,225,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(62,106,225,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(62,106,225,0.08) 0%, transparent 70%)' }}
        />

        <div className="flex items-center gap-2.5 relative">
          <Mountain size={22} className="text-[#3E6AE1]" strokeWidth={2} />
          <span className="font-medium text-lg text-[#EEEEEE]">ClimbTracker</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-light leading-[1.15] text-[#EEEEEE] mb-5" style={{ letterSpacing: '-0.04em' }}>
            The competition<br />
            <span className="font-medium text-[#3E6AE1]">platform that climbs</span><br />
            with you.
          </h2>
          <p className="text-sm text-[#5C5E62] leading-relaxed mb-10">
            Real-time scoring. Dynamic leaderboards. Self-log. Analytics. Everything you need, nothing you don't.
          </p>
          <div className="flex flex-col gap-3.5">
            {['Live leaderboard — zero refresh', 'Dynamic Pot & Traditional scoring', 'Self-log or judge-approval mode', 'Category & gender breakdowns'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[#5C5E62]">
                <CheckCircle2 size={15} className="text-[#3E6AE1] flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#393C41] relative">© 2024 ClimbTracker</p>
      </div>

      {/* Right panel — form */}
      <div className="auth-right-panel flex-1 flex flex-col justify-center px-10 py-10 overflow-y-auto" style={{ maxWidth: 480 }}>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#5C5E62] text-sm font-medium mb-10 hover:text-[#D0D1D2] transition-colors duration-[330ms] w-fit"
        >
          <ArrowLeft size={14} /> Back to home
        </button>

        <div className="flex items-center gap-2 mb-9">
          <Mountain size={20} className="text-[#3E6AE1]" strokeWidth={2} />
          <span className="font-medium text-lg text-[#EEEEEE]">ClimbTracker</span>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-white/5 rounded p-1 mb-9">
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                flex-1 py-2.5 rounded text-sm font-medium transition-colors duration-[330ms]
                ${tab === t ? 'bg-[#3E6AE1] text-white' : 'text-[#5C5E62] hover:text-[#D0D1D2]'}
              `}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-medium text-[#EEEEEE] mb-1.5">
          {tab === 'signin' ? 'Welcome back' : 'Get started'}
        </h1>
        <p className="text-sm text-[#5C5E62] mb-8">
          {tab === 'signin'
            ? 'Sign in to manage your competitions'
            : 'Create your account and run your first event'}
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <CheckCircle2 size={48} className="text-[#3E6AE1]" />
            <p className="text-lg font-medium text-[#EEEEEE]">
              {tab === 'signin' ? 'Welcome back!' : 'Account created!'}
            </p>
            <p className="text-sm text-[#5C5E62]">Redirecting you now…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errors._global && (
              <div className="px-4 py-3 rounded border bg-red-500/10 border-red-500/30 text-sm text-red-400">
                {errors._global}
              </div>
            )}

            {tab === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" type="text" value={firstName} onChange={setFirstName} error={errors.firstName} placeholder="Alex" />
                <Field label="Last name"  type="text" value={lastName}  onChange={setLastName}  error={errors.lastName}  placeholder="Honnold" />
              </div>
            )}

            <Field label="Email address" type="email"    value={email}    onChange={setEmail}    error={errors.email}    placeholder="you@example.com" />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder="········"
              right={
                tab === 'signin'
                  ? <button type="button" className="text-[11px] font-medium text-[#3E6AE1] hover:text-[#3056C7] transition-colors duration-[330ms]">FORGOT?</button>
                  : undefined
              }
            />

            <button
              type="submit"
              disabled={loading}
              className={`
                mt-2 py-4 rounded text-sm font-medium transition-colors duration-[330ms]
                ${loading
                  ? 'bg-[#3E6AE1]/30 text-[#5C5E62] cursor-not-allowed'
                  : 'bg-[#3E6AE1] text-white hover:bg-[#3056C7] cursor-pointer'
                }
              `}
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="flex items-center gap-3 text-[#393C41]">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-xs text-[#393C41]">or continue with</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Google', 'Apple'].map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => alert(`${provider} OAuth coming soon.`)}
                  className="py-3 rounded text-sm font-medium border border-white/10 bg-white/[0.04] text-[#5C5E62] hover:border-[#3E6AE1]/30 hover:text-[#D0D1D2] transition-colors duration-[330ms]"
                >
                  {provider}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-[#5C5E62] mt-1">
              {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-[#3E6AE1] font-medium hover:text-[#3056C7] transition-colors duration-[330ms]"
              >
                {tab === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            {/* Dev shortcuts */}
            <div className="mt-4 p-4 rounded border bg-white/[0.03] border-white/[0.06]">
              <p className="text-[11px] font-medium text-[#393C41] mb-2.5">Dev shortcuts</p>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => { setEmail('admin@climbtracker.com'); setPassword('admin123'); setTab('signin') }} className="text-[11px] px-3 py-1 rounded bg-[#3E6AE1]/10 border border-[#3E6AE1]/20 text-[#3E6AE1] font-medium hover:bg-[#3E6AE1]/20 transition-colors duration-[330ms]">
                  Admin
                </button>
                <button type="button" onClick={() => { setEmail('alex@example.com'); setPassword('alex123'); setTab('signin') }} className="text-[11px] px-3 py-1 rounded bg-green-400/10 border border-green-400/20 text-green-400 font-medium hover:bg-green-400/20 transition-colors duration-[330ms]">
                  Competitor
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; flex: 1; }
          .auth-right-panel { flex: 0 0 480px !important; max-width: 480px !important; }
        }
      `}</style>
    </div>
  )
}
