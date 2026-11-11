import { useSyncExternalStore } from "react"

// TEMPORARY: which of the two new No projects yet pieces the app shows, picked on the design
// system page (Illustrations). This browser remembers it. Remove once Keller picks one.
export const NO_PROJECTS_ART = [
  { id: "spools", label: "Three spools" },
  { id: "unroll", label: "One roll, unrolling" },
] as const
type Pick = (typeof NO_PROJECTS_ART)[number]["id"]

const KEY = "whyspace-no-projects-art"
const listeners = new Set<() => void>()
let pick: Pick = (() => {
  try { return localStorage.getItem(KEY) === "unroll" ? "unroll" : "spools" } catch { return "spools" }
})()

export function setNoProjectsArt(next: Pick) {
  pick = next
  try { localStorage.setItem(KEY, next) } catch { /* storage blocked: lasts this visit */ }
  listeners.forEach((l) => l())
}

export function useNoProjectsArt() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => pick)
}
