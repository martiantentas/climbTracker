import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendia.png'
import type { Competitor, Competition } from '../types'
import { MOCK_COMPETITORS, MOCK_COMPETITION } from '../constants'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuthPageProps {
  onLogin: (user: Competitor) => void
  theme:   'light' | 'dark'
  lang:    Language
  setLang: (l: Language) => void
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
            ${error ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-[#7F8BAD]/50'}
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

export default function AuthPage({ onLogin, theme, lang, setLang }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tr = translations[lang]

  const [tab,        setTab]        = useState<Tab>(params.get('tab') === 'signup' ? 'signup' : 'signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [pendingUser, setPendingUser] = useState<Competitor | null>(null)

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async tokenResponse => {
      setLoading(true)
      try {
        const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json()) as {
          sub: string; name: string; given_name?: string
          family_name?: string; email: string; picture?: string
        }

        const existing = findUser(info.email)
        const user: Competitor = existing ?? (() => {
          const first = info.given_name  ?? info.name.split(' ')[0] ?? ''
          const last  = info.family_name ?? info.name.split(' ').slice(1).join(' ') ?? ''
          const created: Competitor = {
            id:          `g-${info.sub}`,
            firstName:   first,
            lastName:    last,
            displayName: info.name,
            email:       info.email.toLowerCase(),
            avatar:      info.picture,
            gender:      '',
            categoryId:  '',
            traitIds:    [],
            bibNumber:   0,
            role:        'competitor',
          } as any
          registerUser(created, '')
          return created
        })()

        setSuccess(true)
        setTimeout(() => { onLogin(user); navigate('/competitions', { replace: true }) }, 600)
      } catch {
        setErrors({ _global: 'Google sign-in failed. Please try again.' })
        setLoading(false)
      }
    },
    onError: () => {
      setErrors({ _global: 'Google sign-in was cancelled or failed.' })
    },
  })

  useEffect(() => {
    const t = params.get('tab')
    if (t === 'signup' || t === 'signin') setTab(t)
  }, [params])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = tr.authErrEmail
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = tr.authErrEmailInvalid
    if (!password) e.password = tr.authErrPassword
    else if (password.length < 6) e.password = tr.authErrPasswordLen
    if (tab === 'signup') {
      if (!firstName.trim()) e.firstName = tr.authErrFirstName
      if (!lastName.trim())  e.lastName  = tr.authErrLastName
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
          setErrors({ _global: tr.authInvalidCreds })
          setLoading(false)
          return
        }
        setSuccess(true)
        setTimeout(() => { onLogin(user); navigate('/competitions', { replace: true }) }, 600)
      } else {
        const existing = findUser(email)
        if (existing) {
          setErrors({ email: tr.authEmailExists })
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
        lang={lang}
        onComplete={updated => {
          setPendingUser(null)
          onLogin(updated)
          navigate('/competitions', { replace: true })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] flex">

      {/* Left panel — branding (hidden on mobile) */}
      <div className="auth-left-panel hidden flex-col justify-between p-14 relative overflow-hidden bg-[#0F1318]">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(127,139,173,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(127,139,173,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(127,139,173,0.08) 0%, transparent 70%)' }}
        />

        <div className="flex items-center gap-2.5 relative">
          <img src={ascendiaLogo} alt="Ascendia" className="h-8 w-auto object-contain" />
        </div>

        <div className="relative">
          <h2 className="text-4xl font-light leading-[1.15] text-[#EEEEEE] mb-5" style={{ letterSpacing: '-0.04em' }}>
            {tr.authTagline1}<br />
            <span className="font-medium text-[#7F8BAD]">{tr.authTagline2}</span><br />
            {tr.authTagline3}
          </h2>
          <p className="text-sm text-[#5C5E62] leading-relaxed mb-10">
            {tr.authTagDesc}
          </p>
          <div className="flex flex-col gap-3.5">
            {([tr.authFeat1, tr.authFeat2, tr.authFeat3, tr.authFeat4] as string[]).map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-[#5C5E62]">
                <CheckCircle2 size={15} className="text-[#7F8BAD] flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#393C41] relative">© 2025 Ascendia</p>
      </div>

      {/* Right panel — form */}
      <div className="auth-right-panel flex-1 flex flex-col justify-center px-10 py-10 overflow-y-auto" style={{ maxWidth: 480 }}>

        {/* Back + lang row */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[#5C5E62] text-sm font-medium hover:text-[#D0D1D2] transition-colors duration-[330ms]"
          >
            <ArrowLeft size={14} /> {tr.authBackHome}
          </button>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Language)}
            aria-label="Language"
            className="text-xs font-medium bg-transparent border border-white/10 text-[#5C5E62] rounded px-2 py-1 outline-none cursor-pointer hover:border-white/20 transition-colors duration-[330ms]"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ca">CA</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mb-9">
          <img src={ascendiaLogo} alt="Ascendia" className="h-8 w-auto object-contain" />
        </div>

        {/* Tab toggle */}
        <div className="flex bg-white/5 rounded p-1 mb-9">
          {(['signin', 'signup'] as Tab[]).map(tab_ => (
            <button
              key={tab_}
              onClick={() => setTab(tab_)}
              className={`
                flex-1 py-2.5 rounded text-sm font-medium transition-colors duration-[330ms]
                ${tab === tab_ ? 'bg-[#7F8BAD] text-white' : 'text-[#5C5E62] hover:text-[#D0D1D2]'}
              `}
            >
              {tab_ === 'signin' ? tr.authSignIn : tr.authCreateAccount}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-medium text-[#EEEEEE] mb-1.5">
          {tab === 'signin' ? tr.authWelcomeBack : tr.authGetStarted}
        </h1>
        <p className="text-sm text-[#5C5E62] mb-8">
          {tab === 'signin' ? tr.authSignInDesc : tr.authSignUpDesc}
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <CheckCircle2 size={48} className="text-[#7F8BAD]" />
            <p className="text-lg font-medium text-[#EEEEEE]">
              {tab === 'signin' ? tr.welcomeBack : tr.authAccountCreated}
            </p>
            <p className="text-sm text-[#5C5E62]">{tr.authRedirecting}</p>
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
                <Field label={tr.authFirstName} type="text" value={firstName} onChange={setFirstName} error={errors.firstName} placeholder="Alex" />
                <Field label={tr.authLastName}  type="text" value={lastName}  onChange={setLastName}  error={errors.lastName}  placeholder="Honnold" />
              </div>
            )}

            <Field label={tr.authEmailAddr} type="email"    value={email}    onChange={setEmail}    error={errors.email}    placeholder="you@example.com" />
            <Field
              label={tr.password}
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder="········"
              right={
                tab === 'signin'
                  ? <button type="button" className="text-[11px] font-medium text-[#7F8BAD] hover:text-[#6D799B] transition-colors duration-[330ms]">{tr.authForgot}</button>
                  : undefined
              }
            />

            <button
              type="submit"
              disabled={loading}
              className={`
                mt-2 py-4 rounded text-sm font-medium transition-colors duration-[330ms]
                ${loading
                  ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed'
                  : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                }
              `}
            >
              {loading ? '…' : tab === 'signin' ? tr.authSignIn : tr.authCreateAccount}
            </button>

            <div className="flex items-center gap-3 text-[#393C41]">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-xs text-[#393C41]">{tr.authOrContinue}</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={loading}
                className="py-3 rounded text-sm font-medium border border-white/10 bg-white/[0.04] text-[#5C5E62] hover:border-[#7F8BAD]/30 hover:text-[#D0D1D2] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 7.1 29.5 5 24 5 13 5 4 14 4 24s9 19 20 19c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 7.1 29.5 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z" fill="#FF3D00"/>
                  <path d="M24 43c5.4 0 10.2-1.9 13.9-5.1l-6.4-5.4C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.4-11.2-8H6.3C9.6 38.4 16.3 43 24 43z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.4 5.4C37.1 39.1 44 34 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => alert(`Apple ${tr.authForgotComing}`)}
                className="py-3 rounded text-sm font-medium border border-white/10 bg-white/[0.04] text-[#5C5E62] hover:border-[#7F8BAD]/30 hover:text-[#D0D1D2] transition-colors duration-[330ms]"
              >
                Apple
              </button>
            </div>

            <p className="text-center text-sm text-[#5C5E62] mt-1">
              {tab === 'signin' ? tr.authNoAccount : tr.authHasAccount}{' '}
              <button
                type="button"
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-[#7F8BAD] font-medium hover:text-[#6D799B] transition-colors duration-[330ms]"
              >
                {tab === 'signin' ? tr.authSignUp : tr.authSignIn}
              </button>
            </p>

            {/* Dev shortcuts */}
            <div className="mt-4 p-4 rounded border bg-white/[0.03] border-white/[0.06]">
              <p className="text-[11px] font-medium text-[#393C41] mb-2.5">{tr.authDevShortcuts}</p>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => { setEmail('admin@climbtracker.com'); setPassword('admin123'); setTab('signin') }} className="text-[11px] px-3 py-1 rounded bg-[#7F8BAD]/10 border border-[#7F8BAD]/20 text-[#7F8BAD] font-medium hover:bg-[#7F8BAD]/20 transition-colors duration-[330ms]">
                  Admin
                </button>
                <button type="button" onClick={() => { setEmail('alex@example.com'); setPassword('alex123'); setTab('signin') }} className="text-[11px] px-3 py-1 rounded bg-green-400/10 border border-green-400/20 text-green-400 font-medium hover:bg-green-400/20 transition-colors duration-[330ms]">
                  {tr.competitor}
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
