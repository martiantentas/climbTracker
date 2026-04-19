import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
  page:       number
  pageSize:   number
  totalPages: number
  totalItems: number
  onPage:     (p: number) => void
  onPageSize: (s: number) => void
  theme:      'light' | 'dark'
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
  const dk = theme === 'dark'

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, totalItems)

  const btnBase = `flex items-center justify-center w-8 h-8 rounded text-xs font-medium transition-colors duration-[330ms] border`

  const btnActive   = 'bg-[#7F8BAD] text-white border-[#7F8BAD]'
  const btnInactive = dk
    ? 'bg-white/5 text-[#5C5E62] border-white/10 hover:bg-white/10 hover:text-[#D0D1D2]'
    : 'bg-white text-[#5C5E62] border-[#EEEEEE] hover:bg-[#F4F4F4]'
  const btnDisabled = 'bg-transparent text-[#5C5E62]/30 border-transparent cursor-not-allowed'

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
      flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded border mt-4
      ${dk ? 'bg-white/[0.02] border-white/10' : 'bg-white border-[#EEEEEE]'}
    `}>

      <p className={`text-[11px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
        Showing <span className={dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}>{start}–{end}</span> of <span className={dk ? 'text-[#D0D1D2]' : 'text-[#393C41]'}>{totalItems}</span>
      </p>

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
            <span key={`ellipsis-${i}`} className={`w-8 text-center text-xs ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
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

      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-medium ${dk ? 'text-[#5C5E62]' : 'text-[#8E8E8E]'}`}>
          Rows:
        </span>
        <div className="flex items-center gap-1">
          {PAGE_SIZE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { onPageSize(s); setShowCustom(false) }}
              className={`
                px-2.5 py-1 rounded text-[10px] font-medium border transition-colors duration-[330ms]
                ${pageSize === s && !showCustom ? btnActive : btnInactive}
              `}
            >
              {s}
            </button>
          ))}

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
                  w-14 px-2 py-1 rounded border text-[10px] font-medium outline-none
                  ${dk
                    ? 'bg-white/5 border-white/20 text-[#EEEEEE]'
                    : 'bg-[#F4F4F4] border-[#D0D1D2] text-[#121212]'
                  }
                `}
              />
              <button type="submit" className="px-2 py-1 rounded text-[10px] font-medium bg-[#7F8BAD] text-white hover:bg-[#6D799B] transition-colors duration-[330ms]">
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className={`px-2 py-1 rounded text-[10px] font-medium ${dk ? 'text-[#5C5E62] hover:text-[#D0D1D2]' : 'text-[#8E8E8E] hover:text-[#393C41]'}`}
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors duration-[330ms] ${!PAGE_SIZE_OPTIONS.includes(pageSize) ? btnActive : btnInactive}`}
            >
              {!PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 'Custom'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
