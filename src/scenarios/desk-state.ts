import { useEffect, useSyncExternalStore } from "react"
import { DESK } from "./desks"
import { appApi, useApp } from "./frame"
import type { ToolEvent } from "./tools/events"

// The desktop's own session: what the tools caught (the pill's list), the pill, the check after a
// share, a clash's "Ask why", and Whyspace's notifications. Module state; a reload starts over.
// emit() is the bridge: a tool's events go into the app through its API.

export type View = "needs" | "alert" | "check"
export type Asked = "none" | "duet-wait" | "duet" | "person"
// The last why you gave in the pill, with the reason the decision had before, for Undo.
export type Saved = { id: string; why: string; before?: string }
export type Desk = {
  caught: string[]
  pill: { open: boolean; view: View }
  // The check opened by a share: the guesses it started with.
  check: string[]
  shared: boolean
  checkClosed: boolean
  asked: Asked
  toast: string | null
  // Something the pill does by itself a moment later.
  auto: "alert" | "check" | "collapse" | null
  // A guess that arrived without a reason: the pill peeks out and asks why.
  peek: string | null
  saved: Saved | null
  // Counts the clashes that arrived, so the pill's yellow trace runs once for each.
  trace: number
}

const INITIAL: Desk = { caught: [], pill: { open: false, view: "needs" }, check: [], shared: false, checkClosed: false, asked: "none", toast: null, auto: null, peek: null, saved: null, trace: 0 }
let desk = INITIAL
const listeners = new Set<() => void>()
export const useDesk = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => desk)
export const getDesk = () => desk
export function setDesk(patch: Partial<Desk> | ((d: Desk) => Partial<Desk>)) {
  desk = { ...desk, ...(typeof patch === "function" ? patch(desk) : patch) }
  listeners.forEach((l) => l())
}

export function emit(e: ToolEvent) {
  const api = appApi()
  if (e.type === "record") {
    api?.record(e.decisions, e.links)
    const ids = e.decisions.map((d) => d.id)
    const clash = e.decisions.some((d) => d.status === "flag")
    // Only a clash opens the pill by itself. A guess without a reason waits in it (asks wait for a pause, like a share).
    setDesk((d) => ({
      caught: [...d.caught.filter((x) => !ids.includes(x)), ...ids],
      auto: clash ? "alert" : d.auto,
      trace: clash ? d.trace + 1 : d.trace,
    }))
  } else if (e.type === "share") {
    api?.addArtifact(e.artifact)
    setDesk({ shared: true, check: e.check, checkClosed: false, auto: e.check.length ? "check" : null })
  } else if (e.type === "done") {
    api?.patchTask(e.task, { status: "done" })
  } else {
    setDesk({ toast: e.text })
  }
}

// Open or close the pill. Closing the check is fine: the work travels as it is, and Today asks
// about what is still a guess.
export const setPill = (open: boolean, view?: View) => setDesk((d) => ({
  pill: { open, view: view ?? d.pill.view },
  checkClosed: d.checkClosed || (!open && d.pill.open && d.pill.view === "check"),
  auto: null,
  peek: open ? null : d.peek,
}))

// Taking the other side of a clash, in the pill or on Today, records what follows from it once.
export function useTakes() {
  const app = useApp()
  const { caught } = useDesk()
  useEffect(() => {
    for (const [id, t] of Object.entries(DESK?.takes ?? {})) {
      if (app.clashes[id]?.choice !== "theirs" || caught.includes(t.decision.id)) continue
      appApi()?.record([t.decision], [t.link])
      setDesk((d) => ({ caught: [...d.caught, t.decision.id] }))
    }
  }, [app, caught])
}
