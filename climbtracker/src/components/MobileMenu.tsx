import { Link, useLocation } from 'react-router-dom'
import {
  X,
  LayoutGrid,
  Trophy,
  BookOpen,
  Layers,
  BarChart2,
  ClipboardList,
  Settings,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  Users,
  CalendarDays,
} from 'lucide-react'

import logo from '../assets/climbtracker-logo.svg'
import type { Competitor, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MobileMenuProps {
  isOpen:        boolean
  onClose:       () => void
  theme:         'light' | 'dark'
  lang:          Language
  currentUser:   Competitor
  competition:   Competition
  isOrganizer:   boolean
  isJudge?:      boolean
  canAccessComp?: boolean   // optional
  onLogout:      () => void
}

// ─── MENU LINK ────────────────────────────────────────────────────────────────

interface MenuLinkProps {
  to:      string
  icon:    React.ReactNode
  label:   string
  theme:   'light' | 'dark'
  onClick: () => void
}

function MenuLink({ to, icon, label, theme, onClick }: MenuLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 rounded-2xl transition-all
        ${isActive
          ? 'bg-sky-400 text-sky-950 shadow-xl shadow-sky-400/30'
          : theme === 'dark'
            ? 'hover:bg-white/5 text-slate-400 hover:text-slate-100'
            : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-sm font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight
        size={16}
        className={isActive ? 'opacity-100' : 'opacity-20'}
      />
    </Link>
  )
}

// ─── MOBILE MENU ──────────────────────────────────────────────────────────────

export default function MobileMenu({
  isOpen,
  onClose,
  theme,
  lang,
  currentUser,
  competition,
  isOrganizer,
  isJudge = false,
  onLogout,
}: MobileMenuProps) {
  const t = translations[lang]

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`
          fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* ── Drawer panel ── */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 z-[300] w-[80%] max-w-sm
          border-l shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${theme === 'dark'
            ? 'bg-slate-900 border-white/5'
            : 'bg-white border-slate-200'
          }
        `}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-sky-700 w-5 h-5" />
              </div>
              <span className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                ClimbTracker
              </span>
            </div>
            <button
              onClick={onClose}
              className={`
                p-2 rounded-xl transition-all
                ${theme === 'dark' ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}
              `}
            >
              <X size={22} />
            </button>
          </div>

          {/* ── Navigation links ── */}
          <nav className="flex flex-col gap-1 flex-1">
            <MenuLink to="/"              icon={<LayoutGrid size={20} />}   label={t.boulders}       theme={theme} onClick={onClose} />
            <MenuLink to="/leaderboard"   icon={<Trophy size={20} />}       label={t.leaderboard}    theme={theme} onClick={onClose} />
            <MenuLink to="/rules"         icon={<BookOpen size={20} />}     label={t.rules}          theme={theme} onClick={onClose} />
            {/* Event Settings — competitors only */}
            {!isOrganizer && !isJudge && (
              <MenuLink to="/event-profile" icon={<CalendarDays size={20} />} label="Event Settings" theme={theme} onClick={onClose} />
            )}

            {/* Divider */}
            <div className={`h-px my-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-200'}`} />

            <MenuLink to="/competitions" icon={<Layers size={20} />} label={t.myCompetitions} theme={theme} onClick={onClose} />

            {/* Organizer-only links */}
            {isOrganizer && (
              <>
                <MenuLink to="/users"     icon={<Users size={20} />}         label={t.users}     theme={theme} onClick={onClose} />
                <MenuLink to="/analytics" icon={<BarChart2 size={20} />}     label={t.analytics} theme={theme} onClick={onClose} />
                <MenuLink to="/judging"   icon={<ClipboardList size={20} />} label={t.judging}   theme={theme} onClick={onClose} />
                <MenuLink to="/settings"  icon={<Settings size={20} />}      label={t.settings}  theme={theme} onClick={onClose} />
              </>
            )}

            {/* Judge links — users+analytics view, judging full */}
            {isJudge && !isOrganizer && (
              <>
                <MenuLink to="/users"     icon={<Users size={20} />}         label={t.users}     theme={theme} onClick={onClose} />
                <MenuLink to="/analytics" icon={<BarChart2 size={20} />}     label={t.analytics} theme={theme} onClick={onClose} />
                <MenuLink to="/judging"   icon={<ClipboardList size={20} />} label={t.judging}   theme={theme} onClick={onClose} />
              </>
            )}
          </nav>

          {/* ── Footer: user info + logout ── */}
          <div className={`pt-6 border-t mt-6 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>

            {/* User info row → links to global profile */}
            <Link
              to="/profile"
              onClick={onClose}
              className={`
                flex items-center gap-3 p-3 rounded-2xl mb-3 transition-all
                ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 overflow-hidden flex-shrink-0">
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  : <User size={20} />
                }
              </div>
              <div>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {currentUser.displayName}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  {isOrganizer ? t.organizer : isJudge ? 'Judge' : t.competitor}
                  {' · BIB #'}{currentUser.bibNumber}
                </p>
              </div>
            </Link>

            {/* Competition name pill */}
            <div className={`
              text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl mb-3
              ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}
            `}>
              {competition.name}
            </div>

            {/* Logout button */}
            <button
              onClick={() => { onLogout(); onClose() }}
              className="w-full py-3 rounded-2xl bg-red-400/10 text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-400/20 transition-all"
            >
              <LogOut size={16} />
              {t.logout}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}