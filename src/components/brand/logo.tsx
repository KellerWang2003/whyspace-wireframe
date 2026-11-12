import { useEffect, useId, useRef, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { PIGMENT } from "./hand"
import { ICON_NUDGE, ICON_RADIUS, ICON_VIEWBOX, LOCKUPS, MARK_D, MARK_VIEWBOX } from "./logo-paths"

// The Whyspace logo, one place for every use (replacement plan P0, Nov 12 2026):
// - WhyspaceMark: the bare forest mark, inside our own UI (rail, overlay pill). `appear` writes it by hand.
// - WhyspaceIcon: the app icon tile, wherever we sit next to other apps (dock, browser tab, Slack, connectors).
// - WhyspaceLockup: mark + name. Stacked is the main one (sign-in, landing, brand pages); beside the name is secondary.
// - WhyspaceThread: the mark running on into a thread ("Rounder last loop"). Logo animation only (landing hero).
// Size everything with a width class; the height follows the artwork.

type Tone = "forest" | "paper" | "ink" | "current"
const FILL: Record<Tone, string> = { forest: PIGMENT.forest, paper: PIGMENT.paper, ink: "#1E211B", current: "currentColor" }

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Timing, in seconds, from the motion page: the pen writes in 1.5s (slow in the turns), holds, then unwrites.
const IN = 1.5, HOLD = 1.8, OUT = 0.85, GAP = 0.7
const easeIn = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x)

// The appear frames are big (the brush stroke cut at 56 points), so they load only when something plays.
let frames: Promise<string[]> | null = null
const loadFrames = () => (frames ??= import("./logo-appear.json").then((m) => m.default.head as string[]))

/** Writes the mark into `path`: once and holds, or (loop) write, hold, unwrite, again. Remount to replay. */
function useAppear(on: boolean, loop: boolean) {
  const path = useRef<SVGPathElement>(null)
  useEffect(() => {
    const el = path.current
    if (!on || !el) return
    if (reduced()) { el.setAttribute("d", MARK_D); return }
    el.setAttribute("d", "")
    let raf = 0, dead = false
    loadFrames().then((head) => {
      if (dead) return
      const n = head.length
      const at = (k: number) => (k >= 1 ? MARK_D : k <= 0 ? "" : head[Math.min(n - 1, Math.floor(k * n))])
      const t0 = performance.now()
      const tick = (now: number) => {
        const t = (now - t0) / 1000
        const c = loop ? t % (IN + HOLD + OUT + GAP) : t
        if (c < IN) el.setAttribute("d", at(c / IN))
        else if (!loop || c < IN + HOLD) el.setAttribute("d", MARK_D)
        else el.setAttribute("d", at(1 - easeIn((c - IN - HOLD) / OUT) * 1.0001))
        if (loop || c < IN) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    return () => { dead = true; cancelAnimationFrame(raf) }
  }, [on, loop])
  return { path }
}

/** The bare mark. Forest by default; paper on a dark ground. */
export function WhyspaceMark({ tone = "forest", appear = false, loop = false, title = "Whyspace", className, style }: {
  tone?: Tone; appear?: boolean; loop?: boolean; title?: string | null; className?: string; style?: CSSProperties
}) {
  const { path } = useAppear(appear, loop)
  return (
    <svg viewBox={MARK_VIEWBOX} role={title ? "img" : undefined} aria-label={title ?? undefined} aria-hidden={title ? undefined : true} className={cn("block h-auto w-[22px] shrink-0", className)} style={style}>
      <path ref={path} d={appear ? "" : MARK_D} fill={FILL[tone]} fillRule="evenodd" />
    </svg>
  )
}

/** The app icon: the paper mark on the forest tile. */
export function WhyspaceIcon({ appear = false, loop = false, title = "Whyspace", className }: {
  appear?: boolean; loop?: boolean; title?: string | null; className?: string
}) {
  const { path } = useAppear(appear, loop)
  return (
    <svg viewBox={ICON_VIEWBOX} role={title ? "img" : undefined} aria-label={title ?? undefined} aria-hidden={title ? undefined : true} className={cn("block size-10 shrink-0", className)}>
      <rect x={-40} y={-40} width={680} height={680} rx={ICON_RADIUS} fill={PIGMENT.forest} />
      <path ref={path} transform={ICON_NUDGE} d={appear ? "" : MARK_D} fill={PIGMENT.paper} fillRule="evenodd" />
    </svg>
  )
}

/** Mark + name. `stacked` (main) or `beside` (secondary). */
export function WhyspaceLockup({ variant = "stacked", tone = "forest", appear = false, className }: {
  variant?: keyof typeof LOCKUPS; tone?: Tone; appear?: boolean; className?: string
}) {
  const l = LOCKUPS[variant]
  const { path } = useAppear(appear, false)
  return (
    <svg viewBox={l.vb} role="img" aria-label="Whyspace" className={cn("block h-auto shrink-0", variant === "stacked" ? "w-32" : "w-36", className)}>
      <g fill={FILL[tone]} fillRule="evenodd">
        <path ref={path} transform={l.mark} d={appear ? "" : MARK_D} />
        <path d={l.word} />
      </g>
    </svg>
  )
}

// The run-on thread: one coil that winds down into a baseline thread. Loads on first use (it's large).
type ThreadArt = { d: string; clips: string[]; vb: number[] }
let thread: Promise<ThreadArt> | null = null
const loadThread = () => (thread ??= import("./logo-thread.json").then((m) => m.default as ThreadArt))

/** The mark running on into a thread, written by hand once (3.3s), then held. */
export function WhyspaceThread({ tone = "forest", duration = 3.3, delay = 0.3, className }: {
  tone?: Tone; duration?: number; delay?: number; className?: string
}) {
  const [art, setArt] = useState<ThreadArt | null>(null)
  const clip = useRef<SVGPathElement>(null)
  const group = useRef<SVGGElement>(null)
  const id = "ws-thread-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
  useEffect(() => { let dead = false; loadThread().then((a) => { if (!dead) setArt(a) }); return () => { dead = true } }, [])
  useEffect(() => {
    const c = clip.current, g = group.current
    if (!art || !c || !g) return
    if (reduced()) { g.removeAttribute("clip-path"); return }
    const n = art.clips.length
    let raf = 0
    const t0 = performance.now() + delay * 1000
    const tick = (now: number) => {
      const k = (now - t0) / 1000 / duration
      if (k >= 1) { g.removeAttribute("clip-path"); return }
      c.setAttribute("d", k <= 0 ? "" : art.clips[Math.min(n - 1, Math.floor(k * n))])
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [art, duration, delay])
  if (!art) return <svg viewBox="-81 -185 1402 339" aria-hidden className={cn("block h-auto w-full", className)} />
  return (
    <svg viewBox={art.vb.join(" ")} role="img" aria-label="Whyspace" className={cn("block h-auto w-full", className)}>
      <clipPath id={id}><path ref={clip} d="" /></clipPath>
      <g ref={group} clipPath={`url(#${id})`} fill={FILL[tone]} fillRule="evenodd"><path d={art.d} /></g>
    </svg>
  )
}

