import { useState, useMemo, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import type { Competition, Boulder, Competitor, Completion } from './types'
import { CompetitionStatus, ScoringType } from './types'
import {
  MOCK_COMPETITION, MOCK_BOULDERS, MOCK_COMPETITORS,
  MOCK_COMPLETIONS, INITIAL_DIFFICULTIES,
} from './constants'
import { calculateRankings } from './utils/scoring'
import type { Language } from './translations'
import { translations } from './translations'
import NavBar from './components/NavBar'
import Toast from './components/Toast'
import MobileMenu from './components/MobileMenu'
import ProtectedRoute from './components/ProtectedRoute'
import BouldersPage from './pages/BouldersPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RulesPage from './pages/RulesPage'
import ProfilePage from './pages/ProfilePage'
import CompetitionsPage from './pages/CompetitionsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import JudgingPage from './pages/JudgingPage'
import AnalyticsPage from './pages/AnalyticsPage'
import JoinPage          from './pages/JoinPage'
import EventProfilePage  from './pages/EventProfilePage'
import LandingPage       from './pages/LandingPage'
import AuthPage, { updateAuthUser } from './pages/AuthPage'
import PaymentModal          from './components/PaymentModal'
import PostRegistrationModal from './components/PostRegistrationModal'
import PublicLeaderboardPage from './pages/PublicLeaderboardPage'
import LegalNoticePage       from './pages/LegalNoticePage'
import PrivacyPolicyPage     from './pages/PrivacyPolicyPage'
import TermsPage             from './pages/TermsPage'
import DemoPage              from './pages/DemoPage'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

export function getStatusColor(status: CompetitionStatus): string {
  switch (status) {
    case CompetitionStatus.DRAFT:    return '#94a3b8'
    case CompetitionStatus.LIVE:     return '#22c55e'
    case CompetitionStatus.FINISHED: return '#f97316'
    case CompetitionStatus.ARCHIVED: return '#f87171'
    default:                         return '#94a3b8'
  }
}

// ─── GUARD ────────────────────────────────────────────────────────────────────
// Defined at module level so React never remounts it between renders.
// If defined inside AppInner it would be a new component type on every render,
// causing all guarded pages to blank-flash or crash when they open.

interface GuardProps {
  required:        'any' | 'judge_or_organizer' | 'organizer'
  currentUser:     Competitor | null
  isOrganizer:     boolean
  canAccessComp:   boolean
  onAccessDenied:  (msg: string) => void
  children:        React.ReactNode
}

function Guard({ required, currentUser, isOrganizer, canAccessComp, onAccessDenied, children }: GuardProps) {
  return (
    <ProtectedRoute
      currentUser={currentUser}
      isOrganizer={isOrganizer}
      canAccessComp={canAccessComp}
      required={required}
      onAccessDenied={onAccessDenied}
    >
      {children}
    </ProtectedRoute>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}

function AppInner() {
  const navigate = useNavigate()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [lang,  setLang]  = useState<Language>(() => (localStorage.getItem('ct-lang') as Language) ?? 'en')

  function handleSetLang(l: Language) { setLang(l); localStorage.setItem('ct-lang', l) }
  const t = translations[lang]

  const [currentUser, setCurrentUser] = useState<Competitor | null>(null)

  const [competitions,   setCompetitions]   = useState<Competition[]>([MOCK_COMPETITION])
  const [activeCompId,   setActiveCompId]   = useState<string>(MOCK_COMPETITION.id)
  const [bouldersMap,    setBouldersMap]    = useState<Record<string, Boulder[]>>({ [MOCK_COMPETITION.id]: MOCK_BOULDERS })
  const [completionsMap, setCompletionsMap] = useState<Record<string, Completion[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPLETIONS })
  const [competitorsMap, setCompetitorsMap] = useState<Record<string, Competitor[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPETITORS })

  const [toast,        setToast]        = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const [isMenuOpen,   setIsMenuOpen]   = useState(false)
  const [paymentComp,    setPaymentComp]    = useState<Competition | null>(null)
  const [joinProfileComp, setJoinProfileComp] = useState<Competition | null>(null) // show profile modal after joining

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeCompetition = useMemo(() =>
    competitions.find(c => c.id === activeCompId) ?? competitions[0],
    [competitions, activeCompId]
  )

  const activeBoulders    = bouldersMap[activeCompetition?.id]    ?? []
  const activeCompletions = completionsMap[activeCompetition?.id] ?? []
  const activeCompetitors = competitorsMap[activeCompetition?.id] ?? []
  // Only actual competitors count toward capacity (judges and organizers are exempt)
  const activeCompetitorCount = activeCompetitors.filter(c => c.role !== 'judge' && c.role !== 'organizer').length

  const isOrganizer = useMemo(() => {
    // Owns this competition
    if (currentUser?.id === activeCompetition?.ownerId) return true
    // Per-competition role: user joined this comp as organizer
    const compEntry = (competitorsMap[activeCompetition?.id ?? ''] ?? []).find(c => c.id === currentUser?.id)
    return compEntry?.role === 'organizer'
  }, [currentUser, activeCompetition, competitorsMap])

  // Per-competition role for current user in the active competition
  const compRole = useMemo(() => {
    if (!currentUser || !activeCompetition) return null
    if (currentUser.id === activeCompetition.ownerId) return 'organizer'
    const entry = (competitorsMap[activeCompetition.id] ?? []).find(c => c.id === currentUser.id)
    return entry?.role ?? null
  }, [currentUser, activeCompetition, competitorsMap])

  const isJudge = compRole === 'judge'

  const canAccessActiveComp = useMemo(() =>
    isOrganizer || isJudge || (activeCompetition
      ? (competitorsMap[activeCompetition.id] ?? []).some(c => c.id === currentUser?.id)
      : false),
    [isOrganizer, isJudge, activeCompetition, competitorsMap, currentUser]
  )

  const rankings = useMemo(() =>
    activeCompetition
      ? calculateRankings(activeCompetition, activeBoulders, activeCompetitors, activeCompletions)
      : [],
    [activeCompetition, activeBoulders, activeCompetitors, activeCompletions]
  )

  // ── Premium branding — inject CSS overrides when active competition has branding ──
  useEffect(() => {
    const comp    = activeCompetition as any
    const b       = comp?.branding
    const isPrem  = comp?.tier === 'premium'

    // Always remove any previous injection
    document.getElementById('ct-brand-overrides')?.remove()

    // Reset CSS variables helper
    const resetVars = () => {
      const r = document.documentElement.style
      r.removeProperty('--brand-accent')
      r.removeProperty('--brand-accent-hover')
      r.removeProperty('--brand-bg-light')
      r.removeProperty('--brand-bg-dark')
    }

    const isRegistered = activeCompetitors.some(c => c.id === currentUser?.id)
    const isOwner      = activeCompetition?.ownerId === currentUser?.id

    if (!currentUser || !isPrem || !b || (!isRegistered && !isOwner)) {
      // No user logged in, not registered in this competition, or no premium branding — reset to defaults
      resetVars()
      return
    }

    const accent = b.accentColor ?? '#7F8BAD'
    const hover  = b.accentHover ?? darkenHex(accent, 18)

    // Update CSS variables (used by any element referencing var(--brand-*))
    const r = document.documentElement.style
    if (b.accentColor) { r.setProperty('--brand-accent', accent); r.setProperty('--brand-accent-hover', hover) }
    if (b.lightBg)     r.setProperty('--brand-bg-light', b.lightBg)
    if (b.darkBg)      r.setProperty('--brand-bg-dark',  b.darkBg)

    // Override Tailwind arbitrary-value classes for accent colour
    if (b.accentColor) {
      const style = document.createElement('style')
      style.id    = 'ct-brand-overrides'
      style.textContent = `
        .bg-\\[\\#7F8BAD\\]                   { background-color: ${accent} !important; }
        .hover\\:bg-\\[\\#7F8BAD\\]:hover     { background-color: ${accent} !important; }
        .bg-\\[\\#6D799B\\]                   { background-color: ${hover}  !important; }
        .hover\\:bg-\\[\\#6D799B\\]:hover     { background-color: ${hover}  !important; }
        .text-\\[\\#7F8BAD\\]                 { color: ${accent} !important; }
        .border-\\[\\#7F8BAD\\]               { border-color: ${accent} !important; }
        .bg-\\[\\#7F8BAD\\]\\/10              { background-color: color-mix(in srgb, ${accent} 10%, transparent) !important; }
        .bg-\\[\\#7F8BAD\\]\\/\\[0\\.06\\]    { background-color: color-mix(in srgb, ${accent}  6%, transparent) !important; }
        .bg-\\[\\#7F8BAD\\]\\/\\[0\\.03\\]    { background-color: color-mix(in srgb, ${accent}  3%, transparent) !important; }
        .focus\\:border-\\[\\#7F8BAD\\]\\/50:focus { border-color: color-mix(in srgb, ${accent} 50%, transparent) !important; }
      `
      document.head.appendChild(style)
    }

    return () => { document.getElementById('ct-brand-overrides')?.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompetition, currentUser, activeCompetitors])

  // ── Actions ──────────────────────────────────────────────────────────────────

  function showToast(message: string) {
    setToast({ message, visible: true })
    setTimeout(() => setToast({ message: '', visible: false }), 3000)
  }

  function handleToggleCompletion(
    competitorId: string, boulderId: string, attempts: number, forceStatus?: boolean,
  ) {
    if (!activeCompetition || activeCompetition.isLocked) return
    if (activeCompetition.status === CompetitionStatus.FINISHED) return
    setCompletionsMap(prev => {
      const current  = prev[activeCompetition.id] ?? []
      const existing = current.find(c => c.competitorId === competitorId && c.boulderId === boulderId)
      let updated: Completion[]
      if (existing) {
        if (forceStatus === false) {
          updated = current.filter(c => !(c.competitorId === competitorId && c.boulderId === boulderId))
        } else {
          updated = current.map(c => c.competitorId === competitorId && c.boulderId === boulderId ? { ...c, attempts: Math.max(1, attempts) } : c)
        }
      } else {
        updated = forceStatus === true
          ? [...current, { competitorId, boulderId, attempts: Math.max(1, attempts), timestamp: Date.now(), hasZone: false, zoneAttempts: 0, zonesReached: 0, topValidated: true }]
          : current
      }
      return { ...prev, [activeCompetition.id]: updated }
    })
  }

  function updateBoulders(newBoulders: Boulder[]) {
    if (!activeCompetition) return
    setBouldersMap(prev => ({ ...prev, [activeCompetition.id]: newBoulders }))
    showToast(t.successSaved)
  }

  function updateCompetition(updated: Competition) {
    const prev = competitions.find(c => c.id === updated.id)
    // Always carry over billing/tier/branding fields from the authoritative state.
    // SettingsPage's draft is initialized once on mount and will be stale for any
    // field set after mount by PaymentModal or BrandingSection (which both call
    // onUpdate directly, bypassing the draft).
    const p = prev as any
    const u = updated as any
    const merged: Competition = {
      ...updated,
      // These fields are set by PaymentModal/BrandingSection which call onUpdate
      // directly — the SettingsPage draft is initialized once and may be stale.
      // Use ?? so: if the incoming update explicitly sets a value (not null/undefined),
      // honour it (BrandingSection writes); otherwise keep what was in prev (draft save).
      subscription:       u.subscription       ?? p?.subscription,
      tier:               u.tier               ?? p?.tier,
      participantLimit:   u.participantLimit    ?? p?.participantLimit,
      additionalCapacity: u.additionalCapacity  ?? p?.additionalCapacity,
      branding:           u.branding            ?? p?.branding,
    } as any
    // Gate: Draft → LIVE requires a subscription (payment or promo)
    const goingLive      = prev?.status === 'DRAFT' && merged.status === 'LIVE'
    const hasSubscription = !!merged.subscription
    if (goingLive && !hasSubscription) {
      setPaymentComp(merged) // open payment modal instead
      return
    }
    setCompetitions(p => p.map(c => c.id === merged.id ? merged : c))
    showToast(t.successSaved)
  }

  function handleCreateCompetition(name: string, location: string, description: string) {
    if (!currentUser) return
    const newId = `comp-${Date.now()}`
    const newComp: Competition = {
      id: newId, ownerId: currentUser.id, name, location, description,
      startDate: new Date().toISOString(),
      endDate:   new Date(Date.now() + 86400000).toISOString(),
      status: CompetitionStatus.DRAFT, scoringType: ScoringType.TRADITIONAL,
      traits: [], requireTraits: false,
      difficultyLevels: INITIAL_DIFFICULTIES,
      isLocked: false, canSelfScore: true,
      inviteCode: generateInviteCode(),
      penalizeAttempts: false, penaltyType: 'fixed', penaltyValue: 0, minScorePerBoulder: 0,
      rules: { en: '### Rules\n1. Use your common sense.', es: '### Reglas\n1. Usa el sentido común.', ca: '### Regles\n1. Fes servir el seny.' },
      zoneScoring: 'adds_to_score', scoringMethod: 'self_scoring',
      visibility: 'private' as const,
      attemptTracking: 'fixed_options', maxFixedAttempts: 4,
    }
    setCompetitions(prev => [...prev, newComp])
    setBouldersMap(prev    => ({ ...prev, [newId]: [] }))
    setCompletionsMap(prev => ({ ...prev, [newId]: [] }))
    setCompetitorsMap(prev => ({ ...prev, [newId]: [] }))
    setActiveCompId(newId)
    showToast(t.successSaved)
  }

  function handleDeleteCompetition(compId: string) {
    setCompetitions(prev => prev.filter(c => c.id !== compId))
    setBouldersMap(prev    => { const n = { ...prev }; delete n[compId]; return n })
    setCompletionsMap(prev => { const n = { ...prev }; delete n[compId]; return n })
    setCompetitorsMap(prev => { const n = { ...prev }; delete n[compId]; return n })
    if (activeCompId === compId) setActiveCompId(competitions.find(c => c.id !== compId)?.id ?? '')
  }

  // ── Core join logic (shared) ──────────────────────────────────────────────
  function joinCompetition(compId: string, user: Competitor, traitIds?: string[], gender?: string): boolean {
    const comp = competitions.find(c => c.id === compId) as any
    // Block banned emails
    if ((comp?.bannedEmails ?? []).includes(user.email.toLowerCase())) return false
    // Enforce participant capacity limit (organisers and judges are exempt)
    if (comp?.participantLimit) {
      const currentList     = competitorsMap[compId] ?? []
      const competitorCount = currentList.filter(c => c.role === 'competitor' || !c.role).length
      const totalCapacity   = comp.participantLimit + (comp.additionalCapacity ?? 0)
      const isAlreadyIn     = currentList.some(c => c.id === user.id)
      if (!isAlreadyIn && user.role !== 'judge' && user.role !== 'organizer' && competitorCount >= totalCapacity) {
        return false
      }
    }
    setCompetitorsMap(prev => {
      const list = prev[compId] ?? []
      // Remove any existing duplicates for this user (defensive dedup)
      const deduped = list.filter((c, idx) =>
        c.id !== user.id || idx === list.findIndex(x => x.id === user.id)
      )
      if (deduped.some(c => c.id === user.id)) {
        // Already registered — update traits/gender if provided
        const updates: Partial<Competitor> = {}
        if (traitIds) updates.traitIds = traitIds
        if (gender)   (updates as any).gender = gender
        if (Object.keys(updates).length) {
          return { ...prev, [compId]: deduped.map(c => c.id === user.id ? { ...c, ...updates } : c) }
        }
        return prev
      }
      const nextBib = deduped.filter(c => c.bibNumber > 0).length > 0
        ? Math.max(...deduped.map(c => c.bibNumber)) + 1
        : 101
      const entry = { ...user, bibNumber: nextBib, traitIds: traitIds ?? user.traitIds ?? [] } as any
      if (gender) entry.gender = gender
      return { ...prev, [compId]: [...deduped, entry] }
    })
    setActiveCompId(compId)
    showToast(t.welcomeBack)
    return true
  }

  // ── handleJoinByCode — used by CompetitionsPage and ProfilePage ───────────
  // The code is the invite code string.
  // password is optional; if the competition has joinPassword set and the
  // supplied password doesn't match, returns false so the UI can show an error.
  function handleJoinByCode(code: string, password?: string, traitIds?: string[], gender?: string): boolean | 'full' {
    const target = competitions.find(c => c.inviteCode === code.toUpperCase())
    if (!target || !currentUser) return false
    if (target.joinPassword && password !== target.joinPassword) return false
    const ok = joinCompetition(target.id, currentUser, traitIds, gender)
    return ok ? true : 'full'
  }

  // ── handleJoinByCompId — used by JoinPage (code already resolved to ID) ──
  function handleJoinByCompId(compId: string, password?: string, traitIds?: string[], gender?: string): boolean | 'full' {
    const target = competitions.find(c => c.id === compId)
    if (!target || !currentUser) return false
    if (target.joinPassword && password !== target.joinPassword) return false
    const ok = joinCompetition(compId, currentUser, traitIds, gender)
    return ok ? true : 'full'
  }

  function handleLeaveCompetition(compId: string) {
    if (!currentUser) return
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
  }

  function isUserRegistered(compId: string): boolean {
    return (competitorsMap[compId] ?? []).some(c => c.id === currentUser?.id)
  }

  function handleUpdateRole(competitorId: string, role: 'competitor' | 'judge' | 'organizer') {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c => c.id === competitorId ? { ...c, role } : c) }))
    showToast(t.successSaved)
  }

  function handleRemoveUser(competitorId: string) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).filter(c => c.id !== competitorId) }))
    showToast(t.successSaved)
  }

  function handleUnbanUser(email: string) {
    if (!activeCompetition) return
    setCompetitions(prev => prev.map(comp =>
      comp.id === activeCompetition.id
        ? { ...comp, bannedEmails: (comp.bannedEmails ?? []).filter(e => e !== email.toLowerCase()) }
        : comp
    ))
    showToast(t.successSaved)
  }

  function handleBanUser(competitorId: string) {
    if (!activeCompetition) return
    const competitor = (competitorsMap[activeCompetition.id] ?? []).find(c => c.id === competitorId)
    if (!competitor) return
    // Remove from competitors list
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).filter(c => c.id !== competitorId) }))
    // Add email to bannedEmails
    setCompetitions(prev => prev.map(comp =>
      comp.id === activeCompetition.id
        ? { ...comp, bannedEmails: [...(comp.bannedEmails ?? []), competitor.email.toLowerCase()] }
        : comp
    ))
    showToast(t.successSaved)
  }

  function handleUpdateBib(competitorId: string, bib: number) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c => c.id === competitorId ? { ...c, bibNumber: bib } : c) }))
    showToast(t.successSaved)
  }

  function handleUpdateCompetitorTraits(competitorId: string, traitIds: string[]) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => {
      const list = prev[activeCompetition.id] ?? []
      // Deduplicate by id, keeping the first entry, then update traits
      const seen = new Set<string>()
      const deduped = list.filter(c => {
        if (seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      return {
        ...prev,
        [activeCompetition.id]: deduped.map(c =>
          c.id === competitorId ? { ...c, traitIds } : c
        ),
      }
    })
  }

  function handleLogScore(
    competitorId: string, boulderId: string, attempts: number,
    hasZone: boolean, zoneAttempts: number, isTop: boolean,
    judgeId: string, zonesReached: number,
  ) {
    if (!activeCompetition || activeCompetition.isLocked) return
    setCompletionsMap(prev => {
      const current  = prev[activeCompetition.id] ?? []
      const existing = current.find(c => c.competitorId === competitorId && c.boulderId === boulderId)
      const entry: Completion = {
        competitorId, boulderId, attempts, timestamp: Date.now(),
        hasZone, zoneAttempts, zonesReached,
        zoneValidatedBy: judgeId,
        topValidated: isTop,
        topValidatedBy: isTop ? judgeId : undefined,
        topValidatedAt: isTop ? Date.now() : undefined,
      }
      return {
        ...prev,
        [activeCompetition.id]: existing
          ? current.map(c => c.competitorId === competitorId && c.boulderId === boulderId ? entry : c)
          : [...current, entry],
      }
    })
  }

  // ── Unauthenticated shell: Landing + Auth ─────────────────────────────────
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/"                element={<LandingPage lang={lang} setLang={handleSetLang} />} />
        <Route path="/auth"            element={<AuthPage onLogin={u => { setCurrentUser(u); navigate('/competitions', { replace: true }) }} theme={theme} lang={lang} setLang={handleSetLang} />} />
        <Route path="/results/:compId" element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />
        <Route path="/legal"           element={<LegalNoticePage />} />
        <Route path="/privacy"         element={<PrivacyPolicyPage />} />
        <Route path="/terms"           element={<TermsPage />} />
        <Route path="/demo"            element={<DemoPage lang={lang} />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!activeCompetition) {
    return (
      <div style={{ minHeight: '100vh', background: '#121212' }} className="flex items-center justify-center">
        <p className="text-slate-400">No competition found.</p>
      </div>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`min-h-screen ${theme === 'dark' ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}
        style={{
          background: (() => {
            const comp = activeCompetition as any
            const b = comp?.branding
            const isPrem = comp?.tier === 'premium'
            const isReg = activeCompetitors.some(c => c.id === currentUser?.id)
            const isOwn = comp?.ownerId === currentUser?.id
            if (isPrem && b && (isReg || isOwn)) return theme === 'dark' ? (b.darkBg ?? '#121212') : (b.lightBg ?? '#FFFFFF')
            return theme === 'dark' ? '#121212' : '#FFFFFF'
          })(),
        }}
      >

        <Toast message={toast.message} visible={toast.visible} theme={theme} />

        {/* Payment modal — shown when organizer tries to publish a draft competition */}
        {paymentComp && (
          <PaymentModal
            competition={paymentComp}
            competitorCount={(competitorsMap[paymentComp.id] ?? []).filter(c => c.role !== 'judge' && c.role !== 'organizer').length}
            theme={theme}
            onClose={() => setPaymentComp(null)}
            onSuccess={published => {
              setCompetitions(p => p.map(c => c.id === published.id ? published : c))
              setPaymentComp(null)
              showToast('🎉 Competition is now Live!')
            }}
          />
        )}

        {/* Profile modal — shown after a competitor joins a competition */}
        {joinProfileComp && currentUser && (
          <PostRegistrationModal
            user={activeCompetitors.find(c => c.id === currentUser.id) ?? currentUser}
            competition={joinProfileComp}
            theme={theme}
            onComplete={updated => {
              // Persist gender + traits into competitorsMap
              handleUpdateCompetitorTraits(updated.id, (updated as any).traitIds ?? [])
              setCurrentUser({ ...currentUser, gender: updated.gender } as any)
              setJoinProfileComp(null)
              navigate('/event-profile')
            }}
          />
        )}

        <NavBar
          theme={theme} setTheme={setTheme} lang={lang} setLang={handleSetLang}
          currentUser={currentUser} activeCompetition={activeCompetition}
          isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp}
          branding={(() => {
              const comp = activeCompetition as any
              if (comp?.tier !== 'premium' || !comp?.branding) return undefined
              const isReg = activeCompetitors.some(c => c.id === currentUser?.id)
              const isOwn = comp?.ownerId === currentUser?.id
              return (isReg || isOwn) ? comp.branding : undefined
            })()}
          onOpenMenu={() => setIsMenuOpen(true)}
          onLogout={() => { setCurrentUser(null); navigate('/competitions', { replace: true }) }}
        />

        <MobileMenu
          isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
          theme={theme} lang={lang} currentUser={currentUser}
          competition={activeCompetition} isOrganizer={isOrganizer} isJudge={isJudge}
          canAccessComp={canAccessActiveComp}
          branding={(() => {
              const comp = activeCompetition as any
              if (comp?.tier !== 'premium' || !comp?.branding) return undefined
              const isReg = activeCompetitors.some(c => c.id === currentUser?.id)
              const isOwn = comp?.ownerId === currentUser?.id
              return (isReg || isOwn) ? comp.branding : undefined
            })()}
          onLogout={() => { setCurrentUser(null); navigate('/competitions', { replace: true }) }}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Routes>

            {/* ── Join page — no role guard needed, just needs to be logged in ── */}
            {/* Redirect /auth to app if already logged in */}
            <Route path="/auth" element={<Navigate to="/competitions" replace />} />

            {/* ── Public join route ── */}
            <Route path="/join/:code" element={
              <JoinPage
                competitions={competitions}
                currentUser={currentUser}
                theme={theme}
                lang={lang}
                isRegistered={isUserRegistered}
                onJoin={handleJoinByCompId}
              />
            } />

            {/* ── Always accessible ── */}
            <Route path="/competitions" element={
              <CompetitionsPage
                competitions={competitions} activeCompId={activeCompId}
                currentUser={currentUser} theme={theme} lang={lang}
                onEnter={setActiveCompId} onCreate={handleCreateCompetition}
                onDelete={handleDeleteCompetition} onLeave={handleLeaveCompetition}
                onJoinByCode={handleJoinByCode} isRegistered={isUserRegistered}
                getCompRole={(compId) => {
                  if (!currentUser) return null
                  const entry = (competitorsMap[compId] ?? []).find(c => c.id === currentUser.id)
                  return entry?.role ?? null
                }}
                onManage={(compId) => { setActiveCompId(compId); setTimeout(() => navigate('/settings'), 0) }}
                onJoinSuccess={(comp) => {
                  // Show profile modal after joining any competition
                  setJoinProfileComp(comp)
                }}
              />
            } />

            <Route path="/profile" element={
              <ProfilePage
                currentUser={currentUser} theme={theme} lang={lang}
                onJoinByCode={handleJoinByCode}
                onSave={updated => {
                  updateAuthUser(updated, currentUser.email)
                  setCurrentUser(updated)
                  // Sync profile changes (avatar, displayName, email) into every
                  // competition the user is registered in, so standings etc. stay fresh
                  setCompetitorsMap(prev => {
                    const next = { ...prev }
                    for (const compId of Object.keys(next)) {
                      next[compId] = next[compId].map(c =>
                        c.id === updated.id
                          ? { ...c, displayName: updated.displayName, email: updated.email, avatar: updated.avatar }
                          : c
                      )
                    }
                    return next
                  })
                }}
              />
            } />

            {/* ── Event profile — not shown to organizers or judges of this comp ── */}
            <Route path="/event-profile" element={
              (isOrganizer || isJudge)
                ? <Navigate to="/competitions" replace />
                : <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} canAccessComp={canAccessActiveComp} onAccessDenied={showToast}>
                    <EventProfilePage
                      competition={activeCompetition}
                      boulders={activeBoulders}
                      completions={activeCompletions}
                      currentUser={(() => {
                        // Use the live competitor record (deduped, with latest traitIds)
                        // rather than the auth user snapshot which may be stale
                        const live = activeCompetitors.find(c => c.id === currentUser.id)
                        return live ?? currentUser
                      })()}
                      rankings={rankings}
                      theme={theme}
                      lang={lang}
                      onUpdateTraits={handleUpdateCompetitorTraits}
                    />
                  </Guard>
            } />

            {/* ── Boulders — organizers always, judges read-only, competitors if registered ── */}
            <Route path="/" element={
              (isOrganizer || isJudge || canAccessActiveComp)
                ? <BouldersPage
                    competition={activeCompetition} boulders={activeBoulders}
                    completions={activeCompletions} currentUser={currentUser}
                    isOrganizer={isOrganizer}
                    theme={theme} lang={lang}
                    canSelfScore={!isJudge && activeCompetition.canSelfScore}
                    onToggle={handleToggleCompletion} onUpdateBoulders={updateBoulders}
                  />
                : <Navigate to="/competitions" replace />
            } />

            <Route path="/leaderboard" element={
              <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} canAccessComp={canAccessActiveComp} onAccessDenied={showToast}>
                <LeaderboardPage rankings={rankings} competitors={activeCompetitors} competition={activeCompetition} theme={theme} lang={lang} isOrganizer={isOrganizer} />
              </Guard>
            } />

            {/* Public results — accessible by logged-in users too */}
            <Route path="/results/:compId" element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />

            <Route path="/rules" element={
              <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} canAccessComp={canAccessActiveComp} onAccessDenied={showToast}>
                <RulesPage competition={activeCompetition} isOrganizer={isOrganizer} theme={theme} lang={lang} onUpdate={updateCompetition} />
              </Guard>
            } />

            {/* ── Judges + organizers ── */}
            <Route path="/judging" element={
              (isOrganizer || isJudge)
                ? <JudgingPage
                    competition={activeCompetition} boulders={activeBoulders}
                    competitors={activeCompetitors} completions={activeCompletions}
                    theme={theme} lang={lang} onLogScore={handleLogScore}
                    currentUser={currentUser} showSuccess={showToast}
                  />
                : <Navigate to="/competitions" replace />
            } />

            {/* ── Organizers only ── */}
            <Route path="/users" element={
              (isOrganizer || isJudge)
                ? <UsersPage
                    competitors={activeCompetitors} competition={activeCompetition}
                    currentUser={currentUser} theme={theme} lang={lang}
                    viewOnly={isJudge}
                    onUpdateRole={handleUpdateRole} onUpdateBib={handleUpdateBib}
                    onRemoveUser={handleRemoveUser} onBanUser={handleBanUser} onUnbanUser={handleUnbanUser}
                  />
                : <Navigate to="/competitions" replace />
            } />

            <Route path="/analytics" element={
              (isOrganizer || isJudge)
                ? <AnalyticsPage
                    competition={activeCompetition} boulders={activeBoulders}
                    competitors={activeCompetitors} completions={activeCompletions}
                    theme={theme} lang={lang}
                  />
                : <Navigate to="/competitions" replace />
            } />

            <Route path="/settings" element={
              <Guard required="organizer" currentUser={currentUser} isOrganizer={isOrganizer} canAccessComp={canAccessActiveComp} onAccessDenied={showToast}>
                <SettingsPage competition={activeCompetition} theme={theme} lang={lang} onUpdate={updateCompetition} competitorCount={activeCompetitorCount} />
              </Guard>
            } />

            {/* Policy pages — accessible while logged in too */}
            <Route path="/legal"   element={<LegalNoticePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms"   element={<TermsPage />} />
            <Route path="/demo"    element={<DemoPage lang={lang} />} />

            {/* Catch-all → /competitions is always safe for any logged-in user */}
            <Route path="*" element={<Navigate to="/competitions" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}