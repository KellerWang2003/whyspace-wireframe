import { useSyncExternalStore } from "react"

// How many lines the tester has sent to each tool window, so the tester's card on the desktop can
// offer the next one. Module state: a reload starts the scenario over.

let sent: Record<string, number> = {}
const listeners = new Set<() => void>()

export function markSent(tool: string) {
  sent = { ...sent, [tool]: (sent[tool] ?? 0) + 1 }
  listeners.forEach((l) => l())
}

export const useSent = (tool: string) =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => sent[tool] ?? 0)
