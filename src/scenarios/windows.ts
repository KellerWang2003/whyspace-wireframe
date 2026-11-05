import { useSyncExternalStore } from "react"

// The scenario desktop's windows: where each one is, which is on top, which are minimized. Module
// state; a reload lays them out again. Every change goes through the functions below.

export type Rect = { x: number; y: number; w: number; h: number }
export type Win = Rect & { z: number; min: boolean; restore: Rect | null }
export type Mode = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

export const MENU_H = 28
// The dock's column on the left; windows fill the rest, menu bar to bottom.
export const DOCK_W = 84
const GAP = 8
const MIN_W = 380
const MIN_H = 260

let wins: Record<string, Win> = {}
let top = 0
let drag: Mode | null = null
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }

export const useWins = () => useSyncExternalStore(subscribe, () => wins)
export const useDrag = () => useSyncExternalStore(subscribe, () => drag)
export const frontOf = (all: Record<string, Win>) => Object.entries(all).filter(([, w]) => !w.min).sort(([, a], [, b]) => b.z - a.z)[0]?.[0]

const area = () => ({ w: window.innerWidth, h: window.innerHeight })

// The first layout: Whyspace large on the left, each tool to the right and behind it, a step apart.
export function layOut(ids: string[], front: string) {
  if (top) return
  const { w: W, h: H } = area()
  const free = W - DOCK_W
  const rects: Record<string, Rect> = {}
  ids.forEach((id, i) => {
    rects[id] = i === 0
      ? { x: DOCK_W, y: MENU_H + GAP, w: Math.round(Math.min(free * 0.72, 1240)), h: H - MENU_H - 2 * GAP }
      : { x: DOCK_W + Math.round(free * 0.3) + (i - 1) * 28, y: MENU_H + 3 * GAP + (i - 1) * 28, w: Math.round(Math.min(free * 0.62, 980)), h: H - MENU_H - 4 * GAP - (i - 1) * 28 }
  })
  const order = [...ids.filter((id) => id !== front), front]
  wins = Object.fromEntries(ids.map((id) => [id, { ...rects[id], z: order.indexOf(id) + 1, min: false, restore: null }]))
  top = ids.length
  changed()
}

const set = (id: string, patch: Partial<Win>) => {
  if (!wins[id]) return
  wins = { ...wins, [id]: { ...wins[id], ...patch } }
  changed()
}

export function focusWin(id: string) {
  const w = wins[id]
  if (!w || (!w.min && w.z === top)) return
  top += 1
  set(id, { z: top, min: false })
}

export const minimizeWin = (id: string) => set(id, { min: true })

// The green light: fill the desktop beside the dock, menu bar to bottom, or go back.
export function toggleMax(id: string) {
  const w = wins[id]
  if (!w) return
  const { w: W, h: H } = area()
  if (w.restore) set(id, { ...w.restore, restore: null })
  else set(id, { x: DOCK_W, y: MENU_H + GAP / 2, w: W - DOCK_W - GAP, h: H - MENU_H - GAP, restore: { x: w.x, y: w.y, w: w.w, h: w.h } })
}

function next(s: Rect, mode: Mode, dx: number, dy: number): Rect {
  const { w: W, h: H } = area()
  if (mode === "move") {
    return { ...s, x: Math.min(W - 120, Math.max(120 - s.w, s.x + dx)), y: Math.min(H - 48, Math.max(MENU_H, s.y + dy)) }
  }
  let { x, y, w, h } = s
  if (mode.includes("e")) w = s.w + dx
  if (mode.includes("s")) h = s.h + dy
  if (mode.includes("w")) { w = s.w - dx; x = s.x + dx }
  if (mode.includes("n")) {
    const ny = Math.max(MENU_H, s.y + dy)
    h = s.h - (ny - s.y)
    y = ny
  }
  if (w < MIN_W) { if (mode.includes("w")) x -= MIN_W - w; w = MIN_W }
  if (h < MIN_H) { if (mode.includes("n")) y -= MIN_H - h; h = MIN_H }
  return { x, y, w, h }
}

// Drag a window by its title bar or resize it by an edge or corner, from a pointerdown until the
// pointer is released. While it lasts the desktop lays a shield over everything, iframes included.
export function dragWin(id: string, mode: Mode, x0: number, y0: number) {
  const start = wins[id]
  if (!start) return
  drag = mode
  // No text selection while the pointer is down.
  document.getSelection()?.removeAllRanges()
  document.body.style.userSelect = "none"
  changed()
  const onMove = (e: PointerEvent) => set(id, next(start, mode, e.clientX - x0, e.clientY - y0))
  const onUp = () => {
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    window.removeEventListener("pointercancel", onUp)
    document.body.style.userSelect = ""
    drag = null
    changed()
  }
  window.addEventListener("pointermove", onMove)
  window.addEventListener("pointerup", onUp)
  window.addEventListener("pointercancel", onUp)
}

// Keep every window reachable when the browser window shrinks.
export function clampWins() {
  const { w: W, h: H } = area()
  let moved = false
  const all = Object.fromEntries(Object.entries(wins).map(([id, w]) => {
    const x = Math.min(W - 120, Math.max(120 - w.w, w.x))
    const y = Math.min(H - 48, Math.max(MENU_H, w.y))
    if (x !== w.x || y !== w.y) moved = true
    return [id, { ...w, x, y }]
  }))
  if (moved) { wins = all; changed() }
}
