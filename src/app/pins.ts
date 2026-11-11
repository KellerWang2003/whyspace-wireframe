import { useSyncExternalStore } from "react"

// Which projects sit in the rail. Only pinned projects show there; All projects lists every one with a
// pin to switch it. We keep the projects you unpinned, so a new project starts pinned. Kept per browser.
const KEY = "whyspace.rail.unpinned"
let unpinned: string[] = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") } catch { return [] } })()
const listeners = new Set<() => void>()

export function setPinned(id: string, pinned: boolean) {
  unpinned = pinned ? unpinned.filter((u) => u !== id) : [...new Set([...unpinned, id])]
  try { localStorage.setItem(KEY, JSON.stringify(unpinned)) } catch { /* storage blocked */ }
  listeners.forEach((l) => l())
}

const useUnpinned = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => unpinned)

export function usePinned(id: string) {
  return !useUnpinned().includes(id)
}

export function usePinnedFilter() {
  const off = useUnpinned()
  return <T extends { id: string }>(list: T[]) => list.filter((p) => !off.includes(p.id))
}
