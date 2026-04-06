import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
  page:        number
  pageSize:    number
  totalPages:  number
  totalItems:  number
  onPage:      (p: number) => void
  onPageSize:  (s: number) => void
  theme:       'light' | 'dark'
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function PaginationBar({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPage,
  onPageSize,
  theme,
}: PaginationBarProps) {
  const [customInput, setCustomInput] = useState('')
  const [showCustom,  setShowCustom]  = useState(false)

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, totalItems)

  const btnBase = `
    flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black
    transition-all border
  `
  const btnActive = theme === 'dark'
    ? 'bg-sky-400 text-sky-950 border-sky-400'
    : 'bg-sky-400 text-sky-950 border-sky-400'
  const btnInactive = theme === 'dark'
    ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
  const btnDisabled = theme === 'dark'
    ? 'bg-transparent text-slate-700 border-transparent cursor-not-allowed'
    : 'bg-transparent text-slate-300 border-transparent cursor-not-allowed'

  // Build page number buttons — show max 5 pages around current
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  function handleCustomSize(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(customInput)
    if (!isNaN(n) && n >= 1 && n <= 500) {
      onPageSize(n)
      setShowCustom(false)
      setCustomInput('')
    }
  }

  return (
    <div className={`
      flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-2xl border mt-4
      ${theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200 shadow-sm'}
    `}>

      {/* Left: showing X–Y of Z */}
      <p className={`text-[11px] font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        Showing <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{start}–{end}</span> of <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{totalItems}</span>
      </p>

      {/* Centre: page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className={`w-8 text-center text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-black ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          Rows:
        </span>
        <div className="flex items-center gap-1">
          {PAGE_SIZE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { onPageSize(s); setShowCustom(false) }}
              className={`
                px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all
                ${pageSize === s && !showCustom
                  ? btnActive
                  : btnInactive
                }
              `}
            >
              {s}
            </button>
          ))}

          {/* Custom size */}
          {showCustom ? (
            <form onSubmit={handleCustomSize} className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={500}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="N"
                autoFocus
                className={`
                  w-14 px-2 py-1 rounded-lg border text-[10px] font-black outline-none
                  ${theme === 'dark'
                    ? 'bg-white/5 border-white/20 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                  }
                `}
              />
              <button type="submit" className="px-2 py-1 rounded-lg text-[10px] font-black bg-sky-400 text-sky-950">
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${!PAGE_SIZE_OPTIONS.includes(pageSize) ? btnActive : btnInactive}`}
            >
              {!PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 'Custom'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}