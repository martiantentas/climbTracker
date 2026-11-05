import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Check, Radio, Sun, Moon, RefreshCw } from 'lucide-react'
import { motion } from 'motion/react'
import ascendiaLogo from '../assets/Ascendr.webp'

import type { Competition, Competitor, Boulder, Completion } from '../types'
import { calculateRankings } from '../utils/scoring'
import { translations } from '../translations'
import type { Language } from '../translations'
import UserAvatar from '../components/UserAvatar'
import { fetchPublicLeaderboard } from '../lib/db'
import type { PublicLeaderboardData } from '../lib/db'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PublicLeaderboardPageProps {
  competitions:   Competition[]
  competitorsMap: Record<string, Competitor[]>
  bouldersMap:    Record<string, Boulder[]>
  completionsMap: Record<string, Completion[]>
}

// Auto-refresh choices for the public page (ms; 0 = manual only).
const REFRESH_OPTIONS = [60_000, 120_000, 300_000, 600_000, 0]
const DEFAULT_REFRESH = 120_000
const REFRESH_KEY     = 'ct-pub-refresh'

// ─── RANK BADGE ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="text-sm font-medium text-[#5C5E62] w-7 text-center inline-block">
      #{rank}
    </span>
  )
}

// ─── PUBLIC LEADERBOARD ───────────────────────────────────────────────────────

export default function PublicLeaderboardPage({
  competitions,
  competitorsMap,
  bouldersMap,
  completionsMap,
}: PublicLeaderboardPageProps) {
  const { compId, lang: urlLang } = useParams<{ compId: string; lang: string }>()
  const navigate = useNavigate()

  const VALID_LANGS: Language[] = ['en', 'es', 'ca']
  const lang: Language = VALID_LANGS.includes(urlLang as Language) ? urlLang as Language : 'ca'
  const t = translations[lang]

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('ct-pub-theme') as 'dark' | 'light') ?? 'dark' }
    catch { return 'dark' }
  })
  const dk = theme === 'dark'

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('ct-pub-theme', next) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Always read the official server snapshot (get_public_leaderboard RPC),
  // for anonymous AND logged-in viewers. Local app state only holds the
  // completions of the user's ACTIVE competition, so using it here showed
  // everyone at 0 points for any other competition (e.g. a venue screen).
  // Each snapshot is the whole competition (~1.5-2 MB with 400 climbers), so:
  //   • the viewer picks how often it refreshes (default 2 min, or manual),
  //     remembered in this browser; "Refresh now" loads it on demand
  //   • nothing loads while the tab is hidden; coming back reloads only if
  //     the snapshot is older than the chosen interval
  //   • a competition that is not LIVE refreshes at most every 10 min
  //   • a network error keeps the last snapshot and retries (5 s while there
  //     is nothing on screen); "not found" only when the server says so
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [remote,        setRemote]        = useState<PublicLeaderboardData | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [refreshing,    setRefreshing]    = useState(false)
  const [refreshMs,     setRefreshMs]     = useState<number>(() => {
    try {
      const raw = localStorage.getItem(REFRESH_KEY)
      const v   = raw === null ? NaN : Number(raw)
      return REFRESH_OPTIONS.includes(v) ? v : DEFAULT_REFRESH
    } catch { return DEFAULT_REFRESH }
  })
  const lastFetchRef = useRef(0)          // when the last snapshot arrived (0 = never)
  const liveRef      = useRef(true)       // competition status is LIVE
  const loadNowRef   = useRef<() => void>(() => {})

  const changeRefresh = useCallback((ms: number) => {
    setRefreshMs(ms)
    try { localStorage.setItem(REFRESH_KEY, String(ms)) } catch { /* ignore */ }
  }, [])

  const snapshotCompRef = useRef(compId)
  useEffect(() => {
    if (!compId) return
    if (snapshotCompRef.current !== compId) { snapshotCompRef.current = compId; lastFetchRef.current = 0 }
    let cancelled = false
    let inFlight  = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const interval = () => (refreshMs === 0 ? 0 : liveRef.current ? refreshMs : Math.max(refreshMs, 600_000))
    const schedule = (ms: number) => { clearTimeout(timer); timer = setTimeout(load, ms) }
    const scheduleNext = () => {
      clearTimeout(timer)
      const every = interval()
      if (every > 0) schedule(Math.max(1_000, lastFetchRef.current + every - Date.now()))
    }
    function load() {
      if (cancelled || inFlight) return
      if (document.visibilityState === 'hidden') return   // resumes in onVisible
      inFlight = true
      setRefreshing(true)
      fetchPublicLeaderboard(compId!)
        .then(d => {
          if (cancelled) return
          lastFetchRef.current = Date.now()
          if (d) {
            liveRef.current = d.competition?.status === 'LIVE'
            setRemote(d); setNotFound(false); setLastUpdated(new Date())
          } else {
            setNotFound(true)
          }
          setRemoteLoading(false)
          scheduleNext()
        })
        .catch(err => {
          if (cancelled) return
          console.error('[public] leaderboard fetch failed:', err)
          if (lastFetchRef.current === 0) schedule(5_000)            // nothing on screen yet
          else if (interval() > 0) schedule(Math.min(interval(), 30_000))
        })
        .finally(() => { inFlight = false; setRefreshing(false) })
    }
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      const every = interval()
      if (lastFetchRef.current === 0 || (every > 0 && Date.now() - lastFetchRef.current >= every)) load()
      else scheduleNext()
    }
    loadNowRef.current = load
    if (lastFetchRef.current === 0) load()   // first visit
    else scheduleNext()                      // interval changed: keep the current snapshot
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearTimeout(timer)
      loadNowRef.current = () => {}
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [compId, refreshMs])

  // Kept in the props for compatibility; the page no longer reads app state.
  void competitions; void competitorsMap; void bouldersMap; void completionsMap

  const competition = remote?.competition
  const competitors = remote?.competitors ?? []
  const boulders    = remote?.boulders    ?? []
  const completions = remote?.completions ?? []

  const [copied,      setCopied]      = useState(false)
  const [, forceRender]               = useState(0)

  // Tick every minute to update "X min ago" label
  useEffect(() => {
    const id = setInterval(() => forceRender(n => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Listen for localStorage changes from other tabs (same-browser real-time)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (['ct-completions', 'ct-competitors', 'ct-competitions', 'ct-boulders'].includes(e.key ?? '')) {
        setLastUpdated(new Date())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const updatedLabel = useMemo(() => {
    const diffMs  = Date.now() - lastUpdated.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    return diffMin < 1 ? t.publicUpdatedNow : t.publicUpdatedAgo(diffMin)
  }, [lastUpdated, t, forceRender]) // eslint-disable-line react-hooks/exhaustive-deps

  const rankings = useMemo(() =>
    competition
      ? calculateRankings(competition, boulders, competitors, completions)
      : [],
    [competition, boulders, competitors, completions]
  )

  const categoryMap = useMemo(() => {
    const map  = new Map<string, string[]>()
    const comp = competition as any
    if (!comp) return map
    const traits: { id: string; name: string }[] = comp.traits ?? comp.categories ?? []
    const byId = new Map(traits.map(tr => [tr.id, tr.name]))
    for (const c of competitors) {
      const cv  = c as any
      const ids: string[] = cv.traitIds?.length ? cv.traitIds : cv.categoryId ? [cv.categoryId] : []
      map.set(c.id, ids.map((id: string) => byId.get(id) ?? id).filter(Boolean))
    }
    return map
  }, [competition, competitors])

  const handleShare = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => prompt('Copy this link:', url))
  }, [])

  const isLive     = competition?.status === 'LIVE'

  if (!competition && (remoteLoading || !notFound)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dk ? 'bg-[#121212]' : 'bg-[#F9F9F9]'}`}>
        <div className="w-6 h-6 rounded-full border-2 border-[#7F8BAD] border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Not found ──
  if (!competition) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans px-6 transition-colors duration-300 ${dk ? 'bg-[#121212] text-[#EEEEEE]' : 'bg-[#F9F9F9] text-[#121212]'}`}>
        <p className="text-5xl mb-4">🏔️</p>
        <h1 className="text-xl font-medium mb-2">{t.publicNotFound}</h1>
        <p className={`mb-6 text-center text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.publicNotFoundDesc}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded bg-[#7F8BAD] text-white font-medium hover:bg-[#6D799B] transition-colors duration-[330ms]"
        >
          {t.publicGoHome}
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dk ? 'bg-[#121212] text-[#EEEEEE]' : 'bg-[#F9F9F9] text-[#121212]'}`}>

      {/* ── Nav ── */}
      <nav className={`border-b backdrop-blur sticky top-0 z-50 transition-colors duration-300 ${dk ? 'border-white/[0.06] bg-[#121212]/90' : 'border-[#EEEEEE] bg-white/90'}`}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <img src={ascendiaLogo} alt="Ascendr" className="h-6 w-auto object-contain flex-shrink-0" />
            <span className={`text-sm hidden sm:inline ${dk ? 'text-[#393C41]' : 'text-[#D0D1D2]'}`}>·</span>
            <span className={`text-sm truncate hidden sm:inline ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{competition.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.86 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24, mass: 0.7 }}
              className={`p-2 rounded border transition-colors duration-[330ms] ${dk ? 'border-white/10 bg-white/[0.04] text-[#5C5E62] hover:text-[#D0D1D2] hover:border-white/20' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#8E8E8E] hover:text-[#393C41]'}`}
              title={dk ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                {dk ? <Sun size={14} /> : <Moon size={14} />}
              </motion.div>
            </motion.button>

            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors duration-[330ms] ${dk ? 'border-white/10 bg-white/[0.04] text-[#5C5E62] hover:text-[#D0D1D2] hover:border-[#7F8BAD]/30' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#8E8E8E] hover:text-[#393C41]'}`}
            >
              {copied ? <><Check size={12} className="text-green-400" /> {t.publicLinkCopied}</> : <><Share2 size={12} /> {t.publicShareResults}</>}
            </button>
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}
            >
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-8">

        {/* ── Header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${isLive ? 'bg-green-400/10 border-green-400/30' : dk ? 'bg-white/5 border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
              {isLive
                ? <Radio size={11} className="text-green-400 animate-pulse" />
                : <div className="w-1.5 h-1.5 rounded-full bg-[#5C5E62]" />
              }
              <span className={`text-[11px] font-medium ${isLive ? 'text-green-400' : dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {isLive ? t.publicLiveStandings : t.publicFinalResults}
              </span>
            </div>
            {isLive && (
              <span className={`text-[11px] ${dk ? 'text-[#393C41]' : 'text-[#D0D1D2]'}`}>{updatedLabel}</span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <label className={`flex items-center gap-1.5 text-[11px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                <span className="hidden sm:inline">{t.publicRefreshLabel}</span>
                <select
                  value={refreshMs}
                  onChange={e => changeRefresh(Number(e.target.value))}
                  aria-label={t.publicRefreshLabel}
                  className={`px-1.5 py-1 rounded border text-[11px] cursor-pointer outline-none ${dk ? 'border-white/10 bg-[#1A1A1A] text-[#D0D1D2]' : 'border-[#EEEEEE] bg-white text-[#393C41]'}`}
                >
                  {REFRESH_OPTIONS.map(ms => (
                    <option key={ms} value={ms}>{ms === 0 ? t.publicRefreshOff : `${ms / 60_000} min`}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => loadNowRef.current()}
                disabled={refreshing}
                title={t.publicRefreshNow}
                aria-label={t.publicRefreshNow}
                className={`p-1.5 rounded border transition-colors duration-[330ms] disabled:opacity-60 ${dk ? 'border-white/10 bg-white/[0.04] text-[#5C5E62] hover:text-[#D0D1D2]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#8E8E8E] hover:text-[#393C41]'}`}
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-medium mb-1.5 leading-tight ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {competition.name}
          </h1>
          <p className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {competition.location} · {new Date(competition.startDate).toLocaleDateString(
              lang === 'en' ? 'en-GB' : lang === 'es' ? 'es-ES' : 'ca-ES',
              { day: 'numeric', month: 'long', year: 'numeric' }
            )}
          </p>
        </div>

        {/* ── Rankings ── */}
        {rankings.length === 0 ? (
          <div className="text-center py-20 text-[#5C5E62]">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium text-sm">{t.publicNoResults}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rankings.map((result, i) => {
              const isFirst = result.rank === 1
              const cats    = categoryMap.get(result.competitorId) ?? []
              const live    = competitors.find(c => c.id === result.competitorId) as any
              const gender  = live?.gender ?? (result as any).gender
              return (
                <motion.div
                  key={result.competitorId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8, delay: Math.min(i, 12) * 0.045 }}
                  className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 rounded border transition-colors duration-300 ${
                    isFirst
                      ? 'bg-amber-400/[0.04] border-amber-400/[0.15]'
                      : dk
                        ? 'bg-white/[0.02] border-white/[0.06]'
                        : 'bg-white border-[#EEEEEE]'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center flex-shrink-0">
                    <RankBadge rank={result.rank} />
                  </div>

                  {/* Avatar */}
                  <UserAvatar
                    avatar={live?.avatar}
                    displayName={result.name}
                    sizeClass="w-9 h-9"
                    className="bg-white/5 flex-shrink-0"
                    iconSize={16}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{result.name}</p>
                    <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 flex-wrap ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                      <span>#{result.bib}</span>
                      {cats.length > 0 && <><span>·</span><span className="font-medium">{cats.join(', ')}</span></>}
                      {gender && <><span>·</span><span>{gender}</span></>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-sm font-medium text-green-400">{result.totalTops}</p>
                      <p className="text-[9px] text-[#5C5E62]">tops</p>
                    </div>
                    <div className="text-right min-w-[48px]">
                      <p className="text-xl font-medium text-[#7F8BAD]">{result.totalPoints}</p>
                      <p className="text-[9px] text-[#5C5E62]">pts</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className={`mt-12 text-center text-xs ${dk ? 'text-[#393C41]' : 'text-[#D0D1D2]'}`}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <img src={ascendiaLogo} alt="Ascendr" className="h-4 w-auto object-contain opacity-40" />
            <span className="font-medium">{t.publicPoweredBy}</span>
          </div>
          {isLive && <span>{t.publicRealTime}</span>}
        </div>
      </main>
    </div>
  )
}
