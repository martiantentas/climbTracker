import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { User, Mail, Edit3, Save, X, Key, Tag, Info, ChevronDown, Award } from 'lucide-react'

import type { Competitor, Badge } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import EmojiAvatarPicker from '../components/EmojiAvatarPicker'
import UserAvatar from '../components/UserAvatar'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  currentUser:  Competitor
  theme:        'light' | 'dark'
  lang:         Language
  badges:       Badge[]
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
  badges,
  onJoinByCode,
  onSave,
}: ProfilePageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const genderOptions = [t.profileMale, t.profileFemale, t.profileOther]

  const [isEditing,    setIsEditing]    = useState(false)
  const [badgesOpen,   setBadgesOpen]   = useState(true)
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
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
          {t.profile}
        </h1>

        {!isEditing ? (
          <motion.button
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-[330ms]
              ${dk
                ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 hover:text-[#EEEEEE] border border-white/10'
                : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] border border-[#EEEEEE]'
              }
            `}
          >
            <Edit3 size={14} />
            {t.edit}
          </motion.button>
        ) : (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCancel}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
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
            </motion.button>
            <motion.button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Save size={14} />
              {t.save}
            </motion.button>
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
          <UserAvatar
            avatar={currentUser.avatar}
            displayName={currentUser.displayName}
            sizeClass="w-full h-full"
            emojiClass="text-3xl"
            iconSize={28}
          />
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
        <SectionLabel label={t.profileAccountDetails} theme={theme} />

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
              <label htmlFor="profile-gender" className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.gender}
              </label>
              <select
                id="profile-gender"
                value={gender}
                onChange={e => setGender(e.target.value)}
                className={selectClass}
              >
                {genderOptions.map(opt => (
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
        <SectionLabel label={t.profileCompReg} theme={theme} />
        <div className="px-6 py-5">
          <p className={`text-sm leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
            {t.profileRegNote}
          </p>
          <div className={`
            flex items-start gap-3 mt-4 p-3 rounded
            ${dk ? 'bg-amber-400/5 border border-amber-400/10' : 'bg-amber-50 border border-amber-100'}
          `}>
            <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${dk ? 'text-amber-300/70' : 'text-amber-700'}`}>
              {t.profileBibNote}
            </p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className={cardClass}>
        <button
          onClick={() => setBadgesOpen(v => !v)}
          className={`w-full flex items-center justify-between px-6 py-4 border-b transition-colors duration-[330ms]
            ${dk ? 'border-white/10 hover:bg-white/[0.02]' : 'border-[#EEEEEE] hover:bg-[#F9F9F9]'}`}
        >
          <div className="flex items-center gap-2">
            <Award size={14} className="text-[#7F8BAD]" />
            <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.badgesSection}
            </span>
            {badges.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7F8BAD]/10 text-[#7F8BAD]">
                {badges.length}
              </span>
            )}
          </div>
          <ChevronDown size={14} className={`transition-transform duration-[330ms] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} ${badgesOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {badgesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="p-6">
                {badges.length === 0 ? (
                  <p className={`text-xs leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                    {t.badgesNone}
                  </p>
                ) : (
                  <div className="space-y-5">
                    {Array.from(
                      badges.reduce((map, b) => {
                        const key = b.competitionId
                        return map.set(key, [...(map.get(key) ?? []), b])
                      }, new Map<string, Badge[]>())
                    ).map(([, group]) => {
                      const first = group[0]
                      return (
                        <div key={first.competitionId}>
                          <p className={`text-[10px] font-medium uppercase tracking-wider mb-2.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                            {first.competitionName}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.map(badge => {
                              const medal     = badge.placement === 1 ? '🥇' : badge.placement === 2 ? '🥈' : '🥉'
                              const posLabel  = badge.placement === 1 ? t.podiumFirst : badge.placement === 2 ? t.podiumSecond : t.podiumThird
                              const catLabel  = badge.category === 'general' ? t.badgeOverall : badge.category
                              const textColor = badge.placement === 1 ? 'text-amber-500' : badge.placement === 2 ? 'text-[#7F8BAD]' : 'text-orange-600'
                              const bgColor   = badge.placement === 1
                                ? dk ? 'bg-amber-400/10 border-amber-400/20'   : 'bg-amber-50 border-amber-200'
                                : badge.placement === 2
                                ? dk ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/20' : 'bg-[#7F8BAD]/5 border-[#7F8BAD]/20'
                                : dk ? 'bg-orange-900/10 border-orange-700/20' : 'bg-orange-50 border-orange-200'
                              return (
                                <div key={badge.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium ${bgColor} ${textColor}`}>
                                  <span>{medal}</span>
                                  <span>{posLabel}</span>
                                  <span className="opacity-50">·</span>
                                  <span>{catLabel}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          {codeFull    && <p className="text-xs text-red-400 mt-2">{t.compFull}</p>}
          {codeSuccess && <p className="text-xs text-[#7F8BAD] mt-2">{t.welcomeBack} 🎉</p>}
        </div>
      </div>

    </motion.div>
  )
}
