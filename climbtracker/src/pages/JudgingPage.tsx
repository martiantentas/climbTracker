import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Target, CheckCircle2, XCircle, ShieldCheck, Plus, Minus } from 'lucide-react'

import type { Boulder, Competitor, Completion, Competition } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

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
  ) => void
  currentUser:  Competitor
  showSuccess:  (msg: string) => void
}

// ─── BOULDER JUDGING ROW ──────────────────────────────────────────────────────
// One row per puntuable boulder inside a competitor card

interface BoulderJudgingRowProps {
  boulder:    Boulder
  completion: Completion | undefined
  theme:      'light' | 'dark'
  isLocked:   boolean
  onLog:      (attempts: number, hasZone: boolean, zoneAttempts: number, isTop: boolean, zonesReached: number) => void
  onClear:    () => void
}

function BoulderJudgingRow({
  boulder,
  completion,
  theme,
  isLocked,
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

  const rowBg = theme === 'dark'
    ? isTop     ? 'bg-green-400/5 border-green-400/20'
      : hasZone ? 'bg-sky-400/5 border-sky-400/20'
      : hasActivity ? 'bg-white/[0.03] border-white/10'
      : 'bg-white/[0.02] border-white/5'
    : isTop     ? 'bg-green-50 border-green-200'
      : hasZone ? 'bg-sky-50 border-sky-200'
      : 'bg-slate-50 border-slate-200'

  function handleSave() {
    onLog(attempts, hasZone, zoneAttempts, isTop, zonesReached)
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${rowBg}`}>

      {/* Boulder header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: boulder.color }}
        />
        <span className={`text-sm font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
          Boulder #{boulder.number}
          {boulder.name && (
            <span className={`ml-1.5 font-normal ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              — {boulder.name}
            </span>
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {isTop && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
              <CheckCircle2 size={8} /> Topped
            </span>
          )}
          {!isTop && hasZone && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
              <Target size={8} /> {zonesReached}/{totalZones} zone{totalZones !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Zone buttons — one per zone defined on the boulder */}
      {totalZones > 0 && (
        <div className="mb-4">
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Zones reached ({zonesReached}/{totalZones})
          </p>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: totalZones }, (_, i) => {
              const zoneNum     = i + 1
              const isReached   = zonesReached >= zoneNum
              return (
                <button
                  key={zoneNum}
                  disabled={isLocked}
                  onClick={() => {
                    // Toggle: if this zone is already the last reached, decrement; otherwise set to this zone
                    if (zonesReached === zoneNum) {
                      setZonesReached(zoneNum - 1)
                    } else {
                      setZonesReached(zoneNum)
                      if (zoneAttempts === 0) setZoneAttempts(1)
                    }
                  }}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black
                    border transition-all
                    ${isReached
                      ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
                      : theme === 'dark'
                        ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }
                    ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  <Target size={11} />
                  Zone {zoneNum} {isReached ? '✓' : ''}
                </button>
              )
            })}
          </div>

          {/* Zone attempts counter */}
          {hasZone && (
            <div className="flex items-center gap-2 mt-2">
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                Zone attempts:
              </p>
              <button
                onClick={() => setZoneAttempts(z => Math.max(1, z - 1))}
                disabled={isLocked}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
              >
                <Minus size={11} />
              </button>
              <span className={`text-sm font-black w-6 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {zoneAttempts}
              </span>
              <button
                onClick={() => setZoneAttempts(z => z + 1)}
                disabled={isLocked}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'}`}
              >
                <Plus size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top attempts + Top toggle */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Top attempts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttempts(a => Math.max(0, a - 1))}
              disabled={isLocked || attempts === 0}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 disabled:opacity-30' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 disabled:opacity-30'}`}
            >
              <Minus size={12} />
            </button>
            <span className={`text-lg font-black w-8 text-center ${attempts > 0 ? 'text-sky-400' : theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>
              {attempts}
            </span>
            <button
              onClick={() => setAttempts(a => a + 1)}
              disabled={isLocked}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 disabled:opacity-30' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 disabled:opacity-30'}`}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setIsTop(t => !t)}
            disabled={isLocked}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-xs font-black border transition-all
              ${isTop
                ? 'bg-green-400/10 text-green-400 border-green-400/30'
                : theme === 'dark'
                  ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }
              ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <CheckCircle2 size={13} />
            Top {isTop ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex gap-2">
        {!isLocked && (
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg text-xs font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
          >
            Save score
          </button>
        )}
        {hasActivity && !isLocked && (
          <button
            onClick={() => {
              setAttempts(0)
              setZonesReached(0)
              setZoneAttempts(0)
              setIsTop(false)
              onClear()
            }}
            className={`
              flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-black border transition-all
              ${theme === 'dark'
                ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10 border-white/5'
                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-slate-200'
              }
            `}
          >
            <XCircle size={11} /> Clear
          </button>
        )}
      </div>

      {/* Session memory */}
      {completion && (
        <p className={`text-[10px] mt-2 text-center ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`}>
          Saved: {completion.attempts} top att. · {completion.zonesReached ?? 0}/{totalZones} zones · top: {completion.topValidated ? 'yes' : 'no'}
        </p>
      )}
    </div>
  )
}

      {/* Zone + Top toggles */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => { setHasZone(z => !z); if (hasZone) setZoneAttempts(0) }}
          disabled={isLocked}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black
            uppercase tracking-widest border transition-all
            ${hasZone
              ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
              : theme === 'dark'
                ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }
            ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          <Target size={11} />
          Zone {hasZone ? '✓' : ''}
        </button>

        <button
          onClick={() => setIsTop(t => !t)}
          disabled={isLocked}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black
            uppercase tracking-widest border transition-all
            ${isTop
              ? 'bg-green-400/10 text-green-400 border-green-400/30'
              : theme === 'dark'
                ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }
            ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          <CheckCircle2 size={11} />
          Top {isTop ? '✓' : ''}
        </button>

        {/* Clear button */}
        {hasActivity && !isLocked && (
          <button
            onClick={() => {
              setAttempts(0)
              setHasZone(false)
              setZoneAttempts(0)
              setIsTop(false)
              onClear()
            }}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black
              uppercase tracking-widest border transition-all ml-auto
              ${theme === 'dark'
                ? 'text-slate-600 hover:text-red-400 hover:bg-red-400/10 border-white/5'
                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border-slate-200'
              }
            `}
          >
            <XCircle size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Save button */}
      {!isLocked && (
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-lg text-xs font-black bg-sky-400 text-sky-950 hover:bg-sky-300 transition-all"
        >
          Save score
        </button>
      )}

      {/* Session memory note */}
      {completion && (
        <p className={`text-[10px] mt-2 text-center ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`}>
          Last saved: {completion.attempts} attempts · zone: {completion.hasZone ? 'yes' : 'no'} · top: {completion.topValidated ? 'yes' : 'no'}
        </p>
      )}
    </div>
  )
}

// ─── COMPETITOR CARD ──────────────────────────────────────────────────────────

interface CompetitorCardProps {
  competitor:       Competitor
  puntuableBoulders: Boulder[]
  completions:      Completion[]
  theme:            'light' | 'dark'
  isLocked:         boolean
  judgeId:          string
  onLogScore:       JudgingPageProps['onLogScore']
  onClear:          (competitorId: string, boulderId: string) => void
}

function CompetitorCard({
  competitor,
  puntuableBoulders,
  completions,
  theme,
  isLocked,
  judgeId,
  onLogScore,
  onClear,
}: CompetitorCardProps) {
  const [expanded, setExpanded] = useState(false)

  const myCompletions = completions.filter(c => c.competitorId === competitor.id)
  const toppedCount   = myCompletions.filter(c => c.topValidated).length
  const zoneCount     = myCompletions.filter(c => c.hasZone && !c.topValidated).length

  return (
    <div className={`
      rounded-2xl border overflow-hidden transition-all
      ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white shadow-sm'}
    `}>

      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`
          w-full flex items-center gap-4 px-5 py-4 text-left transition-colors
          ${theme === 'dark' ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}
        `}
      >
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
          ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}
        `}>
          {competitor.avatar
            ? <img src={competitor.avatar} alt="" className="w-full h-full object-cover" />
            : <span className={`text-sm font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {competitor.displayName.charAt(0).toUpperCase()}
              </span>
          }
        </div>

        {/* Name + BIB */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            {competitor.displayName}
          </p>
          <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            BIB #{competitor.bibNumber}
          </p>
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {toppedCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
              <CheckCircle2 size={9} /> {toppedCount} top{toppedCount !== 1 ? 's' : ''}
            </span>
          )}
          {zoneCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black text-sky-400 bg-sky-400/10 px-2 py-1 rounded-full border border-sky-400/20">
              <Target size={9} /> {zoneCount} zone{zoneCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {toppedCount}/{puntuableBoulders.length}
          </span>
          {expanded
            ? <ChevronUp size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            : <ChevronDown size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
          }
        </div>
      </button>

      {/* Expanded boulder list */}
      {expanded && (
        <div className={`px-5 pb-5 border-t space-y-3 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest pt-4 mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
            Judge-required boulders
          </p>
          {puntuableBoulders.map(boulder => (
            <BoulderJudgingRow
              key={boulder.id}
              boulder={boulder}
              completion={myCompletions.find(c => c.boulderId === boulder.id)}
              theme={theme}
              isLocked={isLocked}
              onLog={(attempts, hasZone, zoneAttempts, isTop, zonesReached) =>
                onLogScore(competitor.id, boulder.id, attempts, hasZone, zoneAttempts, isTop, judgeId, zonesReached)
                }
              onClear={() => onClear(competitor.id, boulder.id)}
            />
          ))}
        </div>
      )}
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
  const t = translations[lang]
  const [search, setSearch] = useState('')

  // Puntuable boulders only
  const puntuableBoulders = useMemo(() =>
    boulders.filter(b => b.isPuntuable && b.status === 'active'),
    [boulders]
  )

  // Actual competitors only
  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.id !== competition.ownerId && c.role !== 'judge'),
    [competitors, competition.ownerId]
  )

  // Filtered competitors
  const visible = useMemo(() => {
    if (!search.trim()) return actualCompetitors
    const q = search.toLowerCase()
    return actualCompetitors.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      String(c.bibNumber).includes(q)
    )
  }, [actualCompetitors, search])

  // Stats
  const toppedCount  = actualCompetitors.reduce((sum, c) =>
    sum + completions.filter(x => x.competitorId === c.id && x.topValidated).length, 0
  )
  const zoneCount    = actualCompetitors.reduce((sum, c) =>
    sum + completions.filter(x => x.competitorId === c.id && x.hasZone && !x.topValidated).length, 0
  )
  const pendingCount = (actualCompetitors.length * puntuableBoulders.length) - toppedCount - zoneCount

  // Clear a score
  function handleClear(competitorId: string, boulderId: string) {
  onLogScore(competitorId, boulderId, 0, false, 0, false, currentUser.id, 0)
  showSuccess('Score cleared')
  }

  function handleLog(...args: Parameters<typeof onLogScore>) {
  onLogScore(...args)
  showSuccess('Score saved ✓')
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.judging}
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name} · {puntuableBoulders.length} judge-required boulder{puntuableBoulders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Judging method badge */}
      <div className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-6 w-fit
        ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}
      `}>
        <ShieldCheck size={14} className="text-sky-400 flex-shrink-0" />
        <span className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {competition.scoringMethod === 'self_scoring'
            ? 'Fully self-scoring — judging page not active'
            : competition.scoringMethod === 'self_with_approval'
              ? 'Self-scoring with judge approval'
              : 'Hybrid — judge logs puntuable boulders'
          }
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Topped',    value: toppedCount,  color: 'text-green-400' },
          { label: 'Zone only', value: zoneCount,    color: 'text-sky-400'   },
          { label: 'Pending',   value: Math.max(0, pendingCount), color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* No puntuable boulders */}
      {puntuableBoulders.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏔️</p>
          <p className="font-black uppercase tracking-widest text-sm mb-2">No judge-required boulders</p>
          <p className="text-xs">Toggle "Judge Required" when adding or editing a boulder to enable judging.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4
            ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
          `}>
            <Search size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
            <input
              type="text"
              placeholder="Search competitor by name or BIB..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                Clear
              </button>
            )}
          </div>

          {/* Competitor cards */}
          <div className="space-y-3">
            {visible.map(competitor => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                puntuableBoulders={puntuableBoulders}
                completions={completions}
                theme={theme}
                isLocked={competition.isLocked}
                judgeId={currentUser.id}
                onLogScore={handleLog}
                onClear={handleClear}
              />
            ))}
          </div>

          {/* Legend */}
          <div className={`flex items-start gap-3 mt-6 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
            <ShieldCheck size={14} className={`flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              Click a competitor card to expand their judge-required boulders. Use <span className="font-black">+/−</span> to log attempts, toggle <span className="font-black">Zone</span> and <span className="font-black">Top</span>, then hit <span className="font-black">Save score</span>. Previous session data loads automatically.
            </p>
          </div>
        </>
      )}
    </div>
  )
}