import { useEffect, useRef, useState } from "react"
import { ArrowRight, Bug, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { STAGE, STAGES, setStage } from "@/lib/stage"
import { VIEWER, VIEWERS, setViewer } from "@/lib/viewer"
import { DESIGN, setDesign, type Design } from "@/lib/design"
import { setHifi, useHifi } from "@/lib/hifi"
import { PEOPLE } from "@/data"
import { PersonAvatar } from "@/components/app/person"
import { cn } from "@/lib/utils"
import { SCENARIOS as DEMO_SCENARIOS } from "@/demo/scenarios"
import { PINS, SCENARIO, exitScenario, openScenario } from "@/lib/scenario"
import { PEOPLE_C, SCENES, VIEWERS_C } from "@/design-c/data"
import { resetVisit, setScene, setViewerC, useC } from "@/design-c/state"
import { Face } from "@/design-c/ui"

// Prototype helper only, not part of the app: a debug tab that rests on any screen edge
// and opens a small overlay for reviewing the flow.

type Edge = "left" | "right" | "top" | "bottom"
// Where the tab rests: an edge, and how far along it (0–1).
type Spot = { edge: Edge; along: number }

// A scenario's desktop has its dock at the left middle, so there the tab rests lower and keeps its own spot.
const SPOT_KEY = SCENARIO ? "debug-tab-spot-scenario" : "debug-tab-spot"
const DEFAULT_SPOT: Spot = { edge: "left", along: SCENARIO ? 0.86 : 0.5 }
// Keep the tab's centre this far from the corners.
const INSET = 48
// Pointer travel before a press counts as a drag rather than a click.
const DRAG_THRESHOLD = 4
// The overlay opens on the side facing into the screen.
const INTO: Record<Edge, "left" | "right" | "top" | "bottom"> = { left: "right", right: "left", top: "bottom", bottom: "top" }

function readSpot(): Spot {
  try {
    const spot = JSON.parse(localStorage.getItem(SPOT_KEY) ?? "null")
    if (spot && ["left", "right", "top", "bottom"].includes(spot.edge) && spot.along >= 0 && spot.along <= 1) return spot
  } catch {
    // Missing or unreadable: fall back to the default.
  }
  return DEFAULT_SPOT
}

function saveSpot(spot: Spot) {
  try {
    localStorage.setItem(SPOT_KEY, JSON.stringify(spot))
  } catch {
    // Storage blocked: the tab just won't remember where it was.
  }
}

// Snap a dropped point to the nearest edge.
function nearestSpot(x: number, y: number): Spot {
  const w = window.innerWidth
  const h = window.innerHeight
  const gaps: [Edge, number][] = [["left", x], ["right", w - x], ["top", y], ["bottom", h - y]]
  const [edge] = gaps.reduce((a, b) => (b[1] < a[1] ? b : a))
  return { edge, along: edge === "left" || edge === "right" ? y / h : x / w }
}

function clamp(n: number, size: number) {
  return Math.min(Math.max(n, INSET), size - INSET)
}

function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return size
}

export function FlowMenu({ desktop, onDesktop }: { desktop: boolean; onDesktop: (on: boolean) => void }) {
  const { joinWorkspace, setUpgradeOpen } = useStore()
  const [open, setOpen] = useState(false)
  const [spot, setSpot] = useState(readSpot)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  // Set when a drag ends, so the click that follows the release doesn't toggle the overlay.
  const justDragged = useRef(false)
  const tabRef = useRef<HTMLButtonElement>(null)
  const { w, h } = useViewport()
  const c = useC()
  const hifi = useHifi()
  const here = "/" + useRoute().join("/")
  // The scenario running: on the real app, or still on its demo page (#/demo/N).
  const demoOn = SCENARIO || (here.startsWith("/demo/") ? Number(here.split("/")[2]) || 0 : 0)

  // ` toggles the overlay from anywhere, except while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "`" || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setOpen((on) => !on)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    justDragged.current = false
    press.current = { x: e.clientX, y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const p = press.current
    if (!p) return
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return
    p.moved = true
    setOpen(false)
    setDrag({ x: e.clientX, y: e.clientY })
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const p = press.current
    press.current = null
    if (!p?.moved) return
    justDragged.current = true
    const next = nearestSpot(e.clientX, e.clientY)
    setSpot(next)
    saveSpot(next)
    setDrag(null)
  }

  function openDesignSystem() {
    setOpen(false)
    onDesktop(false)
    joinWorkspace()
    navigate("/design-system")
  }

  const vertical = spot.edge === "left" || spot.edge === "right"
  const style: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y, transform: "translate(-50%, -50%)" }
    : vertical
      ? { [spot.edge]: 0, top: clamp(spot.along * h, h), transform: "translateY(-50%)" }
      : { [spot.edge]: 0, left: clamp(spot.along * w, w), transform: "translateX(-50%)" }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          ref={tabRef}
          type="button"
          title="Debug: click to open, drag to move (`)"
          aria-label="Prototype debug panel"
          aria-expanded={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { press.current = null; setDrag(null) }}
          onClick={() => {
            if (justDragged.current) justDragged.current = false
            else setOpen((on) => !on)
          }}
          style={style}
          className={cn(
            "fixed z-[60] flex touch-none select-none items-center gap-1.5 border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
            drag ? "cursor-grabbing rounded-md shadow-md" : "cursor-grab",
            !drag && vertical && "flex-col px-1 py-2.5",
            !drag && !vertical && "px-2.5 py-1",
            !drag && { left: "rounded-r-md border-l-0", right: "rounded-l-md border-r-0", top: "rounded-b-md border-t-0", bottom: "rounded-t-md border-b-0" }[spot.edge],
            drag && "px-2.5 py-1",
            open && "bg-muted text-foreground",
          )}
        >
          <Bug className="size-3.5" />
          <span className={cn("text-[10px] font-medium tracking-wide", !drag && vertical && "[writing-mode:vertical-rl]")}>{DESIGN === "c" ? <>Debug · {SCENES[c.scene - 1]?.day} {SCENES[c.scene - 1]?.time} · {PEOPLE_C[c.viewer]?.name} · C</> : <>{SCENARIO ? `Scenario ${SCENARIO}` : "Debug"} · {STAGE} · {PEOPLE[VIEWER].name}{DESIGN === "a" && " · A"}</>}</span>
        </button>
      </PopoverAnchor>

      <PopoverContent
        side={INTO[spot.edge]}
        sideOffset={8}
        collisionPadding={8}
        className="z-[60] w-72 p-0 text-sm"
        // Clicking the tab toggles on its own; don't let it also count as an outside click.
        onInteractOutside={(e) => { if (tabRef.current?.contains(e.target as Node)) e.preventDefault() }}
      >
        <header className="flex items-center gap-2 border-b px-3 py-2">
          <Bug className="size-3.5 shrink-0" />
          <div className="text-xs font-medium">Debug</div>
        </header>

        <div className="divide-y">
          {!SCENARIO && (
            <div className="p-3">
              <Label className="flex items-center justify-between gap-2 text-xs font-normal">
                {DESIGN === "a" ? "Desktop overlay" : "The Desk"}
                <Switch checked={desktop} onCheckedChange={onDesktop} />
              </Label>
            </div>
          )}

          <div className="space-y-3 p-3">
            {DESIGN === "c" ? (
              <>
                <Field label="View as">
                  <Select value={c.viewer} onValueChange={setViewerC}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      {VIEWERS_C.map((id) => (
                        <SelectItem key={id} value={id} className="text-xs">
                          <Face id={id} className="size-5" />
                          {PEOPLE_C[id].name}
                          <span className="text-muted-foreground">· {PEOPLE_C[id].role} · {PEOPLE_C[id].ai}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Scene">
                  <Select value={String(c.scene)} onValueChange={(v) => setScene(Number(v))}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      {SCENES.map((sc) => (
                        <SelectItem key={sc.id} value={String(sc.id)} className="text-xs">
                          {sc.id}. {sc.day} {sc.time} · {sc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field label="View as">
                  <Select value={VIEWER} onValueChange={setViewer} disabled={!!PINS}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      {VIEWERS.map((id) => (
                        <SelectItem key={id} value={id} className="text-xs">
                          <PersonAvatar id={id} className="size-5" />
                          {PEOPLE[id].name}
                          <span className="text-muted-foreground">· {PEOPLE[id].role}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Stage">
                  <Select value={String(STAGE)} onValueChange={(v) => setStage(Number(v))} disabled={!!PINS}>
                    <SelectTrigger size="sm" className="w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70]">
                      {STAGES.map((stage, i) => (
                        <SelectItem key={stage.name} value={String(i + 1)} className="text-xs">
                          {i + 1}. {stage.name} · {stage.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            <Field label="Scenario">
              <Select value={demoOn ? String(demoOn) : ""} onValueChange={(v) => openScenario(Number(v))}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {DEMO_SCENARIOS.map((sc) => (
                    <SelectItem key={sc.n} value={String(sc.n)} className="text-xs">
                      {sc.n}. {sc.title}
                      <span className="text-muted-foreground">· {sc.who}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {demoOn > 0 && <Button variant="outline" size="sm" className="w-full text-xs" onClick={exitScenario}><X />Exit scenario</Button>}
            </Field>
          </div>

          <div className="space-y-3 p-3">
            <Field label="Design">
              <Select value={DESIGN} onValueChange={(v) => setDesign(v as Design)} disabled={!!PINS}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="b" className="text-xs">Main</SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel className="text-[11px]">Archived</SelectLabel>
                    <SelectItem value="a" className="text-xs text-muted-foreground">A · Original</SelectItem>
                    <SelectItem value="c" className="text-xs text-muted-foreground">C · Handoffs</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Label className="flex items-center justify-between gap-2 text-xs font-normal">
              High-fi
              <Switch checked={hifi} onCheckedChange={setHifi} />
            </Label>
            <Button variant="outline" size="sm" className="w-full justify-between text-xs font-normal" onClick={openDesignSystem}>
              Design system
              <ArrowRight className="opacity-50" />
            </Button>
          </div>

          <div className="space-y-1.5 p-3">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); setUpgradeOpen(true) }}>
              Upgrade dialog
            </Button>
            {DESIGN === "c" && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={resetVisit}>
                Forget this visit
              </Button>
            )}
          </div>
        </div>

        <footer className="flex items-center gap-1.5 border-t px-3 py-1.5 text-[11px] text-muted-foreground">
          <Kbd>`</Kbd> toggle · drag the tab to move it
        </footer>
      </PopoverContent>
    </Popover>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}
