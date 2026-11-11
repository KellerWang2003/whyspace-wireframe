// Geometry for the hand-made shape kit (see paint.tsx).
export const PIGMENT = {
  forest: "#40542E",
  leaf: "#6A854C",
  apricot: "#F19D57",
  sky: "#75A6C4",
  rose: "#E97EA1",
  leafWash: "#EAF5DF",
  apricotWash: "#FFE9D2",
  skyWash: "#E2F3FE",
  roseWash: "#FFE4EF",
  subtle: "#F3F6F0",
  paper: "#FDFDFC",
} as const

type Pt = [number, number]

// Seeded random, so a shape looks the same on every render.
function rng(seed: number) {
  let s = (Math.abs(Math.floor(seed)) * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export type HandOptions = {
  seed?: number
  /** How far the outline drifts from the ruled line, in px. */
  wobble?: number
  /** Corner radius in px; each corner varies around it. */
  radius?: number
  /** 0 = every corner the same, 1 = very uneven. */
  unevenCorners?: number
}

/** Turns a ruled polygon into a hand-cut outline: uneven corners, edges that bow and wobble. */
export function handPath(poly: Pt[], { seed = 1, wobble = 2.5, radius = 16, unevenCorners = 0.5 }: HandOptions = {}) {
  const r = rng(seed)
  const n = poly.length
  // 1. Round each corner with its own radius, sampled densely, with sampled straight runs between.
  const len = (i: number) => Math.hypot(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1])
  const radii = poly.map(() => radius * (1 + (r() * 2 - 1) * unevenCorners))
  // distance from corner i along its incoming and outgoing edges
  const rin = poly.map((_, i) => Math.min(radii[i], len((i - 1 + n) % n) / 2.2))
  const rout = poly.map((_, i) => Math.min(radii[i] * (0.85 + r() * 0.3), len(i) / 2.2))
  const along = (from: Pt, to: Pt, dist: number): Pt => {
    const l = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
    return [from[0] + ((to[0] - from[0]) * dist) / l, from[1] + ((to[1] - from[1]) * dist) / l]
  }
  const outline: Pt[] = []
  for (let i = 0; i < n; i++) {
    const p = poly[i]
    const a = poly[(i - 1 + n) % n]
    const b = poly[(i + 1) % n]
    const p1 = along(p, a, rin[i])
    const p2 = along(p, b, rout[i])
    for (let k = 0; k <= 6; k++) {
      const t = k / 6
      outline.push([
        (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * p[0] + t * t * p2[0],
        (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * p[1] + t * t * p2[1],
      ])
    }
    const end = along(b, p, rin[(i + 1) % n])
    const steps = Math.max(2, Math.round(Math.hypot(end[0] - p2[0], end[1] - p2[1]) / 10))
    for (let k = 1; k < steps; k++) {
      const t = k / steps
      outline.push([p2[0] + (end[0] - p2[0]) * t, p2[1] + (end[1] - p2[1]) * t])
    }
  }
  // 2. Push every point along its normal with smooth, seamless noise (whole cycles around the loop).
  const m = outline.length
  const waves = [
    [2 + Math.floor(r() * 2), 1, r() * Math.PI * 2],
    [5 + Math.floor(r() * 4), 0.45, r() * Math.PI * 2],
    [13 + Math.floor(r() * 8), 0.18, r() * Math.PI * 2],
  ]
  const moved = outline.map((p, i) => {
    const prev = outline[(i - 1 + m) % m]
    const next = outline[(i + 1) % m]
    let nx = next[1] - prev[1]
    let ny = -(next[0] - prev[0])
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    const t = i / m
    const d = waves.reduce((s, [f, amp, ph]) => s + amp * Math.sin(f * t * Math.PI * 2 + ph), 0) * wobble
    return [p[0] + nx * d, p[1] + ny * d] as Pt
  })
  // 3. Smooth closed curve (Catmull-Rom as cubic Béziers).
  let d = `M${moved[0][0].toFixed(1)} ${moved[0][1].toFixed(1)}`
  for (let i = 0; i < m; i++) {
    const p0 = moved[(i - 1 + m) % m]
    const p1 = moved[i]
    const p2 = moved[(i + 1) % m]
    const p3 = moved[(i + 2) % m]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + "Z"
}


export type StrandSpec = { w: number; color: string }

/** Lays out a row of hand-cut strands. Widths, gaps, heights and lean all drift a little. */
export function layoutStrands(strands: StrandSpec[], { height, lean, gap, seed }: { height: number; lean: number; gap: number; seed: number }) {
  const r = rng(seed)
  let x = 0
  const parts = strands.map((s, i) => {
    const H = height * (0.94 + r() * 0.1)
    const top = (r() - 0.5) * height * 0.06
    const slant = H * lean * (0.92 + r() * 0.16)
    const wTop = s.w * (0.94 + r() * 0.12)
    const wBot = s.w * (0.94 + r() * 0.12)
    const pts: Pt[] = [[x, top], [x + wTop, top + (r() - 0.5) * 4], [x + wBot + slant, top + H], [x + slant + (r() - 0.5) * 6, top + H + (r() - 0.5) * 4]]
    x += s.w + gap * (0.7 + r() * 0.6)
    return { d: handPath(pts, { seed: seed * 31 + i, radius: Math.min(20, s.w * 0.26), wobble: 1.6, unevenCorners: 0.35 }), color: s.color }
  })
  return { parts, W: x + height * lean }
}

/** A loose rounded blob. */
export function blobPath(size: number, seed: number) {
  const r = rng(seed)
  const pts: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + r() * 0.4
    const rad = size * (0.36 + r() * 0.12)
    return [size / 2 + Math.cos(a) * rad, size / 2 + Math.sin(a) * rad * (0.8 + r() * 0.3)] as Pt
  })
  return handPath(pts, { seed, radius: size * 0.3, wobble: size * 0.02, unevenCorners: 0.6 })
}
