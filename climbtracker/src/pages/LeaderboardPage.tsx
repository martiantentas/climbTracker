import { useState, useMemo, useRef } from 'react'
import { Trophy, Zap, Target, X, Download, FileText, Link2, ChevronDown as ChevDown } from 'lucide-react'

import type { Competition, Competitor, RankResult } from '../types'
import { CompetitionStatus } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaderboardPageProps {
  rankings:      RankResult[]
  competitors?:  Competitor[]
  competition:   Competition
  theme:         'light' | 'dark'
  lang:          Language
  isOrganizer?:  boolean
  currentUserId?: string
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
        px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-[330ms]
        ${active
          ? 'bg-[#7F8BAD]/10 border-[#7F8BAD]/30 text-[#7F8BAD]'
          : dk
            ? 'bg-white/5 border-white/10 text-[#8E8E8E] hover:text-[#EEEEEE] hover:bg-white/10'
            : 'bg-white border-[#EEEEEE] text-[#5C5E62] hover:text-[#121212]'
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
    <span className={`text-sm font-medium tabular-nums w-7 text-center ${theme === 'dark' ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
      #{rank}
    </span>
  )
}

// ─── PODIUM CARD ──────────────────────────────────────────────────────────────

const PODIUM_STYLES = {
  1: {
    medal:    '🥇',
    border:   'border-amber-400/30',
    bgDark:   'bg-amber-400/[0.07]',
    bgLight:  'bg-amber-50',
    text:     'text-amber-500',
    avatarRing: 'border-amber-400/40',
  },
  2: {
    medal:    '🥈',
    border:   'border-[#7F8BAD]/30',
    bgDark:   'bg-[#7F8BAD]/[0.07]',
    bgLight:  'bg-[#7F8BAD]/5',
    text:     'text-[#7F8BAD]',
    avatarRing: 'border-[#7F8BAD]/40',
  },
  3: {
    medal:    '🥉',
    border:   'border-orange-700/30',
    bgDark:   'bg-orange-900/[0.08]',
    bgLight:  'bg-orange-50',
    text:     'text-orange-600',
    avatarRing: 'border-orange-600/30',
  },
} as const

function PodiumCard({
  result, position, theme, competitors, posLabel,
}: {
  result:      RankResult | null
  position:    1 | 2 | 3
  theme:       'light' | 'dark'
  competitors: Competitor[]
  posLabel:    string
}) {
  const dk = theme === 'dark'
  const s  = PODIUM_STYLES[position]

  if (!result) {
    return (
      <div className={`rounded border flex items-center justify-center py-12 ${dk ? 'bg-white/[0.02] border-white/5' : 'bg-[#F4F4F4] border-[#EEEEEE]'}`}>
        <span className={`text-sm ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>–</span>
      </div>
    )
  }

  const live   = competitors.find(c => c.id === result.competitorId) as any
  const avatar = live?.avatar as string | undefined

  return (
    <div className={`
      rounded border ${s.border} ${dk ? s.bgDark : s.bgLight}
      flex flex-col items-center gap-3 px-6 py-8
      transition-colors duration-[330ms]
    `}>
      {/* Avatar */}
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0
        border-2 ${s.avatarRing}
        ${dk ? 'bg-white/5' : 'bg-white'}
      `}>
        {avatar
          ? <span>{avatar}</span>
          : <span className={`text-xl font-medium ${s.text}`}>{result.name.charAt(0).toUpperCase()}</span>
        }
      </div>

      {/* Medal + label */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl">{s.medal}</span>
        <span className={`text-[10px] font-medium uppercase tracking-widest ${s.text}`}>{posLabel}</span>
      </div>

      {/* Name */}
      <p className={`text-sm font-medium text-center leading-snug ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
        {result.name}
      </p>

      {/* Points */}
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-medium ${s.text}`}>{result.totalPoints}</span>
        <span className={`text-[10px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>pts</span>
      </div>
    </div>
  )
}

// ─── PODIUM SECTION ───────────────────────────────────────────────────────────

function PodiumSection({
  top3, theme, competitors,
  allCategories, genderOptions,
  categoryFilters, genderFilters,
  onToggleCategory, onToggleGender, onClearFilters,
  hasActiveFilters, t,
}: {
  top3:             RankResult[]
  theme:            'light' | 'dark'
  competitors:      Competitor[]
  allCategories:    { id: string; name: string }[]
  genderOptions:    string[]
  categoryFilters:  string[]
  genderFilters:    string[]
  onToggleCategory: (name: string) => void
  onToggleGender:   (g: string)    => void
  onClearFilters:   () => void
  hasActiveFilters: boolean
  t:                (typeof translations)[Language]
}) {
  const dk = theme === 'dark'

  const first  = top3[0] ?? null
  const second = top3[1] ?? null
  const third  = top3[2] ?? null

  return (
    <section className={`mb-8 rounded border ${dk ? 'bg-white/[0.02] border-white/10' : 'bg-[#F9F9F9] border-[#EEEEEE]'} p-6`}>

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 text-[#7F8BAD]`}>
            {t.podiumFinalResults}
          </p>
          <h2 className={`text-lg font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {t.podiumWinners}
          </h2>
        </div>
        {hasActiveFilters && (
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded border ${dk ? 'border-[#7F8BAD]/20 text-[#7F8BAD] bg-[#7F8BAD]/5' : 'border-[#7F8BAD]/20 text-[#7F8BAD] bg-[#7F8BAD]/5'}`}>
            {t.podiumFilterHint}
          </span>
        )}
      </div>

      {/* Filter chips */}
      {(allCategories.length > 0 || genderOptions.length > 0) && (
        <div className={`mb-6 pb-5 border-b ${dk ? 'border-white/5' : 'border-[#EEEEEE]'} space-y-2.5`}>
          {allCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium w-16 flex-shrink-0 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.category}
              </span>
              {allCategories.map(cat => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  active={categoryFilters.includes(cat.name)}
                  theme={theme}
                  onClick={() => onToggleCategory(cat.name)}
                />
              ))}
            </div>
          )}
          {genderOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium w-16 flex-shrink-0 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.gender}
              </span>
              {genderOptions.map(g => (
                <FilterChip
                  key={g}
                  label={g}
                  active={genderFilters.includes(g)}
                  theme={theme}
                  onClick={() => onToggleGender(g)}
                />
              ))}
            </div>
          )}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
            >
              <X size={10} /> {t.clearAll}
            </button>
          )}
        </div>
      )}

      {/* Podium — desktop: [2nd · 1st · 3rd] with 1st elevated; mobile: [1st · 2nd · 3rd] */}
      {top3.length === 0 ? (
        <div className={`text-center py-10 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t.noResults}</p>
        </div>
      ) : (
        <>
          {/* Mobile: stack gold → silver → bronze */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            <PodiumCard result={first}  position={1} theme={theme} competitors={competitors} posLabel={t.podiumFirst}  />
            <PodiumCard result={second} position={2} theme={theme} competitors={competitors} posLabel={t.podiumSecond} />
            <PodiumCard result={third}  position={3} theme={theme} competitors={competitors} posLabel={t.podiumThird}  />
          </div>

          {/* Desktop: [silver · gold · bronze], gold elevated */}
          <div className="hidden md:grid md:grid-cols-3 md:items-end gap-4">
            {/* 2nd — normal height */}
            <PodiumCard result={second} position={2} theme={theme} competitors={competitors} posLabel={t.podiumSecond} />
            {/* 1st — elevated via negative margin */}
            <div className="-mt-8">
              <PodiumCard result={first} position={1} theme={theme} competitors={competitors} posLabel={t.podiumFirst} />
            </div>
            {/* 3rd — normal height */}
            <PodiumCard result={third}  position={3} theme={theme} competitors={competitors} posLabel={t.podiumThird}  />
          </div>
        </>
      )}
    </section>
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
  currentUserId,
}: LeaderboardPageProps) {
  const t  = translations[lang]
  const dk = theme === 'dark'

  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [genderFilters,   setGenderFilters]   = useState<string[]>([])
  const [showDownload,    setShowDownload]     = useState(false)
  const [openRowId,       setOpenRowId]       = useState<string | null>(null)
  const downloadRef = useRef<HTMLDivElement>(null)

  const isFinished = competition.status === CompetitionStatus.FINISHED
                  || competition.status === CompetitionStatus.ARCHIVED

  const toggleCategory = (name: string) =>
    setCategoryFilters(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])

  const toggleGender = (g: string) =>
    setGenderFilters(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  function exportCSV() {
    const headers = ['Rank', 'Name', 'BIB', 'Category', 'Gender', 'Points', 'Tops', 'Zones', 'Attempts', 'Flashes']
    const rows = visible.map(r => {
      const cats = competitorCategoryMap.get(r.competitorId) ?? []
      const live = competitors.find(c => c.id === r.competitorId) as any
      const gend = live?.gender ?? (r as any).gender ?? ''
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
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600">#${r.rank}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.bib}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${cats.join(', ')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${gend}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:600;color:#7F8BAD">${r.totalPoints}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.totalTops}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.totalAttempts}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.flashCount}</td>
      </tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><title>${competition.name} — Results</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;color:#121212}h1{font-size:24px;font-weight:500;margin-bottom:4px}p{color:#5C5E62;margin-bottom:24px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;background:#F4F4F4;font-size:11px;color:#5C5E62;border-bottom:2px solid #EEEEEE}</style>
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

  const allCategories = useMemo(() => {
    const comp = competition as any
    const cats: { id: string; name: string }[] =
      comp.traits?.length     ? comp.traits :
      comp.categories?.length ? comp.categories : []
    return cats
  }, [competition])

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

  const genderOptions = useMemo(() => {
    const GENDER_OPTIONS = ['Male', 'Female', 'Other']
    const present = new Set([
      ...competitors.map(c => (c as any).gender),
      ...rankings.map(r => (r as any).gender),
    ].filter(Boolean))
    return GENDER_OPTIONS.filter(g => present.has(g))
  }, [competitors, rankings])

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
  const totalTops  = rankings.reduce((s, r) => s + r.totalTops, 0)
  const topFlasher = rankings.reduce<RankResult | null>((best, r) =>
    !best || r.flashCount > best.flashCount ? r : best, null)

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
            {t.leaderboard}
          </h1>
          <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#5C5E62]'}`}>
            {competition.name} · {competition.status === 'LIVE' ? t.liveStandings : t.finalStandings}
          </p>
        </div>

        {isOrganizer && (
          <div ref={downloadRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowDownload(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium border transition-colors duration-[330ms] ${dk ? 'bg-white/5 border-white/10 text-[#D0D1D2] hover:bg-white/10' : 'bg-white border-[#EEEEEE] text-[#393C41] hover:bg-[#F4F4F4]'}`}
            >
              <Download size={14} />
              {t.leaderboardExport}
              <ChevDown size={12} className={`transition-transform ${showDownload ? 'rotate-180' : ''}`} />
            </button>

            {showDownload && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownload(false)} />
                <div className={`absolute right-0 top-full mt-1 z-20 w-52 rounded border overflow-hidden ${dk ? 'bg-[#121212] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
                  <button onClick={exportCSV} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors duration-[330ms] ${dk ? 'hover:bg-white/5 text-[#D0D1D2]' : 'hover:bg-[#F4F4F4] text-[#393C41]'}`}>
                    <Download size={14} className="text-[#7F8BAD]" />
                    {t.leaderboardDownloadCSV}
                  </button>
                  <button onClick={exportPDF} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors duration-[330ms] border-t ${dk ? 'hover:bg-white/5 text-[#D0D1D2] border-white/5' : 'hover:bg-[#F4F4F4] text-[#393C41] border-[#EEEEEE]'}`}>
                    <FileText size={14} className="text-[#7F8BAD]" />
                    {t.leaderboardDownloadPDF}
                  </button>
                  <button onClick={shareLink} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors duration-[330ms] border-t ${dk ? 'hover:bg-white/5 text-[#D0D1D2] border-white/5' : 'hover:bg-[#F4F4F4] text-[#393C41] border-[#EEEEEE]'}`}>
                    <Link2 size={14} className="text-[#7F8BAD]" />
                    {t.leaderboardCopyLink}
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
          { icon: <Trophy size={12} />, label: t.leaderboardClimbers(rankings.length),    color: 'text-[#7F8BAD]'  },
          { icon: <Target size={12} />, label: t.leaderboardTotalTops(totalTops),        color: 'text-green-500'  },
          { icon: <Zap size={12} />,    label: topFlasher ? `${topFlasher.flashCount} ${t.flashes} — ${topFlasher.name}` : t.noFlashes, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'} ${s.color}`}>
            {s.icon}{s.label}
          </div>
        ))}
      </div>

      {/* ── Podium (FINISHED / ARCHIVED only) ── */}
      {isFinished && (
        <PodiumSection
          top3={visible.slice(0, 3)}
          theme={theme}
          competitors={competitors}
          allCategories={allCategories}
          genderOptions={genderOptions}
          categoryFilters={categoryFilters}
          genderFilters={genderFilters}
          onToggleCategory={toggleCategory}
          onToggleGender={toggleGender}
          onClearFilters={() => { setCategoryFilters([]); setGenderFilters([]) }}
          hasActiveFilters={hasActiveFilters}
          t={t}
        />
      )}

      {/* ── Filters (LIVE only — when FINISHED they live inside PodiumSection) ── */}
      {!isFinished && (allCategories.length > 0 || genderOptions.length > 0) && (
        <div className="mb-5 space-y-3">
          {allCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium w-16 flex-shrink-0 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.category}
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
              <span className={`text-xs font-medium w-16 flex-shrink-0 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.gender}
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
              <span className={`text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {t.leaderboardOfClimbers(visible.length, rankings.length)}
              </span>
              <button
                onClick={() => { setCategoryFilters([]); setGenderFilters([]) }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
              >
                <X size={10} /> {t.clearAll}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filtered count (shown below podium when FINISHED + filters active) ── */}
      {isFinished && hasActiveFilters && visible.length > 0 && (
        <p className={`text-xs mb-4 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {t.leaderboardOfClimbers(visible.length, rankings.length)}
        </p>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div className={`text-center py-16 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          <Trophy size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-sm">{t.noResults}</p>
          <p className="text-xs mt-1">{t.clearFilters2}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {visible.map((result) => {
            const isTop3    = result.rank <= 3
            const isOpen    = openRowId === result.competitorId
            const rowColors = isTop3 && result.rank === 1
              ? dk ? 'bg-amber-400/5 border-amber-400/20' : 'bg-amber-50 border-amber-200'
              : dk ? 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04]' : 'bg-white border-[#EEEEEE] hover:border-[#D0D1D2]'

            return (
              <div
                key={result.competitorId}
                className={`rounded border overflow-hidden transition-colors duration-[330ms] ${rowColors}`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <RankBadge rank={result.rank} theme={theme} />
                  </div>

                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xl ${dk ? 'bg-white/5' : 'bg-[#F4F4F4]'}`}>
                    {(() => {
                      const live = competitors.find(c => c.id === result.competitorId) as any
                      return live?.avatar
                        ? <span>{live.avatar}</span>
                        : <span className={`text-sm font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{result.name.charAt(0).toUpperCase()}</span>
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm truncate ${dk ? 'text-[#EEEEEE]' : 'text-[#121212]'}`}>
                        {result.name}
                      </p>
                      {result.competitorId === currentUserId && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#7F8BAD] text-white tracking-wider">
                          {t.badgeYou}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                      <span>BIB #{result.bib}</span>
                      {(() => {
                        const cats  = competitorCategoryMap.get(result.competitorId) ?? []
                        const label = cats.join(', ')
                        if (!label) return null
                        return (<><span>·</span><span className="font-medium">{label}</span></>)
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
                      <p className={`text-sm font-medium ${dk ? 'text-green-400' : 'text-green-600'}`}>{result.totalTops}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.tops}</p>
                    </div>
                    <div className="text-center hidden lg:block">
                      <p className={`text-sm font-medium ${dk ? 'text-purple-400' : 'text-purple-600'}`}>{result.totalZones ?? 0}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.zones}</p>
                    </div>
                    <div className="text-center hidden lg:block">
                      <p className={`text-sm font-medium ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{result.totalAttempts}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.leaderboardTries}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-sm font-medium text-amber-500">{result.flashCount}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>⚡</p>
                    </div>
                    <div className="text-right min-w-[56px]">
                      <p className="text-xl font-medium text-[#7F8BAD]">{result.totalPoints}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>pts</p>
                    </div>
                    {/* Chevron — mobile only */}
                    <button
                      className={`md:hidden flex-shrink-0 p-1 rounded transition-colors duration-[330ms] ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}
                      onClick={() => setOpenRowId(isOpen ? null : result.competitorId)}
                      aria-label="Toggle details"
                    >
                      <ChevDown size={14} className={`transition-transform duration-[330ms] ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expandable stats — mobile only */}
                {isOpen && (
                  <div className={`md:hidden grid grid-cols-4 border-t px-5 py-3 gap-2 ${dk ? 'border-white/8' : 'border-[#EEEEEE]'}`}>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${dk ? 'text-green-400' : 'text-green-600'}`}>{result.totalTops}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.tops}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${dk ? 'text-purple-400' : 'text-purple-600'}`}>{result.totalZones ?? 0}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.zones}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${dk ? 'text-[#8E8E8E]' : 'text-[#5C5E62]'}`}>{result.totalAttempts}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{t.leaderboardTries}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-500">{result.flashCount}</p>
                      <p className={`text-[9px] ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>⚡</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
