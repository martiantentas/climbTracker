import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, User, Menu, LogOut } from 'lucide-react'

import type { Competitor, Competition } from '../types'
import { CompetitionStatus } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'
import logo from '../assets/climbtracker-logo.svg'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  theme:             'light' | 'dark'
  setTheme:          (t: 'light' | 'dark') => void
  lang:              Language
  setLang:           (l: Language) => void
  currentUser:       Competitor
  activeCompetition: Competition
  isOrganizer:       boolean
  onOpenMenu:        () => void
  onLogout:          () => void
}

// ─── NAV PILL ─────────────────────────────────────────────────────────────────

interface NavPillProps {
  to:    string
  label: string
  theme: 'light' | 'dark'
}

function NavPill({ to, label, theme }: NavPillProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`
        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.12em]
        transition-all duration-200 whitespace-nowrap
        ${isActive
          ? theme === 'dark'
            ? 'bg-sky-400 text-sky-950 shadow-lg shadow-sky-400/20'
            : 'bg-white text-slate-900 shadow-sm border border-slate-200'
          : theme === 'dark'
            ? 'text-slate-500 hover:text-slate-200'
            : 'text-slate-500 hover:text-slate-900'
        }
      `}
    >
      {label}
    </Link>
  )
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

export default function NavBar({
  theme,
  setTheme,
  lang,
  setLang,
  currentUser,
  activeCompetition,
  isOrganizer,
  onOpenMenu,
  onLogout,
}: NavBarProps) {
  const t = translations[lang]

  return (
    <header className={`
      sticky top-0 z-[100] w-full border-b transition-all duration-300
      ${theme === 'dark'
        ? 'bg-slate-900/80 backdrop-blur-xl border-white/5 shadow-lg shadow-black/20'
        : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-sm'
      }
    `}>
      <div className="w-full px-4 md:px-6 py-2 flex items-center gap-4">

        {/* ── Logo ── */}
        <div className="flex-shrink-0">
          <img
            src={logo}
            alt="climbTracker-logo"
            className={`h-8 w-auto ${theme === 'dark' ? 'invert brightness-200' : ''}`}
          />
        </div>

        {/* ── Status dot + competition name (hidden on small screens) ── */}
        <div className={`
          hidden md:flex items-center gap-2 flex-shrink-0
          px-3 py-1.5 rounded-lg
          ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}
        `}>
          <div
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ backgroundColor: getStatusColor(activeCompetition.status) }}
          />
          <span className={`
            text-[10px] font-black uppercase tracking-widest whitespace-nowrap max-w-[140px] truncate
            ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
          `}>
            {activeCompetition.name}
          </span>
        </div>

        {/* ── Centre: Nav pills — takes remaining space, scrollable if needed ── */}
        <nav className={`
          hidden lg:flex items-center gap-1 p-1.5 rounded-2xl overflow-x-auto
          ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-200/50'}
        `}>
          <NavPill to="/"             label={t.boulders}       theme={theme} />
          <NavPill to="/leaderboard"  label={t.leaderboard}    theme={theme} />
          <NavPill to="/rules"        label={t.rules}          theme={theme} />
          <div className="w-px h-4 bg-slate-500/20 mx-1 flex-shrink-0" />
          <NavPill to="/competitions" label={t.myCompetitions} theme={theme} />
          {isOrganizer && (
            <>
              <NavPill to="/analytics" label={t.analytics} theme={theme} />
              <NavPill to="/judging"   label={t.judging}   theme={theme} />
              <NavPill to="/settings"  label={t.settings}  theme={theme} />
            </>
          )}
        </nav>

        {/* ── Right: Controls ── */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">

          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Language)}
            className={`
              text-[11px] font-black bg-transparent border-none outline-none
              cursor-pointer px-1 py-2 rounded-xl transition-all
              ${theme === 'dark'
                ? 'text-slate-400 hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ca">CA</option>
          </select>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`
              p-2 rounded-xl transition-all
              ${theme === 'dark'
                ? 'bg-white/5 text-slate-400 hover:text-sky-300'
                : 'bg-slate-100 text-slate-500 hover:text-sky-600'
              }
            `}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Profile pill — hidden on mobile */}
          <Link
            to="/profile"
            className={`
              hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5
              rounded-2xl border transition-all
              ${theme === 'dark'
                ? 'bg-white/5 border-white/5 hover:bg-white/10'
                : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
              }
            `}
          >
            <div className="w-7 h-7 rounded-lg bg-sky-200 flex items-center justify-center overflow-hidden">
              {currentUser.avatar
                ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                : <User size={16} className="text-sky-700" />
              }
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-xs font-black leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                {currentUser.displayName}
              </span>
              <span className="text-[9px] font-black text-sky-500 leading-tight">
                BIB #{currentUser.bibNumber}
              </span>
            </div>
          </Link>

          {/* Logout — desktop */}
          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={15} />
            {t.logout}
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-2 rounded-xl bg-sky-400 text-sky-950 shadow-lg shadow-sky-400/20"
          >
            <Menu size={18} />
          </button>

        </div>
      </div>
    </header>
  )
}