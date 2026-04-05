import { useState } from 'react'
import { Plus, Trophy, MapPin, Calendar, Key, Trash2, LogIn, Settings, X } from 'lucide-react'

import type { Competition, Competitor } from '../types'
import { CompetitionStatus } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CompetitionsPageProps {
  competitions:   Competition[]
  activeCompId:   string
  currentUser:    Competitor
  theme:          'light' | 'dark'
  lang:           Language
  onEnter:        (compId: string) => void
  onCreate:       (name: string, location: string, description: string) => void
  onDelete:       (compId: string) => void
  onLeave:        (compId: string) => void
  onJoinByCode:   (code: string) => boolean
  isRegistered:   (compId: string) => boolean
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status, theme }: { status: CompetitionStatus; theme: 'light' | 'dark' }) {
  const labels: Record<CompetitionStatus, string> = {
    [CompetitionStatus.DRAFT]:    'Draft',
    [CompetitionStatus.LIVE]:     'Live',
    [CompetitionStatus.FINISHED]: 'Finished',
    [CompetitionStatus.ARCHIVED]: 'Archived',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      text-[9px] font-black uppercase tracking-widest border
    `}
      style={{
        color:            getStatusColor(status),
        borderColor:      getStatusColor(status) + '40',
        backgroundColor:  getStatusColor(status) + '15',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: getStatusColor(status) }}
      />
      {labels[status]}
    </span>
  )
}

// ─── CREATE COMPETITION MODAL ─────────────────────────────────────────────────

interface CreateModalProps {
  theme:    'light' | 'dark'
  lang:     Language
  onSave:   (name: string, location: string, description: string) => void
  onClose:  () => void
}

function CreateModal({ theme, lang, onSave, onClose }: CreateModalProps) {
  const t = translations[lang]
  const [name,        setName]        = useState('')
  const [location,    setLocation]    = useState('')
  const [description, setDescription] = useState('')

  const inputClass = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-sky-400'
    }
  `

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), location.trim(), description.trim())
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500]
        max-w-md mx-auto rounded-2xl border shadow-2xl
        ${theme === 'dark'
          ? 'bg-slate-900 border-white/10'
          : 'bg-white border-slate-200'
        }
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.newCompetition}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.name} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Summer Bouldering Open 2025"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.location}
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Vertical Heights Gym, Barcelona"
              className={inputClass}
            />
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.description}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description of the competition..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`
                flex-1 py-3 rounded-xl font-black text-sm transition-all
                ${theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-xl font-black text-sm bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.createCompetition}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── COMPETITIONS PAGE ────────────────────────────────────────────────────────

export default function CompetitionsPage({
  competitions,
  activeCompId,
  currentUser,
  theme,
  lang,
  onEnter,
  onCreate,
  onDelete,
  onLeave,
  onJoinByCode,
  isRegistered,
}: CompetitionsPageProps) {
  const t = translations[lang]

  // ── Local UI state ───────────────────────────────────────────────────────
  const [showCreate,   setShowCreate]   = useState(false)
  const [joinCode,     setJoinCode]     = useState('')
  const [codeError,    setCodeError]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // ── Split competitions into mine vs others ───────────────────────────────
  const myComps    = competitions.filter(c => c.ownerId === currentUser.id)
  const joined     = competitions.filter(c =>
    c.ownerId !== currentUser.id && isRegistered(c.id)
  )
  const available  = competitions.filter(c =>
    c.ownerId !== currentUser.id &&
    !isRegistered(c.id) &&
    (c.status === CompetitionStatus.LIVE || c.status === CompetitionStatus.FINISHED)
  )

  function handleJoinCode(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(false)
    const success = onJoinByCode(joinCode.trim().toUpperCase())
    if (success) {
      setJoinCode('')
    } else {
      setCodeError(true)
    }
  }

  function handleDelete(compId: string) {
    onDelete(compId)
    setConfirmDelete(null)
  }

  // ── Card shared styles ───────────────────────────────────────────────────
  const cardBase = `
    rounded-2xl border p-5 transition-all duration-200
    ${theme === 'dark'
      ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
    }
  `

  const isActive = (id: string) => id === activeCompId

  // ── Competition card ─────────────────────────────────────────────────────
  function CompCard({ comp, showOwner = false }: { comp: Competition; showOwner?: boolean }) {
    const active   = isActive(comp.id)
    const isMine   = comp.ownerId === currentUser.id
    const registered = isRegistered(comp.id)

    return (
      <div className={`
        ${cardBase}
        ${active ? theme === 'dark'
          ? 'ring-1 ring-sky-400/30 bg-sky-400/5 border-sky-400/30'
          : 'ring-1 ring-sky-400/30 bg-sky-50 border-sky-200'
          : ''
        }
      `}>

        {/* Top row: name + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {active && (
                <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                  Active
                </span>
              )}
              <StatusBadge status={comp.status} theme={theme} />
            </div>
            <h3 className={`font-black text-base leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {comp.name}
            </h3>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {comp.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
              <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                {comp.location}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
            <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
              {new Date(comp.startDate).toLocaleDateString(lang === 'en' ? 'en-GB' : lang, {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Key size={11} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
            <span className={`text-xs font-black tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              {comp.inviteCode}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Enter button — always available if registered or owner */}
          {(registered || isMine) && (
            <button
              onClick={() => onEnter(comp.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black
                uppercase tracking-widest transition-all
                ${active
                  ? 'bg-sky-400 text-sky-950 hover:bg-sky-300'
                  : theme === 'dark'
                    ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }
              `}
            >
              <Trophy size={12} />
              {active ? 'Currently Active' : t.enterCompetition}
            </button>
          )}

          {/* Settings — organizer only */}
          {isMine && (
            <button
              onClick={() => { onEnter(comp.id); }}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black
                uppercase tracking-widest transition-all
                ${theme === 'dark'
                  ? 'bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 border border-purple-400/20'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                }
              `}
            >
              <Settings size={12} />
              {t.manageEvent}
            </button>
          )}

          {/* Leave — registered but not owner */}
          {registered && !isMine && (
            <button
              onClick={() => onLeave(comp.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black
                uppercase tracking-widest transition-all
                ${theme === 'dark'
                  ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20 border border-red-400/20'
                  : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                }
              `}
            >
              <X size={12} />
              {t.leaveCompetition}
            </button>
          )}

          {/* Delete — owner only */}
          {isMine && (
            confirmDelete === comp.id ? (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sure?
                </span>
                <button
                  onClick={() => handleDelete(comp.id)}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-red-400 text-white hover:bg-red-500 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(comp.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black
                  uppercase tracking-widest transition-all ml-auto
                  ${theme === 'dark'
                    ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                  }
                `}
              >
                <Trash2 size={12} />
              </button>
            )
          )}

        </div>
      </div>
    )
  }

  // ── Section heading helper ───────────────────────────────────────────────
  function SectionHeading({ label }: { label: string }) {
    return (
      <h2 className={`text-[11px] font-black uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </h2>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.myCompetitions}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"
        >
          <Plus size={16} />
          {t.newCompetition}
        </button>
      </div>

      {/* ── Join by code bar ── */}
      <form
        onSubmit={handleJoinCode}
        className={`
          flex gap-3 p-4 rounded-2xl border mb-8
          ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}
        `}
      >
        <div className="relative flex-1">
          <Key size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setCodeError(false) }}
            placeholder={t.enterInviteCode}
            maxLength={8}
            className={`
              w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-sm
              uppercase tracking-widest font-black transition-all
              ${theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus:border-sky-400/50'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus:border-sky-400'
              }
            `}
          />
        </div>
        <button
          type="submit"
          disabled={joinCode.trim().length < 4}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn size={15} />
          {t.joinByCodeAction}
        </button>
      </form>
      {codeError && (
        <p className="text-xs text-red-400 font-bold -mt-6 mb-6 px-1">{t.invalidCode}</p>
      )}

      {/* ── My competitions (organizer) ── */}
      {myComps.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I organise" />
          <div className="space-y-3">
            {myComps.map(comp => <CompCard key={comp.id} comp={comp} />)}
          </div>
        </div>
      )}

      {/* ── Joined competitions ── */}
      {joined.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Competitions I'm competing in" />
          <div className="space-y-3">
            {joined.map(comp => <CompCard key={comp.id} comp={comp} />)}
          </div>
        </div>
      )}

      {/* ── Available competitions ── */}
      {available.length > 0 && (
        <div className="mb-8">
          <SectionHeading label="Available to join" />
          <div className="space-y-3">
            {available.map(comp => (
              <div key={comp.id} className={`${cardBase} flex items-center justify-between gap-4`}>
                <div className="flex-1 min-w-0">
                  <StatusBadge status={comp.status} theme={theme} />
                  <h3 className={`font-black text-base mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {comp.name}
                  </h3>
                  {comp.location && (
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {comp.location}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onJoinByCode(comp.inviteCode)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-300 transition-all flex-shrink-0"
                >
                  <LogIn size={13} />
                  {t.joinByCodeAction}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {competitions.length === 0 && (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm mb-2">{t.noCompetitions}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"
          >
            {t.createCompetition}
          </button>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateModal
          theme={theme}
          lang={lang}
          onSave={onCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

    </div>
  )
}