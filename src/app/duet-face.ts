import { useSyncExternalStore } from "react"

// Duet faces (Keller picked the painted pebble, Nov 11): every person's Duet has its own face, a watercolor
// pebble in one of the brand's pigments with a small ink face. Each person makes theirs in Duet settings;
// everyone starts with a face picked from their id, so teammates' Duets differ before anyone changes theirs.
export const PIGMENTS = ["apricot", "sky", "rose", "leaf", "forest"] as const
export const SHAPES = ["pebble", "note", "round"] as const
export const EYES = ["dots", "happy", "wide", "wink"] as const
export const MOUTHS = ["smile", "flat", "none"] as const

export type DuetFace = {
  pigment: (typeof PIGMENTS)[number]
  shape: (typeof SHAPES)[number]
  eyes: (typeof EYES)[number]
  mouth: (typeof MOUTHS)[number]
  seed: number
}

// The brand pigments, deepened for Duet faces (Keller, Nov 11: same rule as the count badges). The paint lifts
// a color, so these sit a step more saturated than the flat brand swatches to keep contrast with the face.
export const PIGMENT_HEX: Record<DuetFace["pigment"], string> = { apricot: "#EE8A35", sky: "#4F92BE", rose: "#E3628F", leaf: "#4F8530", forest: "#2A6527" }
// Faces drawn in paper instead of ink on the darker pigments.
export const PAPER_FACE: readonly DuetFace["pigment"][] = ["leaf", "forest"]

const START: Record<string, Partial<DuetFace>> = {
  MC: { pigment: "leaf", shape: "pebble", eyes: "dots", mouth: "smile" },
  CH: { pigment: "rose", shape: "round", eyes: "happy", mouth: "none" },
  TR: { pigment: "sky", shape: "note", eyes: "wide", mouth: "flat" },
  KL: { pigment: "apricot", shape: "pebble", eyes: "wink", mouth: "smile" },
  JK: { pigment: "forest", shape: "round", eyes: "dots", mouth: "flat" },
}

function hash(s: string) {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
const pick = <T,>(list: readonly T[], n: number) => list[n % list.length]

export function startFace(id: string): DuetFace {
  const h = hash(id)
  return { pigment: pick(PIGMENTS, h), shape: pick(SHAPES, h >> 5), eyes: pick(EYES, h >> 7), mouth: pick(MOUTHS, h >> 9), seed: (h % 40) + 1, ...START[id] }
}

export function shuffleFace(): DuetFace {
  const r = () => Math.floor(Math.random() * 1000)
  return { pigment: pick(PIGMENTS, r()), shape: pick(SHAPES, r()), eyes: pick(EYES, r()), mouth: pick(MOUTHS, r()), seed: (r() % 40) + 1 }
}

// The faces people changed (in this prototype only yours can change), remembered in this browser.
const KEY = "whyspace-duet-face"
type Faces = Record<string, DuetFace>
const listeners = new Set<() => void>()

function read(): Faces {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    if (v && typeof v === "object" && !Array.isArray(v)) return (v.faces ?? v) as Faces
  } catch {
    // Storage blocked or unreadable: everyone keeps their starting face.
  }
  return {}
}

let faces = read()

function save(next: Faces) {
  faces = next
  try {
    localStorage.setItem(KEY, JSON.stringify(faces))
  } catch {
    // Storage blocked: the face lasts for this visit.
  }
  for (const listener of listeners) listener()
}

export const faceOf = (id: string): DuetFace => ({ ...startFace(id), ...faces[id] })
export const setDuetFace = (id: string, face: Partial<DuetFace>) => save({ ...faces, [id]: { ...faceOf(id), ...face } })
export const resetDuetFace = (id: string) => {
  const next = { ...faces }
  delete next[id]
  save(next)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDuetFaces() {
  return useSyncExternalStore(subscribe, () => faces)
}

// A person's face, live. Read it from the hook's value (not faceOf), so the React Compiler redraws it when it changes.
export function useDuetFace(id: string): DuetFace {
  const all = useDuetFaces()
  return { ...startFace(id), ...all[id] }
}
