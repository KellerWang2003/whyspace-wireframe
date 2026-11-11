import { PIGMENT, handPath } from "@/components/brand/hand"

// Painted and hand-drawn pieces for the second round of the high-fi playground (#/playground/paint), as CSS
// background images. Each is an SVG drawn with the brand's hand-made shape kit (handPath) and roughened like
// pigment on paper, so the components stay plain HTML and only their surfaces change.

type Pt = [number, number]
const rect = (w: number, h: number, i: number): Pt[] => [[i, i], [w - i, i], [w - i, h - i], [i, h - i]]

const url = (viewBox: string, body: string, stretch = true) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'${stretch ? " preserveAspectRatio='none'" : ""}>${body}</svg>`)}")`

// Ragged edges, like pigment bleeding into paper.
const rough = (freq: number, scale: number, seed: number) =>
  `<filter id='r' x='-10%' y='-10%' width='120%' height='120%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' seed='${seed}'/><feDisplacementMap in='SourceGraphic' scale='${scale}'/></filter>`
// Watercolor body: the pigment pools darker in places and lifts lighter in others.
const wash = (seed: number) =>
  `<filter id='w' x='-10%' y='-10%' width='120%' height='120%'><feTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' seed='${seed}' result='e'/><feDisplacementMap in='SourceGraphic' in2='e' scale='3' result='c'/><feTurbulence type='fractalNoise' baseFrequency='0.015 0.04' numOctaves='3' seed='${seed + 7}' result='n'/><feColorMatrix in='n' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.3 1.25' result='m'/><feComposite in='c' in2='m' operator='in' result='p'/><feMerge><feMergeNode in='c'/><feMergeNode in='p'/></feMerge></filter>`

/** A painted, hand-cut surface: fill a box with it (stretches). */
export function paintedSurface(color: string, { w = 200, h = 40, radius = 12, seed = 3, opacity = 0.9, wobble = 1.4 } = {}) {
  const d = handPath(rect(w, h, 3), { seed, radius, wobble, unevenCorners: 0.4 })
  return url(`0 0 ${w} ${h}`, `${wash(seed)}<path d='${d}' fill='${color}' opacity='${opacity}' filter='url(#w)'/>`)
}

/** A hand-drawn outline, like a pencil line around a box. */
export function handOutline(color: string, { w = 240, h = 40, radius = 12, seed = 5, width = 1.2, wobble = 0.9 } = {}) {
  const d = handPath(rect(w, h, 2), { seed, radius, wobble, unevenCorners: 0.35 })
  return url(`0 0 ${w} ${h}`, `${rough(0.9, 1.1, seed)}<path d='${d}' fill='none' stroke='${color}' stroke-width='${width}' vector-effect='non-scaling-stroke' filter='url(#r)'/>`)
}

/** Hand-cut paper with a faint pencil edge (menus, popovers). */
export function handPaper({ w = 200, h = 200, radius = 16, seed = 8 } = {}) {
  const d = handPath(rect(w, h, 2), { seed, radius, wobble: 1.6, unevenCorners: 0.45 })
  return url(`0 0 ${w} ${h}`, `${rough(0.8, 1.2, seed)}<path d='${d}' fill='${PIGMENT.paper}' stroke='rgba(0,0,0,0.09)' stroke-width='1' vector-effect='non-scaling-stroke' filter='url(#r)'/>`)
}

/** A marker stroke, left to right. */
export function marker(color: string, seed = 4) {
  return url("0 0 120 10", `${rough(0.85, 2.2, seed)}<path d='M4 6.2C24 4.4 50 5.6 74 4.5S106 5.4 116 4.1' fill='none' stroke='${color}' stroke-width='3.6' stroke-linecap='round' filter='url(#r)'/>`)
}

/** A marker stroke, top to bottom, that drifts a little: a thread running through a list. */
export function threadLine(color: string, seed = 6) {
  return url("0 0 10 200", `${rough(0.6, 2, seed)}<path d='M5 2C3.6 40 6.6 70 4.6 104S6 160 5 198' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' vector-effect='non-scaling-stroke' filter='url(#r)'/>`)
}

/** A short upright painted stroke, like the edge of a sticky note. */
export function edgeStroke(color: string, seed = 2) {
  return url("0 0 8 60", `${wash(seed)}<path d='M3 3c1.4-.6 2.4-.2 2.6 1.2.4 16 .4 34 .2 52-.4 1.2-1.6 1.6-2.6.8C2.6 40 2.4 22 3 3z' fill='${color}' filter='url(#w)'/>`)
}

/** A hand-drawn tick that runs a little past its box. */
export function tick(color: string) {
  return url("0 0 20 20", `${rough(0.7, 1.2, 3)}<path d='M3.6 10.6c1.6 1.2 3 2.8 4.4 5 2.4-5.2 5.6-9.4 9.6-12.6' fill='none' stroke='${color}' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round' filter='url(#r)'/>`, false)
}

/** A painted dot. */
export function dot(color: string, seed = 3) {
  return url("0 0 20 20", `${rough(0.8, 1.6, seed)}<path d='M10.4 3.4c3.6.2 6.2 2.8 6.1 6.6-.1 3.8-2.9 6.4-6.6 6.4-3.6 0-6.4-2.8-6.3-6.5.1-3.8 3.1-6.7 6.8-6.5z' fill='${color}' filter='url(#r)'/>`, false)
}

export const ART = { paintedSurface, handOutline, handPaper, marker, threadLine, edgeStroke, tick, dot }
