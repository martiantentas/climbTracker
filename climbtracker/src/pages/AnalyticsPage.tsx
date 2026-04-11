import { useState, useMemo } from 'react'
import { BarChart2, ChevronDown, Users, Mountain, CheckCircle2, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

import type { Competition, Boulder, Competitor, Completion } from '../types'
import type { Language } from '../translations'

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

function StatCard({
  label, value, sub, accent, theme,
}: {
  label:  string
  value:  string | number
  sub?:   string
  accent: string
  theme:  'light' | 'dark'
}) {
  const dk = theme === 'dark'
  return (
    <div className={`rounded-2xl border p-4 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-3xl font-black leading-none ${accent}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>}
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
}: AnalyticsPageProps) {
  const dk = theme === 'dark'

  // ── Derive category options from competition (categories or traits) ─────────
  const categoryOptions = useMemo(() => {
    const comp = competition as any
    const cats: { id: string; name: string }[] =
      comp.traits?.length    ? comp.traits :
      comp.categories?.length ? comp.categories : []
    return cats
  }, [competition])

  const [categoryFilter, setCategoryFilter] = useState('')

  // ── Filter competitors ──────────────────────────────────────────────────────
  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.role !== 'organizer' && c.id !== competition.ownerId),
    [competitors, competition.ownerId]
  )

  const filteredCompetitors = useMemo(() => {
    if (!categoryFilter) return actualCompetitors
    const comp   = competition as any
    const old    = (comp.categories ?? []) as { id: string; name: string }[]
    const neu    = (comp.traits     ?? []) as { id: string; name: string }[]
    const allById = new Map([
      ...old.map(c => [c.id, c.name] as [string, string]),
      ...neu.map(c => [c.id, c.name] as [string, string]),
    ])
    const oldIndexMap = new Map(old.map((c, i) => [c.id, i]))

    function idToName(id: string): string | undefined {
      if (allById.has(id)) return allById.get(id)
      const idx = oldIndexMap.get(id)
      if (idx !== undefined && neu[idx]) return neu[idx].name
      return old.find(c => c.id === id)?.name
    }

    return actualCompetitors.filter(c => {
      const cv = c as any
      if (Array.isArray(cv.traitIds) && cv.traitIds.length > 0) {
        return cv.traitIds.some((id: string) => idToName(id) === categoryFilter)
      }
      if (cv.categoryId) {
        return idToName(cv.categoryId) === categoryFilter
      }
      return false
    })
  }, [actualCompetitors, categoryFilter, competition])

  // ── Boulder completion rates ─────────────────────────────────────────────────
  const activeBoulders = boulders.filter(b => b.status === 'active')

  const boulderStats = useMemo(() =>
    activeBoulders.map(b => {
      const relevantCompletions = completions.filter(c =>
        c.boulderId === b.id &&
        filteredCompetitors.some(fc => fc.id === c.competitorId)
      )
      const tops    = relevantCompletions.filter(c => c.topValidated).length
      const zones   = relevantCompletions.filter(c => (c.zonesReached ?? 0) > 0 && !c.topValidated).length
      const flashes = relevantCompletions.filter(c => c.topValidated && c.attempts === 1).length
      const total   = filteredCompetitors.length
      return {
        name:       `#${b.number}`,
        tops,
        zones,
        flashes,
        rate:       total > 0 ? Math.round((tops / total) * 100) : 0,
        color:      b.color,
      }
    }).sort((a, b) => b.tops - a.tops),
    [activeBoulders, completions, filteredCompetitors]
  )

  // ── Overall stats ───────────────────────────────────────────────────────────
  const totalTops    = completions.filter(c => c.topValidated && filteredCompetitors.some(f => f.id === c.competitorId)).length
  const totalFlashes = completions.filter(c => c.topValidated && c.attempts === 1 && filteredCompetitors.some(f => f.id === c.competitorId)).length
  const avgTopsPerCompetitor = filteredCompetitors.length > 0
    ? (totalTops / filteredCompetitors.length).toFixed(1)
    : '0'
  const hardestBoulder = boulderStats.find(b => b.rate < 30) ?? boulderStats[boulderStats.length - 1]

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>
          Statistics
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
          {competition.name} · Live stats
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoryOptions.length > 0 && (
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={`
                appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-black border cursor-pointer outline-none transition-all
                ${dk
                  ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                }
              `}
            >
              <option value="">All categories</option>
              {categoryOptions.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dk ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
        )}
        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${dk ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Competitors"  value={filteredCompetitors.length}  accent="text-sky-400"    theme={theme} />
        <StatCard label="Total tops"   value={totalTops}                   accent="text-green-400"  theme={theme} />
        <StatCard label="Flashes"      value={totalFlashes}                accent="text-amber-400"  theme={theme} />
        <StatCard label="Avg tops"     value={avgTopsPerCompetitor}        accent="text-purple-400" theme={theme} sub="per climber" />
      </div>

      {/* ── Completion rates chart ── */}
      {boulderStats.length > 0 && (
        <div className={`rounded-2xl border p-5 mb-6 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-5">
            <Mountain size={14} className={dk ? 'text-slate-400' : 'text-slate-500'} />
            <h2 className={`text-sm font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>Boulder completion rates</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={boulderStats} barSize={20}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: dk ? '#64748b' : '#94a3b8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: dk ? '#64748b' : '#94a3b8' }}
                axisLine={false} tickLine={false} width={32}
              />
              <Tooltip
                contentStyle={{
                  background: dk ? '#0f172a' : '#fff',
                  border: dk ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                }}
                formatter={(v: number) => [`${v}%`, 'Completion']}
                cursor={{ fill: dk ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {boulderStats.map((entry, i) => (
                  <Cell key={i} fill={entry.color || '#38bdf8'} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Boulder breakdown table ── */}
      <div className={`rounded-2xl border overflow-hidden ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`px-5 py-4 border-b flex items-center gap-2 ${dk ? 'border-white/10' : 'border-slate-100'}`}>
          <BarChart2 size={14} className={dk ? 'text-slate-400' : 'text-slate-500'} />
          <h2 className={`text-sm font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>Boulder breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={dk ? 'text-slate-600' : 'text-slate-400'}>
                {['Boulder', 'Tops', 'Zones', 'Flashes', 'Rate'].map(h => (
                  <th key={h} className="text-[10px] font-black uppercase tracking-widest px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boulderStats.map((b, i) => (
                <tr key={b.name} className={`border-t transition-colors ${dk ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-50 hover:bg-slate-50'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: boulderStats[i].color || '#38bdf8' }} />
                      <span className={`font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>{b.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-black text-green-400">{b.tops}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-black ${dk ? 'text-sky-400' : 'text-sky-600'}`}>{b.zones}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-black text-amber-400">{b.flashes}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full overflow-hidden ${dk ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <div
                          className="h-full rounded-full bg-sky-400"
                          style={{ width: `${b.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-black ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{b.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}