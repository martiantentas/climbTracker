import { useState, useMemo } from 'react'
import { BarChart2, Users, Mountain, CheckCircle2, Zap, X } from 'lucide-react'
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
    <div className={`rounded border p-4 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
      <p className={`text-[10px] font-medium mb-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{label}</p>
      <p className={`text-3xl font-medium leading-none ${accent}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{sub}</p>}
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

  const [categoryFilters, setCategoryFilters] = useState<string[]>([])

  const toggleCategory = (name: string) =>
    setCategoryFilters(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])

  // ── Filter competitors ──────────────────────────────────────────────────────
  const actualCompetitors = useMemo(() =>
    competitors.filter(c => c.role !== 'organizer' && c.id !== competition.ownerId),
    [competitors, competition.ownerId]
  )

  const filteredCompetitors = useMemo(() => {
    if (categoryFilters.length === 0) return actualCompetitors
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

    // Pass if competitor matches ANY of the selected categories (OR logic)
    return actualCompetitors.filter(c => {
      const cv = c as any
      if (Array.isArray(cv.traitIds) && cv.traitIds.length > 0) {
        return cv.traitIds.some((id: string) => categoryFilters.includes(idToName(id) ?? ''))
      }
      if (cv.categoryId) {
        return categoryFilters.includes(idToName(cv.categoryId) ?? '')
      }
      return false
    })
  }, [actualCompetitors, categoryFilters, competition])

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

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className={`text-2xl font-medium ${dk ? 'text-[#EEEEEE]' : 'text-[#171A20]'}`}>
          Statistics
        </h1>
        <p className={`text-sm mt-1 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          {competition.name} · Live stats
        </p>
      </div>

      {/* ── Filters ── */}
      {categoryOptions.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-medium w-16 flex-shrink-0 ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
              Category
            </span>
            {categoryOptions.map(c => {
              const active = categoryFilters.includes(c.name)
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.name)}
                  className={`
                    px-3 py-1.5 rounded text-xs font-medium border transition-colors duration-[330ms]
                    ${active
                      ? 'bg-[#3E6AE1]/10 border-[#3E6AE1]/30 text-[#3E6AE1]'
                      : dk
                        ? 'bg-white/5 border-white/10 text-[#5C5E62] hover:text-[#D0D1D2] hover:bg-white/10'
                        : 'bg-white border-[#EEEEEE] text-[#8E8E8E] hover:text-[#393C41]'
                    }
                  `}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
          {categoryFilters.length > 0 && (
            <div className="flex items-center gap-3">
              <span className={`text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
                {filteredCompetitors.length} of {actualCompetitors.length} competitors
              </span>
              <button
                onClick={() => setCategoryFilters([])}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors duration-[330ms] ${dk ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
              >
                <X size={10} /> Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Competitors"  value={filteredCompetitors.length}  accent="text-[#3E6AE1]"  theme={theme} />
        <StatCard label="Total tops"   value={totalTops}                   accent="text-green-400"  theme={theme} />
        <StatCard label="Flashes"      value={totalFlashes}                accent="text-amber-400"  theme={theme} />
        <StatCard label="Avg tops"     value={avgTopsPerCompetitor}        accent="text-[#3E6AE1]"  theme={theme} sub="per climber" />
      </div>

      {/* ── Completion rates chart ── */}
      {boulderStats.length > 0 && (
        <div className={`rounded border p-5 mb-6 ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
          <div className="flex items-center gap-2 mb-5">
            <Mountain size={14} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
            <h2 className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>Boulder completion rates</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={boulderStats} barSize={20}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 500, fill: dk ? '#5C5E62' : '#8E8E8E' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: dk ? '#5C5E62' : '#8E8E8E' }}
                axisLine={false} tickLine={false} width={32}
              />
              <Tooltip
                contentStyle={{
                  background: dk ? '#171A20' : '#fff',
                  border: dk ? '1px solid rgba(255,255,255,0.1)' : '1px solid #EEEEEE',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                }}
                formatter={(v) => [`${v ?? 0}%`, 'Completion']}
                cursor={{ fill: dk ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                {boulderStats.map((entry, i) => (
                  <Cell key={i} fill={entry.color || '#3E6AE1'} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Boulder breakdown table ── */}
      <div className={`rounded border overflow-hidden ${dk ? 'bg-white/[0.03] border-white/10' : 'bg-white border-[#EEEEEE]'}`}>
        <div className={`px-5 py-4 border-b flex items-center gap-2 ${dk ? 'border-white/10' : 'border-[#EEEEEE]'}`}>
          <BarChart2 size={14} className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'} />
          <h2 className={`text-sm font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>Boulder breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}>
                {['Boulder', 'Tops', 'Zones', 'Flashes', 'Rate'].map(h => (
                  <th key={h} className="text-[10px] font-medium px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {boulderStats.map((b, i) => (
                <tr key={b.name} className={`border-t transition-colors duration-[330ms] ${dk ? 'border-white/5 hover:bg-white/[0.02]' : 'border-[#F4F4F4] hover:bg-[#F4F4F4]'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: boulderStats[i].color || '#3E6AE1' }} />
                      <span className={`font-medium ${dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}`}>{b.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-green-400">{b.tops}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`font-medium text-[#3E6AE1]`}>{b.zones}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-amber-400">{b.flashes}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full overflow-hidden ${dk ? 'bg-white/10' : 'bg-[#EEEEEE]'}`}>
                        <div
                          className="h-full rounded-full bg-[#3E6AE1]"
                          style={{ width: `${b.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>{b.rate}%</span>
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
