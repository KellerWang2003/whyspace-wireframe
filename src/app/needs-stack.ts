import { useSyncExternalStore } from "react"

// TEMPORARY (Nov 11): options for Today's Needs you stack, picked on the design system page (Needs you section).
// How far the cards behind show, and how the next card arrives. Remove once Keller picks one.
export type StackBehind = "two" | "one" | "tilt"
export type StackMotion = "rise" | "fade" | "none"
export type StackLook = { behind: StackBehind; motion: StackMotion }

const KEY = "whyspace-needs-stack"
const listeners = new Set<() => void>()

function read(): StackLook {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    if (v && typeof v === "object") return { behind: v.behind ?? "two", motion: v.motion ?? "rise" }
  } catch {
    // Storage blocked or unreadable: use the default.
  }
  return { behind: "two", motion: "rise" }
}

let look = read()

export function setStackLook(next: Partial<StackLook>) {
  look = { ...look, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(look))
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStackLook() {
  return useSyncExternalStore(subscribe, () => look)
}
