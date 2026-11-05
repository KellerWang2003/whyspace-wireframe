import { useState } from 'react'

// One shared way to sort any table by a column.
// Click a header: ascending, then descending, then back to the default order.
// Empty values (undefined, null, '') always sit at the bottom.

export type SortValue = string | number | undefined | null
export type Sort<K extends string> = { key: K; dir: 'asc' | 'desc' } | null

// Pass `controlled` to keep the sort somewhere else, such as a saved view.
export function useSort<T, K extends string>(rows: T[], getters: Record<K, (row: T) => SortValue>, initial: Sort<K> = null, controlled?: { sort: Sort<K>; setSort: (s: Sort<K>) => void }) {
  const [own, setOwn] = useState<Sort<K>>(initial)
  const sort = controlled ? controlled.sort : own
  const setSort = controlled ? controlled.setSort : setOwn
  const toggle = (key: K) => setSort(sort?.key !== key ? { key, dir: 'asc' } : sort.dir === 'asc' ? { key, dir: 'desc' } : null)
  const sorted = !sort ? rows : [...rows].sort((a, b) => {
    const x = getters[sort.key](a), y = getters[sort.key](b)
    const ex = x === undefined || x === null || x === '', ey = y === undefined || y === null || y === ''
    if (ex || ey) return ex === ey ? 0 : ex ? 1 : -1
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })
    return sort.dir === 'asc' ? c : -c
  })
  return { sorted, sort, toggle, setSort }
}
