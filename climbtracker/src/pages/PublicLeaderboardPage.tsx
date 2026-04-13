import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mountain, Trophy, Target, Zap, ArrowLeft } from 'lucide-react'

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
  return <span style={{ fontSize: 13, fontWeight: 900, color: '#64748b', width: 28, textAlign: 'center', display: 'inline-block' }}>#{rank}</span>
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

  const competition  = competitions.find(c => c.id === compId)
  const competitors  = competitorsMap[compId ?? ''] ?? []
  const boulders     = bouldersMap[compId ?? '']    ?? []
  const completions  = completionsMap[compId ?? ''] ?? []

  const rankings = useMemo(() =>
    competition
      ? calculateRankings(competition, boulders, competitors, completions)
      : [],
    [competition, boulders, competitors, completions]
  )

  // Build category map for display
  const categoryMap = useMemo(() => {
    const map  = new Map<string, string[]>()
    const comp = competition as any
    if (!comp) return map
    const traits: { id: string; name: string }[] = comp.traits ?? comp.categories ?? []
    const byId = new Map(traits.map(t => [t.id, t.name]))
    for (const c of competitors) {
      const cv = c as any
      const ids: string[] = cv.traitIds?.length ? cv.traitIds : cv.categoryId ? [cv.categoryId] : []
      map.set(c.id, ids.map((id: string) => byId.get(id) ?? id).filter(Boolean))
    }
    return map
  }, [competition, competitors])

  // Not found state
  if (!competition) {
    return (
      <div style={{ minHeight: '100vh', background: '#121212', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e2e8f0' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🏔️</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Competition not found</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>This results page doesn't exist or the link is incorrect.</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 12, background: '#38bdf8', color: '#0c1a22', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
          Go home
        </button>
      </div>
    )
  }

  const totalTops  = rankings.reduce((s, r) => s + r.totalTops, 0)
  const topFlasher = rankings.reduce<typeof rankings[0] | null>((best, r) =>
    !best || r.flashCount > best.flashCount ? r : best, null)

  return (
    <div style={{ minHeight: '100vh', background: '#121212', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e2e8f0' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300..900&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mountain size={18} color="#38bdf8" />
            <span style={{ fontWeight: 900, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.02em' }}>ClimbTracker</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: competition.status === 'LIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${competition.status === 'LIVE' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: competition.status === 'LIVE' ? '#22c55e' : '#64748b' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: competition.status === 'LIVE' ? '#22c55e' : '#64748b' }}>
              {competition.status === 'LIVE' ? 'Live standings' : 'Final results'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f1f5f9', margin: '0 0 6px' }}>
            {competition.name}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            {competition.location} · {new Date(competition.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            { icon: <Trophy size={13} />, label: `${rankings.length} climbers`,    color: '#38bdf8' },
            { icon: <Target size={13} />, label: `${totalTops} total tops`,        color: '#34d399' },
            { icon: <Zap size={13} />,    label: topFlasher ? `${topFlasher.flashCount} flashes — ${topFlasher.name}` : 'No flashes yet', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 800, color: s.color }}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>

        {/* Rankings */}
        {rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏆</p>
            <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 }}>No results yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankings.map(result => {
              const isTop3 = result.rank <= 3
              const cats   = categoryMap.get(result.competitorId) ?? []
              const live   = competitors.find(c => c.id === result.competitorId) as any
              const gender = live?.gender ?? (result as any).gender
              return (
                <div key={result.competitorId} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', borderRadius: 16, border: '1px solid',
                  background: isTop3 && result.rank === 1 ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)',
                  borderColor: isTop3 && result.rank === 1 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
                }}>
                  {/* Rank */}
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    <RankBadge rank={result.rank} />
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 900, color: '#64748b' }}>
                    {result.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {result.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#475569', marginTop: 2 }}>
                      <span>BIB #{result.bib}</span>
                      {cats.length > 0 && <><span>·</span><span style={{ fontWeight: 800 }}>{cats.join(', ')}</span></>}
                      {gender && <><span>·</span><span>{gender}</span></>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center', display: 'none' }} className="pub-tops">
                      <p style={{ fontSize: 13, fontWeight: 900, color: '#34d399', margin: 0 }}>{result.totalTops}</p>
                      <p style={{ fontSize: 9, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tops</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 900, color: '#f59e0b', margin: 0 }}>{result.flashCount}</p>
                      <p style={{ fontSize: 9, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡</p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 52 }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', margin: 0 }}>{result.totalPoints}</p>
                      <p style={{ fontSize: 9, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center', color: '#334155', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <Mountain size={14} color="#334155" />
            <span style={{ fontWeight: 700 }}>Powered by ClimbTracker</span>
          </div>
          <span>Results are updated in real time</span>
        </div>
      </main>
    </div>
  )
}