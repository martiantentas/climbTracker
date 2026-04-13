import { useState, useMemo } from 'react'
import { Plus, SlidersHorizontal, Lock } from 'lucide-react'

import type { Boulder, Competition, Competitor, Completion, AttemptTracking } from '../types'
import { translations } from '../translations'
import type { Language } from '../translations'
import BoulderCard from '../components/BoulderCard'
import BoulderModal from '../components/BoulderModal'
import UndoToast from '../components/UndoToast'
import { calcBoulderPoints } from '../utils/scoring'

interface BouldersPageProps {
  competition:      Competition
  boulders:         Boulder[]
  completions:      Completion[]
  currentUser:      Competitor
  isOrganizer:      boolean
  canSelfScore:     boolean
  theme:            'light' | 'dark'
  lang:             Language
  onToggle:         (competitorId: string, boulderId: string, attempts: number, forceStatus: boolean) => void
  onUpdateBoulders: (boulders: Boulder[]) => void
}

type FilterStatus = 'all' | 'completed' | 'incomplete'
type SortKey      = 'number' | 'difficulty'

function resolveTracking(boulder: Boulder, competition: Competition): AttemptTracking {
  if (boulder.isPuntuable) return 'count'
  return boulder.attemptTrackingOverride ?? competition.attemptTracking
}

export default function BouldersPage({
  competition,
  boulders,
  completions,
  currentUser,
  isOrganizer,
  canSelfScore,
  theme,
  lang,
  onToggle,
  onUpdateBoulders,
}: BouldersPageProps) {
  const t = translations[lang]

  const [filter,       setFilter]       = useState<FilterStatus>('all')
  const [sortBy,       setSortBy]       = useState<SortKey>('number')
  const [search,       setSearch]       = useState('')
  const [modalBoulder, setModalBoulder] = useState<Boulder | null | 'new'>(null)

  // ── Undo state for boulder deletion ──────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<Boulder | null>(null)

  const myCompletions = useMemo(() =>
    completions.filter(c => c.competitorId === currentUser.id),
    [completions, currentUser.id]
  )

  // ── Points calculation ────────────────────────────────────────────────────
  // getPoints: shows what a competitor has earned (or would earn) on a boulder.
  // For the card display when there's no completion yet, we show potential points.
  // When there IS a completion, we show actual earned points via calcBoulderPoints.
  function getPoints(boulder: Boulder): number {
    const completion = myCompletions.find(c => c.boulderId === boulder.id)
    if (!completion) {
      // No activity — show potential points as a guide
      if (competition.scoringType === 'DYNAMIC') {
        const topsCount = completions.filter(c => c.boulderId === boulder.id && c.topValidated).length
        const pot = boulder.maxPoints ?? competition.dynamicPot ?? 1000
        if (topsCount === 0) return pot
        return Math.max(Math.floor(pot / topsCount), competition.minDynamicPoints ?? 0)
      }
      const difficulty = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
      return difficulty?.basePoints ?? 0
    }
    // Has a completion — return actual earned points (0 if dynamic + no top)
    return calcBoulderPoints(completion, boulder, competition, completions)
  }

  // ── Base points (un-penalised) — for penalty delta display ───────────────
  function getBasePoints(boulder: Boulder): number {
    if (competition.scoringType === 'DYNAMIC') {
      const topsCount = completions.filter(c => c.boulderId === boulder.id && c.topValidated).length
      const pot = boulder.maxPoints ?? competition.dynamicPot ?? 1000
      if (topsCount === 0) return pot
      return Math.max(Math.floor(pot / topsCount), competition.minDynamicPoints ?? 0)
    }
    const difficulty = competition.difficultyLevels?.find(d => d.id === boulder.difficultyId)
    return difficulty?.basePoints ?? 0
  }

  // ── Penalty label — e.g. "−40 pts" or "−20%" shown on card ───────────────
  function getPenaltyLabel(boulder: Boulder): string {
    const completion = myCompletions.find(c => c.boulderId === boulder.id)
    if (!completion || !competition.penalizeAttempts || completion.attempts <= 1) return ''
    const extra = completion.attempts - 1
    if (competition.penaltyType === 'fixed') {
      const total = extra * competition.penaltyValue
      return `−${total} pts`
    }
    // percent
    const total = extra * competition.penaltyValue
    return `−${total}%`
  }
  // Sum actual earned points across all my completions.
  // calcBoulderPoints returns 0 for zone-only dynamic completions, so they
  // correctly don't inflate the score.
  const myTotalScore = useMemo(() => {
    const scores = myCompletions.map(mc => {
      const boulder = boulders.find(b => b.id === mc.boulderId)
      if (!boulder) return 0
      return calcBoulderPoints(mc, boulder, competition, completions)
    })
    const sorted = [...scores].sort((a, b) => b - a)
    const counted = competition.topKBoulders
      ? sorted.slice(0, competition.topKBoulders)
      : sorted
    return counted.reduce((a, b) => a + b, 0)
  }, [myCompletions, boulders, competition, completions])

  // ── Filter / sort ─────────────────────────────────────────────────────────
  const visibleBoulders = useMemo(() => {
    let list = boulders.filter(b =>
      isOrganizer ? b.status !== 'removed' : b.status === 'active'
    )
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        String(b.number).includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.style?.toLowerCase().includes(q)
      )
    }
    if (!isOrganizer) {
      if (filter === 'completed') list = list.filter(b => myCompletions.some(c => c.boulderId === b.id))
      else if (filter === 'incomplete') list = list.filter(b => !myCompletions.some(c => c.boulderId === b.id))
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number
      const da = competition.difficultyLevels.find(d => d.id === a.difficultyId)?.level ?? 0
      const db = competition.difficultyLevels.find(d => d.id === b.difficultyId)?.level ?? 0
      return db - da
    })
  }, [boulders, filter, sortBy, search, myCompletions, isOrganizer, competition.difficultyLevels])

  function handleToggle(boulderId: string, attempts: number, forceStatus: boolean) {
    onToggle(currentUser.id, boulderId, attempts, forceStatus)
  }

  function handleSaveBoulder(saved: Boulder) {
    const exists = boulders.find(b => b.id === saved.id)
    if (exists) {
      onUpdateBoulders(boulders.map(b => b.id === saved.id ? saved : b))
    } else {
      onUpdateBoulders([...boulders, saved])
    }
  }

  function handleDeleteBoulder(boulderId: string) {
    const boulder = boulders.find(b => b.id === boulderId)
    if (!boulder) return
    // Close the modal immediately so it doesn't linger behind the toast
    setModalBoulder(null)
    setPendingDelete(boulder)
  }

  function commitDeleteBoulder() {
    if (!pendingDelete) return
    onUpdateBoulders(boulders.map(b =>
      b.id === pendingDelete.id ? { ...b, status: 'removed' as const } : b
    ))
    setPendingDelete(null)
  }

  function undoDeleteBoulder() {
    setPendingDelete(null)
  }

  const totalBoulders = boulders.filter(b => b.status === 'active').length
  const toppedCount   = myCompletions.filter(c => c.topValidated).length
  const flashCount    = myCompletions.filter(c => c.attempts === 1 && c.topValidated).length

  // The effective locked state for competitors: locked by organizer OR self-scoring disabled
  const effectivelyLocked = competition.isLocked || (!isOrganizer && !canSelfScore)

  function pillCls(active: boolean, accent: 'sky' | 'purple' = 'sky') {
    const activeStyle = accent === 'sky' ? 'bg-sky-400 text-sky-950' : 'bg-purple-400 text-purple-950'
    return `px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? activeStyle : theme === 'dark' ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.boulders}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {isOrganizer ? (
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-black text-sky-400">{totalBoulders}</span> active boulders
              </span>
            ) : (
              <>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="font-black text-sky-400">{toppedCount}</span>/{totalBoulders} topped
                </span>
                {flashCount > 0 && (
                  <span className="text-sm font-black text-amber-400">⚡ {flashCount} flash{flashCount !== 1 ? 'es' : ''}</span>
                )}
              </>
            )}
          </div>
        </div>
        {isOrganizer && (
          <button onClick={() => setModalBoulder('new')} className="flex items-center gap-2 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">
            <Plus size={16} />
            {t.addBoulder}
          </button>
        )}
      </div>

      {/* ── Self-score summary banner (competitors only) ── */}
      {!isOrganizer && (
        <div className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>My Score</p>
              <p className="text-2xl font-black text-sky-400 leading-none">{myTotalScore}<span className={`text-xs ml-1 font-normal ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>pts</span></p>
            </div>
            <div className={`w-px h-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tops</p>
              <p className={`text-2xl font-black leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{toppedCount}<span className={`text-sm font-normal ml-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>/{totalBoulders}</span></p>
            </div>
            {flashCount > 0 && (
              <>
                <div className={`w-px h-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Flashes</p>
                  <p className="text-2xl font-black text-amber-400 leading-none">⚡{flashCount}</p>
                </div>
              </>
            )}
          </div>

          {/* Self-score status */}
          {!canSelfScore && !competition.isLocked && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black ${theme === 'dark' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              <Lock size={12} /> Judge scoring only
            </div>
          )}
          {competition.isLocked && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black ${theme === 'dark' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-red-50 text-red-500 border border-red-200'}`}>
              <Lock size={12} /> Results locked
            </div>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <SlidersHorizontal size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>Clear</button>
        )}
      </div>

      {/* ── Filter + sort pills ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {!isOrganizer && (
          <>
            {(['all', 'completed', 'incomplete'] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={pillCls(filter === f, 'sky')}>
                {f === 'all' ? t.all : f === 'completed' ? t.completed : t.incomplete}
              </button>
            ))}
            <div className={`w-px h-4 mx-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
          </>
        )}
        <span className={`text-[10px] uppercase tracking-widest font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{t.sortBy}:</span>
        {(['number', 'difficulty'] as SortKey[]).map(s => (
          <button key={s} onClick={() => setSortBy(s)} className={pillCls(sortBy === s, 'purple')}>
            {s === 'number' ? t.number : t.difficulty}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {visibleBoulders.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🪨</p>
          <p className="font-black uppercase tracking-widest text-sm mb-2">
            {isOrganizer ? 'No boulders yet' : 'No boulders found'}
          </p>
          {isOrganizer && (
            <button onClick={() => setModalBoulder('new')} className="mt-4 px-6 py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">
              Add your first boulder
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleBoulders.map(boulder => (
            <BoulderCard
              key={boulder.id}
              boulder={boulder}
              completion={myCompletions.find(c => c.boulderId === boulder.id)}
              difficulty={competition.difficultyLevels?.find(d => d.id === boulder.difficultyId)}
              points={getPoints(boulder)}
              basePoints={getBasePoints(boulder)}
              penalizeAttempts={competition.penalizeAttempts}
              penaltyLabel={getPenaltyLabel(boulder)}
              isOrganizer={isOrganizer}
              isLocked={effectivelyLocked}
              theme={theme}
              attemptTracking={resolveTracking(boulder, competition)}
              maxFixedAttempts={competition.maxFixedAttempts}
              onToggle={handleToggle}
              onEdit={isOrganizer ? b => setModalBoulder(b) : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modalBoulder !== null && (
        <BoulderModal
          boulder={modalBoulder === 'new' ? undefined : modalBoulder}
          existingBoulders={boulders}
          competition={competition}
          theme={theme}
          onSave={handleSaveBoulder}
          onDelete={isOrganizer ? handleDeleteBoulder : undefined}
          onClose={() => setModalBoulder(null)}
        />
      )}

      {/* ── Undo toast — boulder deletion ── */}
      {pendingDelete && (
        <UndoToast
          key={pendingDelete.id}
          message={`Boulder #${pendingDelete.number}${pendingDelete.name ? ` "${pendingDelete.name}"` : ''} deleted`}
          theme={theme}
          onUndo={undoDeleteBoulder}
          onCommit={commitDeleteBoulder}
          onDismiss={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}