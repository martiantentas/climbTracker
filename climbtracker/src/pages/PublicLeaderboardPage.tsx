import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, Target, Zap, ArrowLeft } from 'lucide-react'
import ascendiaLogo from '../assets/Ascendia.png'

import type { Competition, Competitor, Boulder, Completion } from '../types'
import { calculateRankings } from '../utils/scoring'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface PublicLeaderboardPageProps {
  competitions:   Competition[]
  competitorsMap: Record<string, Competitor[]>
  bouldersMap:    Record<string, Boulder[]>
  completionsMap: Record<string, Completion[]>
}

// ─── RANK BADGE ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
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
  const { compId } = useParams<{ compId: string }>()
  const navigate   = useNavigate()

  const competition = competitions.find(c => c.id === compId)
  const competitors = competitorsMap[compId ?? ''] ?? []
  const boulders    = bouldersMap[compId ?? '']    ?? []
  const completions = completionsMap[compId ?? ''] ?? []

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
    const byId = new Map(traits.map(t => [t.id, t.name]))
    for (const c of competitors) {
      const cv  = c as any
      const ids: string[] = cv.traitIds?.length ? cv.traitIds : cv.categoryId ? [cv.categoryId] : []
      map.set(c.id, ids.map((id: string) => byId.get(id) ?? id).filter(Boolean))
    }
    return map
  }, [competition, competitors])

  // Not found state
  if (!competition) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center font-sans text-[#EEEEEE]">
        <p className="text-5xl mb-4">🏔️</p>
        <h1 className="text-xl font-medium mb-2">Competition not found</h1>
        <p className="text-[#5C5E62] mb-6">This results page doesn't exist or the link is incorrect.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded bg-[#3E6AE1] text-white font-medium hover:bg-[#3056C7] transition-colors duration-[330ms]"
        >
          Go home
        </button>
      </div>
    )
  }

  const totalTops  = rankings.reduce((s, r) => s + r.totalTops, 0)
  const topFlasher = rankings.reduce<typeof rankings[0] | null>((best, r) =>
    !best || r.flashCount > best.flashCount ? r : best, null)

  const isLive = competition.status === 'LIVE'

  return (
    <div className="min-h-screen bg-[#121212] text-[#EEEEEE]">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#121212]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={ascendiaLogo} alt="Ascendia" className="h-7 w-auto object-contain" />
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 bg-transparent border-none text-[#5C5E62] text-sm font-medium cursor-pointer hover:text-[#D0D1D2] transition-colors duration-[330ms]"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className={`
            inline-flex items-center gap-1.5 px-3 py-1 rounded border mb-3
            ${isLive
              ? 'bg-green-400/10 border-green-400/30'
              : 'bg-white/5 border-white/10'
            }
          `}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400' : 'bg-[#5C5E62]'}`} />
            <span className={`text-[11px] font-medium ${isLive ? 'text-green-400' : 'text-[#5C5E62]'}`}>
              {isLive ? 'Live standings' : 'Final results'}
            </span>
          </div>
          <h1 className="text-3xl font-medium text-[#EEEEEE] mb-1.5">
            {competition.name}
          </h1>
          <p className="text-sm text-[#5C5E62]">
            {competition.location} · {new Date(competition.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap mb-7">
          {[
            { icon: <Trophy size={13} />, label: `${rankings.length} climbers`,    color: 'text-[#3E6AE1]' },
            { icon: <Target size={13} />, label: `${totalTops} total tops`,        color: 'text-green-400' },
            { icon: <Zap size={13} />,    label: topFlasher ? `${topFlasher.flashCount} flashes — ${topFlasher.name}` : 'No flashes yet', color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded border bg-white/[0.03] border-white/[0.07] text-xs font-medium ${s.color}`}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>

        {/* Rankings */}
        {rankings.length === 0 ? (
          <div className="text-center py-16 text-[#5C5E62]">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium text-sm">No results yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rankings.map(result => {
              const isFirst = result.rank === 1
              const cats    = categoryMap.get(result.competitorId) ?? []
              const live    = competitors.find(c => c.id === result.competitorId) as any
              const gender  = live?.gender ?? (result as any).gender
              return (
                <div
                  key={result.competitorId}
                  className={`
                    flex items-center gap-4 px-5 py-3.5 rounded border transition-colors duration-[330ms]
                    ${isFirst
                      ? 'bg-amber-400/[0.04] border-amber-400/[0.15]'
                      : 'bg-white/[0.02] border-white/[0.06]'
                    }
                  `}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    <RankBadge rank={result.rank} />
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#5C5E62]">
                    {result.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#EEEEEE] truncate">
                      {result.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#5C5E62] mt-0.5">
                      <span>BIB #{result.bib}</span>
                      {cats.length > 0 && <><span>·</span><span className="font-medium">{cats.join(', ')}</span></>}
                      {gender && <><span>·</span><span>{gender}</span></>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-400">{result.flashCount}</p>
                      <p className="text-[9px] text-[#5C5E62]">⚡</p>
                    </div>
                    <div className="text-right min-w-[52px]">
                      <p className="text-xl font-medium text-[#3E6AE1]">{result.totalPoints}</p>
                      <p className="text-[9px] text-[#5C5E62]">pts</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-[#393C41] text-xs">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <img src={ascendiaLogo} alt="Ascendia" className="h-4 w-auto object-contain opacity-40" />
            <span className="font-medium">Powered by Ascendia</span>
          </div>
          <span>Results are updated in real time</span>
        </div>
      </main>
    </div>
  )
}
