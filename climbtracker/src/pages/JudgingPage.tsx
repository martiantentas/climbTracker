import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ChevronDown, ChevronUp, Target, CheckCircle2, XCircle, ShieldCheck, Plus, Minus, Star, Mountain } from 'lucide-react'

import type { Boulder, Competitor, Completion, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'
import { calcBoulderPoints } from '../utils/scoring'

// ─── SCORE HELPER ─────────────────────────────────────────────────────────────
// Uses the shared scoring util — identical numbers to the leaderboard.

function calcCompetitorScore(
  competitorId:   string,
  competition:    Competition,
  boulders:       Boulder[],
  allCompletions: Completion[],
): number {
  const myCompletions = allCompletions.filter(c => c.competitorId === competitorId)
  const scores = myCompletions.map(mc => {
    const boulder = boulders.find(b => b.id === mc.boulderId)
    if (!boulder) return 0
    return calcBoulderPoints(mc, boulder, competition, allCompletions)
  })
  if (competition.topKBoulders && scores.length > competition.topKBoulders) {
    return scores.sort((a, b) => b - a).slice(0, competition.topKBoulders).reduce((a, b) => a + b, 0)
  }
  return scores.reduce((a, b) => a + b, 0)
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface JudgingPageProps {
  competition:  Competition
  boulders:     Boulder[]
  competitors:  Competitor[]
  completions:  Completion[]
  theme:        'light' | 'dark'
  lang:         Language
  onLogScore:   (
    competitorId: string,
    boulderId:    string,
    attempts:     number,
    hasZone:      boolean,
    zoneAttempts: number,
    isTop:        boolean,
    judgeId:      string,
    zonesReached: number,
  ) => void
  currentUser:  Competitor
  showSuccess:  (msg: string) => void
}

// ─── BOULDER JUDGING ROW ──────────────────────────────────────────────────────

interface JudgingLabels {
  topped:            string
  zonesReached:      (n: number, m: number) => string
  zoneLabel:         string
  zoneAttempts:      string
  topAttempts:       string
  saveScore:         string
  clear:             string
  topLabel:          string
  requiredBoulders:  string
}

interface BoulderJudgingRowProps {
  boulder:    Boulder
  completion: Completion | undefined
  theme:      'light' | 'dark'
  isLocked:   boolean
  labels:     JudgingLabels
  onLog:      (attempts: number, hasZone: boolean, zoneAttempts: number, isTop: boolean, zonesReached: number) => void
  onClear:    () => void
}

function BoulderJudgingRow({
  boulder,
  completion,
  theme,
  isLocked,
  labels,
  onLog,
  onClear,
}: BoulderJudgingRowProps) {
  const [attempts,      setAttempts]      = useState(completion?.attempts      ?? 0)
  const [zonesReached,  setZonesReached]  = useState(completion?.zonesReached  ?? 0)
  const [zoneAttempts,  setZoneAttempts]  = useState(completion?.zoneAttempts  ?? 0)
  const [isTop,         setIsTop]         = useState(completion?.topValidated  ?? false)

  useMemo(() => {
    setAttempts(completion?.attempts      ?? 0)
    setZonesReached(completion?.zonesReached ?? 0)
    setZoneAttempts(completion?.zoneAttempts  ?? 0)
    setIsTop(completion?.topValidated     ?? false)
  }, [completion])

  const totalZones  = boulder.zoneCount ?? 0
  const hasZone     = zonesReached > 0
  const hasActivity = attempts > 0 || hasZone || isTop
  const dk = theme === 'dark'

  const rowBg = dk
    ? isTop     ? 'bg-green-400/5 border-green-400/20'
      : hasZone ? 'bg-[#7F8BAD]/5 border-[#7F8BAD]/20'
      : hasActivity ? 'bg-white/[0.03] border-white/10'
      : 'bg-white/[0.02] border-white/5'
    : isTop     ? 'bg-green-50 border-green-200'
      : hasZone ? 'bg-[#7F8BAD]/5 border-[#7F8BAD]/20'
      : 'bg-[#F4F4F4] border-[#EEEEEE]'

  function handleSave() {
    onLog(attempts, hasZone, zoneAttempts, isTop, zonesReached)
  }

  const counterBtnCls = `
    w-8 h-8 rounded flex items-center justify-center border transition-colors duration-[330ms]
    ${dk
      ? 'bg-white/5 border-white/10 text-[#5C5E62] hover:bg-white/10 disabled:opacity-30'
      : 'bg-[#F4F4F4] border-[#EEEEEE] text-[#5C5E62] hover:bg-[#EEEEEE] disabled:opacity-30'
    }
  `

  return (
    <div className={`rounded border p-4 transition-colors duration-[330ms] ${rowBg}`}>

      {/* Boulder header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: boulder.color }}
        />
        <span className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
          Boulder #{boulder.number}
          {boulder.name && (
            <span className={`ml-1.5 font-normal ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              — {boulder.name}
            </span>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isTop && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
              <CheckCircle2 size={8} /> {labels.topped}
            </span>
          )}
          {!isTop && hasZone && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-[#7F8BAD] bg-[#7F8BAD]/10 px-2 py-0.5 rounded border border-[#7F8BAD]/20">
              <Target size={8} /> {zonesReached}/{totalZones}
            </span>
          )}
        </div>
      </div>

      {/* Zone buttons */}
      {totalZones > 0 && (
        <div className="mb-4">
          <p className={`text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {labels.zonesReached(zonesReached, totalZones)}
          </p>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: totalZones }, (_, i) => {
              const zoneNum   = i + 1
              const isReached = zonesReached >= zoneNum
              return (
                <motion.button
                  key={zoneNum}
                  disabled={isLocked}
                  onClick={() => {
                    if (zonesReached === zoneNum) {
                      setZonesReached(zoneNum - 1)
                    } else {
                      setZonesReached(zoneNum)
                      if (zoneAttempts === 0) setZoneAttempts(1)
                    }
                  }}
                  whileHover={isLocked ? {} : { scale: 1.05 }}
                  whileTap={isLocked ? {} : { scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium
                    border transition-colors duration-[330ms]
                    ${isReached
                      ? 'bg-[#7F8BAD]/10 text-[#7F8BAD] border-[#7F8BAD]/30'
                      : dk
                        ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10'
                        : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'
                    }
                    ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <Target size={11} />
                  {labels.zoneLabel} {zoneNum} {isReached ? '✓' : ''}
                </motion.button>
              )
            })}
          </div>

          {hasZone && (
            <div className="flex items-center gap-2 mt-2">
              <p className={`text-[10px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {labels.zoneAttempts}
              </p>
              <motion.button
                onClick={() => setZoneAttempts(z => Math.max(1, z - 1))}
                disabled={isLocked}
                whileHover={isLocked ? {} : { scale: 1.12 }} whileTap={isLocked ? {} : { scale: 0.86 }}
                transition={{ type: 'spring', stiffness: 440, damping: 22 }}
                className={counterBtnCls}
              >
                <Minus size={11} />
              </motion.button>
              <span className={`text-sm font-medium w-6 text-center ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>
                {zoneAttempts}
              </span>
              <motion.button
                onClick={() => setZoneAttempts(z => z + 1)}
                disabled={isLocked}
                whileHover={isLocked ? {} : { scale: 1.12 }} whileTap={isLocked ? {} : { scale: 0.86 }}
                transition={{ type: 'spring', stiffness: 440, damping: 22 }}
                className={counterBtnCls}
              >
                <Plus size={11} />
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Top attempts + Top toggle */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className={`text-[10px] font-medium mb-2 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {labels.topAttempts}
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setAttempts(a => Math.max(0, a - 1))}
              disabled={isLocked || attempts === 0}
              whileHover={isLocked ? {} : { scale: 1.12 }} whileTap={isLocked ? {} : { scale: 0.86 }}
              transition={{ type: 'spring', stiffness: 440, damping: 22 }}
              className={counterBtnCls}
            >
              <Minus size={12} />
            </motion.button>
            <span className={`text-lg font-medium w-8 text-center ${
              attempts > 0 ? 'text-[#7F8BAD]' : dk ? 'text-[#5C5E62]' : 'text-[#D0D1D2]'
            }`}>
              {attempts}
            </span>
            <motion.button
              onClick={() => setAttempts(a => a + 1)}
              disabled={isLocked}
              whileHover={isLocked ? {} : { scale: 1.12 }} whileTap={isLocked ? {} : { scale: 0.86 }}
              transition={{ type: 'spring', stiffness: 440, damping: 22 }}
              className={counterBtnCls}
            >
              <Plus size={12} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-end">
          <motion.button
            onClick={() => setIsTop(t => !t)}
            disabled={isLocked}
            whileHover={isLocked ? {} : { scale: 1.04 }}
            whileTap={isLocked ? {} : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 rounded
              text-xs font-medium border transition-colors duration-[330ms]
              ${isTop
                ? 'bg-green-400/10 text-green-400 border-green-400/30'
                : dk
                  ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10'
                  : 'bg-[#F4F4F4] text-[#8E8E8E] border-[#EEEEEE] hover:bg-[#EEEEEE]'
              }
              ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <CheckCircle2 size={13} />
            {labels.topLabel} {isTop ? '✓' : ''}
          </motion.button>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex gap-2">
        {!isLocked && (
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex-1 py-2 rounded text-xs font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            {labels.saveScore}
          </motion.button>
        )}
        {hasActivity && !isLocked && (
          <motion.button
            onClick={() => {
              setAttempts(0)
              setZonesReached(0)
              setZoneAttempts(0)
              setIsTop(false)
              onClear()
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`
              flex items-center gap-1 px-3 py-2 rounded text-xs font-medium border transition-colors duration-[330ms]
              ${dk
                ? 'text-[#5C5E62] hover:text-red-400 hover:bg-red-400/10 border-white/5'
                : 'text-[#8E8E8E] hover:text-red-500 hover:bg-red-50 border-[#EEEEEE]'
              }
            `}
          >
            <XCircle size={11} /> {labels.clear}
          </motion.button>
        )}
      </div>

      {completion && (
        <p className={`text-[10px] mt-2 text-center ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          Saved: {completion.attempts} top att. · {completion.zonesReached ?? 0}/{totalZones} zones · top: {completion.topValidated ? 'yes' : 'no'}
        </p>
      )}
    </div>
  )
}

// ─── COMPETITOR CARD ──────────────────────────────────────────────────────────

interface CompetitorCardProps {
  competitor:        Competitor
  competition:       Competition
  puntuableBoulders: Boulder[]
  allBoulders:       Boulder[]
  completions:       Completion[]
  allCompletions:    Completion[]
  theme:             'light' | 'dark'
  isLocked:          boolean
  judgeId:           string
  labels:            JudgingLabels
  onLogScore:        JudgingPageProps['onLogScore']
  onClear:           (competitorId: string, boulderId: string) => void
}

function CompetitorCard({
  competitor,
  competition,
  puntuableBoulders,
  allBoulders,
  completions,
  allCompletions,
  theme,
  isLocked,
  judgeId,
  labels,
  onLogScore,
  onClear,
}: CompetitorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const dk = theme === 'dark'

  const myCompletions = completions.filter(c => c.competitorId === competitor.id)
  const toppedCount   = myCompletions.filter(c => c.topValidated).length
  const zoneCount     = myCompletions.filter(c => c.hasZone && !c.topValidated).length

  const score = useMemo(() =>
    calcCompetitorScore(competitor.id, competition, allBoulders, allCompletions),
    [competitor.id, competition, allBoulders, allCompletions]
  )

  return (
    <div className={`
      rounded border overflow-hidden transition-colors duration-[330ms]
      ${dk ? 'border-white/10 bg-white/[0.02]' : 'border-[#EEEEEE] bg-white'}
    `}>

      <button
        onClick={() => setExpanded(e => !e)}
        className={`
          w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-[330ms]
          ${dk ? 'hover:bg-white/[0.03]' : 'hover:bg-[#F4F4F4]'}
        `}
      >
        <div className={`
          w-10 h-10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden
          ${dk ? 'bg-white/5' : 'bg-[#F4F4F4]'}
        `}>
          {competitor.avatar
            ? <span className="text-2xl">{competitor.avatar}</span>
            : <span className={`text-sm font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {competitor.displayName.charAt(0).toUpperCase()}
              </span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {competitor.displayName}
          </p>
          <p className={`text-[10px] mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            BIB #{competitor.bibNumber}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded border ${
            score > 0
              ? 'text-[#7F8BAD] bg-[#7F8BAD]/10 border-[#7F8BAD]/20'
              : dk
                ? 'text-[#5C5E62] bg-white/5 border-white/10'
                : 'text-[#8E8E8E] bg-[#F4F4F4] border-[#EEEEEE]'
          }`}>
            <Star size={8} />
            {score} pts
          </span>

          {toppedCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
              <CheckCircle2 size={9} /> {toppedCount} top{toppedCount !== 1 ? 's' : ''}
            </span>
          )}
          {zoneCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-[#7F8BAD] bg-[#7F8BAD]/10 px-2 py-1 rounded border border-[#7F8BAD]/20">
              <Target size={9} /> {zoneCount} zone{zoneCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`text-[10px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
            {toppedCount}/{puntuableBoulders.length}
          </span>
          {expanded
            ? <ChevronUp size={16} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
            : <ChevronDown size={16} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
          }
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={`px-5 pb-5 border-t space-y-3 ${dk ? 'border-white/5' : 'border-[#EEEEEE]'}`}>
              <p className={`text-[10px] font-medium pt-4 mb-3 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {labels.requiredBoulders}
              </p>
              {puntuableBoulders.map(boulder => (
                <BoulderJudgingRow
                  key={boulder.id}
                  boulder={boulder}
                  completion={myCompletions.find(c => c.boulderId === boulder.id)}
                  theme={theme}
                  isLocked={isLocked}
                  labels={labels}
                  onLog={(attempts, hasZone, zoneAttempts, isTop, zonesReached) =>
                    onLogScore(competitor.id, boulder.id, attempts, hasZone, zoneAttempts, isTop, judgeId, zonesReached)
                  }
                  onClear={() => onClear(competitor.id, boulder.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── JUDGING PAGE ─────────────────────────────────────────────────────────────

export default function JudgingPage({
  competition,
  boulders,
  competitors,
  completions,
  theme,
  lang,
  onLogScore,
  currentUser,
  showSuccess,
}: JudgingPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'
  const [search, setSearch] = useState('')

  const judgingLabels: JudgingLabels = {
    topped:           t.topped,
    zonesReached:     t.judgingZonesReached,
    zoneLabel:        t.judgingZoneLabel,
    zoneAttempts:     t.judgingZoneAttempts,
    topAttempts:      t.judgingTopAttempts,
    saveScore:        t.judgingSaveScore,
    clear:            t.clearFilters,
    topLabel:         t.judgingTopLabel,
    requiredBoulders: t.judgingRequiredBoulders,
  }

  const puntuableBoulders = useMemo(() =>
    boulders.filter(b => b.isPuntuable && b.status === 'active'),
    [boulders]
  )

  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.id !== competition.ownerId && c.role !== 'judge' && c.role !== 'organizer'),
    [competitors, competition.ownerId]
  )

  const visible = useMemo(() => {
    if (!search.trim()) return actualCompetitors
    const q = search.toLowerCase()
    return actualCompetitors.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      String(c.bibNumber).includes(q)
    )
  }, [actualCompetitors, search])

  const toppedCount = actualCompetitors.reduce((sum, c) =>
    sum + completions.filter(x => x.competitorId === c.id && x.topValidated).length, 0
  )
  const zoneCount = actualCompetitors.reduce((sum, c) =>
    sum + completions.filter(x => x.competitorId === c.id && x.hasZone && !x.topValidated).length, 0
  )
  const pendingCount = (actualCompetitors.length * puntuableBoulders.length) - toppedCount - zoneCount

  function handleClear(competitorId: string, boulderId: string) {
    onLogScore(competitorId, boulderId, 0, false, 0, false, currentUser.id, 0)
    showSuccess(t.judgingScoreCleared)
  }

  function handleLog(...args: Parameters<typeof onLogScore>) {
    onLogScore(...args)
    showSuccess(t.judgingScoreSaved)
  }

  return (
    <div className="max-w-3xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >

      <div className="mb-6">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
          {t.judging}
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {competition.name} · {t.judgingBoulderCount(puntuableBoulders.length)}
        </p>
      </div>

      <div className={`
        flex items-center gap-2 px-4 py-2.5 rounded border mb-6 w-fit
        ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}
      `}>
        <ShieldCheck size={14} className="text-[#7F8BAD] flex-shrink-0" />
        <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
          {competition.scoringMethod === 'self_scoring'
            ? t.judgingSelfScoringMode
            : competition.scoringMethod === 'self_with_approval'
              ? t.judgingApprovalMode
              : t.judgingHybridMode
          }
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t.topped,        value: toppedCount,              color: 'text-green-400' },
          { label: t.judgingZoneOnly, value: zoneCount,            color: 'text-[#7F8BAD]' },
          { label: t.judgingPending,  value: Math.max(0, pendingCount), color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`rounded border p-4 text-center ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
            <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] font-medium mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {puntuableBoulders.length === 0 ? (
        <div className={`text-center py-20 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <Mountain size={40} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium text-sm mb-2">{t.judgingNoRequired}</p>
          <p className="text-xs">{t.judgingNoRequiredDesc}</p>
        </div>
      ) : (
        <>
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded border mb-4
            ${dk ? 'bg-white/5 border-white/10' : 'bg-white border-[#EEEEEE]'}
          `}>
            <Search size={14} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
            <input
              type="text"
              placeholder={t.judgingSearchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`flex-1 bg-transparent outline-none text-sm ${dk ? 'placeholder:text-[#5C5E62] text-[#EEEEEE]' : 'placeholder:text-[#8E8E8E] text-[#121212]'}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`text-xs font-medium ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}>
                {t.clearFilters}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {visible.map((competitor, index) => (
              <motion.div
                key={competitor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8, delay: index * 0.045 }}
              >
                <CompetitorCard
                  competitor={competitor}
                  competition={competition}
                  puntuableBoulders={puntuableBoulders}
                  allBoulders={boulders}
                  completions={completions}
                  allCompletions={completions}
                  theme={theme}
                  isLocked={competition.isLocked}
                  judgeId={currentUser.id}
                  labels={judgingLabels}
                  onLogScore={handleLog}
                  onClear={handleClear}
                />
              </motion.div>
            ))}
          </div>

          <div className={`flex items-start gap-3 mt-6 p-4 rounded border ${dk ? 'bg-white/[0.02] border-white/5' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
            <ShieldCheck size={14} className={`flex-shrink-0 mt-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`} />
            <p className={`text-[11px] leading-relaxed ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              {t.judgingHelpText}
            </p>
          </div>
        </>
      )}

      </motion.div>
    </div>
  )
}
