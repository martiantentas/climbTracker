import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, User, Menu, LogOut, Settings } from 'lucide-react'

import type { Competitor, Competition } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'
import logo from '../assets/Ascendia.png'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  theme:             'light' | 'dark'
  setTheme:          (t: 'light' | 'dark') => void
  lang:              Language
  setLang:           (l: Language) => void
  currentUser:       Competitor
  activeCompetition: Competition
  isOrganizer:       boolean
  isJudge?:          boolean
  canAccessComp?:    boolean
  branding?:         { logoDataUrl?: string; accentColor?: string; lightBg?: string; darkBg?: string }
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
        px-4 py-2 rounded text-sm font-medium
        transition-colors duration-[330ms] whitespace-nowrap
        ${isActive
          ? 'bg-[#7F8BAD]/10 text-[#7F8BAD]'
          : theme === 'dark'
            ? 'text-[#8E8E8E] hover:text-[#EEEEEE]'
            : 'text-[#5C5E62] hover:text-[#121212]'
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
  activeCompetition,
  isOrganizer,
  isJudge = false,
  canAccessComp = false,
  branding,
  onOpenMenu,
  onLogout,
}: NavBarProps) {
  const t = translations[lang]

  return (
    <header
      className={`
        sticky top-0 z-[100] w-full border-b transition-colors duration-[330ms]
        ${theme === 'dark'
          ? 'bg-[#121212] border-white/10'
          : 'bg-white border-[#EEEEEE]'
        }
      `}
    >
      <div className="w-full px-4 md:px-6 py-2 flex items-center gap-3">

        {/* ── Logo ── */}
        <div className="flex-shrink-0">
          {branding?.logoDataUrl
            ? <img src={branding.logoDataUrl} alt="logo" className="h-8 w-auto object-contain" />
            : <img src={logo} alt="Ascendia" className="h-8 w-auto object-contain" />
          }
        </div>

        {/* ── Status dot + competition name — only when in a competition ── */}
        {canAccessComp && (
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 px-3 py-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getStatusColor(activeCompetition.status) }}
            />
            <span className={`
              text-xs font-medium whitespace-nowrap max-w-[140px] truncate
              ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}
            `}>
              {activeCompetition.name}
            </span>
          </div>
        )}

        {/* ── Centre: Nav pills ── */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          <NavPill to="/competitions" label={t.myCompetitions} theme={theme} />

          {canAccessComp && (
            <>
              <NavPill to="/"            label={t.boulders}    theme={theme} />
              <NavPill to="/leaderboard" label={t.leaderboard} theme={theme} />
              <NavPill to="/rules"       label="Rules"         theme={theme} />
              {!isOrganizer && !isJudge && (
                <NavPill to="/event-profile" label="Event Settings" theme={theme} />
              )}
              {(isOrganizer || isJudge) && (
                <>
                  <NavPill to="/users"     label={t.users}     theme={theme} />
                  <NavPill to="/analytics" label={t.analytics} theme={theme} />
                  <NavPill to="/judging"   label={t.judging}   theme={theme} />
                </>
              )}
            </>
          )}
        </nav>

        {/* ── Right: Controls ── */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">

          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Language)}
            className={`
              text-xs font-medium bg-transparent border-none outline-none
              cursor-pointer px-2 py-2 rounded transition-colors duration-[330ms]
              ${theme === 'dark'
                ? 'text-[#5C5E62] hover:bg-white/5'
                : 'text-[#5C5E62] hover:bg-[#F4F4F4]'
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
              p-2 rounded transition-colors duration-[330ms]
              ${theme === 'dark'
                ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
              }
            `}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Settings icon — organizer only */}
          {isOrganizer && (
            <Link
              to="/settings"
              className={`
                p-2 rounded transition-colors duration-[330ms]
                ${theme === 'dark'
                  ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                  : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
                }
              `}
            >
              <Settings size={17} />
            </Link>
          )}

          {/* Profile icon */}
          <Link
            to="/profile"
            className={`
              p-2 rounded transition-colors duration-[330ms]
              ${theme === 'dark'
                ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
              }
            `}
          >
            <User size={17} />
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors duration-[330ms]"
          >
            <LogOut size={14} />
            {t.logout}
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-2 rounded bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            <Menu size={17} />
          </button>

        </div>
      </div>
    </header>
  )
}
