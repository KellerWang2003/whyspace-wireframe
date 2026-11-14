// High-fi: the rail's open tab around a painted tile or the Duet (Nov 14). One clean path, in the tab's own pixels:
// the tile's outline, smoothed of its small hand wobbles and grown by an even ring of paper, then straight into the
// sheet with the usual 12px curves above and below. Round shapes get a thicker ring, so the paper around a circle
// reads as the same weight as around a square tile (a circle covers less of its box, so an equal ring looks thinner).
type Pt = [number, number]

// The ring of paper around a square tile, and how much more a full circle gets.
const RING = 5
const ROUND_EXTRA = 1.5
const FILLET = 12
const SAMPLES = 160
const NS = "http://www.w3.org/2000/svg"

const cache = new Map<string, string>()

// d (+ optional SVG transform) is the shape in its 64 box; the tile is `tile` px wide, centered in a `box` px square
// at the tab's left; the tab runs `width` px into the sheet.
export function railTabPath(d: string, transform: string | undefined, tile: number, box: number, width: number) {
  const key = [d, transform, tile, box, width].join("|")
  const hit = cache.get(key)
  if (hit) return hit

  // 1. Sample the outline in tab pixels.
  const g = document.createElementNS(NS, "g")
  if (transform) g.setAttribute("transform", transform)
  const m = g.transform.baseVal.consolidate()?.matrix
  const path = document.createElementNS(NS, "path")
  path.setAttribute("d", d)
  const total = path.getTotalLength()
  const k = tile / 64
  const o = (box - tile) / 2
  let pts: Pt[] = Array.from({ length: SAMPLES }, (_, i) => {
    const p = path.getPointAtLength((i / SAMPLES) * total)
    const x = m ? m.a * p.x + m.c * p.y + m.e : p.x
    const y = m ? m.b * p.x + m.d * p.y + m.f : p.y
    return [o + x * k, o + y * k]
  })

  // 2. Smooth away the small wobbles; the shape's overall hand stays.
  pts = smooth(pts, 6)

  // 3. How round is it? Its area against the tightest box it fits in, at any angle: ~0.92 for a tile, ~0.79 for a circle.
  const fill = area(pts) / minBox(pts)
  const round = Math.min(1, Math.max(0, (0.915 - fill) / (0.915 - 0.79)))
  const ring = RING + ROUND_EXTRA * round

  // 4. Grow it by the ring, evenly, along each point's normal (outward for either winding), then smooth the result.
  const sign = area(pts, true) > 0 ? 1 : -1
  pts = smooth(pts.map((p, i) => {
    const a = pts[(i - 1 + SAMPLES) % SAMPLES]
    const b = pts[(i + 1) % SAMPLES]
    const nx = (b[1] - a[1]) * sign
    const ny = -(b[0] - a[0]) * sign
    const l = Math.hypot(nx, ny) || 1
    return [p[0] + (nx / l) * ring, p[1] + (ny / l) * ring] as Pt
  }), 2)

  // 5. Keep the left side, from its topmost point round to its bottommost (tangents are flat there, so the
  // straight run into the sheet meets it without a step), then close through the sheet with its curves.
  let top = 0
  let bottom = 0
  let left = 0
  pts.forEach((p, i) => {
    if (p[1] < pts[top][1]) top = i
    if (p[1] > pts[bottom][1]) bottom = i
    if (p[0] < pts[left][0]) left = i
  })
  const between = (from: number, to: number, step: number) => {
    for (let i = from; i !== to; i = (i + step + SAMPLES) % SAMPLES) if (i === left) return true
    return false
  }
  const step = between(top, bottom, 1) ? 1 : -1
  const side: Pt[] = []
  for (let i = top; ; i = (i + step + SAMPLES) % SAMPLES) {
    side.push(pts[i])
    if (i === bottom) break
  }
  const T = side[0][1]
  const B = side[side.length - 1][1]
  const W = width
  const f = (n: number) => n.toFixed(2)
  let out = `M${f(W - FILLET)} ${f(T)}L${f(side[0][0])} ${f(T)}`
  out += curve(side)
  out += `L${f(W - FILLET)} ${f(B)}A${FILLET} ${FILLET} 0 0 1 ${f(W)} ${f(B + FILLET)}`
  out += `L${f(W)} ${f(T - FILLET)}A${FILLET} ${FILLET} 0 0 1 ${f(W - FILLET)} ${f(T)}Z`
  cache.set(key, out)
  return out
}

// Closed moving average (a triangle window `r` points each side).
function smooth(pts: Pt[], r: number): Pt[] {
  const n = pts.length
  return pts.map((_, i) => {
    let x = 0
    let y = 0
    let w = 0
    for (let j = -r; j <= r; j++) {
      const q = pts[(i + j + n) % n]
      const wt = r + 1 - Math.abs(j)
      x += q[0] * wt
      y += q[1] * wt
      w += wt
    }
    return [x / w, y / w] as Pt
  })
}

function area(pts: Pt[], signed = false) {
  let s = 0
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    s += p[0] * q[1] - q[0] * p[1]
  })
  return signed ? s / 2 : Math.abs(s / 2)
}

function minBox(pts: Pt[]) {
  let best = Infinity
  for (let deg = 0; deg < 90; deg += 3) {
    const c = Math.cos((deg * Math.PI) / 180)
    const s = Math.sin((deg * Math.PI) / 180)
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const [x, y] of pts) {
      const u = x * c - y * s
      const v = x * s + y * c
      x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v)
    }
    best = Math.min(best, (x1 - x0) * (y1 - y0))
  }
  return best
}

// An open run of points as a smooth curve (Catmull-Rom as cubic Béziers), from the first point to the last.
function curve(p: Pt[]) {
  const f = (n: number) => n.toFixed(2)
  let s = ""
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[Math.min(p.length - 1, i + 2)]
    s += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return s
}
