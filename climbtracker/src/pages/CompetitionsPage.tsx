import { useState } from 'react'
import { Plus, Trophy, MapPin, Calendar, Key, Trash2, LogIn, Settings, X, Lock, Copy, Check, Shield, Clock } from 'lucide-react'
import type { Competition, Competitor } from '../types'
import { CompetitionStatus } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'
import PasswordModal from '../components/PasswordModal'
import UndoToast from '../components/UndoToast'

interface CompetitionsPageProps {
  competitions:   Competition[]
  activeCompId:   string
  currentUser:    Competitor
  theme:          'light' | 'dark'
  lang:           Language
  onEnter:        (compId: string) => void
  onManage:       (compId: string) => void
  onCreate:       (name: string, location: string, description: string) => void
  onDelete:       (compId: string) => void
  onLeave:        (compId: string) => void
  onJoinByCode:   (code: string, password?: string, traitIds?: string[], gender?: string) => boolean | 'full'
  isRegistered:   (compId: string) => boolean
  onJoinSuccess?: (comp: Competition) => void
  getCompRole?:   (compId: string) => string | null
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CompetitionStatus }) {
  const labels: Record<CompetitionStatus, string> = {
    DRAFT: 'Draft', LIVE: 'Live', FINISHED: 'Finished', ARCHIVED: 'Archived',
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-medium border"
      style={{
        color:           getStatusColor(status),
        borderColor:     getStatusColor(status) + '40',
        backgroundColor: getStatusColor(status) + '15',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
      {labels[status]}
    </span>
  )
}

function CreateModal({ theme, lang, onSave, onClose }: {
  theme: 'light' | 'dark'; lang: Language
  onSave: (name: string, location: string, description: string) => void
  onClose: () => void
}) {
  const t = translations[lang]
  const dk = theme === 'dark'
  const [name, setName]             = useState('')
  const [location, setLocation]     = useState('')
  const [description, setDescription] = useState('')

  const inputClass = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] placeholder:text-[#8E8E8E] focus:border-[#7F8BAD]'}`

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), location.trim(), description.trim())
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60" onClick={onClose} />
      <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500] max-w-md mx-auto rounded border ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <h2 className={`text-lg font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.newCompetition}</h2>
          <button onClick={onClose} className={`p-2 rounded transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#5C5E62]' : 'hover:bg-[#F4F4F4] text-[#5C5E62]'}`}><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.name} *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Summer Bouldering Open 2025" className={inputClass} autoFocus />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.location}</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Vertical Heights Gym, Barcelona" className={inputClass} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.description}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded font-medium text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 border border-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE]'}`}>{t.cancel}</button>
            <button type="submit" disabled={!name.trim()} className="flex-1 py-3 rounded font-medium text-sm bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed">{t.createCompetition}</button>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function CompetitionsPage({
  competitions, activeCompId, currentUser, theme, lang,
  onEnter, onManage, onCreate, onDelete, onLeave, onJoinByCode, isRegistered, onJoinSuccess,
  getCompRole,
}: CompetitionsPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const [showCreate,         setShowCreate]         = useState(false)
  const [joinCode,           setJoinCode]           = useState('')
  const [codeError,          setCodeError]          = useState(false)
  const [joinFull,           setJoinFull]           = useState(false)
  const [confirmDelete,      setConfirmDelete]      = useState<string | null>(null)
  const [copiedId,           setCopiedId]           = useState<string | null>(null)
  const [justActivated,      setJustActivated]      = useState<string | null>(null)
  const [pendingDeleteComp,  setPendingDeleteComp]  = useState<Competition | null>(null)
  const [pendingComp,        setPendingComp]        = useState<Competition | null>(null)
  const [passwordError,      setPasswordError]      = useState(false)

  const myComps   = competitions.filter(c => c.ownerId === currentUser.id)
  const joined    = competitions.filter(c => c.ownerId !== currentUser.id && isRegistered(c.id))
  const available = competitions.filter(c =>
    c.ownerId !== currentUser.id && !isRegistered(c.id) &&
    (c.status === CompetitionStatus.LIVE || c.status === CompetitionStatus.FINISHED) &&
    ((c as any).visibility !== 'private')
  )

  function activate(compId: string) {
    onEnter(compId)
    setJustActivated(compId)
    setTimeout(() => setJustActivated(null), 700)
  }

  function afterJoin(comp: Competition) {
    activate(comp.id)
    if (onJoinSuccess) onJoinSuccess(comp)
  }

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(false)
    setJoinFull(false)
    const target = competitions.find(c => c.inviteCode === joinCode.trim().toUpperCase())
    if (!target) { setCodeError(true); return }
    if (target.joinPassword) {
      setPendingComp(target); setPasswordError(false)
    } else {
      const ok = onJoinByCode(joinCode.trim().toUpperCase())
      if (ok === true) { setJoinCode(''); afterJoin(target) }
      else if (ok === 'full') setJoinFull(true)
      else setCodeError(true)
    }
  }

  function handlePasswordConfirm(password: string) {
    if (!pendingComp) return
    const ok = onJoinByCode(pendingComp.inviteCode, password)
    if (ok === true) { afterJoin(pendingComp); setPendingComp(null); setJoinCode(''); setPasswordError(false) }
    else if (ok === 'full') { setPendingComp(null); setJoinFull(true) }
    else setPasswordError(true)
  }

  function handleJoinAvailable(comp: Competition) {
    setJoinFull(false)
    if (comp.joinPassword) { setPendingComp(comp); setPasswordError(false) }
    else { const ok = onJoinByCode(comp.inviteCode); if (ok === true) afterJoin(comp); else if (ok === 'full') setJoinFull(true) }
  }

  function copyLink(comp: Competition) {
    const url = `${window.location.origin}${window.location.pathname}#/join/${comp.inviteCode}`
    navigator.clipboard.writeText(url)
    setCopiedId(comp.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const inputClass = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] placeholder:text-[#5C5E62] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] placeholder:text-[#8E8E8E] focus:border-[#7F8BAD]'}`

  function SectionHeading({ label }: { label: string }) {
    return <h2 className={`text-xs font-medium mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{label}</h2>
  }

  function CompCard({ comp }: { comp: Competition }) {
    const active     = comp.id === activeCompId
    const isMine     = comp.ownerId === currentUser.id
    const registered = isRegistered(comp.id)
    const activated  = comp.id === justActivated

    return (
      <div className={`
        rounded border p-5 transition-all duration-[330ms]
        ${active
          ? dk
            ? 'border-[#7F8BAD]/30 bg-[#7F8BAD]/5'
            : 'border-[#7F8BAD]/30 bg-[#7F8BAD]/5'
          : dk
            ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
            : 'bg-white border-[#EEEEEE] hover:border-[#D0D1D2]'
        }
        ${activated ? 'scale-[1.008]' : 'scale-100'}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {active && (
                <span className="text-[9px] font-medium text-[#7F8BAD] bg-[#7F8BAD]/10 px-2 py-0.5 rounded border border-[#7F8BAD]/20">
                  ● Active
                </span>
              )}
              <StatusBadge status={comp.status} />
              {getCompRole && (() => {
                const role = getCompRole(comp.id)
                if (role === 'judge')      return <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded border bg-purple-400/10 text-purple-400 border-purple-400/20"><Shield size={8} /> Judge</span>
                if (role === 'organizer' && !isMine) return <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded border bg-amber-400/10 text-amber-400 border-amber-400/20"><Shield size={8} /> Co-organizer</span>
                return null
              })()}
              {comp.joinPassword && (
                <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded border ${dk ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  <Lock size={8} /> Password
                </span>
              )}
            </div>
            <h3 className={`font-medium text-base leading-tight ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{comp.name}</h3>
          </div>
        </div>

        {/* Description */}
        {comp.description && (
          <p className={`text-xs mb-3 leading-relaxed line-clamp-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {comp.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {comp.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-[#8E8E8E]" />
              <span className="text-xs text-[#5C5E62]">{comp.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-[#8E8E8E]" />
            <span className="text-xs text-[#5C5E62]">
              {new Date(comp.startDate).toLocaleDateString(lang === 'en' ? 'en-GB' : lang, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-[#8E8E8E]" />
            <span className="text-xs text-[#5C5E62]">
              {new Date(comp.startDate).toLocaleTimeString(lang === 'en' ? 'en-GB' : lang, { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(comp.endDate).toLocaleTimeString(lang === 'en' ? 'en-GB' : lang, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Key size={11} className="text-[#8E8E8E]" />
            <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{comp.inviteCode}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(registered || isMine) && (
            <button
              onClick={() => activate(comp.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${
                active
                  ? 'bg-[#7F8BAD] text-white hover:bg-[#6D799B]'
                  : dk
                    ? 'bg-white/10 text-[#D0D1D2] hover:bg-white/20'
                    : 'bg-[#F4F4F4] text-[#393C41] hover:bg-[#EEEEEE]'
              }`}
            >
              <Trophy size={12} />{active ? 'Currently Active' : t.enterCompetition}
            </button>
          )}

          {isMine && (
            <>
              <button
                onClick={() => onManage(comp.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 border border-purple-400/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}
              >
                <Settings size={12} />{t.manageEvent}
              </button>

              <button
                onClick={() => copyLink(comp)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 border border-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] border border-[#EEEEEE]'}`}
              >
                {copiedId === comp.id
                  ? <><Check size={12} className="text-green-500" /> Copied!</>
                  : <><Copy size={12} /> {t.copyLink}</>
                }
              </button>
            </>
          )}

          {registered && !isMine && (
            <button
              onClick={() => onLeave(comp.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'}`}
            >
              <X size={12} />{t.leaveCompetition}
            </button>
          )}

          {isMine && (
            confirmDelete === comp.id ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>Delete?</span>
                <button
                  onClick={() => { setPendingDeleteComp(comp); setConfirmDelete(null) }}
                  className="px-3 py-2 rounded text-xs font-medium bg-red-400 text-white hover:bg-red-500 transition-colors duration-[330ms]"
                >Yes, delete</button>
                <button onClick={() => setConfirmDelete(null)} className={`px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>{t.cancel}</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(comp.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ml-auto ${dk ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10' : 'text-[#8E8E8E] hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={12} />
              </button>
            )
          )}
        </div>

        {/* Activation strip */}
        {activated && (
          <div className={`mt-3 pt-3 border-t flex items-center gap-1.5 text-xs font-medium text-[#7F8BAD] ${dk ? 'border-[#7F8BAD]/20' : 'border-[#7F8BAD]/20'}`}>
            <Check size={12} strokeWidth={3} /> Active — all pages now show this competition
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.myCompetitions}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
        >
          <Plus size={15} />{t.newCompetition}
        </button>
      </div>

      {/* Join by code */}
      <form onSubmit={handleJoinCode} className={`flex gap-3 p-4 rounded border mb-2 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
        <div className="relative flex-1">
          <Key size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
          <input
            type="text"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setCodeError(false) }}
            placeholder={t.enterInviteCode}
            maxLength={8}
            className={`${inputClass} pl-9 uppercase tracking-widest font-medium placeholder:normal-case placeholder:tracking-normal placeholder:font-normal ${codeError ? dk ? '!border-red-400/60' : '!border-red-400' : ''}`}
          />
        </div>
        <button
          type="submit"
          disabled={joinCode.trim().length < 4}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn size={14} />{t.joinByCodeAction}
        </button>
      </form>
      {codeError && <p className="text-xs text-red-400 mb-2 px-1">{t.invalidCode}</p>}
      {joinFull && <p className="text-xs text-red-400 mb-2 px-1">{t.compFull}</p>}
      <div className="mb-6" />

      {myComps.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I organise" />
          <div className="space-y-2">{myComps.map(c => <CompCard key={c.id} comp={c} />)}</div>
        </div>
      )}

      {joined.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I'm competing in" />
          <div className="space-y-2">{joined.map(c => <CompCard key={c.id} comp={c} />)}</div>
        </div>
      )}

      {available.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Available to join" />
          <div className="space-y-2">
            {available.map(comp => (
              <div key={comp.id} className={`rounded border p-5 flex items-center justify-between gap-4 transition-colors duration-[330ms] ${dk ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]' : 'bg-white border-[#EEEEEE] hover:border-[#D0D1D2]'}`}>
                <div className="flex-1 min-w-0">
                  <StatusBadge status={comp.status} />
                  <h3 className={`font-medium text-base mt-1 ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{comp.name}</h3>
                  {comp.location && <p className={`text-xs mt-0.5 text-[#5C5E62]`}>{comp.location}</p>}
                  {comp.joinPassword && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-medium text-amber-400"><Lock size={8} /> Password required</span>
                  )}
                </div>
                <button
                  onClick={() => handleJoinAvailable(comp)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#7F8BAD] text-white rounded font-medium text-xs hover:bg-[#6D799B] transition-colors duration-[330ms] flex-shrink-0"
                >
                  <LogIn size={13} />{t.joinByCodeAction}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {competitions.length === 0 && (
        <div className={`text-center py-20 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-medium text-sm mb-2">{t.noCompetitions}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-6 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            {t.createCompetition}
          </button>
        </div>
      )}

      {showCreate && <CreateModal theme={theme} lang={lang} onSave={onCreate} onClose={() => setShowCreate(false)} />}

      {pendingComp && (
        <PasswordModal
          competition={pendingComp}
          theme={theme}
          externalError={passwordError}
          onConfirm={handlePasswordConfirm}
          onCancel={() => { setPendingComp(null); setPasswordError(false) }}
        />
      )}

      {pendingDeleteComp && (
        <UndoToast
          key={pendingDeleteComp.id}
          message={`"${pendingDeleteComp.name}" deleted`}
          theme={theme}
          onUndo={() => setPendingDeleteComp(null)}
          onCommit={() => { onDelete(pendingDeleteComp.id); setPendingDeleteComp(null) }}
          onDismiss={() => setPendingDeleteComp(null)}
        />
      )}
    </div>
  )
}
