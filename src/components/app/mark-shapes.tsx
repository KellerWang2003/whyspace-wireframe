import type { Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"

// The high-fi drawing of the four decision marks (Forest and rose). Each mark is one SVG on a 16px grid, so its
// lines grow with its size the way Lucide's icons do, and the ring is about as heavy as an icon's line.
// The shapes still carry the meaning; the system's two colors back them. A confirmed decision is filled Forest,
// like a checked box. A decision that follows one keeps a gray ring around a Forest core: it borrows a confirmed
// decision. A guess stays a gray ring. A clash is rose ink, like a delete.
const RING = { r: 4.45, w: 1.1 }
// A touch bigger than the rounds so it weighs the same, its corners rounded like the icons' joins.
const TRIANGLE = "M8 3.95 L12.2 11.35 H3.8 Z"

export function HifiMark({ mark, className }: { mark: Mark; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn("size-4 shrink-0", className)}>
      {mark === "triangle" ? (
        <path d={TRIANGLE} fill="var(--destructive)" stroke="var(--destructive)" strokeWidth={2.2} strokeLinejoin="round" />
      ) : mark === "filled" ? (
        <circle cx={8} cy={8} r={RING.r + RING.w / 2} fill="var(--primary)" />
      ) : (
        <>
          <circle cx={8} cy={8} r={RING.r} fill="none" stroke="currentColor" strokeWidth={RING.w} />
          {mark === "ringed" && <circle cx={8} cy={8} r={1.85} fill="var(--primary)" />}
        </>
      )}
    </svg>
  )
}
