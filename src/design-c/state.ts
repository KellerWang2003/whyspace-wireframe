import { useSyncExternalStore } from "react"
import { SCENES, VIEWERS_C } from "./data"

// Design C's prototype state: who you are viewing as, which scene of the week it is, and what you did
// in this visit (calls you backed, clashes you resolved, talks you joined). No reload on change, so the
// Desk and the app stay in step.

export type Resolution = "took" | "talk"
type State = {
  viewer: string
  scene: number
  // handoff id -> call id -> who backed it and why. Anyone can back a call: the sender at the check,
  // or a receiver who builds on a guess.
  backed: Record<string, Record<string, { who: string; why: string }>>
  // call id -> text the person corrected at the check
  renamed: Record<string, string>
  // handoffs whose check you finished this visit
  checked: Record<string, true>
  // call id -> what you did about its clash
  resolved: Record<string, Resolution>
  // talk id -> state you moved it to this visit
  talks: Record<string, "live" | "done">
  // guesses about to ship, or built on by others, that you said were fine
  shipped: Record<string, true>
  // talk id -> the stance you wrote in a written talk this visit
  stances: Record<string, string>
}

const VIEWER_KEY = "whyspace.c.viewer"
const SCENE_KEY = "whyspace.c.scene"

function load(): State {
  let viewer = "maya"
  let scene = SCENES.length
  try {
    const v = localStorage.getItem(VIEWER_KEY)
    if (v && VIEWERS_C.includes(v)) viewer = v
    const s = Number(localStorage.getItem(SCENE_KEY))
    if (s >= 1 && s <= SCENES.length) scene = s
  } catch {
    // Storage blocked: defaults.
  }
  return { viewer, scene, backed: {}, renamed: {}, checked: {}, resolved: {}, talks: {}, shipped: {}, stances: {} }
}

let state: State = load()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  emit()
}

export function useC() {
  return useSyncExternalStore(subscribe, () => state)
}
export const cNow = () => state

export function setViewerC(viewer: string) {
  try { localStorage.setItem(VIEWER_KEY, viewer) } catch { /* storage blocked */ }
  set({ viewer })
}

export function setScene(scene: number) {
  const next = Math.min(Math.max(scene, 1), SCENES.length)
  try { localStorage.setItem(SCENE_KEY, String(next)) } catch { /* storage blocked */ }
  set({ scene: next })
}
export const stepScene = (by: number) => setScene(state.scene + by)

export function backCall(handoffId: string, callId: string, why: string | null) {
  const now = { ...(state.backed[handoffId] ?? {}) }
  if (why === null) delete now[callId]
  else now[callId] = { who: state.viewer, why }
  set({ backed: { ...state.backed, [handoffId]: now } })
}

export function renameCall(callId: string, text: string) {
  set({ renamed: { ...state.renamed, [callId]: text } })
}

export function finishCheck(handoffId: string) {
  set({ checked: { ...state.checked, [handoffId]: true } })
}

export function resolveClash(callId: string, how: Resolution) {
  set({ resolved: { ...state.resolved, [callId]: how } })
}

export function setTalk(talkId: string, to: "live" | "done") {
  set({ talks: { ...state.talks, [talkId]: to } })
}

export function markShipped(handoffId: string) {
  set({ shipped: { ...state.shipped, [handoffId]: true } })
}

export function setStance(talkId: string, text: string) {
  set({ stances: { ...state.stances, [talkId]: text } })
}

// Forget this visit's actions (debug panel).
export function resetVisit() {
  set({ backed: {}, renamed: {}, checked: {}, resolved: {}, talks: {}, shipped: {}, stances: {} })
}
