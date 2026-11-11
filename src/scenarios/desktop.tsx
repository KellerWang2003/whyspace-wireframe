import { useEffect, useRef, type ReactNode } from "react"
import { PEOPLE } from "@/data"
import { cn } from "@/lib/utils"
import { DESK, type DeskTool, type DockIcon } from "./desks"
import { emit, setDesk, useDesk, useTakes } from "./desk-state"
import { appApi, attachApp, installDesk } from "./frame"
import { ScenarioBar } from "./bar"
import { Pill } from "./pill"
import { MENU_H, clampWins, dragWin, focusWin, frontOf, layOut, minimizeWin, toggleMax, useDrag, useWins, type Mode } from "./windows"

// The scenario desktop: a menu bar, the dock on the left, and windows you can move, resize, minimize
// and bring forward. Whyspace is one of them: the real app in an iframe (see frame.ts), on the
// scenario's data. The scenario's tools (Claude, Runway, Claude Code, Slack) are the others, and the pill
// floats on top. What a tool records reaches the app through the bridge (desk-state.ts emit). The
// test harness stays in the menu bar (the next line to say, the scenario switch and Exit), so a
// window can take the full height.

const WHYSPACE = { id: "whyspace", name: "Whyspace", title: "Whyspace", icon: "whyspace" as const }
const TOOLS: DeskTool[] = DESK?.tools ?? []
const APPS = [WHYSPACE, ...TOOLS]
const toolOf = (app: string) => APPS.find((a) => a.id === app.toLowerCase() || a.name.toLowerCase() === app.toLowerCase())

// The page the Whyspace window opens on: the address's, unless that is the desk itself.
const startPath = () => { const p = window.location.hash.replace(/^#/, ""); return !p || p.startsWith("/desk") ? "/today" : p }
const APP_SRC = `${window.location.pathname}?frame=app#${startPath()}`

if (DESK) layOut(APPS.map((a) => a.id), DESK.front ?? WHYSPACE.id)

export function ScenarioDesktop() {
  const wins = useWins()
  const drag = useDrag()
  const front = frontOf(wins)
  useTakes()

  // The app frame reaches the desktop through window.__desk: it brings windows forward and keeps the address on its page.
  useEffect(() => {
    installDesk({
      route: (path) => { if (window.location.hash !== `#${path}`) window.history.replaceState(null, "", `#${path}`) },
      has: (app) => !!toolOf(app),
      focus: (app) => { const t = toolOf(app); if (t) focusWin(t.id) },
    })
  }, [])

  // A link to a page (the debug panel's "Jump to screen") opens it in the Whyspace window.
  useEffect(() => {
    const onHash = () => {
      const path = window.location.hash.replace(/^#/, "") || "/today"
      if (path.startsWith("/desk")) { if (TOOLS[0]) focusWin(TOOLS[0].id); return }
      appApi()?.navigate(path)
      focusWin(WHYSPACE.id)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    window.addEventListener("resize", clampWins)
    return () => window.removeEventListener("resize", clampWins)
  }, [])

  if (!DESK) return null
  const person = PEOPLE[DESK.person]
  const Overlay = DESK.Overlay
  return (
    <div className="relative h-svh w-full overflow-hidden bg-[linear-gradient(160deg,#d9dde3_0%,#c9ced6_55%,#b9bfc9_100%)] text-[13px] text-neutral-900">
      <div className="absolute inset-x-0 top-0 z-30 flex items-center gap-4 bg-white/55 px-4 text-[12px] backdrop-blur select-none" style={{ height: MENU_H }}>
        <span className="size-3 shrink-0 rounded-full bg-neutral-800" aria-hidden />
        <span className="shrink-0 font-semibold">{APPS.find((a) => a.id === front)?.name ?? "Finder"}</span>
        {["File", "Edit", "View", "Window"].map((m) => <span key={m} className="shrink-0 text-neutral-600 max-xl:hidden">{m}</span>)}
        <div className="flex min-w-0 flex-1 justify-center">{Overlay && <Overlay />}</div>
        <ScenarioBar />
        <span className="min-w-0 truncate text-neutral-700 max-lg:hidden">{person?.name} · {person?.role}</span>
        <span className="shrink-0 text-neutral-700 tabular-nums">{DESK.clock}</span>
      </div>

      <div className="absolute inset-0 isolate">
        <Frame id={WHYSPACE.id} title={WHYSPACE.title} active={front === WHYSPACE.id}>
          <iframe
            title="Whyspace"
            src={APP_SRC}
            onLoad={(e) => attachApp(e.currentTarget.contentWindow)}
            className="size-full border-0 bg-white"
          />
        </Frame>
        {TOOLS.map((t) => (
          <Frame key={t.id} id={t.id} title={t.title} dark={t.dark} active={front === t.id}>
            <t.App onEvent={emit} />
          </Frame>
        ))}
      </div>

      <Dock front={front} min={Object.fromEntries(Object.entries(wins).map(([id, w]) => [id, w.min]))} />
      <Pill />
      <Notice />
      {drag && <div aria-hidden className="fixed inset-0 z-[60]" style={{ cursor: CURSOR[drag] }} />}
    </div>
  )
}

const CURSOR: Record<Mode, string> = { move: "grabbing", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" }
// Resize zones straddle the window's border, outside its rounded corners, as on a Mac.
const EDGES: [Mode, string][] = [
  ["n", "inset-x-3 -top-1 h-2 cursor-ns-resize"],
  ["s", "inset-x-3 -bottom-1 h-2 cursor-ns-resize"],
  ["e", "inset-y-3 -right-1 w-2 cursor-ew-resize"],
  ["w", "inset-y-3 -left-1 w-2 cursor-ew-resize"],
  ["nw", "-top-1 -left-1 size-4 cursor-nwse-resize"],
  ["ne", "-top-1 -right-1 size-4 cursor-nesw-resize"],
  ["sw", "-bottom-1 -left-1 size-4 cursor-nesw-resize"],
  ["se", "-right-1 -bottom-1 size-4 cursor-nwse-resize"],
]

// A window: title bar to drag (double-click to fill the desktop), traffic lights, edges and
// corners to resize. A minimized window stays alive, hidden, until its dock icon brings it back.
function Frame({ id, title, dark, active, children }: { id: string; title: string; dark?: boolean; active: boolean; children: ReactNode }) {
  const w = useWins()[id]
  // The drag shield takes the second click of a double-click, so the title bar counts its own.
  const lastDown = useRef(0)
  if (!w) return null
  const start = (mode: Mode) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    focusWin(id)
    dragWin(id, mode, e.clientX, e.clientY)
  }
  const onTitle = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if (e.timeStamp - lastDown.current < 350) {
      lastDown.current = 0
      e.preventDefault()
      toggleMax(id)
      return
    }
    lastDown.current = e.timeStamp
    start("move")(e)
  }
  return (
    <section
      aria-label={title}
      onPointerDown={() => focusWin(id)}
      style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }}
      className={cn("absolute", w.min && "invisible")}
    >
      <div
        className={cn(
          "flex size-full flex-col overflow-hidden rounded-xl border",
          dark ? "border-black/40 bg-[#1e1e1e] text-neutral-100" : "border-black/10 bg-white text-neutral-900",
          active ? "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]" : "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.3)]",
        )}
      >
        <header
          onPointerDown={onTitle}
          className={cn("flex h-9 shrink-0 items-center gap-2 border-b px-3 select-none", dark ? "border-white/10 bg-[#2b2b2b]" : "border-black/5 bg-neutral-50")}
        >
          <span className="group/lights flex gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
            <Light color="bg-[#ff5f57]" label="Close" glyph="×" onClick={() => minimizeWin(id)} />
            <Light color="bg-[#febc2e]" label="Minimize" glyph="−" onClick={() => minimizeWin(id)} />
            <Light color="bg-[#28c840]" label={w.restore ? "Restore" : "Fill the screen"} glyph="+" onClick={() => toggleMax(id)} />
          </span>
          <span className={cn("ml-2 min-w-0 truncate text-[12px]", dark ? "text-neutral-300" : "text-neutral-600", !active && "opacity-60")}>{title}</span>
        </header>
        <div className="relative flex min-h-0 flex-1">{children}</div>
      </div>
      {EDGES.map(([mode, place]) => <div key={mode} aria-hidden onPointerDown={start(mode)} className={cn("absolute z-10", place)} />)}
    </section>
  )
}

function Light({ color, label, glyph, onClick }: { color: string; label: string; glyph: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("grid size-3 place-items-center rounded-full text-[9px] leading-none font-bold text-black/0 group-hover/lights:text-black/55", color)}>
      {glyph}
    </button>
  )
}

// The dock stands on the left edge, so windows keep the full height.
function Dock({ front, min }: { front?: string; min: Record<string, boolean> }) {
  return (
    <nav aria-label="Dock" className="fixed top-1/2 left-2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-white/50 bg-white/35 py-2 pr-2 pl-3 shadow-lg backdrop-blur-xl">
      {APPS.map((a) => (
        <button key={a.id} type="button" title={a.name} aria-label={`${a.name}${min[a.id] ? ", minimized" : ""}`} aria-current={a.id === front ? "true" : undefined} onClick={() => focusWin(a.id)} className="group relative flex items-center outline-none">
          <span className={cn("absolute -left-2 size-1 rounded-full bg-neutral-800", a.id !== front && "opacity-40")} />
          <AppIcon icon={a.icon} className="size-11 transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:ring-2 group-focus-visible:ring-white" />
        </button>
      ))}
    </nav>
  )
}

export function AppIcon({ icon, className }: { icon: DockIcon; className?: string }) {
  const base = "grid place-items-center rounded-[11px] shadow-sm ring-1 ring-black/10"
  if (icon === "whyspace") return <span className={cn(base, "bg-neutral-900 font-serif text-2xl text-white", className)}>Y</span>
  if (icon === "claude") return <span className={cn(base, "bg-[#f5f0e8] text-2xl text-[#c96442]", className)}>✳</span>
  if (icon === "runway") return <span className={cn(base, "bg-black text-lg font-semibold text-white", className)}>R</span>
  if (icon === "slack") return <span className={cn(base, "bg-[#4a154b] text-2xl font-semibold text-white", className)}>#</span>
  return <span className={cn(base, "bg-neutral-900 font-mono text-sm text-green-400", className)}>&gt;_</span>
}

// Whyspace's notification, top right, like the system's.
function Notice() {
  const { toast } = useDesk()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setDesk({ toast: null }), 4000)
    return () => clearTimeout(t)
  }, [toast])
  if (!toast) return null
  return (
    <div role="status" className="fixed top-9 right-3 z-40 flex w-80 items-start gap-3 rounded-xl border border-white/60 bg-white/85 p-3 text-[12px] shadow-xl backdrop-blur animate-in duration-200 fade-in-0 slide-in-from-top-2">
      <AppIcon icon="whyspace" className="size-8 shrink-0 rounded-lg text-lg" />
      <div className="min-w-0">
        <p className="font-semibold">Whyspace</p>
        <p className="text-neutral-700">{toast}</p>
      </div>
    </div>
  )
}
