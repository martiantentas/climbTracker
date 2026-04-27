import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import UserAvatar from './UserAvatar'
import {
  X,
  LayoutGrid,
  Trophy,
  BookOpen,
  Layers,
  BarChart2,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  Users,
  CalendarDays,
} from 'lucide-react'
import ascendiaLogo from '../assets/Ascendr.png'

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
  competition?:   Competition
  isOrganizer:    boolean
  isJudge?:       boolean
  canAccessComp?: boolean
  branding?:      { logoDataUrl?: string; accentColor?: string; lightBg?: string; darkBg?: string }
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

const BTN_SPRING = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 } as const

function MenuLink({ to, icon, label, theme, onClick }: MenuLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <motion.div
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      transition={BTN_SPRING}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center justify-between px-4 py-3 rounded transition-colors duration-[330ms]
          ${isActive
            ? 'bg-[#7F8BAD]/10 text-[#7F8BAD]'
            : theme === 'dark'
              ? 'text-[#5C5E62] hover:bg-white/5 hover:text-[#EEEEEE]'
              : 'text-[#5C5E62] hover:bg-[#F4F4F4] hover:text-[#121212]'
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
    </motion.div>
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
  canAccessComp = false,
  branding,
  onLogout,
}: MobileMenuProps) {
  const t = translations[lang]

  return (
    <>
      {/* ── Backdrop ── */}
      <motion.div
        className="fixed inset-0 z-[200] bg-black/60"
        animate={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        onClick={onClose}
      />

      {/* ── Drawer panel ── */}
      <motion.div
        className={`
          fixed right-0 top-0 bottom-0 z-[300] w-[80%] max-w-sm border-l
          ${theme === 'dark'
            ? 'bg-[#121212] border-white/10'
            : 'bg-white border-[#EEEEEE]'
          }
        `}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
      >
        <div className="flex flex-col h-full p-5 overflow-y-auto">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {branding?.logoDataUrl
                ? <img src={branding.logoDataUrl} alt="logo" className="h-8 w-auto object-contain" />
                : <img src={ascendiaLogo} alt="Ascendr" className="h-8 w-auto object-contain" />
              }
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88, rotate: 90 }}
              transition={BTN_SPRING}
              className={`
                p-2 rounded transition-colors duration-[330ms]
                ${theme === 'dark' ? 'text-[#5C5E62] hover:bg-white/5' : 'text-[#5C5E62] hover:bg-[#F4F4F4]'}
              `}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* ── Navigation links ── */}
          <nav className="flex flex-col gap-0.5 flex-1">
            <MenuLink to={`/${lang}/competitions`} icon={<Layers size={18} />} label={t.myCompetitions} theme={theme} onClick={onClose} />

            {canAccessComp && (
              <>
                <div className={`h-px my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />
                <MenuLink to={`/${lang}`}               icon={<LayoutGrid size={18} />}    label={t.boulders}    theme={theme} onClick={onClose} />
                <MenuLink to={`/${lang}/leaderboard`}   icon={<Trophy size={18} />}        label={t.leaderboard} theme={theme} onClick={onClose} />
                <MenuLink to={`/${lang}/rules`}         icon={<BookOpen size={18} />}      label={t.rules}       theme={theme} onClick={onClose} />
                {!isOrganizer && !isJudge && (
                  <MenuLink to={`/${lang}/event-profile`} icon={<CalendarDays size={18} />} label={t.eventSettings} theme={theme} onClick={onClose} />
                )}
                {(isOrganizer || isJudge) && (
                  <>
                    <MenuLink to={`/${lang}/users`}     icon={<Users size={18} />}         label={t.users}     theme={theme} onClick={onClose} />
                    <MenuLink to={`/${lang}/analytics`} icon={<BarChart2 size={18} />}     label={t.analytics} theme={theme} onClick={onClose} />
                    <MenuLink to={`/${lang}/judging`}   icon={<ClipboardList size={18} />} label={t.judging}   theme={theme} onClick={onClose} />
                    {isOrganizer && (
                      <MenuLink to={`/${lang}/settings`} icon={<Settings size={18} />} label={t.settings} theme={theme} onClick={onClose} />
                    )}
                  </>
                )}
              </>
            )}
          </nav>

          {/* ── Footer: user info + logout ── */}
          <div className={`pt-5 border-t mt-5 ${theme === 'dark' ? 'border-white/10' : 'border-[#EEEEEE]'}`}>

            <motion.div whileHover={{ x: 2 }} transition={BTN_SPRING}>
              <Link
                to={`/${lang}/profile`}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded mb-2 transition-colors duration-[330ms]
                  ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#F4F4F4]'}
                `}
              >
                <UserAvatar
                  avatar={currentUser.avatar}
                  displayName={currentUser.displayName}
                  sizeClass="w-9 h-9"
                  className="rounded-full bg-[#7F8BAD]/10"
                  iconSize={18}
                />
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-[#5C5E62]">
                    {isOrganizer ? t.organizer : isJudge ? 'Judge' : t.competitor}
                    {' · BIB #'}{currentUser.bibNumber}
                  </p>
                </div>
              </Link>
            </motion.div>

            {competition && (
              <div className={`
                text-xs font-medium px-3 py-2 rounded mb-2
                ${theme === 'dark' ? 'bg-white/5 text-[#5C5E62]' : 'bg-[#F4F4F4] text-[#5C5E62]'}
              `}>
                {competition.name}
              </div>
            )}

            <motion.button
              onClick={() => { onLogout(); onClose() }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={BTN_SPRING}
              className="w-full py-2.5 rounded bg-red-400/10 text-red-400 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-400/20 transition-colors duration-[330ms]"
            >
              <LogOut size={15} />
              {t.logout}
            </motion.button>

          </div>
        </div>
      </motion.div>
    </>
  )
}
