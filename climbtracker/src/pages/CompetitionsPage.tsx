import { useState } from 'react'
import { Plus, Trophy, MapPin, Calendar, Key, Trash2, LogIn, Settings, X, Lock, Copy, Check, Shield } from 'lucide-react'
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
  onJoinByCode:   (code: string, password?: string, traitIds?: string[]) => boolean
  isRegistered:   (compId: string) => boolean
  onJoinSuccess?: (comp: Competition) => void
  getCompRole?:   (compId: string) => string | null
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, theme }: { status: CompetitionStatus; theme: 'light' | 'dark' }) {
  const labels: Record<CompetitionStatus, string> = {
    DRAFT: 'Draft', LIVE: 'Live', FINISHED: 'Finished', ARCHIVED: 'Archived',
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
      style={{
        color: getStatusColor(status),
        borderColor: getStatusColor(status) + '40',
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
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400'}`
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), location.trim(), description.trim())
    onClose()
  }
  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500] max-w-md mx-auto rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.newCompetition}</h2>
          <button onClick={onClose} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.name} *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Summer Bouldering Open 2025" className={inputClass} autoFocus />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.location}</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Vertical Heights Gym, Barcelona" className={inputClass} />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.description}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.cancel}</button>
            <button type="submit" disabled={!name.trim()} className="flex-1 py-3 rounded-xl font-black text-sm bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">{t.createCompetition}</button>
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
  const t = translations[lang]

  const [showCreate,    setShowCreate]    = useState(false)
  const [joinCode,      setJoinCode]      = useState('')
  const [codeError,     setCodeError]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [copiedId,      setCopiedId]      = useState<string | null>(null)
  // Briefly set to a compId after selecting it — triggers card flash + confirmation message
  const [justActivated, setJustActivated] = useState<string | null>(null)
  // Pending delete — waits 5s before committing so user can undo
  const [pendingDeleteComp, setPendingDeleteComp] = useState<Competition | null>(null)

  // Password modal
  const [pendingComp,   setPendingComp]   = useState<Competition | null>(null)
  const [passwordError, setPasswordError] = useState(false)

  const myComps   = competitions.filter(c => c.ownerId === currentUser.id)
  const joined    = competitions.filter(c => c.ownerId !== currentUser.id && isRegistered(c.id))
  const available = competitions.filter(c =>
    c.ownerId !== currentUser.id && !isRegistered(c.id) &&
    (c.status === CompetitionStatus.LIVE || c.status === CompetitionStatus.FINISHED) &&
    ((c as any).visibility !== 'private')
  )

  // ── Helpers ───────────────────────────────────────────────────────────────
  function activate(compId: string) {
    onEnter(compId)
    setJustActivated(compId)
    setTimeout(() => setJustActivated(null), 700)
  }

  // After a successful join, activate the competition and optionally redirect
  // to event-profile so the user can set their traits immediately
  function afterJoin(comp: Competition) {
    activate(comp.id)
    if (onJoinSuccess) onJoinSuccess(comp)
  }

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(false)
    const target = competitions.find(c => c.inviteCode === joinCode.trim().toUpperCase())
    if (!target) { setCodeError(true); return }
    if (target.joinPassword) {
      setPendingComp(target); setPasswordError(false)
    } else {
      const ok = onJoinByCode(joinCode.trim().toUpperCase())
      if (ok) { setJoinCode(''); afterJoin(target) }
      else setCodeError(true)
    }
  }

  function handlePasswordConfirm(password: string) {
    if (!pendingComp) return
    const ok = onJoinByCode(pendingComp.inviteCode, password)
    if (ok) { afterJoin(pendingComp); setPendingComp(null); setJoinCode(''); setPasswordError(false) }
    else setPasswordError(true)
  }

  function handleJoinAvailable(comp: Competition) {
    if (comp.joinPassword) { setPendingComp(comp); setPasswordError(false) }
    else { const ok = onJoinByCode(comp.inviteCode); if (ok) afterJoin(comp) }
  }

  function copyLink(comp: Competition) {
    const url = `${window.location.origin}${window.location.pathname}#/join/${comp.inviteCode}`
    navigator.clipboard.writeText(url)
    setCopiedId(comp.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400'}`

  function SectionHeading({ label }: { label: string }) {
    return <h2 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</h2>
  }

  function CompCard({ comp }: { comp: Competition }) {
    const active     = comp.id === activeCompId
    const isMine     = comp.ownerId === currentUser.id
    const registered = isRegistered(comp.id)
    const activated  = comp.id === justActivated

    return (
      <div className={`
        rounded-2xl border p-5
        transition-all duration-300 ease-out
        ${active
          ? theme === 'dark'
            ? 'ring-2 ring-sky-400/40 bg-sky-400/[0.06] border-sky-400/30 shadow-lg shadow-sky-400/5'
            : 'ring-2 ring-sky-400/40 bg-sky-50 border-sky-200 shadow-lg shadow-sky-100'
          : theme === 'dark'
            ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
        }
        ${activated ? 'scale-[1.015] shadow-xl' : 'scale-100'}
      `}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {active && (
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                  ● Active
                </span>
              )}
              <StatusBadge status={comp.status} theme={theme} />
              {getCompRole && (() => {
                const role = getCompRole(comp.id)
                if (role === 'judge') return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-purple-400/10 text-purple-400 border-purple-400/20"><Shield size={8} /> Judge</span>
                if (role === 'organizer' && !isMine) return <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/20"><Shield size={8} /> Co-organizer</span>
                return null
              })()}
              {comp.joinPassword && (
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  <Lock size={8} /> Password
                </span>
              )}
            </div>
            <h3 className={`font-black text-base leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{comp.name}</h3>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {comp.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
              <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{comp.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
            <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
              {new Date(comp.startDate).toLocaleDateString(lang === 'en' ? 'en-GB' : lang, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Key size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
            <span className={`text-xs font-black tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{comp.inviteCode}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(registered || isMine) && (
            <button
              onClick={() => activate(comp.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                active
                  ? 'bg-sky-400 text-sky-950 hover:bg-sky-300'
                  : theme === 'dark'
                    ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Trophy size={12} />{active ? 'Currently Active' : t.enterCompetition}
            </button>
          )}

          {isMine && (
            <>
              <button
                onClick={() => onManage(comp.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 border border-purple-400/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}`}
              >
                <Settings size={12} />{t.manageEvent}
              </button>

              <button
                onClick={() => copyLink(comp)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
              >
                {copiedId === comp.id
                  ? <><Check size={12} className="text-green-400" /> Copied!</>
                  : <><Copy size={12} /> {t.copyLink}</>
                }
              </button>
            </>
          )}

          {registered && !isMine && (
            <button
              onClick={() => onLeave(comp.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'}`}
            >
              <X size={12} />{t.leaveCompetition}
            </button>
          )}

          {isMine && (
            confirmDelete === comp.id ? (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Delete?</span>
                <button
                  onClick={() => { setPendingDeleteComp(comp); setConfirmDelete(null) }}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-red-400 text-white hover:bg-red-500 transition-all"
                >Yes, delete</button>
                <button onClick={() => setConfirmDelete(null)} className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{t.cancel}</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(comp.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ml-auto ${theme === 'dark' ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Trash2 size={12} />
              </button>
            )
          )}
        </div>

        {/* Activation confirmation strip */}
        {activated && (
          <div className={`mt-3 pt-3 border-t flex items-center gap-1.5 text-xs font-black text-sky-400 ${theme === 'dark' ? 'border-sky-400/20' : 'border-sky-200'}`}>
            <Check size={12} strokeWidth={3} /> Active — all pages now show this competition
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">

      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.myCompetitions}</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">
          <Plus size={16} />{t.newCompetition}
        </button>
      </div>

      {/* Join by code */}
      <form onSubmit={handleJoinCode} className={`flex gap-3 p-4 rounded-2xl border mb-2 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="relative flex-1">
          <Key size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setCodeError(false) }}
            placeholder={t.enterInviteCode}
            maxLength={8}
            className={`${inputClass} pl-9 uppercase tracking-widest font-black placeholder:normal-case placeholder:tracking-normal placeholder:font-normal ${codeError ? theme === 'dark' ? '!border-red-400/60' : '!border-red-400' : ''}`}
          />
        </div>
        <button
          type="submit"
          disabled={joinCode.trim().length < 4}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn size={15} />{t.joinByCodeAction}
        </button>
      </form>
      {codeError && <p className="text-xs text-red-400 font-bold mb-4 px-1">{t.invalidCode}</p>}
      <div className="mb-6" />

      {myComps.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I organise" />
          <div className="space-y-3">{myComps.map(c => <CompCard key={c.id} comp={c} />)}</div>
        </div>
      )}

      {joined.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I'm competing in" />
          <div className="space-y-3">{joined.map(c => <CompCard key={c.id} comp={c} />)}</div>
        </div>
      )}

      {available.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Available to join" />
          <div className="space-y-3">
            {available.map(comp => (
              <div key={comp.id} className={`rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all ${theme === 'dark' ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                <div className="flex-1 min-w-0">
                  <StatusBadge status={comp.status} theme={theme} />
                  <h3 className={`font-black text-base mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{comp.name}</h3>
                  {comp.location && <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{comp.location}</p>}
                  {comp.joinPassword && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-amber-400"><Lock size={8} /> Password required</span>
                  )}
                </div>
                <button onClick={() => handleJoinAvailable(comp)} className="flex items-center gap-1.5 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-300 transition-all flex-shrink-0">
                  <LogIn size={13} />{t.joinByCodeAction}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {competitions.length === 0 && (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm mb-2">{t.noCompetitions}</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">{t.createCompetition}</button>
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