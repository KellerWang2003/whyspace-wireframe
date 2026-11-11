import { useId, type CSSProperties } from "react"
import { handPath } from "@/components/brand/hand"
import { Paint } from "@/components/brand/paint"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"

// Count badges and "needs you" dots: the rail's Today and Chats counts, a project's dot in the rail,
// and counts at the end of a row (a chat, Waiting for you, a project on Today).
// High-fi: a small watercolor pebble in a deep green (--hifi-badge) with a paper number, cut like the brand's
// painted shapes. Wireframe: the plain ink pill and dot.

// What a rail badge cuts out of: the rail sets --tw-ring-color on [data-rail-badge] to the tile behind it,
// anywhere else --badge-cut (it inherits) or the sidebar. Tailwind's ring color doesn't inherit, so the badge
// copies it into a variable its drawing can read.
const HALO = "var(--badge-halo, var(--sidebar))"
const HALO_VAR = { "--badge-halo": "var(--tw-ring-color, var(--badge-cut, var(--sidebar)))" } as CSSProperties
const PIGMENT = "var(--hifi-badge)"
// One paint seed for every badge, so each has the same depth of color (the outline still varies with the count).
const PAINT_SEED = 5
const fmt = (n: number) => (n > 99 ? "99+" : String(n))

type Pt = [number, number]
const ring = (cx: number, cy: number, rx: number, ry: number, n = 8): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry])
const rect = (w: number, h: number, inset: number): Pt[] => [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset]]

// The painted pebble. A flat base under the paint fills its lighter blooms, so a wide badge reads as deep as a small one.
function Pebble({ d, id, halo }: { d: string; id: string; halo?: boolean }) {
  return (
    <>
      <defs><Paint id={id} level="soft" seed={PAINT_SEED} /></defs>
      {halo && <path d={d} fill={HALO} stroke={HALO} strokeWidth={8} />}
      <path d={d} fill={PIGMENT} opacity={0.55} transform="translate(20 20) scale(0.9) translate(-20 -20)" />
      <g fill={PIGMENT} filter={`url(#${id})`}><path d={d} /></g>
    </>
  )
}

/** A count. `suffix` adds a word after the number ("3 new"); `halo` cuts it out of the tile behind (the rail). */
export function CountBadge({ n, suffix, halo, rail, className }: { n: number; suffix?: string; halo?: boolean; rail?: boolean; /** Kept for callers; every count is one size now. */ size?: "sm" | "md"; className?: string }) {
  const hifi = useHifi()
  const id = useId().replace(/:/g, "")
  const text = suffix ? `${fmt(n)} ${suffix}` : fmt(n)
  if (!hifi) {
    return (
      <span data-rail-badge={rail || undefined} className={cn("flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background", className)}>
        {text}
      </span>
    )
  }
  // Drawn in a 40-unit-high box, so the paint and the edge scale with the badge.
  // Big enough that the number reads at a glance (Keller, Nov 11): 20px in the rail's 44px tile and in rows.
  const h = 20
  const W = 40 + (text.length - 1) * (suffix ? 11 : 12)
  const shape = handPath(text.length > 1 ? rect(W, 40, 3) : ring(20, 20, 17, 16.5), { seed: 7 + n, radius: 16, wobble: 1.3, unevenCorners: 0.4 })
  return (
    <span data-rail-badge={rail || undefined} className={cn("relative inline-block shrink-0", className)} style={{ width: (W / 40) * h, height: h, ...HALO_VAR }}>
      <svg viewBox={`0 0 ${W} 40`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <Pebble d={shape} id={`b${id}`} halo={halo} />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center leading-none font-semibold whitespace-nowrap tabular-nums text-[var(--brand-paper)]", "text-[11px]")}>{text}</span>
    </span>
  )
}

/** A dot that says something here needs you (a project in the rail). */
export function NeedsDot({ halo, rail, className, label }: { halo?: boolean; rail?: boolean; className?: string; label?: string }) {
  const hifi = useHifi()
  const id = useId().replace(/:/g, "")
  if (!hifi) return <span data-rail-badge={rail || undefined} aria-label={label} className={cn("size-2 rounded-full bg-foreground", className)} />
  const shape = handPath(ring(20, 20, 16, 15), { seed: 5, radius: 14, wobble: 1.4, unevenCorners: 0.5 })
  return (
    <span data-rail-badge={rail || undefined} role={label ? "img" : undefined} aria-label={label} className={cn("relative inline-block size-3.5 shrink-0", className)} style={HALO_VAR}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <Pebble d={shape} id={`d${id}`} halo={halo} />
      </svg>
    </span>
  )
}

/** The rail's badge (High-fi), in the top right of its 36px icon tile. Keeps data-rail-badge for the cut-out color. */
export function RailCount({ n, dot }: { n: number; dot?: boolean }) {
  return dot
    ? <NeedsDot rail halo label={`${n} need you`} className="absolute top-1 right-1" />
    : <CountBadge rail halo n={n} className="absolute top-0.5 right-0.5" />
}
