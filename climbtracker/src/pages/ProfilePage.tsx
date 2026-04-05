import { useState } from 'react'
import { User, Mail, Hash, Edit3, Save, X, Key } from 'lucide-react'

import type { Competitor } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  currentUser:  Competitor
  theme:        'light' | 'dark'
  lang:         Language
  onJoinByCode: (code: string) => boolean
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
// A single labelled field in the profile card

interface InfoRowProps {
  icon:  React.ReactNode
  label: string
  value: string
  theme: 'light' | 'dark'
}

function InfoRow({ icon, label, value, theme }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
        ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          {label}
        </p>
        <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

export default function ProfilePage({
  currentUser,
  theme,
  lang,
  onJoinByCode,
}: ProfilePageProps) {
  const t = translations[lang]

  // ── Edit state ───────────────────────────────────────────────────────────
  const [isEditing,    setIsEditing]    = useState(false)
  const [displayName,  setDisplayName]  = useState(currentUser.displayName)
  const [email,        setEmail]        = useState(currentUser.email)

  // ── Join by code state ───────────────────────────────────────────────────
  const [joinCode,     setJoinCode]     = useState('')
  const [codeError,    setCodeError]    = useState(false)
  const [codeSuccess,  setCodeSuccess]  = useState(false)

  function handleSave() {
    // In the mock version, we just close edit mode
    // When Supabase is connected, this will call an update function
    setIsEditing(false)
  }

  function handleCancel() {
    setDisplayName(currentUser.displayName)
    setEmail(currentUser.email)
    setIsEditing(false)
  }

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(false)
    setCodeSuccess(false)
    const success = onJoinByCode(joinCode.trim().toUpperCase())
    if (success) {
      setCodeSuccess(true)
      setJoinCode('')
      setTimeout(() => setCodeSuccess(false), 3000)
    } else {
      setCodeError(true)
    }
  }

  // ── Shared input style ───────────────────────────────────────────────────
  const inputClass = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50 focus:bg-white/8'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white'
    }
  `

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.profile}
        </h1>

        {/* Edit / Save / Cancel buttons */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all
              ${theme === 'dark'
                ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }
            `}
          >
            <Edit3 size={15} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all
                ${theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }
              `}
            >
              <X size={15} />
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
            >
              <Save size={15} />
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* ── Avatar + name banner ── */}
      <div className={`
        rounded-2xl border p-6 mb-4 flex items-center gap-5
        ${theme === 'dark'
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        {/* Avatar circle */}
        <div className="w-16 h-16 rounded-2xl bg-sky-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentUser.avatar
            ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
            : <User size={28} className="text-sky-400" />
          }
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-black tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {currentUser.displayName}
          </p>
          <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {currentUser.gender} · BIB #{currentUser.bibNumber}
          </p>
        </div>
      </div>

      {/* ── Profile fields ── */}
      <div className={`
        rounded-2xl border mb-4
        ${theme === 'dark'
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        {isEditing ? (

          // Edit mode — show inputs
          <div className="p-6 space-y-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.displayName}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              Profile editing will be fully wired up when Supabase is connected.
            </p>
          </div>

        ) : (

          // Read mode — show info rows
          <div className="px-6 divide-y divide-white/5">
            <InfoRow
              icon={<User size={15} />}
              label={t.displayName}
              value={currentUser.displayName}
              theme={theme}
            />
            <InfoRow
              icon={<Mail size={15} />}
              label={t.email}
              value={currentUser.email}
              theme={theme}
            />
            <InfoRow
              icon={<Hash size={15} />}
              label="BIB Number"
              value={`#${currentUser.bibNumber}`}
              theme={theme}
            />
            <InfoRow
              icon={<User size={15} />}
              label={t.gender}
              value={currentUser.gender}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* ── Join competition by code ── */}
      <div className={`
        rounded-2xl border p-6
        ${theme === 'dark'
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.joinWithCode}
        </h2>

        <form onSubmit={handleJoinCode} className="flex gap-3">
          <div className="relative flex-1">
            <Key size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setCodeError(false) }}
              placeholder={t.enterInviteCode}
              maxLength={8}
              className={`${inputClass} pl-9 uppercase tracking-widest font-black`}
            />
          </div>
          <button
            type="submit"
            disabled={joinCode.trim().length < 4}
            className="px-5 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.joinByCodeAction}
          </button>
        </form>

        {/* Error / success feedback */}
        {codeError && (
          <p className="text-xs text-red-400 font-bold mt-2">{t.invalidCode}</p>
        )}
        {codeSuccess && (
          <p className="text-xs text-sky-400 font-bold mt-2">{t.welcomeBack} 🎉</p>
        )}
      </div>

    </div>
  )
}