import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase, authedFetchInit } from './lib/supabase'
import { trackEvent } from './lib/analytics'
import { getProfile, upsertProfile, supabaseUserToCompetitor, signOutUser } from './lib/auth'
import {
  loadAllUserData, upsertCompetition, deleteCompetition,
  upsertBoulders, upsertCompletion, deleteCompletion,
  upsertMember, updateMember, deleteMember, fetchMembers, fetchBoulders, fetchCompletions,
  updateCompetition as dbUpdateCompetition, joinCompetitionRpc, fetchCompetitionByInviteCode,
  fetchMemberFromRow, type MemberRow, isPermissionError,
} from './lib/db'

import type { Competition, Boulder, Competitor, Completion, Badge } from './types'
import { CompetitionStatus, ScoringType } from './types'
import { INITIAL_DIFFICULTIES } from './constants'
import { calculateRankings } from './utils/scoring'
import type { Language } from './translations'
import { translations } from './translations'
import NavBar from './components/NavBar'
import CookieBanner from './components/CookieBanner'
import Toast from './components/Toast'
import WalkthroughModal, { shouldShowWalkthrough, markWalkthroughSeen } from './components/WalkthroughModal'
import UndoToast from './components/UndoToast'
import MobileMenu from './components/MobileMenu'
import ProtectedRoute from './components/ProtectedRoute'

// ─── LAZY PAGE IMPORTS (code-split per route) ─────────────────────────────────
const BouldersPage          = lazy(() => import('./pages/BouldersPage'))
const LeaderboardPage       = lazy(() => import('./pages/LeaderboardPage'))
const RulesPage             = lazy(() => import('./pages/RulesPage'))
const ProfilePage           = lazy(() => import('./pages/ProfilePage'))
const CompetitionsPage      = lazy(() => import('./pages/CompetitionsPage'))
const UsersPage             = lazy(() => import('./pages/UsersPage'))
const SettingsPage          = lazy(() => import('./pages/SettingsPage'))
const JudgingPage           = lazy(() => import('./pages/JudgingPage'))
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage'))
const JoinPage              = lazy(() => import('./pages/JoinPage'))
const EventProfilePage      = lazy(() => import('./pages/EventProfilePage'))
const LandingPage           = lazy(() => import('./pages/LandingPage'))
const AuthPage              = lazy(() => import('./pages/AuthPage'))
const PostRegistrationModal = lazy(() => import('./components/PostRegistrationModal'))
const PublicLeaderboardPage = lazy(() => import('./pages/PublicLeaderboardPage'))
const LegalNoticePage       = lazy(() => import('./pages/LegalNoticePage'))
const PrivacyPolicyPage     = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsPage             = lazy(() => import('./pages/TermsPage'))
const DemoPage              = lazy(() => import('./pages/DemoPage'))

// Minimal spinner shown while a lazy chunk is loading
function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[#7F8BAD] border-t-transparent animate-spin" />
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  // Use crypto.getRandomValues — Math.random is predictable and could let an
  // attacker brute-force private invite codes once one is known.
  // Crockford-style base32 alphabet (no I/L/O/U → fewer typos and ambiguities).
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'
  const len      = 10
  const bytes    = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
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

// Pushes page_view events to dataLayer on every HashRouter route change.
// In GTM, create a Custom Event trigger for "page_view" and attach it to
// the GA4 Configuration tag (with analytics_storage consent check enabled).
function GtagRouteTracker() {
  const location = useLocation()
  useEffect(() => {
    ;(window as unknown as { dataLayer: unknown[] }).dataLayer?.push({
      event:         'page_view',
      page_path:     location.pathname + location.search,
      page_location: window.location.href,
    })
  }, [location])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <GtagRouteTracker />
      <CookieBanner />
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

  // Strip OAuth PKCE params (?code=&state=) from the address bar immediately on
  // mount — before Supabase finishes the code exchange (~1-2 s). Supabase reads
  // the params synchronously at createClient() time, so removing them here is safe.
  useEffect(() => {
    if (!window.location.search) return
    const p = new URLSearchParams(window.location.search)
    if (p.has('code') || p.has('error')) {
      const clean = new URL(window.location.href)
      ;['code', 'state', 'error', 'error_code', 'error_description'].forEach(k => clean.searchParams.delete(k))
      window.history.replaceState({}, '', clean.toString())
    }
  }, [])

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

  // Set of competition IDs whose completions have already been fetched.
  // Prevents redundant DB reads when the user switches back to a competition
  // they already loaded, and avoids double-fetching when Realtime keeps things live.
  const loadedCompletionsRef = useRef<Set<string>>(new Set())

  // Pending debounce timers for completion writes, keyed by "competitorId:boulderId".
  // Rapid taps (incrementing attempts, judge double-validating) are collapsed into
  // a single DB write after 400 ms of inactivity, reducing write storms under load.
  // Map value carries both the timer handle AND the deferred work so we can
  // flush pending writes synchronously (e.g. on tab close) — without this,
  // a score logged in the last 400ms of the session is silently lost.
  const pendingWriteTimers = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; flush: () => void }>>(new Map())

  // Schedule a debounced completion write. Replaces any pending write for the
  // same key so rapid taps coalesce. The work is stored alongside the timer
  // so it can be flushed synchronously on tab close.
  function scheduleCompletionWrite(writeKey: string, work: () => void) {
    const existing = pendingWriteTimers.current.get(writeKey)
    if (existing) clearTimeout(existing.timer)
    const timer = setTimeout(() => {
      pendingWriteTimers.current.delete(writeKey)
      work()
    }, 400)
    pendingWriteTimers.current.set(writeKey, { timer, flush: work })
  }

  // ── Ordered, retried score persistence ─────────────────────────────────────
  // Writes for the same competitor+boulder run strictly one after another, so a
  // slow retry of an older value can never land after a newer one. While a
  // write is in flight the key counts as "pending": realtime echoes and polls
  // will not overwrite the optimistic value on screen. If a write finally
  // fails, it is rolled back ONLY if no newer write was issued for that key,
  // and the toast says exactly which score was not saved.
  const inFlightWrites = useRef<Map<string, number>>(new Map())
  const writeSeq       = useRef<Map<string, number>>(new Map())
  const writeChain     = useRef<Map<string, Promise<boolean>>>(new Map())
  // Judge saves waiting for their (debounced) write. If a newer save for the
  // same key replaces a pending one, the older caller gets the newer result.
  const pendingSaveResolvers = useRef<Map<string, (v: boolean | Promise<boolean>) => void>>(new Map())

  function isPendingWrite(writeKey: string): boolean {
    return pendingWriteTimers.current.has(writeKey) || inFlightWrites.current.has(writeKey)
  }

  // Last value the database CONFIRMED per key (null = confirmed deleted).
  // Rollbacks restore this, never a value that was only optimistic.
  const confirmedEntries = useRef<Map<string, Completion | null>>(new Map())

  // Put one completion on screen (or remove it when entry is null).
  function setLocalEntry(compId: string, competitorId: string, boulderId: string, entry: Completion | null) {
    setCompletionsMap(prev => {
      const others = (prev[compId] ?? []).filter(c => !(c.competitorId === competitorId && c.boulderId === boulderId))
      return { ...prev, [compId]: entry ? [...others, entry] : others }
    })
  }

  // Merge a fresh database list with local state: keys with a pending write
  // keep ONLY their local (optimistic) value — or stay absent if the pending
  // write is a delete — so a poll/resync never undoes what the user just did.
  function mergeWithPending(dbList: Completion[], cur: Completion[]): Completion[] {
    const keyOf = (c: Completion) => `${c.competitorId}:${c.boulderId}`
    const out: Completion[] = []
    const seen = new Set<string>()
    for (const d of dbList) {
      const k = keyOf(d)
      if (isPendingWrite(k)) {
        const local = cur.find(c => keyOf(c) === k)
        if (local && !seen.has(k)) { out.push(local); seen.add(k) }
      } else if (!seen.has(k)) { out.push(d); seen.add(k); confirmedEntries.current.set(k, d) }
    }
    for (const c of cur) {
      const k = keyOf(c)
      if (isPendingWrite(k) && !seen.has(k)) { out.push(c); seen.add(k) }
    }
    return out
  }

  const WRITE_HARD_TIMEOUT_MS = 120_000

  function persistCompletion(
    writeKey: string,
    op:       (cancel: AbortSignal) => Promise<void>,
    written:  Completion | null,      // what this write stores (null = delete)
    rollback: (lastConfirmed: Completion | null | undefined) => void,
    describe: () => string,
  ): Promise<boolean> {
    const seq = (writeSeq.current.get(writeKey) ?? 0) + 1
    writeSeq.current.set(writeKey, seq)
    inFlightWrites.current.set(writeKey, (inFlightWrites.current.get(writeKey) ?? 0) + 1)
    const previous = writeChain.current.get(writeKey) ?? Promise.resolve(true)
    // Hard cap so the chain ALWAYS settles, even if the request hangs before
    // the per-request timeout applies (e.g. while refreshing the session).
    // On timeout the write is really CANCELLED (no further retry, request
    // aborted), so it can never land later and overwrite a newer value.
    const withHardTimeout = () => {
      const ctrl = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      return Promise.race([
        op(ctrl.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => { ctrl.abort(new Error('write timeout')); reject(new Error('write timeout')) }, WRITE_HARD_TIMEOUT_MS)
        }),
      ]).finally(() => clearTimeout(timer))
    }
    const next = previous
      .then(() => withHardTimeout())
      .then(() => { confirmedEntries.current.set(writeKey, written); return true })
      .catch(err => {
        console.error('[db] score write failed:', err)
        // Roll back only if this is the latest write for the key AND no newer
        // edit is waiting in the 400 ms debounce.
        if (writeSeq.current.get(writeKey) === seq && !pendingWriteTimers.current.has(writeKey)) {
          rollback(confirmedEntries.current.get(writeKey))
          showToast(isPermissionError(err) ? t.scoreRejectedFor(describe()) : t.scoreSaveFailedFor(describe()), 'error')
        }
        return false
      })
      .finally(() => {
        const n = (inFlightWrites.current.get(writeKey) ?? 1) - 1
        if (n <= 0) inFlightWrites.current.delete(writeKey); else inFlightWrites.current.set(writeKey, n)
        if (writeChain.current.get(writeKey) === next) writeChain.current.delete(writeKey)
      })
    writeChain.current.set(writeKey, next)
    return next
  }

  // "Name · #12" for error messages
  function describeScore(compId: string, competitorId: string, boulderId: string): string {
    const who = (competitorsMap[compId] ?? []).find(c => c.id === competitorId)?.displayName ?? ''
    const b   = (bouldersMap[compId] ?? []).find(x => x.id === boulderId)
    const num = b ? `#${(b as Boulder & { number?: number }).number ?? ''}` : ''
    return [who, num].filter(Boolean).join(' · ')
  }

  // Flush any pending score writes when the tab is about to close or hidden.
  // `visibilitychange` covers mobile (Safari fires pagehide, not beforeunload).
  useEffect(() => {
    function flushAll() {
      for (const { timer, flush } of pendingWriteTimers.current.values()) {
        clearTimeout(timer)
        try { flush() } catch { /* swallow — best-effort flush */ }
      }
      pendingWriteTimers.current.clear()
    }
    function onHide() { if (document.visibilityState === 'hidden') flushAll() }
    window.addEventListener('beforeunload',   flushAll)
    window.addEventListener('pagehide',       flushAll)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload',   flushAll)
      window.removeEventListener('pagehide',       flushAll)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const [competitions,   setCompetitions]   = useState<Competition[]>([])
  const [activeCompId,   setActiveCompId]   = useState<string>(() => {
    try { return localStorage.getItem('ct-active-comp') ?? '' } catch { return '' }
  })
  const [bouldersMap,    setBouldersMap]    = useState<Record<string, Boulder[]>>({})
  const [completionsMap, setCompletionsMap] = useState<Record<string, Completion[]>>({})
  const [competitorsMap, setCompetitorsMap] = useState<Record<string, Competitor[]>>({})
  const [waitlistMap,    setWaitlistMap]    = useState<Record<string, Competitor[]>>({})
  // Initial data load failure handling (see the data-loading effect)
  const [loadFailed,  setLoadFailed]  = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const loadAttemptsRef = useRef(0)
  // Always-current mirrors for long-lived callbacks (realtime handlers)
  const competitorsMapRef = useRef(competitorsMap)
  const waitlistMapRef    = useRef(waitlistMap)
  competitorsMapRef.current = competitorsMap
  waitlistMapRef.current    = waitlistMap
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
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    // Pass the current activeCompId so loadAllUserData pre-fetches completions
    // for the competition that will be visible immediately after login.
    const currentActiveId = activeCompId || (localStorage.getItem('ct-active-comp') ?? '')

    Promise.allSettled([
      getProfile(authUser.id),
      loadAllUserData(authUser.id, currentActiveId),
    ]).then(([profileResult, dataResult]) => {
      if (cancelled) return
      const profile  = profileResult.status === 'fulfilled' ? profileResult.value  : null
      const userData = dataResult.status    === 'fulfilled' ? dataResult.value      : null
      if (dataResult.status === 'rejected') {
        console.error('[auth] loadAllUserData failed:', dataResult.reason)
        // Retry once automatically after 3 s; if it fails again, show the
        // "could not load" bar with a retry button (instead of an empty
        // "no competitions" screen that looks like real data).
        if (loadAttemptsRef.current < 1) {
          loadAttemptsRef.current += 1
          retryTimer = setTimeout(() => setReloadToken(n => n + 1), 3_000)
        } else {
          setLoadFailed(true)
        }
      } else {
        loadAttemptsRef.current = 0
        setLoadFailed(false)
      }
      setCurrentUser(supabaseUserToCompetitor(authUser, profile))
      if (shouldShowWalkthrough('login')) setWalkthrough('login')
      if (userData) {
        // Mark the pre-fetched competition so the lazy loader skips it.
        loadedCompletionsRef.current = new Set(userData.activeId ? [userData.activeId] : [])
        setCompetitions(userData.comps)
        setBouldersMap(userData.boulders)
        setCompletionsMap(userData.completions)
        setCompetitorsMap(userData.members)
        setWaitlistMap(userData.waitlists)
        setActiveCompId(prev =>
          prev && userData.comps.some(c => c.id === prev) ? prev : (userData.activeId || userData.comps[0]?.id || '')
        )
      }
      setDataLoading(false)
      setAuthLoading(false)
    })

    return () => { cancelled = true; clearTimeout(retryTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, reloadToken])

  // Persist active competition selection as a UI preference
  useEffect(() => {
    if (activeCompId) localStorage.setItem('ct-active-comp', activeCompId)
  }, [activeCompId])

  // Lazy-load completions when the user switches to a competition whose completions
  // haven't been fetched yet.  loadAllUserData only pre-fetches the active comp on
  // login; everything else is deferred until it's actually needed.
  useEffect(() => {
    if (!activeCompId || !currentUser) return
    if (loadedCompletionsRef.current.has(activeCompId)) return
    loadedCompletionsRef.current.add(activeCompId)
    fetchCompletions(activeCompId)
      .then(cs => setCompletionsMap(prev => ({ ...prev, [activeCompId]: cs })))
      .catch(err => console.error('[db] lazy fetchCompletions:', err))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompId, currentUser?.id])

  // ── Real-time subscription — all tables for the active competition ────────
  // One channel, four listeners. Patches local state in place so every connected
  // client (competitor, judge, organizer) sees updates without a full reload.
  useEffect(() => {
    if (!activeCompId || !currentUser) return

    let hasJoinedOnce = false   // first SUBSCRIBED = initial join, later ones = reconnects
    let resyncing     = false

    const channel = supabase
      .channel(`comp:${activeCompId}`)

      // ── completions ────────────────────────────────────────────────────────
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const completion = payload.new.data as unknown as Completion
          if (!completion) return
          // Skip if a local write is still in-flight for this boulder — the
          // Realtime echo would revert the optimistic UI before the write confirms.
          const writeKey = `${completion.competitorId}:${completion.boulderId}`
          if (isPendingWrite(writeKey)) return
          confirmedEntries.current.set(writeKey, completion)
          setCompletionsMap(prev => {
            const cur = prev[activeCompId] ?? []
            const idx = cur.findIndex(c => c.competitorId === completion.competitorId && c.boulderId === completion.boulderId)
            return { ...prev, [activeCompId]: idx >= 0 ? cur.map((c, i) => i === idx ? completion : c) : [...cur, completion] }
          })
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { competitor_id: string; boulder_id: string; competition_id?: string }
          if (old.competition_id && old.competition_id !== activeCompId) return
          // Also guard deletes: if a write is pending, don't let a stale delete revert it.
          const writeKey = `${old.competitor_id}:${old.boulder_id}`
          if (isPendingWrite(writeKey)) return
          confirmedEntries.current.set(writeKey, null)
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
      // INSERT: add only the new member (fetching just their profile). With
      // 300 sign-ups and many people online, refetching the whole list on
      // every join multiplied the load on the database.
      // UPDATE / DELETE: patched in place. Supabase does not filter DELETE
      // events by column, so we check competition_id ourselves.
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        const row = payload.new as MemberRow
        if (row.competition_id !== activeCompId) return
        fetchMemberFromRow(row).then(member => {
          const setMap = row.status === 'waitlisted' ? setWaitlistMap : setCompetitorsMap
          setMap(prev => {
            const list = prev[activeCompId] ?? []
            return { ...prev, [activeCompId]: list.some(c => c.id === member.id)
              ? list.map(c => c.id === member.id ? member : c)
              : [...list, member] }
          })
        }).catch(err => console.error('[realtime] member insert:', err))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        const row = payload.new as MemberRow
        if (row.competition_id !== activeCompId) return
        const patch = (c: Competitor): Competitor => ({
          ...c,
          role:      row.role as Competitor['role'],
          bibNumber: row.bib_number ?? c.bibNumber,
          traitIds:  row.trait_ids ?? c.traitIds,
          ...(row.gender != null ? { gender: row.gender } : {}),
        } as Competitor)
        // Read CURRENT state through refs (this handler is created once per
        // subscription, so the state captured in its closure would be stale).
        const current = (competitorsMapRef.current[activeCompId] ?? []).find(c => c.id === row.user_id)
        const waiting = (waitlistMapRef.current[activeCompId] ?? []).find(c => c.id === row.user_id)
        if (row.status === 'waitlisted') {
          const base = current ?? waiting
          setCompetitorsMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => c.id !== row.user_id) }))
          if (base) setWaitlistMap(prev => ({ ...prev, [activeCompId]: [...(prev[activeCompId] ?? []).filter(c => c.id !== row.user_id), patch(base)] }))
        } else if (current) {
          setCompetitorsMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).map(c => c.id === row.user_id ? patch(c) : c) }))
        } else {
          // Promoted from the waitlist (or not loaded yet): fetch and add
          fetchMemberFromRow(row).then(member => {
            setWaitlistMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => c.id !== row.user_id) }))
            setCompetitorsMap(prev => {
              const list = prev[activeCompId] ?? []
              return { ...prev, [activeCompId]: list.some(c => c.id === member.id) ? list.map(c => c.id === member.id ? member : c) : [...list, member] }
            })
          }).catch(err => console.error('[realtime] member update:', err))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'competition_members', filter: `competition_id=eq.${activeCompId}` }, (payload) => {
        const old = payload.old as { user_id: string; competition_id?: string }
        if (old.competition_id && old.competition_id !== activeCompId) return
        setCompetitorsMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => c.id !== old.user_id) }))
        setWaitlistMap(prev => ({ ...prev, [activeCompId]: (prev[activeCompId] ?? []).filter(c => c.id !== old.user_id) }))
      })

      .subscribe((status) => {
        // First successful join: initial data was already loaded.
        // Any later join is a RE-connection: events sent while we were
        // offline are lost, so reload this competition from the database.
        if (status === 'SUBSCRIBED') {
          if (hasJoinedOnce) resync('reconnected')
          hasJoinedOnce = true
        }
      })

    // ── Full resync (after reconnect / phone wake-up) ─────────────────────────
    function resync(reason: string) {
      if (resyncing) return
      resyncing = true
      console.info(`[realtime] resync (${reason})`)
      Promise.all([
        fetchCompletions(activeCompId).then(cs => setCompletionsMap(prev => ({
          ...prev,
          // Keep pending local writes exactly as the user left them
          [activeCompId]: mergeWithPending(cs, prev[activeCompId] ?? []),
        }))),
        fetchBoulders(activeCompId).then(bs => setBouldersMap(prev => ({ ...prev, [activeCompId]: bs }))),
        fetchMembers(activeCompId).then(ms => setCompetitorsMap(prev => ({ ...prev, [activeCompId]: ms }))),
        supabase.from('competitions').select('data').eq('id', activeCompId).maybeSingle().then(({ data }) => {
          const fresh = data?.data as unknown as Competition | undefined
          if (fresh) setCompetitions(prev => prev.map(c => c.id === activeCompId ? { ...c, ...fresh } : c))
        }),
      ])
        .catch(err => console.error('[realtime] resync failed:', err))
        .finally(() => { resyncing = false })
    }

    // Phones suspend the page (and its websocket) while locked. When the user
    // comes back after more than 15 s, reload so the screen is not stale.
    let hiddenAt = 0
    function onVisibility() {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
      if (hiddenAt && Date.now() - hiddenAt > 15_000) resync('page visible again')
      hiddenAt = 0
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ── Realtime health-check ─────────────────────────────────────────────────
    // If the channel drops (network blip, plan limit hit, server restart) events
    // stop flowing and the leaderboard goes stale with no visible error.
    // Every 20 s we check the channel state; if it's not 'joined' we fall back
    // to a REST poll so scores stay accurate even without a live connection.
    const healthCheck = setInterval(() => {
      // RealtimeChannel exposes .state but isn't in the public TS types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((channel as any).state !== 'joined') {
        console.warn('[realtime] channel not joined — polling fallback')
        Promise.all([
          fetchCompletions(activeCompId)
            .then(cs => setCompletionsMap(prev => ({
              ...prev,
              // Keep pending local writes exactly as the user left them
              [activeCompId]: mergeWithPending(cs, prev[activeCompId] ?? []),
            }))),
          fetchBoulders(activeCompId)
            .then(bs => setBouldersMap(prev => ({ ...prev, [activeCompId]: bs }))),
        ]).catch(err => console.error('[realtime] poll fallback failed:', err))
      }
    }, 20_000)

    const onOnline = () => resync('network back')
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(healthCheck)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      supabase.removeChannel(channel)
    }
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

        // Mark as loaded so the lazy-load effect doesn't fetch again on switch
        loadedCompletionsRef.current.add(compId)
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
        loadedCompletionsRef.current.add(compId)
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

  // Detect return from Stripe Checkout (success or cancel).
  // Stripe redirects to the plain URL (not the hash), so query params are in
  // window.location.search even though HashRouter doesn't see them.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('payment_success')) {
      const sessionId = params.get('session_id')
      const compId    = params.get('comp_id')
      const type      = params.get('type')

      // Clean the query string immediately so the effect doesn't re-fire on refresh
      const clean = new URL(window.location.href)
      clean.search = ''
      window.history.replaceState({}, '', clean.toString())

      // Call verify-payment: confirms payment with Stripe, updates the DB,
      // and returns the updated competition so we can patch local state right away.
      if (sessionId && compId) {
        authedFetchInit({
          method: 'POST',
          body:   JSON.stringify({ sessionId }),
        })
          .then(init => fetch('/api/verify-payment', init))
          .then(r => r.json())
          .then((data: { success?: boolean; applied?: boolean; duplicate?: boolean; competition?: Record<string, unknown>; error?: string }) => {
            if (data.success && data.competition) {
              const updated = data.competition as unknown as Competition
              setCompetitions(prev =>
                prev.some(c => c.id === compId)
                  ? prev.map(c => c.id === compId ? updated : c)
                  : prev
              )
              trackEvent('purchase', { transaction_id: sessionId, currency: 'EUR', purchase_type: type, tier: params.get('tier') ?? undefined })
              const msg =
                type === 'bundle'  ? 'Capacity added! Your competition now has more slots.' :
                type === 'upgrade' ? 'Upgraded to Premium! Branding tools are now unlocked.' :
                                     'Payment confirmed! Your competition is now Live.'
              showToast(msg)
              if (type !== 'bundle' && type !== 'upgrade' && shouldShowWalkthrough('purchase')) {
                setWalkthrough('purchase')
              }
            } else {
              console.error('[verify-payment] server error:', data.error)
              showToast('Payment received but status update failed — please refresh.')
            }
          })
          .catch(err => {
            console.error('[verify-payment] network error:', err)
            showToast('Payment received but status update failed — please refresh.')
          })
      }
    } else if (params.has('payment_cancelled')) {
      showToast('Payment cancelled — no charge was made.')
      const clean = new URL(window.location.href)
      clean.search = ''
      window.history.replaceState({}, '', clean.toString())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [toast,             setToast]             = useState<{ message: string; visible: boolean; variant: 'success' | 'error' }>({ message: '', visible: false, variant: 'success' })
  const [walkthrough,       setWalkthrough]       = useState<'login' | 'purchase' | null>(null)
  const [isMenuOpen,        setIsMenuOpen]        = useState(false)
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

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string, variant: 'success' | 'error' = 'success') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, visible: true, variant })
    toastTimerRef.current = setTimeout(() => setToast({ message: '', visible: false, variant: 'success' }), variant === 'error' ? 5000 : 3000)
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

    // Persist to Supabase — upserts are debounced per boulder so rapid taps
    // (attempt count increments, double-taps) collapse into a single DB write.
    // Deletes are sent immediately since they're always intentional.
    const writeKey = `${competitorId}:${boulderId}`
    const describe = () => describeScore(compId, competitorId, boulderId)
    // On failure, go back to the last value the database confirmed; if none is
    // known yet, to what was on screen before this action.
    const rollbackTo = (fallback: Completion | null) => (confirmed: Completion | null | undefined) =>
      setLocalEntry(compId, competitorId, boulderId, confirmed !== undefined ? confirmed : fallback)
    // If nothing is in flight for this key, what is on screen now IS the
    // database value: remember it as the rollback target.
    if (!isPendingWrite(writeKey) && !writeChain.current.has(writeKey))
      confirmedEntries.current.set(writeKey, existing ?? null)
    // A judge save pending on this device for the same key is superseded
    // (only called in the branches that really replace or clear it).
    const supersedeJudgeSave = () => {
      const judgeSave = pendingSaveResolvers.current.get(writeKey)
      if (judgeSave) { pendingSaveResolvers.current.delete(writeKey); judgeSave(false) }
    }
    if (existing) {
      supersedeJudgeSave()
      if (forceStatus === false) {
        const pending = pendingWriteTimers.current.get(writeKey)
        if (pending) { clearTimeout(pending.timer); pendingWriteTimers.current.delete(writeKey) }
        void persistCompletion(writeKey,
          (cancel) => deleteCompletion(compId, competitorId, boulderId, cancel),
          null, rollbackTo(existing), describe)
      } else {
        const entry = { ...existing, attempts: Math.max(1, attempts) }
        scheduleCompletionWrite(writeKey, () => void persistCompletion(writeKey,
          (cancel) => upsertCompletion(compId, entry, cancel),
          entry, rollbackTo(existing), describe))
      }
    } else if (forceStatus === true) {
      supersedeJudgeSave()
      const entry: Completion = { competitorId, boulderId, attempts: Math.max(1, attempts), timestamp: Date.now(), hasZone: false, zoneAttempts: 0, zonesReached: 0, topValidated: true }
      scheduleCompletionWrite(writeKey, () => void persistCompletion(writeKey,
        (cancel) => upsertCompletion(compId, entry, cancel),
        entry, rollbackTo(null), describe))
    }
  }

  function updateBoulders(newBoulders: Boulder[]) {
    if (!activeCompetition) return
    const compId   = activeCompetition.id
    const previous = bouldersMap[compId] ?? []
    setBouldersMap(prev => ({ ...prev, [compId]: newBoulders }))
    upsertBoulders(compId, newBoulders)
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error('[db] upsertBoulders:', err)
        setBouldersMap(prev => ({ ...prev, [compId]: previous }))
        showToast(`Save failed: ${err?.message ?? err}`)
      })
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
        showToast('Please choose a plan in Settings to publish this competition.')
        return
      }
    }
    setCompetitions(p => p.map(c => c.id === merged.id ? merged : c))
    dbUpdateCompetition(merged)
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error('[db] updateCompetition:', err)
        // Roll back so the screen never shows a change the database refused.
        if (prev) setCompetitions(p => p.map(c => c.id === prev.id ? prev : c))
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
    const ownerEntry = { ...currentUser, bibNumber: 0, role: 'organizer' as const }
    setCompetitions(prev => [...prev, cloned])
    setBouldersMap(prev    => ({ ...prev, [newId]: [] }))
    setCompletionsMap(prev => ({ ...prev, [newId]: [] }))
    setCompetitorsMap(prev => ({ ...prev, [newId]: [ownerEntry] }))
    setActiveCompId(newId)
    showToast(t.successSaved)
    upsertCompetition(cloned)
      .then(() => upsertMember(newId, currentUser.id, { role: 'organizer', status: 'active', bib_number: 0 }))
      .catch(err => {
        console.error('[db] cloneCompetition:', err)
        showToast(`Save failed: ${err?.message ?? err}`)
      })
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
  // Joining is done by the join_competition RPC: the database checks the
  // password, bans and capacity and assigns a unique bib, all in one
  // transaction. The UI only reports what the database decided.
  //   true    → joined (or already a member)
  //   false   → wrong password
  //   'full'  → competition full (UI offers the waitlist)
  //   'error' → anything else; a toast has already explained it
  type JoinResult = boolean | 'full' | 'error'

  async function joinViaServer(
    comp: Competition,
    opts: { password?: string; traitIds?: string[]; gender?: string },
  ): Promise<JoinResult> {
    if (!currentUser) return 'error'
    let res: Awaited<ReturnType<typeof joinCompetitionRpc>>
    try {
      res = await joinCompetitionRpc(comp.id, opts)
    } catch (err) {
      console.error('[db] join_competition:', err)
      showToast(t.joinErrorNetwork)
      return 'error'
    }

    switch (res.status) {
      case 'bad_password': return false
      case 'full':         return 'full'
      case 'banned':       showToast(t.joinErrorBanned); return 'error'
      case 'not_found':    showToast(t.joinNotFound);    return 'error'
      case 'waitlisted':   return 'full'
    }

    // joined / already: hydrate this competition from the database so the
    // local state matches exactly what was saved (bib, categories, members).
    const compId = comp.id
    if (!competitions.some(c => c.id === compId)) {
      setCompetitions(prev => prev.some(c => c.id === compId) ? prev : [...prev, comp])
    }
    try {
      const [boulders, completions, members] = await Promise.all([
        fetchBoulders(compId), fetchCompletions(compId), fetchMembers(compId),
      ])
      loadedCompletionsRef.current.add(compId)
      setBouldersMap(prev    => ({ ...prev, [compId]: boulders }))
      setCompletionsMap(prev => ({ ...prev, [compId]: completions }))
      setCompetitorsMap(prev => ({ ...prev, [compId]: members }))
    } catch (err) {
      // The join itself succeeded; show at least the user's own entry.
      console.error('[db] join hydrate:', err)
      const self = {
        ...currentUser, bibNumber: res.bib ?? 0, role: 'competitor' as const,
        traitIds: opts.traitIds ?? currentUser.traitIds ?? [],
        ...(opts.gender ? { gender: opts.gender } : {}),
      }
      setCompetitorsMap(prev => {
        const list = prev[compId] ?? []
        return list.some(c => c.id === currentUser.id) ? prev : { ...prev, [compId]: [...list, self] }
      })
    }
    setWaitlistMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
    setActiveCompId(compId)
    showToast(t.welcomeBack)
    return true
  }

  // ── handleJoinByCode — used by CompetitionsPage and ProfilePage ───────────
  async function handleJoinByCode(code: string, password?: string, traitIds?: string[], gender?: string): Promise<JoinResult> {
    const normalized = code.trim().toUpperCase()
    let target: Competition | null = competitions.find(c => c.inviteCode === normalized) ?? null
    if (!target) {
      try { target = await fetchCompetitionByInviteCode(normalized) }
      catch (err) { console.error('[db] invite lookup:', err); showToast(t.joinErrorNetwork); return 'error' }
    }
    if (!target || !currentUser) return 'error'
    return joinViaServer(target, { password, traitIds, gender })
  }

  // ── handleJoinByCompId — used by JoinPage (code already resolved) ─────────
  async function handleJoinByCompId(compId: string, password?: string, traitIds?: string[], gender?: string, externalComp?: Competition): Promise<JoinResult> {
    const target = competitions.find(c => c.id === compId) ?? externalComp
    if (!target || !currentUser) return 'error'
    return joinViaServer(target, { password, traitIds, gender })
  }

  async function handleJoinWaitlist(compId: string) {
    if (!currentUser) return
    try {
      const res = await joinCompetitionRpc(compId, { waitlist: true })
      if (res.status === 'waitlisted') {
        setWaitlistMap(prev => {
          const list = prev[compId] ?? []
          return list.some(c => c.id === currentUser.id) ? prev : { ...prev, [compId]: [...list, currentUser] }
        })
        showToast(t.waitlistJoined)
      } else if (res.status === 'joined' || res.status === 'already') {
        // A spot opened up in the meantime: the user is in.
        const comp = competitions.find(c => c.id === compId)
        if (comp) await joinViaServer(comp, {})
      } else if (res.status === 'banned') {
        showToast(t.joinErrorBanned)
      }
    } catch (err) {
      console.error('[db] joinWaitlist:', err)
      showToast(t.joinErrorNetwork)
    }
  }

  function handleLeaveWaitlist(compId: string) {
    if (!currentUser) return
    const previous = waitlistMap[compId] ?? []
    setWaitlistMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
    deleteMember(compId, currentUser.id).catch(err => {
      console.error('[db] leaveWaitlist:', err)
      setWaitlistMap(prev => ({ ...prev, [compId]: previous }))
      showToast(t.saveErrorGeneric)
    })
  }

  // Waitlisted users are NOT auto-promoted from the leaving user's browser any
  // more: that write was always rejected by the database (a competitor cannot
  // edit another member). Waitlisted users get in by tapping Join again once a
  // spot is free; join_competition re-checks capacity on the server.
  function handleLeaveCompetition(compId: string) {
    if (!currentUser) return
    const previous = competitorsMap[compId] ?? []
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== currentUser.id) }))
    deleteMember(compId, currentUser.id).catch(err => {
      console.error('[db] leaveCompetition:', err)
      setCompetitorsMap(prev => ({ ...prev, [compId]: previous }))
      showToast(t.saveErrorGeneric)
    })
  }

  function isUserRegistered(compId: string): boolean {
    return (competitorsMap[compId] ?? []).some(c => c.id === currentUser?.id)
  }

  // Optimistically patch one member, persist ONLY the changed columns, and
  // roll back with a visible error if the database refuses.
  function patchMember(
    compId: string,
    competitorId: string,
    local: Partial<Competitor>,
    dbFields: Parameters<typeof updateMember>[2],
    label: string,
  ) {
    const previous = (competitorsMap[compId] ?? []).find(c => c.id === competitorId)
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).map(c => c.id === competitorId ? { ...c, ...local } : c) }))
    updateMember(compId, competitorId, dbFields)
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error(`[db] ${label}:`, err)
        if (previous) setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).map(c => c.id === competitorId ? previous : c) }))
        showToast(t.saveErrorGeneric)
      })
  }

  function handleUpdateRole(competitorId: string, role: 'competitor' | 'judge' | 'organizer') {
    if (!activeCompetition) return
    patchMember(activeCompetition.id, competitorId, { role }, { role }, 'updateRole')
  }

  function handleRemoveUser(competitorId: string) {
    if (!activeCompetition) return
    const compId   = activeCompetition.id
    const previous = competitorsMap[compId] ?? []
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== competitorId) }))
    deleteMember(compId, competitorId)
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error('[db] removeUser:', err)
        setCompetitorsMap(prev => ({ ...prev, [compId]: previous }))
        showToast(t.saveErrorGeneric)
      })
  }

  function handleUnbanUser(email: string) {
    if (!activeCompetition) return
    const previous = activeCompetition
    const updated  = { ...activeCompetition, bannedEmails: (activeCompetition.bannedEmails ?? []).filter(e => e !== email.toLowerCase()) } as Competition
    setCompetitions(prev => prev.map(comp => comp.id === updated.id ? updated : comp))
    dbUpdateCompetition(updated)
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error('[db] unbanUser:', err)
        setCompetitions(prev => prev.map(comp => comp.id === previous.id ? previous : comp))
        showToast(t.saveErrorGeneric)
      })
  }

  function handleBanUser(competitorId: string) {
    if (!activeCompetition) return
    const compId     = activeCompetition.id
    const competitor = (competitorsMap[compId] ?? []).find(c => c.id === competitorId)
    if (!competitor) return
    const previousComp    = activeCompetition
    const previousMembers = competitorsMap[compId] ?? []
    const email   = (competitor.email ?? '').toLowerCase()
    // Bans are by email; only owners/organizers receive members' emails.
    if (!email) { showToast(t.saveErrorGeneric, 'error'); return }
    const updated = { ...activeCompetition, bannedEmails: [...new Set([...(activeCompetition.bannedEmails ?? []), email].filter(Boolean))] } as Competition
    setCompetitorsMap(prev => ({ ...prev, [compId]: (prev[compId] ?? []).filter(c => c.id !== competitorId) }))
    setCompetitions(prev => prev.map(comp => comp.id === compId ? updated : comp))
    // Save the ban first, then remove the member: if the ban fails, nobody is removed.
    dbUpdateCompetition(updated)
      .then(() => deleteMember(compId, competitorId))
      .then(() => showToast(t.successSaved))
      .catch(err => {
        console.error('[db] banUser:', err)
        setCompetitions(prev => prev.map(comp => comp.id === compId ? previousComp : comp))
        setCompetitorsMap(prev => ({ ...prev, [compId]: previousMembers }))
        showToast(t.saveErrorGeneric)
      })
  }

  function handleUpdateBib(competitorId: string, bib: number) {
    if (!activeCompetition) return
    patchMember(activeCompetition.id, competitorId, { bibNumber: bib }, { bib_number: bib }, 'updateBib')
  }

  function handleUpdateCompetitorTraits(competitorId: string, traitIds: string[], gender?: string) {
    if (!activeCompetition) return
    const local: Partial<Competitor> = { traitIds }
    if (gender) (local as Competitor & { gender?: string }).gender = gender
    patchMember(activeCompetition.id, competitorId, local, { trait_ids: traitIds, gender: gender || undefined }, 'updateTraits')
  }

  function handleLogScore(
    competitorId: string, boulderId: string, attempts: number,
    hasZone: boolean, zoneAttempts: number, isTop: boolean,
    judgeId: string, zonesReached: number,
  ): Promise<boolean> {
    if (!activeCompetition || activeCompetition.isLocked) return Promise.resolve(false)
    const compId = activeCompetition.id
    const entry: Completion = {
      competitorId, boulderId, attempts, timestamp: Date.now(),
      hasZone, zoneAttempts, zonesReached,
      zoneValidatedBy: judgeId,
      topValidated: isTop,
      topValidatedBy: isTop ? judgeId : undefined,
      topValidatedAt: isTop ? Date.now() : undefined,
    }
    const isClearAction = attempts === 0 && !isTop && !hasZone && zonesReached === 0
    setCompletionsMap(prev => {
      const current = prev[compId] ?? []
      if (isClearAction) {
        return { ...prev, [compId]: current.filter(c => !(c.competitorId === competitorId && c.boulderId === boulderId)) }
      }
      const existing = current.find(c => c.competitorId === competitorId && c.boulderId === boulderId)
      return {
        ...prev,
        [compId]: existing
          ? current.map(c => c.competitorId === competitorId && c.boulderId === boulderId ? entry : c)
          : [...current, entry],
      }
    })
    const prevEntry = (completionsMap[compId] ?? []).find(c => c.competitorId === competitorId && c.boulderId === boulderId)
    const writeKey  = `${competitorId}:${boulderId}`
    const describe  = () => describeScore(compId, competitorId, boulderId)
    const rollbackTo = (fallback: Completion | null) => (confirmed: Completion | null | undefined) =>
      setLocalEntry(compId, competitorId, boulderId, confirmed !== undefined ? confirmed : fallback)
    if (!isPendingWrite(writeKey) && !writeChain.current.has(writeKey))
      confirmedEntries.current.set(writeKey, prevEntry ?? null)
    const supersededSave = pendingSaveResolvers.current.get(writeKey)
    pendingSaveResolvers.current.delete(writeKey)
    if (isClearAction) {
      const pending = pendingWriteTimers.current.get(writeKey)
      if (pending) { clearTimeout(pending.timer); pendingWriteTimers.current.delete(writeKey) }
      supersededSave?.(false)
      return persistCompletion(writeKey,
        (cancel) => deleteCompletion(compId, competitorId, boulderId, cancel),
        null, rollbackTo(prevEntry ?? null), describe)
    }
    // Debounced (rapid taps collapse into one write); resolves once the
    // database has confirmed (true) or the write finally failed (false).
    const result = new Promise<boolean>(resolve => {
      pendingSaveResolvers.current.set(writeKey, resolve)
      scheduleCompletionWrite(writeKey, () => {
        if (pendingSaveResolvers.current.get(writeKey) === resolve) pendingSaveResolvers.current.delete(writeKey)
        persistCompletion(writeKey,
          (cancel) => upsertCompletion(compId, entry, cancel),
          entry, rollbackTo(prevEntry ?? null), describe,
        ).then(resolve)
      })
    })
    supersededSave?.(result)
    return result
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
      <Suspense fallback={<PageSpinner />}>
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
      </Suspense>
    )
  }

  // ── No competitions yet (new user or all deleted) ────────────────────────
  // Render a full shell with NavBar so the user has access to profile / logout.
  if (!activeCompetition) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#121212] text-[#EEEEEE]' : 'bg-white text-[#121212]'}`}>
        {loadFailed && (
          <div role="alert" style={{ position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 6, background: '#B91C1C', color: '#fff', fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.35)' }}>
            <span>{t.loadFailedTitle}</span>
            <button
              onClick={() => { loadAttemptsRef.current = 0; setLoadFailed(false); setReloadToken(n => n + 1) }}
              style={{ background: '#fff', color: '#B91C1C', border: 0, borderRadius: 4, padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}
            >
              {t.loadFailedRetry}
            </button>
          </div>
        )}
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
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <Suspense fallback={<PageSpinner />}>
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
          </Suspense>
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
        {loadFailed && (
          <div role="alert" style={{ position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderRadius: 6, background: '#B91C1C', color: '#fff', fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,.35)' }}>
            <span>{t.loadFailedTitle}</span>
            <button
              onClick={() => { loadAttemptsRef.current = 0; setLoadFailed(false); setReloadToken(n => n + 1) }}
              style={{ background: '#fff', color: '#B91C1C', border: 0, borderRadius: 4, padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}
            >
              {t.loadFailedRetry}
            </button>
          </div>
        )}

        <Toast message={toast.message} visible={toast.visible} theme={theme} variant={toast.variant} />

        {walkthrough && (
          <WalkthroughModal
            variant={walkthrough}
            theme={theme}
            lang={lang}
            onDismiss={() => { markWalkthroughSeen(walkthrough); setWalkthrough(null) }}
          />
        )}

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

        {/* Profile modal — shown after a competitor joins a competition */}
        {joinProfileComp && currentUser && (
          <PostRegistrationModal
            user={activeCompetitors.find(c => c.id === currentUser.id) ?? currentUser}
            competition={joinProfileComp}
            theme={theme}
            lang={lang}
            onComplete={updated => {
              // Persist gender + traits into competitorsMap
              handleUpdateCompetitorTraits(updated.id, (updated as any).traitIds ?? [], (updated as any).gender || undefined)
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

        <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <Suspense fallback={<PageSpinner />}>
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

            {/* Root → competitions list */}
            <Route path="/" element={<Navigate to={`/${lang}/competitions`} replace />} />

            {/* ── Boulders ── */}
            <Route path="boulders" element={
              (isOrganizer || isJudge || canAccessActiveComp)
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
          </Suspense>
        </main>
      </div>
    </>
  )
}