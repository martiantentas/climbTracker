import { useState, useMemo } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'

import type { Boulder, Competition, Competitor, Completion } from '../types'
import { translations } from '../translations'
import type { Language } from '../translations'
import BoulderCard from '../components/BoulderCard'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface BouldersPageProps {
  competition:  Competition
  boulders:     Boulder[]
  completions:  Completion[]
  currentUser:  Competitor
  isOrganizer:  boolean
  theme:        'light' | 'dark'
  lang:         Language
  onToggle:     (competitorId: string, boulderId: string, attempts: number, forceStatus: boolean) => void
  onUpdateBoulders: (boulders: Boulder[]) => void
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'completed' | 'incomplete'
type SortKey      = 'number' | 'difficulty'

// ─── BOULDERS PAGE ────────────────────────────────────────────────────────────

export default function BouldersPage({
  competition,
  boulders,
  completions,
  currentUser,
  isOrganizer,
  theme,
  lang,
  onToggle,
  onUpdateBoulders,
}: BouldersPageProps) {
  const t = translations[lang]

  // ── Local UI state ───────────────────────────────────────────────────────
  const [filter,  setFilter]  = useState<FilterStatus>('all')
  const [sortBy,  setSortBy]  = useState<SortKey>('number')
  const [search,  setSearch]  = useState('')

  // ── My completions ────────────────────────────────────────────────────────
  // Only the logged-in user's completions — used to show topped state
  const myCompletions = useMemo(() =>
    completions.filter(c => c.competitorId === currentUser.id),
    [completions, currentUser.id]
  )

  // ── Compute points for one boulder ────────────────────────────────────────
  function getPoints(boulder: Boulder): number {
    const difficulty = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
    if (!difficulty) return 0

    const completion = myCompletions.find(c => c.boulderId === boulder.id)

    if (competition.scoringType === 'DYNAMIC') {
      const topsCount = completions.filter(c => c.boulderId === boulder.id).length
      if (topsCount === 0) return boulder.maxPoints ?? competition.dynamicPot ?? 1000
      const pot = boulder.maxPoints ?? competition.dynamicPot ?? 1000
      return Math.max(Math.floor(pot / topsCount), competition.minDynamicPoints ?? 0)
    }

    // Traditional scoring
    if (!completion) return difficulty.basePoints

    let points = difficulty.basePoints
    if (competition.penalizeAttempts && completion.attempts > 1) {
      const extra = completion.attempts - 1
      if (competition.penaltyType === 'fixed') {
        points -= extra * competition.penaltyValue
      } else {
        points -= extra * (difficulty.basePoints * competition.penaltyValue / 100)
      }
    }
    return Math.max(points, competition.minScorePerBoulder)
  }

  // ── Filtered + sorted boulders ────────────────────────────────────────────
  const visibleBoulders = useMemo(() => {
    let list = boulders.filter(b => b.status === 'active')

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        String(b.number).includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.style?.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (filter === 'completed') {
      list = list.filter(b => myCompletions.some(c => c.boulderId === b.id))
    } else if (filter === 'incomplete') {
      list = list.filter(b => !myCompletions.some(c => c.boulderId === b.id))
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number
      // Sort by difficulty level
      const da = competition.difficultyLevels.find(d => d.id === a.difficultyId)?.level ?? 0
      const db = competition.difficultyLevels.find(d => d.id === b.difficultyId)?.level ?? 0
      return db - da  // hardest first
    })

    return list
  }, [boulders, filter, sortBy, search, myCompletions, competition.difficultyLevels])

  // ── Handle toggle from card ───────────────────────────────────────────────
  function handleToggle(boulderId: string, attempts: number, forceStatus: boolean) {
    onToggle(currentUser.id, boulderId, attempts, forceStatus)
  }

  // ── Stats bar values ──────────────────────────────────────────────────────
  const totalBoulders = boulders.filter(b => b.status === 'active').length
  const toppedCount   = myCompletions.length
  const flashCount    = myCompletions.filter(c => c.attempts === 1).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t.boulders}
          </h1>
          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-black text-sky-400">{toppedCount}</span>
              /{totalBoulders} topped
            </span>
            {flashCount > 0 && (
              <span className="text-sm font-black text-amber-400">
                ⚡ {flashCount} flash{flashCount !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Add boulder button — organizer only */}
        {isOrganizer && (
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all">
            <Plus size={16} />
            {t.addBoulder}
          </button>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4
        ${theme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <SlidersHorizontal size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
        />
      </div>

      {/* ── Filter + sort pills ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">

        {/* Status filters */}
        {(['all', 'completed', 'incomplete'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest
              transition-all duration-150
              ${filter === f
                ? 'bg-sky-400 text-sky-950'
                : theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }
            `}
          >
            {f === 'all' ? t.all : f === 'completed' ? t.completed : t.incomplete}
          </button>
        ))}

        {/* Divider */}
        <div className={`w-px h-4 mx-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />

        {/* Sort buttons */}
        <span className={`text-[10px] uppercase tracking-widest font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          {t.sortBy}:
        </span>
        {(['number', 'difficulty'] as SortKey[]).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`
              px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest
              transition-all duration-150
              ${sortBy === s
                ? 'bg-purple-400 text-purple-950'
                : theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }
            `}
          >
            {s === 'number' ? t.number : t.difficulty}
          </button>
        ))}
      </div>

      {/* ── Boulder grid ── */}
      {visibleBoulders.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🪨</p>
          <p className="font-black uppercase tracking-widest text-sm">No boulders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleBoulders.map(boulder => (
            <BoulderCard
              key={boulder.id}
              boulder={boulder}
              completion={myCompletions.find(c => c.boulderId === boulder.id)}
              difficulty={competition.difficultyLevels.find(d => d.id === boulder.difficultyId)}
              points={getPoints(boulder)}
              isOrganizer={isOrganizer}
              isLocked={competition.isLocked}
              theme={theme}
              onToggle={handleToggle}
              onEdit={() => {}}
            />
          ))}
        </div>
      )}

    </div>
  )
}