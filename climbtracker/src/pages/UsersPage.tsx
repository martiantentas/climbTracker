import { useState, useMemo } from 'react'
import { Search, Shield, User, Trash2, ChevronDown, X, Save, Hash } from 'lucide-react'

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
  onUpdateRole: (competitorId: string, role: 'competitor' | 'judge' | 'organizer') => void
  onUpdateBib:  (competitorId: string, bib: number) => void
  onRemoveUser: (competitorId: string) => void
}

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────

function RoleBadge({ role, theme }: { role?: string; theme: 'light' | 'dark' }) {
  if (role === 'judge') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-purple-400/10 text-purple-400 border-purple-400/20">
      <Shield size={8} /> Judge
    </span>
  )
  if (role === 'organizer') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-400/10 text-amber-400 border-amber-400/20">
      <Shield size={8} /> Organizer
    </span>
  )
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${theme === 'dark' ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      <Shield size={8} /> Competitor
    </span>
  )
}

// ─── ROLE DROPDOWN ────────────────────────────────────────────────────────────

interface RoleDropdownProps {
  competitor:   Competitor
  theme:        'light' | 'dark'
  onUpdateRole: (id: string, role: 'competitor' | 'judge' | 'organizer') => void
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
        {currentRole}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`
            absolute right-0 top-full mt-1 z-20
            rounded-xl border shadow-xl overflow-hidden min-w-[140px]
            ${theme === 'dark' ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}
          `}>
            {(['competitor', 'judge', 'organizer'] as const).map(role => (
              <button
                key={role}
                onClick={() => { onUpdateRole(competitor.id, role); setOpen(false) }}
                className={`
                  w-full px-4 py-2.5 text-left text-xs font-black uppercase tracking-widest
                  transition-all flex items-center gap-2
                  ${currentRole === role
                    ? theme === 'dark' ? 'bg-sky-400/10 text-sky-400' : 'bg-sky-50 text-sky-600'
                    : theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'
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

// ─── USER DETAIL MODAL ────────────────────────────────────────────────────────

interface UserDetailModalProps {
  competitor:   Competitor
  isMe:         boolean
  theme:        'light' | 'dark'
  onUpdateRole: (id: string, role: 'competitor' | 'judge' | 'organizer') => void
  onUpdateBib:  (id: string, bib: number) => void
  onRemove:     (id: string) => void
  onClose:      () => void
}

function UserDetailModal({
  competitor,
  isMe,
  theme,
  onUpdateRole,
  onUpdateBib,
  onRemove,
  onClose,
}: UserDetailModalProps) {
  const [bibInput,      setBibInput]      = useState(String(competitor.bibNumber))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const currentRole = competitor.role ?? 'competitor'
  const isJudgeOrOrganizer = currentRole === 'judge' || currentRole === 'organizer'

  const inputCls = `
    w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'
    }
  `

  function handleSaveBib() {
    const n = parseInt(bibInput)
    if (!isNaN(n) && n >= 0) {
      onUpdateBib(competitor.id, n)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500]
        max-w-md mx-auto rounded-2xl border shadow-2xl
        ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}
      `}>

        {/* Header */}
        <div className={`
          flex items-center justify-between px-6 py-4 border-b
          ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0
              ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}
            `}>
              {competitor.avatar
                ? <img src={competitor.avatar} alt="" className="w-full h-full object-cover" />
                : <User size={18} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
              }
            </div>
            <div>
              <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {competitor.displayName}
                {isMe && (
                  <span className="ml-2 text-[9px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full">You</span>
                )}
              </p>
              <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                {competitor.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Role */}
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Role
            </label>
            <div className="flex gap-2">
              {(['competitor', 'judge', 'organizer'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => !isMe && onUpdateRole(competitor.id, role)}
                  disabled={isMe}
                  className={`
                    flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest
                    border transition-all
                    ${currentRole === role
                      ? role === 'organizer'
                        ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                        : role === 'judge'
                          ? 'bg-purple-400/10 text-purple-400 border-purple-400/30'
                          : 'bg-sky-400/10 text-sky-400 border-sky-400/30'
                      : theme === 'dark'
                        ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }
                    ${isMe ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  {role}
                </button>
              ))}
            </div>
            {isMe && (
              <p className={`text-[10px] mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                You cannot change your own role.
              </p>
            )}
          </div>

          {/* BIB number */}
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              BIB Number
              {isJudgeOrOrganizer && (
                <span className={`ml-2 normal-case tracking-normal font-normal ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                  — not applicable for judges/organizers
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  min={0}
                  value={bibInput}
                  onChange={e => setBibInput(e.target.value)}
                  disabled={isJudgeOrOrganizer}
                  className={`${inputCls} pl-9 ${isJudgeOrOrganizer ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </div>
              <button
                onClick={handleSaveBib}
                disabled={isJudgeOrOrganizer}
                className={`
                  flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-black transition-all
                  ${isJudgeOrOrganizer
                    ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                    : 'bg-sky-400 text-sky-950 hover:bg-sky-300'
                  }
                `}
              >
                <Save size={13} />
                Save
              </button>
            </div>
          </div>

          {/* User info summary */}
          <div className={`
            p-3 rounded-xl border text-xs space-y-1
            ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400'}
          `}>
            <p><span className="font-black">Gender:</span> {competitor.gender || '—'}</p>
            <p><span className="font-black">Category ID:</span> {competitor.categoryId || '—'}</p>
          </div>

        </div>

        {/* Footer — remove user */}
        {!isMe && (
          <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className={`text-xs font-black flex-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Remove {competitor.displayName} from this event?
                </p>
                <button
                  onClick={() => { onRemove(competitor.id); onClose() }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-red-400 text-white hover:bg-red-500 transition-all"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className={`flex items-center gap-2 text-xs font-black transition-all ${theme === 'dark' ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
              >
                <Trash2 size={13} />
                Remove from competition
              </button>
            )}
          </div>
        )}
      </div>
    </>
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
  onUpdateBib,
  onRemoveUser,
}: UsersPageProps) {
  const t = translations[lang]

  const [search,       setSearch]       = useState('')
  const [selectedUser, setSelectedUser] = useState<Competitor | null>(null)

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
  const organizerCount  = competitors.filter(c => c.role === 'organizer').length
  const competitorCount = competitors.filter(c =>
    c.role !== 'judge' && c.role !== 'organizer' && c.id !== competition.ownerId
  ).length

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.users}
        </h1>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-black text-sky-400">{competitorCount}</span> competitors
          </span>
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-black text-purple-400">{judgeCount}</span> judges
          </span>
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-black text-amber-400">{organizerCount}</span> organizers
          </span>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border mb-6
        ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
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
            grid grid-cols-[1fr_120px_100px_44px] gap-2
            px-5 py-3 text-[10px] font-black uppercase tracking-widest
            ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}
          `}>
            <div>Competitor</div>
            <div className="text-center">Role</div>
            <div className="text-center">Change role</div>
            <div></div>
          </div>

          {/* Rows */}
          {visible.map((competitor, index) => {
            const isEven = index % 2 === 0
            const isMe   = competitor.id === currentUser.id

            return (
              <div
                key={competitor.id}
                className={`
                  grid grid-cols-[1fr_120px_100px_44px] gap-2
                  px-5 py-4 items-center border-t transition-colors
                  ${theme === 'dark'
                    ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}`
                    : `border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/50'}`
                  }
                `}
              >
                {/* User info — clickable to open modal */}
                <button
                  onClick={() => setSelectedUser(competitor)}
                  className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
                >
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
                        <span className="ml-2 text-[9px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {competitor.email}
                      {competitor.role !== 'judge' && competitor.role !== 'organizer' && (
                        <span className="ml-1">· BIB #{competitor.bibNumber}</span>
                      )}
                    </p>
                  </div>
                </button>

                {/* Role badge */}
                <div className="flex justify-center">
                  <RoleBadge role={competitor.role} theme={theme} />
                </div>

                {/* Role dropdown */}
                <div className="flex justify-center">
                  {isMe ? (
                    <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                  ) : (
                    <RoleDropdown
                      competitor={competitor}
                      theme={theme}
                      onUpdateRole={onUpdateRole}
                    />
                  )}
                </div>

                {/* Open detail button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedUser(competitor)}
                    className={`
                      p-2 rounded-xl transition-all text-xs font-black
                      ${theme === 'dark' ? 'text-slate-600 hover:text-slate-300 hover:bg-white/5' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}
                    `}
                  >
                    ···
                  </button>
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
        <Shield size={14} className={`flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
        <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          Click any user row to open their detail panel — update BIB number, change role, or remove them from the event. Removing a user keeps their historical score data intact.
        </p>
      </div>

      {/* ── User detail modal ── */}
      {selectedUser && (
        <UserDetailModal
          competitor={selectedUser}
          isMe={selectedUser.id === currentUser.id}
          theme={theme}
          onUpdateRole={(id, role) => {
            onUpdateRole(id, role)
            setSelectedUser(prev => prev ? { ...prev, role } : null)
          }}
          onUpdateBib={(id, bib) => {
            onUpdateBib(id, bib)
            setSelectedUser(prev => prev ? { ...prev, bibNumber: bib } : null)
          }}
          onRemove={(id) => {
            onRemoveUser(id)
            setSelectedUser(null)
          }}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </div>
  )
}