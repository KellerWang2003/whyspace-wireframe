import { useId } from "react"
import { Paint } from "@/components/brand/paint"
import { BRAND as B, type HThread } from "./model"

// Painted ribbons: wavy bands of pigment, cut and painted like the rest of the hand-made kit,
// that multiply where they cross. Shared by the painterly style and editorial's quiet corners.

type Pt = [number, number]
export type RibbonSpec = { color: string; y: number; amp: number; waves: number; phase: number; w: number; turns?: number }

// A closed Catmull-Rom curve through the points, as cubic Béziers.
function smooth(pts: Pt[]) {
  const m = pts.length
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < m; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + m) % m], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]]
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + "Z"
}

// A ribbon across the box: a wavy band that narrows where it turns, like a strip of paper seen edge-on.
function ribbonPath(r: RibbonSpec, W: number, H: number) {
  const N = 64
  const top: Pt[] = []
  const bottom: Pt[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = -60 + t * (W + 120)
    const y = r.y * H + r.amp * Math.sin(Math.PI * 2 * r.waves * t + r.phase) + r.amp * 0.22 * Math.sin(Math.PI * 2 * r.waves * 2.3 * t + r.phase * 1.7)
    const half = (r.w * (0.3 + 0.7 * Math.abs(Math.cos(Math.PI * (r.turns ?? 1.5) * t + r.phase * 0.6)))) / 2
    top.push([x, y - half])
    bottom.push([x, y + half])
  }
  return smooth([...top, ...bottom.reverse()])
}

export function Ribbons({ ribbons, width, height, seed = 5, className }: { ribbons: RibbonSpec[]; width: number; height: number; seed?: number; className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs><Paint id={`r${id}`} level="soft" seed={seed} /></defs>
      {ribbons.map((r, i) => <path key={i} d={ribbonPath(r, width, height)} fill={r.color} filter={`url(#r${id})`} style={{ mixBlendMode: "multiply" }} opacity={0.92} />)}
    </svg>
  )
}

// A project's threads, woven into one band: one ribbon per thread, in its pigment.
export function ThreadRibbons({ threads, width = 1200, height = 150, className }: { threads: HThread[]; width?: number; height?: number; className?: string }) {
  const specs: RibbonSpec[] = threads.map((t, i) => ({ color: B[t.pigment], y: 0.5, amp: 34 + (i % 2) * 10, waves: (1.6 + i * 0.18) * (width / 1200), phase: i * 1.55, w: 30 - i * 2, turns: (2 + i * 0.4) * (width / 1200) }))
  return <Ribbons ribbons={specs} width={width} height={height} seed={9} className={className} />
}

// Nothing left to do: three ribbons lying flat and calm.
export function CaughtUp({ className }: { className?: string }) {
  const lay: RibbonSpec[] = [
    { color: B.leaf, y: 0.24, amp: 6, waves: 1.1, phase: 0.1, w: 20, turns: 0 },
    { color: B.sky, y: 0.52, amp: 6, waves: 1.1, phase: 0.5, w: 20, turns: 0 },
    { color: B.rose, y: 0.8, amp: 6, waves: 1.1, phase: 0.9, w: 20, turns: 0 },
  ]
  return <Ribbons ribbons={lay} width={300} height={100} seed={13} className={className} />
}
