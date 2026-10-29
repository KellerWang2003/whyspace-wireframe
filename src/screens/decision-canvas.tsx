import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react"
import { toast } from "sonner"
import {
  ArrowUp,
  Bot,
  ChevronDown,
  Code,
  ExternalLink,
  FileText,
  GitBranch,
  GitPullRequest,
  Minus,
  MonitorPlay,
  MoreHorizontal,
  PenTool,
  Pencil,
  Play,
  Plus,
  Sheet as SheetIcon,
  Film,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import {
  ARTIFACTS,
  CANVAS_EXTRAS,
  LINKS,
  PART_SUMMARY,
  PEOPLE,
  PROJECT_DECISION_SUMMARY,
  STATUS_LABEL,
  projectName,
  type Artifact,
  type ArtifactKind,
  type Decision,
  type Status,
} from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"

// The decisions canvas: one node per part of the project (or per project, across projects).
// Each node leads with its artifacts (prototypes, design files, repos, docs), then a short
// AI summary, then its decisions, folded away until someone needs them. People and their
// AIs (over MCP) can add, rename and delete parts. The big input at the bottom is the way
// into Whyspace's AI: ask about decisions or artifacts, or search them.

// `source` is the part's original name, so its summary and artifacts survive a rename.
type Node = { id: string; name: string; source?: string; x: number; y: number; owner?: string; note?: string }
type Suggestion = { name: string; from: string; moves: string[]; by: string; reason: string; x: number; y: number }

const W = 340
const GAP = 40
const TOP = 96

const KIND_ICON: Record<ArtifactKind, typeof FileText> = {
  Prototype: MonitorPlay,
  Figma: PenTool,
  Repo: Code,
  Doc: FileText,
  "AI output": Sparkles,
  Sheet: SheetIcon,
  Video: Film,
}
const OPEN_IN: Record<ArtifactKind, string> = { Prototype: "Open prototype", Figma: "Open in Figma", Repo: "Open on GitHub", Doc: "Open doc", "AI output": "Open in ChatGPT", Sheet: "Open sheet", Video: "Play video" }

// The artifact a node shows big: a prototype first, then a design file, then a repo.
const heroOf = (items: Artifact[]) => ["Prototype", "Figma", "Repo"].map((k) => items.find((a) => a.kind === k)).find(Boolean)

// Rough node height, used to stack nodes in columns before anyone drags them.
const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine))
const estimate = (summary: string, items: Artifact[]) =>
  64 + (heroOf(items) ? 200 : 0) + Math.max(items.length - (heroOf(items) ? 1 : 0), 0) * 48 + Math.min(lines(summary, 40), 3) * 20 + 40 + 48 + 40

function layout(groups: { name: string; owner?: string; summary: string; items: Artifact[] }[]) {
  const cols = [TOP, TOP, TOP]
  const shortest = () => cols.indexOf(Math.min(...cols))
  const nodes: Node[] = groups.map((g, i) => {
    const c = shortest()
    const node = { id: `n${i}`, name: g.name, source: g.name, owner: g.owner, x: 24 + c * (W + GAP), y: cols[c] }
    cols[c] += estimate(g.summary, g.items) + GAP
    return node
  })
  const c = shortest()
  return { nodes, next: { x: 24 + c * (W + GAP), y: cols[c] } }
}

type Props = {
  all: Decision[] // everything in scope, so nodes don't vanish while filtering
  visible: Decision[] // what passes the current filters
  basePath: string
  acrossProjects: boolean
  scopeName: string
  title: ReactNode // floating title and views, top left
  filters: ReactNode // floating filters, top right
  onAddDecision: () => void
}

export function DecisionCanvas({ all, visible, basePath, acrossProjects, scopeName, title, filters, onAddDecision }: Props) {
  const groupOf = (d: Decision) => (acrossProjects ? projectName(d.project) : d.part)
  const [moved, setMoved] = useState<Record<string, string>>({})
  const partOf = (d: Decision) => moved[d.id] ?? groupOf(d)
  const projects = new Set(all.map((d) => d.project))
  const extras = acrossProjects ? undefined : CANVAS_EXTRAS[all[0]?.project ?? ""]
  const artifactsOf = (n: Node) =>
    ARTIFACTS.filter((a) => projects.has(a.project) && (acrossProjects ? projectName(a.project) === n.name : a.part === (n.source ?? n.name)))

  const [initial] = useState(() => {
    const seen = new Map<string, { owner: string; project: string }>()
    for (const d of all) if (!seen.has(groupOf(d))) seen.set(groupOf(d), { owner: d.owner, project: d.project })
    return layout(
      [...seen].map(([name, g]) => ({
        name,
        owner: acrossProjects ? undefined : g.owner,
        summary: (acrossProjects ? PROJECT_DECISION_SUMMARY[g.project] : PART_SUMMARY[name]) ?? "",
        items: ARTIFACTS.filter((a) => (acrossProjects ? a.project === g.project : a.project === g.project && a.part === name)),
      })),
    )
  })
  // Show that AIs edit the map too: an AI sorted decisions into a part over MCP.
  const [nodes, setNodes] = useState<Node[]>(() => initial.nodes.map((n) => (extras?.notePart === n.name ? { ...n, note: extras.note } : n)))

  // An AI suggestion waiting for a person, like splitting a new part out of an old one.
  const [suggestion, setSuggestion] = useState<Suggestion | null>(() => (extras?.suggestion ? { ...extras.suggestion, ...initial.next } : null))
  const [aiCanEdit, setAiCanEdit] = useState(true)
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Artifact | null>(null)

  const [chatOpen, setChatOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [thinking, setThinking] = useState(false)
  const chatBox = useRef<HTMLDivElement>(null)

  // No zoom buttons: pinch or Ctrl + scroll zooms, scroll pans, like FigJam.
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvas = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-ui]")) return
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) setZoom((z) => Math.min(1.5, Math.max(0.4, z - e.deltaY * 0.01)))
      else setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const drag = useRef<{ kind: "pan" | "node"; id?: string; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const onDown = (e: ReactPointerEvent) => {
    // Menus are portaled out of the canvas but their events still bubble here through React.
    const target = e.target as HTMLElement
    if (!e.currentTarget.contains(target) || target.closest("[data-node],[data-ui]")) return
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (d.kind === "pan") setPan({ x: d.ox + dx, y: d.oy + dy })
    else setNodes((all) => all.map((n) => (n.id === d.id ? { ...n, x: d.ox + dx / zoom, y: d.oy + dy / zoom } : n)))
  }
  const onUp = () => {
    drag.current = null
  }

  const send = (q: string) => {
    if (!q.trim() || thinking) return
    setChatOpen(true)
    setMsgs((m) => [...m, { role: "you", text: q.trim() }])
    setThinking(true)
    const artifacts = ARTIFACTS.filter((a) => projects.has(a.project))
    setTimeout(() => {
      setMsgs((m) => [...m, answer(q, all, artifacts, nodes.map((n) => n.name), partOf)])
      setThinking(false)
      // Scroll only the chat, never the canvas around it.
      setTimeout(() => chatBox.current?.scrollTo({ top: chatBox.current.scrollHeight, behavior: "smooth" }), 50)
    }, 700)
  }

  const inNode = (n: Node) => visible.filter((d) => partOf(d) === n.name)
  const countIn = (name: string) => all.filter((d) => partOf(d) === name).length

  // Links between decisions in different parts become one line between those parts.
  const edges = new Map<string, { a: Node; b: Node; n: number }>()
  for (const [from, to] of LINKS) {
    const a = all.find((d) => d.id === from)
    const b = all.find((d) => d.id === to)
    if (!a || !b || partOf(a) === partOf(b)) continue
    const na = nodes.find((n) => n.name === partOf(a))
    const nb = nodes.find((n) => n.name === partOf(b))
    if (!na || !nb) continue
    const key = [na.id, nb.id].sort().join("-")
    const e = edges.get(key) ?? { a: na, b: nb, n: 0 }
    e.n++
    edges.set(key, e)
  }

  const addPart = (name: string) => {
    const right = Math.max(...nodes.map((n) => n.x), 0) + W + GAP
    setNodes((ns) => [...ns, { id: `n${Date.now()}`, name, x: right, y: TOP }])
    setPan((p) => ({ x: Math.min(p.x, -(right * zoom) + 400), y: p.y }))
  }

  const deletePart = (node: Node) => {
    const n = countIn(node.name)
    setNodes((ns) => {
      const rest = ns.filter((x) => x.id !== node.id)
      return n && !rest.some((x) => x.name === "Unsorted") ? [...rest, { id: `n${Date.now()}`, name: "Unsorted", x: node.x, y: node.y }] : rest
    })
    if (n) {
      setMoved((m) => {
        const next = { ...m }
        for (const d of all) if (partOf(d) === node.name) next[d.id] = "Unsorted"
        return next
      })
      toast(`Deleted ${node.name}`, { description: `${n} decision${n > 1 ? "s" : ""} moved to Unsorted.` })
    } else toast(`Deleted ${node.name}`)
  }

  const keepSuggestion = (s: Suggestion) => {
    setNodes((ns) => [...ns, { id: `n${Date.now()}`, name: s.name, source: s.name, x: s.x, y: s.y, note: `Suggested by ${s.by} over MCP · kept by you` }])
    setMoved((m) => ({ ...m, ...Object.fromEntries(s.moves.map((id) => [id, s.name])) }))
    setSuggestion(null)
    toast(`Added ${s.name}`, { description: `Moved ${s.moves.length} decision${s.moves.length > 1 ? "s" : ""} from ${s.from}.` })
  }

  return (
    <div className="relative h-[calc(100svh-3.5rem)] min-h-[560px] overflow-hidden">
      <div
        ref={canvas}
        data-canvas-root
        className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-muted/30 select-none active:cursor-grabbing"
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
          <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1">
            {[...edges.values()].map(({ a, b, n }) => {
              const [l, r] = a.x <= b.x ? [a, b] : [b, a]
              const x1 = l.x + W
              const y1 = l.y + 30
              const x2 = r.x
              const y2 = r.y + 30
              const sameCol = Math.abs(l.x - r.x) < W
              const path = sameCol
                ? `M ${l.x + W} ${y1} C ${l.x + W + 60} ${y1}, ${r.x + W + 60} ${y2}, ${r.x + W} ${y2}`
                : `M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`
              const mx = sameCol ? l.x + W + 48 : (x1 + x2) / 2
              const my = (y1 + y2) / 2
              return (
                <g key={`${a.id}-${b.id}`}>
                  <path d={path} fill="none" stroke="var(--muted-foreground)" strokeWidth={1.25} strokeDasharray="5 4" />
                  <foreignObject x={mx - 40} y={my - 11} width={80} height={22}>
                    <div className="mx-auto w-fit rounded-full border bg-background px-2 text-[11px] leading-5 text-muted-foreground">{n} link{n > 1 && "s"}</div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>

          {nodes.map((n) => (
            <PartNode
              key={n.id}
              node={n}
              artifacts={artifactsOf(n)}
              decisions={inNode(n)}
              total={countIn(n.name)}
              summary={acrossProjects ? PROJECT_DECISION_SUMMARY[all.find((d) => partOf(d) === n.name)?.project ?? ""] : PART_SUMMARY[n.source ?? n.name]}
              renaming={renaming === n.id}
              onRename={(name) => {
                setRenaming(null)
                if (!name || name === n.name) return
                setMoved((m) => {
                  const next = { ...m }
                  for (const d of all) if (partOf(d) === n.name) next[d.id] = name
                  return next
                })
                setNodes((ns) => ns.map((x) => (x.id === n.id ? { ...x, name } : x)))
              }}
              onStartRename={() => setRenaming(n.id)}
              onDelete={() => deletePart(n)}
              onAsk={() => send(`Summarize ${n.name}`)}
              onOpen={setViewing}
              onDragStart={(e) => {
                drag.current = { kind: "node", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y }
                ;(e.currentTarget.closest("[data-canvas-root]") as HTMLElement | null)?.setPointerCapture(e.pointerId)
              }}
              basePath={basePath}
              canEdit={!acrossProjects}
            />
          ))}

          {suggestion && aiCanEdit && (
            <div data-node className="absolute w-[340px] rounded-xl border-2 border-dashed bg-background/80 p-4" style={{ left: suggestion.x, top: suggestion.y }}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Bot className="size-3.5" />Suggested by {suggestion.by} over MCP</div>
              <div className="mt-2 font-medium">New part: {suggestion.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{suggestion.reason}</p>
              <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                <div className="mb-1 text-xs text-muted-foreground">Would move from {suggestion.from}</div>
                {all.filter((d) => suggestion.moves.includes(d.id)).map((d) => (
                  <div key={d.id} className="flex items-center gap-2"><StatusIcon status={d.status} /><span className="truncate">{d.title}</span></div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => keepSuggestion(suggestion)}>Keep</Button>
                <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>Dismiss</Button>
              </div>
            </div>
          )}
        </div>

        {/* Floating chrome: title, views and + on the left, filters on the right */}
        <div data-ui className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-3 [&>*]:pointer-events-auto">
          <div className="flex items-center gap-2 rounded-xl border bg-background/95 py-1.5 pr-1.5 pl-4 shadow-sm backdrop-blur">
            {title}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost"><Plus /><span className="sr-only">Add</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onSelect={onAddDecision}>Add decision</DropdownMenuItem>
                {!acrossProjects && <DropdownMenuItem onSelect={() => setAdding(true)}>Add part</DropdownMenuItem>}
                <DropdownMenuItem onSelect={() => toast("Share an artifact")}>Share artifact</DropdownMenuItem>
                {!acrossProjects && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Connected AIs (over MCP)</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem checked={aiCanEdit} onCheckedChange={(v) => setAiCanEdit(!!v)}>Can edit parts</DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-background/95 p-1.5 shadow-sm backdrop-blur">{filters}</div>
        </div>

        <AskBar
          open={chatOpen}
          onOpenChange={setChatOpen}
          msgs={msgs}
          thinking={thinking}
          onSend={send}
          boxRef={chatBox}
          decisions={all}
          partOf={partOf}
          scopeName={scopeName}
          summary={acrossProjects ? undefined : PROJECT_DECISION_SUMMARY[all[0]?.project ?? ""]}
          basePath={basePath}
          onOpenArtifact={setViewing}
          suggested={extras?.ask ?? SUGGESTED}
        />
      </div>

      <AddPartDialog open={adding} onOpenChange={setAdding} onAdd={addPart} />
      <ArtifactViewer artifact={viewing} onClose={() => setViewing(null)} decisions={all} basePath={basePath} />
    </div>
  )
}

/* ---------------- A part on the canvas ---------------- */

type NodeProps = {
  node: Node
  artifacts: Artifact[]
  decisions: Decision[]
  total: number
  summary?: string
  renaming: boolean
  onRename: (name: string) => void
  onStartRename: () => void
  onDelete: () => void
  onAsk: () => void
  onOpen: (a: Artifact) => void
  onDragStart: (e: ReactPointerEvent) => void
  basePath: string
  canEdit: boolean
}

function PartNode({ node, artifacts, decisions, total, summary, renaming, onRename, onStartRename, onDelete, onAsk, onOpen, onDragStart, basePath, canEdit }: NodeProps) {
  const [showDecisions, setShowDecisions] = useState(false)
  const toConfirm = decisions.filter((d) => d.status === "inf").length
  const hero = heroOf(artifacts)
  const rest = artifacts.filter((a) => a !== hero)
  const stop = (e: ReactPointerEvent) => e.stopPropagation()

  return (
    <div data-node className={cn("absolute w-[340px] rounded-xl border bg-card shadow-sm hover:z-10", showDecisions && "z-10")} style={{ left: node.x, top: node.y }}>
      <div
        className="flex cursor-grab items-center gap-2 px-4 pt-3 pb-2 active:cursor-grabbing"
        onPointerDown={(e) => e.currentTarget.contains(e.target as HTMLElement) && onDragStart(e)}
      >
        {renaming ? (
          <Input
            autoFocus
            defaultValue={node.name}
            className="h-7"
            onPointerDown={stop}
            onBlur={(e) => onRename(e.currentTarget.value.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename(e.currentTarget.value.trim())
              if (e.key === "Escape") onRename(node.name)
            }}
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{node.name}</div>
            <div className="text-xs text-muted-foreground">
              {artifacts.length} artifact{artifacts.length !== 1 && "s"} · {total} decision{total !== 1 && "s"}
            </div>
          </div>
        )}
        {node.owner && <PersonAvatar id={node.owner} />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" onPointerDown={stop}><MoreHorizontal /><span className="sr-only">Part options</span></Button>
          </DropdownMenuTrigger>
          {/* Don't pull focus back to the button, so Rename's field keeps it. */}
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuItem onSelect={onAsk}><Sparkles />Ask about this part</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast(`Share an artifact to ${node.name}`)}><Plus />Add artifact</DropdownMenuItem>
            {canEdit && <DropdownMenuItem onSelect={() => setTimeout(onStartRename, 0)}><Pencil />Rename</DropdownMenuItem>}
            {canEdit && <DropdownMenuSeparator />}
            {canEdit && <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 />Delete part</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 px-3 pb-3">
        {/* Artifacts lead: this is the work people actually open */}
        {hero && <ArtifactPreview artifact={hero} onOpen={() => onOpen(hero)} />}
        {rest.length > 0 && (
          <div className="-mx-1">
            {rest.map((a) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <button key={a.id} className="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left hover:bg-muted" onPointerDown={stop} onClick={() => onOpen(a)}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{a.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.kind} · {a.updated}</span>
                  </span>
                  <PersonAvatar id={a.owner} className="size-5" />
                </button>
              )
            })}
          </div>
        )}
        {!artifacts.length && (
          <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-6 text-sm text-muted-foreground hover:bg-muted" onPointerDown={stop} onClick={() => toast(`Share an artifact to ${node.name}`)}>
            <Plus className="size-4" />Add a prototype, file or repo
          </button>
        )}

        {total > 0 && (
          <p className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Sparkles className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-3">{summary ?? `${total} decisions so far.`}</span>
          </p>
        )}

        {/* Decisions stay folded until someone needs them */}
        <div className="rounded-lg border">
          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted" onPointerDown={stop} onClick={() => setShowDecisions((v) => !v)}>
            <span className="font-medium">Decisions</span>
            <span className="text-muted-foreground">{total}</span>
            {toConfirm > 0 && <Badge variant="outline" className="font-normal">{toConfirm} to confirm</Badge>}
            <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", showDecisions && "rotate-180")} />
          </button>
          {showDecisions && (
            <ul className="border-t p-1">
              {decisions.map((d) => (
                <li key={d.id}>
                  <button className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted" onPointerDown={stop} onClick={() => navigate(`${basePath}/${d.id}`)}>
                    <StatusIcon status={d.status} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">{d.title}</span>
                    <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{d.when ?? d.due}</span>
                  </button>
                </li>
              ))}
              {decisions.length < total && <li className="px-2 py-1 text-xs text-muted-foreground">{total - decisions.length} hidden by filters</li>}
              {!total && <li className="px-2 py-1.5 text-sm text-muted-foreground">No decisions yet.</li>}
            </ul>
          )}
        </div>
        {node.note && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Bot className="size-3.5" />{node.note}</div>}
      </div>
    </div>
  )
}

/* ---------------- Artifact previews ---------------- */

// A grayscale stand-in for what the artifact looks like, so people can see the work at a glance.
function Thumb({ artifact, big }: { artifact: Artifact; big?: boolean }) {
  const kind = artifact.kind
  if (kind === "Repo") {
    return (
      <div className={cn("space-y-1.5 bg-background p-3 font-mono text-[11px] text-muted-foreground", big && "space-y-2.5 p-6 text-xs")}>
        {(artifact.files ?? ["README.md"]).map((f, i) => (
          <div key={f} className="flex items-center gap-2"><span className="w-10 shrink-0 text-right">{["2h", "40m", "1d", "40m"][i]}</span><span className="truncate text-foreground">{f}</span></div>
        ))}
      </div>
    )
  }
  if (kind === "Figma") {
    return (
      <div className={cn("grid grid-cols-3 gap-2 bg-muted p-3", big && "gap-4 p-6")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("space-y-1.5 rounded-sm border bg-background p-1.5", big ? "h-56" : "h-20")}>
            <div className="h-1.5 w-2/3 rounded-full bg-muted" />
            <div className="h-3 rounded-sm bg-muted" />
            <div className={cn("h-3 rounded-sm", i === 1 ? "bg-foreground/80" : "bg-muted")} />
          </div>
        ))}
      </div>
    )
  }
  if (kind === "Prototype") {
    return (
      <div className={cn("bg-muted p-3", big && "p-6")}>
        <div className="overflow-hidden rounded-md border bg-background">
          <div className="flex gap-1 border-b px-2 py-1.5">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-border" />)}</div>
          <div className={cn("flex gap-3 p-3", big ? "h-80 gap-6 p-8" : "h-24")}>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-1/3 rounded-full bg-muted" />
              <div className={cn("rounded-sm border", big ? "h-9" : "h-4")} />
              <div className={cn("rounded-sm border", big ? "h-9" : "h-4")} />
              <div className={cn("rounded-sm bg-foreground/80", big ? "h-10" : "h-4")} />
            </div>
            <div className="w-1/3 space-y-1.5 rounded-sm bg-muted p-1.5">
              <div className="h-1.5 rounded-full bg-background" />
              <div className="h-1.5 w-2/3 rounded-full bg-background" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={cn("space-y-2 bg-background p-4", big && "space-y-3 p-8")}>
      <div className="h-3 w-1/2 rounded-full bg-foreground/70" />
      {[100, 92, 96, 70, 88, 60].slice(0, big ? 6 : 4).map((w, i) => <div key={i} className="h-2 rounded-full bg-muted" style={{ width: `${w}%` }} />)}
    </div>
  )
}

function ArtifactPreview({ artifact: a, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  const Icon = KIND_ICON[a.kind]
  return (
    <button className="group block w-full overflow-hidden rounded-lg border text-left" onPointerDown={(e) => e.stopPropagation()} onClick={onOpen}>
      <div className="relative">
        <Thumb artifact={a} />
        {a.kind === "Prototype" && (
          <span className="absolute inset-0 flex items-center justify-center transition group-hover:bg-background/40">
            <span className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm"><Play className="size-3" />Try it</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Icon className="size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{a.name}</div>
          <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {a.kind === "Repo" && <GitBranch className="size-3" />}
            {a.meta}
          </div>
        </div>
        <PersonAvatar id={a.owner} className="size-5" />
      </div>
    </button>
  )
}

// Opens any artifact in place: a working prototype, the repo, a doc. Plus the decisions it carries.
function ArtifactViewer({ artifact: a, onClose, decisions, basePath }: { artifact: Artifact | null; onClose: () => void; decisions: Decision[]; basePath: string }) {
  const [device, setDevice] = useState("desktop")
  const related = a ? decisions.filter((d) => d.part === a.part).slice(0, a.decisions) : []
  const Icon = a ? KIND_ICON[a.kind] : FileText
  return (
    <Dialog open={!!a} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        {a && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" />{a.kind} · {a.part}</div>
              <DialogTitle>{a.name}</DialogTitle>
              <DialogDescription>{PEOPLE[a.owner].name} · updated {a.updated} · {a.meta}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-[1fr_240px]">
              <div className="space-y-2">
                {a.kind === "Prototype" && (
                  <ToggleGroup type="single" size="sm" variant="outline" value={device} onValueChange={(v) => v && setDevice(v)}>
                    <ToggleGroupItem value="desktop">Desktop</ToggleGroupItem>
                    <ToggleGroupItem value="mobile">Mobile</ToggleGroupItem>
                  </ToggleGroup>
                )}
                {a.pr && (
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <GitPullRequest className="size-4" /><span>{a.pr}</span>
                  </div>
                )}
                <div className={cn("overflow-hidden rounded-lg border", a.kind === "Prototype" && device === "mobile" && "mx-auto w-72")}>
                  <Thumb artifact={a} big />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Decisions in this {a.kind === "Repo" ? "repo" : "artifact"}</div>
                <div className="divide-y rounded-lg border">
                  {related.map((d) => (
                    <button
                      key={d.id}
                      className="flex w-full items-start gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        onClose()
                        navigate(`${basePath}/${d.id}`)
                      }}
                    >
                      <StatusIcon status={d.status} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{d.title}</span>
                    </button>
                  ))}
                  {!related.length && <p className="p-3 text-sm text-muted-foreground">None linked yet.</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => toast("Ask about this artifact")}>Ask about this</Button>
              <Button onClick={() => toast(OPEN_IN[a.kind])}><ExternalLink />{OPEN_IN[a.kind]}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AddPartDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("")
  const submit = () => {
    if (!name.trim()) return
    onAdd(name.trim())
    setName("")
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a part</DialogTitle>
          <DialogDescription>Parts split a project into areas, like visual design, engineering or UX. Whyspace sorts new decisions and artifacts into the part they fit.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="part-name">Name</Label>
          <Input id="part-name" placeholder="Accessibility" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add part</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- Ask Whyspace: the input at the bottom is the way into AI ---------------- */

type Msg = { role: "you" | "ai"; text: string; cites?: Decision[]; files?: Artifact[] }

const STOP = new Set(["what", "which", "when", "where", "decide", "decided", "decision", "decisions", "about", "there", "that", "this", "with", "have", "does", "find", "show", "were", "make", "made", "anything", "the", "and", "for"])

function answer(q: string, decisions: Decision[], artifacts: Artifact[], parts: string[], partOf: (d: Decision) => string): Msg {
  const s = q.toLowerCase()
  const byStatus = (st: Status, text: string): Msg => {
    const cites = decisions.filter((d) => d.status === st)
    return cites.length ? { role: "ai", text: text.replace("{n}", String(cites.length)), cites } : { role: "ai", text: `Nothing is ${STATUS_LABEL[st].toLowerCase()} right now.` }
  }
  const part = parts.find((p) => s.includes(p.toLowerCase()))
  if (part) {
    const cites = decisions.filter((d) => partOf(d) === part)
    return { role: "ai", text: PART_SUMMARY[part] ?? `${part} has ${cites.length} decisions so far.`, cites, files: artifacts.filter((a) => a.part === part) }
  }
  // "Why ..." questions are about a decision, even when they mention a file type.
  if (!/^why\b/.test(s) && /prototype|repo|figma|file|doc|artifact|code/.test(s)) {
    const kind = /prototype/.test(s) ? "Prototype" : /repo|code/.test(s) ? "Repo" : /figma/.test(s) ? "Figma" : /doc/.test(s) ? "Doc" : null
    const files = artifacts.filter((a) => !kind || a.kind === kind)
    const noun = kind ? kind.toLowerCase() : "artifact"
    return { role: "ai", text: files.length ? `Here ${files.length > 1 ? `are ${files.length} ${noun}s` : `is 1 ${noun}`}.` : "Nobody has shared one yet.", files }
  }
  if (/\b(open|undecided|left|still|pending)\b/.test(s)) return byStatus("open", "{n} decisions are still open. Each has an owner and a due date.")
  if (/chang/.test(s)) return byStatus("chg", "{n} decisions changed recently. Each one keeps what it was before.")
  if (/confirm|inferred|review/.test(s)) return byStatus("inf", "{n} decisions were picked up from AI chats and code. A person still needs to confirm them.")
  if (/flag/.test(s)) return byStatus("flag", "{n} decisions are flagged for another look.")

  const words = s.match(/[a-z0-9$]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? []
  const scored = decisions
    .map((d) => {
      const hay = `${d.title} ${d.why ?? ""} ${d.snippet ?? ""} ${d.was ?? ""} ${d.part}`.toLowerCase()
      return { d, score: words.filter((w) => hay.includes(w.replace(/s$/, ""))).length }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  if (!scored.length) return { role: "ai", text: "I couldn't find a decision about that. It may not have been made yet. You can add it as an open decision so someone owns it." }
  const top = scored[0].d
  if (/^why\b/.test(s) && top.why) {
    return { role: "ai", text: `${top.title}. ${top.why}${top.by ? ` Decided by ${top.by}${top.when ? ` on ${top.when}` : ""}.` : ""}`, cites: [top] }
  }
  const cites = scored.slice(0, 4).map((x) => x.d)
  return { role: "ai", text: `I found ${cites.length} decision${cites.length > 1 ? "s" : ""} that match.`, cites }
}

const SUGGESTED = ["What's still open?", "What changed this week?", "Show me the prototypes", "Find anything flagged"]

type AskProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  msgs: Msg[]
  thinking: boolean
  onSend: (q: string) => void
  boxRef: RefObject<HTMLDivElement | null>
  decisions: Decision[]
  partOf: (d: Decision) => string
  scopeName: string
  summary?: string
  basePath: string
  onOpenArtifact: (a: Artifact) => void
  suggested: string[]
}

function AskBar({ open, onOpenChange, msgs, thinking, onSend, boxRef, decisions, partOf, scopeName, summary, basePath, onOpenArtifact, suggested }: AskProps) {
  const [draft, setDraft] = useState("")
  const send = (q: string) => {
    onSend(q)
    setDraft("")
  }
  const counts = (["conf", "inf", "chg", "open", "flag"] as Status[]).map((st) => [st, decisions.filter((d) => d.status === st).length] as const).filter(([, n]) => n)

  return (
    <div data-ui className="absolute bottom-5 left-1/2 flex w-[min(680px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2">
      {open && (
        <div className="flex max-h-[min(520px,calc(100svh-16rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">Ask Whyspace</span>
            <span className="text-xs text-muted-foreground">· {scopeName}</span>
            <Button size="icon-sm" variant="ghost" className="ml-auto" onClick={() => onOpenChange(false)}><Minus /><span className="sr-only">Minimize</span></Button>
          </div>
          <div ref={boxRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-2 rounded-lg bg-muted p-3">
              <div className="text-xs font-medium text-muted-foreground">Summary of {decisions.length} decisions</div>
              <p className="text-sm leading-relaxed">{summary ?? "Across your projects, most structural calls are confirmed. The open work is smaller details, and a handful of AI-inferred decisions are waiting for a person."}</p>
              <div className="flex flex-wrap gap-1.5">
                {counts.map(([st, n]) => (
                  <Badge key={st} variant="outline" className="gap-1 bg-background font-normal"><StatusIcon status={st} className="size-3" />{n} {STATUS_LABEL[st].toLowerCase()}</Badge>
                ))}
              </div>
            </div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggested.map((q) => <Button key={q} size="sm" variant="outline" className="rounded-full font-normal" onClick={() => send(q)}>{q}</Button>)}
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "you" ? (
                <div key={i} className="ml-auto w-fit max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">{m.text}</div>
              ) : (
                <div key={i} className="space-y-2">
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  {m.files && m.files.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {m.files.map((a) => {
                        const Icon = KIND_ICON[a.kind]
                        return (
                          <button key={a.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left hover:bg-muted" onClick={() => onOpenArtifact(a)}>
                            <Icon className="size-4 shrink-0" />
                            <span className="min-w-0"><span className="block truncate text-sm">{a.name}</span><span className="block truncate text-xs text-muted-foreground">{a.kind} · {a.part}</span></span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {m.cites && m.cites.length > 0 && (
                    <div className="divide-y rounded-lg border">
                      {m.cites.map((d) => (
                        <button key={d.id} className="flex w-full items-start gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted" onClick={() => navigate(`${basePath}/${d.id}`)}>
                          <StatusIcon status={d.status} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">{d.title}<span className="block text-xs text-muted-foreground">{partOf(d)} · {d.by ?? PEOPLE[d.owner].name}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
            {thinking && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 animate-pulse" />Reading decisions and artifacts…</div>}
          </div>
        </div>
      )}
      <form
        className="flex items-center gap-2 rounded-2xl border bg-background py-2 pr-2 pl-4 shadow-lg focus-within:ring-2 focus-within:ring-ring/30"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <Sparkles className="size-5 shrink-0" />
        <input
          className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          placeholder={`Ask anything about ${scopeName}, or search decisions and files`}
          value={draft}
          onFocus={() => onOpenChange(true)}
          onChange={(e) => setDraft(e.target.value)}
        />
        {open && !draft && msgs.length === 0 && (
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => onOpenChange(false)}><X /><span className="sr-only">Close</span></Button>
        )}
        <Button type="submit" size="icon" className="rounded-xl" disabled={!draft.trim()}><ArrowUp /><span className="sr-only">Send</span></Button>
      </form>
    </div>
  )
}
