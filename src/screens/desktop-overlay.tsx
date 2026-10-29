import { useLayoutEffect, useRef, useState } from "react"
import { AudioLines, Check, ChevronDown, Mic, Pause, Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ProjectMark } from "@/components/app/project-mark"
import { StatusIcon } from "@/components/app/status-badge"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"

type Decision = {
  id: string
  title: string
  inferred?: boolean
  why?: string
  question?: string
  options?: string[]
  project: string
  part: string
  session?: number
}

type Session = { id: number; project: string; part: string; state: "active" | "paused" | "ended" }

const PARTS: Record<string, string[]> = {
  whiskr: ["Research", "Brand", "App", "Marketing"],
  studio: ["Interviews", "Concept", "Prototype", "Final crit"],
}

// Static examples. New decisions only appear after an explicit action.
const INITIAL_DECISIONS: Decision[] = [
  { id: "o1", title: "The promo video runs 15 seconds", inferred: true, why: "Inferred: cats lose interest fast", project: "whiskr", part: "Marketing" },
  { id: "o2", title: "Open on Luna's real pounce", question: "Why open on the pounce?", options: ["Shows the idea in the first second", "Real footage feels honest"], project: "whiskr", part: "Marketing" },
  { id: "o3", title: "Pull visuals from our brand guidelines", why: "Blue and yellow, with the purring dot", project: "whiskr", part: "Marketing" },
]

// Motion: nothing in the overlay jumps. The box morphs between the pill and the panel
// (FLIP on width and height), content fades in after it, sections slide open, and rows
// fade in when they arrive and fold away when confirmed or removed. All of it is skipped
// when the system asks for reduced motion.
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

// Folds a row away, then runs the state change that removes or moves it.
function foldAway(el: HTMLElement | null, then: () => void) {
  if (!el || reducedMotion()) return then()
  const h = el.offsetHeight
  el.animate(
    [{ opacity: 1, height: `${h}px` }, { opacity: 0, height: "0px", paddingTop: "0px", paddingBottom: "0px", marginTop: "0px" }],
    { duration: 220, easing: EASE, fill: "forwards" },
  ).finished.then(then)
}

// A session can be any conversation, with Whyspace in the background.
// This wireframe previews the controls; it does not capture or transcribe audio.
export function DesktopMode() {
  const [decisions, setDecisions] = useState<Decision[]>(INITIAL_DECISIONS)
  const [where, setWhere] = useState({ project: "whiskr", part: "Marketing" })
  const [session, setSession] = useState<Session | null>(null)
  const [capturedOpen, setCapturedOpen] = useState(false)
  const [hovered, setHoveredNow] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const boxRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastSize = useRef<{ width: number; height: number } | null>(null)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const expanded = hovered || keyboardFocus || menuOpen
  const running = session?.state === "active" || session?.state === "paused"
  const projectName = PROJECTS.find((p) => p.id === where.project)?.name
  const visible = decisions.filter((d) => d.project === where.project && d.part === where.part)
  const needsAttention = visible.filter((d) => d.inferred || (d.question && !d.why))
  const confirmed = visible.filter((d) => !d.inferred && !(d.question && !d.why))

  // Open at once, close after a beat so brushing past the edge doesn't flicker.
  function setHovered(on: boolean) {
    window.clearTimeout(closeTimer.current)
    if (on) setHoveredNow(true)
    else closeTimer.current = window.setTimeout(() => setHoveredNow(false), 220)
  }

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

  function update(id: string, patch: Partial<Decision> | null) {
    setDecisions((all) => patch ? all.map((d) => d.id === id ? { ...d, ...patch } : d) : all.filter((d) => d.id !== id))
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
      <section
        ref={boxRef}
        aria-label="Whyspace desktop overlay"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={(e) => { if (e.target.matches(":focus-visible")) setKeyboardFocus(true) }}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false) }}
        onPointerDown={(e) => { if (e.pointerType === "touch") setHovered(true) }}
        onKeyDown={(e) => { if (e.key === "Escape") { setCapturedOpen(false); setHovered(false); setKeyboardFocus(false) } }}
        className={cn("fixed top-1/2 right-3 flex max-h-[calc(100svh-2rem)] max-w-[calc(100vw-1.5rem)] -translate-y-1/2 flex-col overflow-hidden border border-white/60 bg-background/85 shadow-xl ring-1 ring-black/5 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-ring", "transition-[border-radius] duration-300", expanded ? "w-[288px] rounded-2xl" : "w-12 rounded-[24px]")}
      >
        <div ref={pillRef} hidden={expanded} className={cn("items-center gap-3 px-2 py-4", expanded ? "hidden" : "flex flex-col")}>
          <span title={projectName} aria-label={projectName}>
            <ProjectMark project={where.project} className="size-7 rounded-md" />
          </span>
          <span role="status" title={`${visible.length} decisions`} className="text-sm font-medium leading-none tabular-nums">
            {visible.length}<span className="sr-only"> decisions</span>
          </span>
          {running && (
            <FadeIn as="span" key={session.state} role="status" title={session.state === "paused" ? "Live session paused" : "Live session on"} className="grid size-5 place-items-center">
              {session.state === "paused" ? <Pause className="size-3.5 text-muted-foreground" /> : <AudioLines className="size-4" />}
              <span className="sr-only">{session.state === "paused" ? "Live session paused" : "Live session on"}</span>
            </FadeIn>
          )}
        </div>
        <div ref={panelRef} hidden={!expanded} className={cn("min-h-0 flex-col", expanded ? "flex" : "hidden")}>
        <header className="flex h-12 shrink-0 items-center gap-2.5 border-b px-4">
          <span className="shrink-0 text-sm font-semibold tracking-tight" aria-label="Whyspace">Y</span>
          <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger disabled={running} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default" aria-label={`Save to ${projectName}, ${where.part}`}>
              <span className="truncate font-medium">{projectName}</span>
              <span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{where.part}</span>
              {!running && <ChevronDown className="size-3 shrink-0 text-muted-foreground" />}
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
                    <DropdownMenuItem key={part} onSelect={() => { setWhere({ project, part }); setCapturedOpen(false) }}>
                      {part}
                      {where.project === project && where.part === part && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <section aria-label="Open decisions" className="min-h-[240px] shrink-0 px-3 py-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-medium">Open</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{needsAttention.length}</span>
            </div>
            {needsAttention.length ? (
              <ul className="space-y-1.5">
                {needsAttention.map((d) => <DecisionRow key={d.id} decision={d} onUpdate={(patch) => update(d.id, patch)} />)}
              </ul>
            ) : <p className="px-1 text-xs text-muted-foreground">All caught up</p>}
          </section>

          <section aria-label="Captured decisions" className="shrink-0 border-t">
            <button
              type="button"
              aria-expanded={capturedOpen}
              aria-controls="overlay-captured-decisions"
              onClick={() => setCapturedOpen((open) => !open)}
              className="flex w-full items-center gap-2 px-4 py-3 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="flex-1 text-left font-medium">Captured</span>
              <span className="tabular-nums text-muted-foreground">{confirmed.length}</span>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", capturedOpen && "rotate-180")} />
            </button>
            {/* Slides open: grid rows animate from 0fr to 1fr. */}
            <div id="overlay-captured-decisions" inert={!capturedOpen} className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]", capturedOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="min-h-0 overflow-hidden"><div className="max-h-48 overflow-y-auto px-3 pb-3">
              {confirmed.length ? (
                <ul className="space-y-0.5">
                  {confirmed.map((d) => <DecisionRow key={d.id} decision={d} onUpdate={(patch) => update(d.id, patch)} />)}
                </ul>
              ) : <p className="px-1 text-xs text-muted-foreground">No decisions yet</p>}
            </div></div>
            </div>
          </section>
        </div>

        <footer className="shrink-0 px-3 pb-3">
          {running ? (
            <FadeIn key="live" className="flex h-9 items-center gap-2 rounded-lg border bg-background/50 px-2">
              <Mic className="size-3.5 text-muted-foreground" />
              <FadeIn role="status" key={session.state} className="flex-1 text-xs font-medium">{session.state === "paused" ? "Paused" : "Live"}</FadeIn>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label={session.state === "paused" ? "Resume session" : "Pause session"} onClick={() => setSession({ ...session, state: session.state === "paused" ? "active" : "paused" })}>
                {session.state === "paused" ? <Play className="size-3" /> : <Pause className="size-3" />}
              </Button>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label="End session" onClick={() => setSession({ ...session, state: "ended" })}><Square className="size-3" /></Button>
            </FadeIn>
          ) : (
            <FadeIn key="start">
              <Button size="sm" variant="outline" className="h-9 w-full gap-2 rounded-lg bg-background/50 text-xs" onClick={() => setSession({ id: Date.now(), ...where, state: "active" })}><Mic className="size-3.5" />Start live</Button>
            </FadeIn>
          )}
        </footer>
        </div>
      </section>

    </div>
  )
}

function DecisionRow({ decision: d, onUpdate }: { decision: Decision; onUpdate: (patch: Partial<Decision> | null) => void }) {
  const [answering, setAnswering] = useState(false)
  const rowRef = useFadeIn<HTMLLIElement>()
  // Confirming or removing folds the row away first, so it doesn't vanish mid-list.
  const fold = (patch: Partial<Decision> | null) => foldAway(rowRef.current, () => onUpdate(patch))
  const [why, setWhy] = useState("")
  const needsReason = Boolean(d.question && !d.why)
  const needsAttention = d.inferred || needsReason
  const status = d.inferred ? "Suggested decision · needs review" : needsReason ? "Decision needs a reason" : "Confirmed decision"
  return (
    <li ref={rowRef} className={cn("group flex items-start gap-2 overflow-hidden rounded-md px-2 py-2 transition-colors duration-300", needsAttention ? "bg-muted/60" : "text-muted-foreground")}>
      <span title={status} className={cn("mt-0.5", needsAttention ? "text-foreground" : "text-muted-foreground")}><StatusIcon status={d.inferred ? "inf" : needsReason ? "open" : "conf"} className="size-3.5 shrink-0" /><span className="sr-only">{status}</span></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug">{d.title}</p>
        {d.why && <FadeIn className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.why}</FadeIn>}
        {d.inferred && <button className="mt-1 rounded-sm text-xs text-muted-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => fold({ inferred: false })}>Confirm</button>}
        {needsReason && !answering && <div className="group/reason mt-1">
          <button className="rounded-sm text-left text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setAnswering(true)}>{d.question}</button>
          {/* Options slide open on hover or focus instead of popping in. */}
          <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/reason:grid-rows-[1fr] group-hover/reason:opacity-100 group-focus-within/reason:grid-rows-[1fr] group-focus-within/reason:opacity-100 [@media(hover:none)]:grid-rows-[1fr] [@media(hover:none)]:opacity-100">
          <div className="flex min-h-0 flex-col items-start gap-1 overflow-hidden pt-2">
            {d.options?.map((option) => <button key={option} className="rounded px-1.5 py-1 text-left text-xs text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => fold({ why: option })}>{option}</button>)}
            <button className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setAnswering(true)}>Something else…</button>
          </div>
          </div>
        </div>}
        {answering && <FadeIn><form className="mt-2 flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (why.trim()) fold({ why: why.trim() }) }}>
          <Input autoFocus aria-label={d.question} placeholder="Add a reason…" value={why} onChange={(e) => setWhy(e.target.value)} className="h-7 min-w-0 text-xs" />
          <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save reason" disabled={!why.trim()}><Check className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="button" aria-label="Cancel reason" onClick={() => setAnswering(false)}><X className="size-3.5" /></Button>
        </form></FadeIn>}
      </div>
      <button aria-label={`Remove decision: ${d.title}`} className="mt-0.5 rounded-sm text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={() => fold(null)}><X className="size-3" /></button>
    </li>
  )
}

// Wraps content that should fade in when it appears (give it a key to replay on change).
function FadeIn({ as: Tag = "div", ...props }: { as?: "div" | "span" } & React.HTMLAttributes<HTMLElement>) {
  const ref = useFadeIn<HTMLElement>()
  return <Tag ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement>} {...props} />
}
