import { useState, useMemo } from 'react'
import { Plus, SlidersHorizontal, Lock, Mountain, ChevronDown, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

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
type GroupBy      = 'none' | 'color' | 'difficulty'

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
  const [groupBy,      setGroupBy]      = useState<GroupBy>('none')
  const [search,       setSearch]       = useState('')
  const [modalBoulder, setModalBoulder] = useState<Boulder | null | 'new'>(null)
  const [openGroups,   setOpenGroups]   = useState<Record<string, boolean>>({})
  const [pendingDelete, setPendingDelete] = useState<Boulder | null>(null)

  const myCompletions = useMemo(() =>
    completions.filter(c => c.competitorId === currentUser.id),
    [completions, currentUser.id]
  )

  function getPoints(boulder: Boulder): number {
    const completion = myCompletions.find(c => c.boulderId === boulder.id)
    if (!completion) {
      if (competition.scoringType === 'DYNAMIC') {
        const topsCount = completions.filter(c => c.boulderId === boulder.id && c.topValidated).length
        const pot = boulder.maxPoints ?? competition.dynamicPot ?? 1000
        if (topsCount === 0) return pot
        return Math.max(Math.floor(pot / topsCount), competition.minDynamicPoints ?? 0)
      }
      const difficulty = competition.difficultyLevels.find(d => d.id === boulder.difficultyId)
      return difficulty?.basePoints ?? 0
    }
    return calcBoulderPoints(completion, boulder, competition, completions)
  }

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

  function getPenaltyLabel(boulder: Boulder): string {
    const completion = myCompletions.find(c => c.boulderId === boulder.id)
    const shouldPenalize = boulder.penaltyOverride === 'penalize'
      ? true
      : boulder.penaltyOverride === 'no_penalty'
        ? false
        : competition.penalizeAttempts
    if (!completion || !shouldPenalize || completion.attempts <= 1) return ''
    const extra = completion.attempts - 1
    if (competition.penaltyType === 'fixed') {
      return `−${extra * competition.penaltyValue} pts`
    }
    return `−${extra * competition.penaltyValue}%`
  }

  const myTotalScore = useMemo(() => {
    const scores = myCompletions.map(mc => {
      const boulder = boulders.find(b => b.id === mc.boulderId)
      if (!boulder) return 0
      return calcBoulderPoints(mc, boulder, competition, completions)
    })
    const sorted  = [...scores].sort((a, b) => b - a)
    const counted = competition.topKBoulders ? sorted.slice(0, competition.topKBoulders) : sorted
    return counted.reduce((a, b) => a + b, 0)
  }, [myCompletions, boulders, competition, completions])

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
      if (filter === 'completed')  list = list.filter(b =>  myCompletions.some(c => c.boulderId === b.id))
      if (filter === 'incomplete') list = list.filter(b => !myCompletions.some(c => c.boulderId === b.id))
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

  const totalBoulders = boulders.filter(b => b.status === 'active').length
  const toppedCount   = myCompletions.filter(c => c.topValidated).length
  const flashCount    = myCompletions.filter(c => c.attempts === 1 && c.topValidated).length
  const effectivelyLocked = competition.isLocked || (!isOrganizer && !canSelfScore)

  // ── Group boulders for competitor view ──────────────────────────────────────
  const boulderGroups = useMemo((): { key: string; label: string; color?: string; boulders: Boulder[] }[] => {
    if (groupBy === 'none') return [{ key: 'all', label: '', boulders: visibleBoulders }]

    const groups: Map<string, { label: string; color?: string; boulders: Boulder[] }> = new Map()

    if (groupBy === 'color') {
      for (const b of visibleBoulders) {
        const key   = b.color || '__other__'
        const label = b.color
          ? (t.colorNames[b.color.toLowerCase()] ?? t.colorNames[b.color] ?? b.color)
          : t.groupOther
        if (!groups.has(key)) groups.set(key, { label, color: b.color || undefined, boulders: [] })
        groups.get(key)!.boulders.push(b)
      }
    } else {
      // difficulty
      for (const b of visibleBoulders) {
        const diff = competition.difficultyLevels.find(d => d.id === b.difficultyId)
        const key  = diff ? diff.id : '__other__'
        const lbl  = diff ? `${diff.label} (${diff.level})` : t.groupOther
        if (!groups.has(key)) groups.set(key, { label: lbl, boulders: [] })
        groups.get(key)!.boulders.push(b)
      }
    }

    return Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }))
  }, [groupBy, visibleBoulders, competition.difficultyLevels, t.groupOther])

  function isGroupOpen(key: string) {
    // Default: all groups open
    return openGroups[key] !== false
  }

  function toggleGroup(key: string) {
    setOpenGroups(prev => ({ ...prev, [key]: !isGroupOpen(key) }))
  }

  const dk = theme === 'dark'

  function pillCls(active: boolean) {
    return `px-4 py-1.5 rounded text-xs font-medium transition-colors duration-[330ms] ${
      active
        ? 'bg-[#7F8BAD] text-white'
        : dk
          ? 'bg-white/5 text-[#8E8E8E] hover:bg-white/10 hover:text-[#EEEEEE]'
          : 'bg-[#F4F4F4] text-[#5C5E62] hover:bg-[#EEEEEE] hover:text-[#121212]'
    }`
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {t.boulders}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {isOrganizer ? (
              <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
                <span className="font-medium text-[#7F8BAD]">{totalBoulders}</span> active boulders
              </span>
            ) : (
              <>
                <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
                  <span className="font-medium text-[#7F8BAD]">{toppedCount}</span>/{totalBoulders} topped
                </span>
                {flashCount > 0 && (
                  <span className="text-sm font-medium text-amber-500">⚡ {flashCount} flash{flashCount !== 1 ? 'es' : ''}</span>
                )}
              </>
            )}
          </div>
        </div>
        {isOrganizer && (
          <motion.button
            onClick={() => setModalBoulder('new')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#7F8BAD] text-white rounded text-sm font-medium hover:bg-[#6D799B] transition-colors duration-[330ms]"
          >
            <Plus size={15} />
            {t.addBoulder}
          </motion.button>
        )}
      </div>

      {/* ── Self-score summary banner (competitors only) ── */}
      {!isOrganizer && (
        <div className={`flex items-center justify-between gap-4 px-5 py-4 rounded border mb-6 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          <div className="flex items-center gap-6">
            <div>
              <p className={`text-xs font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>My Score</p>
              <p className="text-2xl font-medium text-[#7F8BAD] leading-none">
                {myTotalScore}
                <span className={`text-xs ml-1 font-normal ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>pts</span>
              </p>
            </div>
            <div className={`w-px h-8 ${dk ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />
            <div>
              <p className={`text-xs font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Tops</p>
              <p className={`text-2xl font-medium leading-none ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                {toppedCount}
                <span className={`text-sm font-normal ml-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>/{totalBoulders}</span>
              </p>
            </div>
            {flashCount > 0 && (
              <>
                <div className={`w-px h-8 ${dk ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />
                <div>
                  <p className={`text-xs font-medium mb-0.5 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>Flashes</p>
                  <p className="text-2xl font-medium text-amber-500 leading-none">⚡{flashCount}</p>
                </div>
              </>
            )}
          </div>

          {!canSelfScore && !competition.isLocked && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium ${dk ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              <Lock size={12} /> Judge scoring only
            </div>
          )}
          {competition.isLocked && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium ${dk ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-red-50 text-red-500 border border-red-200'}`}>
              <Lock size={12} /> Results locked
            </div>
          )}
        </div>
      )}

      {/* ── Search ── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded border mb-4 ${dk ? 'bg-white/5 border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
        <SlidersHorizontal size={15} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#8E8E8E]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className={`text-xs font-medium ${dk ? 'text-[#5C5E62] hover:text-[#EEEEEE]' : 'text-[#8E8E8E] hover:text-[#5C5E62]'}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Filter + sort + group pills ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {!isOrganizer && (
          <>
            {(['all', 'completed', 'incomplete'] as FilterStatus[]).map(f => (
              <motion.button key={f} onClick={() => setFilter(f)} className={pillCls(filter === f)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
                {f === 'all' ? t.all : f === 'completed' ? t.completed : t.incomplete}
              </motion.button>
            ))}
            <div className={`w-px h-4 mx-1 ${dk ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />
          </>
        )}
        <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.sortBy}:</span>
        {(['number', 'difficulty'] as SortKey[]).map(s => (
          <motion.button key={s} onClick={() => setSortBy(s)} className={pillCls(sortBy === s)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
            {s === 'number' ? t.number : t.difficulty}
          </motion.button>
        ))}
        {!isOrganizer && (
          <>
            <div className={`w-px h-4 mx-1 ${dk ? 'bg-white/10' : 'bg-[#EEEEEE]'}`} />
            <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.groupBy}:</span>
            {(['none', 'color', 'difficulty'] as GroupBy[]).map(g => (
              <motion.button key={g} onClick={() => { setGroupBy(g); setOpenGroups({}) }} className={pillCls(groupBy === g)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
                {g === 'none' ? t.groupByNone : g === 'color' ? t.groupByColor : t.groupByDiff}
              </motion.button>
            ))}
          </>
        )}
      </div>

      {/* ── Grid / Grouped view ── */}
      {visibleBoulders.length === 0 ? (
        <div className={`text-center py-20 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <Mountain size={40} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium text-sm mb-2">
            {isOrganizer ? 'No boulders yet' : 'No boulders found'}
          </p>
          {isOrganizer && (
            <button
              onClick={() => setModalBoulder('new')}
              className="mt-4 px-6 py-3 bg-[#7F8BAD] text-white rounded font-medium text-sm hover:bg-[#6D799B] transition-colors duration-[330ms]"
            >
              Add your first boulder
            </button>
          )}
        </div>
      ) : groupBy === 'none' ? (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
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
              lang={lang}
              attemptTracking={resolveTracking(boulder, competition)}
              maxFixedAttempts={competition.maxFixedAttempts}
              onToggle={handleToggle}
              onEdit={isOrganizer ? b => setModalBoulder(b) : undefined}
              onDelete={isOrganizer ? () => handleDeleteBoulder(boulder.id) : undefined}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {boulderGroups.map(group => {
            const open = isGroupOpen(group.key)
            return (
              <div
                key={group.key}
                className={`rounded border overflow-hidden ${dk ? 'border-white/[0.08]' : 'border-[#EEEEEE]'}`}
              >
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-[330ms] ${dk ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-[#F4F4F4] hover:bg-[#ECECEC]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {groupBy === 'color' && group.color && (
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                        style={{ background: group.color }}
                      />
                    )}
                    <span className={`text-sm font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                      {group.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dk ? 'bg-white/[0.06] text-[#5C5E62]' : 'bg-white text-[#8E8E8E]'}`}>
                      {group.boulders.length}
                    </span>
                  </div>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.7 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={15} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
                  </motion.span>
                </button>

                {/* Animated content */}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className={`p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 ${dk ? 'bg-[#121212]' : 'bg-white'}`}>
                        {group.boulders.map(boulder => (
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
                            lang={lang}
                            attemptTracking={resolveTracking(boulder, competition)}
                            maxFixedAttempts={competition.maxFixedAttempts}
                            onToggle={handleToggle}
                            onEdit={isOrganizer ? b => setModalBoulder(b) : undefined}
                            onDelete={isOrganizer ? () => handleDeleteBoulder(boulder.id) : undefined}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalBoulder !== null && (
          <BoulderModal
            boulder={modalBoulder === 'new' ? undefined : modalBoulder}
            existingBoulders={boulders}
            competition={competition}
            theme={theme}
            lang={lang}
            onSave={handleSaveBoulder}
            onDelete={isOrganizer ? handleDeleteBoulder : undefined}
            onClose={() => setModalBoulder(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Undo toast ── */}
      <AnimatePresence>
        {pendingDelete && (
          <UndoToast
            key={pendingDelete.id}
            message={`Boulder #${pendingDelete.number}${pendingDelete.name ? ` "${pendingDelete.name}"` : ''} deleted`}
            theme={theme}
            onUndo={() => setPendingDelete(null)}
            onCommit={commitDeleteBoulder}
            onDismiss={() => setPendingDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
