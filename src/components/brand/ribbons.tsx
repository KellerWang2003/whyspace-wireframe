import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { PIGMENT } from "@/components/brand/hand"
import { Paint } from "@/components/brand/paint"

/* Painted ribbons for the quiet moments: loading, thinking, a lost connection,
   and the no-projects empty state. Same watercolor filter as the rest of the brand kit, at its
   softest level, so the edges stay smooth while the pigment still pools and granulates.
   Motion runs on requestAnimationFrame with plain sines, so nothing steps or flickers. */

// Lighter, washier versions of the pigments, closer to Keller's painted set.
const WASH = { leaf: "#9DBA6C", apricot: "#F4A65E", rose: "#EC8DB0", sky: "#86B5DA" }
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// useId gives ":r1:"; colons break url(#…) in some browsers.
function usePaintId() {
  return `paint-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`
}

// A smooth line through the points (Catmull-Rom as cubic Béziers).
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

// Calls draw(t) every frame with seconds since mount. Reduced motion draws one still frame.
function useFrames(draw: (t: number) => void, still = 0.9) {
  const ref = useRef(draw)
  useLayoutEffect(() => { ref.current = draw })
  useEffect(() => {
    if (reduced()) { ref.current(still); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      ref.current((now - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [still])
}

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

function Canvas({ viewBox, label, className, children, defs }: { viewBox: string; label?: string; className?: string; children: ReactNode; defs?: ReactNode }) {
  return (
    <svg viewBox={viewBox} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("block overflow-visible", className)}>
      <defs>{defs}</defs>
      {children}
    </svg>
  )
}

/** The marker filter from the illustration map: a flat, cut stroke with a slightly rough edge,
    pigment pooling in the middle, paper grain showing through and a darker rim. */
function Marker({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={1} result="edge" />
      <feDisplacementMap in="SourceGraphic" in2="edge" scale={3} xChannelSelector="R" yChannelSelector="G" result="cut" />
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={9} result="wash" />
      <feColorMatrix in="wash" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15" result="poolMask" />
      <feComposite in="cut" in2="poolMask" operator="in" result="pool" />
      <feBlend in="pool" in2="cut" mode="multiply" result="pooled" />
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={3} result="grain" />
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

// The map's pigments for the marker ribbons.
const MARK = { apricot: "#f19d57", leaf: "#7a9a4a", rose: "#e07aa0" }

/** Loading: a pen drawing one apricot ribbon while the view pans along with it. Now and then the
    pen loops. The older part slides off to the left and fades out. */
const SPEED = 55, SPIN = 4.2, PEN = 214
function penAt(t: number): [number, number] {
  const pulse = Math.max(0, Math.sin(t * 1.05)) ** 2
  const r = 5 + 19 * pulse, a = SPIN * t
  return [SPEED * t + r * Math.cos(a) - r, 60 + 12 * Math.sin(t * 0.9) + 6 * Math.sin(t * 2.1 + 1) + r * Math.sin(a)]
}
export function LoadingRibbon({ className, color = MARK.apricot }: { className?: string; color?: string }) {
  const id = usePaintId()
  const path = useRef<SVGPathElement>(null)
  useFrames((now) => {
    const t = now + 6 // start mid-stroke so the first frame isn't empty
    const cam = SPEED * t - PEN
    const pts: [number, number][] = []
    for (let s = t - 5; s <= t + 1e-6; s += 0.03) {
      const [x, y] = penAt(s)
      pts.push([x - cam, y])
    }
    path.current?.setAttribute("d", smooth(pts))
  }, 0)
  return (
    <Canvas viewBox="0 0 300 120" className={className} defs={<>
      <Marker id={id} />
      <linearGradient id={`${id}-g`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.35" stopColor="#fff" /></linearGradient>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={-20} width={300} height={160}><rect x={0} y={-20} width={300} height={160} fill={`url(#${id}-g)`} /></mask>
    </>}>
      <g mask={`url(#${id}-m)`}>
        <g filter={`url(#${id})`}>
          <rect x={-20} y={-20} width={340} height={160} fill="none" stroke="none" />
          <path ref={path} fill="none" stroke={color} strokeWidth={16} strokeLinecap="butt" strokeLinejoin="round" opacity={0.9} />
        </g>
      </g>
    </Canvas>
  )
}

/** Thinking: the leaf loop drawing itself and letting go, as on the illustration map. */
export function ThinkingLoop({ className }: { className?: string }) {
  const id = usePaintId()
  const path = useRef<SVGPathElement>(null)
  useFrames((t) => {
    const c = (t % 2.4) / 2.4
    const off = c < 0.45 ? 100 - 100 * ease(c / 0.45) : c < 0.55 ? 0 : -100 * ease((c - 0.55) / 0.45)
    path.current?.setAttribute("stroke-dashoffset", off.toFixed(2))
  }, 0.5)
  return (
    <Canvas viewBox="60 6 180 96" className={className} defs={<Marker id={id} />}>
      <g filter={`url(#${id})`}>
        <rect x={40} y={-10} width={220} height={124} fill="none" stroke="none" />
        <path ref={path} pathLength={100} strokeDasharray="100 100" fill="none" stroke={MARK.leaf} strokeWidth={15} strokeLinecap="butt" opacity={0.9}
          d="M70 84 C 120 84, 150 84, 168 64 C 188 40, 172 18, 152 20 C 130 22, 126 54, 150 74 C 170 90, 200 84, 230 84" />
      </g>
    </Canvas>
  )
}

/** Lost connection: one marker ribbon cut in two, clean ends. The ends drift, reaching for each other. */
export function BrokenThread({ className, still }: { className?: string; still?: boolean }) {
  const id = usePaintId()
  const left = useRef<SVGPathElement>(null)
  const right = useRef<SVGPathElement>(null)
  const draw = (t: number) => {
    const a = Math.sin(t * 1.2), b = Math.sin(t * 1.2 + 2.1)
    left.current?.setAttribute("d", smooth([[-8, 62], [30, 66], [70, 52], [104, 44], [134 + 4 * a, 36 - 5 * a]]))
    right.current?.setAttribute("d", smooth([[186 - 4 * b, 54 + 5 * b], [216, 46], [250, 32], [290, 34], [328, 22]]))
  }
  useFrames(still ? () => draw(0.6) : draw)
  return (
    <Canvas viewBox="0 0 320 90" className={className} defs={<Marker id={id} />}>
      <g filter={`url(#${id})`}>
        <rect x={-20} y={-20} width={360} height={130} fill="none" stroke="none" />
        <g fill="none" stroke={MARK.rose} strokeWidth={18} strokeLinecap="butt" opacity={0.9}>
          <path ref={left} />
          <path ref={right} />
        </g>
      </g>
    </Canvas>
  )
}

// A spool of ribbon standing up, seen a little from above.
function Spool({ cx, top, w, h, color, light }: { cx: number; top: number; w: number; h: number; color: string; light: string }) {
  const r = w / 2, ry = w * 0.17, bottom = top + h
  return (
    <g>
      <path d={`M${cx - r} ${top} L${cx - r} ${bottom} A${r} ${ry} 0 0 0 ${cx + r} ${bottom} L${cx + r} ${top} Z`} fill={color} />
      {[0.33, 0.66].map((k) => <path key={k} d={`M${cx - r} ${top + h * k} A${r} ${ry} 0 0 0 ${cx + r} ${top + h * k}`} fill="none" stroke={light} strokeWidth={1.6} opacity={0.7} />)}
      <ellipse cx={cx} cy={top} rx={r} ry={ry} fill={light} />
      <ellipse cx={cx} cy={top} rx={r * 0.62} ry={ry * 0.62} fill="none" stroke={color} strokeWidth={1.4} opacity={0.55} />
      <ellipse cx={cx} cy={top} rx={r * 0.3} ry={ry * 0.3} fill={PIGMENT.paper} stroke={color} strokeWidth={1.4} />
    </g>
  )
}

/** No projects yet, option A: three spools, still wound, one end already pulled loose. */
export function SpoolsArt({ className }: { className?: string }) {
  const id = usePaintId()
  return (
    <Canvas viewBox="0 0 320 190" label="Three ribbon spools, one end pulled loose" className={className} defs={<Paint id={id} level="ribbon" seed={14} />}>
      <g filter={`url(#${id})`}>
        <rect x={-20} y={-20} width={360} height={230} fill="none" stroke="none" />
        <Spool cx={118} top={52} w={58} h={52} color={WASH.leaf} light="#C6D8AE" />
        <Spool cx={196} top={46} w={52} h={48} color={WASH.sky} light="#C9DEEE" />
        <path d="M178 134 C 210 140, 232 158, 260 154 C 282 151, 292 140, 308 142" fill="none" stroke={WASH.apricot} strokeWidth={22} />
        <Spool cx={158} top={92} w={64} h={58} color={WASH.apricot} light="#F8D1AA" />
      </g>
    </Canvas>
  )
}

/** No projects yet, option B: one roll on its side, the first length unrolled across the paper. */
export function UnrollArt({ className }: { className?: string }) {
  const id = usePaintId()
  return (
    <Canvas viewBox="0 0 320 190" label="A ribbon roll, its first length unrolled" className={className} defs={<Paint id={id} level="ribbon" seed={16} />}>
      <g filter={`url(#${id})`}>
        <rect x={-20} y={-20} width={360} height={230} fill="none" stroke="none" />
        <path d="M96 148 C 150 152, 196 140, 236 142 C 262 143, 280 140, 292 124 C 298 116, 296 106, 288 104" fill="none" stroke="#F3B3C8" strokeWidth={26} />
        <circle cx={98} cy={106} r={44} fill={WASH.rose} />
        {[34, 25].map((r) => <circle key={r} cx={98} cy={106} r={r} fill="none" stroke="#F7C3D4" strokeWidth={1.8} opacity={0.8} />)}
        <circle cx={98} cy={106} r={13} fill={PIGMENT.paper} stroke="#C9567E" strokeWidth={1.6} />
      </g>
    </Canvas>
  )
}
