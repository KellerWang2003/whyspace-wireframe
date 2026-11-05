import { useEffect } from "react"
import type { Mark } from "@/lib/marks"

// Shared pieces of the test scenarios' models (scenarios 2 to 4). A scenario keeps its own reducer
// and data; this is only the vocabulary they share: what the pill catches and how it is marked.

export type Kind = "guess" | "conf" | "prec"
export type Caught = {
  id: string
  title: string
  kind: Kind
  // The reason behind a confirmed line, or whose decision a line follows.
  why?: string
  // Your own words, offered as one-tap reasons for a guess.
  hints: string[]
  when: string
}
export type View = "needs" | "check"
export type Surface = "app" | "desk"

export const markOf = (c: Caught): Mark => (c.kind === "conf" ? "filled" : c.kind === "prec" ? "ringed" : "empty")
export const guesses = (cs: Caught[]) => cs.filter((c) => c.kind === "guess")
export const settled = (cs: Caught[]) => cs.filter((c) => c.kind !== "guess")

// A clock for the menu bar and the chat: minutes since midnight, two minutes per turn.
export const clockFrom = (baseMinutes: number) => (i: number) => {
  const m = baseMinutes + i * 2
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`
}

// Something happens a beat later (a reply, the pill opening by itself).
export function useLater(active: boolean, ms: number, fn: () => void, key: unknown = active) {
  useEffect(() => {
    if (!active) return
    const t = setTimeout(fn, ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, key])
}

export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
