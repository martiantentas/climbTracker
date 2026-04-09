import { useState, useMemo } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import type { Competition, Boulder, Competitor, Completion } from './types'
import { CompetitionStatus, ScoringType } from './types'
import {
  MOCK_COMPETITION,
  MOCK_BOULDERS,
  MOCK_COMPETITORS,
  MOCK_COMPLETIONS,
  INITIAL_DIFFICULTIES,
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

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {

  // ── Global UI state ─────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [lang,  setLang]  = useState<Language>('en')
  const t = translations[lang]

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<Competitor | null>(null)

  // ── Competition state ────────────────────────────────────────────────────────
  const [competitions,   setCompetitions]   = useState<Competition[]>([MOCK_COMPETITION])
  const [activeCompId,   setActiveCompId]   = useState<string>(MOCK_COMPETITION.id)
  const [bouldersMap,    setBouldersMap]    = useState<Record<string, Boulder[]>>({ [MOCK_COMPETITION.id]: MOCK_BOULDERS })
  const [completionsMap, setCompletionsMap] = useState<Record<string, Completion[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPLETIONS })
  const [competitorsMap, setCompetitorsMap] = useState<Record<string, Competitor[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPETITORS })

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [toast,      setToast]      = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // ── Derived values ───────────────────────────────────────────────────────────
  const activeCompetition = useMemo(() =>
    competitions.find(c => c.id === activeCompId) ?? competitions[0],
    [competitions, activeCompId]
  )

  const activeBoulders    = bouldersMap[activeCompetition?.id]    ?? []
  const activeCompletions = completionsMap[activeCompetition?.id] ?? []
  const activeCompetitors = competitorsMap[activeCompetition?.id] ?? []

  const isOrganizer = useMemo(() =>
    currentUser?.id === activeCompetition?.ownerId ||
    currentUser?.role === 'organizer',
    [currentUser, activeCompetition]
  )

  const isJudgeOrOrganizer = useMemo(() =>
    isOrganizer || currentUser?.role === 'judge',
    [isOrganizer, currentUser]
  )

  const canAccessActiveComp = useMemo(() =>
    isOrganizer || (activeCompetition
      ? (competitorsMap[activeCompetition.id] ?? []).some(c => c.id === currentUser?.id)
      : false
    ),
    [isOrganizer, activeCompetition, competitorsMap, currentUser]
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
    competitorId: string,
    boulderId:    string,
    attempts:     number,
    forceStatus?: boolean,
  ) {
    if (!activeCompetition) return
    if (activeCompetition.isLocked) return
    if (activeCompetition.status === CompetitionStatus.FINISHED) return

    setCompletionsMap(prev => {
      const current  = prev[activeCompetition.id] ?? []
      const existing = current.find(
        c => c.competitorId === competitorId && c.boulderId === boulderId
      )
      let updated: Completion[]

      if (existing) {
        if (forceStatus === false) {
          updated = current.filter(
            c => !(c.competitorId === competitorId && c.boulderId === boulderId)
          )
        } else {
          updated = current.map(c =>
            c.competitorId === competitorId && c.boulderId === boulderId
              ? { ...c, attempts: Math.max(1, attempts) }
              : c
          )
        }
      } else {
        if (forceStatus === true) {
          updated = [
            ...current,
            {
              competitorId,
              boulderId,
              attempts:     Math.max(1, attempts),
              timestamp:    Date.now(),
              hasZone:      false,
              zoneAttempts: 0,
              zonesReached: 0,
              topValidated: true,
            },
          ]
        } else {
          updated = current
        }
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
    setCompetitions(prev => prev.map(c => c.id === updated.id ? updated : c))
    showToast(t.successSaved)
  }

  function handleCreateCompetition(name: string, location: string, description: string) {
    if (!currentUser) return
    const newId = `comp-${Date.now()}`
    const newComp: Competition = {
      id:                 newId,
      ownerId:            currentUser.id,
      name,
      location,
      description,
      startDate:          new Date().toISOString(),
      endDate:            new Date(Date.now() + 86400000).toISOString(),
      status:             CompetitionStatus.DRAFT,
      scoringType:        ScoringType.TRADITIONAL,
      categories:         [{ id: 'cat-1', name: 'Open' }],
      difficultyLevels:   INITIAL_DIFFICULTIES,
      isLocked:           false,
      canSelfScore:       true,
      inviteCode:         generateInviteCode(),
      penalizeAttempts:   false,
      penaltyType:        'fixed',
      penaltyValue:       0,
      minScorePerBoulder: 0,
      rules: {
        en: '### Rules\n1. Use your common sense.',
        es: '### Reglas\n1. Usa el sentido común.',
        ca: '### Regles\n1. Fes servir el seny.',
      },
      zoneScoring:        'adds_to_score',
      scoringMethod:      'self_scoring',
      attemptTracking:    'fixed_options',
      maxFixedAttempts:   4,
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
    if (activeCompId === compId) {
      setActiveCompId(competitions.find(c => c.id !== compId)?.id ?? '')
    }
  }

  function handleJoinCompetition(compId: string, user: Competitor) {
    setCompetitorsMap(prev => {
      const list = prev[compId] ?? []
      if (list.some(c => c.id === user.id)) return prev
      const nextBib = list.length > 0
        ? Math.max(...list.map(c => c.bibNumber)) + 1
        : 101
      return { ...prev, [compId]: [...list, { ...user, bibNumber: nextBib }] }
    })
    setActiveCompId(compId)
    showToast(t.welcomeBack)
  }

  function handleLeaveCompetition(compId: string) {
    if (!currentUser) return
    setCompetitorsMap(prev => ({
      ...prev,
      [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id),
    }))
  }

  function handleJoinByCode(code: string, user?: Competitor): boolean {
    const target = competitions.find(c => c.inviteCode === code.toUpperCase())
    const who    = user ?? currentUser
    if (!target || !who) return false
    handleJoinCompetition(target.id, who)
    return true
  }

  function isUserRegistered(compId: string): boolean {
    return (competitorsMap[compId] ?? []).some(c => c.id === currentUser?.id)
  }

  function handleUpdateRole(competitorId: string, role: 'competitor' | 'judge' | 'organizer') {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({
      ...prev,
      [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c =>
        c.id === competitorId ? { ...c, role } : c
      ),
    }))
    showToast(t.successSaved)
  }

  function handleRemoveUser(competitorId: string) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({
      ...prev,
      [activeCompetition.id]: (prev[activeCompetition.id] ?? []).filter(c =>
        c.id !== competitorId
      ),
    }))
    showToast(t.successSaved)
  }

  function handleUpdateBib(competitorId: string, bib: number) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({
      ...prev,
      [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c =>
        c.id === competitorId ? { ...c, bibNumber: bib } : c
      ),
    }))
    showToast(t.successSaved)
  }

  function handleLogScore(
    competitorId: string,
    boulderId:    string,
    attempts:     number,
    hasZone:      boolean,
    zoneAttempts: number,
    isTop:        boolean,
    judgeId:      string,
    zonesReached: number,
  ) {
    if (!activeCompetition) return
    if (activeCompetition.isLocked) return

    setCompletionsMap(prev => {
      const current  = prev[activeCompetition.id] ?? []
      const existing = current.find(
        c => c.competitorId === competitorId && c.boulderId === boulderId
      )

      const updated: Completion = {
        competitorId,
        boulderId,
        attempts,
        timestamp:       Date.now(),
        hasZone,
        zoneAttempts,
        zonesReached,
        zoneValidatedBy: judgeId,
        topValidated:    isTop,
        topValidatedBy:  isTop ? judgeId : undefined,
        topValidatedAt:  isTop ? Date.now() : undefined,
      }

      if (existing) {
        return {
          ...prev,
          [activeCompetition.id]: current.map(c =>
            c.competitorId === competitorId && c.boulderId === boulderId ? updated : c
          ),
        }
      }
      return {
        ...prev,
        [activeCompetition.id]: [...current, updated],
      }
    })
  }

  // ── Shared ProtectedRoute props ────────────────────────────────────────────
  // Avoids repeating all three props on every route.
  function Guard({
    required,
    children,
  }: {
    required: 'any' | 'judge_or_organizer' | 'organizer'
    children: React.ReactNode
  }) {
    return (
      <ProtectedRoute
        currentUser={currentUser}
        isOrganizer={isOrganizer}
        canAccessComp={canAccessActiveComp}
        required={required}
        onAccessDenied={showToast}
      >
        {children}
      </ProtectedRoute>
    )
  }

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <HashRouter>
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight">ClimbTracker</h1>
            <p className="text-slate-400">Auth screen coming soon</p>
            <button
              onClick={() => setCurrentUser(MOCK_COMPETITORS[1])}
              className="px-6 py-3 bg-sky-400 text-sky-950 rounded-2xl font-bold block mx-auto"
            >
              Log in as Alex (Competitor)
            </button>
            <button
              onClick={() => setCurrentUser(MOCK_COMPETITORS[0])}
              className="px-6 py-3 bg-purple-400 text-purple-950 rounded-2xl font-bold block mx-auto"
            >
              Log in as Admin (Organizer)
            </button>
          </div>
        </div>
      </HashRouter>
    )
  }

  if (!activeCompetition) {
    return (
      <HashRouter>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <p className="text-slate-400">No competition found.</p>
        </div>
      </HashRouter>
    )
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <HashRouter>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

        <Toast message={toast.message} visible={toast.visible} theme={theme} />

        <NavBar
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          currentUser={currentUser}
          activeCompetition={activeCompetition}
          isOrganizer={isOrganizer}
          onOpenMenu={() => setIsMenuOpen(true)}
          onLogout={() => setCurrentUser(null)}
        />

        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          theme={theme}
          lang={lang}
          currentUser={currentUser}
          competition={activeCompetition}
          isOrganizer={isOrganizer}
          onLogout={() => setCurrentUser(null)}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Routes>

            {/* ── Always accessible (logged-in users) ── */}
            <Route path="/competitions" element={
              <CompetitionsPage
                competitions={competitions}
                activeCompId={activeCompId}
                currentUser={currentUser}
                theme={theme}
                lang={lang}
                onEnter={setActiveCompId}
                onCreate={handleCreateCompetition}
                onDelete={handleDeleteCompetition}
                onLeave={handleLeaveCompetition}
                onJoinByCode={handleJoinByCode}
                isRegistered={isUserRegistered}
              />
            } />

            <Route path="/profile" element={
              <ProfilePage
                currentUser={currentUser}
                theme={theme}
                lang={lang}
                onJoinByCode={handleJoinByCode}
              />
            } />

            {/* ── Registered competitors + organizers ── */}
            <Route path="/" element={
              <Guard required="any">
                <BouldersPage
                  competition={activeCompetition}
                  boulders={activeBoulders}
                  completions={activeCompletions}
                  currentUser={currentUser}
                  isOrganizer={isOrganizer}
                  theme={theme}
                  lang={lang}
                  onToggle={handleToggleCompletion}
                  onUpdateBoulders={updateBoulders}
                />
              </Guard>
            } />

            <Route path="/leaderboard" element={
              <Guard required="any">
                <LeaderboardPage
                  rankings={rankings}
                  competition={activeCompetition}
                  theme={theme}
                  lang={lang}
                />
              </Guard>
            } />

            <Route path="/rules" element={
              <Guard required="any">
                <RulesPage
                  competition={activeCompetition}
                  isOrganizer={isOrganizer}
                  theme={theme}
                  lang={lang}
                  onUpdate={updateCompetition}
                />
              </Guard>
            } />

            {/* ── Judges + organizers ── */}
            <Route path="/judging" element={
              <Guard required="judge_or_organizer">
                <JudgingPage
                  competition={activeCompetition}
                  boulders={activeBoulders}
                  competitors={activeCompetitors}
                  completions={activeCompletions}
                  theme={theme}
                  lang={lang}
                  onLogScore={handleLogScore}
                  currentUser={currentUser}
                  showSuccess={showToast}
                />
              </Guard>
            } />

            {/* ── Organizers only ── */}
            <Route path="/users" element={
              <Guard required="organizer">
                <UsersPage
                  competitors={activeCompetitors}
                  competition={activeCompetition}
                  currentUser={currentUser}
                  theme={theme}
                  lang={lang}
                  onUpdateRole={handleUpdateRole}
                  onUpdateBib={handleUpdateBib}
                  onRemoveUser={handleRemoveUser}
                />
              </Guard>
            } />

            <Route path="/analytics" element={
              <Guard required="organizer">
                <AnalyticsPage
                  competition={activeCompetition}
                  boulders={activeBoulders}
                  competitors={activeCompetitors}
                  completions={activeCompletions}
                  theme={theme}
                  lang={lang}
                />
              </Guard>
            } />

            <Route path="/settings" element={
              <Guard required="organizer">
                <SettingsPage
                  competition={activeCompetition}
                  theme={theme}
                  lang={lang}
                  onUpdate={updateCompetition}
                />
              </Guard>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}