import { useSyncExternalStore } from "react"
import type { Decision, Status, Task } from "@/data"
import type { Item } from "@/design-b/work"

// In scenario mode the page is a desktop, and Whyspace runs in a window on it: the same app in an
// iframe (?frame=app), so it behaves as itself at any window size. The frames are the same origin
// and talk through their window objects. The app publishes what the desktop needs (its decisions,
// marks, confirmations and clashes) and an API to write into it; the desktop lets the app bring a
// window forward (a task's "Open Claude") and keeps the address in step with the app's page.

export const IN_APP_FRAME = (() => {
  try {
    return new URLSearchParams(window.location.search).get("frame") === "app"
  } catch {
    return false
  }
})()

export type Settled = { choice: "theirs" | "mine"; reason?: string }
export type AppSnapshot = {
  decisions: Decision[]
  // Each decision's status as the app shows it: a confirmed guess is conf, a follower of a confirmed decision prec.
  status: Record<string, Status>
  confirmed: Record<string, boolean>
  clashes: Record<string, Settled>
  // The Duet: questions you answered for teammates (by Duet line id), and what you asked it, in order.
  duet: { answered: Record<string, string>; asks: string[] }
}
export type AppApi = {
  // Decisions a tool recorded, with the decisions they follow as LINKS edges [followed, follower].
  record: (decisions: Decision[], links: [string, string][]) => void
  settleClash: (id: string, choice: "theirs" | "mine") => void
  // Confirm a decision, with the reason when one was given.
  confirm: (id: string, why?: string) => void
  addArtifact: (item: Item) => void
  patchTask: (id: string, patch: Partial<Task>) => void
  navigate: (path: string) => void
}
export type DeskApi = {
  notify: () => void
  // The page the app shows, for the desktop's address.
  route: (path: string) => void
  // Whether a window for this app is on the desktop ("Claude", "Runway", "whyspace"…), and bring it forward.
  has: (app: string) => boolean
  focus: (app: string) => void
}

type AppWindow = Window & { __whyspace?: { snapshot: AppSnapshot; api: AppApi } }
type DeskWindow = Window & { __desk?: DeskApi }

// ── In the app frame ──

export function deskApi(): DeskApi | undefined {
  if (!IN_APP_FRAME) return undefined
  try {
    return (window.parent as DeskWindow).__desk
  } catch {
    return undefined
  }
}

export function publishApp(snapshot: AppSnapshot, api: AppApi) {
  (window as AppWindow).__whyspace = { snapshot, api }
  deskApi()?.notify()
}

// ── On the desktop ──

let appWindow: AppWindow | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const EMPTY: AppSnapshot = { decisions: [], status: {}, confirmed: {}, clashes: {}, duet: { answered: {}, asks: [] } }

export function attachApp(w: Window | null) {
  appWindow = w as AppWindow | null
  notify()
}
export const appApi = (): AppApi | undefined => appWindow?.__whyspace?.api
export const appSnapshot = (): AppSnapshot => appWindow?.__whyspace?.snapshot ?? EMPTY
export const useApp = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, appSnapshot)

export function installDesk(desk: Omit<DeskApi, "notify">) {
  (window as DeskWindow).__desk = { ...desk, notify }
}
