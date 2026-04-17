import { useState, useMemo } from 'react'
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
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
  const [lang,  setLang]  = useState<Language>('en')
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
    // Always carry over billing fields from authoritative state — the SettingsPage
    // draft is initialized once on mount and may be stale if PaymentModal set these
    // fields after the draft was created.
    const merged: Competition = {
      ...updated,
      subscription:       (prev as any)?.subscription       ?? updated.subscription,
      additionalCapacity: (prev as any)?.additionalCapacity ?? (updated as any).additionalCapacity,
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
  function joinCompetition(compId: string, user: Competitor, traitIds?: string[]) {
    setCompetitorsMap(prev => {
      const list = prev[compId] ?? []
      // Remove any existing duplicates for this user (defensive dedup)
      const deduped = list.filter((c, idx) =>
        c.id !== user.id || idx === list.findIndex(x => x.id === user.id)
      )
      if (deduped.some(c => c.id === user.id)) {
        // Already registered — just update their traitIds if provided
        if (traitIds) {
          return { ...prev, [compId]: deduped.map(c => c.id === user.id ? { ...c, traitIds } : c) }
        }
        return prev
      }
      const nextBib = deduped.filter(c => c.bibNumber > 0).length > 0
        ? Math.max(...deduped.map(c => c.bibNumber)) + 1
        : 101
      return { ...prev, [compId]: [...deduped, { ...user, bibNumber: nextBib, traitIds: traitIds ?? user.traitIds ?? [] }] }
    })
    setActiveCompId(compId)
    showToast(t.welcomeBack)
  }

  // ── handleJoinByCode — used by CompetitionsPage and ProfilePage ───────────
  // The code is the invite code string.
  // password is optional; if the competition has joinPassword set and the
  // supplied password doesn't match, returns false so the UI can show an error.
  function handleJoinByCode(code: string, password?: string, traitIds?: string[]): boolean {
    const target = competitions.find(c => c.inviteCode === code.toUpperCase())
    if (!target || !currentUser) return false
    if (target.joinPassword && password !== target.joinPassword) return false
    joinCompetition(target.id, currentUser, traitIds)
    return true
  }

  // ── handleJoinByCompId — used by JoinPage (code already resolved to ID) ──
  function handleJoinByCompId(compId: string, password?: string, traitIds?: string[]): boolean {
    const target = competitions.find(c => c.id === compId)
    if (!target || !currentUser) return false
    if (target.joinPassword && password !== target.joinPassword) return false
    joinCompetition(compId, currentUser, traitIds)
    return true
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
        <Route path="/"                element={<LandingPage />} />
        <Route path="/auth"            element={<AuthPage onLogin={u => { setCurrentUser(u); navigate('/competitions', { replace: true }) }} theme={theme} />} />
        <Route path="/results/:compId" element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!activeCompetition) {
    return (
      <div style={{ minHeight: '100vh', background: '#171A20' }} className="flex items-center justify-center">
        <p className="text-slate-400">No competition found.</p>
      </div>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className={`min-h-screen ${theme === 'dark' ? 'text-[#EEEEEE]' : 'bg-white text-[#171A20]'}`} style={theme === 'dark' ? { background: '#171A20' } : {}}>

        <Toast message={toast.message} visible={toast.visible} theme={theme} />

        {/* Payment modal — shown when organizer tries to publish a draft competition */}
        {paymentComp && (
          <PaymentModal
            competition={paymentComp}
            competitorCount={competitorsMap[paymentComp.id]?.length ?? 0}
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
          theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}
          currentUser={currentUser} activeCompetition={activeCompetition}
          isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp}
          onOpenMenu={() => setIsMenuOpen(true)}
          onLogout={() => { setCurrentUser(null); navigate('/competitions', { replace: true }) }}
        />

        <MobileMenu
          isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
          theme={theme} lang={lang} currentUser={currentUser}
          competition={activeCompetition} isOrganizer={isOrganizer} isJudge={isJudge}
          canAccessComp={canAccessActiveComp}
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
                    onRemoveUser={handleRemoveUser}
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
                <SettingsPage competition={activeCompetition} theme={theme} lang={lang} onUpdate={updateCompetition} competitorCount={activeCompetitors.length} />
              </Guard>
            } />

            {/* Catch-all → /competitions is always safe for any logged-in user */}
            <Route path="*" element={<Navigate to="/competitions" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}