import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { SortDir } from '../hooks/useSortedData'

interface SortableHeaderProps {
  label:         string
  sortKey:       string
  activeSortKey: string
  sortDir:       SortDir
  onSort:        (key: string) => void
  theme:         'light' | 'dark'
  align?:        'left' | 'center' | 'right'
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
        flex items-center gap-1 text-[10px] font-medium
        transition-colors duration-[330ms] group
        ${align === 'center' ? 'justify-center w-full' : ''}
        ${align === 'right'  ? 'justify-end w-full'   : ''}
        ${isActive
          ? 'text-[#7F8BAD]'
          : theme === 'dark'
            ? 'text-[#5C5E62] hover:text-[#D0D1D2]'
            : 'text-[#8E8E8E] hover:text-[#393C41]'
        }
      `}
    >
      {label}
      {isActive
        ? sortDir === 'asc'
          ? <ArrowUp   size={11} className="text-[#7F8BAD]" />
          : <ArrowDown size={11} className="text-[#7F8BAD]" />
        : <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-60 transition-opacity" />
      }
    </button>
  )
}
