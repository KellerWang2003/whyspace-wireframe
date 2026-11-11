import { StatusIcon } from "@/components/app/status-badge"
import { DECISIONS, LINKS, PEOPLE, decisionById, type Decision } from "@/data"
import { navigate } from "@/lib/router"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { dayOf } from "@/playground/model"
import { ThreadIcon } from "./thread-ui"
import { threadOf, useThreads, type Thread } from "./threads"

// Decisions as a map: a vertical lane per thread, earlier decisions on top, lines for "builds on".
// A decision always sits below what it builds on, so chains read top to bottom across threads.
// On Home: a lane for each thread that has decisions. On a thread page: its own lane plus the
// lanes its links reach, with the other threads' decisions faded.

const LANE_W = 240
const NODE_W = 216
const NODE_H = 68
const ROW_GAP = 28
const HEAD_H = 40
const PAD = 12

type Kind = "main" | "linked" | "ghost"
type Item = { d: Decision; kind: Kind }
const dateOf = (d: Decision) => dayOf(d.when) ?? dayOf(d.due) ?? Infinity
const firstName = (d: Decision) => (d.by ?? PEOPLE[d.owner]?.name ?? "").split(" ")[0]

export function DecisionMap({ projectId, decisions, thread, onOpen }: { projectId: string; decisions: Decision[]; thread?: Thread; onOpen: (d: Decision) => void }) {
  const threads = useThreads(projectId)
  const statusOf = useStatusOf()

  const ids = new Set(decisions.map((d) => d.id))
  const items: Item[] = decisions.map((d) => ({ d, kind: "main" }))
  // On a thread page: what it builds on, and what builds on it, in other threads.
  if (thread) {
    const other = LINKS.filter(([a, b]) => ids.has(a) !== ids.has(b)).map(([a, b]) => (ids.has(a) ? b : a))
    for (const d of DECISIONS) if (d.project === projectId && other.includes(d.id) && !ids.has(d.id)) items.push({ d, kind: "linked" })
  }
  // What a decision replaced, dashed, above it.
  for (const { d } of [...items]) {
    const was = d.replaces ? decisionById(d.replaces) : undefined
    if (was && !items.some((i) => i.d.id === was.id)) items.push({ d: was, kind: "ghost" })
  }

  if (!decisions.length) return <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">No decisions yet.</div>

  const has = (id?: string) => !!id && items.some((i) => i.d.id === id)
  const byId = (id: string) => items.find((i) => i.d.id === id)!
  const before = (id: string) => [...LINKS.filter(([a, b]) => b === id && has(a)).map(([a]) => a), ...(has(byId(id).d.replaces) ? [byId(id).d.replaces!] : [])]

  // Lanes in sidebar order, only for threads with something to show.
  const used = new Set(items.map((i) => i.d.part))
  const lanes = threads.filter((t) => used.has(t.part) || t.part === thread?.part).map((t) => t.part)
  for (const part of used) if (!lanes.includes(part)) lanes.push(part)

  // Rows: by date, pushed below anything the decision builds on, one decision per lane and row.
  const dates = [...new Set(items.map((i) => dateOf(i.d)))].sort((a, b) => a - b)
  const rowOf = new Map<string, number>()
  const taken = new Set<string>()
  const place = (i: Item): number => {
    const known = rowOf.get(i.d.id)
    if (known !== undefined) return known
    let row = dates.indexOf(dateOf(i.d))
    for (const id of before(i.d.id)) row = Math.max(row, place(byId(id)) + 1)
    while (taken.has(`${i.d.part}|${row}`)) row++
    taken.add(`${i.d.part}|${row}`)
    rowOf.set(i.d.id, row)
    return row
  }
  ;[...items].sort((a, b) => dateOf(a.d) - dateOf(b.d)).forEach(place)
  const rows = Math.max(...rowOf.values()) + 1

  const width = lanes.length * LANE_W + PAD * 2
  const height = HEAD_H + PAD * 2 + rows * NODE_H + (rows - 1) * ROW_GAP
  const pos = (d: Decision) => ({
    x: PAD + lanes.indexOf(d.part) * LANE_W + (LANE_W - NODE_W) / 2,
    y: HEAD_H + PAD + (rowOf.get(d.id) ?? 0) * (NODE_H + ROW_GAP),
  })
  const edges = [
    ...LINKS.filter(([a, b]) => has(a) && has(b)).map(([a, b]) => ({ a, b, dashed: false })),
    ...items.filter((i) => has(i.d.replaces)).map((i) => ({ a: i.d.replaces!, b: i.d.id, dashed: true })),
  ]
  const path = (a: Decision, b: Decision) => {
    const p = pos(a), q = pos(b)
    const x1 = p.x + NODE_W / 2, y1 = p.y + NODE_H, x2 = q.x + NODE_W / 2, y2 = q.y
    const dy = Math.max(16, (y2 - y1) / 2)
    return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="relative" style={{ width, height }}>
        {lanes.map((part, i) => {
          const t = threadOf(projectId, part)
          const own = thread?.part === part
          return (
            <div key={part} className={cn("absolute top-0 bottom-0", i > 0 && "border-l")} style={{ left: PAD + i * LANE_W, width: LANE_W }}>
              <button
                disabled={own}
                onClick={() => navigate(`/p/${projectId}/t/${t.id}`)}
                className={cn("flex w-full items-center gap-1.5 px-3 text-left text-xs", own ? "font-medium" : "text-muted-foreground enabled:hover:text-foreground enabled:hover:underline")}
                style={{ height: HEAD_H }}
              >
                <ThreadIcon thread={t} className="size-3" />
                <span className="truncate">{t.name}</span>
              </button>
            </div>
          )
        })}
        <svg className="pointer-events-none absolute inset-0 text-muted-foreground/50" width={width} height={height} aria-hidden>
          <defs>
            <marker id="b-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
            </marker>
          </defs>
          {edges.map((e) => (
            <path key={`${e.a}-${e.b}`} d={path(byId(e.a).d, byId(e.b).d)} fill="none" stroke="currentColor" strokeWidth={1.25} strokeDasharray={e.dashed ? "4 4" : undefined} markerEnd="url(#b-map-arrow)" />
          ))}
        </svg>
        {items.map(({ d, kind }) => {
          const p = pos(d)
          const status = kind === "ghost" ? d.status : statusOf(d)
          return (
            <button
              key={d.id}
              onClick={() => onOpen(d)}
              title={d.title}
              className={cn(
                "absolute flex flex-col justify-between gap-1 rounded-lg border bg-background px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
                kind === "linked" && "opacity-60 hover:opacity-100",
                kind === "ghost" && "border-dashed text-muted-foreground",
              )}
              style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
            >
              <span className="flex items-start gap-2">
                <StatusIcon status={status} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className={cn("line-clamp-2 leading-snug", kind === "main" && "font-medium", kind === "ghost" && "line-through")}>{d.title}</span>
              </span>
              <span className="truncate pl-5.5 text-[11px] text-muted-foreground">{kind === "ghost" ? "Replaced" : `${d.when ?? "Open"} · ${firstName(d)}`}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
