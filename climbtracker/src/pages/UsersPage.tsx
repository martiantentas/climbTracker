import { useState, useMemo } from 'react'
import { Search, Shield, User, Trash2, Ban, ChevronDown } from 'lucide-react'

import type { Competitor, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface UsersPageProps {
  competitors:  Competitor[]
  competition:  Competition
  currentUser:  Competitor
  theme:        'light' | 'dark'
  lang:         Language
  onUpdateRole: (competitorId: string, role: 'competitor' | 'judge') => void
  onRemoveUser: (competitorId: string) => void
}

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────

function RoleBadge({ role, theme }: { role?: string; theme: 'light' | 'dark' }) {
  const isJudge = role === 'judge'

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-[9px] font-black uppercase tracking-widest border
      ${isJudge
        ? 'bg-purple-400/10 text-purple-400 border-purple-400/20'
        : theme === 'dark'
          ? 'bg-white/5 text-slate-400 border-white/10'
          : 'bg-slate-100 text-slate-500 border-slate-200'
      }
    `}>
      <Shield size={8} />
      {isJudge ? 'Judge' : 'Competitor'}
    </span>
  )
}

// ─── ROLE DROPDOWN ────────────────────────────────────────────────────────────

interface RoleDropdownProps {
  competitor:   Competitor
  theme:        'light' | 'dark'
  onUpdateRole: (id: string, role: 'competitor' | 'judge') => void
}

function RoleDropdown({ competitor, theme, onUpdateRole }: RoleDropdownProps) {
  const [open, setOpen] = useState(false)
  const currentRole = competitor.role ?? 'competitor'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black
          uppercase tracking-widest transition-all border
          ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }
        `}
      >
        {currentRole === 'judge' ? 'Judge' : 'Competitor'}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`
            absolute right-0 top-full mt-1 z-20
            rounded-xl border shadow-xl overflow-hidden min-w-[140px]
            ${theme === 'dark'
              ? 'bg-slate-800 border-white/10'
              : 'bg-white border-slate-200'
            }
          `}>
            {(['competitor', 'judge'] as const).map(role => (
              <button
                key={role}
                onClick={() => { onUpdateRole(competitor.id, role); setOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-left text-xs font-black uppercase tracking-widest
                  transition-all flex items-center gap-2
                  ${currentRole === role
                    ? theme === 'dark'
                      ? 'bg-sky-400/10 text-sky-400'
                      : 'bg-sky-50 text-sky-600'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:bg-white/5'
                      : 'text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                <Shield size={11} />
                {role}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── USERS PAGE ───────────────────────────────────────────────────────────────

export default function UsersPage({
  competitors,
  competition,
  currentUser,
  theme,
  lang,
  onUpdateRole,
  onRemoveUser,
}: UsersPageProps) {
  const t = translations[lang]

  const [search,        setSearch]        = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const visible = useMemo(() => {
    let list = competitors.filter(c => c.id !== competition.ownerId)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.displayName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q)   ||
        c.lastName.toLowerCase().includes(q)    ||
        c.email.toLowerCase().includes(q)       ||
        String(c.bibNumber).includes(q)
      )
    }

    return list
  }, [competitors, competition.ownerId, search])

  const judgeCount      = competitors.filter(c => c.role === 'judge').length
  const competitorCount = competitors.filter(c =>
    c.role !== 'judge' && c.id !== competition.ownerId
  ).length

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.users}
        </h1>
        <div className="flex items-center gap-4 mt-1">
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-black text-sky-400">{competitorCount}</span> competitors
          </span>
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-black text-purple-400">{judgeCount}</span> judges
          </span>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border mb-6
        ${theme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <Search size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="text"
          placeholder={t.searchUsers}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── User list ── */}
      {visible.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">👤</p>
          <p className="font-black uppercase tracking-widest text-sm">No users found</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>

          {/* Table header */}
          <div className={`
            grid grid-cols-[1fr_120px_100px_80px] gap-2
            px-5 py-3 text-[10px] font-black uppercase tracking-widest
            ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}
          `}>
            <div>Competitor</div>
            <div className="text-center">Role</div>
            <div className="text-center">Change role</div>
            <div className="text-right">Remove</div>
          </div>

          {/* Rows */}
          {visible.map((competitor, index) => {
            const isEven = index % 2 === 0
            const isMe   = competitor.id === currentUser.id

            return (
              <div
                key={competitor.id}
                className={`
                  grid grid-cols-[1fr_120px_100px_80px] gap-2
                  px-5 py-4 items-center border-t transition-colors
                  ${theme === 'dark'
                    ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}`
                    : `border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/50'}`
                  }
                `}
              >
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`
                    w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
                    ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}
                  `}>
                    {competitor.avatar
                      ? <img src={competitor.avatar} alt="" className="w-full h-full object-cover" />
                      : <User size={15} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-black leading-tight truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {competitor.displayName}
                      {isMe && (
                        <span className="ml-2 text-[9px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {competitor.email} · BIB #{competitor.bibNumber}
                    </p>
                  </div>
                </div>

                {/* Current role badge */}
                <div className="flex justify-center">
                  <RoleBadge role={competitor.role} theme={theme} />
                </div>

                {/* Role dropdown */}
                <div className="flex justify-center">
                  {isMe ? (
                    <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      —
                    </span>
                  ) : (
                    <RoleDropdown
                      competitor={competitor}
                      theme={theme}
                      onUpdateRole={onUpdateRole}
                    />
                  )}
                </div>

                {/* Remove button */}
                <div className="flex justify-end">
                  {isMe ? (
                    <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      —
                    </span>
                  ) : confirmRemove === competitor.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { onRemoveUser(competitor.id); setConfirmRemove(null) }}
                        className="px-2 py-1 rounded-lg text-[10px] font-black bg-red-400 text-white hover:bg-red-500 transition-all"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(competitor.id)}
                      className={`
                        p-2 rounded-xl transition-all
                        ${theme === 'dark'
                          ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10'
                          : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                        }
                      `}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* ── Legend ── */}
      <div className={`
        flex items-start gap-3 mt-6 p-4 rounded-2xl border
        ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}
      `}>
        <Ban size={14} className={`flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
        <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <span className="font-black">Judges</span> can validate and assign scores to puntuable boulders but cannot log their own completions or appear on the leaderboard.
          Removing a user from an event keeps their historical score data intact — the leaderboard is owned by the organizer.
        </p>
      </div>

    </div>
  )
}