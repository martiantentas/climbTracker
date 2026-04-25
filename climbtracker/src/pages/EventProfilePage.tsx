import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Hash, Tag, CheckCircle2, Target, Zap, Trophy, Star, Clock } from 'lucide-react'
import type { Competition, Boulder, Competitor, Completion } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import { calcBoulderPoints } from '../utils/scoring'
import UserAvatar from '../components/UserAvatar'

interface EventProfilePageProps {
  competition:    Competition
  boulders:       Boulder[]
  completions:    Completion[]
  currentUser:    Competitor
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
  lang,
  onUpdateTraits,
}: EventProfilePageProps) {
  const t  = translations[lang]
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
    const sorted  = [...scores].sort((a, b) => b - a)
    const counted = competition.topKBoulders ? sorted.slice(0, competition.topKBoulders) : sorted
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
  const availableTraits: { id: string; name: string }[] = useMemo(() => {
    const c = competition as any
    if (c.traits?.length)     return c.traits
    if (c.categories?.length) return c.categories
    return []
  }, [competition])

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const u = currentUser as any
    if (Array.isArray(u.traitIds) && u.traitIds.length > 0) return u.traitIds
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

  const cardCls = `rounded border p-5 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`

  const statCard = (icon: React.ReactNode, label: string, value: string | number, accent: string) => (
    <div className={`rounded border p-4 flex flex-col gap-1 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
        {icon}{label}
      </div>
      <p className={`text-3xl font-medium leading-none ${accent}`}>{value}</p>
    </div>
  )

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
          {t.eventSettings}
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {competition.name}
        </p>
      </div>

      {/* ── Identity card ── */}
      <div className={`${cardCls} mb-6 flex items-center gap-5`}>
        <UserAvatar
          avatar={currentUser.avatar}
          displayName={currentUser.displayName}
          sizeClass="w-14 h-14"
          className="bg-[#7F8BAD]/10"
          emojiClass="text-3xl"
          iconSize={24}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>{currentUser.displayName}</p>
          <p className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{currentUser.email}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded border flex-shrink-0 ${dk ? 'bg-white/5 border-white/10' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
          <Hash size={14} className="text-[#7F8BAD]" />
          <div>
            <p className={`text-[10px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>BIB</p>
            <p className="text-xl font-medium text-[#7F8BAD] leading-none">{currentUser.bibNumber}</p>
          </div>
        </div>
      </div>

      {/* ── Traits ── */}
      {availableTraits.length > 0 && (
        <div className={`
          rounded border p-5 mb-6
          ${needsTraitSetup
            ? dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200'
            : dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'
          }
        `}>
          <div className="flex items-center gap-2 mb-1">
            <Tag size={14} className={needsTraitSetup ? 'text-amber-400' : dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
            <h2 className={`text-sm font-medium ${
              needsTraitSetup
                ? dk ? 'text-amber-300' : 'text-amber-800'
                : dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'
            }`}>
              {needsTraitSetup ? t.eventProfileSelectCategory : t.eventProfileMyCategories}
            </h2>
          </div>
          <p className={`text-xs mb-4 ${
            needsTraitSetup
              ? dk ? 'text-amber-400/70' : 'text-amber-700'
              : dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'
          }`}>
            {needsTraitSetup
              ? t.eventProfileCategorySetupDesc
              : t.eventProfileCategoryToggleDesc}
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTraits.map(trait => {
              const active = selectedIds.includes(trait.id)
              return (
                <button
                  key={trait.id}
                  onClick={() => toggleTrait(trait.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2.5 rounded text-sm font-medium border transition-colors duration-[330ms]
                    ${active
                      ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30'
                      : dk
                        ? 'bg-white/5 text-[#D0D1D2] border-white/10 hover:bg-white/10 hover:border-white/20'
                        : 'bg-white text-[#393C41] border-[#EEEEEE] hover:bg-[#F4F4F4] hover:border-[#D0D1D2]'
                    }
                  `}
                >
                  {active && <CheckCircle2 size={13} />}
                  {trait.name}
                </button>
              )
            })}
          </div>
          {needsTraitSetup && (
            <p className={`text-[10px] font-medium mt-4 ${dk ? 'text-amber-400/60' : 'text-amber-600/70'}`}>
              {competition.requireTraits ? t.eventProfileRequiredForStandings : t.eventProfileOptional}
            </p>
          )}
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Star size={11} />,   label: t.score,   value: myScore,                  accent: 'text-[#7F8BAD]' },
          { icon: <Trophy size={11} />, label: t.tops,    value: `${tops}/${totalActive}`, accent: 'text-green-400' },
          { icon: <Target size={11} />, label: t.zones,   value: zones,                    accent: 'text-[#7F8BAD]' },
          { icon: <Zap size={11} />,    label: t.flashes, value: flashes,                  accent: 'text-amber-400' },
        ].map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8, delay: index * 0.045 }}
          >
            {statCard(s.icon, s.label, s.value, s.accent)}
          </motion.div>
        ))}
      </div>

      {/* Rank banner */}
      {myRank !== null && (
        <div className={`rounded border p-4 mb-6 flex items-center gap-3 ${dk ? 'bg-[#7F8BAD]/5 border-[#7F8BAD]/20' : 'bg-[#7F8BAD]/5 border-[#7F8BAD]/20'}`}>
          <Trophy size={18} className="text-[#7F8BAD] flex-shrink-0" />
          <div>
            <p className={`text-xs font-medium ${dk ? 'text-[#7F8BAD]/80' : 'text-[#7F8BAD]/80'}`}>{t.eventProfileCurrentRanking}</p>
            <p className="text-2xl font-medium text-[#7F8BAD] leading-tight">#{myRank}</p>
          </div>
          <p className={`text-xs ml-auto ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{myScore} {t.eventProfilePtsTotal}</p>
        </div>
      )}

      {/* ── Recent tops ── */}
      {recentTops.length > 0 && (
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
            <h2 className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{t.eventProfileRecentTops}</h2>
          </div>
          <div className="space-y-2">
            {recentTops.map(({ completion, boulder, points }, index) => {
              if (!boulder) return null
              const isFlash = completion.attempts === 1
              const diff    = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
              return (
                <motion.div
                  key={boulder.id}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded transition-colors duration-[330ms]
                    ${dk ? 'bg-white/[0.02] hover:bg-white/[0.04]' : 'bg-[#F4F4F4] hover:bg-[#EEEEEE]'}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8, delay: index * 0.045 }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: boulder.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
                      #{boulder.number}{boulder.name ? ` — ${boulder.name}` : ''}
                    </p>
                    <p className={`text-[10px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                      {t.eventProfileAttempts(completion.attempts)}
                      {diff && <span className="ml-1.5">· {diff.label}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isFlash && (
                      <span className="text-[9px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        ⚡ Flash
                      </span>
                    )}
                    <span className="text-sm font-medium text-[#7F8BAD]">
                      {points}<span className={`text-[10px] ml-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>pts</span>
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {tops === 0 && recentTops.length === 0 && (
        <div className={`${cardCls} p-8 text-center`}>
          <p className="text-4xl mb-3">🧗</p>
          <p className={`font-medium text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.eventProfileNoActivity}</p>
          <p className={`text-xs mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.eventProfileNoActivityDesc}</p>
        </div>
      )}
    </motion.div>
  )
}
