import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: string
  dir: SortDir
}

export interface SortedDataResult<T> {
  sorted:    T[]
  sortKey:   string
  sortDir:   SortDir
  toggleSort:(key: string) => void
}

export function useSortedData<T extends Record<string, any>>(
  items:      T[],
  defaultKey: string,
  defaultDir: SortDir = 'desc',
): SortedDataResult<T> {
  const [sort, setSort] = useState<SortState>({ key: defaultKey, dir: defaultDir })

  function toggleSort(key: string) {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    )
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string'
        ? av.localeCompare(bv)
        : av - bv
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [items, sort])

  return { sorted, sortKey: sort.key, sortDir: sort.dir, toggleSort }
}