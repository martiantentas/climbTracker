import { useState, useMemo } from 'react'
import { Trophy, Medal, Search } from 'lucide-react'

import type { Competition, RankResult } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import { usePagination } from '../hooks/usePagination'
import { useSortedData } from '../hooks/useSortedData'
import PaginationBar from '../components/PaginationBar'
import SortableHeader from '../components/SortableHeader'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  rankings:    RankResult[]
  competition: Competition
  theme:       'light' | 'dark'
  lang:        Language
}

// ─── RANK BADGE ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={18} className="text-amber-400" />
  if (rank === 2) return <Medal  size={18} className="text-slate-400" />
  if (rank === 3) return <Medal  size={18} className="text-amber-700" />
  return (
    <span className="text-sm font-black text-slate-500 w-[18px] text-center">
      {rank}
    </span>
  )
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────

export default function LeaderboardPage({
  rankings,
  competition,
  theme,
  lang,
}: LeaderboardPageProps) {
  const t = translations[lang]

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterGender,   setFilterGender]   = useState('all')

  // ── Unique values for filter dropdowns ───────────────────────────────────
  const categories = useMemo(() =>
    [...new Set(rankings.map(r => r.category))].sort(),
    [rankings]
  )

  const genders = useMemo(() =>
    [...new Set(rankings.map(r => r.gender).filter(Boolean))].sort() as string[],
    [rankings]
  )

  // ── Base filtered list ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...rankings]

    if (filterCategory !== 'all') {
      list = list.filter(r => r.category === filterCategory)
    }
    if (filterGender !== 'all') {
      list = list.filter(r => r.gender === filterGender)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        String(r.bib).includes(q)
      )
    }

    return list
  }, [rankings, filterCategory, filterGender, search])

  // ── Sorting ───────────────────────────────────────────────────────────────
  const { sorted, sortKey, sortDir, toggleSort } = useSortedData(
    filtered, 'totalPoints', 'desc'
  )

  // Re-assign ranks after sorting/filtering
  const withRanks = useMemo(() => {
    return sorted.map((r, i) => ({ ...r, displayRank: i + 1 }))
  }, [sorted])

  // ── Pagination ────────────────────────────────────────────────────────────
  const { page, pageSize, totalPages, totalItems, pageItems, setPage, setPageSize } =
    usePagination(withRanks, 25)

  // ─────────────────────────────────────────────────────────────────────────
  const selectCls = `
    px-3 py-2 rounded-xl border outline-none text-xs font-black cursor-pointer transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
      : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50'
    }
  `

  return (
    <div>

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.leaderboard}
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name} · {rankings.length} competitors
        </p>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap gap-3 mb-4">

        {/* Search */}
        <div className={`
          flex items-center gap-2 px-4 py-2.5 rounded-2xl border flex-1 min-w-[200px]
          ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
        `}>
          <Search size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
          <input
            type="text"
            placeholder={t.searchCompetitor}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
          />
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            className={selectCls}
          >
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Gender filter */}
        {genders.length > 1 && (
          <select
            value={filterGender}
            onChange={e => { setFilterGender(e.target.value); setPage(1) }}
            className={selectCls}
          >
            <option value="all">All genders</option>
            {genders.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

      </div>

      {/* ── Table ── */}
      {pageItems.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm">No results found</p>
        </div>
      ) : (
        <>
          <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>

            {/* Table header */}
            <div className={`
              grid grid-cols-[40px_1fr_100px_80px_80px_80px_80px] gap-2
              px-4 py-3
              ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}
            `}>
              <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>#</div>
              <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.competitor}</div>
              <SortableHeader label="Category"  sortKey="category"      activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} />
              <SortableHeader label="Pts"        sortKey="totalPoints"  activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Tops"       sortKey="totalTops"    activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Zones"      sortKey="totalZones"   activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Attempts"   sortKey="totalAttempts" activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
            </div>

            {/* Table rows */}
            {pageItems.map((result, index) => {
              const isEven = index % 2 === 0
              const isTop3 = result.displayRank <= 3

              return (
                <div
                  key={result.competitorId}
                  className={`
                    grid grid-cols-[40px_1fr_100px_80px_80px_80px_80px] gap-2
                    px-4 py-3 items-center border-t transition-colors
                    ${theme === 'dark'
                      ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'} hover:bg-white/5`
                      : `border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50`
                    }
                  `}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    <RankBadge rank={result.displayRank} />
                  </div>

                  {/* Name + BIB */}
                  <div>
                    <p className={`
                      text-sm font-black leading-tight
                      ${isTop3 ? 'text-sky-400' : theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                    `}>
                      {result.name}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {result.gender ? `${result.gender} · ` : ''}BIB #{result.bib}
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {result.category}
                    </span>
                  </div>

                  {/* Points */}
                  <div className="text-center">
                    <span className={`text-sm font-black ${isTop3 ? 'text-amber-400' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {result.totalPoints}
                    </span>
                  </div>

                  {/* Tops */}
                  <div className="text-center">
                    <span className={`text-sm font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {result.totalTops}
                    </span>
                  </div>

                  {/* Zones */}
                  <div className="text-center">
                    <span className={`text-sm font-black ${result.totalZones > 0 ? 'text-purple-400' : theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>
                      {result.totalZones}
                    </span>
                  </div>

                  {/* Attempts */}
                  <div className="text-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {result.totalAttempts}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <PaginationBar
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPage={setPage}
            onPageSize={setPageSize}
            theme={theme}
          />
        </>
      )}

      {/* Tie-breaker note */}
      {rankings.length > 0 && (
        <p className={`text-[11px] mt-4 text-center ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          Default sort: points → tops → zones → attempts → flashes
        </p>
      )}

    </div>
  )
}