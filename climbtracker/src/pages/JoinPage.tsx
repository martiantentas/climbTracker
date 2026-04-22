import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LogIn, CheckCircle2, MapPin, Calendar, Users, Lock, Tag } from 'lucide-react'
import type { Competition, Competitor } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import PasswordModal from '../components/PasswordModal'

interface JoinPageProps {
  competitions: Competition[]
  currentUser:  Competitor
  theme:        'light' | 'dark'
  lang:         Language
  isRegistered: (compId: string) => boolean
  onJoin: (compId: string, password?: string, traitIds?: string[], gender?: string) => boolean | 'full'
}

function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : lang, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function JoinPage({
  competitions, currentUser, theme, lang, isRegistered, onJoin,
}: JoinPageProps) {
  const { code } = useParams<{ code: string }>()
  const navigate  = useNavigate()
  const t         = translations[lang]
  const dk        = theme === 'dark'

  const comp          = competitions.find(c => c.inviteCode === code?.toUpperCase())
  const needsPassword = !!comp?.joinPassword
  const hasTraits     = (comp?.traits?.length ?? 0) > 0
  const requireTraits = comp?.requireTraits ?? false

  const [joined,            setJoined]            = useState(false)
  const [passwordError,     setPasswordError]     = useState(false)
  const [eventFull,         setEventFull]         = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedTraitIds,  setSelectedTraitIds]  = useState<string[]>([])
  const [gender,            setGender]            = useState('')

  useEffect(() => {
    if (comp && isRegistered(comp.id)) navigate('/', { replace: true })
  }, [comp, isRegistered, navigate])

  // ── Unknown code ─────────────────────────────────────────────────────────
  if (!comp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto px-6">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className={`text-xl font-medium mb-2 ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {t.joinNotFound}
          </h2>
          <p className={`text-sm mb-6 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {t.joinNotFoundDesc(code ?? '')}
          </p>
          <button
            onClick={() => navigate('/competitions')}
            className="px-6 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            {t.joinBrowse}
          </button>
        </div>
      </div>
    )
  }

  function toggleTrait(id: string) {
    setSelectedTraitIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function attemptJoin(password?: string) {
    const result = onJoin(comp!.id, password, selectedTraitIds, gender || undefined)
    if (result === true) {
      setJoined(true)
      setShowPasswordModal(false)
      setTimeout(() => navigate('/'), 1200)
    } else if (result === 'full') {
      setEventFull(true)
      setShowPasswordModal(false)
    } else {
      setPasswordError(true)
    }
  }

  function handleJoinClick() {
    if (needsPassword) {
      setShowPasswordModal(true)
    } else {
      attemptJoin()
    }
  }

  const canJoin = !requireTraits || !hasTraits || selectedTraitIds.length > 0

  // ── Success screen ────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
          <h2 className={`text-2xl font-medium mb-2 ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.joinYoureIn}</h2>
          <p className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.joinRedirecting}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`w-full max-w-md mx-auto rounded border ${dk ? 'bg-[#1C1F24] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>

        {/* Header */}
        <div className={`px-8 pt-8 pb-6 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <p className={`text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {t.joinInvitedTo}
          </p>
          <h1 className={`text-2xl font-medium mb-4 ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {comp.name}
          </h1>

          <div className="flex flex-col gap-2">
            {comp.location && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
                <span className={`text-sm ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{comp.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={13} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
              <span className={`text-sm ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{formatDate(comp.startDate, lang)}</span>
            </div>
            {comp.description && (
              <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{comp.description}</p>
            )}
          </div>

          {needsPassword && (
            <div className={`flex items-center gap-2 mt-4 px-3 py-2 rounded border ${dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-100'}`}>
              <Lock size={13} className="text-amber-400 flex-shrink-0" />
              <p className={`text-xs font-medium ${dk ? 'text-amber-300' : 'text-amber-700'}`}>
                {t.joinPasswordReq}
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-5">

          {/* Joining as */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded border ${dk ? 'bg-white/[0.02] border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${dk ? 'bg-[#7F8BAD]/10' : 'bg-[#7F8BAD]/10'}`}>
              <Users size={15} className="text-[#7F8BAD]" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
                {t.joinJoiningAs} {currentUser.displayName}
              </p>
              <p className={`text-[10px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{currentUser.email}</p>
            </div>
          </div>

          {/* Gender picker */}
          <div>
            <p className={`text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.joinGenderOpt}
            </p>
            <div className="flex flex-wrap gap-2">
              {[t.joinMale, t.joinFemale, t.joinNonBinary, t.joinPreferNot].map(option => (
                <button
                  key={option}
                  onClick={() => setGender(gender === option ? '' : option)}
                  className={`
                    px-3 py-2 rounded text-xs font-medium border transition-colors duration-[330ms]
                    ${gender === option
                      ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30'
                      : dk
                        ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10 hover:text-[#D0D1D2]'
                        : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#393C41]'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Trait picker */}
          {hasTraits && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={13} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
                <p className={`text-[10px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                  {requireTraits ? t.joinTraitsReq : t.joinTraitsOpt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(comp.traits ?? []).map(trait => {
                  const active = selectedTraitIds.includes(trait.id)
                  return (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait.id)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-[330ms]
                        ${active
                          ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30'
                          : dk
                            ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10 hover:text-[#D0D1D2]'
                            : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE] hover:text-[#393C41]'
                        }
                      `}
                    >
                      {active && <CheckCircle2 size={11} />}
                      {trait.name}
                    </button>
                  )
                })}
              </div>
              {requireTraits && selectedTraitIds.length === 0 && (
                <p className={`text-[10px] mt-2 ${dk ? 'text-amber-400/80' : 'text-amber-600'}`}>
                  {t.joinTraitsRequired}
                </p>
              )}
            </div>
          )}

          {/* Event full error */}
          {eventFull && (
            <div className="px-4 py-3 rounded bg-red-400/10 border border-red-400/20 text-red-400 text-sm text-center">
              {t.joinEventFull}
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoinClick}
            disabled={!canJoin || eventFull}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded font-medium text-sm bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogIn size={16} />
            {needsPassword ? t.joinJoinPassword : t.joinByCodeAction}
          </button>

          <button
            onClick={() => navigate('/competitions')}
            className={`w-full py-2.5 rounded text-sm font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}
          >
            {t.cancel}
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <PasswordModal
          competition={comp}
          theme={theme}
          onConfirm={password => {
            setPasswordError(false)
            attemptJoin(password)
          }}
          onCancel={() => { setShowPasswordModal(false); setPasswordError(false) }}
          externalError={passwordError}
        />
      )}
    </div>
  )
}
