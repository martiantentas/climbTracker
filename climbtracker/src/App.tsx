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

// ─── PAGES (placeholders for now — we'll replace these one by one) ────────────

function BouldersPage()     { return <div className="p-8 text-white">Boulders page</div> }
function LeaderboardPage()  { return <div className="p-8 text-white">Leaderboard page</div> }
function RulesPage()        { return <div className="p-8 text-white">Rules page</div> }
function AnalyticsPage()    { return <div className="p-8 text-white">Analytics page</div> }
function SettingsPage()     { return <div className="p-8 text-white">Settings page</div> }
function JudgingPage()      { return <div className="p-8 text-white">Judging page</div> }
function ProfilePage()      { return <div className="p-8 text-white">Profile page</div> }
function CompetitionsPage() { return <div className="p-8 text-white">Competitions page</div> }

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

  // t is the active translation object — t.boulders, t.leaderboard, etc.
  const t = translations[lang]

  // ── Auth state ───────────────────────────────────────────────────────────────
  // null means nobody is logged in
  const [currentUser, setCurrentUser] = useState<Competitor | null>(null)

  // ── Competition state ────────────────────────────────────────────────────────
  const [competitions, setCompetitions] = useState<Competition[]>([MOCK_COMPETITION])
  const [activeCompId, setActiveCompId] = useState<string>(MOCK_COMPETITION.id)

  // These three maps store data per competition: { [compId]: Boulder[] } etc.
  // This lets the app hold boulders/completions/competitors for multiple comps at once
  const [bouldersMap,     setBouldersMap]     = useState<Record<string, Boulder[]>>({ [MOCK_COMPETITION.id]: MOCK_BOULDERS })
  const [completionsMap,  setCompletionsMap]  = useState<Record<string, Completion[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPLETIONS })
  const [competitorsMap,  setCompetitorsMap]  = useState<Record<string, Competitor[]>>({ [MOCK_COMPETITION.id]: MOCK_COMPETITORS })

  // ── Toast state ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '', visible: false,
  })

  // ── Derived values ───────────────────────────────────────────────────────────
  // useMemo means "only recalculate this when the listed dependencies change"
  // Without it, these would recalculate on every single render

  const activeCompetition = useMemo(() =>
    competitions.find(c => c.id === activeCompId) ?? competitions[0],
    [competitions, activeCompId]
  )

  const activeBoulders    = bouldersMap[activeCompetition?.id]    ?? []
  const activeCompletions = completionsMap[activeCompetition?.id] ?? []
  const activeCompetitors = competitorsMap[activeCompetition?.id] ?? []

  const isOrganizer = useMemo(() =>
    currentUser?.id === activeCompetition?.ownerId,
    [currentUser, activeCompetition]
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
          // Remove the completion entirely
          updated = current.filter(
            c => !(c.competitorId === competitorId && c.boulderId === boulderId)
          )
        } else {
          // Update the attempt count
          updated = current.map(c =>
            c.competitorId === competitorId && c.boulderId === boulderId
              ? { ...c, attempts: Math.max(1, attempts) }
              : c
          )
        }
      } else {
        if (forceStatus === true) {
          // Add a new completion
          updated = [
            ...current,
            { competitorId, boulderId, attempts: Math.max(1, attempts), timestamp: Date.now() },
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
      // Don't add the same person twice
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
    setCompletionsMap(prev => ({
      ...prev,
      [compId]: (prev[compId] ?? []).filter(c => c.competitorId !== currentUser.id),
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

  // ── Auth screen (shown when not logged in) ───────────────────────────────────

  if (!currentUser) {
    return (
      <HashRouter>
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black tracking-tight">ClimbTracker</h1>
            <p className="text-slate-400">Auth screen coming soon</p>
            {/* Temporary login button so we can test the app */}
            <button
              onClick={() => setCurrentUser(MOCK_COMPETITORS[1])}
              className="px-6 py-3 bg-sky-400 text-sky-950 rounded-2xl font-bold"
            >
              Log in as Alex (Competitor)
            </button>
            <br />
            <button
              onClick={() => setCurrentUser(MOCK_COMPETITORS[0])}
              className="px-6 py-3 bg-purple-400 text-purple-950 rounded-2xl font-bold"
            >
              Log in as Admin (Organizer)
            </button>
          </div>
        </div>
      </HashRouter>
    )
  }

  // ── Main app (shown when logged in) ─────────────────────────────────────────

  // Guard — if no active competition exists yet, show nothing
  if (!activeCompetition) {
    return (
      <HashRouter>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <p className="text-slate-400">No competition found.</p>
        </div>
      </HashRouter>
    )
  }

  return (
    <HashRouter>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

        <NavBar
            theme={theme}
            setTheme={setTheme}
            lang={lang}
            setLang={setLang}
            currentUser={currentUser}
            activeCompetition={activeCompetition}
            isOrganizer={isOrganizer}
            onOpenMenu={() => {}}
          />

        {/* Pages */}
        <Routes>
          <Route path="/"            element={<BouldersPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/rules"       element={<RulesPage />} />
          <Route path="/analytics"   element={<AnalyticsPage />} />
          <Route path="/settings"    element={<SettingsPage />} />
          <Route path="/judging"     element={<JudgingPage />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/competitions"element={<CompetitionsPage />} />
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>

      </div>
    </HashRouter>
  )
}