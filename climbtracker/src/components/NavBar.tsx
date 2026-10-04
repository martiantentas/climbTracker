import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sun, Moon, User, Menu, LogOut, Settings, ChevronLeft } from 'lucide-react'

import type { Competitor, Competition } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'
import logo from '../assets/Ascendr.webp'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  theme:              'light' | 'dark'
  setTheme:           (t: 'light' | 'dark') => void
  lang:               Language
  setLang:            (l: Language) => void
  currentUser:        Competitor
  activeCompetition?: Competition
  isOrganizer:        boolean
  isJudge?:           boolean
  canAccessComp?:     boolean
  branding?:          { logoDataUrl?: string; accentColor?: string; lightBg?: string; darkBg?: string }
  onOpenMenu:         () => void
  onLogout:           () => void
}

const TAB_SPRING = { type: 'spring', stiffness: 400, damping: 32, mass: 0.8 } as const
const BTN_SPRING = { type: 'spring', stiffness: 420, damping: 26, mass: 0.7 } as const

// ─── NAV TAB ─────────────────────────────────────────────────────────────────
// Tab-style link with a sliding underline indicator (shared layoutId)

interface NavTabProps {
  to:    string
  label: string
  dk:    boolean
}

function NavTab({ to, label, dk }: NavTabProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link to={to} className="relative flex items-center h-10 px-3 select-none shrink-0">
      <span
        className="text-sm font-medium transition-colors duration-200"
        style={{ color: isActive ? '#7F8BAD' : dk ? '#5C5E62' : '#8E8E8E' }}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="nav-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7F8BAD] rounded-full"
          transition={TAB_SPRING}
        />
      )}
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
  const t   = translations[lang]
  const loc = useLocation()
  const dk  = theme === 'dark'

  const pathEnd       = loc.pathname.split('/').pop() || ''
  const isCompListPage = pathEnd === 'competitions'
  const showCompNav   = !isCompListPage && !!activeCompetition

  const borderCls = dk ? 'border-white/[0.08]' : 'border-[#EEEEEE]'
  const btnBase   = `p-2 rounded-md transition-colors duration-200 flex items-center ${
    dk
      ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
      : 'text-[#8E8E8E] hover:text-[#121212] hover:bg-[#F4F4F4]'
  }`

  return (
    <header
      className={`sticky top-0 z-[100] w-full transition-colors duration-[330ms] ${
        dk ? 'bg-[#121212]' : 'bg-white'
      }`}
      style={{ borderBottom: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : '#EEEEEE'}` }}
    >

      {/* ── Row 1: Global bar ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">

        {/* Logo */}
        <motion.div
          className="shrink-0"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={BTN_SPRING}
        >
          {branding?.logoDataUrl
            ? <img src={branding.logoDataUrl} alt="logo" className="h-8 w-auto object-contain" />
            : <img src={logo} alt="Ascendr" className="h-8 w-auto object-contain" />
          }
        </motion.div>

        {/* Competition context: back link + comp name */}
        {showCompNav && (
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-3">
            <span data-walkthrough="competitions">
              <Link
                to={`/${lang}/competitions`}
                className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                  dk
                    ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                    : 'text-[#8E8E8E] hover:text-[#121212] hover:bg-[#F4F4F4]'
                }`}
              >
                <ChevronLeft size={12} strokeWidth={2.5} />
                {t.myCompetitions}
              </Link>
            </span>
            <div className={`w-px h-3.5 shrink-0 ${dk ? 'bg-white/10' : 'bg-black/10'}`} />
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: getStatusColor(activeCompetition!.status) }}
            />
            <span
              className="text-xs font-medium whitespace-nowrap max-w-[160px] truncate"
              style={{ color: dk ? '#8E8E8E' : '#5C5E62' }}
            >
              {activeCompetition!.name}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-0.5">

          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Language)}
            aria-label="Language"
            className={`text-xs font-medium bg-transparent border-none outline-none cursor-pointer px-2 py-2 rounded transition-colors duration-200 ${
              dk ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#8E8E8E] hover:bg-[#F4F4F4]'
            }`}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="ca">CA</option>
          </select>

          {/* Theme toggle */}
          <motion.button
            onClick={() => setTheme(dk ? 'light' : 'dark')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            transition={BTN_SPRING}
            className={btnBase}
          >
            {dk ? <Sun size={17} /> : <Moon size={17} />}
          </motion.button>

          {/* Settings — organizer only */}
          {isOrganizer && (
            <span data-walkthrough="settings">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={BTN_SPRING}>
                <Link to={`/${lang}/settings`} className={btnBase}>
                  <Settings size={17} />
                </Link>
              </motion.div>
            </span>
          )}

          {/* Profile */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={BTN_SPRING}>
            <Link to={`/${lang}/profile`} className={btnBase}>
              <User size={17} />
            </Link>
          </motion.div>

          {/* Logout */}
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            transition={BTN_SPRING}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors duration-200"
          >
            <LogOut size={14} />
            {t.logout}
          </motion.button>

          {/* Hamburger — mobile only */}
          <motion.button
            onClick={onOpenMenu}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            transition={BTN_SPRING}
            className="lg:hidden p-2 rounded-md bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-200"
          >
            <Menu size={17} />
          </motion.button>

        </div>
      </div>

      {/* ── Row 2: Competition tab bar (competition mode, desktop) ──────────── */}
      {showCompNav && (
        <div className={`border-t ${borderCls}`}>
          <nav className="max-w-5xl mx-auto px-4 md:px-6 hidden lg:flex items-center gap-0 overflow-x-auto">
            {canAccessComp && (
              <>
                <span data-walkthrough="boulders">
                  <NavTab to={`/${lang}/boulders`}      label={t.boulders}      dk={dk} />
                </span>
                <span data-walkthrough="leaderboard">
                  <NavTab to={`/${lang}/leaderboard`}   label={t.leaderboard}   dk={dk} />
                </span>
                <NavTab to={`/${lang}/rules`}           label={t.rules}         dk={dk} />
                {!isOrganizer && !isJudge && (
                  <NavTab to={`/${lang}/event-profile`} label={t.eventSettings} dk={dk} />
                )}
                {(isOrganizer || isJudge) && (
                  <>
                    <NavTab to={`/${lang}/users`}     label={t.users}     dk={dk} />
                    <NavTab to={`/${lang}/analytics`} label={t.analytics} dk={dk} />
                    <NavTab to={`/${lang}/judging`}   label={t.judging}   dk={dk} />
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}

    </header>
  )
}
