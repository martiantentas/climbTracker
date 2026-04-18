import { useState, useEffect, useRef } from 'react'
import { Lock, LogIn, X, AlertCircle, MapPin, Calendar } from 'lucide-react'
import type { Competition } from '../types'

interface PasswordModalProps {
  competition:    Competition
  theme:          'light' | 'dark'
  onConfirm:      (password: string) => void
  onCancel:       () => void
  externalError?: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function PasswordModal({
  competition,
  theme,
  onConfirm,
  onCancel,
  externalError = false,
}: PasswordModalProps) {
  const [password,   setPassword]   = useState('')
  const [localError, setLocalError] = useState(false)
  const error    = localError || externalError
  const inputRef = useRef<HTMLInputElement>(null)
  const dk       = theme === 'dark'

  useEffect(() => { inputRef.current?.focus() }, [])

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
    w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] pl-10
    ${dk
      ? `bg-white/5 text-[#EEEEEE] placeholder:text-[#5C5E62] ${error ? 'border-red-400/60' : 'border-white/10 focus:border-[#3E6AE1]/50'}`
      : `bg-[#F4F4F4] text-[#121212] placeholder:text-[#8E8E8E] ${error ? 'border-red-400' : 'border-[#EEEEEE] focus:border-[#3E6AE1]'}`
    }
  `

  return (
    <>
      <div className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[700]
        max-w-sm mx-auto rounded border
        ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}
      `}>

        <div className={`flex items-center justify-between px-6 py-4 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <h2 className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
              Password Required
            </h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-1.5 rounded transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#5C5E62]' : 'hover:bg-[#F4F4F4] text-[#8E8E8E]'}`}
          >
            <X size={16} />
          </button>
        </div>

        <div className={`px-6 py-4 border-b ${dk ? 'border-white/5' : 'border-[#EEEEEE]'}`}>
          <p className={`text-base font-medium leading-tight ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {competition.name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {competition.location && (
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin size={10} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
                <span className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}>{competition.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar size={10} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
              <span className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}>{formatDate(competition.startDate)}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={`block text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              Competition Password
            </label>
            <div className="relative">
              <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
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
                <p className="text-[10px] text-red-400 font-medium">
                  {password.trim() ? 'Incorrect password. Please try again.' : 'Please enter the password.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 py-2.5 rounded text-sm font-medium border transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] border-[#EEEEEE] hover:bg-[#EEEEEE]'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-medium bg-[#3E6AE1] text-white hover:bg-[#3056C7] transition-colors duration-[330ms]"
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
