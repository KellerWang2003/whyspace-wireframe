import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import { AudioLines, Check, ChevronDown, Mic, MicOff, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectMark } from "@/components/app/project-mark"
import { OverlayCount, OverlayLogo, OverlayWhere } from "@/components/app/overlay-kit"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"
import { MockDesktop } from "@/screens/mock-desktop"
import { checkRows, confirmedHere, needsYou, useCaught, type Caught, type CaughtActions } from "@/screens/overlay-model"
import { ExpandedPanel } from "@/screens/overlay-panel"

// The overlay outside the app: one pill, three moments. Layout "inline" from the pill playground
// (Expanded tab) reads best at this width; the other two are a one-word change here. While you work it shows the most urgent
// mark with everything waiting inside; click it and the expanded pill shows what needs you here and
// what was caught. When you share (Share in the app you work in), it opens once with the guesses
// still in the work: the check. Nothing blocks. OverlayPill is the pill itself, so the Desk can
// drop it on any scene; DesktopMode is the standalone demo with the mock Claude window.

export type Where = { project: string; part: string }

const PARTS: Record<string, string[]> = {
  whiskr: ["Research", "Brand", "App", "Marketing"],
  studio: ["Interviews", "Concept", "Prototype", "Final crit"],
}

// Motion: nothing in the overlay jumps. The box morphs between the pill and the panel
// (FLIP on width and height), content fades in after it, and cards fade in when they
// arrive and fold away when confirmed or removed. All of it is skipped when the system
// asks for reduced motion.
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

function fadeIn(el: HTMLElement | null, delay = 0) {
  if (!el || reducedMotion()) return
  el.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 220, delay, easing: EASE, fill: "backwards" })
}

// Fades an element in the first time it renders.
function useFadeIn<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => fadeIn(ref.current), [])
  return ref
}

// The pill docks to any screen edge. On the top or bottom edge it lays out sideways.
// `t` is where along that edge it sits, 0 to 1. The expanded panel opens from there.
type Edge = "left" | "right" | "top" | "bottom"
type Dock = { edge: Edge; t: number }
const GAP = 12
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function dockStyle({ edge, t }: Dock): CSSProperties {
  // Moving along the edge, translating by t of its own size keeps it on screen at both ends.
  const along = (axis: "vh" | "vw") => `calc(${GAP}px + (100${axis} - ${GAP * 2}px) * ${t})`
  if (edge === "left" || edge === "right") return { [edge]: GAP, top: along("vh"), translate: `0 ${-t * 100}%` }
  return { [edge]: GAP, left: along("vw"), translate: `${-t * 100}% 0` }
}

// The nearest edge to where the pill was let go, and where along it.
function snap(r: DOMRect): Dock {
  const W = window.innerWidth
  const H = window.innerHeight
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const dist: [Edge, number][] = [["left", cx], ["right", W - cx], ["top", cy], ["bottom", H - cy]]
  const edge = dist.sort((a, b) => a[1] - b[1])[0][0]
  const vertical = edge === "left" || edge === "right"
  // The pill's long side once docked: ~48 across, ~110 along.
  const len = 110
  const t = vertical ? (cy - GAP - len / 2) / (H - GAP * 2 - len) : (cx - GAP - len / 2) / (W - GAP * 2 - len)
  return { edge, t: clamp01(t) }
}

// The pill. Whoever renders it owns what it holds (`all`, from useCaught), where it saves to, whether it is
// open and which check it shows; the pill owns its spot on the screen and the live session toggle.
export function OverlayPill({ all, act, where, onWhere, expanded, onExpanded, check, onCheck, onOpenApp }: {
  all: Caught[]
  act: CaughtActions
  where: Where
  // Given, the header lets you pick another project or thread. Absent, it only says where you are.
  onWhere?: (where: Where) => void
  expanded: boolean
  onExpanded: (open: boolean) => void
  // The check when you share: the guesses it opened with. Null when the panel shows Needs you.
  check: string[] | null
  onCheck: (ids: string[] | null) => void
  // Given, the Y in the header opens Whyspace itself.
  onOpenApp?: () => void
}) {
  const [live, setLive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const boxRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastSize = useRef<{ width: number; height: number } | null>(null)
  // Drag the pill anywhere; let go and it snaps to the nearest edge.
  const [dock, setDock] = useState<Dock>({ edge: "right", t: 0.5 })
  const [dragAt, setDragAt] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)
  const flipFrom = useRef<DOMRect | null>(null)
  const horizontal = !expanded && (dock.edge === "top" || dock.edge === "bottom")
  const projectName = PROJECTS.find((p) => p.id === where.project)?.name?.replace(/\s*\(.*\)$/, "")
  const needs = needsYou(all, where)
  const confirmed = confirmedHere(all, where)
  // The pill's shape is the badge: ▲ if anything clashes, ○ if guesses wait, else the confirmed count.
  const top = needs.some((c) => c.kind === "clash") ? "triangle" : needs.length ? "empty" : null

  function close() {
    // Closing the check is fine: the work travels as it is, and the next share asks only about new guesses.
    if (check) act.finishCheck(check)
    onCheck(null)
    onExpanded(false)
  }

  // Clicking anywhere outside closes it (the project menu renders outside, so it's exempt).
  useEffect(() => {
    if (!expanded) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (boxRef.current?.contains(t) || menuOpen) return
      close()
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  })

  // ⌘⇧Y opens and closes it from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "y") {
        e.preventDefault()
        onExpanded(!expanded)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, onExpanded])

  // Keep the box's latest size, including mid-animation, so a morph starts from what's on screen.
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => { lastSize.current = { width: el.offsetWidth, height: el.offsetHeight } })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Morph between pill and panel, then fade in whichever content is now showing.
  useLayoutEffect(() => {
    const el = boxRef.current
    const prev = lastSize.current
    if (!el || !prev || reducedMotion()) return
    const next = { width: el.offsetWidth, height: el.offsetHeight }
    el.animate(
      [{ width: `${prev.width}px`, height: `${prev.height}px` }, { width: `${next.width}px`, height: `${next.height}px` }],
      { duration: 320, easing: EASE },
    )
    fadeIn(expanded ? panelRef.current : pillRef.current, 90)
  }, [expanded])

  // After a snap, glide from where it was let go to its docked spot.
  useLayoutEffect(() => {
    const el = boxRef.current
    const from = flipFrom.current
    flipFrom.current = null
    if (!el || !from || reducedMotion()) return
    const to = el.getBoundingClientRect()
    el.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: "none" }], { duration: 280, easing: EASE })
  }, [dock])

  function onPillDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || !boxRef.current) return
    const r = boxRef.current.getBoundingClientRect()
    drag.current = { sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPillMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d) return
    // A few pixels of wobble is still a click.
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return
    d.moved = true
    setDragAt({ x: e.clientX - d.ox, y: e.clientY - d.oy })
  }
  function onPillUp() {
    const d = drag.current
    drag.current = null
    if (!d?.moved || !boxRef.current) return
    justDragged.current = true
    const r = boxRef.current.getBoundingClientRect()
    flipFrom.current = r
    setDragAt(null)
    setDock(snap(r))
  }

  const whereLabel = <OverlayWhere project={where.project} name={projectName} part={where.part} />

  return (
    <section
      ref={boxRef}
      aria-label="Whyspace desktop overlay"
      data-overlay={expanded ? "open" : "pill"}
      data-edge={horizontal ? "h" : "v"}
      onKeyDown={(e) => { if (e.key === "Escape") { close(); pillRef.current?.focus() } }}
      className={cn(
        "group/box fixed z-30 flex max-h-[calc(100svh-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden border border-white/60 bg-background/85 shadow-xl ring-1 ring-black/5 backdrop-blur-xl",
        "transition-[border-radius,box-shadow,background-color] duration-300",
        expanded ? "max-h-[560px] w-[320px] rounded-2xl" : cn(horizontal ? "h-12" : "w-12", "rounded-[24px] hover:bg-background hover:shadow-2xl hover:ring-black/15"),
        dragAt && "cursor-grabbing shadow-2xl",
      )}
      style={dragAt ? { left: dragAt.x, top: dragAt.y } : dockStyle(dock)}
    >
      <button
        ref={pillRef}
        type="button"
        hidden={expanded}
        aria-expanded={expanded}
        aria-label={`Open Whyspace · ${projectName}`}
        onPointerDown={onPillDown}
        onPointerMove={onPillMove}
        onPointerUp={onPillUp}
        onPointerCancel={onPillUp}
        onClick={() => { if (justDragged.current) { justDragged.current = false; return } onExpanded(true) }}
        className={cn("touch-none items-center gap-2.5 outline-none select-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", expanded ? "hidden" : horizontal ? "flex h-full flex-row px-2.5" : "flex flex-col px-2 py-3")}
      >
        <ProjectMark project={where.project} className="size-7 rounded-md" />
        {/* Only the most urgent mark shows, with everything waiting inside. Nothing waiting: the confirmed count. */}
        {top ? <OverlayCount top={top} n={needs.length} /> : confirmed.length > 0 && (
          <span role="status" className="text-xs font-medium tabular-nums text-muted-foreground">
            {confirmed.length}<span className="sr-only"> confirmed</span>
          </span>
        )}
        {live && (
          <FadeIn as="span" role="status" className="grid size-5 place-items-center">
            <AudioLines className="size-4" />
            <span className="sr-only">Live session on</span>
          </FadeIn>
        )}
      </button>

      <div ref={panelRef} hidden={!expanded} className={cn("min-h-0 flex-1 flex-col", expanded ? "flex" : "hidden")}>
        <ExpandedPanel
          layout="inline"
          all={all}
          act={act}
          where={where}
          check={check}
          onCheckDone={() => { onCheck(null); onExpanded(false) }}
          header={
            <header data-overlay-head className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
              <OverlayLogo onClick={onOpenApp} />
              {onWhere ? (
                <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Save to ${projectName}, ${where.part}`}>
                    {whereLabel}
                    <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-60">
                    {Object.entries(PARTS).map(([project, parts], i) => (
                      <div key={project}>
                        {i > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ProjectMark project={project} className="size-4" />
                          {PROJECTS.find((p) => p.id === project)?.name}
                        </DropdownMenuLabel>
                        {parts.map((part) => (
                          <DropdownMenuItem key={part} onSelect={() => onWhere({ project, part })}>
                            {part}
                            {where.project === project && where.part === part && <Check className="ml-auto" />}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-xs" aria-label={`Saving to ${projectName}, ${where.part}`}>{whereLabel}</span>
              )}
              <Button size="icon-sm" variant="ghost" className={cn("size-7", live && "text-foreground")} title={live ? "End live session" : "Start live"} aria-label={live ? "End live session" : "Start live"} aria-pressed={live} onClick={() => { setLive((v) => !v); if (live) toast("Session saved") }}>
                {live ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
              </Button>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Close" onClick={close}><X className="size-3.5" /></Button>
            </header>
          }
        />
      </div>
    </section>
  )
}

// A session can be any conversation, with Whyspace in the background: a mock desktop with a
// Claude-style chat, and the pill on top. Share in the chat window opens the check.
// This wireframe previews the controls; it does not capture or transcribe audio.
export function DesktopMode({ onExit }: { onExit?: () => void } = {}) {
  const [all, act] = useCaught()
  const [where, setWhere] = useState<Where>({ project: "whiskr", part: "Marketing" })
  // Click to open, like other overlays: hovering only highlights the pill.
  const [expanded, setExpanded] = useState(false)
  const [check, setCheck] = useState<string[] | null>(null)
  function share() {
    setCheck(checkRows(all, where).map((c) => c.id))
    setExpanded(true)
  }
  return (
    <div className="fixed inset-0 z-40 isolate bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          // A calm stand-in wallpaper: soft gray light, low contrast, so the overlay reads on top.
          background: "radial-gradient(ellipse 80% 70% at 18% 12%, #f5f5f4 0%, transparent 60%), radial-gradient(ellipse 70% 80% at 85% 90%, #c9cbcf 0%, transparent 65%), linear-gradient(160deg, #e7e7e9 0%, #d9dadd 100%)",
        }}
      />
      <MockDesktop onShare={share} />
      <OverlayPill
        all={all}
        act={act}
        where={where}
        onWhere={(w) => { setWhere(w); setCheck(null) }}
        expanded={expanded}
        onExpanded={setExpanded}
        check={check}
        onCheck={setCheck}
        onOpenApp={onExit}
      />
    </div>
  )
}

// Wraps content that should fade in when it appears (give it a key to replay on change).
function FadeIn({ as: Tag = "div", ...props }: { as?: "div" | "span" } & React.HTMLAttributes<HTMLElement>) {
  const ref = useFadeIn<HTMLElement>()
  return <Tag ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>} {...props} />
}
