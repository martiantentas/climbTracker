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
  onJoin: (compId: string, password?: string, traitIds?: string[]) => boolean
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

  const comp          = competitions.find(c => c.inviteCode === code?.toUpperCase())
  const needsPassword = !!comp?.joinPassword
  const hasTraits     = (comp?.traits?.length ?? 0) > 0
  const requireTraits = comp?.requireTraits ?? false

  const [joined,             setJoined]             = useState(false)
  const [passwordError,      setPasswordError]      = useState(false)
  const [showPasswordModal,  setShowPasswordModal]  = useState(false)
  const [selectedTraitIds,   setSelectedTraitIds]   = useState<string[]>([])

  // Already registered → go to boulders immediately
  useEffect(() => {
    if (comp && isRegistered(comp.id)) navigate('/', { replace: true })
  }, [comp, isRegistered, navigate])

  // ── Unknown code ─────────────────────────────────────────────────────────
  if (!comp) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto px-6">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Competition not found
          </h2>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            The invite code <span className="font-black text-sky-400">{code}</span> doesn't match any competition.
          </p>
          <button onClick={() => navigate('/competitions')} className="px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">
            Browse my events
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
    const success = onJoin(comp!.id, password, selectedTraitIds)
    if (success) {
      setJoined(true)
      setShowPasswordModal(false)
      setTimeout(() => navigate('/'), 1200)
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

  // Can the user proceed? If traits are required, they must pick at least one.
  const canJoin = !requireTraits || !hasTraits || selectedTraitIds.length > 0

  // ── Success screen ────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
          <h2 className={`text-2xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>You're in! 🎉</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Heading to the boulders…</p>
        </div>
      </div>
    )
  }

  const dk = theme === 'dark'

  // ── Competition info card ─────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`w-full max-w-md mx-auto rounded-2xl border shadow-xl ${dk ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>

        {/* Header */}
        <div className={`px-8 pt-8 pb-6 border-b ${dk ? 'border-white/10' : 'border-slate-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
            You've been invited to join
          </p>
          <h1 className={`text-2xl font-black tracking-tight mb-4 ${dk ? 'text-white' : 'text-slate-900'}`}>
            {comp.name}
          </h1>

          <div className="flex flex-col gap-2">
            {comp.location && (
              <div className="flex items-center gap-2">
                <MapPin size={13} className={dk ? 'text-slate-600' : 'text-slate-400'} />
                <span className={`text-sm ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{comp.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={13} className={dk ? 'text-slate-600' : 'text-slate-400'} />
              <span className={`text-sm ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(comp.startDate, lang)}</span>
            </div>
            {comp.description && (
              <p className={`text-sm mt-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{comp.description}</p>
            )}
          </div>

          {needsPassword && (
            <div className={`flex items-center gap-2 mt-4 px-3 py-2 rounded-xl border ${dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-100'}`}>
              <Lock size={13} className="text-amber-400 flex-shrink-0" />
              <p className={`text-xs font-bold ${dk ? 'text-amber-300' : 'text-amber-700'}`}>
                This competition requires a password to join.
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-5">

          {/* Joining as */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${dk ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dk ? 'bg-sky-400/10' : 'bg-sky-50'}`}>
              <Users size={15} className="text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black truncate ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
                Joining as {currentUser.displayName}
              </p>
              <p className={`text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{currentUser.email}</p>
            </div>
          </div>

          {/* Trait picker — shown when the competition has traits defined */}
          {hasTraits && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={13} className={dk ? 'text-slate-500' : 'text-slate-400'} />
                <p className={`text-[10px] font-black uppercase tracking-widest ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                  Select your traits{requireTraits ? ' *' : ' (optional)'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(comp.traits ?? []).map(trait => {
                  const active = selectedTraitIds.includes(trait.id)
                  return (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                        active
                          ? 'bg-sky-400/15 text-sky-400 border-sky-400/30'
                          : dk
                            ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                      }`}
                    >
                      {active && <CheckCircle2 size={11} />}
                      {trait.name}
                    </button>
                  )
                })}
              </div>
              {requireTraits && selectedTraitIds.length === 0 && (
                <p className={`text-[10px] mt-2 ${dk ? 'text-amber-400/80' : 'text-amber-600'}`}>
                  Please select at least one trait to join.
                </p>
              )}
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoinClick}
            disabled={!canJoin}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogIn size={16} />
            {needsPassword ? 'Join — Enter Password' : t.joinByCodeAction}
          </button>

          <button
            onClick={() => navigate('/competitions')}
            className={`w-full py-2.5 rounded-xl text-sm font-black transition-all ${dk ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
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