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

import type { Competitor, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MobileMenuProps {
  isOpen:         boolean
  onClose:        () => void
  theme:          'light' | 'dark'
  lang:           Language
  currentUser:    Competitor
  competition:    Competition
  isOrganizer:    boolean
  isJudge?:       boolean
  canAccessComp?: boolean
  onLogout:       () => void
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
        flex items-center justify-between px-4 py-3 rounded transition-colors duration-[330ms]
        ${isActive
          ? 'bg-[#3E6AE1]/10 text-[#3E6AE1]'
          : theme === 'dark'
            ? 'text-[#5C5E62] hover:bg-white/5 hover:text-[#EEEEEE]'
            : 'text-[#5C5E62] hover:bg-[#F4F4F4] hover:text-[#171A20]'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight
        size={15}
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
          fixed inset-0 z-[200] bg-black/60
          transition-opacity duration-[330ms]
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* ── Drawer panel ── */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 z-[300] w-[80%] max-w-sm
          border-l transition-transform duration-[330ms] ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${theme === 'dark'
            ? 'bg-[#171A20] border-white/10'
            : 'bg-white border-[#EEEEEE]'
          }
        `}
      >
        <div className="flex flex-col h-full p-5 overflow-y-auto">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#3E6AE1]/10 rounded flex items-center justify-center">
                <TrendingUp className="text-[#3E6AE1] w-4 h-4" />
              </div>
              <span className={`font-medium text-base ${theme === 'dark' ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
                ClimbTracker
              </span>
            </div>
            <button
              onClick={onClose}
              className={`
                p-2 rounded transition-colors duration-[330ms]
                ${theme === 'dark' ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#5C5E62] hover:bg-[#F4F4F4]'}
              `}
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Navigation links ── */}
          <nav className="flex flex-col gap-0.5 flex-1">
            <MenuLink to="/"              icon={<LayoutGrid size={18} />}   label={t.boulders}       theme={theme} onClick={onClose} />
            <MenuLink to="/leaderboard"   icon={<Trophy size={18} />}       label={t.leaderboard}    theme={theme} onClick={onClose} />
            <MenuLink to="/rules"         icon={<BookOpen size={18} />}     label={t.rules}          theme={theme} onClick={onClose} />
            {!isOrganizer && !isJudge && (
              <MenuLink to="/event-profile" icon={<CalendarDays size={18} />} label="Event Settings" theme={theme} onClick={onClose} />
            )}

            {/* Divider */}
            <div className={`h-px my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />

            <MenuLink to="/competitions" icon={<Layers size={18} />} label={t.myCompetitions} theme={theme} onClick={onClose} />

            {isOrganizer && (
              <>
                <MenuLink to="/users"     icon={<Users size={18} />}         label={t.users}     theme={theme} onClick={onClose} />
                <MenuLink to="/analytics" icon={<BarChart2 size={18} />}     label={t.analytics} theme={theme} onClick={onClose} />
                <MenuLink to="/judging"   icon={<ClipboardList size={18} />} label={t.judging}   theme={theme} onClick={onClose} />
                <MenuLink to="/settings"  icon={<Settings size={18} />}      label={t.settings}  theme={theme} onClick={onClose} />
              </>
            )}

            {isJudge && !isOrganizer && (
              <>
                <MenuLink to="/users"     icon={<Users size={18} />}         label={t.users}     theme={theme} onClick={onClose} />
                <MenuLink to="/analytics" icon={<BarChart2 size={18} />}     label={t.analytics} theme={theme} onClick={onClose} />
                <MenuLink to="/judging"   icon={<ClipboardList size={18} />} label={t.judging}   theme={theme} onClick={onClose} />
              </>
            )}
          </nav>

          {/* ── Footer: user info + logout ── */}
          <div className={`pt-5 border-t mt-5 ${theme === 'dark' ? 'border-white/10' : 'border-[#EEEEEE]'}`}>

            {/* User info row */}
            <Link
              to="/profile"
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-3 rounded mb-2 transition-colors duration-[330ms]
                ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#F4F4F4]'}
              `}
            >
              <div className="w-9 h-9 rounded-full bg-[#3E6AE1]/10 flex items-center justify-center text-[#3E6AE1] overflow-hidden flex-shrink-0 text-lg">
                {currentUser.avatar
                  ? <span>{currentUser.avatar}</span>
                  : <User size={18} />
                }
              </div>
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
                  {currentUser.displayName}
                </p>
                <p className="text-xs text-[#5C5E62]">
                  {isOrganizer ? t.organizer : isJudge ? 'Judge' : t.competitor}
                  {' · BIB #'}{currentUser.bibNumber}
                </p>
              </div>
            </Link>

            {/* Competition name */}
            <div className={`
              text-xs font-medium px-3 py-2 rounded mb-2
              ${theme === 'dark' ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#5C5E62]'}
            `}>
              {competition.name}
            </div>

            {/* Logout */}
            <button
              onClick={() => { onLogout(); onClose() }}
              className="w-full py-2.5 rounded bg-red-400/10 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-400/20 transition-colors duration-[330ms]"
            >
              <LogOut size={15} />
              {t.logout}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}
