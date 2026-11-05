import { useState } from 'react'

// Notion-style saved views for a table page. Each view keeps its own filters, sort and layout,
// and every change made while a view is open saves straight into it. Views are per page and
// per project, kept in this browser.

export type SavedView<F> = { id: string; name: string; filters: F; sort: { key: string; dir: 'asc' | 'desc' } | null; locked?: boolean }

const KEY = 'whyspace.views'

function load<F>(scope: string, seed: SavedView<F>[], blank: F): SavedView<F>[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}')[scope] as SavedView<F>[] | undefined
    // Fill in filter fields added since the view was saved.
    if (stored?.length) return stored.map(v => ({ ...v, filters: { ...blank, ...v.filters } }))
  } catch { /* storage off */ }
  return seed
}

function store<F>(scope: string, views: SavedView<F>[]) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    localStorage.setItem(KEY, JSON.stringify({ ...all, [scope]: views }))
  } catch { /* storage off: views last for this visit */ }
}

export function useSavedViews<F>(scope: string, seed: SavedView<F>[], blank: F) {
  const [views, setViews] = useState<SavedView<F>[]>(() => load(scope, seed, blank))
  const [activeId, setActiveId] = useState(() => views[0]?.id)
  const active = views.find(v => v.id === activeId) ?? views[0]
  const commit = (next: SavedView<F>[]) => { setViews(next); store(scope, next) }
  const patch = (id: string, p: Partial<SavedView<F>>) => commit(views.map(v => (v.id === id ? { ...v, ...p } : v)))

  return {
    views,
    active,
    select: (id: string) => setActiveId(id),
    // Edits to filters or sort land in the open view.
    setFilters: (f: Partial<F>) => patch(active.id, { filters: { ...active.filters, ...f } }),
    resetFilters: () => patch(active.id, { filters: seed.find(s => s.id === active.id)?.filters ?? blank }),
    setSort: (sort: SavedView<F>['sort']) => patch(active.id, { sort }),
    add: () => {
      const v: SavedView<F> = { id: `v${Date.now()}`, name: 'New view', filters: blank, sort: null }
      commit([...views, v]); setActiveId(v.id)
      return v.id
    },
    duplicate: (id: string) => {
      const from = views.find(v => v.id === id)
      if (!from) return
      const v: SavedView<F> = { ...from, id: `v${Date.now()}`, name: `${from.name} copy`, locked: false }
      commit([...views, v]); setActiveId(v.id)
    },
    rename: (id: string, name: string) => patch(id, { name }),
    remove: (id: string) => {
      const next = views.filter(v => v.id !== id)
      commit(next)
      if (id === active.id) setActiveId(next[0]?.id)
    },
  }
}
