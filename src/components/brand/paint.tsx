import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { PIGMENT, blobPath, handPath, layoutStrands, type StrandSpec } from "@/components/brand/hand"


/* Whyspace hand-made shape kit.
   Everything decorative is cut and painted by hand, never ruled:
   1. Geometry: edges wobble and bow a little, corners get uneven radii (handPath).
   2. Edge: a fine displacement roughens the outline like pigment bleeding into paper.
   3. Pigment: low-frequency blooms, granulation and a darker rim where paint pools (Paint filter).
   4. Overlaps multiply.
   Text and product UI on top stay crisp; only the surfaces underneath are painted. */

export type PaintLevel = "soft" | "painted" | "torn"
const LEVELS: Record<PaintLevel, { rough: number; edgeFreq: number; bloom: number; rim: number; grain: number }> = {
  soft: { rough: 2, edgeFreq: 0.05, bloom: 0.7, rim: 0.16, grain: 0.05 },
  painted: { rough: 4.5, edgeFreq: 0.045, bloom: 1, rim: 0.25, grain: 0.07 },
  torn: { rough: 10, edgeFreq: 0.06, bloom: 1, rim: 0.28, grain: 0.08 },
}

/** The watercolor filter. Put it once inside an <svg>, then use filter="url(#id)". */
export function Paint({ id, level = "painted", seed = 3 }: { id: string; level?: PaintLevel; seed?: number }) {
  const L = LEVELS[level]
  return (
    <filter id={id} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
      {/* rough edge: pigment bleeding into paper */}
      <feTurbulence type="fractalNoise" baseFrequency={L.edgeFreq} numOctaves={3} seed={seed} result="en" />
      <feDisplacementMap in="SourceGraphic" in2="en" scale={L.rough} xChannelSelector="R" yChannelSelector="G" result="cut" />
      <feGaussianBlur in="cut" stdDeviation="0.45" result="shape" />
      {/* blooms: pigment pools deeper in its own hue, and lifts lighter where the water spread */}
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.01" numOctaves={4} seed={seed + 11} result="ln" />
      <feColorMatrix in="ln" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${-2 * L.bloom} ${1.02 * L.bloom}`} result="poolMask" />
      <feComposite in="shape" in2="poolMask" operator="in" result="pool" />
      <feBlend in="pool" in2="shape" mode="multiply" result="pooled" />
      <feColorMatrix in="ln" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${1.8 * L.bloom} ${-0.88 * L.bloom}`} result="lt" />
      <feComposite in="lt" in2="shape" operator="in" result="lift" />
      {/* granulation, in the pigment's own hue */}
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={2} seed={seed + 23} result="gn" />
      <feColorMatrix in="gn" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${-9 * L.grain} ${4.9 * L.grain}`} result="grMask" />
      <feComposite in="shape" in2="grMask" operator="in" result="gr" />
      {/* darker rim where pigment settles at the edge */}
      <feMorphology in="shape" operator="erode" radius="2" result="er" />
      <feGaussianBlur in="er" stdDeviation="3" result="erb" />
      <feComposite in="shape" in2="erb" operator="out" result="rimMask" />
      <feComponentTransfer in="rimMask" result="rimSoft"><feFuncA type="linear" slope={L.rim * 3} /></feComponentTransfer>
      <feMerge result="body">
        <feMergeNode in="pooled" />
        <feMergeNode in="lift" />
      </feMerge>
      <feBlend in="gr" in2="body" mode="multiply" result="grained" />
      <feBlend in="rimSoft" in2="grained" mode="multiply" />
    </filter>
  )
}

function useSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<[number, number]>([0, 0])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize([Math.round(e.contentRect.width), Math.round(e.contentRect.height)]))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** A painted, hand-cut surface that fills its parent. Content goes on top, crisp. */
export function PaintSurface({
  color,
  seed = 1,
  level = "painted",
  radius = 28,
  wobble,
  className,
  children,
  style,
  opacity = 1,
}: {
  color: string
  seed?: number
  level?: PaintLevel
  radius?: number
  wobble?: number
  className?: string
  children?: ReactNode
  style?: CSSProperties
  opacity?: number
}) {
  const [ref, [w, h]] = useSize()
  const id = useId().replace(/:/g, "")
  const pad = 12
  const wob = wobble ?? Math.max(1.5, Math.min(w, h) * 0.012)
  return (
    <div ref={ref} className={cn("relative", className)} style={style}>
      {w > 0 && (
        <svg className="pointer-events-none absolute" style={{ left: -pad, top: -pad, width: w + pad * 2, height: h + pad * 2, opacity }} viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`} aria-hidden>
          <defs><Paint id={`p${id}`} level={level} seed={seed} /></defs>
          <path d={handPath([[0, 0], [w, 0], [w, h], [0, h]], { seed, radius, wobble: wob })} fill={color} filter={`url(#p${id})`} />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

/** A painted pill button surface. */
export function PaintButton({ children, onClick, color = PIGMENT.forest, ink = PIGMENT.paper, seed = 5, size = "md", className }: { children: ReactNode; onClick?: () => void; color?: string; ink?: string; seed?: number; size?: "sm" | "md"; className?: string }) {
  return (
    <button onClick={onClick} className={cn("group inline-flex transition-transform hover:-translate-y-0.5 active:translate-y-0", className)}>
      <PaintSurface color={color} seed={seed} level="soft" radius={size === "sm" ? 18 : 24} wobble={1.4} className="w-full">
        <span className={cn("flex items-center justify-center gap-2 font-medium", size === "sm" ? "h-10 px-5 text-[14px]" : "h-12 px-7 text-[15px]")} style={{ color: ink }}>{children}</span>
      </PaintSurface>
    </button>
  )
}

/** A row of hand-cut strands that lean like the Y's bands. Widths, gaps and angles all drift a little. */
export function Strands({
  strands,
  height = 130,
  lean = 0.6,
  gap = 16,
  seed = 7,
  level = "painted",
  className,
  animate = false,
}: {
  strands: StrandSpec[]
  height?: number
  lean?: number
  gap?: number
  seed?: number
  level?: PaintLevel
  className?: string
  animate?: boolean
}) {
  const id = useId().replace(/:/g, "")
  const { parts, W } = layoutStrands(strands, { height, lean, gap, seed })
  return (
    <svg viewBox={`-12 -16 ${W + 24} ${height + 32}`} className={cn("w-full overflow-visible", className)} aria-hidden>
      <defs><Paint id={`s${id}`} level={level} seed={seed} /></defs>
      {parts.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} filter={`url(#s${id})`} className={animate ? "ws-strand" : undefined} style={animate ? { transitionDelay: `${i * 90}ms` } : undefined} />
      ))}
    </svg>
  )
}

/** A loose painted blob, for backgrounds and accents. */
export function Blob({ color, seed = 2, size = 200, level = "painted", className, style }: { color: string; seed?: number; size?: number; level?: PaintLevel; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  const d = blobPath(size, seed)
  return (
    <svg viewBox={`-10 -10 ${size + 20} ${size + 20}`} className={className} style={style} aria-hidden>
      <defs><Paint id={`b${id}`} level={level} seed={seed} /></defs>
      <path d={d} fill={color} filter={`url(#b${id})`} />
    </svg>
  )
}

export type PortraitSpec = {
  src: string
  /** Size of the source crop. */
  w: number
  h: number
  /** The strand the person sits on, in crop pixels. */
  strand: [number, number][]
  /** The head, which pops out above the strand: cx, cy, rx, ry. */
  head: [number, number, number, number]
}

/** A person on a strand, like the hero thread: the strand is cut by hand, the head pops out above it. */
export function PortraitStrand({ spec, seed = 4, className, style }: { spec: PortraitSpec; seed?: number; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  const [cx, cy, rx, ry] = spec.head
  return (
    <svg viewBox={`0 0 ${spec.w} ${spec.h}`} className={className} style={style} aria-hidden>
      <defs>
        <filter id={`r${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={3} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={spec.w} height={spec.h}>
          <g filter={`url(#r${id})`}>
            <path d={handPath(spec.strand, { seed, radius: 14, wobble: 1.4, unevenCorners: 0.4 })} fill="white" />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" />
          </g>
        </mask>
      </defs>
      <image href={spec.src} width={spec.w} height={spec.h} mask={`url(#m${id})`} />
    </svg>
  )
}
