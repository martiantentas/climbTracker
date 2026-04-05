import { useState, useMemo } from 'react'
import { Trophy, Medal, Search } from 'lucide-react'

import type { Competition, RankResult } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  rankings:    RankResult[]
  competition: Competition
  theme:       'light' | 'dark'
  lang:        Language
}

// ─── RANK BADGE ───────────────────────────────────────────────────────────────
// Shows a trophy icon for top 3, a number for everyone else

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

  // ── Local filter state ───────────────────────────────────────────────────
  const [search,          setSearch]          = useState('')
  const [filterCategory,  setFilterCategory]  = useState('all')
  const [filterGender,    setFilterGender]    = useState('all')

  // ── Collect unique categories and genders from rankings ──────────────────
  const categories = useMemo(() => {
    const names = [...new Set(rankings.map(r => r.category))]
    return names.sort()
  }, [rankings])

  const genders = useMemo(() => {
    // We don't have gender on RankResult directly, so we'll skip gender
    // filter for now — it will be wired up when Supabase is connected
    return [] as string[]
  }, [])

  // ── Filtered rankings ────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...rankings]

    if (filterCategory !== 'all') {
      list = list.filter(r => r.category === filterCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        String(r.bib).includes(q)
      )
    }

    return list
  }, [rankings, filterCategory, search])

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* ── Search bar ── */}
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4
        ${theme === 'dark'
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        <Search size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
        <input
          type="text"
          placeholder={t.searchCompetitor}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
        />
      </div>

      {/* ── Category filter pills ── */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className={`text-[10px] uppercase tracking-widest font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.category}:
          </span>
          {['all', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`
                px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest
                transition-all duration-150
                ${filterCategory === cat
                  ? 'bg-sky-400 text-sky-950'
                  : theme === 'dark'
                    ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }
              `}
            >
              {cat === 'all' ? t.all : cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Rankings table ── */}
      {visible.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm">No results found</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>

          {/* Table header */}
          <div className={`
            grid grid-cols-[40px_1fr_80px_80px_80px] gap-2
            px-4 py-3 text-[10px] font-black uppercase tracking-widest
            ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}
          `}>
            <div className="text-center">#</div>
            <div>{t.competitor}</div>
            <div className="text-center">{t.tops}</div>
            <div className="text-center">{t.attempts}</div>
            <div className="text-right">pts</div>
          </div>

          {/* Table rows */}
          {visible.map((result, index) => {
            const isEven = index % 2 === 0
            const isTop3 = result.rank <= 3

            return (
              <div
                key={result.competitorId}
                className={`
                  grid grid-cols-[40px_1fr_80px_80px_80px] gap-2
                  px-4 py-3 items-center
                  border-t transition-colors
                  ${theme === 'dark'
                    ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'} hover:bg-white/5`
                    : `border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50`
                  }
                `}
              >
                {/* Rank */}
                <div className="flex items-center justify-center">
                  <RankBadge rank={result.rank} />
                </div>

                {/* Name + category + BIB */}
                <div>
                  <p className={`
                    text-sm font-black leading-tight
                    ${isTop3
                      ? 'text-sky-400'
                      : theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                    }
                  `}>
                    {result.name}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {result.category} · BIB #{result.bib}
                  </p>
                </div>

                {/* Tops */}
                <div className="text-center">
                  <span className={`text-sm font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {result.totalTops}
                  </span>
                </div>

                {/* Attempts */}
                <div className="text-center">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {result.totalAttempts}
                  </span>
                </div>

                {/* Points */}
                <div className="text-right">
                  <span className={`
                    text-sm font-black
                    ${isTop3 ? 'text-amber-400' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}
                  `}>
                    {result.totalPoints}
                  </span>
                </div>

              </div>
            )
          })}

        </div>
      )}

      {/* ── Flash count note ── */}
      {visible.some(r => r.flashCount > 0) && (
        <p className={`text-[11px] mt-4 text-center ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          ⚡ Flash count used as tie-breaker · Fewer attempts ranked higher
        </p>
      )}

    </div>
  )
}