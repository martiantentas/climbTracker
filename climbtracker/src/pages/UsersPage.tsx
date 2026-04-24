import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Shield, User, Trash2, ChevronDown, X, Save, Hash, AlertCircle, MoreHorizontal, Ban, ShieldOff } from 'lucide-react'
import UserAvatar from '../components/UserAvatar'
import type { Competitor, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
interface UsersPageProps {
  competitors:     Competitor[]
  competition:     Competition
  currentUser:     Competitor
  theme:           'light' | 'dark'
  lang:            Language
  viewOnly?:       boolean
  onUpdateRole:    (competitorId: string, role: 'competitor' | 'judge' | 'organizer') => void
  onUpdateBib:     (competitorId: string, bib: number) => void
  onInitiateRemove:(competitor: Competitor) => void
  onInitiateBan:   (competitor: Competitor) => void
  onUnbanUser:     (email: string) => void
}

function RoleBadge({ role, theme, labels }: { role?: string; theme: 'light' | 'dark'; labels: Record<string, string> }) {
  const dk = theme === 'dark'
  if (role === 'judge')     return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium border bg-purple-400/10 text-purple-400 border-purple-400/20"><Shield size={8} /> {labels.judge}</span>
  if (role === 'organizer') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium border bg-amber-400/10 text-amber-400 border-amber-400/20"><Shield size={8} /> {labels.organizer}</span>
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium border ${dk ? 'bg-white/5 text-[#8E8E8E] border-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] border-[#EEEEEE]'}`}><Shield size={8} /> {labels.competitor}</span>
}

function RoleDropdown({ competitor, theme, labels, onUpdateRole }: {
  competitor: Competitor; theme: 'light' | 'dark'
  labels: Record<string, string>
  onUpdateRole: (id: string, role: 'competitor' | 'judge' | 'organizer') => void
}) {
  const [open, setOpen]         = useState(false)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const btnRef      = useRef<HTMLButtonElement>(null)
  const currentRole = competitor.role ?? 'competitor'
  const dk          = theme === 'dark'

  useEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setMenuStyle({ top: r.bottom + window.scrollY + 4, left: r.right + window.scrollX })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close) }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors duration-[330ms] border whitespace-nowrap ${dk ? 'bg-white/5 border-white/10 text-[#D0D1D2] hover:bg-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#5C5E62] hover:bg-[#EEEEEE]'}`}
      >
        {labels[currentRole]}<ChevronDown size={10} className={`transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[900]" onClick={() => setOpen(false)} />
          <div
            className={`fixed z-[901] rounded border overflow-hidden min-w-[130px] ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}
            style={{ top: menuStyle.top, left: menuStyle.left, transform: 'translateX(-100%)' }}
          >
            {(['competitor', 'judge', 'organizer'] as const).map(role => (
              <button
                key={role}
                onClick={() => { onUpdateRole(competitor.id, role); setOpen(false) }}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors duration-[330ms] flex items-center gap-2 ${
                  currentRole === role
                    ? dk ? 'bg-[#7F8BAD]/10 text-[#7F8BAD]' : 'bg-[#7F8BAD]/10 text-[#7F8BAD]'
                    : dk ? 'text-[#D0D1D2] hover:bg-white/5' : 'text-[#5C5E62] hover:bg-[#F4F4F4]'
                }`}
              >
                <Shield size={10} />{labels[role]}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function UserDetailModal({ competitor, allCompetitors, competition, isMe, viewOnly, theme, lang, labels, onUpdateRole, onUpdateBib, onRemove, onBan, onClose }: {
  competitor:     Competitor
  allCompetitors: Competitor[]
  competition:    Competition
  isMe:           boolean
  viewOnly:       boolean
  theme:          'light' | 'dark'
  lang:           Language
  labels:         Record<string, string>
  onUpdateRole:   (id: string, role: 'competitor' | 'judge' | 'organizer') => void
  onUpdateBib:    (id: string, bib: number) => void
  onRemove:       () => void
  onBan:          () => void
  onClose:        () => void
}) {
  const t = translations[lang]
  const [bibInput,      setBibInput]      = useState(String(competitor.bibNumber))
  const [dangerAction,  setDangerAction]  = useState<'remove' | 'ban' | null>(null)
  const dk                  = theme === 'dark'
  const currentRole         = competitor.role ?? 'competitor'
  const isJudgeOrOrganizer  = currentRole === 'judge' || currentRole === 'organizer'

  const bibError = useMemo((): string | null => {
    const n = parseInt(bibInput)
    if (isNaN(n) || n < 0) return 'BIB must be a non-negative number.'
    const clash = allCompetitors.find(c => c.bibNumber === n && c.id !== competitor.id)
    return clash ? `BIB #${n} is already assigned to ${clash.displayName}.` : null
  }, [bibInput, allCompetitors, competitor.id])

  const canSaveBib = !isJudgeOrOrganizer && !bibError

  const inputCls = `w-full px-4 py-3 rounded border outline-none text-sm transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#EEEEEE] focus:border-[#7F8BAD]/50' : 'bg-white border-[#EEEEEE] text-[#121212] focus:border-[#7F8BAD]'}`

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/60" onClick={onClose} />
      <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-[500] max-w-md mx-auto rounded border ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>

        <div className={`flex items-center justify-between px-6 py-4 border-b ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded flex items-center justify-center overflow-hidden flex-shrink-0 ${dk ? 'bg-white/5' : 'bg-[#F4F4F4]'}`}>
              <UserAvatar avatar={competitor.avatar} displayName={competitor.displayName} sizeClass="w-full h-full" emojiClass="text-xl" iconSize={18} />
            </div>
            <div>
              <p className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                {competitor.displayName}
                {isMe && <span className="ml-2 text-[9px] font-medium text-[#7F8BAD] bg-[#7F8BAD]/10 px-1.5 py-0.5 rounded">{t.youLabel}</span>}
              </p>
              <p className={`text-xs mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{competitor.email}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#5C5E62]' : 'hover:bg-[#F4F4F4] text-[#8E8E8E]'}`}><X size={17} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!viewOnly && (
            <div>
              <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.role}</label>
              <div className={`flex rounded border overflow-hidden ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
                {(['competitor', 'judge', 'organizer'] as const).map((role, i) => {
                  const active = currentRole === role
                  const activeColor = role === 'organizer'
                    ? 'bg-amber-400/15 text-amber-500'
                    : role === 'judge'
                      ? 'bg-purple-400/15 text-purple-400'
                      : 'bg-[#7F8BAD]/15 text-[#7F8BAD]'
                  return (
                    <button
                      key={role}
                      onClick={() => !isMe && onUpdateRole(competitor.id, role)}
                      disabled={isMe}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-[330ms]
                        ${i > 0 ? dk ? 'border-l border-white/10' : 'border-l border-[#EEEEEE]' : ''}
                        ${active ? activeColor : dk ? 'text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/5' : 'text-[#8E8E8E] hover:text-[#5C5E62] hover:bg-[#F4F4F4]'}
                        ${isMe ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <Shield size={10} className="flex-shrink-0" />
                      <span className="truncate">{labels[role]}</span>
                    </button>
                  )
                })}
              </div>
              {isMe && <p className={`text-xs mt-1.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.cannotChangeOwnRole}</p>}
            </div>
          )}

          <div>
            <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.bibLabel}
              {isJudgeOrOrganizer && <span className={`ml-2 font-normal ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.bibNotApplicable}</span>}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
                <input
                  type="number" min={0} value={bibInput}
                  onChange={e => setBibInput(e.target.value)}
                  disabled={isJudgeOrOrganizer}
                  className={`${inputCls} pl-9 ${isJudgeOrOrganizer ? 'opacity-40 cursor-not-allowed' : ''} ${bibError && !isJudgeOrOrganizer ? '!border-red-400/60' : ''}`}
                />
              </div>
              <button
                onClick={() => { if (canSaveBib) onUpdateBib(competitor.id, parseInt(bibInput)) }}
                disabled={!canSaveBib}
                className={`flex items-center gap-1.5 px-4 py-3 rounded text-xs font-medium transition-colors duration-[330ms] ${!canSaveBib ? 'opacity-40 cursor-not-allowed bg-white/5 text-[#5C5E62]' : 'bg-[#7F8BAD] text-white hover:bg-[#6D799B]'}`}
              >
                <Save size={13} />{t.save}
              </button>
            </div>
            {bibError && !isJudgeOrOrganizer && (
              <div className="flex items-start gap-1 mt-1.5">
                <AlertCircle size={11} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 leading-tight">{bibError}</p>
              </div>
            )}
          </div>

          {(competition.traits?.length ?? 0) > 0 && (
            <div>
              <label className={`block text-xs font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.traitsSectionLabel}</label>
              <div className="flex flex-wrap gap-1.5">
                {(competition.traits ?? []).map(trait => {
                  const active = (competitor.traitIds ?? []).includes(trait.id)
                  return (
                    <span
                      key={trait.id}
                      className={`px-2.5 py-1 rounded text-xs font-medium border ${
                        active
                          ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/20'
                          : dk
                            ? 'bg-white/[0.03] text-[#5C5E62] border-white/5'
                            : 'bg-[#F4F4F4] text-[#D0D1D2] border-[#EEEEEE]'
                      }`}
                    >
                      {trait.name}
                    </span>
                  )
                })}
                {(competitor.traitIds ?? []).length === 0 && (
                  <span className={`text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.noTraitsSelected}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {!isMe && !viewOnly && (
          <div className={`px-6 py-4 border-t ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
            {dangerAction === 'remove' ? (
              <div className="flex items-center gap-3">
                <p className={`text-xs font-medium flex-1 ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{t.confirmRemove(competitor.displayName)}</p>
                <button onClick={() => { onRemove(); onClose() }} className="px-4 py-2 rounded text-xs font-medium bg-red-400 text-white hover:bg-red-500 transition-colors duration-[330ms]">{t.removeFromEvent}</button>
                <button onClick={() => setDangerAction(null)} className={`px-4 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>{t.cancel}</button>
              </div>
            ) : dangerAction === 'ban' ? (
              <div className="flex items-center gap-3">
                <p className={`text-xs font-medium flex-1 ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{t.confirmBan(competitor.displayName)}</p>
                <button onClick={() => { onBan(); onClose() }} className="px-4 py-2 rounded text-xs font-medium bg-red-400 text-white hover:bg-red-500 transition-colors duration-[330ms]">{t.banFromEvent}</button>
                <button onClick={() => setDangerAction(null)} className={`px-4 py-2 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'bg-white/5 text-[#8E8E8E]' : 'bg-[#F4F4F4] text-[#5C5E62]'}`}>{t.cancel}</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => setDangerAction('remove')} className={`flex items-center gap-2 text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-red-400' : 'text-[#8E8E8E] hover:text-red-500'}`}>
                  <Trash2 size={13} />{t.removeFromEvent}
                </button>
                <button onClick={() => setDangerAction('ban')} className={`flex items-center gap-2 text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-red-400' : 'text-[#8E8E8E] hover:text-red-500'}`}>
                  <Ban size={13} />{t.banFromEvent}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function UsersPage({ competitors, competition, currentUser, theme, lang, viewOnly = false, onUpdateRole, onUpdateBib, onInitiateRemove, onInitiateBan, onUnbanUser }: UsersPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'
  const labels = { competitor: t.roleCompetitor, judge: t.roleJudge, organizer: t.roleOrganizer }

  const [tab,          setTab]          = useState<'active' | 'banned'>('active')
  const [search,       setSearch]       = useState('')
  const [selectedUser, setSelectedUser] = useState<Competitor | null>(null)
  const [confirmUnban,  setConfirmUnban]  = useState<string | null>(null)

  const bannedEmails = competition.bannedEmails ?? []

  const visible = useMemo(() => {
    let list = competitors.filter(c => c.id !== competition.ownerId)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.displayName.toLowerCase().includes(q) || c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
        String(c.bibNumber).includes(q)
      )
    }
    return list
  }, [competitors, competition.ownerId, search])

  const judgeCount      = competitors.filter(c => c.role === 'judge').length
  const organizerCount  = competitors.filter(c => c.role === 'organizer').length
  const competitorCount = competitors.filter(c => c.role !== 'judge' && c.role !== 'organizer' && c.id !== competition.ownerId).length

  return (
    <div className="max-w-3xl mx-auto">
      {viewOnly && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded border mb-5 ${dk ? 'bg-purple-400/5 border-purple-400/15 text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
          <Shield size={14} className="flex-shrink-0" />
          <p className="text-xs font-medium">{t.viewOnlyNote}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{t.users}</h1>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}><span className="font-medium text-[#7F8BAD]">{competitorCount}</span> {t.competitorsLabel}</span>
          <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}><span className="font-medium text-purple-400">{judgeCount}</span> {t.judgesLabel}</span>
          <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}><span className="font-medium text-amber-500">{organizerCount}</span> {t.organizersLabel}</span>
        </div>
      </div>

      {/* Tab bar */}
      {!viewOnly && (
        <div className={`flex gap-1 mb-6 p-1 rounded border ${dk ? 'bg-white/[0.03] border-white/8' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`} style={{ width: 'fit-content' }}>
          {(['active', 'banned'] as const).map(t2 => {
            const isActive = tab === t2
            const label    = t2 === 'active' ? t.activeTab : t.bannedTab
            const count    = t2 === 'banned' ? bannedEmails.length : undefined
            return (
              <button
                key={t2}
                onClick={() => { setTab(t2); setSearch('') }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-medium transition-colors duration-[250ms] ${
                  isActive
                    ? t2 === 'banned'
                      ? 'bg-red-400/10 text-red-400'
                      : dk ? 'bg-white/8 text-[#EEEEEE]' : 'bg-white text-[#121212] shadow-sm'
                    : dk ? 'text-[#5C5E62] hover:text-[#8E8E8E]' : 'text-[#8E8E8E] hover:text-[#5C5E62]'
                }`}
              >
                {t2 === 'banned' && <Ban size={11} />}
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${isActive ? 'bg-red-400/20 text-red-400' : dk ? 'bg-white/10 text-[#5C5E62]' : 'bg-[#EEEEEE] text-[#8E8E8E]'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── ACTIVE TAB ── */}
      {tab === 'active' && (<>
        <div className={`flex items-center gap-3 px-4 py-3 rounded border mb-6 ${dk ? 'bg-white/5 border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          <Search size={15} className="text-[#8E8E8E]" />
          <input
            type="text" placeholder={t.searchUsers} value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#8E8E8E]"
          />
          {search && (
            <button onClick={() => setSearch('')} className={`text-xs font-medium ${dk ? 'text-[#5C5E62] hover:text-[#EEEEEE]' : 'text-[#8E8E8E] hover:text-[#5C5E62]'}`}>{t.clearFilters}</button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className={`text-center py-20 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            <User size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-medium text-sm">{t.noUsersFound}</p>
          </div>
        ) : (
          <div className={`rounded border overflow-hidden ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
            <div className={`grid grid-cols-[1fr_auto_auto_36px] gap-3 px-5 py-3 text-xs font-medium ${dk ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#8E8E8E]'}`}>
              <div>{t.roleCompetitor}</div>
              <div className="hidden sm:block text-center">{t.role}</div>
              <div className="hidden sm:block text-center">{t.edit}</div>
              <div></div>
            </div>
            {visible.map((competitor, index) => {
              const isEven = index % 2 === 0
              const isMe   = competitor.id === currentUser.id
              return (
                <div
                  key={competitor.id}
                  className={`grid grid-cols-[1fr_auto_auto_36px] gap-3 px-5 py-3.5 items-center border-t transition-colors duration-[330ms] ${dk ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}` : `border-[#EEEEEE] ${isEven ? 'bg-white' : 'bg-[#F4F4F4]/50'}`}`}
                >
                  <button onClick={() => setSelectedUser(competitor)} className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity">
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${dk ? 'bg-white/5' : 'bg-[#F4F4F4]'}`}>
                      <UserAvatar avatar={competitor.avatar} displayName={competitor.displayName} sizeClass="w-full h-full" emojiClass="text-xl" iconSize={15} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium leading-tight truncate ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                        {competitor.displayName}
                        {isMe && <span className="ml-2 text-[9px] font-medium text-[#7F8BAD] bg-[#7F8BAD]/10 px-1.5 py-0.5 rounded">{t.youLabel}</span>}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                        {competitor.email}
                        {competitor.role !== 'judge' && competitor.role !== 'organizer' && <span className="ml-1">· BIB #{competitor.bibNumber}</span>}
                        {(competitor.traitIds ?? []).length > 0 && (
                          <span className="ml-1">· {(competitor.traitIds ?? []).map(id => competition.traits?.find(tr => tr.id === id)?.name).filter(Boolean).join(', ')}</span>
                        )}
                      </p>
                    </div>
                  </button>
                  <div className="hidden sm:flex justify-center"><RoleBadge role={competitor.role} theme={theme} labels={labels} /></div>
                  <div className="hidden sm:flex justify-center">
                    {isMe
                      ? <span className={`text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>—</span>
                      : <RoleDropdown competitor={competitor} theme={theme} labels={labels} onUpdateRole={onUpdateRole} />
                    }
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedUser(competitor)}
                      className={`p-2 rounded transition-colors duration-[330ms] text-xs font-medium ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/5' : 'text-[#D0D1D2] hover:text-[#5C5E62] hover:bg-[#F4F4F4]'}`}
                    ><MoreHorizontal size={15} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className={`flex items-start gap-3 mt-6 p-4 rounded border ${dk ? 'bg-white/[0.02] border-white/5' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <Shield size={14} className="flex-shrink-0 mt-0.5 text-[#8E8E8E]" />
          <p className={`text-xs leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {t.usersHint}
          </p>
        </div>
      </>)}

      {/* ── BANNED TAB ── */}
      {tab === 'banned' && (
        <div className={`rounded border overflow-hidden ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          {bannedEmails.length === 0 ? (
            <div className={`text-center py-20 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              <ShieldOff size={40} className="mx-auto mb-4 opacity-40" />
              <p className="font-medium text-sm">{t.noBannedUsers}</p>
              <p className={`text-xs mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.noBannedDesc}</p>
            </div>
          ) : (<>
            <div className={`px-5 py-3 text-xs font-medium ${dk ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#8E8E8E]'}`}>
              Email
            </div>
            {bannedEmails.map((email, index) => {
              const isEven = index % 2 === 0
              return (
                <div
                  key={email}
                  className={`flex items-center justify-between px-5 py-3.5 border-t transition-colors duration-[330ms] ${dk ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}` : `border-[#EEEEEE] ${isEven ? 'bg-white' : 'bg-[#F4F4F4]/50'}`}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${dk ? 'bg-red-400/10' : 'bg-red-50'}`}>
                      <Ban size={14} className="text-red-400" />
                    </div>
                    <span className={`text-sm truncate ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{email}</span>
                  </div>

                  {confirmUnban === email ? (
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <p className={`text-xs ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{t.confirmUnban(email)}</p>
                      <button
                        onClick={() => { onUnbanUser(email); setConfirmUnban(null) }}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[250ms]"
                      >{t.unbanUser}</button>
                      <button
                        onClick={() => setConfirmUnban(null)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors duration-[250ms] ${dk ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10' : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE]'}`}
                      >{t.cancel}</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmUnban(email)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors duration-[250ms] flex-shrink-0 ml-4 ${dk ? 'text-[#5C5E62] hover:text-[#7F8BAD] hover:bg-[#7F8BAD]/10 border border-white/10' : 'text-[#8E8E8E] hover:text-[#7F8BAD] hover:bg-[#7F8BAD]/10 border border-[#EEEEEE]'}`}
                    >
                      <ShieldOff size={12} />{t.unbanUser}
                    </button>
                  )}
                </div>
              )
            })}
          </>)}
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          competitor={selectedUser}
          allCompetitors={competitors}
          competition={competition}
          isMe={selectedUser.id === currentUser.id}
          viewOnly={viewOnly}
          theme={theme}
          lang={lang}
          labels={labels}
          onUpdateRole={(id, role) => { onUpdateRole(id, role); setSelectedUser(prev => prev ? { ...prev, role } : null) }}
          onUpdateBib={(id, bib)   => { onUpdateBib(id, bib);   setSelectedUser(prev => prev ? { ...prev, bibNumber: bib } : null) }}
          onRemove={() => { onInitiateRemove(selectedUser); setSelectedUser(null) }}
          onBan={() => { onInitiateBan(selectedUser); setSelectedUser(null) }}
          onClose={() => setSelectedUser(null)}
        />
      )}

    </div>
  )
}
