import { useState, useEffect, useRef } from 'react'
import { Lock, LogIn, X, AlertCircle, MapPin, Calendar } from 'lucide-react'
import type { Competition } from '../types'

interface PasswordModalProps {
  competition:    Competition
  theme:          'light' | 'dark'
  onConfirm:      (password: string) => void  // called with the entered password
  onCancel:       () => void
  // When JoinPage calls onJoin and gets false back, it sets this to true so the
  // modal can show "incorrect password" even though submit happened externally.
  externalError?: boolean
}

// ── Helper: format a date nicely ─────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── PASSWORD MODAL ───────────────────────────────────────────────────────────
// Shown as an overlay when a code resolves to a password-protected competition.
// Displays a brief summary of the competition and a single password field.

export default function PasswordModal({
  competition,
  theme,
  onConfirm,
  onCancel,
  externalError = false,
}: PasswordModalProps) {
  const [password,   setPassword]  = useState('')
  const [localError, setLocalError] = useState(false)
  const error = localError || externalError
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when the modal mounts
  useEffect(() => { inputRef.current?.focus() }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) { setLocalError(true); return }
    onConfirm(password)
  }

  const inputCls = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all pl-10
    ${theme === 'dark'
      ? `bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50 ${error ? '!border-red-400/60' : ''}`
      : `bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 ${error ? '!border-red-400' : ''}`
    }
  `

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal panel */}
      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[700]
        max-w-sm mx-auto rounded-2xl border shadow-2xl
        ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}
      `}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Password Required
            </h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Competition summary */}
        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <p className={`text-base font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {competition.name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {competition.location && (
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin size={10} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{competition.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar size={10} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{formatDate(competition.startDate)}</span>
            </span>
          </div>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Competition Password
            </label>
            <div className="relative">
              <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLocalError(false) }}
                placeholder="Enter password to join"
                className={inputCls}
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle size={11} className="text-red-400 flex-shrink-0" />
                <p className="text-[10px] text-red-400 font-bold">
                  {password.trim() ? 'Incorrect password. Please try again.' : 'Please enter the password.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
            >
              <LogIn size={14} />
              Join
            </button>
          </div>
        </form>
      </div>
    </>
  )
}