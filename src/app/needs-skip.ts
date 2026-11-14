import { useSyncExternalStore } from "react"
import type { Row } from "./today-model"

// Skipped Needs you cards: out of the stack for now, not done. They wait in the skipped list beside the stack
// until you put them back. Today, the thread page and the rail badge share them.
let skipped: string[] = []
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
const emit = () => { for (const listener of listeners) listener() }

export function skipNeed(id: string) {
  skipped = [...skipped.filter((x) => x !== id), id]
  emit()
}

export function unskipNeed(id: string) {
  skipped = skipped.filter((x) => x !== id)
  emit()
}

export function useSkipped() {
  const all = useSyncExternalStore(subscribe, () => skipped)
  return (r: Row) => all.includes(r.id)
}
