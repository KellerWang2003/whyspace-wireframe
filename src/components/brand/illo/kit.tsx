import { createContext, useContext, useEffect, useId, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { blobPath } from "@/components/brand/hand"

/* The illustration kit: every piece in the set is drawn from these parts, so every ribbon, hand
   and figure looks the same and can move. Rules live in illustration-style.ts.
   - Each part is painted with the shared watercolor filter, in its own layer that multiplies,
     so where two ribbons cross the color deepens, like the paintings.
   - Coordinates: scenes are 240 x 240. Parts take a position and an angle. */

export type P = [number, number]

export const INK = {
  leaf: "#7a9a4a",
  olive: "#5f7a3a",
  forest: "#3F4A2A",
  brown: "#6B4A2E",
  apricot: "#f19d57",
  rose: "#e07aa0",
  sky: "#6fa6d4",
  peach: "#f9dcc0",
  card: "#F3EBDC",
  wood: "#d9b88e",
  skin: { light: "#f2b88c", tan: "#c98a55", deep: "#8a5a3a" },
  wash: { leaf: "#EEF4E4", sky: "#E2F1FC", apricot: "#FDEFE1", rose: "#FBEDF0" },
} as const

// ---------------------------------------------------------------- scene + layers

/** The marker texture from Loading and Thinking: a flat, cut stroke with a slightly rough edge,
    pigment pooling in the middle, paper grain speckling through and a darker rim. */
function Marker({ id, seed = 1 }: { id: string; seed?: number }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={seed} result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale={3} xChannelSelector="R" yChannelSelector="G" result="cut" />
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={seed + 8} result="wash" />
      <feColorMatrix in="wash" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15" result="poolMask" />
      <feComposite in="cut" in2="poolMask" operator="in" result="pool" />
      <feBlend in="pool" in2="cut" mode="multiply" result="pooled" />
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={seed + 2} result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.6 0.85" result="grainMask" />
      <feComposite in="grainMask" in2="cut" operator="in" result="speck" />
      <feBlend in="speck" in2="pooled" mode="screen" result="grained" />
      <feMorphology in="cut" operator="erode" radius={1.5} result="er" />
      <feGaussianBlur in="er" stdDeviation={2} result="erb" />
      <feComposite in="cut" in2="erb" operator="out" result="rim" />
      <feComponentTransfer in="rim" result="rimSoft"><feFuncA type="linear" slope={0.5} /></feComponentTransfer>
      <feBlend in="rimSoft" in2="grained" mode="multiply" />
    </filter>
  )
}

const FilterCtx = createContext("")
/** The scene's marker filter id, for parts that apply it themselves (like a painting). */
export const FilterId = FilterCtx

/** A 240 x 240 sheet. `tile` paints a pale wash square behind the piece. */
export function Scene({ label, tile, className, style, children, seed = 5, viewBox = "0 0 240 240", intrinsic }: {
  label?: string; tile?: string; className?: string; style?: CSSProperties; children: ReactNode; seed?: number; viewBox?: string
  /** Give the svg its own size from the viewBox, so a height class alone sizes it (width follows). */
  intrinsic?: boolean
}) {
  const id = `illo-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`
  const [x, y, w, h] = viewBox.split(" ").map(Number)
  return (
    <svg viewBox={viewBox} width={intrinsic ? w : undefined} height={intrinsic ? h : undefined} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={cn("block overflow-hidden", className)} style={{ isolation: "isolate", ...style }}>
      <defs>
        <Marker id={id} seed={seed} />
        {tile && <clipPath id={`${id}-clip`}><rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={16} /></clipPath>}
      </defs>
      {tile && <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={16} fill={tile} />}
      {/* A tile piece stays inside its tile: ribbons run off its edges, like the Duet loop. */}
      <g clipPath={tile ? `url(#${id}-clip)` : undefined}><FilterCtx.Provider value={id}>{children}</FilterCtx.Provider></g>
    </svg>
  )
}

/** One painted layer. Layers multiply onto each other. */
/** One painted layer. By default layers are see-through and multiply, so crossings deepen.
    `opaque` lays it on top instead: a ribbon crossing itself stays one color. */
export function Layer({ children, opacity = 0.9, transform, opaque }: { children: ReactNode; opacity?: number; transform?: string; opaque?: boolean }) {
  const id = useContext(FilterCtx)
  return (
    <g transform={transform} style={opaque ? undefined : { mixBlendMode: "multiply" }} opacity={opaque ? 1 : opacity}>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  )
}

// ---------------------------------------------------------------- ribbon

type Seg = { p1: P; c1: P; c2: P; p2: P }

function segments(pts: P[]): Seg[] {
  const out: Seg[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    out.push({ p1, p2, c1: [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2: [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6] })
  }
  return out
}

const f = (n: number) => n.toFixed(1)
function pathOf(segs: Seg[]) {
  if (!segs.length) return ""
  let d = `M${f(segs[0].p1[0])} ${f(segs[0].p1[1])}`
  for (const s of segs) d += ` C${f(s.c1[0])} ${f(s.c1[1])} ${f(s.c2[0])} ${f(s.c2[1])} ${f(s.p2[0])} ${f(s.p2[1])}`
  return d
}

const unit = (a: P, b: P): P => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l] }

export type End = "cut" | "notch" | "torn" | "none"

// The end of a ribbon past point e, heading along t.
function endShape(e: P, t: P, w: number, kind: End, flip = false) {
  if (kind === "none") return ""
  const n: P = [-t[1], t[0]], h = w / 2
  const a: P = [e[0] + n[0] * h, e[1] + n[1] * h], b: P = [e[0] - n[0] * h, e[1] - n[1] * h]
  const out = (p: P, k: number): P => [p[0] + t[0] * k, p[1] + t[1] * k]
  if (kind === "torn") {
    // A ragged edge: fibers pulled out to uneven lengths across the width.
    const jag = [0.15, 0.7, 0.25, 0.95, 0.35, 0.8, 0.2, 0.55, 0.1]
    const edge = jag.map((k, i) => { const u = i / (jag.length - 1); return out([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], k * w * 0.55) })
    return `M${[a, ...edge, b].map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")} Z`
  }
  const pts: P[] = kind === "notch"
    ? [a, out(a, w * 0.85), out(e, w * 0.32), out(b, w * 0.85), b]
    : flip ? [a, out(a, w * 0.12), out(b, w * 0.5), b] : [a, out(a, w * 0.5), out(b, w * 0.12), b]
  return `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")} Z`
}

/** A wide, flat ribbon along `pts`. `draw` (0 to 1) draws it on from the start.
    `layers` splits it so it can cross itself and darken there. */
export function Ribbon({ pts, w = 22, color, start = "cut", end = "notch", draw = 1, from = 0, layers = 1, opacity, opaque }: {
  pts: P[]; w?: number; color: string; start?: End; end?: End; draw?: number; from?: number; layers?: number; opacity?: number; opaque?: boolean
}) {
  const segs = segments(pts)
  const n = segs.length
  const shown = Math.max(0, Math.min(1, draw)) * n
  const gone = Math.max(0, Math.min(1, from)) * n
  const chunks: Seg[][] = []
  const per = Math.ceil(n / layers)
  for (let i = 0; i < n; i += per) chunks.push(segs.slice(i, i + per))
  let used = 0
  const s0 = unit(segs[0].c1[0] === segs[0].p1[0] && segs[0].c1[1] === segs[0].p1[1] ? segs[0].p2 : segs[0].c1, segs[0].p1)
  const last = segs[n - 1]
  const e1 = unit(last.c2[0] === last.p2[0] && last.c2[1] === last.p2[1] ? last.p1 : last.c2, last.p2)
  // The paint filter sizes itself from the path's box, which ignores the stroke: a near-straight
  // ribbon would be cut to a sliver. An invisible box around the whole ribbon keeps it whole.
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), pad = w * 1.6
  const box = <rect x={Math.min(...xs) - pad} y={Math.min(...ys) - pad} width={Math.max(...xs) - Math.min(...xs) + pad * 2} height={Math.max(...ys) - Math.min(...ys) + pad * 2} fill="none" />
  return (
    <>
      {chunks.map((c, i) => {
        const a = used
        used += c.length
        const clamp = (x: number) => Math.max(0, Math.min(1, x))
        const hi = clamp((shown - a) / c.length), lo = clamp((gone - a) / c.length)
        if (hi <= lo) return null
        const whole = lo <= 0 && hi >= 1
        return (
          <Layer key={i} opacity={opacity} opaque={opaque}>
            {box}
            <path d={pathOf(c)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round"
              pathLength={100} strokeDasharray={whole ? undefined : `${f((hi - lo) * 100)} 300`} strokeDashoffset={whole ? undefined : f(-lo * 100)} />
            {i === 0 && gone <= 0 && <path d={endShape(segs[0].p1, s0, w, start, true)} fill={color} />}
            {i === chunks.length - 1 && hi >= 1 && <path d={endShape(last.p2, e1, w, end)} fill={color} />}
          </Layer>
        )
      })}
    </>
  )
}

/** A ring of ribbon. */
export function Hoop({ cx, cy, rx, ry, rot = 0, w = 18, color, draw = 1 }: { cx: number; cy: number; rx: number; ry: number; rot?: number; w?: number; color: string; draw?: number }) {
  return (
    <Layer>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} ${cy})`} fill="none" stroke={color} strokeWidth={w}
        pathLength={100} strokeDasharray={draw < 1 ? `${f(draw * 100)} 200` : undefined} />
    </Layer>
  )
}

/** A bow, painted in one wash: two loops with an open middle, two notched tails, a knot. */
export function Bow({ x, y, color, s = 1, angle = 0, grow = 1 }: { x: number; y: number; color: string; s?: number; angle?: number; grow?: number }) {
  if (grow <= 0) return null
  const loop = "M0 0 C -8 -20, -36 -28, -42 -12 C -46 0, -30 10, 0 0 Z M-8 -3 C -14 -12, -30 -18, -33 -10 C -35 -3, -24 2, -8 -3 Z"
  const tail = (dir: number) => `M${-4 * dir} 2 C ${-8 * dir} 14, ${-14 * dir} 24, ${-20 * dir} 36 L ${-12 * dir} 31 L ${-8 * dir} 39 C ${-4 * dir} 26, ${0 * dir} 14, ${4 * dir} 3 Z`
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s * (0.6 + 0.4 * grow)})`} opacity={grow}>
      <Layer>
        <path d={loop} fill={color} fillRule="evenodd" />
        <path d={loop} fill={color} fillRule="evenodd" transform="scale(-1 1)" />
        <path d={tail(1)} fill={color} />
        <path d={tail(-1)} fill={color} />
      </Layer>
      <Layer><rect x={-7} y={-7} width={14} height={13} rx={5} fill={color} /></Layer>
    </g>
  )
}

/** Three short strokes: "it just happened". */
export function Dashes({ x, y, angle = 0, color = INK.leaf, s = 1 }: { x: number; y: number; angle?: number; color?: string; s?: number }) {
  return (
    <Layer transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <g stroke={color} strokeWidth={4} strokeLinecap="round">
        <path d="M-10 -2 L-14 -14" /><path d="M0 0 L4 -14" /><path d="M9 6 L20 -2" />
      </g>
    </Layer>
  )
}

// ---------------------------------------------------------------- hands

export type HandPose = "open" | "hold" | "flat"

const darker = "rgba(90,50,20,0.22)"

/** A hand coming in from off-frame. Local space: palm at 0,0, the arm runs toward +y.
    Rotate it so the arm leaves the frame. For "hold", draw the ribbon between <Hand> and <Grip>. */
export function Hand({ x, y, angle = 0, s = 1, skin = INK.skin.light, cuff = INK.olive, pose = "open" }: {
  x: number; y: number; angle?: number; s?: number; skin?: string; cuff?: string; pose?: HandPose
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <Layer>
        <rect x={-12} y={6} width={24} height={34} rx={8} fill={skin} />
        {pose === "open" && <>
          <path d="M-17 2 C -18 -14, -14 -44, -3 -46 C 8 -48, 14 -30, 14 -14 L 14 6 C 6 16, -12 16, -17 2 Z" fill={skin} />
          <path d="M12 -2 C 18 -8, 24 -20, 28 -27 C 31 -31, 37 -27, 34 -21 C 30 -11, 24 2, 14 8 Z" fill={skin} />
        </>}
        {pose === "hold" && <path d="M-18 0 C -20 -16, -12 -28, 0 -28 C 12 -28, 18 -18, 18 -4 C 18 8, 10 14, 0 14 C -10 14, -17 10, -18 0 Z" fill={skin} />}
        {pose === "flat" && <>
          <path d="M-16 4 C -18 -12, -16 -46, -4 -50 C 8 -52, 14 -40, 14 -20 L 14 6 C 6 14, -10 14, -16 4 Z" fill={skin} />
          <path d="M-14 -2 C -20 -8, -28 -16, -31 -22 C -33 -27, -27 -30, -24 -26 C -19 -18, -12 -12, -8 -8 Z" fill={skin} />
        </>}
      </Layer>
      {pose !== "hold" && <Layer opacity={0.7}>
        <g stroke={darker} strokeWidth={1.8} strokeLinecap="round">
          {(pose === "open" ? [-9, -3, 3] : [-8, -2, 4]).map((gx) => <path key={gx} d={`M${gx} ${pose === "open" ? -40 : -46} L${gx + 0.5} ${pose === "open" ? -20 : -24}`} />)}
        </g>
      </Layer>}
      <Layer>
        <path d="M-17 34 L 17 34 C 19 60, 19 90, 18 140 L -18 140 C -19 90, -19 60, -17 34 Z" fill={cuff} />
      </Layer>
      <Layer opacity={0.35}><rect x={-17} y={34} width={34} height={8} rx={3} fill={cuff} /></Layer>
    </g>
  )
}

/** The fingers and thumb of a "hold" hand, drawn over the ribbon it holds. Same x, y, angle, s. */
export function Grip({ x, y, angle = 0, s = 1, skin = INK.skin.light }: { x: number; y: number; angle?: number; s?: number; skin?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <Layer>
        <path d="M-17 -10 C -17 -20, -8 -24, 2 -24 C 12 -24, 18 -18, 18 -10 C 18 -2, 12 2, 2 2 C -8 2, -17 0, -17 -10 Z" fill={skin} />
        <path d="M-15 -6 C -18 -14, -16 -26, -10 -34 C -6 -38, 0 -35, -2 -29 C -5 -21, -6 -12, -6 -4 Z" fill={skin} />
      </Layer>
      <Layer opacity={0.7}>
        <g stroke={darker} strokeWidth={1.8} strokeLinecap="round">{[-1, 6, 12].map((gx) => <path key={gx} d={`M${gx} -20 L${gx} -6`} />)}</g>
      </Layer>
    </g>
  )
}

// ---------------------------------------------------------------- people

function Hair({ cx, cy, r, color, seed }: { cx: number; cy: number; r: number; color: string; seed: number }) {
  const size = r * 2.3
  return <path d={blobPath(size, seed)} transform={`translate(${cx - size / 2} ${cy - size / 2})`} fill={color} />
}

/** A person seen from directly above. Faces toward -y in local space. `hands` are where the
    hands reach, in local space (default: both forward). */
export function PersonAbove({ x, y, angle = 0, s = 1, shirt, hair = INK.forest, skin = INK.skin.light, hands = [[-12, -34], [12, -34]], bun, seed = 3 }: {
  x: number; y: number; angle?: number; s?: number; shirt: string; hair?: string; skin?: string; hands?: P[]; bun?: boolean; seed?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <Layer>
        <ellipse cx={0} cy={4} rx={27} ry={17} fill={shirt} />
        {hands.map(([hx, hy], i) => {
          const sx = i === 0 ? -20 : 20
          return <path key={i} d={`M${sx} 0 Q ${sx * 0.9} ${(hy + 2) / 2} ${hx} ${hy}`} fill="none" stroke={shirt} strokeWidth={11} strokeLinecap="round" />
        })}
      </Layer>
      <Layer>
        {hands.map(([hx, hy], i) => <circle key={i} cx={hx} cy={hy - 2} r={5.5} fill={skin} />)}
        <circle cx={0} cy={-2} r={14} fill={skin} />
      </Layer>
      <Layer>
        <Hair cx={0} cy={1} r={17} color={hair} seed={seed} />
        {bun && <circle cx={0} cy={19} r={6.5} fill={hair} />}
      </Layer>
    </g>
  )
}

/** A person seen from behind, sitting and hugging their knees. Faces right. */
export function PersonBehind({ x, y, s = 1, shirt, hair = INK.forest, skin = INK.skin.light, seed = 7 }: {
  x: number; y: number; s?: number; shirt: string; hair?: string; skin?: string; seed?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Layer><path d="M-34 40 C -40 10, -30 -14, -6 -16 C 16 -18, 30 -4, 32 14 C 36 30, 32 42, 20 46 C 4 50, -24 50, -34 40 Z" fill={shirt} /></Layer>
      <Layer opacity={0.5}><path d="M2 2 C 18 -2, 30 10, 30 24 C 28 34, 16 38, 4 34 C -4 26, -4 10, 2 2 Z" fill={shirt} /></Layer>
      <Layer>
        <circle cx={2} cy={-34} r={20} fill={skin} />
        <ellipse cx={22} cy={14} rx={8} ry={7} fill={skin} />
      </Layer>
      <Layer><Hair cx={0} cy={-36} r={25} color={hair} seed={seed} /></Layer>
    </g>
  )
}

/** A person walking, side view, facing right. The hands meet in front at about (18, -34). */
export function PersonSide({ x, y, s = 1, shirt, pants = INK.olive, hair = INK.brown, skin = INK.skin.tan, phase = 0, seed = 11 }: {
  x: number; y: number; s?: number; shirt: string; pants?: string; hair?: string; skin?: string; phase?: number; seed?: number
}) {
  const sw = Math.sin(phase) * 10
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Layer>
        <path d={`M-2 -6 L ${-14 - sw} 44`} stroke={pants} strokeWidth={14} strokeLinecap="round" />
        <path d={`M4 -6 L ${16 + sw} 42`} stroke={pants} strokeWidth={14} strokeLinecap="round" />
        <ellipse cx={-16 - sw} cy={49} rx={10} ry={5} fill={INK.forest} />
        <ellipse cx={20 + sw} cy={47} rx={10} ry={5} fill={INK.forest} />
      </Layer>
      <Layer>
        <rect x={-14} y={-58} width={28} height={58} rx={12} fill={shirt} />
        <path d="M8 -50 Q 18 -40 18 -32" stroke={shirt} strokeWidth={10} strokeLinecap="round" fill="none" />
      </Layer>
      <Layer>
        <circle cx={2} cy={-74} r={13} fill={skin} />
        <circle cx={19} cy={-32} r={5} fill={skin} />
      </Layer>
      <Layer><Hair cx={-4} cy={-78} r={12} color={hair} seed={seed} /></Layer>
    </g>
  )
}

// ---------------------------------------------------------------- objects

export function Cards({ x, y, w = 92, h = 112, angle = 0, n = 3 }: { x: number; y: number; w?: number; h?: number; angle?: number; n?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      {Array.from({ length: n }, (_, i) => n - 1 - i).map((i) => (
        <Layer key={i}><rect x={-w / 2 + i * 4} y={-h / 2 + i * 5} width={w} height={h} rx={7} fill={i ? "#EADFC9" : INK.card} /></Layer>
      ))}
    </g>
  )
}

export function Door({ x, y, w = 96, h = 150 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Layer><rect x={0} y={0} width={w} height={h} rx={4} fill={INK.peach} /></Layer>
      <Layer opacity={0.7}><rect x={4} y={4} width={w - 8} height={h - 4} rx={3} fill="none" stroke={INK.wood} strokeWidth={7} /></Layer>
      <Layer><circle cx={w - 16} cy={h * 0.56} r={4.5} fill={INK.olive} /></Layer>
    </g>
  )
}

/** A roll of ribbon standing up, seen a little from above. */
export function Roll({ cx, top, w = 56, h = 44, color }: { cx: number; top: number; w?: number; h?: number; color: string }) {
  const r = w / 2, ry = w * 0.2, bottom = top + h
  return (
    <>
      <Layer><path d={`M${cx - r} ${top} L${cx - r} ${bottom} A${r} ${ry} 0 0 0 ${cx + r} ${bottom} L${cx + r} ${top} Z`} fill={color} /></Layer>
      <Layer opacity={0.55}><ellipse cx={cx} cy={top} rx={r} ry={ry} fill={color} /></Layer>
      <Layer opacity={0.8}><ellipse cx={cx} cy={top} rx={r * 0.34} ry={ry * 0.34} fill={INK.wood} /></Layer>
    </>
  )
}

export type Glyph = "braces" | "arrow" | "lines" | "dots"

export function Tile({ x, y, size = 40, angle = 0, color, glyph, bubble, opaque }: { x: number; y: number; size?: number; angle?: number; color: string; glyph?: Glyph; bubble?: boolean; opaque?: boolean }) {
  const h = size / 2
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Layer opaque={opaque}>
        {bubble
          ? <><ellipse cx={0} cy={-2} rx={h + 2} ry={h - 2} fill={color} /><path d={`M${-h * 0.4} ${h - 8} L${-h * 0.5} ${h + 6} L${-h * 0.05} ${h - 6} Z`} fill={color} /></>
          : <rect x={-h} y={-h} width={size} height={size} rx={size * 0.22} fill={color} />}
      </Layer>
      <Layer opacity={0.85} opaque={opaque}>
        <g fill="none" stroke={INK.forest} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          {glyph === "braces" && <><path d={`M${-h * 0.25} ${-h * 0.5} Q ${-h * 0.5} ${-h * 0.5} ${-h * 0.45} -2 L ${-h * 0.6} 0 L ${-h * 0.45} 2 Q ${-h * 0.5} ${h * 0.5} ${-h * 0.25} ${h * 0.5}`} /><path d={`M${h * 0.25} ${-h * 0.5} Q ${h * 0.5} ${-h * 0.5} ${h * 0.45} -2 L ${h * 0.6} 0 L ${h * 0.45} 2 Q ${h * 0.5} ${h * 0.5} ${h * 0.25} ${h * 0.5}`} /></>}
          {glyph === "arrow" && <><path d={`M${-h * 0.5} 0 L ${h * 0.45} 0`} /><path d={`M${h * 0.1} ${-h * 0.35} L ${h * 0.5} 0 L ${h * 0.1} ${h * 0.35}`} /></>}
          {glyph === "lines" && [-0.35, 0, 0.35].map((k) => <path key={k} d={`M${-h * 0.45} ${h * k} L ${h * 0.45} ${h * k - 2}`} />)}
          {glyph === "dots" && [-0.4, 0, 0.4].map((k) => <circle key={k} cx={h * k} cy={-2} r={1.2} fill={INK.forest} />)}
        </g>
      </Layer>
    </g>
  )
}

// ---------------------------------------------------------------- time

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Seconds since mount. "once" runs for `dur` then holds; "loop" runs on; "off" holds the end. */
export function useClock(mode: "once" | "loop" | "off", dur = 1.2) {
  const [t, setT] = useState(mode === "loop" ? 0 : mode === "once" && !reduced() ? 0 : dur)
  useEffect(() => {
    if (mode === "off" || reduced()) { setT(mode === "loop" ? 0.9 : dur); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      if (mode === "once" && s >= dur) { setT(dur); return }
      setT(s)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode, dur])
  return t
}

export const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3))
