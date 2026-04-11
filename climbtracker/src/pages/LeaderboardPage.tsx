import { useState, useMemo } from 'react'
import { Trophy, ChevronDown, Zap, Target } from 'lucide-react'

import type { Competition, Competitor, RankResult } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  rankings:    RankResult[]
  competitors?: Competitor[]   // live state — for accurate category filtering; optional for backwards compat
  competition: Competition
  theme:       'light' | 'dark'
  lang:        Language
}

// ─── FILTER DROPDOWN ─────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label:    string
  value:    string
  options:  { value: string; label: string }[]
  theme:    'light' | 'dark'
  onChange: (v: string) => void
}

function FilterDropdown({ label, value, options, theme, onChange }: FilterDropdownProps) {
  const dk = theme === 'dark'

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`
          appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-black border cursor-pointer
          outline-none transition-all
          ${dk
            ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          }
        `}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dk ? 'text-slate-400' : 'text-slate-500'}`}
      />
    </div>
  )
}

// ─── RANK MEDAL ───────────────────────────────────────────────────────────────

function RankBadge({ rank, theme }: { rank: number; theme: 'light' | 'dark' }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return (
    <span className={`text-sm font-black tabular-nums w-7 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
      #{rank}
    </span>
  )
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────

export default function LeaderboardPage({
  rankings,
  competitors = [],
  competition,
  theme,
  lang,
}: LeaderboardPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  // ── Filter state ────────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState('')
  const [genderFilter,   setGenderFilter]   = useState('')

  // ── Resolve categories from competition (traits or categories) ────────────
  const allCategories = useMemo(() => {
    const comp = competition as any
    const cats: { id: string; name: string }[] =
      comp.traits?.length     ? comp.traits :
      comp.categories?.length ? comp.categories : []
    return cats
  }, [competition])

  // ── Build a lookup: competitorId → current category names ────────────────
  // Handles all data combinations:
  // - New source: competitor.traitIds with trait-1 IDs, competition.traits with trait-1 IDs ✓
  // - Old source: competitor.categoryId with cat-1 IDs, competition.categories with cat-1 IDs ✓
  // - Mixed (new constants + old competitors): categoryId='cat-1' vs traits with trait-1 IDs
  //   → falls back to matching by name order (both lists share same names in same order)
  const competitorCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>()
    const compById = new Map(competitors.map(c => [c.id, c]))

    // Build two lookup maps: by id and by index (for cross-system fallback)
    const comp = competition as any
    const oldCats: { id: string; name: string }[] = comp.categories ?? []
    const newCats: { id: string; name: string }[] = comp.traits ?? []
    // All available categories — try both systems
    const allCatById = new Map([
      ...oldCats.map(c => [c.id, c.name] as [string, string]),
      ...newCats.map(c => [c.id, c.name] as [string, string]),
    ])
    // Cross-system fallback: 'cat-1' → index 0 → newCats[0].name
    const oldCatIndexMap = new Map(oldCats.map((c, i) => [c.id, i]))

    function resolveIds(ids: string[]): string[] {
      return ids.map(id => {
        // Direct lookup (works when IDs match)
        if (allCatById.has(id)) return allCatById.get(id)!
        // Cross-system fallback: old cat-N id → same position in newCats
        const idx = oldCatIndexMap.get(id)
        if (idx !== undefined && newCats[idx]) return newCats[idx].name
        // Last resort: old cat name by index in old list
        const oldCat = oldCats.find(c => c.id === id)
        if (oldCat) return oldCat.name
        return null
      }).filter(Boolean) as string[]
    }

    for (const r of rankings) {
      const live = compById.get(r.competitorId) as any
      const rr   = r as any
      let names: string[] = []

      if (live) {
        if (Array.isArray(live.traitIds) && live.traitIds.length > 0) {
          names = resolveIds(live.traitIds)
        } else if (live.categoryId) {
          names = resolveIds([live.categoryId])
        }
      }

      // Fallback to RankResult embedded data if live lookup yielded nothing
      if (names.length === 0) {
        if (Array.isArray(rr.traitIds) && rr.traitIds.length > 0) {
          names = resolveIds(rr.traitIds)
        } else if (rr.category && rr.category !== 'Unknown') {
          names = [rr.category]
        }
      }

      map.set(r.competitorId, names)
    }
    return map
  }, [rankings, competitors, competition])

  // ── Category filter options — from competition definition ─────────────────
  const categoryOptions = useMemo(() =>
    allCategories.map(c => ({ value: c.name, label: c.name })),
    [allCategories]
  )

  // ── Gender options — derived from live competitors ─────────────────────────
  const genderOptions = useMemo(() => {
    const fromCompetitors = competitors.map(c => (c as any).gender)
    const fromRankings    = rankings.map(r => (r as any).gender)
    const genders = [...new Set([...fromCompetitors, ...fromRankings].filter(Boolean))] as string[]
    return genders.map(g => ({ value: g, label: g }))
  }, [competitors, rankings])

  // ── Filtered + re-ranked results ───────────────────────────────────────────
  const visible = useMemo(() => {
    return rankings.filter(r => {
      if (categoryFilter) {
        const cats = competitorCategoryMap.get(r.competitorId) ?? []
        if (!cats.includes(categoryFilter)) return false
      }
      if (genderFilter) {
        const live = competitors.find(c => c.id === r.competitorId) as any
        const gender = live?.gender ?? (r as any).gender
        if (gender !== genderFilter) return false
      }
      return true
    })
  }, [rankings, categoryFilter, genderFilter, competitorCategoryMap, competitors])

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalTops = rankings.reduce((s, r) => s + r.totalTops, 0)
  const topFlasher = rankings.reduce<RankResult | null>((best, r) => {
    if (!best || r.flashCount > best.flashCount) return r
    return best
  }, null)

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
          {t.leaderboard}
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name} · {competition.status === 'LIVE' ? 'Live standings' : 'Final standings'}
        </p>
      </div>

      {/* ── Summary chips ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: <Trophy size={12} />,  label: `${rankings.length} climbers`,    color: 'text-sky-400'    },
          { icon: <Target size={12} />,  label: `${totalTops} total tops`,        color: 'text-green-400'  },
          { icon: <Zap size={12} />,     label: topFlasher ? `${topFlasher.flashCount} flashes — ${topFlasher.name}` : 'No flashes yet', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'} ${s.color}`}>
            {s.icon}{s.label}
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {categoryOptions.length > 0 && (
          <FilterDropdown
            label="All categories"
            value={categoryFilter}
            options={categoryOptions}
            theme={theme}
            onChange={setCategoryFilter}
          />
        )}
        {genderOptions.length > 0 && (
          <FilterDropdown
            label="All genders"
            value={genderFilter}
            options={genderOptions}
            theme={theme}
            onChange={setGenderFilter}
          />
        )}
        {(categoryFilter || genderFilter) && (
          <button
            onClick={() => { setCategoryFilter(''); setGenderFilter('') }}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${dk ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {visible.length === 0 ? (
        <div className={`text-center py-16 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm">No results</p>
          <p className="text-xs mt-1">Try clearing your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((result, i) => {
            const isTop3 = result.rank <= 3
            return (
              <div
                key={result.competitorId}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all
                  ${isTop3 && result.rank === 1
                    ? dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200'
                    : dk ? 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }
                `}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 flex justify-center">
                  <RankBadge rank={result.rank} theme={theme} />
                </div>

                {/* Avatar */}
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black
                  ${dk ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}
                `}>
                  {result.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm truncate ${dk ? 'text-slate-100' : 'text-slate-900'}`}>
                    {result.name}
                  </p>
                  <div className={`flex items-center gap-2 text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>BIB #{result.bib}</span>
                    {(() => {
                      const cats = competitorCategoryMap.get(result.competitorId) ?? []
                      const label = cats.join(', ')
                      if (!label) return null
                      return (<><span>·</span><span className="font-black">{label}</span></>)
                    })()}
                    {(() => {
                      const live = competitors.find(c => c.id === result.competitorId) as any
                      const gender = live?.gender ?? (result as any).gender
                      if (!gender) return null
                      return (<><span>·</span><span>{gender}</span></>)
                    })()}
                  </div>
                </div>

                {/* Stats — progressively reveal more on wider screens */}
                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-center hidden md:block">
                    <p className={`text-sm font-black ${dk ? 'text-green-400' : 'text-green-600'}`}>{result.totalTops}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Tops</p>
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className={`text-sm font-black ${dk ? 'text-purple-400' : 'text-purple-600'}`}>{result.totalZones ?? 0}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Zones</p>
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className={`text-sm font-black ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{result.totalAttempts}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Tries</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-black text-amber-400">{result.flashCount}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>⚡</p>
                  </div>
                  <div className="text-right min-w-[56px]">
                    <p className="text-xl font-black text-sky-400">{result.totalPoints}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>pts</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}