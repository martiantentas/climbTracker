import { useState, useMemo, useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getProfile, upsertProfile, supabaseUserToCompetitor, signOutUser } from './lib/auth'
import {
  loadAllUserData, upsertCompetition, deleteCompetition,
  upsertBoulders, upsertCompletion, deleteCompletion,
  upsertMember, deleteMember, fetchMembers, fetchBoulders, fetchCompletions,
  fetchCompetitionByInviteCode,
} from './lib/db'

import type { Competition, Boulder, Competitor, Completion, Badge } from './types'
import { CompetitionStatus, ScoringType } from './types'
import { INITIAL_DIFFICULTIES } from './constants'
import { calculateRankings } from './utils/scoring'
import type { Language } from './translations'
import { translations } from './translations'
import NavBar from './components/NavBar'
import Toast from './components/Toast'
import UndoToast from './components/UndoToast'
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
import AuthPage from './pages/AuthPage'
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
  isJudge:         boolean
  canAccessComp:   boolean
  onAccessDenied:  (msg: string) => void
  children:        React.ReactNode
  lang:            string
}

function Guard({ required, currentUser, isOrganizer, isJudge, canAccessComp, onAccessDenied, children, lang }: GuardProps) {
  return (
    <ProtectedRoute
      currentUser={currentUser}
      isOrganizer={isOrganizer}
      isJudge={isJudge}
      canAccessComp={canAccessComp}
      required={required}
      onAccessDenied={onAccessDenied}
      lang={lang}
    >
      {children}
    </ProtectedRoute>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────

// Captures the invite code, stores it, then sends the guest to auth.
// Defined at module level so it's never remounted inside renders.
function GuestJoinRedirect({ lang }: { lang: Language }) {
  const { code } = useParams<{ code: string }>()
  if (code) localStorage.setItem('ct-pending-join', code.toUpperCase())
  return <Navigate to={`/${lang}/auth`} replace />
}

// ─── LANG ROUTING ─────────────────────────────────────────────────────────────

const VALID_LANGS: Language[] = ['en', 'es', 'ca']

function RootRedirect() {
  const stored = localStorage.getItem('ct-lang')
  const lang: Language = VALID_LANGS.includes(stored as Language) ? stored as Language : 'ca'
  return <Navigate to={`/${lang}`} replace />
}

function PathPreservingRedirect() {
  const location = useLocation()
  const stored = localStorage.getItem('ct-lang')
  const lang: Language = VALID_LANGS.includes(stored as Language) ? stored as Language : 'ca'
  return <Navigate to={`/${lang}${location.pathname}${location.search}`} replace />
}

function LangRouter() {
  const { lang } = useParams<{ lang: string }>()
  if (!VALID_LANGS.includes(lang as Language)) return <Navigate to="/ca" replace />
  return <AppInner />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:lang/*" element={<LangRouter />} />
        <Route path="*" element={<PathPreservingRedirect />} />
      </Routes>
    </HashRouter>
  )
}

function AppInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang: urlLang = 'ca' } = useParams<{ lang: string }>()
  const lang: Language = VALID_LANGS.includes(urlLang as Language) ? urlLang as Language : 'ca'

  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Keep localStorage and <html lang> in sync
  useEffect(() => {
    localStorage.setItem('ct-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  // Navigate helper — always prepends the active lang prefix
  const goto = (path: string, opts?: { replace?: boolean }) =>
    navigate(`/${lang}${path}`, opts)

  function handleSetLang(l: Language) {
    // Preserve current sub-path when switching language
    const subPath = location.pathname.replace(/^\/[a-z]{2}/, '') || '/'
    navigate(`/${l}${subPath}${location.search}`, { replace: true })
  }

  const t = translations[lang]

  const [currentUser,  setCurrentUser]  = useState<Competitor | null>(null)
  const [authLoading,  setAuthLoading]  = useState(true)

  // Raw Supabase user — set synchronously in onAuthStateChange so we never
  // make API calls inside the navigator lock that Supabase holds during the callback.
  const [authUser, setAuthUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)

  // Tracks the user ID we last triggered a data-load for. Used to skip redundant
  // SIGNED_IN events fired for the same user (tab focus, post-OAuth double-fires, etc.)
  // Without this, setDataLoading(true) would be called again but authUser?.id wouldn't
  // change, so the second useEffect wouldn't re-run → dataLoading stuck true forever.
  const authUserIdRef = useRef<string | null>(null)

  const [competitions,   setCompetitions]   = useState<Competition[]>([])
  const [activeCompId,   setActiveCompId]   = useState<string>(() => {
    try { return localStorage.getItem('ct-active-comp') ?? '' } catch { return '' }
  })
  const [bouldersMap,    setBouldersMap]    = useState<Record<string, Boulder[]>>({})
  const [completionsMap, setCompletionsMap] = useState<Record<string, Completion[]>>({})
  const [competitorsMap, setCompetitorsMap] = useState<Record<string, Competitor[]>>({})
  const [waitlistMap,    setWaitlistMap]    = useState<Record<string, Competitor[]>>({})
  const [dataLoading,    setDataLoading]    = useState(false)

  // ── Supabase auth subscription ────────────────────────────────────────────
  // IMPORTANT: the callback must be SYNCHRONOUS. Supabase holds a navigator lock
  // while calling this callback; any awaited Supabase API call inside it will try
  // to re-acquire the same lock → NavigatorLockAcquireTimeoutError deadlock.
  // We only store the raw auth user here; all API work happens in the effect below.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // After the OAuth callback, strip the code/state params so the URL stays clean.
        if (window.location.search) {
          const p = new URLSearchParams(window.location.search)
          if (p.has('code') || p.has('error')) {
            const clean = new URL(window.location.href)
            ;['code', 'state', 'error', 'error_code', 'error_description'].forEach(k => clean.searchParams.delete(k))
            window.history.replaceState({}, '', clean.toString())
          }
        }

        // TOKEN_REFRESHED: JWT rotated in the background — no user/data change.
        if (_event === 'TOKEN_REFRESHED') return

        if (session?.user) {
          // Same user re-authenticated (tab focus, post-OAuth double-fire, etc.) — skip.
          // If we set dataLoading(true) here, the second effect won't re-run (authUser?.id
          // is unchanged) and dataLoading would be stuck true forever → infinite spinner.
          if (session.user.id === authUserIdRef.current) return
          authUserIdRef.current = session.user.id
          setDataLoading(true)   // show spinner before the data effect fires
          setAuthUser(session.user)
        } else {
          authUserIdRef.current = null
          setAuthUser(null)
          setCurrentUser(null)
          setCompetitions([])
          setBouldersMap({})
          setCompletionsMap({})
          setCompetitorsMap({})
          setWaitlistMap({})
          setDataLoading(false)
          setAuthLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Data loading — runs after the auth lock is released ───────────────────
  // Triggered by authUser changing (sign-in / sign-out). Runs outside the
  // navigator lock so Supabase API calls work without deadlocking.
  useEffect(() => {
    if (!authUser) return
    let cancelled = false

    Promise.allSettled([
      getProfile(authUser.id),
      loadAllUserData(authUser.id),
    ]).then(([profileResult, dataResult]) => {
      if (cancelled) return
      const profile  = profileResult.status === 'fulfilled' ? profileResult.value  : null
      const userData = dataResult.status    === 'fulfilled' ? dataResult.value      : null
      if (dataResult.status === 'rejected') {
        console.error('[auth] loadAllUserData failed:', dataResult.reason)
      }
      setCurrentUser(supabaseUserToCompetitor(authUser, profile))
      if (userData) {
        setCompetitions(userData.comps)
        setBouldersMap(userData.boulders)
        setCompletionsMap(userData.completions)
        setCompetitorsMap(userData.members)
        setWaitlistMap(userData.waitlists)
        setActiveCompId(prev =>
          prev && userData.comps.some(c => c.id === prev) ? prev : userData.comps[0]?.id ?? ''
        )
      }
      setDataLoading(false)
      setAuthLoading(false)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id])

  // Persist active competition selection as a UI preference
  useEffect(() => {
    if (activeCompId) localStorage.setItem('ct-active-comp', activeCompId)
  }, [activeCompId])

  // ── Real-time subscription — all tables for the active competition ────────
  // One channel, four listeners. Patches local state in place so every connected
  // client (competitor, judge, organizer) sees updates without a full reload.
  useEffect(() => {
    if (!activeCompId || !currentUser) return

    const channel = supabase
      .channel(`comp:${activeCompId}`)

      // ── completions ────────────────────────────────────────────────────────
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const completion = payload.new.data as unknown as Completion
          if (!completion) return
          setCompletionsMap(prev => {
            const cur = prev[activeCompId] ?? []
            const idx = cur.findIndex(c => c.competitorId === completion.competitorId && c.boulderId === completion.boulderId)
            return { ...prev, [activeCompId]: idx >= 0 ? cur.map((c, i) => i === idx ? completion : c) : [...cur, completion] }
          })
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { competitor_id: string; boulder_id: string }
          setCompletionsMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => !(c.competitorId === old.competitor_id && c.boulderId === old.boulder_id)) }))
        }
      })

      // ── boulders ───────────────────────────────────────────────────────────
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boulders', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const boulder = payload.new.data as unknown as Boulder
          if (!boulder) return
          setBouldersMap(prev => {
            const cur = prev[activeCompId] ?? []
            const idx = cur.findIndex(b => b.id === boulder.id)
            return { ...prev, [activeCompId]: idx >= 0 ? cur.map((b, i) => i === idx ? boulder : b) : [...cur, boulder] }
          })
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { id: string }
          setBouldersMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(b => b.id !== old.id) }))
        }
      })

      // ── competition (settings / status changes) ────────────────────────────
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'competitions', filter: `id=eq.${activeCompId}` }, (payload) => {
        const updated = payload.new.data as unknown as Competition
        if (!updated) return
        setCompetitions(prev => prev.map(c => c.id === activeCompId ? updated : c))
      })

      // ── competition_members ────────────────────────────────────────────────
      // INSERT needs profile data not present in the row, so we refetch all members.
      // UPDATE and DELETE have enough info to patch in place.
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, () => {
        fetchMembers(activeCompId).then(members => setCompetitorsMap(prev => ({ ...prev, [activeCompId]: members }))).catch(console.error)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        const row = payload.new as { user_id: string; role: string; status: string; bib_number: number | null; trait_ids: string[]; gender: string | null }
        setCompetitorsMap(prev => ({
          ...prev,
          [activeCompId]: (prev[activeCompId] ?? []).map(c => c.id === row.user_id ? { ...c, role: row.role as Competitor['role'], bibNumber: row.bib_number ?? c.bibNumber, traitIds: row.trait_ids ?? c.traitIds } : c),
        }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        const old = payload.old as { user_id: string }
        setCompetitorsMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => c.id !== old.user_id) }))
      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompId, currentUser?.id])

  // ── User-level & public competitions subscription ─────────────────────────
  // Two listeners on one channel:
  // 1. competition_members INSERT for this user — fires when an organizer adds
  //    them directly or they join on another device. Hydrates the full comp data.
  // 2. competitions INSERT with visibility=public — fires when any public
  //    competition is created so all users see it appear immediately.
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel(`user-memberships:${currentUser.id}`)

      // ── Added to any competition ───────────────────────────────────────────
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'competition_members',
        filter: `user_id=eq.${currentUser.id}`,
      }, async (payload) => {
        const row    = payload.new as { competition_id: string }
        const compId = row.competition_id

        const { data, error } = await supabase
          .from('competitions')
          .select('data')
          .eq('id', compId)
          .maybeSingle()
        if (error || !data) return

        const comp = data.data as unknown as Competition
        const [boulders, completions, members] = await Promise.all([
          fetchBoulders(compId),
          fetchCompletions(compId),
          fetchMembers(compId),
        ])

        setCompetitions(prev => prev.some(c => c.id === compId) ? prev : [...prev, comp])
        setBouldersMap(prev    => ({ ...prev, [compId]: boulders }))
        setCompletionsMap(prev => ({ ...prev, [compId]: completions }))
        setCompetitorsMap(prev => ({ ...prev, [compId]: members }))
      })

      // ── New public competition created ─────────────────────────────────────
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'competitions',
        filter: `visibility=eq.public`,
      }, async (payload) => {
        const comp = payload.new.data as unknown as Competition
        if (!comp) return
        // Skip competitions we already own (already in state from handleCreateCompetition)
        if (comp.ownerId === currentUser.id) return
        const compId = comp.id
        const [boulders, completions, members] = await Promise.all([
          fetchBoulders(compId),
          fetchCompletions(compId),
          fetchMembers(compId),
        ])
        setCompetitions(prev => prev.some(c => c.id === compId) ? prev : [...prev, comp])
        setBouldersMap(prev    => ({ ...prev, [compId]: boulders }))
        setCompletionsMap(prev => ({ ...prev, [compId]: completions }))
        setCompetitorsMap(prev => ({ ...prev, [compId]: members }))
      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  // After login commits to state, redirect to any pending invite join.
  // Must be a useEffect (not inline in the login callback) because navigate()
  // fires before React flushes the setCurrentUser state update, so the
  // unauthenticated shell is still rendering and its wildcard catches the URL.
  useEffect(() => {
    if (!currentUser) return
    const pendingCode = localStorage.getItem('ct-pending-join')
    if (!pendingCode) return
    localStorage.removeItem('ct-pending-join')
    goto(`/join/${pendingCode}`, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  const [toast,             setToast]             = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const [isMenuOpen,        setIsMenuOpen]        = useState(false)
  const [paymentComp,       setPaymentComp]       = useState<Competition | null>(null)
  const [joinProfileComp,   setJoinProfileComp]   = useState<Competition | null>(null)
  const [pendingRemoveUser, setPendingRemoveUser] = useState<Competitor | null>(null)
  const [pendingBanUser,    setPendingBanUser]    = useState<Competitor | null>(null)

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

  // ── Badge computation — runs across all FINISHED/ARCHIVED competitions ────
  const badgesByCompetitor = useMemo(() => {
    const map = new Map<string, Badge[]>()

    function awardTop3(rows: ReturnType<typeof calculateRankings>, category: string, compId: string, compName: string, endDate: string) {
      rows.slice(0, 3).forEach((r, idx) => {
        const placement = (idx + 1) as 1 | 2 | 3
        const badge: Badge = {
          id:              `${compId}-${category}-${placement}`,
          competitionId:   compId,
          competitionName: compName,
          placement,
          category,
          awardedAt:       new Date(endDate).getTime(),
        }
        const existing = map.get(r.competitorId) ?? []
        if (!existing.some(b => b.id === badge.id)) {
          map.set(r.competitorId, [...existing, badge])
        }
      })
    }

    for (const comp of competitions) {
      if (comp.status !== CompetitionStatus.FINISHED && comp.status !== CompetitionStatus.ARCHIVED) continue
      const boulders    = bouldersMap[comp.id]    ?? []
      const rivals      = competitorsMap[comp.id] ?? []
      const compls      = completionsMap[comp.id] ?? []
      const rows        = calculateRankings(comp, boulders, rivals, compls)
      if (rows.length === 0) continue

      // Overall
      awardTop3(rows, 'general', comp.id, comp.name, comp.endDate)

      // Per trait/category
      for (const trait of comp.traits ?? []) {
        const filtered = rows.filter(r => rivals.find(c => c.id === r.competitorId)?.traitIds?.includes(trait.id))
        if (filtered.length > 0) awardTop3(filtered, trait.name, comp.id, comp.name, comp.endDate)
      }

      // Per gender
      const genders = [...new Set(rivals.map(c => (c as any).gender).filter(Boolean))] as string[]
      for (const gender of genders) {
        const filtered = rows.filter(r => (rivals.find(c => c.id === r.competitorId) as any)?.gender === gender)
        if (filtered.length > 0) awardTop3(filtered, gender, comp.id, comp.name, comp.endDate)
      }
    }

    return map
  }, [competitions, bouldersMap, competitorsMap, completionsMap])

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

    const compId  = activeCompetition.id
    const current = completionsMap[compId] ?? []
    const existing = current.find(c => c.competitorId === competitorId && c.boulderId === boulderId)

    setCompletionsMap(prev => {
      const cur = prev[compId] ?? []
      const ex  = cur.find(c => c.competitorId === competitorId && c.boulderId === boulderId)
      let updated: Completion[]
      if (ex) {
        if (forceStatus === false) {
          updated = cur.filter(c => !(c.competitorId === competitorId && c.boulderId === boulderId))
        } else {
          updated = cur.map(c => c.competitorId === competitorId && c.boulderId === boulderId ? { ...c, attempts: Math.max(1, attempts) } : c)
        }
      } else {
        updated = forceStatus === true
          ? [...cur, { competitorId, boulderId, attempts: Math.max(1, attempts), timestamp: Date.now(), hasZone: false, zoneAttempts: 0, zonesReached: 0, topValidated: true }]
          : cur
      }
      return { ...prev, [compId]: updated }
    })

    // Persist to Supabase
    if (existing) {
      if (forceStatus === false) {
        deleteCompletion(compId, competitorId, boulderId).catch(err => console.error('[db] deleteCompletion:', err))
      } else {
        upsertCompletion(compId, { ...existing, attempts: Math.max(1, attempts) }).catch(err => console.error('[db] upsertCompletion:', err))
      }
    } else if (forceStatus === true) {
      const entry: Completion = { competitorId, boulderId, attempts: Math.max(1, attempts), timestamp: Date.now(), hasZone: false, zoneAttempts: 0, zonesReached: 0, topValidated: true }
      upsertCompletion(compId, entry).catch(err => console.error('[db] upsertCompletion:', err))
    }
  }

  function updateBoulders(newBoulders: Boulder[]) {
    if (!activeCompetition) return
    setBouldersMap(prev => ({ ...prev, [activeCompetition.id]: newBoulders }))
    showToast(t.successSaved)
    upsertBoulders(activeCompetition.id, newBoulders).catch(err => console.error('[db] upsertBoulders:', err))
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
    // Gate: any transition TO live requires a valid subscription.
    // Re-runs (previously FINISHED/ARCHIVED) or expired end dates always prompt
    // a fresh payment — the old subscription cannot be reused.
    const transitioningToLive = merged.status === 'LIVE' && prev?.status !== 'LIVE'
    if (transitioningToLive) {
      const isExpired = prev?.endDate
        ? Date.now() > new Date(prev.endDate).getTime() + 86_400_000
        : false
      const isRerun = prev?.status === 'FINISHED' || prev?.status === 'ARCHIVED'
      const needsNewPayment = isRerun || isExpired
      if (!merged.subscription || needsNewPayment) {
        setPaymentComp({ ...merged, subscription: undefined } as any)
        return
      }
    }
    setCompetitions(p => p.map(c => c.id === merged.id ? merged : c))
    showToast(t.successSaved)
    upsertCompetition(merged).catch(err => {
      console.error('[db] updateCompetition:', err)
      showToast(`Save failed: ${err?.message ?? err}`)
    })
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
      flashBonusEnabled: false, flashBonusPoints: 10,
      rules: { en: '### Rules\n1. Use your common sense.', es: '### Reglas\n1. Usa el sentido común.', ca: '### Regles\n1. Fes servir el seny.' },
      zoneScoring: 'adds_to_score', scoringMethod: 'self_scoring',
      visibility: 'private' as const,
      attemptTracking: 'fixed_options', maxFixedAttempts: 4,
    }
    const ownerEntry = { ...currentUser, bibNumber: 0, role: 'organizer' as const }
    setCompetitions(prev => [...prev, newComp])
    setBouldersMap(prev    => ({ ...prev, [newId]: [] }))
    setCompletionsMap(prev => ({ ...prev, [newId]: [] }))
    setCompetitorsMap(prev => ({ ...prev, [newId]: [ownerEntry] }))
    setActiveCompId(newId)
    showToast(t.successSaved)
    // Save competition then add owner to competition_members so DB-level organizer
    // policies (which check competition_members.role = 'organizer') work correctly.
    upsertCompetition(newComp)
      .then(() => upsertMember(newId, currentUser.id, { role: 'organizer', status: 'active', bib_number: 0 }))
      .catch(err => {
        console.error('[db] createCompetition:', err)
        showToast(`Save failed: ${err?.message ?? err}`)
      })
  }

  function handleCloneCompetition(sourceId: string) {
    if (!currentUser) return
    const source = competitions.find(c => c.id === sourceId)
    if (!source) return
    const newId = `comp-${Date.now()}`
    const cloned: Competition = {
      ...source,
      id:           newId,
      ownerId:      currentUser.id,
      status:       CompetitionStatus.DRAFT,
      inviteCode:   generateInviteCode(),
      subscription:       undefined,
      tier:               undefined,
      participantLimit:   undefined,
      additionalCapacity: undefined,
      branding:           undefined,
      startDate: new Date().toISOString(),
      endDate:   new Date(Date.now() + 86_400_000).toISOString(),
    } as any
    const ownerEntry = { ...currentUser, bibNumber: 101, role: 'competitor' as const }
    setCompetitions(prev => [...prev, cloned])
    setBouldersMap(prev    => ({ ...prev, [newId]: [] }))
    setCompletionsMap(prev => ({ ...prev, [newId]: [] }))
    setCompetitorsMap(prev => ({ ...prev, [newId]: [ownerEntry] }))
    setActiveCompId(newId)
    showToast(t.successSaved)
    upsertCompetition(cloned)
      .then(() => upsertMember(newId, currentUser.id, { role: 'competitor', status: 'active', bib_number: 101 }))
      .catch(err => console.error('[db] cloneCompetition:', err))
  }

  function handleDeleteCompetition(compId: string) {
    setCompetitions(prev => prev.filter(c => c.id !== compId))
    setBouldersMap(prev    => { const n = { ...prev }; delete n[compId]; return n })
    setCompletionsMap(prev => { const n = { ...prev }; delete n[compId]; return n })
    setCompetitorsMap(prev => { const n = { ...prev }; delete n[compId]; return n })
    if (activeCompId === compId) setActiveCompId(competitions.find(c => c.id !== compId)?.id ?? '')
    deleteCompetition(compId).catch(err => console.error('[db] deleteCompetition:', err))
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
    let nextBib = 101
    setCompetitorsMap(prev => {
      const list = prev[compId] ?? []
      const deduped = list.filter((c, idx) =>
        c.id !== user.id || idx === list.findIndex(x => x.id === user.id)
      )
      if (deduped.some(c => c.id === user.id)) {
        const updates: Partial<Competitor> = {}
        if (traitIds) updates.traitIds = traitIds
        if (gender)   (updates as any).gender = gender
        if (Object.keys(updates).length) {
          // Update traits/gender in Supabase
          upsertMember(compId, user.id, {
            trait_ids: traitIds ?? undefined,
            gender:    gender    ?? undefined,
          }).catch(err => console.error('[db] joinCompetition update:', err))
          return { ...prev, [compId]: deduped.map(c => c.id === user.id ? { ...c, ...updates } : c) }
        }
        return prev
      }
      nextBib = deduped.filter(c => c.bibNumber > 0).length > 0
        ? Math.max(...deduped.map(c => c.bibNumber)) + 1
        : 101
      const entry = { ...user, bibNumber: nextBib, traitIds: traitIds ?? user.traitIds ?? [], role: 'competitor' as const }
      if (gender) (entry as any).gender = gender
      return { ...prev, [compId]: [...deduped, entry] }
    })
    setActiveCompId(compId)
    showToast(t.welcomeBack)
    // Persist the new member
    upsertMember(compId, user.id, {
      role:      'competitor',
      status:    'active',
      bib_number: nextBib,
      trait_ids: traitIds ?? user.traitIds ?? [],
      gender:    gender ?? null,
    }).catch(err => console.error('[db] joinCompetition insert:', err))
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
  // externalComp is passed when the competition was not in local state (fetched
  // from DB by invite code). We add it to state immediately and hydrate its
  // boulders / completions / members in the background.
  function handleJoinByCompId(compId: string, password?: string, traitIds?: string[], gender?: string, externalComp?: Competition): boolean | 'full' {
    const target = competitions.find(c => c.id === compId) ?? externalComp
    if (!target || !currentUser) return false
    if (target.joinPassword && password !== target.joinPassword) return false

    if (externalComp && !competitions.some(c => c.id === compId)) {
      setCompetitions(prev => [...prev, externalComp])
      setBouldersMap(prev    => ({ ...prev, [compId]: [] }))
      setCompletionsMap(prev => ({ ...prev, [compId]: [] }))
      setCompetitorsMap(prev => ({ ...prev, [compId]: [] }))
      // Hydrate competition data in the background
      Promise.all([fetchBoulders(compId), fetchCompletions(compId), fetchMembers(compId)])
        .then(([boulders, completions, members]) => {
          setBouldersMap(prev    => ({ ...prev, [compId]: boulders }))
          setCompletionsMap(prev => ({ ...prev, [compId]: completions }))
          setCompetitorsMap(prev => ({ ...prev, [compId]: members }))
        })
        .catch(err => console.error('[db] joinExternal hydrate:', err))
    }

    const ok = joinCompetition(compId, currentUser, traitIds, gender)
    return ok ? true : 'full'
  }

  function handleJoinWaitlist(compId: string) {
    if (!currentUser) return
    setWaitlistMap(prev => {
      const list = prev[compId] ?? []
      if (list.some(c => c.id === currentUser.id)) return prev
      return { ...prev, [compId]: [...list, currentUser] }
    })
    showToast(t.waitlistJoined)
    upsertMember(compId, currentUser.id, { role: 'competitor', status: 'waitlisted' })
      .catch(err => console.error('[db] joinWaitlist:', err))
  }

  function handleLeaveWaitlist(compId: string) {
    if (!currentUser) return
    setWaitlistMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
    deleteMember(compId, currentUser.id).catch(err => console.error('[db] leaveWaitlist:', err))
  }

  function handleLeaveCompetition(compId: string) {
    if (!currentUser) return
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
    deleteMember(compId, currentUser.id).catch(err => console.error('[db] leaveCompetition:', err))
    // Auto-promote the first waitlisted competitor into the now-free spot
    const waitlist = waitlistMap[compId] ?? []
    if (waitlist.length > 0) {
      const [promoted, ...remaining] = waitlist
      setCompetitorsMap(prev => {
        const list = prev[compId] ?? []
        const nextBib = list.filter(c => c.bibNumber > 0).length > 0
          ? Math.max(...list.map(c => c.bibNumber)) + 1
          : 101
        upsertMember(compId, promoted.id, { status: 'active', bib_number: nextBib })
          .catch(err => console.error('[db] promoteWaitlist:', err))
        return { ...prev, [compId]: [...list, { ...promoted, bibNumber: nextBib }] }
      })
      setWaitlistMap(prev => ({ ...prev, [compId]: remaining }))
    }
  }

  function isUserRegistered(compId: string): boolean {
    return (competitorsMap[compId] ?? []).some(c => c.id === currentUser?.id)
  }

  function handleUpdateRole(competitorId: string, role: 'competitor' | 'judge' | 'organizer') {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c => c.id === competitorId ? { ...c, role } : c) }))
    showToast(t.successSaved)
    upsertMember(activeCompetition.id, competitorId, { role }).catch(err => console.error('[db] updateRole:', err))
  }

  function handleRemoveUser(competitorId: string) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).filter(c => c.id !== competitorId) }))
    showToast(t.successSaved)
    deleteMember(activeCompetition.id, competitorId).catch(err => console.error('[db] removeUser:', err))
  }

  function handleUnbanUser(email: string) {
    if (!activeCompetition) return
    const updated = { ...activeCompetition, bannedEmails: (activeCompetition.bannedEmails ?? []).filter(e => e !== email.toLowerCase()) } as Competition
    setCompetitions(prev => prev.map(comp => comp.id === activeCompetition.id ? updated : comp))
    showToast(t.successSaved)
    upsertCompetition(updated).catch(err => console.error('[db] unbanUser:', err))
  }

  function handleBanUser(competitorId: string) {
    if (!activeCompetition) return
    const competitor = (competitorsMap[activeCompetition.id] ?? []).find(c => c.id === competitorId)
    if (!competitor) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).filter(c => c.id !== competitorId) }))
    const updated = { ...activeCompetition, bannedEmails: [...(activeCompetition.bannedEmails ?? []), competitor.email.toLowerCase()] } as Competition
    setCompetitions(prev => prev.map(comp => comp.id === activeCompetition.id ? updated : comp))
    showToast(t.successSaved)
    deleteMember(activeCompetition.id, competitorId)
      .then(() => upsertCompetition(updated))
      .catch(err => console.error('[db] banUser:', err))
  }

  function handleUpdateBib(competitorId: string, bib: number) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => ({ ...prev, [activeCompetition.id]: (prev[activeCompetition.id] ?? []).map(c => c.id === competitorId ? { ...c, bibNumber: bib } : c) }))
    showToast(t.successSaved)
    upsertMember(activeCompetition.id, competitorId, { bib_number: bib }).catch(err => console.error('[db] updateBib:', err))
  }

  function handleUpdateCompetitorTraits(competitorId: string, traitIds: string[]) {
    if (!activeCompetition) return
    setCompetitorsMap(prev => {
      const list = prev[activeCompetition.id] ?? []
      const seen = new Set<string>()
      const deduped = list.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
      return { ...prev, [activeCompetition.id]: deduped.map(c => c.id === competitorId ? { ...c, traitIds } : c) }
    })
    upsertMember(activeCompetition.id, competitorId, { trait_ids: traitIds }).catch(err => console.error('[db] updateTraits:', err))
  }

  function handleLogScore(
    competitorId: string, boulderId: string, attempts: number,
    hasZone: boolean, zoneAttempts: number, isTop: boolean,
    judgeId: string, zonesReached: number,
  ) {
    if (!activeCompetition || activeCompetition.isLocked) return
    const compId = activeCompetition.id
    const entry: Completion = {
      competitorId, boulderId, attempts, timestamp: Date.now(),
      hasZone, zoneAttempts, zonesReached,
      zoneValidatedBy: judgeId,
      topValidated: isTop,
      topValidatedBy: isTop ? judgeId : undefined,
      topValidatedAt: isTop ? Date.now() : undefined,
    }
    setCompletionsMap(prev => {
      const current = prev[compId] ?? []
      const existing = current.find(c => c.competitorId === competitorId && c.boulderId === boulderId)
      return {
        ...prev,
        [compId]: existing
          ? current.map(c => c.competitorId === competitorId && c.boulderId === boulderId ? entry : c)
          : [...current, entry],
      }
    })
    upsertCompletion(compId, entry).catch(err => console.error('[db] logScore:', err))
  }

  // ── Unauthenticated shell: Landing + Auth ─────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#7F8BAD] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/"                element={<LandingPage lang={lang} setLang={handleSetLang} />} />
        <Route path="auth"             element={<AuthPage theme={theme} lang={lang} setLang={handleSetLang} />} />
        <Route path="join/:code"       element={<GuestJoinRedirect lang={lang} />} />
        <Route path="results/:compId"  element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />
        <Route path="legal"            element={<LegalNoticePage lang={lang} />} />
        <Route path="privacy"          element={<PrivacyPolicyPage lang={lang} />} />
        <Route path="terms"            element={<TermsPage lang={lang} />} />
        <Route path="demo"             element={<DemoPage lang={lang} />} />
        <Route path="*"                element={<Navigate to={`/${lang}`} replace />} />
      </Routes>
    )
  }

  // ── No competitions yet (new user or all deleted) ────────────────────────
  // Render a full shell with NavBar so the user has access to profile / logout.
  if (!activeCompetition) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#121212] text-[#EEEEEE]' : 'bg-white text-[#121212]'}`}>
        <NavBar
          theme={theme} setTheme={setTheme} lang={lang} setLang={handleSetLang}
          currentUser={currentUser}
          isOrganizer={false} isJudge={false} canAccessComp={false}
          onOpenMenu={() => setIsMenuOpen(true)}
          onLogout={() => { setCurrentUser(null); signOutUser(); goto('/', { replace: true }) }}
        />
        <MobileMenu
          isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
          theme={theme} lang={lang} currentUser={currentUser}
          isOrganizer={false} isJudge={false}
          canAccessComp={false}
          onLogout={() => { setCurrentUser(null); signOutUser(); goto('/', { replace: true }) }}
        />
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Routes>
            <Route path="competitions" element={
              <CompetitionsPage
                competitions={[]} activeCompId={activeCompId}
                currentUser={currentUser} theme={theme} lang={lang}
                onEnter={setActiveCompId} onCreate={handleCreateCompetition}
                onDelete={handleDeleteCompetition} onLeave={handleLeaveCompetition}
                onJoinByCode={handleJoinByCode} isRegistered={isUserRegistered}
                competitorsMap={competitorsMap}
                getCompRole={() => null}
                onManage={() => {}}
                onClone={handleCloneCompetition}
                onJoinSuccess={() => {}}
              />
            } />
            <Route path="profile" element={
              <ProfilePage
                currentUser={currentUser} theme={theme} lang={lang}
                badges={[]}
                onJoinByCode={handleJoinByCode}
                onSave={updated => {
                  upsertProfile(updated.id, {
                    display_name: updated.displayName,
                    avatar_url:   updated.avatar,
                    emoji:        (updated as any).emoji,
                    trait_ids:    updated.traitIds,
                  })
                  setCurrentUser(updated)
                }}
              />
            } />
            {/* Join route must be present even when the user has no competitions yet */}
            <Route path="join/:code" element={
              <JoinPage
                competitions={competitions}
                currentUser={currentUser}
                theme={theme}
                lang={lang}
                isRegistered={isUserRegistered}
                onJoin={handleJoinByCompId}
                waitlistMap={waitlistMap}
                onJoinWaitlist={handleJoinWaitlist}
                onLeaveWaitlist={handleLeaveWaitlist}
              />
            } />
            <Route path="results/:compId" element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />
            <Route path="demo"    element={<DemoPage lang={lang} />} />
            <Route path="legal"   element={<LegalNoticePage lang={lang} />} />
            <Route path="privacy" element={<PrivacyPolicyPage lang={lang} />} />
            <Route path="terms"   element={<TermsPage lang={lang} />} />
            <Route path="*"       element={<Navigate to={`/${lang}/competitions`} replace />} />
          </Routes>
        </main>
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

        {pendingRemoveUser && (
          <UndoToast
            key={pendingRemoveUser.id}
            message={`${pendingRemoveUser.displayName} removed from competition`}
            theme={theme}
            onUndo={() => setPendingRemoveUser(null)}
            onCommit={() => { handleRemoveUser(pendingRemoveUser.id); setPendingRemoveUser(null) }}
            onDismiss={() => setPendingRemoveUser(null)}
          />
        )}

        {pendingBanUser && (
          <UndoToast
            key={`ban-${pendingBanUser.id}`}
            message={`${pendingBanUser.displayName} banned from event`}
            theme={theme}
            onUndo={() => setPendingBanUser(null)}
            onCommit={() => { handleBanUser(pendingBanUser.id); setPendingBanUser(null) }}
            onDismiss={() => setPendingBanUser(null)}
          />
        )}

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
              upsertCompetition(published).catch(err => console.error('[db] paymentSuccess:', err))
            }}
          />
        )}

        {/* Profile modal — shown after a competitor joins a competition */}
        {joinProfileComp && currentUser && (
          <PostRegistrationModal
            user={activeCompetitors.find(c => c.id === currentUser.id) ?? currentUser}
            competition={joinProfileComp}
            theme={theme}
            lang={lang}
            onComplete={updated => {
              // Persist gender + traits into competitorsMap
              handleUpdateCompetitorTraits(updated.id, (updated as any).traitIds ?? [])
              setCurrentUser({ ...currentUser, gender: updated.gender } as any)
              setJoinProfileComp(null)
              goto('/event-profile')
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
          onLogout={() => { setCurrentUser(null); signOutUser(); goto('/', { replace: true }) }}
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
          onLogout={() => { setCurrentUser(null); signOutUser(); goto('/', { replace: true }) }}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <Routes>

            {/* Redirect /auth to app if already logged in */}
            <Route path="auth" element={<Navigate to={`/${lang}/competitions`} replace />} />

            {/* ── Public join route ── */}
            <Route path="join/:code" element={
              <JoinPage
                competitions={competitions}
                currentUser={currentUser}
                theme={theme}
                lang={lang}
                isRegistered={isUserRegistered}
                onJoin={handleJoinByCompId}
                waitlistMap={waitlistMap}
                onJoinWaitlist={handleJoinWaitlist}
                onLeaveWaitlist={handleLeaveWaitlist}
              />
            } />

            {/* ── Always accessible ── */}
            <Route path="competitions" element={
              <CompetitionsPage
                competitions={competitions} activeCompId={activeCompId}
                currentUser={currentUser} theme={theme} lang={lang}
                onEnter={setActiveCompId} onCreate={handleCreateCompetition}
                onDelete={handleDeleteCompetition} onLeave={handleLeaveCompetition}
                onJoinByCode={handleJoinByCode} isRegistered={isUserRegistered}
                competitorsMap={competitorsMap}
                getCompRole={(compId) => {
                  if (!currentUser) return null
                  const entry = (competitorsMap[compId] ?? []).find(c => c.id === currentUser.id)
                  return entry?.role ?? null
                }}
                onManage={(compId) => { setActiveCompId(compId); setTimeout(() => goto('/settings'), 0) }}
                onClone={handleCloneCompetition}
                onJoinSuccess={(comp) => {
                  setJoinProfileComp(comp)
                }}
              />
            } />

            <Route path="profile" element={
              <ProfilePage
                currentUser={currentUser} theme={theme} lang={lang}
                badges={badgesByCompetitor.get(currentUser.id) ?? []}
                onJoinByCode={handleJoinByCode}
                onSave={updated => {
                  upsertProfile(updated.id, {
                    display_name: updated.displayName,
                    avatar_url:   updated.avatar,
                    emoji:        (updated as any).emoji,
                    trait_ids:    updated.traitIds,
                  })
                  setCurrentUser(updated)
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

            {/* ── Event profile ── */}
            <Route path="event-profile" element={
              (isOrganizer || isJudge)
                ? <Navigate to={`/${lang}/competitions`} replace />
                : <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp} onAccessDenied={showToast} lang={lang}>
                    <EventProfilePage
                      competition={activeCompetition}
                      boulders={activeBoulders}
                      completions={activeCompletions}
                      currentUser={(() => {
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

            {/* ── Boulders (home) ── */}
            <Route path="/" element={
              !activeCompetition
                ? <Navigate to={`/${lang}/competitions`} replace />
                : (isOrganizer || isJudge || canAccessActiveComp)
                  ? <BouldersPage
                      competition={activeCompetition} boulders={activeBoulders}
                      completions={activeCompletions} currentUser={currentUser}
                      isOrganizer={isOrganizer}
                      theme={theme} lang={lang}
                      canSelfScore={!isJudge && activeCompetition.canSelfScore}
                      onToggle={handleToggleCompletion} onUpdateBoulders={updateBoulders}
                    />
                  : <Navigate to={`/${lang}/competitions`} replace />
            } />

            <Route path="leaderboard" element={
              <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp} onAccessDenied={showToast} lang={lang}>
                <LeaderboardPage rankings={rankings} competitors={activeCompetitors} competition={activeCompetition} theme={theme} lang={lang} isOrganizer={isOrganizer} currentUserId={currentUser.id} />
              </Guard>
            } />

            <Route path="results/:compId" element={<PublicLeaderboardPage competitions={competitions} competitorsMap={competitorsMap} bouldersMap={bouldersMap} completionsMap={completionsMap} />} />

            <Route path="rules" element={
              <Guard required="any" currentUser={currentUser} isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp} onAccessDenied={showToast} lang={lang}>
                <RulesPage competition={activeCompetition} isOrganizer={isOrganizer} theme={theme} lang={lang} onUpdate={updateCompetition} />
              </Guard>
            } />

            <Route path="judging" element={
              (isOrganizer || isJudge)
                ? <JudgingPage
                    competition={activeCompetition} boulders={activeBoulders}
                    competitors={activeCompetitors} completions={activeCompletions}
                    theme={theme} lang={lang} onLogScore={handleLogScore}
                    currentUser={currentUser} showSuccess={showToast}
                  />
                : <Navigate to={`/${lang}/competitions`} replace />
            } />

            <Route path="users" element={
              (isOrganizer || isJudge)
                ? <UsersPage
                    competitors={activeCompetitors} competition={activeCompetition}
                    currentUser={currentUser} theme={theme} lang={lang}
                    viewOnly={isJudge}
                    onUpdateRole={handleUpdateRole} onUpdateBib={handleUpdateBib}
                    onInitiateRemove={c => setPendingRemoveUser(c)}
                    onInitiateBan={c => setPendingBanUser(c)}
                    onUnbanUser={handleUnbanUser}
                  />
                : <Navigate to={`/${lang}/competitions`} replace />
            } />

            <Route path="analytics" element={
              (isOrganizer || isJudge)
                ? <AnalyticsPage
                    competition={activeCompetition} boulders={activeBoulders}
                    competitors={activeCompetitors} completions={activeCompletions}
                    theme={theme} lang={lang}
                  />
                : <Navigate to={`/${lang}/competitions`} replace />
            } />

            <Route path="settings" element={
              <Guard required="organizer" currentUser={currentUser} isOrganizer={isOrganizer} isJudge={isJudge} canAccessComp={canAccessActiveComp} onAccessDenied={showToast} lang={lang}>
                <SettingsPage competition={activeCompetition} theme={theme} lang={lang} onUpdate={updateCompetition} competitorCount={activeCompetitorCount} />
              </Guard>
            } />

            {/* Policy + demo pages */}
            <Route path="legal"   element={<LegalNoticePage lang={lang} />} />
            <Route path="privacy" element={<PrivacyPolicyPage lang={lang} />} />
            <Route path="terms"   element={<TermsPage lang={lang} />} />
            <Route path="demo"    element={<DemoPage lang={lang} />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={`/${lang}/competitions`} replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}