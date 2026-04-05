import { useState } from 'react'
import { User, Mail, Hash, Edit3, Save, X, Key, Tag, Info } from 'lucide-react'

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

interface InfoRowProps {
  icon:       React.ReactNode
  label:      string
  value:      string
  theme:      'light' | 'dark'
  locked?:    boolean   // true = competition-level, not editable here
}

function InfoRow({ icon, label, value, theme, locked }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
        ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            {label}
          </p>
          {locked && (
            <span className={`
              text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md
              ${theme === 'dark' ? 'bg-amber-400/10 text-amber-500' : 'bg-amber-50 text-amber-600'}
            `}>
              per competition
            </span>
          )}
        </div>
        <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── GENDER OPTIONS ───────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
  'Other',
]

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: 'light' | 'dark' }) {
  return (
    <p className={`
      text-[10px] font-black uppercase tracking-widest px-6 py-2 border-b
      ${theme === 'dark'
        ? 'text-slate-600 border-white/5 bg-white/[0.02]'
        : 'text-slate-400 border-slate-100 bg-slate-50'
      }
    `}>
      {label}
    </p>
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
  const [isEditing,   setIsEditing]   = useState(false)
  const [displayName, setDisplayName] = useState(currentUser.displayName)
  const [email,       setEmail]       = useState(currentUser.email)
  const [gender,      setGender]      = useState(currentUser.gender)
  const [customGender, setCustomGender] = useState(
    GENDER_OPTIONS.includes(currentUser.gender) ? '' : currentUser.gender
  )

  // ── Join by code state ───────────────────────────────────────────────────
  const [joinCode,    setJoinCode]    = useState('')
  const [codeError,   setCodeError]   = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)

  // The displayed gender value — either the selected option or custom text
  const effectiveGender = gender === 'Other' && customGender.trim()
    ? customGender.trim()
    : gender

  function handleSave() {
    // Will write back to Supabase in Phase 5
    // For now just closes edit mode
    setIsEditing(false)
  }

  function handleCancel() {
    setDisplayName(currentUser.displayName)
    setEmail(currentUser.email)
    setGender(currentUser.gender)
    setCustomGender(GENDER_OPTIONS.includes(currentUser.gender) ? '' : currentUser.gender)
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

  // ── Shared styles ────────────────────────────────────────────────────────
  const inputClass = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400'
    }
  `

  const selectClass = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all cursor-pointer
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'
    }
  `

  const cardClass = `
    rounded-2xl border mb-4 overflow-hidden
    ${theme === 'dark'
      ? 'bg-white/[0.03] border-white/10'
      : 'bg-white border-slate-200 shadow-sm'
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
      <div className={`${cardClass} p-6 flex items-center gap-5`}>
        <div className="w-16 h-16 rounded-2xl bg-sky-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentUser.avatar
            ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
            : <User size={28} className="text-sky-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-black tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {isEditing ? displayName || '—' : currentUser.displayName}
          </p>
          <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {effectiveGender}
          </p>
        </div>
      </div>

      {/* ── Account-level fields ── */}
      <div className={cardClass}>
        <SectionLabel label="Account details — shared across all competitions" theme={theme} />

        {isEditing ? (
          <div className="p-6 space-y-4">

            {/* Display name */}
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

            {/* Email */}
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

            {/* Gender */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.gender}
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className={selectClass}
              >
                {GENDER_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* Custom gender text field — only shown when Other is selected */}
              {gender === 'Other' && (
                <input
                  type="text"
                  value={customGender}
                  onChange={e => setCustomGender(e.target.value)}
                  placeholder="Describe your gender..."
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>

          </div>
        ) : (
          <div className="px-6 divide-y divide-white/5">
            <InfoRow icon={<User size={15} />}  label={t.displayName} value={currentUser.displayName} theme={theme} />
            <InfoRow icon={<Mail size={15} />}  label={t.email}       value={currentUser.email}       theme={theme} />
            <InfoRow icon={<Tag  size={15} />}  label={t.gender}      value={effectiveGender}         theme={theme} />
          </div>
        )}
      </div>

      {/* ── Competition-level fields (read-only here) ── */}
      <div className={cardClass}>
        <SectionLabel label="Competition details — set per event" theme={theme} />
        <div className="px-6 divide-y divide-white/5">
          <InfoRow
            icon={<Hash size={15} />}
            label="BIB Number"
            value={`#${currentUser.bibNumber}`}
            theme={theme}
            locked
          />
          <InfoRow
            icon={<Tag size={15} />}
            label={t.category}
            value={currentUser.categoryId}
            theme={theme}
            locked
          />
        </div>

        {/* Explanation note */}
        <div className={`
          flex items-start gap-3 mx-6 my-4 p-3 rounded-xl
          ${theme === 'dark' ? 'bg-amber-400/5 border border-amber-400/10' : 'bg-amber-50 border border-amber-100'}
        `}>
          <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-amber-300/70' : 'text-amber-700'}`}>
            BIB number and category are assigned per competition by the organizer.
            They can differ across events you participate in.
          </p>
        </div>
      </div>

      {/* ── Join competition by code ── */}
      <div className={cardClass}>
        <SectionLabel label={t.joinWithCode} theme={theme} />
        <div className="p-6">
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

          {codeError && (
            <p className="text-xs text-red-400 font-bold mt-2">{t.invalidCode}</p>
          )}
          {codeSuccess && (
            <p className="text-xs text-sky-400 font-bold mt-2">{t.welcomeBack} 🎉</p>
          )}
        </div>
      </div>

    </div>
  )
}