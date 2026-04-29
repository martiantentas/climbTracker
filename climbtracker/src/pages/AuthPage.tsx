import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import ascendrLogo from '../assets/Ascendr.png'
import type { Language } from '../translations'
import { translations } from '../translations'
import BackgroundBeams from '../components/BackgroundBeams'
import LoadingSpinner from '../components/LoadingSpinner'
import { signIn, signUp, signInWithGoogle, signInWithGoogleToken, resetPasswordForEmail, updatePassword } from '../lib/auth'

// Minimal type for the GSI library loaded via <script> in index.html
interface GsiCredentialResponse { credential: string }
interface GoogleAccounts {
  accounts: {
    id: {
      initialize(cfg: { client_id: string; nonce?: string; callback: (r: GsiCredentialResponse) => void }): void
      prompt(fn?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void): void
    }
  }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AuthPageProps {
  theme:            'light' | 'dark'
  lang:             Language
  setLang:          (l: Language) => void
  initialTab?:      Tab
  onResetComplete?: () => void
}

type Tab = 'signin' | 'signup' | 'forgot' | 'reset'

const REDIRECT_URL = import.meta.env.DEV
  ? 'http://localhost:5173'
  : window.location.origin

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

export default function AuthPage({ theme: _theme, lang, setLang, initialTab, onResetComplete }: AuthPageProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tr = translations[lang]

  const [tab,            setTab]            = useState<Tab>(initialTab ?? (params.get('tab') === 'signup' ? 'signup' : 'signin'))
  const [confirmPending, setConfirmPending] = useState(false)
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [firstName,      setFirstName]      = useState('')
  const [lastName,       setLastName]       = useState('')
  const [gdpr,           setGdpr]           = useState(false)
  const [errors,         setErrors]         = useState<Record<string, string>>({})
  const [loading,        setLoading]        = useState(false)
  const [success,        setSuccess]        = useState(false)
  const [forgotSent,     setForgotSent]     = useState(false)
  const [newPassword,    setNewPassword]    = useState('')
  const [confirmPass,    setConfirmPass]    = useState('')

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])

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
      if (!gdpr)             e.gdpr      = tr.authErrGdpr
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    try {
      if (tab === 'signin') {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          setErrors({ _global: error.message === 'Invalid login credentials'
            ? tr.authInvalidCreds
            : error.message })
          return
        }
        // onAuthStateChange in App.tsx handles setting currentUser + navigation
        setSuccess(true)

      } else {
        const displayName = `${firstName.trim()} ${lastName.trim()}`
        const { data, error } = await signUp(email.trim(), password, displayName)
        if (error) {
          const isDuplicate = error.message.toLowerCase().includes('already registered')
            || error.message.toLowerCase().includes('already exists')
          setErrors({ _global: isDuplicate ? tr.authEmailExists : error.message })
          return
        }
        if (!data.session) {
          // Email confirmation is ON — show "check your inbox" success state
          setConfirmPending(true)
          setSuccess(true)
          return
        }
        // Session created immediately (email confirmation OFF) → onAuthStateChange fires
        setSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setErrors({ _global: msg })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setErrors({})

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    const g = (window as unknown as { google?: GoogleAccounts }).google

    if (clientId && g) {
      // Generate a nonce — Google receives the SHA-256 hash, Supabase receives the raw value.
      // Without this, Supabase rejects the id_token in production ("nonce":"not_provided").
      const rawNonce    = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2,'0')).join('')
      const hashBuffer  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce))
      const hashedNonce = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')

      // GSI path: Google authenticates against ascendr.top directly, no Supabase redirect.
      // The consent screen shows "to continue to ascendr.top" instead of supabase.co.
      g.accounts.id.initialize({
        client_id: clientId,
        nonce:     hashedNonce,
        callback: async ({ credential }) => {
          const { error } = await signInWithGoogleToken(credential, rawNonce)
          if (error) {
            // Network / CORS error (e.g. www subdomain) → fall back to OAuth redirect
            signInWithGoogle().then(({ error: e2 }) => {
              if (e2) {
                setErrors({ _global: 'Google sign-in failed. Please try again.' })
                setLoading(false)
              }
            })
          }
          // On success, onAuthStateChange in App.tsx fires and handles navigation
        },
      })
      g.accounts.id.prompt((notification) => {
        // One Tap blocked (dismissed before, ITP, private browsing) → fall back to redirect
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          signInWithGoogle().then(({ error }) => {
            if (error) {
              setErrors({ _global: 'Google sign-in failed. Please try again.' })
              setLoading(false)
            }
          })
        }
      })
    } else {
      // Fallback: standard OAuth redirect (shows supabase.co — used if GSI script
      // hasn't loaded yet or VITE_GOOGLE_CLIENT_ID is not set)
      const { error } = await signInWithGoogle()
      if (error) {
        setErrors({ _global: 'Google sign-in failed. Please try again.' })
        setLoading(false)
      }
    }
  }

  async function handleForgot(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!email.trim()) { setErrors({ email: tr.authErrEmail }); return }
    setLoading(true)
    setErrors({})
    try {
      const { error } = await resetPasswordForEmail(email.trim(), REDIRECT_URL)
      if (error) { setErrors({ _global: error.message }); return }
      setForgotSent(true)
    } catch (err: unknown) {
      setErrors({ _global: err instanceof Error ? err.message : 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: { preventDefault(): void }) {
    e.preventDefault()
    if (newPassword !== confirmPass) { setErrors({ confirmPass: tr.authPasswordMismatch }); return }
    if (newPassword.length < 6)      { setErrors({ newPassword: tr.authErrPasswordLen });   return }
    setLoading(true)
    setErrors({})
    try {
      const { error } = await updatePassword(newPassword)
      if (error) { setErrors({ _global: error.message }); return }
      setSuccess(true)
      setTimeout(() => { onResetComplete?.() }, 1800)
    } catch (err: unknown) {
      setErrors({ _global: err instanceof Error ? err.message : 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex">

      {/* Left panel — branding (hidden on mobile) */}
      <div className="auth-left-panel hidden flex-col justify-between p-14 relative overflow-hidden bg-[#080A0F]">
        <BackgroundBeams />

        <div className="flex items-center gap-2.5 relative">
          <img src={ascendrLogo} alt="Ascendr" className="h-8 w-auto object-contain" />
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

        <p className="text-xs text-[#393C41] relative">© 2026 Ascendr</p>
      </div>

      {/* Right panel — form */}
      <motion.div
        className="auth-right-panel flex-1 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 overflow-y-auto"
        style={{ maxWidth: 480 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >

        {/* Back + lang row */}
        <div className="flex items-center justify-between mb-10">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ x: -3, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="flex items-center gap-1.5 text-[#5C5E62] text-sm font-medium hover:text-[#D0D1D2] transition-colors duration-[330ms]"
          >
            <ArrowLeft size={14} /> {tr.authBackHome}
          </motion.button>
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
          <img src={ascendrLogo} alt="Ascendr" className="h-8 w-auto object-contain" />
        </div>

        {/* Tab toggle — only for signin/signup */}
        {(tab === 'signin' || tab === 'signup') && (
          <div className="flex bg-white/5 rounded p-1 mb-9 relative">
            {(['signin', 'signup'] as Tab[]).map(tab_ => (
              <motion.button
                key={tab_}
                onClick={() => setTab(tab_)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="flex-1 py-2.5 rounded text-sm font-medium transition-colors duration-[330ms] relative z-10"
                style={{ color: tab === tab_ ? 'white' : undefined }}
              >
                {tab === tab_ && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 rounded bg-[#7F8BAD]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${tab === tab_ ? 'text-white' : 'text-[#5C5E62]'}`}>
                  {tab_ === 'signin' ? tr.authSignIn : tr.authCreateAccount}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {/* ── FORGOT PASSWORD ─────────────────────────────────────────────── */}
        {tab === 'forgot' && (
          <>
            <h1 className="text-2xl font-medium text-[#EEEEEE] mb-1.5">{tr.authForgotTitle}</h1>
            <p className="text-sm text-[#5C5E62] mb-8">{tr.authForgotDesc}</p>

            {forgotSent ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <Mail size={48} className="text-[#7F8BAD]" />
                <p className="text-lg font-medium text-[#EEEEEE]">{tr.authForgotCheckEmail}</p>
                <p className="text-sm text-[#5C5E62]">{tr.authForgotSentDesc} <span className="text-[#EEEEEE]">{email}</span></p>
                <button
                  type="button"
                  onClick={() => { setForgotSent(false); setTab('signin') }}
                  className="mt-2 text-sm text-[#7F8BAD] hover:text-[#6D799B] underline underline-offset-2 transition-colors duration-[330ms]"
                >
                  {tr.authForgotBackSignIn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                {errors._global && (
                  <div className="px-4 py-3 rounded border bg-red-500/10 border-red-500/30 text-sm text-red-400">
                    {errors._global}
                  </div>
                )}
                <Field label={tr.authEmailAddr} type="email" value={email} onChange={setEmail} error={errors.email} placeholder="you@example.com" />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 py-4 rounded text-sm font-medium transition-colors duration-[330ms] ${loading ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed' : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'}`}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {loading ? <LoadingSpinner size={22} color="#fff" /> : tr.authForgotBtn}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className="text-center text-sm text-[#7F8BAD] hover:text-[#6D799B] transition-colors duration-[330ms]"
                >
                  {tr.authForgotBackSignIn}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── RESET PASSWORD ───────────────────────────────────────────────── */}
        {tab === 'reset' && (
          <>
            <h1 className="text-2xl font-medium text-[#EEEEEE] mb-1.5">{tr.authResetTitle}</h1>
            <p className="text-sm text-[#5C5E62] mb-8">{tr.authResetDesc}</p>

            {success ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <CheckCircle2 size={48} className="text-[#7F8BAD]" />
                <p className="text-lg font-medium text-[#EEEEEE]">{tr.authResetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                {errors._global && (
                  <div className="px-4 py-3 rounded border bg-red-500/10 border-red-500/30 text-sm text-red-400">
                    {errors._global}
                  </div>
                )}
                <Field label={tr.authResetNewPass}    type="password" value={newPassword} onChange={setNewPassword} error={errors.newPassword} placeholder="········" />
                <Field label={tr.authResetConfirmPass} type="password" value={confirmPass} onChange={setConfirmPass} error={errors.confirmPass} placeholder="········" />
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`mt-2 py-4 rounded text-sm font-medium transition-colors duration-[330ms] ${loading ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed' : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'}`}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {loading ? <LoadingSpinner size={22} color="#fff" /> : tr.authResetBtn}
                </motion.button>
              </form>
            )}
          </>
        )}

        {/* ── SIGN IN / SIGN UP ────────────────────────────────────────────── */}
        {(tab === 'signin' || tab === 'signup') && (
        <>
        <h1 className="text-2xl font-medium text-[#EEEEEE] mb-1.5">
          {tab === 'signin' ? tr.authWelcomeBack : tr.authGetStarted}
        </h1>
        <p className="text-sm text-[#5C5E62] mb-8">
          {tab === 'signin' ? tr.authSignInDesc : tr.authSignUpDesc}
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 size={48} className="text-[#7F8BAD]" />
            <p className="text-lg font-medium text-[#EEEEEE]">
              {confirmPending ? tr.authAccountCreated : (tab === 'signin' ? tr.welcomeBack : tr.authAccountCreated)}
            </p>
            <p className="text-sm text-[#5C5E62]">
              {confirmPending
                ? 'Check your inbox and click the confirmation link to activate your account.'
                : tr.authRedirecting}
            </p>
            {confirmPending && (
              <button
                type="button"
                onClick={() => { setSuccess(false); setConfirmPending(false); setTab('signin') }}
                className="mt-2 text-sm text-[#7F8BAD] hover:text-[#6D799B] underline underline-offset-2 transition-colors duration-[330ms]"
              >
                Back to sign in
              </button>
            )}
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
                  ? <button type="button" onClick={() => setTab('forgot')} className="text-[11px] font-medium text-[#7F8BAD] hover:text-[#6D799B] transition-colors duration-[330ms]">{tr.authForgot}</button>
                  : undefined
              }
            />

            {tab === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="gdpr-check" className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      id="gdpr-check"
                      type="checkbox"
                      checked={gdpr}
                      onChange={e => setGdpr(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-200 pointer-events-none ${
                        gdpr
                          ? 'bg-[#7F8BAD] border-[#7F8BAD]'
                          : errors.gdpr
                          ? 'border-red-500/60 bg-transparent'
                          : 'border-white/20 bg-transparent group-hover:border-[#7F8BAD]/50'
                      }`}
                    >
                      {gdpr && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#5C5E62] leading-relaxed group-hover:text-[#8E8E8E] transition-colors duration-200">
                    {tr.authGdprLabel}{' '}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); e.preventDefault(); navigate(`/${lang}/privacy`) }}
                      className="text-[#7F8BAD] hover:text-[#6D799B] underline underline-offset-2 transition-colors duration-200"
                    >
                      {tr.authGdprLink}
                    </button>
                  </span>
                </label>
                {errors.gdpr && (
                  <p className="text-xs text-red-400 pl-7">{errors.gdpr}</p>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className={`
                mt-2 py-4 rounded text-sm font-medium transition-colors duration-[330ms]
                ${loading
                  ? 'bg-[#7F8BAD]/30 text-[#5C5E62] cursor-not-allowed'
                  : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B] cursor-pointer'
                }
              `}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {loading
                ? <LoadingSpinner size={22} color="#fff" />
                : tab === 'signin' ? tr.authSignIn : tr.authCreateAccount
              }
            </motion.button>

            <div className="flex items-center gap-3 text-[#393C41]">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-xs text-[#393C41]">{tr.authOrContinue}</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="py-3 rounded text-sm font-medium border border-white/10 bg-white/[0.04] text-[#5C5E62] hover:border-[#7F8BAD]/30 hover:text-[#D0D1D2] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 7.1 29.5 5 24 5 13 5 4 14 4 24s9 19 20 19c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.5 7.1 29.5 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z" fill="#FF3D00"/>
                  <path d="M24 43c5.4 0 10.2-1.9 13.9-5.1l-6.4-5.4C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.4-11.2-8H6.3C9.6 38.4 16.3 43 24 43z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.4 5.4C37.1 39.1 44 34 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
                </svg>
                Google
              </motion.button>
              <motion.button
                type="button"
                onClick={() => alert(`Apple ${tr.authForgotComing}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="py-3 rounded text-sm font-medium border border-white/10 bg-white/[0.04] text-[#5C5E62] hover:border-[#7F8BAD]/30 hover:text-[#D0D1D2] transition-colors duration-[330ms]"
              >
                Apple
              </motion.button>
            </div>

            <p className="text-center text-sm text-[#5C5E62] mt-1">
              {tab === 'signin' ? tr.authNoAccount : tr.authHasAccount}{' '}
              <motion.button
                type="button"
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="text-[#7F8BAD] font-medium hover:text-[#6D799B] transition-colors duration-[330ms]"
              >
                {tab === 'signin' ? tr.authSignUp : tr.authSignIn}
              </motion.button>
            </p>
          </form>
        )}
        </>
        )}
      </motion.div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel  { display: flex !important; flex: 1; }
          .auth-right-panel { flex: 0 0 480px !important; max-width: 480px !important; }
        }
      `}</style>
    </div>
  )
}
