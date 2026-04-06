import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { SortDir } from '../hooks/useSortedData'

interface SortableHeaderProps {
  label:     string
  sortKey:   string
  activeSortKey: string
  sortDir:   SortDir
  onSort:    (key: string) => void
  theme:     'light' | 'dark'
  align?:    'left' | 'center' | 'right'
}

export default function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  theme,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = sortKey === activeSortKey

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`
        flex items-center gap-1 text-[10px] font-black uppercase tracking-widest
        transition-all group
        ${align === 'center' ? 'justify-center w-full' : ''}
        ${align === 'right'  ? 'justify-end w-full'   : ''}
        ${isActive
          ? 'text-sky-400'
          : theme === 'dark'
            ? 'text-slate-500 hover:text-slate-300'
            : 'text-slate-400 hover:text-slate-600'
        }
      `}
    >
      {label}
      {isActive
        ? sortDir === 'asc'
          ? <ArrowUp   size={11} className="text-sky-400" />
          : <ArrowDown size={11} className="text-sky-400" />
        : <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-60 transition-opacity" />
      }
    </button>
  )
}