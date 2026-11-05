import { useSyncExternalStore } from "react"

// Whether the project panel beside the rail is folded away (rail only). Kept per browser.
const KEY = "whyspace.b.panel-collapsed"
let collapsed = (() => { try { return localStorage.getItem(KEY) === "1" } catch { return false } })()
const listeners = new Set<() => void>()

export function setPanelCollapsed(next: boolean) {
  collapsed = next
  try { localStorage.setItem(KEY, next ? "1" : "0") } catch { /* storage blocked */ }
  listeners.forEach((l) => l())
}

export function usePanelCollapsed() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => collapsed)
}
