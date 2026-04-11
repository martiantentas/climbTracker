import { useMemo, useState } from 'react'
import { Hash, Tag, CheckCircle2, Target, Zap, Trophy, Star, Clock } from 'lucide-react'
import type { Competition, Boulder, Competitor, Completion } from '../types'
import type { Language } from '../translations'
import { calcBoulderPoints } from '../utils/scoring'

interface EventProfilePageProps {
  competition:    Competition
  boulders:       Boulder[]
  completions:    Completion[]      // all completions for this competition
  currentUser:    Competitor        // the logged-in user's record in THIS competition
  rankings:       { competitorId: string; rank: number; totalPoints: number }[]
  theme:          'light' | 'dark'
  lang:           Language
  onUpdateTraits: (competitorId: string, traitIds: string[]) => void
}

export default function EventProfilePage({
  competition,
  boulders,
  completions,
  currentUser,
  rankings,
  theme,
  onUpdateTraits,
}: EventProfilePageProps) {
  const dk = theme === 'dark'

  // ── My completions ────────────────────────────────────────────────────────
  const myCompletions = useMemo(() =>
    completions.filter(c => c.competitorId === currentUser.id),
    [completions, currentUser.id]
  )

  // ── Stats ─────────────────────────────────────────────────────────────────
  const tops        = myCompletions.filter(c => c.topValidated).length
  const zones       = myCompletions.filter(c => (c.zonesReached ?? 0) > 0).length
  const flashes     = myCompletions.filter(c => c.topValidated && c.attempts === 1).length
  const totalActive = boulders.filter(b => b.status === 'active').length

  const myScore = useMemo(() => {
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

  const myRank = rankings.find(r => r.competitorId === currentUser.id)?.rank ?? null

  // ── Recent topped boulders (last 5, newest first) ────────────────────────
  const recentTops = useMemo(() => {
    return myCompletions
      .filter(c => c.topValidated)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(c => ({
        completion: c,
        boulder: boulders.find(b => b.id === c.boulderId),
        points: (() => {
          const b = boulders.find(x => x.id === c.boulderId)
          return b ? calcBoulderPoints(c, b, competition, completions) : 0
        })(),
      }))
      .filter(x => x.boulder)
  }, [myCompletions, boulders, competition, completions])

  // ── Traits ───────────────────────────────────────────────────────────────
  // Works with both new (traits + traitIds) and original (categories + categoryId) source
  const availableTraits: { id: string; name: string }[] = useMemo(() => {
    const c = competition as any
    if (c.traits?.length)      return c.traits
    if (c.categories?.length)  return c.categories
    return []
  }, [competition])

  // Local state so toggles feel instant — synced to parent via onUpdateTraits
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const u = currentUser as any
    if (Array.isArray(u.traitIds) && u.traitIds.length > 0) return u.traitIds
    // fall back to single categoryId for old source
    if (u.categoryId) return [u.categoryId]
    return []
  })

  const needsTraitSetup = availableTraits.length > 0 && selectedIds.length === 0

  function toggleTrait(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]
    setSelectedIds(next)
    onUpdateTraits(currentUser.id, next)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statCard = (icon: React.ReactNode, label: string, value: string | number, accent: string) => (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
        {icon}{label}
      </div>
      <p className={`text-3xl font-black leading-none ${accent}`}>{value}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className={`text-2xl font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
          My Event Profile
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name}
        </p>
      </div>

      {/* ── Identity card ── */}
      <div className={`rounded-2xl border p-5 mb-6 flex items-center gap-5 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black ${dk ? 'bg-sky-400/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
          {currentUser.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{currentUser.displayName}</p>
          <p className={`text-sm ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{currentUser.email}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border flex-shrink-0 ${dk ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <Hash size={14} className="text-sky-400" />
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${dk ? 'text-slate-500' : 'text-slate-400'}`}>BIB</p>
            <p className="text-xl font-black text-sky-400 leading-none">{currentUser.bibNumber}</p>
          </div>
        </div>
      </div>

      {/* ── Traits — shown first so competitor sets category before seeing stats ── */}
      {availableTraits.length > 0 && (
        <div className={`rounded-2xl border p-5 mb-6 ${needsTraitSetup ? dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200' : dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Tag size={14} className={needsTraitSetup ? 'text-amber-400' : dk ? 'text-slate-400' : 'text-slate-500'} />
            <h2 className={`text-sm font-black ${needsTraitSetup ? dk ? 'text-amber-300' : 'text-amber-800' : dk ? 'text-slate-200' : 'text-slate-800'}`}>
              {needsTraitSetup ? 'Select your category' : 'My Categories'}
            </h2>
          </div>
          <p className={`text-xs mb-4 ${needsTraitSetup ? dk ? 'text-amber-400/70' : 'text-amber-700' : dk ? 'text-slate-500' : 'text-slate-400'}`}>
            {needsTraitSetup
              ? 'Choose the categories that apply to you so the organiser can place you in the right standings.'
              : 'Tap to toggle your categories. Changes save instantly.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTraits.map(trait => {
              const active = selectedIds.includes(trait.id)
              return (
                <button
                  key={trait.id}
                  onClick={() => toggleTrait(trait.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black border transition-all ${
                    active
                      ? 'bg-sky-400/15 text-sky-400 border-sky-400/30 shadow-sm'
                      : dk
                        ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {active && <CheckCircle2 size={13} />}
                  {trait.name}
                </button>
              )
            })}
          </div>
          {needsTraitSetup && (
            <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${dk ? 'text-amber-400/60' : 'text-amber-600/70'}`}>
              {competition.requireTraits ? '⚠ Required to appear in standings' : 'Optional — you can update this anytime'}
            </p>
          )}
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCard(<Star size={11} />,    'Score',   myScore,                  'text-sky-400')}
        {statCard(<Trophy size={11} />,  'Tops',    `${tops}/${totalActive}`, 'text-green-400')}
        {statCard(<Target size={11} />,  'Zones',   zones,                    'text-purple-400')}
        {statCard(<Zap size={11} />,     'Flashes', flashes,                  'text-amber-400')}
      </div>

      {/* Rank banner */}
      {myRank !== null && (
        <div className={`rounded-2xl border p-4 mb-6 flex items-center gap-3 ${dk ? 'bg-purple-400/5 border-purple-400/20' : 'bg-purple-50 border-purple-100'}`}>
          <Trophy size={18} className="text-purple-400 flex-shrink-0" />
          <div>
            <p className={`text-xs font-black uppercase tracking-widest ${dk ? 'text-purple-300' : 'text-purple-700'}`}>Current ranking</p>
            <p className="text-2xl font-black text-purple-400 leading-tight">#{myRank}</p>
          </div>
          <p className={`text-xs ml-auto ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{myScore} pts total</p>
        </div>
      )}

      {/* ── Recent tops ── */}
      {recentTops.length > 0 && (
        <div className={`rounded-2xl border p-5 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className={dk ? 'text-slate-400' : 'text-slate-500'} />
            <h2 className={`text-sm font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>Recent Tops</h2>
          </div>
          <div className="space-y-2">
            {recentTops.map(({ completion, boulder, points }) => {
              if (!boulder) return null
              const isFlash = completion.attempts === 1
              const diff = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
              return (
                <div key={boulder.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${dk ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'bg-slate-50 hover:bg-slate-100'} transition-colors`}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: boulder.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
                      #{boulder.number}{boulder.name ? ` — ${boulder.name}` : ''}
                    </p>
                    <p className={`text-[10px] ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                      {completion.attempts} attempt{completion.attempts !== 1 ? 's' : ''}
                      {diff && <span className="ml-1.5">· {diff.label}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isFlash && (
                      <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20">
                        ⚡ Flash
                      </span>
                    )}
                    <span className={`text-sm font-black text-sky-400`}>{points}<span className={`text-[10px] ml-0.5 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>pts</span></span>
                  </div>
                </div>
              )
            })}
          </div>
          {tops === 0 && (
            <p className={`text-center text-sm py-6 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
              No tops yet — get climbing! 🧗
            </p>
          )}
        </div>
      )}

      {tops === 0 && recentTops.length === 0 && (
        <div className={`rounded-2xl border p-8 text-center ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <p className="text-4xl mb-3">🧗</p>
          <p className={`font-black text-sm ${dk ? 'text-slate-400' : 'text-slate-500'}`}>No activity yet</p>
          <p className={`text-xs mt-1 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Start topping boulders to see your performance here.</p>
        </div>
      )}
    </div>
  )
}