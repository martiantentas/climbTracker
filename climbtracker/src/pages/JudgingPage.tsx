import { useState, useMemo } from 'react'
import { Search, CheckCircle2, XCircle, Clock, ShieldCheck, Target } from 'lucide-react'

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

// ─── VERDICT BADGE ────────────────────────────────────────────────────────────

type Verdict = 'topped' | 'zone_only' | 'rejected' | 'pending'

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const configs = {
    topped:    { icon: <CheckCircle2 size={9} />, label: 'Topped',    cls: 'text-green-400 bg-green-400/10 border-green-400/20'  },
    zone_only: { icon: <Target size={9} />,       label: 'Zone only', cls: 'text-sky-400 bg-sky-400/10 border-sky-400/20'        },
    rejected:  { icon: <XCircle size={9} />,      label: 'Rejected',  cls: 'text-red-400 bg-red-400/10 border-red-400/20'        },
    pending:   { icon: <Clock size={9} />,        label: 'Pending',   cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20'  },
  }
  const cfg = configs[verdict]
  return (
    <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── SCORE ENTRY PANEL ────────────────────────────────────────────────────────
// Expanded panel for logging a score for one competitor on one boulder

interface ScoreEntryProps {
  competitor: Competitor
  boulder:    Boulder
  completion: Completion | undefined
  theme:      'light' | 'dark'
  judgeId:    string
  onLog:      (attempts: number, hasZone: boolean, zoneAttempts: number, isTop: boolean) => void
  onClose:    () => void
}

function ScoreEntry({ competitor, boulder, completion, theme, judgeId, onLog, onClose }: ScoreEntryProps) {
  const [attempts,     setAttempts]     = useState(completion?.attempts     ?? 1)
  const [hasZone,      setHasZone]      = useState(completion?.hasZone      ?? false)
  const [zoneAttempts, setZoneAttempts] = useState(completion?.zoneAttempts ?? 0)
  const [isTop,        setIsTop]        = useState(completion?.topValidated  ?? false)

  const inputCls = `
    w-full px-3 py-2 rounded-xl border outline-none text-sm transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-white focus:border-sky-400/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-400'
    }
  `

  return (
    <div className={`
      mt-2 p-4 rounded-2xl border
      ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <p className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Logging score for <span className="text-sky-400">{competitor.displayName}</span> on Boulder <span className="text-sky-400">#{boulder.number}</span>
        </p>
        <button onClick={onClose} className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Top attempts */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Top Attempts
          </label>
          <input
            type="number"
            min={1}
            value={attempts}
            onChange={e => setAttempts(Math.max(1, Number(e.target.value)))}
            className={inputCls}
          />
        </div>

        {/* Zone attempts */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Zone Attempts
          </label>
          <input
            type="number"
            min={0}
            value={zoneAttempts}
            onChange={e => setZoneAttempts(Math.max(0, Number(e.target.value)))}
            className={inputCls}
            disabled={!hasZone}
          />
        </div>
      </div>

      {/* Zone toggle */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => { setHasZone(z => !z); if (hasZone) setZoneAttempts(0) }}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all
            ${hasZone
              ? 'bg-sky-400/10 text-sky-400 border-sky-400/30'
              : theme === 'dark'
                ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }
          `}
        >
          <Target size={13} />
          Zone reached
        </button>

        {/* Top toggle */}
        <button
          onClick={() => setIsTop(t => !t)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all
            ${isTop
              ? 'bg-green-400/10 text-green-400 border-green-400/30'
              : theme === 'dark'
                ? 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }
          `}
        >
          <CheckCircle2 size={13} />
          Top confirmed
        </button>
      </div>

      {/* Session memory note */}
      {completion && (
        <div className={`text-[10px] mb-3 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-amber-400/5 text-amber-400/70 border border-amber-400/10' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
          ⚠ Previous session loaded — attempts: {completion.attempts}, zone: {completion.hasZone ? 'yes' : 'no'}. Updating will overwrite.
        </div>
      )}

      {/* Submit */}
      <button
        onClick={() => onLog(attempts, hasZone, zoneAttempts, isTop)}
        className="w-full py-3 bg-sky-400 text-sky-950 rounded-xl font-black text-sm hover:bg-sky-300 transition-all"
      >
        Save Score
      </button>
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

  const [search,        setSearch]        = useState('')
  const [filterBoulder, setFilterBoulder] = useState('all')
  const [activeEntry,   setActiveEntry]   = useState<string | null>(null)

  // Puntuable boulders only
  const puntuableBoulders = useMemo(() =>
    boulders.filter(b => b.isPuntuable && b.status === 'active'),
    [boulders]
  )

  // Actual competitors (no organizer, no judges)
  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.id !== competition.ownerId && c.role !== 'judge'),
    [competitors, competition.ownerId]
  )

  // Build rows
  const rows = useMemo(() => {
    return actualCompetitors.flatMap(competitor =>
      puntuableBoulders.map(boulder => {
        const completion = completions.find(
          c => c.competitorId === competitor.id && c.boulderId === boulder.id
        )
        const key = `${competitor.id}-${boulder.id}`

        const verdict: Verdict = !completion
          ? 'pending'
          : completion.topValidated
            ? 'topped'
            : completion.hasZone
              ? 'zone_only'
              : 'pending'

        return { competitor, boulder, completion, key, verdict }
      })
    )
  }, [actualCompetitors, puntuableBoulders, completions])

  // Filtered rows
  const visible = useMemo(() => {
    let list = rows
    if (filterBoulder !== 'all') list = list.filter(r => r.boulder.id === filterBoulder)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.competitor.displayName.toLowerCase().includes(q) ||
        String(r.competitor.bibNumber).includes(q)
      )
    }
    return list
  }, [rows, filterBoulder, search])

  // Stats
  const toppedCount  = rows.filter(r => r.verdict === 'topped').length
  const zoneCount    = rows.filter(r => r.verdict === 'zone_only').length
  const pendingCount = rows.filter(r => r.verdict === 'pending').length

  function handleLog(
    competitorId: string,
    boulderId:    string,
    attempts:     number,
    hasZone:      boolean,
    zoneAttempts: number,
    isTop:        boolean,
  ) {
    onLogScore(competitorId, boulderId, attempts, hasZone, zoneAttempts, isTop, currentUser.id)
    setActiveEntry(null)
    showSuccess(isTop ? 'Top validated ✓' : hasZone ? 'Zone logged ✓' : 'Score saved')
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.judging}
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Log and validate scores on puntuable boulders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Topped',    value: toppedCount,  color: 'text-green-400' },
          { label: 'Zone only', value: zoneCount,    color: 'text-sky-400'   },
          { label: 'Pending',   value: pendingCount, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border flex-1 min-w-[200px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <Search size={14} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
          <input
            type="text"
            placeholder="Search competitor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
          />
        </div>
        <select
          value={filterBoulder}
          onChange={e => setFilterBoulder(e.target.value)}
          className={`px-4 py-2.5 rounded-2xl border outline-none text-sm font-black cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}
        >
          <option value="all">All Boulders</option>
          {puntuableBoulders.map(b => (
            <option key={b.id} value={b.id}>
              Boulder #{b.number}{b.name ? ` — ${b.name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Empty states */}
      {puntuableBoulders.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🏔️</p>
          <p className="font-black uppercase tracking-widest text-sm mb-2">No puntuable boulders</p>
          <p className="text-xs">Mark boulders as Puntuable when creating or editing them.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-black uppercase tracking-widest text-sm">No results found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((row, index) => (
            <div
              key={row.key}
              className={`
                rounded-2xl border overflow-hidden
                ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}
                ${activeEntry === row.key
                  ? theme === 'dark' ? 'bg-white/[0.05]' : 'bg-slate-50'
                  : theme === 'dark' ? 'bg-white/[0.02]' : 'bg-white shadow-sm'
                }
              `}
            >
              {/* Row header */}
              <div className="grid grid-cols-[1fr_100px_100px_120px] gap-3 px-5 py-4 items-center">

                {/* Competitor */}
                <div>
                  <p className={`text-sm font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                    {row.competitor.displayName}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                    BIB #{row.competitor.bibNumber} · Boulder #{row.boulder.number}
                    <span
                      className="ml-1 inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: row.boulder.color }}
                    />
                  </p>
                </div>

                {/* Zone status */}
                <div className="text-center">
                  {row.completion?.hasZone ? (
                    <span className="text-sky-400 text-xs font-black">
                      Zone ✓ ({row.completion.zoneAttempts}A)
                    </span>
                  ) : (
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>No zone</span>
                  )}
                </div>

                {/* Verdict */}
                <div className="flex justify-center">
                  <VerdictBadge verdict={row.verdict} />
                </div>

                {/* Action */}
                <div className="flex justify-end">
                  {competition.isLocked ? (
                    <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Locked</span>
                  ) : (
                    <button
                      onClick={() => setActiveEntry(activeEntry === row.key ? null : row.key)}
                      className={`
                        px-3 py-1.5 rounded-xl text-xs font-black border transition-all
                        ${activeEntry === row.key
                          ? 'bg-sky-400 text-sky-950 border-sky-400'
                          : theme === 'dark'
                            ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }
                      `}
                    >
                      {activeEntry === row.key ? 'Close' : 'Log Score'}
                    </button>
                  )}
                </div>

              </div>

              {/* Expanded score entry */}
              {activeEntry === row.key && (
                <div className={`px-5 pb-5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                  <ScoreEntry
                    competitor={row.competitor}
                    boulder={row.boulder}
                    completion={row.completion}
                    theme={theme}
                    judgeId={currentUser.id}
                    onLog={(attempts, hasZone, zoneAttempts, isTop) =>
                      handleLog(row.competitor.id, row.boulder.id, attempts, hasZone, zoneAttempts, isTop)
                    }
                    onClose={() => setActiveEntry(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className={`flex items-start gap-3 mt-6 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
        <ShieldCheck size={14} className={`flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
        <p className={`text-[11px] leading-relaxed ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          Only <span className="font-black">puntuable boulders</span> appear here. Scores are logged by judges only — competitors cannot self-log on these boulders. Previous session data is loaded automatically so judges can update across multiple attempts.
        </p>
      </div>

    </div>
  )
}