import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'
import { usePagination } from '../hooks/usePagination'
import { useSortedData } from '../hooks/useSortedData'
import PaginationBar from '../components/PaginationBar'
import SortableHeader from '../components/SortableHeader'

import type { Competition, Boulder, Competitor, Completion } from '../types'
import type { Language } from '../translations'
import { translations } from '../translations'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface AnalyticsPageProps {
  competition:  Competition
  boulders:     Boulder[]
  competitors:  Competitor[]
  completions:  Completion[]
  theme:        'light' | 'dark'
  lang:         Language
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, theme, accent = 'text-sky-400' }: {
  label: string; value: string | number; sub?: string
  theme: 'light' | 'dark'; accent?: string
}) {
  return (
    <div className={`rounded-2xl border p-5 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`text-3xl font-black leading-none ${accent}`}>{value}</p>
      {sub && <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  )
}

// ─── CHART CARD ───────────────────────────────────────────────────────────────

function ChartCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: 'light' | 'dark' }) {
  return (
    <div className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, theme }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className={`px-4 py-3 rounded-xl border shadow-xl text-xs ${theme === 'dark' ? 'bg-slate-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
      <p className="font-black mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-black">{p.value}</span></p>
      ))}
    </div>
  )
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────

export default function AnalyticsPage({
  competition,
  boulders,
  competitors,
  completions,
  theme,
  lang,
}: AnalyticsPageProps) {
  const t = translations[lang]

  const chartColors = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#f87171']
  const gridColor   = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const textColor   = theme === 'dark' ? '#64748b' : '#94a3b8'

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterGender,   setFilterGender]   = useState('all')

  // ── Competitors ──────────────────────────────────────────────────────────
  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.id !== competition.ownerId && c.role !== 'judge'),
    [competitors, competition.ownerId]
  )

  const filteredCompetitors = useMemo(() => {
    let list = actualCompetitors
    if (filterCategory !== 'all') list = list.filter(c => c.categoryId === filterCategory)
    if (filterGender   !== 'all') list = list.filter(c => c.gender     === filterGender)
    return list
  }, [actualCompetitors, filterCategory, filterGender])

  const activeBoulders = useMemo(() =>
    boulders.filter(b => b.status === 'active'),
    [boulders]
  )

  // ── Unique genders for filter dropdown ───────────────────────────────────
  const uniqueGenders = useMemo(() =>
    [...new Set(actualCompetitors.map(c => c.gender).filter(Boolean))] as string[],
    [actualCompetitors]
  )

  // ── Stats (use filteredCompetitors so they react to filters) ─────────────
  const totalCompetitors = filteredCompetitors.length
  const totalCompletions = completions.filter(c =>
    c.topValidated && filteredCompetitors.some(fc => fc.id === c.competitorId)
  ).length
  const totalZones = completions.filter(c =>
    c.hasZone && filteredCompetitors.some(fc => fc.id === c.competitorId)
  ).length

  const avgTopsPerCompetitor = totalCompetitors > 0
    ? (totalCompletions / totalCompetitors).toFixed(1)
    : '0'

  const flashRate = totalCompletions > 0
    ? Math.round(
        completions.filter(c =>
          c.attempts === 1 && c.topValidated &&
          filteredCompetitors.some(fc => fc.id === c.competitorId)
        ).length / totalCompletions * 100
      )
    : 0

  // ── Boulder stats (scoped to filtered competitors) ────────────────────────
  const boulderStats = useMemo(() => {
    const filteredIds = new Set(filteredCompetitors.map(c => c.id))
    return activeBoulders.map(b => {
      const bComps  = completions.filter(c => c.boulderId === b.id && filteredIds.has(c.competitorId))
      const tops    = bComps.filter(c => c.topValidated).length
      const zones   = bComps.filter(c => c.hasZone).length
      const flashes = bComps.filter(c => c.attempts === 1 && c.topValidated).length
      const totalAttempts = bComps.reduce((sum, c) => sum + c.attempts, 0)
      const compRate = totalCompetitors > 0 ? Math.round(tops / totalCompetitors * 100) : 0

      return {
        name:     `#${b.number}`,
        label:    b.name ? `#${b.number} ${b.name}` : `Boulder #${b.number}`,
        tops, zones, flashes,
        attempts: totalAttempts,
        compRate,
      }
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  }, [activeBoulders, completions, filteredCompetitors, totalCompetitors])

  // ── Category distribution (always uses all competitors, not filtered) ─────
  const categoryData = useMemo(() =>
    competition.categories.map((cat, i) => ({
      name:  cat.name,
      value: actualCompetitors.filter(c => c.categoryId === cat.id).length,
      color: chartColors[i % chartColors.length],
    })).filter(d => d.value > 0),
    [competition.categories, actualCompetitors]
  )

  // ── Gender distribution ───────────────────────────────────────────────────
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {}
    actualCompetitors.forEach(c => {
      const g = c.gender || 'Unknown'
      counts[g] = (counts[g] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value], i) => ({
      name, value, color: chartColors[i % chartColors.length],
    }))
  }, [actualCompetitors])

  // ── Score distribution ────────────────────────────────────────────────────
  const scoreDistribution = useMemo(() => {
    const buckets: Record<number, number> = {}
    filteredCompetitors.forEach(c => {
      const tops = completions.filter(x => x.competitorId === c.id && x.topValidated).length
      buckets[tops] = (buckets[tops] ?? 0) + 1
    })
    return Object.entries(buckets)
      .map(([tops, count]) => ({ tops: `${tops} tops`, count }))
      .sort((a, b) => parseInt(a.tops) - parseInt(b.tops))
  }, [filteredCompetitors, completions])

  // ── Sorting + pagination for boulder table ────────────────────────────────
  const { sorted: sortedBoulders, sortKey, sortDir, toggleSort } =
    useSortedData(boulderStats, 'tops', 'desc')

  const { page, pageSize, totalPages, totalItems, pageItems: pagedBoulders, setPage, setPageSize } =
    usePagination(sortedBoulders, 10)

  // ── Select style ─────────────────────────────────────────────────────────
  const selectCls = `
    px-4 py-2.5 rounded-2xl border outline-none text-sm font-black cursor-pointer transition-all
    ${theme === 'dark'
      ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
      : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50'
    }
  `

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.analytics}
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name} · Live stats
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {competition.categories.length > 1 && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
            <option value="all">All categories</option>
            {competition.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {uniqueGenders.length > 1 && (
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className={selectCls}>
            <option value="all">All genders</option>
            {uniqueGenders.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}

        {(filterCategory !== 'all' || filterGender !== 'all') && (
          <button
            onClick={() => { setFilterCategory('all'); setFilterGender('all') }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'}`}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Competitors" value={totalCompetitors}          theme={theme} accent="text-sky-400" />
        <StatCard label="Total Tops"  value={totalCompletions}          sub={`${avgTopsPerCompetitor} avg per climber`} theme={theme} accent="text-green-400" />
        <StatCard label="Total Zones" value={totalZones}                theme={theme} accent="text-purple-400" />
        <StatCard label="Flash Rate"  value={`${flashRate}%`}           sub="of all tops" theme={theme} accent="text-amber-400" />
        <StatCard label="Boulders"    value={activeBoulders.length}     sub={`${boulderStats.filter(b => b.tops === 0).length} unclimbed`} theme={theme} accent="text-slate-400" />
      </div>

      {/* ── Boulder tops + zones chart ── */}
      {boulderStats.length > 0 && (
        <ChartCard title="Boulder performance — tops & zones" theme={theme}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={boulderStats} barGap={2}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: textColor, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '16px', color: textColor }} />
              <Bar dataKey="tops"    name="Tops"    fill="#34d399" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="zones"   name="Zones"   fill="#a78bfa" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="flashes" name="Flashes" fill="#facc15" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

        {/* ── Completion rate per boulder ── */}
        {boulderStats.length > 0 && (
          <ChartCard title="Completion rate per boulder (%)" theme={theme}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={boulderStats} layout="vertical">
                <CartesianGrid horizontal={false} stroke={gridColor} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: textColor, fontWeight: 700 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v: number) => [`${v}%`, 'Completion rate']} />
                <Bar dataKey="compRate" name="Completion %" fill="#38bdf8" radius={[0,4,4,0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Category distribution ── */}
        {categoryData.length > 0 && (
          <ChartCard title={t.fieldDist + ' — category'} theme={theme}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} formatter={(v: number) => [v, 'competitors']} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Gender distribution ── */}
        {genderData.length > 0 && (
          <ChartCard title={t.fieldDist + ' — gender'} theme={theme}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} formatter={(v: number) => [v, 'competitors']} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Score distribution ── */}
        {scoreDistribution.length > 0 && (
          <ChartCard title="Score distribution — tops per climber" theme={theme}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid vertical={false} stroke={gridColor} />
                <XAxis dataKey="tops" tick={{ fontSize: 10, fill: textColor, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip theme={theme} />} formatter={(v: number) => [v, 'climbers']} />
                <Bar dataKey="count" name="Climbers" fill="#fb923c" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

      </div>

      {/* ── Boulder breakdown table with sorting + pagination ── */}
      {boulderStats.length > 0 && (
        <>
          <div className={`rounded-2xl border mt-4 overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>

            {/* Table title */}
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Boulder breakdown
              </p>
            </div>

            {/* Sortable header */}
            <div className={`grid grid-cols-[60px_1fr_80px_80px_80px_80px_100px] gap-2 px-6 py-3 ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50/50'}`}>
              <SortableHeader label="#"        sortKey="name"      activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} />
              <div className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Boulder</div>
              <SortableHeader label="Tops"     sortKey="tops"      activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Zones"    sortKey="zones"     activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Flashes"  sortKey="flashes"   activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="Attempts" sortKey="attempts"  activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
              <SortableHeader label="% Done"   sortKey="compRate"  activeSortKey={sortKey} sortDir={sortDir} onSort={k => { toggleSort(k); setPage(1) }} theme={theme} align="center" />
            </div>

            {/* Rows */}
            {pagedBoulders.map((b, index) => {
              const isEven = index % 2 === 0
              return (
                <div
                  key={b.name}
                  className={`
                    grid grid-cols-[60px_1fr_80px_80px_80px_80px_100px] gap-2
                    px-6 py-3.5 items-center border-t
                    ${theme === 'dark'
                      ? `border-white/5 ${isEven ? 'bg-transparent' : 'bg-white/[0.02]'}`
                      : `border-slate-100 ${isEven ? 'bg-white' : 'bg-slate-50/30'}`
                    }
                  `}
                >
                  <div className={`text-sm font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{b.name}</div>
                  <div className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{b.label}</div>
                  <div className="text-center">
                    <span className={`text-sm font-black ${b.tops > 0 ? 'text-green-400' : theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>{b.tops}</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-black ${b.zones > 0 ? 'text-purple-400' : theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>{b.zones}</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-black ${b.flashes > 0 ? 'text-amber-400' : theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}`}>{b.flashes}</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{b.attempts}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                      <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${b.compRate}%` }} />
                    </div>
                    <span className={`text-[10px] font-black w-8 text-right ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{b.compRate}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          <PaginationBar
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPage={setPage}
            onPageSize={setPageSize}
            theme={theme}
          />
        </>
      )}

    </div>
  )
}