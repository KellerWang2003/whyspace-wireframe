import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowUp,
  AudioLines,
  Archive,
  Cat,
  Check,
  MoreHorizontal,
  Hand,
  ImagePlus,
  Layers,
  ExternalLink,
  Frame,
  Maximize,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PersonAvatar } from "@/components/app/person"
import { WorkshopDetails } from "@/components/app/workshop-details"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/app/status-badge"
import { ARTIFACTS, ARTIFACT_SOURCE, DECISIONS, ME, PEOPLE, PROJECTS, SESSIONS, WORKSHOPS, type Status, type Workshop } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { DESIGN } from "@/lib/design"
import { CaughtThread, fileCaught } from "@/design-b/workshop"
import { ThreadTag } from "@/design-b/thread-ui"
import { ResizeHandle } from "@/components/app/resize-handle"
import { usePanelWidth } from "@/lib/use-panel-width"
import { reply, type Msg } from "@/playground/reply"
import { CanvasCtx, GENERAL, Movable, SectionFrame, clampZoom, offsetOf, type Offset, type Section, type SectionDrag } from "@/components/app/workshop-canvas"

// A live session is a shared canvas (think FigJam) with the call running alongside.
// Whyspace listens, with everyone's consent, and pulls decisions out as people talk.
// Two options sit side by side so the group can compare and pick; the one not picked
// goes to the idea archive instead of disappearing. Speech shows as live captions only:
// the transcript shows in the right panel while Whyspace listens; decisions and ideas are what's kept. Wrap-up gives each person their next steps.

type Sticky = { id: string; x: number; y: number; text: string; by: string; shade: 0 | 1 | 2; small?: boolean }
// An artifact or pasted link placed on the canvas as a card.
type Card = { id: string; x: number; y: number; title: string; kind: string; source: string; url?: string }
type Line = { who: string; at: string; text: string; decision?: string }
type Caught = { id: string; title: string; status: Status; who: string; at: string }

const SCRIPT: Line[] = [
  { who: "TR", at: "15:32", text: "Watch Luna at 0:42. She pounces when the notification moves." },
  { who: "KL", at: "15:33", text: "She doesn't notice the still card." },
  { who: "TR", at: "15:34", text: "She only looks when something moves. Let's make things move.", decision: "Make things move to get cats' attention" },
  { who: "KL", at: "15:36", text: "I'll try a wiggling card and a moving dot." },
  { who: "TR", at: "15:38", text: "Research says cats perk up at purring.", decision: "Add a purring sound to the dot" },
]
const LIVE_LINES: Line[] = [
  { who: "KL", at: "15:40", text: "The wiggle is hard to hit. The dot is easy to follow." },
  { who: "TR", at: "15:41", text: "Agreed. The feather covered the photo." },
  { who: "KL", at: "15:42", text: "Let's pick B and park A in the archive." },
]

const SHADES = ["bg-neutral-100", "bg-neutral-200", "bg-neutral-300"]

// User testing demo: the workshop starts empty. Listen in plays the cat test videos,
// and as Trevor and Kelly talk, notes land under the clip they're about and decisions get caught.
const VIDEOS = [
  { cat: "Luna", test: "Test 1", length: 72 },
  { cat: "Mochi", test: "Test 2", length: 64 },
  { cat: "Biscuit", test: "Test 3", length: 95 },
]
const VIDEO_X = [40, 370, 700]
const VIDEO_Y = 160
const NOTE_Y = 424
type Beat = {
  wait: number
  line?: Line
  note?: { video: number; text: string; mark?: number }
  decision?: string
  idea?: boolean
  // Someone goes off to their own AI tool; the canvas shows a status, never the chat.
  work?: { who: string; text: string }
  // The outcome lands on the canvas when they're done.
  outcome?: "protos" | "research"
  pick?: boolean
}
const BEATS: Beat[] = [
  { wait: 600 },
  { wait: 2500, line: { who: "TR", at: "15:32", text: "Luna's up first. She walks right past the card." }, note: { video: 0, text: "Walks past the still card" } },
  { wait: 3500, line: { who: "TR", at: "15:32", text: "There, 0:42. She pounces when the notification slides in." }, note: { video: 0, text: "Pounces when the notification moves · 0:42", mark: 0.58 } },
  { wait: 3500, line: { who: "KL", at: "15:33", text: "Mochi too. She only looks when something moves." }, note: { video: 1, text: "Only looks when something moves" } },
  { wait: 3500, line: { who: "TR", at: "15:34", text: "So things have to move to get their attention." }, decision: "Make things move to get cats' attention" },
  { wait: 3500, line: { who: "KL", at: "15:34", text: "I'll try a few moving versions in Claude Code." }, work: { who: "KL", text: "Kelly is trying card motion in Claude Code" } },
  { wait: 3500, line: { who: "KL", at: "15:35", text: "Biscuit swatted the screen when the phone buzzed." }, note: { video: 2, text: "Swats at the buzz · 1:15", mark: 0.79 } },
  { wait: 3500, line: { who: "TR", at: "15:35", text: "Let me check what sounds cats react to." }, work: { who: "TR", text: "Trevor is researching cat hearing in Perplexity" } },
  { wait: 4500, line: { who: "KL", at: "15:37", text: "Two versions are up. A wiggles, B has a moving dot." }, outcome: "protos" },
  { wait: 4000, line: { who: "TR", at: "15:38", text: "Found it. Cats perk up when they hear purring." }, outcome: "research" },
  { wait: 4000, line: { who: "KL", at: "15:39", text: "A is hard for a paw to hit. Let's go with B." }, pick: true },
  { wait: 3500, line: { who: "TR", at: "15:40", text: "So let's make the dot purr." }, decision: "Add a purring sound to the dot" },
  { wait: 3500, line: { who: "KL", at: "15:40", text: "Let's park the feather toy. It covered the photo." }, idea: true },
]
// Where each part of the demo starts, so you can jump straight to it.
const CHAPTERS = [
  { label: "Cat test clips", beat: 0 },
  { label: "Kelly's prototypes", beat: 5 },
  { label: "Trevor's research", beat: 7 },
]

// Sections each example canvas starts with (Design B). Untagged work stays general.
const SECTIONS: Record<string, Section[]> = {
  testing: [
    { id: "sec-clips", part: "Research", name: "Cat test clips", x: 16, y: 136, w: 1024, h: 470, when: "clips" },
    { id: "sec-protos", part: "App", name: "Card motion", x: 16, y: 676, w: 698, h: 290, when: "protos" },
    { id: "sec-hearing", part: "Research", name: "Cat hearing", x: 730, y: 676, w: 310, h: 214, when: "hearing" },
  ],
  studio: [
    { id: "sec-reject", part: "Prototype", name: "Unsupported questions", x: 316, y: 136, w: 718, h: 520 },
  ],
}

const NEXT_STEPS: Record<string, { who: string; text: string }[]> = {
  whiskr: [
    { who: "KL", text: "Add the moving dot to the swipe card" },
    { who: "TR", text: "Test the purr with another cat" },
  ],
  studio: [
    { who: "JK", text: "Return a reason code for rejected questions" },
    { who: "MC", text: "Design the missing-source retry state" },
  ],
}

export function LiveSession({ id, sessionId }: { id: string; sessionId?: string }) {
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  // The route holds a workshop id, or a meeting id that resolves to its workshop.
  const routed = SESSIONS.find((s) => s.id === sessionId)
  const workshop: Workshop = WORKSHOPS.find((w) => w.id === (routed?.workshop ?? sessionId))
    ?? { id: "new", project: project.id, title: "Untitled workshop", edited: "just now", people: [ME.id] }
  const meetings = SESSIONS.filter((s) => s.workshop === workshop.id)
  // Joining a meeting that linked this workshop brings its call in; otherwise the workshop is just a place to work.
  const liveNow = routed && routed.status !== "Ended" ? routed : meetings.find((s) => s.status === "Live")
  const session = { title: workshop.title }
  const people = [...new Set([ME.id, ...(liveNow?.people ?? workshop.people)])]
  // A workshop stays open between meetings: anyone can work on the canvas any time.
  // The call, live captions and decision catching run only while people meet.
  const [inMeeting, setInMeeting] = useState(!!liveNow)
  const ended = !inMeeting
  // Listen in is Whyspace's headline: with everyone's consent it follows the conversation
  // and catches decisions. On by default when you join a meeting; anyone can turn it on in a workshop.
  const [listening, setListening] = useState(!!liveNow)
  const [heard, setHeard] = useState(!!liveNow)
  // Items someone marks "Keep as idea" stay as ideas instead of disappearing.
  const [parkedIdeas, setParkedIdeas] = useState<Caught[]>([])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [panelWidth, setPanelWidth] = usePanelWidth("workshop-panel", 360)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [bringing, setBringing] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const bringIn = (items: Omit<Card, "x" | "y">[]) => {
    setCards((all) => [...all, ...items.map((c, i) => ({ ...c, x: 1060 + ((all.length + i) % 2) * 260, y: 120 + Math.floor((all.length + i) / 2) * 230 }))])
  }

  const studio = workshop.canvas === "studio"
  const demo = workshop.canvas === "testing"
  const blank = !workshop.canvas
  const script: Line[] = studio ? [
    { who: "JK", at: "18:02", text: "Two of fifteen questions have no source." },
    { who: "MC", at: "18:03", text: "Then reject them and say why.", decision: "Reject questions without a supporting source passage" },
    { who: "JK", at: "18:04", text: "I’ll return a reason code for the retry." },
    { who: "MC", at: "18:05", text: "Let’s test that state with classmates.", decision: "Include a generation failure in usability testing" },
  ] : demo ? [] : SCRIPT
  const [lines, setLines] = useState<Line[]>(script)
  const [speaking, setSpeaking] = useState(studio ? "JK" : "TR")
  const [muted, setMuted] = useState(false)
  const [wrapping, setWrapping] = useState(false)
  const [tool, setTool] = useState("select")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 10 })
  // A live canvas: anything can be moved (offsets from where it was placed), and work is grouped
  // into thread sections. Sections are a Design B idea; Design A keeps the plain canvas.
  const [offsets, setOffsets] = useState<Record<string, Offset>>({})
  const offsetsRef = useRef(offsets)
  useLayoutEffect(() => { offsetsRef.current = offsets }, [offsets])
  const initialSections = () => (DESIGN === "b" ? (SECTIONS[workshop.canvas ?? ""] ?? []).map((x) => ({ ...x })) : [])
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [selected, setSelected] = useState<string | null>(null)
  const [sectionMenu, setSectionMenu] = useState<string | null>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const canvasEl = useRef<HTMLDivElement>(null)
  const view = useRef({ zoom, pan })
  useLayoutEffect(() => { view.current = { zoom, pan } }, [zoom, pan])
  // Zoom around a point on screen (the canvas center by default), so what's under it stays put.
  const zoomTo = (next: number, at?: { x: number; y: number }, smooth = false) => {
    const r = canvasEl.current?.getBoundingClientRect()
    if (!r) return
    const { zoom: z, pan: p } = view.current
    const nz = clampZoom(next)
    const px = at?.x ?? r.width / 2
    const py = at?.y ?? r.height / 2
    if (smooth) { setGlide(true); setTimeout(() => setGlide(false), 400) }
    setPan({ x: px - ((px - p.x) * nz) / z, y: py - ((py - p.y) * nz) / z })
    setZoom(nz)
  }
  // Fit everything on the canvas into view.
  const zoomToFit = () => {
    const el = canvasEl.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const { zoom: z, pan: p } = view.current
    const boxes = [...el.querySelectorAll<HTMLElement>("[data-item],[data-section],[data-title]")].map((n) => n.getBoundingClientRect())
    if (!boxes.length) { setZoom(1); setPan({ x: 20, y: 10 }); return }
    const toWorld = (x: number, y: number) => ({ x: (x - r.left - p.x) / z, y: (y - r.top - p.y) / z })
    const a = toWorld(Math.min(...boxes.map((b) => b.left)), Math.min(...boxes.map((b) => b.top)) - 32)
    const b = toWorld(Math.max(...boxes.map((b) => b.right)), Math.max(...boxes.map((b) => b.bottom)))
    // Leave room for the tools on the left and the chat bar at the bottom.
    const left = 72, top = 24, w = r.width - left - 32, h = r.height - top - 110
    const nz = clampZoom(Math.min(w / (b.x - a.x), h / (b.y - a.y), 1.5))
    setGlide(true); setTimeout(() => setGlide(false), 700)
    setZoom(nz)
    setPan({ x: left + (w - (b.x - a.x) * nz) / 2 - a.x * nz, y: top + (h - (b.y - a.y) * nz) / 2 - a.y * nz })
  }
  const viewCenter = () => {
    const r = canvasEl.current?.getBoundingClientRect()
    const { zoom: z, pan: p } = view.current
    return { x: ((r?.width ?? 800) / 2 - p.x) / z, y: ((r?.height ?? 600) / 2 - p.y) / z }
  }
  const addSection = (box?: { x: number; y: number; w: number; h: number }) => {
    const c = viewCenter()
    const id = `sec-${Date.now()}`
    setSections((all) => [...all, { id, part: GENERAL, name: "", ...(box ?? { x: c.x - 240, y: c.y - 160, w: 480, h: 320 }) }])
    setSelected(id)
    setTool("select")
    // Open the thread picker right away so the new section gets tagged.
    setTimeout(() => setSectionMenu(id), 50)
  }
  const removeSelected = () => {
    if (!selected) return
    if (selected.startsWith("sec-")) setSections((all) => all.filter((x) => x.id !== selected))
    else if (selected.startsWith("n:")) setStickies((all) => all.filter((x) => `n:${x.id}` !== selected))
    else if (selected.startsWith("c:")) setCards((all) => all.filter((x) => `c:${x.id}` !== selected))
    else return
    setSelected(null)
  }
  const [picked, setPicked] = useState<"A" | "B" | null>(!demo && meetings.some((s) => s.status === "Ended" && s.decisions > 0) ? "B" : null)
  const [stickies, setStickies] = useState<Sticky[]>(demo ? [] : blank ? (workshop.notes ?? []).map((text, i) => ({ id: `w${i}`, x: 40 + i * 260, y: 160, text, by: workshop.people[i % workshop.people.length], shade: (i % 3) as 0 | 1 | 2 })) : studio ? [
    { id: "s1", x: 40, y: 160, text: "2 of 15 questions lack a source", by: "JK", shade: 1 },
    { id: "s2", x: 40, y: 330, text: "Test retry states with classmates", by: "MC", shade: 0 },
  ] : [
    { id: "s1", x: 40, y: 160, text: "Luna ignored the still card, then pounced at 0:42", by: "TR", shade: 1 },
    { id: "s2", x: 40, y: 330, text: "Cats perk up at purring · Perplexity", by: "TR", shade: 0 },
    { id: "s3", x: 40, y: 500, text: "Card motion · Claude Code", by: "KL", shade: 2 },
  ])
  const fromScript = () => (blank || demo ? [] : script).filter((l) => l.decision).map((l, i) => ({ id: `c${i}`, title: l.decision!, status: "inf" as Status, who: l.who, at: l.at }))
  const [caught, setCaught] = useState<Caught[]>([
    ...(liveNow ? fromScript() : []),
    ...(demo ? [] : DECISIONS.filter((d) => meetings.some((s) => s.decisionIds?.includes(d.id))).map((d) => ({ id: d.id, title: d.title, status: d.status, who: d.owner, at: d.when ?? "" }))),
  ])

  // Demo playback: one beat at a time while listening. Pausing Listen in pauses the demo.
  const [beat, setBeat] = useState(0)
  const [marks, setMarks] = useState<number[][]>([[], [], []])
  const [focus, setFocus] = useState<number | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [parked, setParked] = useState(false)
  const [working, setWorking] = useState<Record<string, string>>({})
  const [outcomes, setOutcomes] = useState<string[]>([])
  const [glide, setGlide] = useState(false)
  const lookAt = (y: number) => { setGlide(true); setZoom(1); setPan({ x: 20, y }); setTimeout(() => setGlide(false), 900) }
  const applyBeat = (b: Beat, i: number, live: boolean) => {
    if (b.line) { setLines((l) => [...l, b.line!]); setSpeaking(b.line.who) }
    if (b.note) {
      const { video, text, mark } = b.note
      setStickies((all) => {
        const under = all.filter((x) => x.id.startsWith(`d${video}-`)).length
        // Notes land under their clip, wherever the clip has been moved to.
        const o = offsetOf(offsetsRef.current, `v:${video}`)
        return [...all, { id: `d${video}-${under}`, x: VIDEO_X[video] + o.dx, y: NOTE_Y + o.dy + under * 84, text, by: b.line?.who ?? "TR", shade: b.line?.who === "KL" ? 1 : 0, small: true }]
      })
      if (mark !== undefined) setMarks((m) => m.map((v, j) => (j === video ? [...v, mark] : v)))
      setFocus(video)
      if (live && video === 2) lookAt(10)
    }
    if (b.decision) {
      const id = `demo-${i}`
      setCaught((c) => [{ id, title: b.decision!, status: "inf", who: b.line?.who ?? "TR", at: b.line?.at ?? "now" }, ...c])
      if (live) setFresh(id)
    }
    if (b.work) { setWorking((w) => ({ ...w, [b.work!.who]: b.work!.text })); setFocus(null); if (live) lookAt(-250) }
    if (b.outcome) {
      setOutcomes((o) => [...o, b.outcome!])
      setWorking((w) => { const { [b.outcome === "protos" ? "KL" : "TR"]: _, ...rest } = w; return rest })
      if (live) lookAt(-250)
    }
    if (b.pick) {
      setPicked("B")
      const id = `demo-${i}`
      setCaught((c) => [{ id, title: "Add a moving dot that shows cats where to swipe", status: "inf", who: "KL", at: b.line?.at ?? "now" }, ...c])
      if (live) setFresh(id)
    }
    if (b.idea) setParked(true)
  }
  useEffect(() => {
    if (!demo || !listening || beat >= BEATS.length) return
    const timer = setTimeout(() => { applyBeat(BEATS[beat], beat, true); setBeat(beat + 1) }, BEATS[beat].wait)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, listening, beat])
  useEffect(() => {
    if (!fresh) return
    const timer = setTimeout(() => setFresh(null), 2500)
    return () => clearTimeout(timer)
  }, [fresh])
  // Start the demo over, or from a chapter: earlier beats land at once, the rest play live.
  const playFrom = (start: number) => {
    setLines([]); setStickies([]); setCaught([]); setMarks([[], [], []]); setFocus(null); setFresh(null); setParked(false); setParkedIdeas([])
    setWorking({}); setOutcomes([]); setPicked(null); setOffsets({}); offsetsRef.current = {}; setSections(initialSections()); setSelected(null)
    BEATS.slice(0, start).forEach((b, i) => applyBeat(b, i, false))
    lookAt(start >= 5 ? -250 : 10)
    setBeat(start); setListening(true); setHeard(true)
  }


  // Play the rest of the conversation in, a line every few seconds, so the room feels live.
  useEffect(() => {
    if (!listening) return
    let i = 0
    const timer = setInterval(() => {
      if (i >= (studio || blank || demo ? 0 : LIVE_LINES.length)) {
        clearInterval(timer)
        return
      }
      const line = LIVE_LINES[i++]
      setLines((l) => [...l, line])
      setSpeaking(line.who)
    }, 4000)
    return () => clearInterval(timer)
  }, [studio, blank, demo, listening])

  // Canvas shortcuts: ⌘+ / ⌘- zoom, ⌘0 100%, ⇧1 fit, Space to pan, Delete removes the selection.
  useEffect(() => {
    const typing = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input,textarea,[contenteditable='true'],[role='menu'],[role='dialog']")
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomTo(view.current.zoom * 1.25, undefined, true) }
      else if (mod && e.key === "-") { e.preventDefault(); zoomTo(view.current.zoom / 1.25, undefined, true) }
      else if (mod && e.key === "0") { e.preventDefault(); zoomTo(1, undefined, true) }
      else if (e.shiftKey && e.code === "Digit1") { e.preventDefault(); zoomToFit() }
      else if (e.key === " ") { e.preventDefault(); setSpaceHeld(true) }
      else if (e.key === "Backspace" || e.key === "Delete") removeSelected()
      else if (e.key === "Escape") { setSelected(null); setTool("select") }
    }
    const up = (e: KeyboardEvent) => { if (e.key === " ") setSpaceHeld(false) }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  })

  const ideaCount = parkedIdeas.length + (picked ? 1 : 0) + (demo ? (parked ? 1 : 0) : 1)
  const ask = () => {
    const q = draft.trim()
    if (!q) return
    setMsgs((m) => [...m, { who: "me", text: q }, reply(q, { scopeName: workshop.title, decisions: DECISIONS.filter((d) => d.project === project.id), artifacts: ARTIFACTS.filter((a) => a.project === project.id) })])
    setDraft("")
  }

  const pick = (option: "A" | "B") => {
    setPicked(option)
    setCaught((c) => [
      { id: "pick", title: studio ? (option === "B" ? "Reject questions without source support" : "Show unverified questions with a warning") : option === "B" ? "Add a moving dot that shows cats where to swipe" : "Wiggle the card to invite a swipe", status: "conf", who: studio ? "MC" : "KL", at: "now" },
      ...c,
    ])
    toast(`Option ${option} picked`, { description: "The other went to Ideas." })
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
        {ended
          ? <span className="text-xs text-muted-foreground">Edited {workshop.edited}</span>
          : <Badge className="gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" />Meeting · 11:24</Badge>}
        {listening && <span className="hidden items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground lg:flex">
          <ShieldCheck className="size-3.5" />
          Listening · everyone agreed
        </span>}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost"><MoreHorizontal /><span className="sr-only">Workshop menu</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>Details</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast("Rename workshop")}>Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast("Workshop duplicated")}>Duplicate</DropdownMenuItem>
              {demo && <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Play demo</DropdownMenuLabel>
                {CHAPTERS.map((c) => <DropdownMenuItem key={c.label} onSelect={() => playFrom(c.beat)}>{c.label}</DropdownMenuItem>)}
              </>}
            </DropdownMenuContent>
          </DropdownMenu>
          {!ended && <>
          <Button size="icon-sm" variant={muted ? "secondary" : "outline"} onClick={() => setMuted(!muted)}>
            {muted ? <MicOff /> : <Mic />}
            <span className="sr-only">{muted ? "Unmute" : "Mute"}</span>
          </Button>
          <Button size="sm" onClick={() => setWrapping(true)}>
            End meeting
          </Button>
          </>}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <Canvas
          studio={studio}
          blank={blank}
          testing={demo}
          demo={demo && beat > 0}
          marks={marks}
          focus={focus}
          working={working}
          outcomes={outcomes}
          glide={glide}
          title={workshop.title}
          zoom={zoom}
          pan={pan}
          setPan={setPan}
          tool={spaceHeld ? "hand" : tool}
          elRef={canvasEl}
          projectId={project.id}
          zoomTo={zoomTo}
          offsets={offsets}
          setOffsets={setOffsets}
          sections={sections}
          setSections={setSections}
          selected={selected}
          setSelected={setSelected}
          sectionMenu={sectionMenu}
          setSectionMenu={setSectionMenu}
          onDrawSection={(box) => addSection(box)}
          stickies={stickies}
          setStickies={setStickies}
          cards={cards}
          setCards={setCards}
          picked={picked}
          onPick={pick}
        />

        {/* Canvas tools, stacked on the left */}
        <div className="absolute top-1/2 left-3 z-10 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border bg-background p-1 shadow-xs">
          <ToggleGroup type="single" orientation="vertical" value={tool} onValueChange={(v) => v && setTool(v)} size="sm" className="flex-col">
            {([
              ["select", MousePointer2, "Select"],
              ["hand", Hand, "Pan · Space"],
              ...(DESIGN === "b" ? [["section", Frame, "Section"] as const] : []),
              ["sticky", StickyNote, "Sticky note"],
              ["text", Type, "Text"],
              ["shape", Square, "Shape"],
              ["connector", Spline, "Connector"],
            ] as const).map(([v, I, label]) => (
              <Tooltip key={v}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={v}
                    aria-label={label}
                    onClick={() => {
                      if (v === "sticky") {
                        const c = viewCenter()
                        const id = `n${Date.now()}`
                        setStickies((s) => [...s, { id, x: c.x - 110, y: c.y - 70, text: "New note", by: ME.id, shade: 0 }])
                        setSelected(`n:${id}`)
                        setTool("select")
                      }
                    }}
                  >
                    <I />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </ToggleGroup>
          <Separator className="my-1 data-[orientation=horizontal]:w-5" />
          <Tooltip>
            <TooltipTrigger asChild><Button size="icon-sm" variant="ghost" onClick={() => toast("Upload an image or file")}><ImagePlus /><span className="sr-only">Upload</span></Button></TooltipTrigger>
            <TooltipContent side="right">Upload</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><Button size="icon-sm" variant="ghost" onClick={() => setBringing(true)}><Layers /><span className="sr-only">Bring in artifacts</span></Button></TooltipTrigger>
            <TooltipContent side="right">Bring in artifacts</TooltipContent>
          </Tooltip>
          <Separator className="my-1 data-[orientation=horizontal]:w-5" />
          <Tooltip>
            <TooltipTrigger asChild><Button size="icon-sm" variant="ghost" onClick={() => zoomTo(zoom * 1.25, undefined, true)}><Plus /><span className="sr-only">Zoom in</span></Button></TooltipTrigger>
            <TooltipContent side="right">Zoom in · ⌘+</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-6 w-9 rounded-md text-[10px] tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground">{Math.round(zoom * 100)}%</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="min-w-40">
              <DropdownMenuItem onSelect={zoomToFit}>Zoom to fit<span className="ml-auto text-xs text-muted-foreground">⇧1</span></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => zoomTo(0.5, undefined, true)}>50%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => zoomTo(1, undefined, true)}>100%<span className="ml-auto text-xs text-muted-foreground">⌘0</span></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => zoomTo(2, undefined, true)}>200%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild><Button size="icon-sm" variant="ghost" onClick={() => zoomTo(zoom / 1.25, undefined, true)}><Minus /><span className="sr-only">Zoom out</span></Button></TooltipTrigger>
            <TooltipContent side="right">Zoom out · ⌘−</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><Button size="icon-sm" variant="ghost" onClick={zoomToFit}><Maximize /><span className="sr-only">Zoom to fit</span></Button></TooltipTrigger>
            <TooltipContent side="right">Zoom to fit · ⇧1</TooltipContent>
          </Tooltip>
        </div>

        {/* Whyspace in the workshop: one chat bar, centered at the bottom, with Listen in up front. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-2 px-4" style={{ right: 360 }}>
          {msgs.length > 0 && (
            <div data-scroll className="pointer-events-auto max-h-[40vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl border bg-background p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Whyspace</span><button className="hover:text-foreground" onClick={() => setMsgs([])}>Clear</button></div>
              {msgs.map((m, i) => (
                <div key={i} className={cn("text-sm", m.who === "me" && "ml-auto w-fit max-w-[80%] rounded-2xl bg-muted px-3 py-1.5")}>
                  {m.text}
                  {m.refs?.map((d) => <div key={d.id} className="mt-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs">{d.title}</div>)}
                </div>
              ))}
            </div>
          )}
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border bg-background p-1.5 pl-2 shadow-xs">
            <Button
              size="sm"
              variant={listening ? "default" : "secondary"}
              className="rounded-xl"
              aria-pressed={listening}
              onClick={() => {
                if (listening) { setListening(false); toast("Stopped listening"); return }
                setListening(true)
                setHeard(true)
                if (!blank && !demo && !caught.some((c) => /^c\d/.test(c.id))) setCaught((c) => [...fromScript(), ...c])
              }}
            >
              <AudioLines className={cn(listening && "animate-pulse motion-reduce:animate-none")} />
              {listening ? "Listening" : "Listen in"}
            </Button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Ask Whyspace about this workshop"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button size="icon-sm" className="rounded-xl" disabled={!draft.trim()} onClick={ask}><ArrowUp /><span className="sr-only">Send</span></Button>
          </div>
        </div>

        {/* Right panel: what's being said, and what Whyspace caught from it */}
        <aside style={{ width: panelWidth }} className="relative flex shrink-0 flex-col border-l">
          <ResizeHandle edge="left" getWidth={() => panelWidth} onWidth={setPanelWidth} min={280} max={640} reset={360} />
          <Tabs defaultValue="caught" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b p-3">
              <TabsList className="w-full">
                <TabsTrigger value="caught">Caught · {caught.length + ideaCount}</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
            </div>
            {/* Decisions move the work (table, tasks, everyone's AI). Ideas are kept for later and change nothing. */}
            <TabsContent value="caught" className="min-h-0 flex-1">
              <div className="h-full overflow-y-auto">
                <div className="flex flex-col gap-3 p-4">
                  <div className="text-xs font-medium text-muted-foreground">Decisions · {caught.length}</div>
                  {caught.map((c) => (
                    <div key={c.id} className={cn("space-y-2 rounded-lg bg-muted/50 p-3 transition-shadow duration-700", c.id.startsWith("demo-") && "animate-in fade-in slide-in-from-top-2 duration-500", fresh === c.id && "ring-2 ring-foreground/70")}>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        <span className="text-xs text-muted-foreground">{PEOPLE[c.who].name} · {c.at}</span>
                        {DESIGN === "b" && <CaughtThread projectId={project.id} id={c.id} title={c.title} locked={c.status !== "inf"} className="ml-auto" />}
                      </div>
                      <div className="text-sm font-medium">{c.title}</div>
                      {c.status === "inf" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => { setCaught((all) => all.map((x) => (x.id === c.id ? { ...x, status: "conf" } : x))); if (DESIGN === "b") fileCaught(project.id, c.id, c.title) }}>
                            <Check />Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast("Edit wording")}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setCaught((all) => all.filter((x) => x.id !== c.id)); setParkedIdeas((all) => [c, ...all]) }}>Keep as idea</Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="pt-3 text-xs font-medium text-muted-foreground">Ideas · {ideaCount}</div>
                  {parkedIdeas.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <Archive className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{PEOPLE[c.who].name} · {c.at}</div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setParkedIdeas((all) => all.filter((x) => x.id !== c.id)); setCaught((all) => [c, ...all]) }}>Make decision</Button>
                    </div>
                  ))}
                    {demo && !parked && !picked && !parkedIdeas.length && <p className="text-sm text-muted-foreground">No ideas yet.</p>}
                    {picked && (
                      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                        <Archive className="mt-0.5 size-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Option {studio ? (picked === "B" ? "A · Unverified questions" : "B · Reject unsupported questions") : picked === "B" ? "A · Wiggling card" : "B · Moving dot"}</div>
                          <div className="text-xs text-muted-foreground">Not picked today · {studio ? (picked === "B" ? "Unreliable content" : "Fewer questions") : picked === "B" ? "Hard for a paw to hit" : "Less playful on its own"}</div>
                        </div>
                      </div>
                    )}
                    {(!demo || parked) && <div className={cn("flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm", demo && "animate-in fade-in slide-in-from-top-2 duration-500")}>
                      <Archive className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{studio ? "Generate questions without citations" : "A feather toy"}</div>
                        <div className="text-xs text-muted-foreground">{studio ? "Oct 15 · Couldn\u2019t be verified" : "Covered the cat\u2019s photo"}</div>
                      </div>
                    </div>}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="transcript" className="min-h-0 flex-1">
              <div className="h-full overflow-y-auto">
                <div className="flex flex-col gap-3 p-4">
                  {heard && lines.length ? lines.map((l, i) => (
                    <div key={`${l.at}-${i}`} className="flex gap-2.5 text-sm">
                      <PersonAvatar id={l.who} className="size-6 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{PEOPLE[l.who].name.split(" ")[0]} · {l.at}</div>
                        <p className={cn(l.decision && "font-medium")}>{l.text}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Turn on Listen in to see the transcript.</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <WorkshopDetails workshop={workshop} open={detailsOpen} onOpenChange={setDetailsOpen} />
      <BringInArtifacts project={project.id} thread={DESIGN === "b" ? undefined : workshop.thread} open={bringing} onOpenChange={setBringing} onAdd={bringIn} />

      {/* Wrap-up: what was decided, and each person's next steps. */}
      <Dialog open={wrapping} onOpenChange={setWrapping}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wrap up {session.title}</DialogTitle>
            <DialogDescription>No transcript is kept.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Decisions · {caught.length}</p>
              {caught.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm"><StatusBadge status={c.status} /><span className="truncate">{c.title}</span></div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Next steps</p>
              {(NEXT_STEPS[project.id] ?? []).map((n) => (
                <div key={n.who} className="flex items-center gap-2.5 text-sm"><PersonAvatar id={n.who} /><span className="w-16 shrink-0 font-medium">{PEOPLE[n.who].name.split(" ")[0]}</span><span>{n.text}</span></div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWrapping(false)}>Keep going</Button>
            <Button onClick={() => { setWrapping(false); setInMeeting(false); setListening(false); toast("Meeting ended", { description: "The workshop stays as it is." }) }}>End and save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

type CanvasProps = {
  studio: boolean
  blank: boolean
  testing: boolean
  demo: boolean
  marks: number[][]
  focus: number | null
  working: Record<string, string>
  outcomes: string[]
  glide: boolean
  title: string
  zoom: number
  pan: { x: number; y: number }
  setPan: (p: { x: number; y: number }) => void
  tool: string
  elRef: React.RefObject<HTMLDivElement | null>
  projectId: string
  zoomTo: (z: number, at?: { x: number; y: number }) => void
  offsets: Record<string, Offset>
  setOffsets: React.Dispatch<React.SetStateAction<Record<string, Offset>>>
  sections: Section[]
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
  selected: string | null
  setSelected: (id: string | null) => void
  sectionMenu: string | null
  setSectionMenu: (id: string | null) => void
  onDrawSection: (box: { x: number; y: number; w: number; h: number }) => void
  stickies: Sticky[]
  setStickies: React.Dispatch<React.SetStateAction<Sticky[]>>
  cards: Card[]
  setCards: React.Dispatch<React.SetStateAction<Card[]>>
  picked: "A" | "B" | null
  onPick: (o: "A" | "B") => void
}

type Drag =
  | { kind: "pan"; sx: number; sy: number; ox: number; oy: number }
  | { kind: "item"; id: string; sx: number; sy: number; ox: number; oy: number; live?: boolean }
  | { kind: "section"; id: string; mode: SectionDrag; sx: number; sy: number; start: Section; inside: { id: string; ox: number; oy: number }[]; live?: boolean }
  | { kind: "draw"; sx: number; sy: number; wx: number; wy: number }

function Canvas({ studio, blank, testing, demo, marks, focus, working, outcomes, glide, title, zoom, pan, setPan, tool, elRef, projectId, zoomTo, offsets, setOffsets, sections, setSections, selected, setSelected, sectionMenu, setSectionMenu, onDrawSection, stickies, setStickies, cards, picked, onPick }: CanvasProps) {
  const drag = useRef<Drag | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const worldEl = useRef<HTMLDivElement>(null)
  const capture = (e: ReactPointerEvent) => elRef.current?.setPointerCapture(e.pointerId)
  const toWorld = (cx: number, cy: number) => {
    const r = elRef.current!.getBoundingClientRect()
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom }
  }

  // Trackpad: two fingers pan, pinch (or ⌘/Ctrl + scroll) zooms around the pointer.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-scroll]")) return
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        const d = Math.max(-50, Math.min(50, e.deltaY))
        zoomTo(zoom * Math.exp(-d * 0.004), { x: e.clientX - r.left, y: e.clientY - r.top })
      } else {
        setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY })
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  })

  const startDrag = (id: string, e: ReactPointerEvent) => {
    if (tool === "hand" || tool === "section") return
    e.stopPropagation()
    const t = e.target as HTMLElement
    setSelected(id)
    // Buttons and text being edited keep working as usual.
    if (t.closest("button,a,input,textarea,[contenteditable='true']")) return
    const o = offsetOf(offsets, id)
    // Capture only once it really moves, so clicks and double-clicks still reach the item.
    drag.current = { kind: "item", id, sx: e.clientX, sy: e.clientY, ox: o.dx, oy: o.dy }
  }

  // Moving a section carries everything that sits inside it, like a Figma section.
  const startSection = (s: Section, mode: SectionDrag, e: ReactPointerEvent) => {
    if (tool === "section") return
    setSelected(s.id)
    let inside: { id: string; ox: number; oy: number }[] = []
    if (mode === "move" && worldEl.current) {
      const wr = worldEl.current.getBoundingClientRect()
      inside = [...worldEl.current.querySelectorAll<HTMLElement>("[data-item]")].flatMap((n) => {
        const r = n.getBoundingClientRect()
        const cx = (r.left + r.width / 2 - wr.left) / zoom
        const cy = (r.top + r.height / 2 - wr.top) / zoom
        if (cx < s.x || cx > s.x + s.w || cy < s.y || cy > s.y + s.h) return []
        const id = n.dataset.item!
        const o = offsetOf(offsets, id)
        return [{ id, ox: o.dx, oy: o.dy }]
      })
    }
    drag.current = { kind: "section", id: s.id, mode, sx: e.clientX, sy: e.clientY, start: { ...s }, inside }
  }

  const onDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("button,[data-scroll]")) return
    if (tool === "section") {
      const w = toWorld(e.clientX, e.clientY)
      drag.current = { kind: "draw", sx: e.clientX, sy: e.clientY, wx: w.x, wy: w.y }
      setDraft({ x: w.x, y: w.y, w: 0, h: 0 })
    } else {
      setSelected(null)
      drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
    }
    capture(e)
  }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if ((d.kind === "item" || d.kind === "section") && !d.live) {
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
      d.live = true
      capture(e)
    }
    if (d.kind === "pan") setPan({ x: d.ox + dx, y: d.oy + dy })
    else if (d.kind === "item") setOffsets((all) => ({ ...all, [d.id]: { dx: d.ox + dx / zoom, dy: d.oy + dy / zoom } }))
    else if (d.kind === "draw") {
      const w = toWorld(e.clientX, e.clientY)
      setDraft({ x: Math.min(d.wx, w.x), y: Math.min(d.wy, w.y), w: Math.abs(w.x - d.wx), h: Math.abs(w.y - d.wy) })
    } else {
      const wx = dx / zoom
      const wy = dy / zoom
      const st = d.start
      setSections((all) => all.map((s) => {
        if (s.id !== d.id) return s
        if (d.mode === "move") return { ...s, x: st.x + wx, y: st.y + wy }
        return { ...s, w: d.mode === "b" ? st.w : Math.max(160, st.w + wx), h: d.mode === "r" ? st.h : Math.max(100, st.h + wy) }
      }))
      if (d.mode === "move" && d.inside.length) {
        setOffsets((all) => {
          const next = { ...all }
          for (const i of d.inside) next[i.id] = { dx: i.ox + wx, dy: i.oy + wy }
          return next
        })
      }
    }
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (d?.kind === "draw" && draft) {
      setDraft(null)
      // A click without a drag drops a default-size section there.
      onDrawSection(draft.w < 40 || draft.h < 40 ? { x: draft.x - 240, y: draft.y - 160, w: 480, h: 320 } : draft)
    }
  }

  const shown = sections.filter((s) => !s.when || (s.when === "clips" ? demo : s.when === "protos" ? !!working.KL || outcomes.includes("protos") : !!working.TR || outcomes.includes("research")))

  return (
    <CanvasCtx.Provider value={{ tool, zoom, selected, offsets, startDrag }}>
    <div
      ref={elRef}
      className={cn("relative min-w-0 flex-1 touch-none overflow-hidden bg-muted/40 select-none", tool === "hand" ? "cursor-grab active:cursor-grabbing" : tool === "section" ? "cursor-crosshair" : "cursor-default")}
      style={{
        backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      <div ref={worldEl} className={cn("absolute top-0 left-0 origin-top-left", glide && "transition-transform duration-700 ease-out motion-reduce:transition-none")} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
        {/* Thread sections sit under the work they hold */}
        {shown.map((s) => (
          <SectionFrame
            key={s.id}
            projectId={projectId}
            section={s}
            selected={selected === s.id}
            menuOpen={sectionMenu === s.id}
            onMenuOpen={(o) => setSectionMenu(o ? s.id : null)}
            onDrag={(mode, e) => startSection(s, mode, e)}
            onChange={(patch) => setSections((all) => all.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))}
            onDelete={() => setSections((all) => all.filter((x) => x.id !== s.id))}
          />
        ))}
        {draft && <div className="absolute rounded-xl border border-dashed border-foreground/40 bg-foreground/5" style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h }} />}

        <Movable id="title" x={40} y={40} className="w-max">
          <div data-title className="type-title">{title}</div>
          {(demo || (!blank && !testing)) && <div className="mt-1 text-sm whitespace-nowrap text-muted-foreground">{DESIGN === "b" ? (studio ? "Keller and Jordan Kim" : demo ? "Cat tests, Oct 21" : "Trevor and Kelly") : studio ? "Prototype thread · Keller and Jordan Kim" : demo ? "Research thread · cat tests, Oct 21" : "Research thread · Trevor and Kelly"}</div>}
        </Movable>
        {demo && working.KL && <Movable id="work-KL" x={40} y={724}><WorkingStatus text={working.KL} /></Movable>}
        {demo && outcomes.includes("protos") && <>
          <Movable id="opt-A" x={40} y={700}><OptionFrame label="Option A · Claude Code" title="A wiggling card" rows={4} note="Hard for a paw to hit" state={picked === null ? "open" : picked === "A" ? "picked" : "archived"} onPick={() => onPick("A")} /></Movable>
          <Movable id="opt-B" x={374} y={700}><OptionFrame label="Option B · Claude Code" title="A moving dot" rows={4} note="Easy to follow" state={picked === null ? "open" : picked === "B" ? "picked" : "archived"} onPick={() => onPick("B")} /></Movable>
        </>}
        {demo && working.TR && <Movable id="work-TR" x={746} y={724}><WorkingStatus text={working.TR} /></Movable>}
        {demo && outcomes.includes("research") && <Movable id="research" x={746} y={700}><ResearchCard /></Movable>}
        {demo && VIDEOS.map((v, i) => <Movable key={v.cat} id={`v:${i}`} x={VIDEO_X[i]} y={VIDEO_Y}><VideoTile delay={i * 150} {...v} marks={marks[i]} focused={focus === i} /></Movable>)}
        {!blank && !testing && <>

        <Movable id="opt-A" x={340} y={160}>
          <OptionFrame
            label="Option A"
            title={studio ? "Show an unverified question" : "A wiggling card"}
            rows={8}
            note={studio ? "Harder to verify" : "Hard for a paw to hit"}
            state={picked === null ? "open" : picked === "A" ? "picked" : "archived"}
            onPick={() => onPick("A")}
          />
        </Movable>
        <Movable id="opt-B" x={690} y={160}>
          <OptionFrame
            label="Option B"
            title={studio ? "Reject and explain the missing source" : "A moving dot"}
            rows={4}
            note={studio ? "Fewer questions, with a retry" : "Easy to follow"}
            state={picked === null ? "open" : picked === "B" ? "picked" : "archived"}
            onPick={() => onPick("B")}
          />
        </Movable>

        </>}

        {stickies.map((s) => (
          <Movable key={s.id} id={`n:${s.id}`} x={s.x} y={s.y} className="rounded-sm">
            <div
              // Double-click to edit the note, like FigJam.
              onDoubleClick={(e) => {
                const p = e.currentTarget.querySelector("p")!
                p.contentEditable = "true"
                p.focus()
                document.getSelection()?.selectAllChildren(p)
              }}
              className={cn("flex flex-col justify-between rounded-sm text-sm shadow-xs", s.small ? "min-h-[72px] w-[300px] gap-1.5 p-3 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-300" : "h-[140px] w-[220px] p-4", SHADES[s.shade])}
            >
              <p
                suppressContentEditableWarning
                onBlur={(e) => { const text = e.currentTarget.textContent ?? ""; e.currentTarget.contentEditable = "false"; setStickies((all) => all.map((x) => (x.id === s.id ? { ...x, text } : x))) }}
                onKeyDown={(e) => { if (e.key === "Escape") e.currentTarget.blur() }}
                className="cursor-text outline-none select-text [&:not([contenteditable=true])]:cursor-[inherit]"
              >
                {s.text}
              </p>
              <span className="text-xs text-muted-foreground">{PEOPLE[s.by].name}</span>
            </div>
          </Movable>
        ))}

        {cards.map((c) => (
          <Movable key={c.id} id={`c:${c.id}`} x={c.x} y={c.y}>
            <div className="w-[240px] overflow-hidden rounded-lg border bg-background">
              <div className="flex h-24 items-center justify-center bg-muted text-xs text-muted-foreground">{c.kind}</div>
              <div className="space-y-1 p-3">
                <div className="truncate text-sm font-medium">{c.title}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{c.source}</span>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => (c.url ? window.open(c.url, "_blank") : toast(`Open ${c.title}`))}><ExternalLink />Open</Button>
                </div>
              </div>
            </div>
          </Movable>
        ))}

        {/* Other people's cursors */}
        {!blank && (demo || !testing) && <Cursor x={demo ? 250 : 700} y={demo ? 290 : 520} name={studio ? "Jordan Kim" : "Trevor"} />}
        {!studio && !blank && (demo || !testing) && <Cursor x={demo ? 560 : 960} y={demo ? 540 : 430} name="Kelly" />}
      </div>
    </div>
    </CanvasCtx.Provider>
  )
}

function OptionFrame({ label, title, rows, note, state, onPick }: { label: string; title: string; rows: number; note: string; state: "open" | "picked" | "archived"; onPick: () => void }) {
  return (
    <div className={cn("w-[320px]", state === "archived" && "opacity-40")}>
      <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {state === "picked" && <Badge>Picked</Badge>}
        {state === "archived" && <Badge variant="outline">In idea archive</Badge>}
      </div>
      <div className={cn("rounded-lg border bg-background p-4", state === "picked" && "border-foreground")}>
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

// Someone is off in their own AI tool. Only the status shows here, never their chat.
function WorkingStatus({ text }: { text: string }) {
  return (
    <div className="flex w-[300px] items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2.5 text-sm text-muted-foreground animate-in fade-in">
      <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground motion-reduce:animate-none" />
      {text}
    </div>
  )
}

// Trevor's Perplexity answer, linked onto the canvas when he's done.
function ResearchCard() {
  return (
    <div className="w-[270px] overflow-hidden rounded-lg border bg-background animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-1.5 p-4">
        <div className="text-xs text-muted-foreground">Trevor · from Perplexity</div>
        <div className="text-sm font-medium">Cats perk up at purring</div>
        <p className="text-sm text-muted-foreground">It makes them look and come closer.</p>
      </div>
      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <span>3 sources</span>
        <Button size="sm" variant="outline" className="h-7" onClick={() => toast("Open in Perplexity")}><ExternalLink />Open</Button>
      </div>
    </div>
  )
}

// A cat test clip, playing. Gray wireframe: the cat drifts toward the phone; marks are moments someone called out.
function VideoTile({ delay, cat, test, length, marks, focused }: { delay: number; cat: string; test: string; length: number; marks: number[]; focused: boolean }) {
  const [t, setT] = useState(delay / 1000)
  useEffect(() => {
    const timer = setInterval(() => setT((v) => (v + 0.25) % length), 250)
    return () => clearInterval(timer)
  }, [length])
  const time = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
  return (
    <div
      className={cn("w-[300px] overflow-hidden rounded-lg border bg-background transition-shadow duration-500 animate-in fade-in zoom-in-95", focused && "ring-2 ring-foreground/70")}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="relative flex h-[180px] items-end justify-center overflow-hidden bg-muted">
        <div className="mb-[-40px] flex h-[170px] w-[92px] flex-col gap-1.5 rounded-xl border-2 border-foreground/20 bg-background p-2">
          <div className="h-16 rounded-md bg-muted" />
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>
        <Cat
          className="absolute bottom-6 size-10 text-foreground/60 transition-transform duration-300 ease-linear motion-reduce:transition-none"
          style={{ left: 24, transform: `translateX(${Math.abs(Math.sin(t / 3)) * 70}px) translateY(${Math.abs(Math.sin(t * 2)) * -4}px)` }}
        />
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[11px]">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground motion-reduce:animate-none" />Playing
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="relative h-1 rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground/70" style={{ width: `${(t / length) * 100}%` }} />
          {marks.map((m) => <span key={m} className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground animate-in zoom-in-50" style={{ left: `${m * 100}%` }} />)}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{cat} · {test}</span>
          <span className="tabular-nums text-muted-foreground">{time(t)} / {time(length)}</span>
        </div>
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

// Pick a whole thread or single artifacts and drop them on the canvas as link cards.
// A link pasted here is filed back to the workshop's thread.
function BringInArtifacts({ project, thread, open, onOpenChange, onAdd }: { project: string; thread?: string; open: boolean; onOpenChange: (o: boolean) => void; onAdd: (items: Omit<Card, "x" | "y">[]) => void }) {
  const artifacts = ARTIFACTS.filter((a) => a.project === project)
  const threads = [...new Set(artifacts.map((a) => a.part))]
  const [picked, setPicked] = useState<string[]>([])
  const [link, setLink] = useState("")
  const seq = useRef(0)
  const toggle = (ids: string[], on: boolean) => setPicked((p) => (on ? [...new Set([...p, ...ids])] : p.filter((x) => !ids.includes(x))))
  const add = () => {
    const stamp = ++seq.current
    const items: Omit<Card, "x" | "y">[] = artifacts.filter((a) => picked.includes(a.id)).map((a) => ({ id: `a-${a.id}-${stamp}`, title: a.name, kind: a.kind, source: ARTIFACT_SOURCE[a.id]?.source ?? "Whyspace", url: ARTIFACT_SOURCE[a.id]?.url }))
    if (link.trim()) items.push({ id: `l-${stamp}`, title: link.trim().replace(/^https?:\/\//, ""), kind: "Link", source: "Link", url: link.trim() })
    onAdd(items)
    if (link.trim() && thread) toast(`Link filed to the ${thread} thread`)
    setPicked([])
    setLink("")
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Bring in artifacts</DialogTitle></DialogHeader>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto">
          {threads.map((t) => {
            const ids = artifacts.filter((a) => a.part === t).map((a) => a.id)
            const all = ids.every((id) => picked.includes(id))
            return (
              <div key={t} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={all ? true : ids.some((id) => picked.includes(id)) ? "indeterminate" : false} onCheckedChange={(v) => toggle(ids, v === true)} />
                  {DESIGN === "b" ? <ThreadTag projectId={project} part={t} /> : `${t} thread`}
                </label>
                {artifacts.filter((a) => a.part === t).map((a) => (
                  <label key={a.id} className="flex items-center gap-2 pl-6 text-sm">
                    <Checkbox checked={picked.includes(a.id)} onCheckedChange={(v) => toggle([a.id], v === true)} />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{ARTIFACT_SOURCE[a.id]?.source ?? a.kind}</span>
                  </label>
                ))}
              </div>
            )
          })}
        </div>
        <Input placeholder="Or paste a link" value={link} onChange={(e) => setLink(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!picked.length && !link.trim()} onClick={add}>Add to canvas{picked.length + (link.trim() ? 1 : 0) > 0 && ` · ${picked.length + (link.trim() ? 1 : 0)}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
