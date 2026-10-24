import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Archive,
  Check,
  Hand,
  ImagePlus,
  Mic,
  MicOff,
  Minus,
  MousePointer2,
  Plus,
  ShieldCheck,
  Spline,
  Square,
  StickyNote,
  Type,
  UserPlus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge } from "@/components/app/status-badge"
import { PEOPLE, PROJECTS, SESSIONS, type Status } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"

// A live session is a shared canvas (think FigJam) with the call running alongside.
// Whyspace listens, with everyone's consent, and pulls decisions out as people talk.
// Two options sit side by side so the group can compare and pick; the one not picked
// goes to the idea archive instead of disappearing.

type Sticky = { id: string; x: number; y: number; text: string; by: string; shade: 0 | 1 | 2 }
type Line = { who: string; at: string; text: string; decision?: string }
type Caught = { id: string; title: string; status: Status; who: string; at: string }

const SCRIPT: Line[] = [
  { who: "PS", at: "12:02", text: "Okay, the question is a push for every plant, or one daily digest." },
  { who: "SO", at: "12:03", text: "Either is easy on the phone. But beta testers with 10 plants got 10 pings on Sunday morning." },
  { who: "MC", at: "12:04", text: "And look at option A on the lock screen. It's a wall of notifications." },
  { who: "PS", at: "12:06", text: "So one digest by default, but thirsty plants can't wait a day.", decision: "Plants that are overdue get their own push" },
  { who: "SO", at: "12:07", text: "We can send the digest at 9 am and only push separately when a plant is overdue." },
  { who: "MC", at: "12:08", text: "Then the digest opens straight to a checklist you can tick off.", decision: "The digest opens to a checklist of plants to water" },
]
const LIVE_LINES: Line[] = [
  { who: "PS", at: "12:09", text: "I like B. It's one tap to see everything for the day." },
  { who: "SO", at: "12:10", text: "Agreed. I'll keep a setting for per-plant pushes so we can test it later." },
  { who: "MC", at: "12:11", text: "Let's pick B and park A in the archive." },
]

const SHADES = ["bg-neutral-100", "bg-neutral-200", "bg-neutral-300"]

export function LiveSession({ id, sessionId }: { id: string; sessionId?: string }) {
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const session = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS.find((s) => s.project === project.id && s.status === "Live") ?? {
    title: "New session",
    host: "MC",
    people: ["MC"],
  }
  const people = [...new Set(["MC", ...session.people])]

  const [lines, setLines] = useState<Line[]>(SCRIPT)
  const [speaking, setSpeaking] = useState("PS")
  const [muted, setMuted] = useState(false)
  const [tool, setTool] = useState("select")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 10 })
  const [picked, setPicked] = useState<"A" | "B" | null>(null)
  const [stickies, setStickies] = useState<Sticky[]>([
    { id: "s1", x: 40, y: 120, text: "4 of 6 beta testers muted us within 3 days", by: "PS", shade: 1 },
    { id: "s2", x: 40, y: 290, text: "People water on weekends, mostly in the morning", by: "SO", shade: 0 },
    { id: "s3", x: 40, y: 460, text: "Do people with 1 plant even need a digest?", by: "AT", shade: 2 },
  ])
  const [caught, setCaught] = useState<Caught[]>(
    SCRIPT.filter((l) => l.decision).map((l, i) => ({ id: `c${i}`, title: l.decision!, status: "inf" as Status, who: l.who, at: l.at })),
  )

  // Play the rest of the conversation in, a line every few seconds, so the room feels live.
  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i >= LIVE_LINES.length) {
        clearInterval(timer)
        return
      }
      const line = LIVE_LINES[i++]
      setLines((l) => [...l, line])
      setSpeaking(line.who)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const pick = (option: "A" | "B") => {
    setPicked(option)
    setCaught((c) => [
      { id: "pick", title: option === "B" ? "One daily digest at 9 am, with a push for overdue plants" : "A push for every plant when it needs water", status: "conf", who: "MC", at: "now" },
      ...c,
    ])
    toast(`Option ${option} picked`, { description: "Saved as a confirmed decision. The other option went to the idea archive." })
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Top bar: where you are, who's here, call controls */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/p/${project.id}/sessions`)}>
          <ArrowLeft />
          {project.name}
        </Button>
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
        <span className="font-medium">{session.title}</span>
        <Badge className="gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />Live · 11:24</Badge>
        <span className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground lg:flex">
          <ShieldCheck className="size-3.5" />
          Everyone agreed to save decisions from this session
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-1">
            {people.map((p) => (
              <Tooltip key={p}>
                <TooltipTrigger asChild>
                  <span className={cn("relative z-0 rounded-full ring-2 ring-background", speaking === p && "z-10 outline-2 outline-offset-1 outline-foreground")}>
                    <PersonAvatar id={p} className="size-8" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{PEOPLE[p].name}{speaking === p && " · speaking"}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => toast("Invite sent")}><UserPlus />Invite</Button>
          <Button size="icon-sm" variant={muted ? "secondary" : "outline"} onClick={() => setMuted(!muted)}>
            {muted ? <MicOff /> : <Mic />}
            <span className="sr-only">{muted ? "Unmute" : "Mute"}</span>
          </Button>
          <Button size="sm" onClick={() => { toast("Session ended", { description: "Summary and decisions saved to the project." }); navigate(`/p/${project.id}/decisions`) }}>
            End session
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Canvas
          zoom={zoom}
          pan={pan}
          setPan={setPan}
          tool={tool}
          stickies={stickies}
          setStickies={setStickies}
          picked={picked}
          onPick={pick}
        />

        {/* Right panel: what's being said, and what Whyspace caught from it */}
        <aside className="flex w-[360px] shrink-0 flex-col border-l">
          <Tabs defaultValue="transcript" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b p-3">
              <TabsList className="w-full">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="decisions">Decisions · {caught.length}</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="transcript" className="min-h-0 flex-1">
              <Transcript lines={lines} speaking={speaking} />
            </TabsContent>
            <TabsContent value="decisions" className="min-h-0 flex-1">
              <div className="h-full overflow-y-auto">
                <div className="flex flex-col gap-3 p-4">
                  <p className="text-xs text-muted-foreground">Caught from the conversation. Nothing counts until someone confirms it.</p>
                  {caught.map((c) => (
                    <div key={c.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-muted-foreground">{PEOPLE[c.who].name} · {c.at}</span>
                      </div>
                      <div className="text-sm font-medium">{c.title}</div>
                      {c.status === "inf" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setCaught((all) => all.map((x) => (x.id === c.id ? { ...x, status: "conf" } : x)))}>
                            <Check />Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast("Edit wording")}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => setCaught((all) => all.filter((x) => x.id !== c.id))}>Not a decision</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="ideas" className="min-h-0 flex-1">
              <div className="flex flex-col gap-3 p-4">
                <p className="text-xs text-muted-foreground">Options the group didn't pick. Kept so nobody has to argue them again from scratch.</p>
                {picked && (
                  <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <Archive className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Option {picked === "B" ? "A · 1-hour slots" : "B · 2-hour slots"}</div>
                      <div className="text-xs text-muted-foreground">Not picked today · {picked === "B" ? "Picker too long on mobile, more failed deliveries" : "Evenings too coarse"}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Archive className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Calendar-style slot picker</div>
                    <div className="text-xs text-muted-foreground">From “One page or three steps”, Oct 14 · Too heavy for one page</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Floating canvas toolbar */}
      <div className="pointer-events-none fixed bottom-5 left-[calc(50%-180px)] flex -translate-x-1/2 items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border bg-background p-1 shadow-lg">
          <ToggleGroup type="single" value={tool} onValueChange={(v) => v && setTool(v)} size="sm">
            {[
              ["select", MousePointer2, "Select"],
              ["hand", Hand, "Pan"],
              ["sticky", StickyNote, "Sticky note"],
              ["text", Type, "Text"],
              ["shape", Square, "Shape"],
              ["connector", Spline, "Connector"],
            ].map(([v, Icon, label]) => {
              const I = Icon as typeof Hand
              return (
                <ToggleGroupItem
                  key={v as string}
                  value={v as string}
                  aria-label={label as string}
                  onClick={() => {
                    if (v === "sticky") {
                      setStickies((s) => [...s, { id: `n${Date.now()}`, x: 260 - pan.x, y: 560 - pan.y, text: "New note", by: "MC", shade: 0 }])
                      setTool("select")
                    }
                  }}
                >
                  <I />
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button size="icon-sm" variant="ghost" onClick={() => toast("Upload an image or file")}><ImagePlus /></Button>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button size="icon-sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><Minus /></Button>
          <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="icon-sm" variant="ghost" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}><Plus /></Button>
        </div>
      </div>
    </div>
  )
}

function Transcript({ lines, speaking }: { lines: Line[]; speaking: string }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines.length])
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <PersonAvatar id={l.who} className="size-7" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-xs"><span className="font-medium">{PEOPLE[l.who].name}</span> <span className="text-muted-foreground">{l.at}</span></div>
              <p>{l.text}</p>
              {l.decision && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                  <StatusBadge status="inf" />
                  <span className="truncate">{l.decision}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-3 items-end gap-0.5">
            {[0, 1, 2].map((b) => (
              <span key={b} className="w-0.5 animate-pulse rounded-full bg-muted-foreground" style={{ height: 6 + b * 3, animationDelay: `${b * 150}ms` }} />
            ))}
          </span>
          {PEOPLE[speaking].name} is speaking
        </div>
        <div ref={end} />
      </div>
    </div>
  )
}

type CanvasProps = {
  zoom: number
  pan: { x: number; y: number }
  setPan: (p: { x: number; y: number }) => void
  tool: string
  stickies: Sticky[]
  setStickies: React.Dispatch<React.SetStateAction<Sticky[]>>
  picked: "A" | "B" | null
  onPick: (o: "A" | "B") => void
}

function Canvas({ zoom, pan, setPan, tool, stickies, setStickies, picked, onPick }: CanvasProps) {
  const drag = useRef<{ kind: "pan" | "sticky"; id?: string; sx: number; sy: number; ox: number; oy: number } | null>(null)

  const onDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-sticky],button")) return
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (d.kind === "pan") setPan({ x: d.ox + dx, y: d.oy + dy })
    else setStickies((all) => all.map((s) => (s.id === d.id ? { ...s, x: d.ox + dx / zoom, y: d.oy + dy / zoom } : s)))
  }
  const onUp = () => {
    drag.current = null
  }

  return (
    <div
      className={cn("relative min-w-0 flex-1 overflow-hidden bg-muted/40", tool === "hand" ? "cursor-grab" : "cursor-default")}
      style={{
        backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        <div className="absolute top-10 left-10 w-[900px] text-2xl font-semibold">Watering reminders</div>
        <div className="absolute top-[72px] left-10 text-sm whitespace-nowrap text-muted-foreground">Part of Research · owned by Priya Shah</div>

        {/* Connectors from the research stickies to the options */}
        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1">
          <path d="M260,345 C300,345 300,300 340,300" className="fill-none stroke-muted-foreground" strokeWidth={1.5} strokeDasharray="5 4" />
          <path d="M260,175 C560,140 640,140 690,150" className="fill-none stroke-muted-foreground" strokeWidth={1.5} strokeDasharray="5 4" />
        </svg>

        <OptionFrame
          x={340}
          y={120}
          label="Option A"
          title="A push for every plant"
          rows={8}
          note="10 plants means 10 notifications on a Sunday"
          state={picked === null ? "open" : picked === "A" ? "picked" : "archived"}
          onPick={() => onPick("A")}
        />
        <OptionFrame
          x={690}
          y={120}
          label="Option B"
          title="One daily digest at 9 am"
          rows={4}
          note="Overdue plants still get their own push"
          state={picked === null ? "open" : picked === "B" ? "picked" : "archived"}
          onPick={() => onPick("B")}
        />

        {stickies.map((s) => (
          <div
            key={s.id}
            data-sticky
            onPointerDown={(e) => {
              e.stopPropagation()
              drag.current = { kind: "sticky", id: s.id, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y }
              ;(e.currentTarget.parentElement?.parentElement as HTMLElement).setPointerCapture(e.pointerId)
            }}
            className={cn("absolute flex h-[140px] w-[220px] cursor-move flex-col justify-between rounded-sm p-4 text-sm shadow-md", SHADES[s.shade])}
            style={{ left: s.x, top: s.y }}
          >
            <p contentEditable suppressContentEditableWarning className="outline-none">{s.text}</p>
            <span className="text-xs text-muted-foreground">{PEOPLE[s.by].name}</span>
          </div>
        ))}

        {/* Other people's cursors */}
        <Cursor x={700} y={420} name="Priya Shah" />
        <Cursor x={960} y={430} name="Sam Okafor" />
      </div>
    </div>
  )
}

function OptionFrame({ x, y, label, title, rows, note, state, onPick }: { x: number; y: number; label: string; title: string; rows: number; note: string; state: "open" | "picked" | "archived"; onPick: () => void }) {
  return (
    <div className={cn("absolute w-[320px]", state === "archived" && "opacity-40")} style={{ left: x, top: y }}>
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {state === "picked" && <Badge>Picked</Badge>}
        {state === "archived" && <Badge variant="outline">In idea archive</Badge>}
      </div>
      <div className={cn("rounded-lg border bg-background p-4 shadow-sm", state === "picked" && "border-foreground")}>
        <div className="mb-3 text-sm font-medium">{title}</div>
        <div className="space-y-2 rounded-md border p-3">
          <div className="h-2 w-24 rounded-full bg-muted" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: rows }, (_, i) => (
              <span key={i} className={cn("h-7 rounded-md border", rows > 4 ? "w-full" : "w-[60px]", i === 1 && "bg-foreground")} />
            ))}
          </div>
          <div className="h-2 w-32 rounded-full bg-muted" />
          <div className="h-8 rounded-md bg-muted" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
        {state === "open" && (
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onPick}>Pick this option</Button>
        )}
      </div>
    </div>
  )
}

function Cursor({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }}>
      <MousePointer2 className="size-5 fill-foreground text-foreground" />
      <span className="ml-4 rounded-md bg-foreground px-2 py-0.5 text-xs whitespace-nowrap text-background">{name}</span>
    </div>
  )
}
