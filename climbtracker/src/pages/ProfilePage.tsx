import { useState } from 'react'
import { User, Mail, Edit3, Save, X, Key, Tag, Info } from 'lucide-react'

import type { Competitor } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import EmojiAvatarPicker from '../components/EmojiAvatarPicker'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  currentUser:  Competitor
  theme:        'light' | 'dark'
  lang:         Language
  onJoinByCode: (code: string) => boolean | 'full'
  onSave:       (updated: Competitor) => void
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon:  React.ReactNode
  label: string
  value: string | undefined
  theme: 'light' | 'dark'
}

function InfoRow({ icon, label, value, theme }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className={`
        w-8 h-8 rounded flex items-center justify-center flex-shrink-0
        ${theme === 'dark' ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#5C5E62]'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {label}
        </p>
        <p className={`text-sm truncate ${theme === 'dark' ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  )
}

// ─── GENDER OPTIONS ───────────────────────────────────────────────────────────

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say']

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: 'light' | 'dark' }) {
  return (
    <p className={`
      text-xs font-medium px-6 py-2 border-b
      ${theme === 'dark'
        ? 'text-[#5C5E62] border-white/10 bg-white/[0.02]'
        : 'text-[#8E8E8E] border-[#EEEEEE] bg-[#F4F4F4]'
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
  onSave,
}: ProfilePageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const [isEditing,   setIsEditing]   = useState(false)
  const [displayName, setDisplayName] = useState(currentUser.displayName)
  const [email,       setEmail]       = useState(currentUser.email)
  const [gender,      setGender]      = useState(currentUser.gender)
  const [avatar,      setAvatar]      = useState(currentUser.avatar ?? '')

  const [joinCode,    setJoinCode]    = useState('')
  const [codeError,   setCodeError]   = useState(false)
  const [codeFull,    setCodeFull]    = useState(false)
  const [codeSuccess, setCodeSuccess] = useState(false)

  function handleSave() {
    const updated: Competitor = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      email:       email.trim()       || currentUser.email,
      gender,
      avatar:      avatar || undefined,
    }
    onSave(updated)
    setIsEditing(false)
  }

  function handleCancel() {
    setDisplayName(currentUser.displayName)
    setEmail(currentUser.email)
    setGender(currentUser.gender)
    setAvatar(currentUser.avatar ?? '')
    setIsEditing(false)
  }

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(false)
    setCodeFull(false)
    setCodeSuccess(false)
    const result = onJoinByCode(joinCode.trim().toUpperCase())
    if (result === true) {
      setCodeSuccess(true)
      setJoinCode('')
      setTimeout(() => setCodeSuccess(false), 3000)
    } else if (result === 'full') {
      setCodeFull(true)
    } else {
      setCodeError(true)
    }
  }

  const inputClass = `
    w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms]
    ${dk
      ? 'bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#7F8BAD]/50'
      : 'bg-white border-[#EEEEEE] text-[#121212] placeholder:text-[#8E8E8E] focus:border-[#7F8BAD]'
    }
  `

  const selectClass = `
    w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] cursor-pointer
    ${dk
      ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50'
      : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]'
    }
  `

  const cardClass = `
    rounded border mb-4 overflow-hidden
    ${dk
      ? 'bg-white/[0.03] border-white/10'
      : 'bg-white border-[#EEEEEE]'
    }
  `

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
          {t.profile}
        </h1>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-[330ms]
              ${dk
                ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 hover:text-[#EEEEEE] border border-white/10'
                : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] border border-[#EEEEEE]'
              }
            `}
          >
            <Edit3 size={14} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className={`
                flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-[330ms]
                ${dk
                  ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 border border-white/10'
                  : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] border border-[#EEEEEE]'
                }
              `}
            >
              <X size={14} />
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
            >
              <Save size={14} />
              {t.save}
            </button>
          </div>
        )}
      </div>

      {/* Avatar + name banner */}
      <div className={`${cardClass} p-6 flex items-center gap-5`}>
        <div
          onClick={() => { if (!isEditing) setIsEditing(true) }}
          className={`
            w-16 h-16 rounded flex items-center justify-center flex-shrink-0 overflow-hidden text-3xl
            transition-colors duration-[330ms] relative group
            ${currentUser.avatar
              ? dk ? 'bg-white/5' : 'bg-[#F4F4F4]'
              : 'bg-[#7F8BAD]/10'
            }
            ${!isEditing ? 'cursor-pointer hover:ring-2 hover:ring-[#7F8BAD]/40' : ''}
          `}
        >
          {currentUser.avatar
            ? <span>{currentUser.avatar}</span>
            : <User size={28} className="text-[#7F8BAD]" />
          }
          {!isEditing && (
            <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[9px] font-medium text-white">Edit</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-medium truncate ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {currentUser.displayName}
          </p>
          <p className={`text-xs mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {currentUser.gender}
          </p>
        </div>
      </div>

      {/* Account-level fields */}
      <div className={cardClass}>
        <SectionLabel label="Account details — shared across all competitions" theme={theme} />

        {isEditing ? (
          <div className="p-6 space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
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
              <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
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
            </div>

            <div>
              <EmojiAvatarPicker
                selected={avatar || undefined}
                theme={theme}
                onSelect={emoji => setAvatar(emoji)}
              />
            </div>
          </div>
        ) : (
          <div className={`px-6 divide-y ${dk ? 'divide-white/5' : 'divide-[#EEEEEE]'}`}>
            <InfoRow icon={<User size={15} />} label={t.displayName} value={currentUser.displayName} theme={theme} />
            <InfoRow icon={<Mail size={15} />} label={t.email}       value={currentUser.email}       theme={theme} />
            <InfoRow icon={<Tag  size={15} />} label={t.gender}      value={currentUser.gender}      theme={theme} />
          </div>
        )}
      </div>

      {/* Competition registration */}
      <div className={cardClass}>
        <SectionLabel label="Competition registration" theme={theme} />
        <div className="px-6 py-5">
          <p className={`text-sm leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
            When you join a competition, you'll be asked to choose your category and gender for that event. These can differ across competitions — for example, you might compete in Open at one event and Masters at another.
          </p>
          <p className={`text-xs mt-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            BIB numbers are assigned automatically when you join. Judges and organizers don't have a BIB number.
          </p>
          <div className={`
            flex items-start gap-3 mt-4 p-3 rounded
            ${dk ? 'bg-amber-400/5 border border-amber-400/10' : 'bg-amber-50 border border-amber-100'}
          `}>
            <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${dk ? 'text-amber-300/70' : 'text-amber-700'}`}>
              BIB number and category are assigned per competition by the organizer and can differ across events you participate in.
            </p>
          </div>
        </div>
      </div>

      {/* Join by code */}
      <div className={cardClass}>
        <SectionLabel label={t.joinWithCode} theme={theme} />
        <div className="p-6">
          <form onSubmit={handleJoinCode} className="flex gap-3">
            <div className="relative flex-1">
              <Key size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
              <input
                type="text"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setCodeError(false) }}
                placeholder={t.enterInviteCode}
                maxLength={8}
                className={`${inputClass} pl-9 uppercase tracking-widest font-medium`}
              />
            </div>
            <button
              type="submit"
              disabled={joinCode.trim().length < 4}
              className="px-5 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.joinByCodeAction}
            </button>
          </form>

          {codeError   && <p className="text-xs text-red-400 mt-2">{t.invalidCode}</p>}
          {codeFull    && <p className="text-xs text-red-400 mt-2">This event is full — no more spots available.</p>}
          {codeSuccess && <p className="text-xs text-[#7F8BAD] mt-2">{t.welcomeBack} 🎉</p>}
        </div>
      </div>

    </div>
  )
}
