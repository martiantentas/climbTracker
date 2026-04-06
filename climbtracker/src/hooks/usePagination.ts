import { useState, useMemo } from 'react'

export interface PaginationResult<T> {
  page:        number
  pageSize:    number
  totalPages:  number
  totalItems:  number
  pageItems:   T[]
  setPage:     (p: number) => void
  setPageSize: (s: number) => void
  goNext:      () => void
  goPrev:      () => void
}

export function usePagination<T>(
  items:            T[],
  defaultPageSize:  number = 10,
): PaginationResult<T> {
  const [page,     setPageRaw]  = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Reset to page 1 when items or page size changes
  function setPage(p: number) {
    setPageRaw(Math.min(Math.max(1, p), totalPages))
  }

  function handleSetPageSize(s: number) {
    setPageSize(s)
    setPageRaw(1)
  }

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  return {
    page,
    pageSize,
    totalPages,
    totalItems: items.length,
    pageItems,
    setPage,
    setPageSize: handleSetPageSize,
    goNext: () => setPage(page + 1),
    goPrev: () => setPage(page - 1),
  }
}