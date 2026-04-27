import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sun, Moon, User, Menu, LogOut, Settings } from 'lucide-react'

import type { Competitor, Competition } from '../types'
import { getStatusColor } from '../App'
import type { Language } from '../translations'
import { translations } from '../translations'
import logo from '../assets/Ascendr.png'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  theme:             'light' | 'dark'
  setTheme:          (t: 'light' | 'dark') => void
  lang:              Language
  setLang:           (l: Language) => void
  currentUser:        Competitor
  activeCompetition?: Competition
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

const PILL_SPRING = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const
const BTN_SPRING  = { type: 'spring', stiffness: 420, damping: 26, mass: 0.7 } as const

function NavPill({ to, label, theme }: NavPillProps) {
  const location = useLocation()
  const isActive = location.pathname === to
  const dk = theme === 'dark'

  return (
    <Link
      to={to}
      style={{ position: 'relative', display: 'block', borderRadius: 6 }}
    >
      {/* Sliding pill — shared layoutId animates between active items */}
      {isActive && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-md"
          style={{
            background: dk ? 'rgba(127,139,173,0.18)' : 'white',
            boxShadow: dk ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
          }}
          transition={PILL_SPRING}
        />
      )}
      <motion.span
        whileHover={{ opacity: 0.85 }}
        whileTap={{ scale: 0.96 }}
        transition={BTN_SPRING}
        className={`
          relative z-10 block px-4 py-1.5 rounded-md text-sm font-medium
          whitespace-nowrap select-none
          ${isActive
            ? 'text-[#7F8BAD]'
            : dk
              ? 'text-[#8E8E8E] hover:text-[#D0D1D2]'
              : 'text-[#5C5E62] hover:text-[#121212]'
          }
        `}
      >
        {label}
      </motion.span>
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
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={BTN_SPRING}
        >
          {branding?.logoDataUrl
            ? <img src={branding.logoDataUrl} alt="logo" className="h-8 w-auto object-contain" />
            : <img src={logo} alt="Ascendr" className="h-8 w-auto object-contain" />
          }
        </motion.div>

        {/* ── Status dot + competition name ── */}
        {canAccessComp && activeCompetition && (
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
        <nav className={`
          hidden lg:flex items-center gap-0.5 p-1 rounded-lg overflow-x-auto
          ${theme === 'dark' ? 'bg-white/[0.05]' : 'bg-[#F0F0F0]'}
        `}>
          <NavPill to={`/${lang}/competitions`} label={t.myCompetitions} theme={theme} />

          {canAccessComp && (
            <>
              <NavPill to={`/${lang}`}               label={t.boulders}    theme={theme} />
              <NavPill to={`/${lang}/leaderboard`}   label={t.leaderboard} theme={theme} />
              <NavPill to={`/${lang}/rules`}         label={t.rules}       theme={theme} />
              {!isOrganizer && !isJudge && (
                <NavPill to={`/${lang}/event-profile`} label={t.eventSettings} theme={theme} />
              )}
              {(isOrganizer || isJudge) && (
                <>
                  <NavPill to={`/${lang}/users`}     label={t.users}     theme={theme} />
                  <NavPill to={`/${lang}/analytics`} label={t.analytics} theme={theme} />
                  <NavPill to={`/${lang}/judging`}   label={t.judging}   theme={theme} />
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
            aria-label="Language"
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
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            transition={BTN_SPRING}
            className={`
              p-2 rounded transition-colors duration-[330ms]
              ${theme === 'dark'
                ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
              }
            `}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </motion.button>

          {/* Settings icon — organizer only */}
          {isOrganizer && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              transition={BTN_SPRING}
            >
              <Link
                to={`/${lang}/settings`}
                className={`
                  p-2 rounded transition-colors duration-[330ms] flex items-center
                  ${theme === 'dark'
                    ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                    : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
                  }
                `}
              >
                <Settings size={17} />
              </Link>
            </motion.div>
          )}

          {/* Profile icon */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            transition={BTN_SPRING}
          >
            <Link
              to={`/${lang}/profile`}
              className={`
                p-2 rounded transition-colors duration-[330ms] flex items-center
                ${theme === 'dark'
                  ? 'text-[#5C5E62] hover:text-[#EEEEEE] hover:bg-white/5'
                  : 'text-[#5C5E62] hover:text-[#121212] hover:bg-[#F4F4F4]'
                }
              `}
            >
              <User size={17} />
            </Link>
          </motion.div>

          {/* Logout */}
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            transition={BTN_SPRING}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-red-400 hover:bg-red-400/10 transition-colors duration-[330ms]"
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
            className="lg:hidden p-2 rounded bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            <Menu size={17} />
          </motion.button>

        </div>
      </div>
    </header>
  )
}
