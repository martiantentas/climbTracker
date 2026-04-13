import { useState, useMemo, useRef } from 'react'
import { Trophy, Zap, Target, X, Download, FileText, Link2, ChevronDown as ChevDown } from 'lucide-react'

import type { Competition, Competitor, RankResult } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  rankings:     RankResult[]
  competitors?: Competitor[]
  competition:  Competition
  theme:        'light' | 'dark'
  lang:         Language
  isOrganizer?: boolean
}

// ─── FILTER CHIP ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, theme, onClick }: {
  label: string; active: boolean; theme: 'light' | 'dark'; onClick: () => void
}) {
  const dk = theme === 'dark'
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-xl text-xs font-black border transition-all
        ${active
          ? 'bg-sky-400/15 border-sky-400/40 text-sky-400'
          : dk
            ? 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm'
        }
      `}
    >
      {label}
    </button>
  )
}

// ─── RANK BADGE ───────────────────────────────────────────────────────────────

function RankBadge({ rank, theme }: { rank: number; theme: 'light' | 'dark' }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return (
    <span className={`text-sm font-black tabular-nums w-7 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
      #{rank}
    </span>
  )
}

// ─── LEADERBOARD PAGE ─────────────────────────────────────────────────────────

export default function LeaderboardPage({
  rankings,
  competitors = [],
  competition,
  theme,
  lang,
  isOrganizer = false,
}: LeaderboardPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  // ── Multi-select filter state ─────────────────────────────────────────────
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [genderFilters,   setGenderFilters]   = useState<string[]>([])
  const [showDownload,    setShowDownload]     = useState(false)
  const downloadRef = useRef<HTMLDivElement>(null)

  const toggleCategory = (name: string) =>
    setCategoryFilters(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])

  const toggleGender = (g: string) =>
    setGenderFilters(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  // ── Export helpers ────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Rank', 'Name', 'BIB', 'Category', 'Gender', 'Points', 'Tops', 'Zones', 'Attempts', 'Flashes']
    const rows = visible.map(r => {
      const cats  = competitorCategoryMap.get(r.competitorId) ?? []
      const live  = competitors.find(c => c.id === r.competitorId) as any
      const gend  = live?.gender ?? (r as any).gender ?? ''
      return [r.rank, r.name, r.bib, cats.join('+'), gend, r.totalPoints, r.totalTops, r.totalZones ?? 0, r.totalAttempts, r.flashCount].join(',')
    })
    const csv  = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${competition.name.replace(/\s+/g, '_')}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowDownload(false)
  }

  function exportPDF() {
    const rows = visible.map(r => {
      const cats = competitorCategoryMap.get(r.competitorId) ?? []
      const live = competitors.find(c => c.id === r.competitorId) as any
      const gend = live?.gender ?? (r as any).gender ?? ''
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:700">#${r.rank}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.bib}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${cats.join(', ')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${gend}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:800;color:#0ea5e9">${r.totalPoints}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.totalTops}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.totalAttempts}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.flashCount}</td>
      </tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><title>${competition.name} — Results</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{font-size:24px;font-weight:900;margin-bottom:4px}p{color:#64748b;margin-bottom:24px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;border-bottom:2px solid #e2e8f0}</style>
    </head><body>
    <h1>${competition.name}</h1>
    <p>${competition.location} · ${new Date(competition.startDate).toLocaleDateString()}</p>
    <table><thead><tr><th>Rank</th><th>Name</th><th>BIB</th><th>Category</th><th>Gender</th><th>Points</th><th>Tops</th><th>Attempts</th><th>Flashes</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 500)
    setShowDownload(false)
  }

  function shareLink() {
    // Public results URL — works for anyone with the link
    const base = window.location.href.split('#')[0]
    const url  = `${base}#/results/${competition.id}`
    navigator.clipboard.writeText(url).then(() => {
      setShowDownload(false)
      alert('Public link copied to clipboard!')
    }).catch(() => {
      prompt('Copy this link:', `${base}#/results/${competition.id}`)
      setShowDownload(false)
    })
  }

  // ── Resolve categories list ───────────────────────────────────────────────
  const allCategories = useMemo(() => {
    const comp = competition as any
    const cats: { id: string; name: string }[] =
      comp.traits?.length     ? comp.traits :
      comp.categories?.length ? comp.categories : []
    return cats
  }, [competition])

  // ── Build competitorId → category names map ───────────────────────────────
  const competitorCategoryMap = useMemo(() => {
    const map      = new Map<string, string[]>()
    const compById = new Map(competitors.map(c => [c.id, c]))
    const comp     = competition as any
    const oldCats: { id: string; name: string }[] = comp.categories ?? []
    const newCats: { id: string; name: string }[] = comp.traits ?? []
    const allCatById = new Map([
      ...oldCats.map(c => [c.id, c.name] as [string, string]),
      ...newCats.map(c => [c.id, c.name] as [string, string]),
    ])
    const oldCatIndexMap = new Map(oldCats.map((c, i) => [c.id, i]))

    function resolveIds(ids: string[]): string[] {
      return ids.map(id => {
        if (allCatById.has(id)) return allCatById.get(id)!
        const idx = oldCatIndexMap.get(id)
        if (idx !== undefined && newCats[idx]) return newCats[idx].name
        return oldCats.find(c => c.id === id)?.name ?? null
      }).filter(Boolean) as string[]
    }

    for (const r of rankings) {
      const live = compById.get(r.competitorId) as any
      const rr   = r as any
      let names: string[] = []
      if (live) {
        if (Array.isArray(live.traitIds) && live.traitIds.length > 0) names = resolveIds(live.traitIds)
        else if (live.categoryId) names = resolveIds([live.categoryId])
      }
      if (names.length === 0) {
        if (Array.isArray(rr.traitIds) && rr.traitIds.length > 0) names = resolveIds(rr.traitIds)
        else if (rr.category && rr.category !== 'Unknown') names = [rr.category]
      }
      map.set(r.competitorId, names)
    }
    return map
  }, [rankings, competitors, competition])

  // ── Gender options — fixed set, only shown if at least one competitor has that gender
  const genderOptions = useMemo(() => {
    const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say']
    const present = new Set([
      ...competitors.map(c => (c as any).gender),
      ...rankings.map(r => (r as any).gender),
    ].filter(Boolean))
    // Keep canonical order, only show genders that exist in the data
    return GENDER_OPTIONS.filter(g => present.has(g))
  }, [competitors, rankings])

  // ── Filtered results — OR logic within each filter group ─────────────────
  const visible = useMemo(() => {
    return rankings.filter(r => {
      if (categoryFilters.length > 0) {
        const cats = competitorCategoryMap.get(r.competitorId) ?? []
        if (!categoryFilters.some(f => cats.includes(f))) return false
      }
      if (genderFilters.length > 0) {
        const live   = competitors.find(c => c.id === r.competitorId) as any
        const gender = live?.gender ?? (r as any).gender
        if (!genderFilters.includes(gender)) return false
      }
      return true
    })
  }, [rankings, categoryFilters, genderFilters, competitorCategoryMap, competitors])

  const hasActiveFilters = categoryFilters.length > 0 || genderFilters.length > 0

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalTops  = rankings.reduce((s, r) => s + r.totalTops, 0)
  const topFlasher = rankings.reduce<RankResult | null>((best, r) =>
    !best || r.flashCount > best.flashCount ? r : best, null)

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
            {t.leaderboard}
          </h1>
          <p className={`text-sm mt-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
            {competition.name} · {competition.status === 'LIVE' ? 'Live standings' : 'Final standings'}
          </p>
        </div>

        {/* Download — organizer only */}
        {isOrganizer && (
          <div ref={downloadRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowDownload(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black border transition-all ${dk ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
            >
              <Download size={15} />
              Export
              <ChevDown size={13} className={`transition-transform ${showDownload ? 'rotate-180' : ''}`} />
            </button>

            {showDownload && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-10" onClick={() => setShowDownload(false)} />
                <div className={`absolute right-0 top-full mt-2 z-20 w-52 rounded-2xl border shadow-xl overflow-hidden ${dk ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  <button onClick={exportCSV} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-left transition-all ${dk ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <Download size={15} className="text-sky-400" />
                    Download CSV
                  </button>
                  <button onClick={exportPDF} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-left transition-all border-t ${dk ? 'hover:bg-white/5 text-slate-200 border-white/5' : 'hover:bg-slate-50 text-slate-700 border-slate-100'}`}>
                    <FileText size={15} className="text-sky-400" />
                    Download PDF
                  </button>
                  <button onClick={shareLink} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-left transition-all border-t ${dk ? 'hover:bg-white/5 text-slate-200 border-white/5' : 'hover:bg-slate-50 text-slate-700 border-slate-100'}`}>
                    <Link2 size={15} className="text-sky-400" />
                    Copy public link
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: <Trophy size={12} />, label: `${rankings.length} climbers`,    color: 'text-sky-400'   },
          { icon: <Target size={12} />, label: `${totalTops} total tops`,        color: 'text-green-400' },
          { icon: <Zap size={12} />,    label: topFlasher ? `${topFlasher.flashCount} flashes — ${topFlasher.name}` : 'No flashes yet', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'} ${s.color}`}>
            {s.icon}{s.label}
          </div>
        ))}
      </div>

      {/* Multi-select filters */}
      {(allCategories.length > 0 || genderOptions.length > 0) && (
        <div className="mb-5 space-y-3">

          {allCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest w-16 flex-shrink-0 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                Category
              </span>
              {allCategories.map(cat => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  active={categoryFilters.includes(cat.name)}
                  theme={theme}
                  onClick={() => toggleCategory(cat.name)}
                />
              ))}
            </div>
          )}

          {genderOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest w-16 flex-shrink-0 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                Gender
              </span>
              {genderOptions.map(g => (
                <FilterChip
                  key={g}
                  label={g}
                  active={genderFilters.includes(g)}
                  theme={theme}
                  onClick={() => toggleGender(g)}
                />
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-3">
              <span className={`text-xs ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                {visible.length} of {rankings.length} climbers
              </span>
              <button
                onClick={() => { setCategoryFilters([]); setGenderFilters([]) }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${dk ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
              >
                <X size={10} /> Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div className={`text-center py-16 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-black uppercase tracking-widest text-sm">No results</p>
          <p className="text-xs mt-1">Try clearing your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((result) => {
            const isTop3 = result.rank <= 3
            return (
              <div
                key={result.competitorId}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all
                  ${isTop3 && result.rank === 1
                    ? dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200'
                    : dk ? 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }
                `}
              >
                <div className="flex-shrink-0 w-8 flex justify-center">
                  <RankBadge rank={result.rank} theme={theme} />
                </div>

                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${dk ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                  {result.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm truncate ${dk ? 'text-slate-100' : 'text-slate-900'}`}>
                    {result.name}
                  </p>
                  <div className={`flex items-center gap-2 text-[10px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span>BIB #{result.bib}</span>
                    {(() => {
                      const cats  = competitorCategoryMap.get(result.competitorId) ?? []
                      const label = cats.join(', ')
                      if (!label) return null
                      return (<><span>·</span><span className="font-black">{label}</span></>)
                    })()}
                    {(() => {
                      const live   = competitors.find(c => c.id === result.competitorId) as any
                      const gender = live?.gender ?? (result as any).gender
                      if (!gender) return null
                      return (<><span>·</span><span>{gender}</span></>)
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-center hidden md:block">
                    <p className={`text-sm font-black ${dk ? 'text-green-400' : 'text-green-600'}`}>{result.totalTops}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Tops</p>
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className={`text-sm font-black ${dk ? 'text-purple-400' : 'text-purple-600'}`}>{result.totalZones ?? 0}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Zones</p>
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className={`text-sm font-black ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{result.totalAttempts}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>Tries</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-black text-amber-400">{result.flashCount}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>⚡</p>
                  </div>
                  <div className="text-right min-w-[56px]">
                    <p className="text-xl font-black text-sky-400">{result.totalPoints}</p>
                    <p className={`text-[9px] uppercase tracking-widest ${dk ? 'text-slate-600' : 'text-slate-400'}`}>pts</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}