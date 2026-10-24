import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { MoreHorizontal, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { PART_SUMMARY, PEOPLE, type Decision } from "@/data"
import { cn } from "@/lib/utils"
import { ArtifactIcon, ArtifactPicture, ArtifactThumb } from "@/playground/artifact"
import { LAST_VISIT, SUBSECTIONS, dayLabel, dayOfDecision, isAI, isNew, spanOf, updatedDay, type Model } from "@/playground/model"

export type ViewProps = { m: Model; onDecision: (id: string) => void; onArtifact: (id: string) => void }

// ---------- shared marks ----------

function NewDot() {
  return <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-label="New since your last visit" />
}

// One decision as a small pill: status shape, title, AI mark, new dot. Same everywhere.
function Pill({ d, onClick, dim, strong, className }: { d: Decision; onClick: () => void; dim?: boolean; strong?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={d.why ?? d.snippet ?? d.title}
      className={cn(
        "flex max-w-[220px] items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-left text-xs shadow-xs transition hover:border-foreground/50",
        isAI(d) && "border-dashed",
        strong && "border-foreground font-medium",
        dim && "opacity-30",
        className,
      )}
    >
      <StatusIcon status={d.status} className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{d.title}</span>
      {isAI(d) && <Sparkles className="size-3 shrink-0 text-muted-foreground" />}
      {isNew(d) && <NewDot />}
    </button>
  )
}

function Who({ d }: { d: Decision }) {
  const name = PEOPLE[d.owner]?.name.split(" ")[0] ?? d.owner
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <PersonAvatar id={d.owner} className="size-4" />
      {isAI(d) ? `${name}'s ${d.tool ?? "AI"} inferred` : d.by ? `${name}${d.tool ? ` · ${d.tool}` : ""}` : `${name} · open`}
    </span>
  )
}

// A fuller card for the tree and the board.
function Card({ d, onClick, className }: { d: Decision; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full flex-col gap-1 rounded-lg border bg-background p-2.5 text-left shadow-xs transition hover:border-foreground/50", isAI(d) && "border-dashed", className)}
    >
      <div className="flex items-start gap-1.5">
        <StatusIcon status={d.status} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <span className="line-clamp-2 text-xs font-medium leading-snug">{d.title}</span>
        {isNew(d) && <span className="mt-1"><NewDot /></span>}
      </div>
      {d.was && <span className="truncate pl-5 text-[11px] text-muted-foreground line-through">{d.was}</span>}
      <div className="pl-5"><Who d={d} /></div>
    </button>
  )
}

function Legend({ extra }: { extra?: ReactNode }) {
  const item = (s: Decision["status"], label: string) => (
    <span className="flex items-center gap-1"><StatusIcon status={s} className="size-3.5 text-muted-foreground" />{label}</span>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {item("conf", "Confirmed")}
      {item("inf", "Inferred by AI")}
      {item("chg", "Changed")}
      {item("open", "Open")}
      {item("flag", "Flagged")}
      <span className="flex items-center gap-1"><NewDot />New since Oct {LAST_VISIT}</span>
      {extra}
    </div>
  )
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2
  return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
}

const vcurve = (x1: number, y1: number, x2: number, y2: number) => {
  const my = (y1 + y2) / 2
  return `M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}`
}

// ---------- 1. Decision tree: a canvas of nested sections, like Figma sections ----------
// The project is the outer section. Parts are sections inside it, and any section can hold
// subsections of its own, as deep as the work needs. Inside a section, its decisions and
// artifacts run left to right in the order they happened.

type Section = { id: string; name: string; parent: string | null }

function seed(m: Model) {
  const sections: Section[] = [
    { id: "root", name: m.project.name, parent: null },
    ...m.parts.map((p) => ({ id: `part:${p.name}`, name: p.name, parent: "root" })),
    ...(SUBSECTIONS[m.project.id] ?? []).map(({ id, name, parent }) => ({ id, name, parent })),
  ]
  const place: Record<string, string> = {}
  for (const d of m.decisions) place[`d:${d.id}`] = `part:${d.part}`
  for (const a of m.artifacts) place[`a:${a.id}`] = `part:${a.part}`
  for (const s of SUBSECTIONS[m.project.id] ?? []) for (const it of s.items) if (it in place) place[it] = s.id
  return { sections, place }
}

export function TreeView({ m, onDecision, onArtifact }: ViewProps) {
  const [{ sections, place }, setTree] = useState(() => seed(m))
  const [editing, setEditing] = useState<string | null>(null)
  const [links, setLinks] = useState(false)
  const [focus, setFocus] = useState<string | null>(null)
  const [view, setView] = useState({ x: 24, y: 24, k: 0.85 })
  const [pts, setPts] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({})
  const layer = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)

  const childrenOf = (id: string) => sections.filter((s) => s.parent === id)
  const itemsIn = (id: string) =>
    Object.entries(place)
      .filter(([, s]) => s === id)
      .map(([key]) => key)
      .map((key) => {
        const d = key.startsWith("d:") ? m.byId(key.slice(2)) : undefined
        const a = key.startsWith("a:") ? m.artifacts.find((x) => x.id === key.slice(2)) : undefined
        return { key, d, a, day: d ? dayOfDecision(d) : a ? spanOf(m, a).start : 0 }
      })
      .filter((it) => it.d || it.a)
      .sort((x, y) => x.day - y.day || Number(!!x.d) - Number(!!y.d))
  const allIn = (id: string): string[] => [...itemsIn(id).map((i) => i.key), ...childrenOf(id).flatMap((c) => allIn(c.id))]

  const addSection = (parent: string) => {
    const id = `s${Date.now()}`
    setTree((t) => ({ ...t, sections: [...t.sections, { id, name: "New section", parent }] }))
    setEditing(id)
  }
  const rename = (id: string, name: string) => setTree((t) => ({ ...t, sections: t.sections.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)) }))
  // Deleting a section hands its items and subsections to its parent, so nothing is lost.
  const remove = (id: string) =>
    setTree((t) => {
      const parent = t.sections.find((s) => s.id === id)?.parent ?? "root"
      return {
        sections: t.sections.filter((s) => s.id !== id).map((s) => (s.parent === id ? { ...s, parent } : s)),
        place: Object.fromEntries(Object.entries(t.place).map(([k, s]) => [k, s === id ? parent : s])),
      }
    })
  const moveTo = (key: string, section: string) => setTree((t) => ({ ...t, place: { ...t.place, [key]: section } }))

  // Open zoomed to fit the whole project, like a canvas tool does.
  const fitted = useRef(false)
  useLayoutEffect(() => {
    const el = layer.current, box = el?.parentElement
    if (fitted.current || !el || !box) return
    fitted.current = true
    const k = Math.min(1, (box.clientWidth - 48) / el.offsetWidth, (box.clientHeight - 48) / el.offsetHeight)
    setView({ k: Math.max(0.5, k), x: 24, y: 24 })
  }, [])

  // Measure where each decision card landed, so connections can be drawn over the layout.
  useLayoutEffect(() => {
    if (!links || !layer.current) return
    const base = layer.current.getBoundingClientRect()
    const next: typeof pts = {}
    layer.current.querySelectorAll<HTMLElement>("[data-node]").forEach((el) => {
      const r = el.getBoundingClientRect()
      next[el.dataset.node!] = { x: (r.left - base.left) / view.k, y: (r.top - base.top) / view.k, w: r.width / view.k, h: r.height / view.k }
    })
    if (JSON.stringify(next) !== JSON.stringify(pts)) setPts(next)
  }, [links, sections, place, view.k, pts])

  const down = focus ? m.downstream(focus) : new Set<string>()
  const up = focus ? m.upstream(focus) : new Set<string>()
  const lit = (id: string) => !focus || id === focus || down.has(id) || up.has(id)
  const f = focus ? m.byId(focus) : undefined

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const r = e.currentTarget.getBoundingClientRect()
      const k = Math.min(1.6, Math.max(0.3, view.k * (1 - e.deltaY * 0.01)))
      const px = e.clientX - r.left, py = e.clientY - r.top
      setView({ k, x: px - ((px - view.x) / view.k) * k, y: py - ((py - view.y) / view.k) * k })
    } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
  }

  const renderSection = (s: Section, depth: number): ReactNode => {
    const items = itemsIn(s.id)
    const kids = childrenOf(s.id)
    const total = allIn(s.id)
    const fresh = total.filter((k) => k.startsWith("d:") && isNew(m.byId(k.slice(2))!)).length
    return (
      <div
        key={s.id}
        onDragOver={(e) => (e.preventDefault(), e.stopPropagation())}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const key = e.dataTransfer.getData("text/plain")
          if (key) moveTo(key, s.id)
        }}
        className={cn("flex w-max flex-col gap-4 rounded-2xl border p-5", depth === 0 ? "bg-background p-6" : depth % 2 ? "bg-muted/50" : "bg-background")}
      >
        <div className="flex items-center gap-2">
          {editing === s.id ? (
            <Input
              autoFocus
              defaultValue={s.name}
              className="h-7 w-48 text-sm"
              onBlur={(e) => (rename(s.id, e.target.value), setEditing(null))}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          ) : (
            <button onDoubleClick={() => setEditing(s.id)} className={cn("font-medium", depth === 0 ? "text-lg" : "text-sm")}>{s.name}</button>
          )}
          <span className="text-xs text-muted-foreground">{total.filter((k) => k.startsWith("d:")).length} decisions · {total.filter((k) => k.startsWith("a:")).length} artifacts</span>
          {fresh > 0 && <Badge variant="outline" className="gap-1 font-normal"><NewDot />{fresh} new</Badge>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 size-6"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => addSection(s.id)}><Plus />Add subsection</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setEditing(s.id)}><Pencil />Rename</DropdownMenuItem>
              {depth > 0 && <DropdownMenuItem onSelect={() => remove(s.id)}><Trash2 />Delete section</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {depth === 1 && PART_SUMMARY[s.name] && <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{PART_SUMMARY[s.name]}</p>}
        {items.length > 0 && (
          <div className="relative flex items-start gap-3 pt-5">
            <div className="absolute inset-x-0 top-2 h-px bg-foreground/15" />
            {items.map((it) => (
              <div
                key={it.key}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", it.key)}
                className="relative flex flex-col gap-1.5"
              >
                <span className="absolute -top-[17px] left-0 size-2 rounded-full bg-foreground/40" />
                <span className="absolute -top-5 left-3 text-[10px] text-muted-foreground">{dayLabel(it.day)}</span>
                {it.d ? (
                  <div data-node={it.d.id} className={cn("w-44", !lit(it.d.id) && "opacity-25")}>
                    <Card d={it.d} onClick={() => (links ? setFocus(it.d!.id === focus ? null : it.d!.id) : onDecision(it.d!.id))} className={cn(it.d.id === focus && "border-foreground ring-2 ring-foreground/20")} />
                  </div>
                ) : (
                  <div className={cn("w-48", links && focus && "opacity-25")}><ArtifactThumb artifact={it.a!} onOpen={() => onArtifact(it.a!.id)} /></div>
                )}
              </div>
            ))}
          </div>
        )}
        {kids.length > 0 && <div className={cn("flex items-start gap-4", depth === 0 && "max-w-[2200px] flex-wrap gap-6")}>{kids.map((k) => renderSection(k, depth + 1))}</div>}
        {!items.length && !kids.length && <div className="rounded-lg border border-dashed px-6 py-8 text-center text-xs text-muted-foreground">Drag decisions or artifacts here</div>}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">Sections nest like Figma sections: project, parts, then subsections as deep as you need. Inside each, work runs left to right in time. Drag items between sections; use ⋯ to add a subsection.</p>
        <Label className="ml-auto flex shrink-0 items-center gap-2 text-sm font-normal">
          <Switch checked={links} onCheckedChange={(v) => (setLinks(v), setFocus(null))} />
          Show connections
        </Label>
      </div>
      <div
        className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden rounded-lg border bg-muted/40 active:cursor-grabbing"
        style={{ backgroundImage: "radial-gradient(var(--color-border) 1px, transparent 1px)", backgroundSize: `${20 * view.k}px ${20 * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
        onWheel={onWheel}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return
          pan.current = { x: e.clientX - view.x, y: e.clientY - view.y }
          setFocus(null)
        }}
        onPointerMove={(e) => pan.current && setView((v) => ({ ...v, x: e.clientX - pan.current!.x, y: e.clientY - pan.current!.y }))}
        onPointerUp={() => (pan.current = null)}
        onPointerLeave={() => (pan.current = null)}
      >
        <div ref={layer} className="absolute top-0 left-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          {renderSection(sections.find((s) => s.id === "root")!, 0)}
          {links && (
            <svg className="pointer-events-none absolute inset-0 overflow-visible" width="1" height="1">
              <defs>
                <marker id="pg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" className="fill-foreground/70" />
                </marker>
              </defs>
              {m.links.map(([a, b]) => {
                const pa = pts[a], pb = pts[b]
                if (!pa || !pb) return null
                const on = !focus || (lit(a) && lit(b))
                const d =
                  pb.x > pa.x + pa.w + 16
                    ? curve(pa.x + pa.w, pa.y + pa.h / 2, pb.x - 2, pb.y + pb.h / 2)
                    : vcurve(pa.x + pa.w / 2, pb.y > pa.y ? pa.y + pa.h : pa.y, pb.x + pb.w / 2, pb.y > pa.y ? pb.y - 2 : pb.y + pb.h + 2)
                return <path key={a + b} d={d} fill="none" className={on ? "stroke-foreground/70" : "stroke-foreground/10"} strokeWidth={focus && on ? 2.5 : 1.5} markerEnd="url(#pg-arrow)" />
              })}
            </svg>
          )}
        </div>
        {f && (
          <div className="absolute top-3 left-3 z-10 w-72 space-y-2 rounded-lg border bg-background p-3 shadow-md">
            <div className="text-xs font-medium">{f.title}</div>
            <div className="text-[11px] text-muted-foreground">Builds on {up.size} · {down.size} build on it, so a change here ripples into them</div>
            {m.conflictsOf(f).map((c) => <div key={c} className="text-[11px]">Conflict: {c}</div>)}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onDecision(f.id)}>Open decision</Button>
              <Button size="sm" variant="ghost" onClick={() => setFocus(null)}><X />Clear</Button>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3 rounded-md border bg-background/90 px-2 py-1 text-[11px] text-muted-foreground">Drag to pan · scroll to move · pinch or ⌘ scroll to zoom · double-click a name to rename</div>
      </div>
      <Legend />
    </div>
  )
}

// ---------- 2. Board by parts ----------
// Each part reads top to bottom: what changed since your last visit, what's still open,
// the part's artifacts, then the part's decision tree (placeholder until its look is decided).

function BoardSection({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="px-1 text-[11px] font-medium text-muted-foreground">{title}{count !== undefined && ` · ${count}`}</div>
      {children}
    </div>
  )
}

export function BoardView({ m, onDecision, onArtifact }: ViewProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {m.parts.map((p) => {
          const ds = m.decisions.filter((d) => d.part === p.name)
          const arts = m.artifacts.filter((a) => a.part === p.name)
          const fresh = ds.filter(isNew)
          const touched = arts.filter((a) => updatedDay(a) > LAST_VISIT)
          const open = ds.filter((d) => d.status === "open" || d.status === "inf" || d.status === "flag")
          const byTime = [...ds].sort((a, b) => dayOfDecision(a) - dayOfDecision(b))
          return (
            <div key={p.name} className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-lg bg-muted/60 p-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm font-medium">{p.name}</span>
                <PersonAvatar id={p.owner} className="size-5" />
                {fresh.length > 0 && <Badge variant="outline" className="ml-auto gap-1 font-normal"><NewDot />{fresh.length} new</Badge>}
              </div>

              <BoardSection title={`Since you were here · Oct ${LAST_VISIT}`}>
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  {fresh.length || touched.length ? (
                    <>
                      <p className="text-xs leading-relaxed">
                        {[
                          fresh.length && `${fresh.length} new decision${fresh.length > 1 ? "s" : ""}${fresh.some(isAI) ? `, ${fresh.filter(isAI).length} from AI tools` : ""}`,
                          fresh.some((d) => d.was) && `${fresh.filter((d) => d.was).length} changed`,
                          touched.length && `${touched.length} artifact${touched.length > 1 ? "s" : ""} updated`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <ul className="space-y-1.5">
                        {fresh.map((d) => (
                          <li key={d.id}>
                            <button onClick={() => onDecision(d.id)} className="flex w-full items-start gap-1.5 text-left text-xs hover:underline">
                              <StatusIcon status={d.status} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                              <span>{d.title}{d.was && <span className="text-muted-foreground"> (was: {d.was})</span>}</span>
                            </button>
                          </li>
                        ))}
                        {touched.map((a) => (
                          <li key={a.id}>
                            <button onClick={() => onArtifact(a.id)} className="flex w-full items-start gap-1.5 text-left text-xs text-muted-foreground hover:underline">
                              <ArtifactIcon artifact={a} />
                              <span>{a.name} updated {a.updated}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nothing new. {PART_SUMMARY[p.name]}</p>
                  )}
                </div>
              </BoardSection>

              <BoardSection title="Open decisions" count={open.length}>
                {open.length ? open.map((d) => <Card key={d.id} d={d} onClick={() => onDecision(d.id)} />) : <p className="px-1 text-xs text-muted-foreground">Nothing open.</p>}
              </BoardSection>

              <BoardSection title="Artifacts" count={arts.length}>
                <div className="space-y-1.5">{arts.map((a) => <ArtifactThumb key={a.id} artifact={a} onOpen={() => onArtifact(a.id)} compact />)}</div>
              </BoardSection>

              <BoardSection title="Decision tree" count={ds.length}>
                <div className="relative space-y-2 pl-4">
                  <div className="absolute top-2 bottom-2 left-1.5 w-px bg-foreground/20" />
                  {byTime.map((d) => (
                    <div key={d.id} className="relative">
                      <span className="absolute top-4 -left-[13px] size-2 rounded-full bg-foreground/40" />
                      <Card d={d} onClick={() => onDecision(d.id)} />
                    </div>
                  ))}
                </div>
              </BoardSection>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- 3. Artifact hubs ----------

const SLOTS = [
  { left: "0%", top: "6%" },
  { right: "0%", top: "6%" },
  { left: "0%", bottom: "6%" },
  { right: "0%", bottom: "6%" },
  { left: "50%", top: "0%", transform: "translateX(-50%)" },
  { left: "50%", bottom: "0%", transform: "translateX(-50%)" },
]

export function HubsView({ m, onDecision, onArtifact }: ViewProps) {
  const quiet = m.artifacts.filter((a) => !m.decisionsOf(a).length)
  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-sm text-muted-foreground">The work is the center. Each artifact sits with the decisions that shaped it around it. Click the artifact for its focus view.</p>
      <div className="min-h-0 flex-1 space-y-6 overflow-auto pb-4">
        {m.parts.map((p) => {
          const arts = m.artifacts.filter((a) => a.part === p.name && m.decisionsOf(a).length)
          if (!arts.length) return null
          return (
            <section key={p.name} className="space-y-2">
              <h3 className="text-sm font-medium">{p.name}</h3>
              <div className="flex flex-wrap gap-4">
                {arts.map((a) => {
                  const ds = m.decisionsOf(a).slice(0, SLOTS.length)
                  return (
                    <div key={a.id} className="relative h-64 w-[460px] rounded-xl border bg-muted/30">
                      <svg className="absolute inset-0 size-full">
                        {ds.map((d, i) => {
                          const s = SLOTS[i]
                          const x2 = "left" in s ? (s.left === "50%" ? "50%" : "22%") : "78%"
                          const y2 = "top" in s ? (s.top === "0%" ? "10%" : "16%") : s.bottom === "0%" ? "90%" : "84%"
                          return <line key={d.id} x1="50%" y1="50%" x2={x2} y2={y2} className="stroke-foreground/20" strokeDasharray={isAI(d) ? "3 3" : undefined} />
                        })}
                      </svg>
                      <button onClick={() => onArtifact(a.id)} className="absolute top-1/2 left-1/2 flex h-28 w-48 -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border-2 border-foreground/60 bg-background shadow-sm transition hover:shadow-md">
                        <div className="min-h-0 flex-1 bg-muted/50"><ArtifactPicture artifact={a} /></div>
                        <div className="truncate border-t px-2 py-1 text-left text-[11px] font-medium">{a.name}</div>
                      </button>
                      {ds.map((d, i) => (
                        <div key={d.id} className="absolute m-2" style={SLOTS[i]}>
                          <Pill d={d} onClick={() => onDecision(d.id)} className="max-w-[170px]" />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
        {quiet.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">No decisions tied to these yet</h3>
            <div className="flex flex-wrap gap-2">
              {quiet.map((a) => <div key={a.id} className="w-56"><ArtifactThumb artifact={a} compact onOpen={() => onArtifact(a.id)} /></div>)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
