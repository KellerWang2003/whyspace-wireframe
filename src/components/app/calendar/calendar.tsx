import { useLayoutEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Layers, Pencil, Radio, Repeat, Shapes, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PersonAvatar } from "@/components/app/person"
import { ProjectLabel, ProjectMark } from "@/components/app/project-mark"
import { ScheduleMeetingDialog, type MeetingDraft } from "@/components/app/schedule-meeting"
import { StatusIcon } from "@/components/app/status-badge"
import { DECISIONS, PEOPLE, PROJECTS, WORKSHOPS, partsOf, type Decision, type Project } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { nowMinutes } from "@/lib/scenario"
import { useStatusOf } from "@/lib/work"
import { dayOf } from "@/playground/model"
import {
  DAY_MS,
  addDays,
  dateOfDay,
  fmtDay,
  fmtRange,
  fmtTime,
  meetingPath,
  minutesOf,
  overlapsOf,
  removeEvent,
  restoreEvent,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  updateEvent,
  useEvents,
  type CalEvent,
} from "./events"

// A normal calendar: Day, Week and Month, Today and arrows. Drag a meeting to move it, drag its
// bottom edge to change the length, click or drag on an empty slot to schedule one, click a
// meeting for details, edit and delete. In a project, other projects' meetings show dashed so
// clashes are visible; without a project it shows every project (Inbox).

type View = "day" | "week" | "month"
const HOUR = 44 // px per hour in Day and Week
const SNAP = 15 // minutes
const MIN = 60_000
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const snap = (m: number) => Math.round(m / SNAP) * SNAP

type Ctx = {
  project?: string
  today: number
  all: CalEvent[]
  showMark: boolean
  isOther: (e: CalEvent) => boolean
  decisions: Decision[]
  open: (e: CalEvent, el: Element) => void
  create: (start: number, end: number) => void
  commit: (e: CalEvent, start: number, end: number) => void
  goDay: (day: number) => void
  canCreate: () => boolean
  closePopover: () => void
}

export function ProjectCalendar({ project, today }: { project: Project; today: number }) {
  const decisions = DECISIONS.filter((d) => d.project === project.id && d.when)
  return <Calendar project={project.id} today={today} decisions={decisions} />
}

export function Calendar({ project, today: todayDay, decisions = [], title = null }: { project?: string; today: number; decisions?: Decision[]; title?: string | null }) {
  const all = useEvents()
  const today = dateOfDay(todayDay)
  const rootRef = useRef<HTMLElement>(null)
  const [view, setView] = useState<View>("week")
  const [cursor, setCursor] = useState(today)
  const [others, setOthers] = useState(true)
  const [detail, setDetail] = useState<{ id: string; box: { left: number; top: number; width: number; height: number } } | null>(null)
  const [draft, setDraft] = useState<MeetingDraft | null>(null)
  const closedAt = useRef(0)

  const isOther = (e: CalEvent) => !!project && e.project !== project
  const shown = all.filter((e) => !project || others || e.project === project)
  const current = detail && all.find((e) => e.id === detail.id)

  const closePopover = () => {
    if (detail) closedAt.current = Date.now()
    setDetail(null)
  }
  const ctx: Ctx = {
    project,
    today,
    all,
    showMark: !project,
    isOther,
    decisions,
    open: (e, el) => {
      const r = el.getBoundingClientRect()
      const root = rootRef.current!.getBoundingClientRect()
      setDetail({ id: e.id, box: { left: r.left - root.left, top: r.top - root.top, width: r.width, height: r.height } })
    },
    create: (start, end) => setDraft({ start, end, project }),
    commit: (e, start, end) => {
      if (start === e.start && end === e.end) return
      updateEvent(e.id, { start, end })
      const what = end - start !== e.end - e.start && start === e.start ? `${e.title} now ends ${fmtTime(end)}` : `${e.title} moved to ${fmtDay(start)}, ${fmtTime(start)}`
      toast(what, { action: { label: "Undo", onClick: () => updateEvent(e.id, { start: e.start, end: e.end }) } })
    },
    goDay: (day) => { setCursor(day); setView("day") },
    canCreate: () => !detail && Date.now() - closedAt.current > 300,
    closePopover,
  }

  const step = (dir: number) => {
    closePopover()
    setCursor((c) => {
      if (view === "month") {
        const d = new Date(c)
        return new Date(d.getFullYear(), d.getMonth() + dir, 1).getTime()
      }
      return addDays(c, dir * (view === "week" ? 7 : 1))
    })
  }

  const days = view === "day" ? [startOfDay(cursor)] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
  const label =
    view === "month"
      ? fmtDay(cursor, { month: "long", year: "numeric" })
      : view === "day"
        ? fmtDay(cursor, { weekday: "long", month: "short", day: "numeric" })
        : weekLabel(days[0], days[6])

  const remove = (e: CalEvent) => {
    removeEvent(e.id)
    closePopover()
    toast("Meeting deleted", { action: { label: "Undo", onClick: () => restoreEvent(e) } })
  }

  return (
    <section ref={rootRef} aria-label="Calendar" className="relative space-y-3">
      <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-2">
        {title && <h2 className="mr-2 text-sm font-medium">{title}</h2>}
        <Button variant="outline" size="sm" onClick={() => { closePopover(); setCursor(today) }}>Today</Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" aria-label="Previous" onClick={() => step(-1)}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next" onClick={() => step(1)}><ChevronRight /></Button>
        </div>
        <span className="text-sm tabular-nums">{label}</span>
        <div className="ml-auto flex items-center gap-2">
          {project && (
            <Toggle variant="outline" size="sm" pressed={others} onPressedChange={setOthers} className="px-2.5">
              <Layers />Other projects
            </Toggle>
          )}
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => { if (v) { closePopover(); setView(v as View) } }} aria-label="Calendar view">
            <ToggleGroupItem value="day" className="px-3">Day</ToggleGroupItem>
            <ToggleGroupItem value="week" className="px-3">Week</ToggleGroupItem>
            <ToggleGroupItem value="month" className="px-3">Month</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {view === "month" ? <MonthGrid ctx={ctx} cursor={cursor} events={shown} /> : <TimeGrid ctx={ctx} days={days} events={shown} />}

      <Popover open={!!current} onOpenChange={(o) => !o && closePopover()}>
        <PopoverAnchor asChild>
          <div aria-hidden className="pointer-events-none absolute" style={detail?.box ?? { left: 0, top: 0 }} />
        </PopoverAnchor>
        <PopoverContent side="right" align="start" collisionPadding={12} className="w-72 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          {current && (
            <EventDetail
              e={current}
              all={all}
              onEdit={() => { closePopover(); setDraft({ ...current }) }}
              onDelete={() => remove(current)}
            />
          )}
        </PopoverContent>
      </Popover>

      <ScheduleMeetingDialog project={draft?.id ? draft.project : project} open={!!draft} onOpenChange={(o) => !o && setDraft(null)} draft={draft ?? undefined} />
    </section>
  )
}

function weekLabel(a: number, b: number) {
  const da = new Date(a)
  const db = new Date(b)
  const left = fmtDay(a, { month: "short", day: "numeric" })
  return da.getMonth() === db.getMonth() ? `${left} – ${db.getDate()}` : `${left} – ${fmtDay(b, { month: "short", day: "numeric" })}`
}

// Shared look for a meeting: this project filled, other projects dashed, past ones quiet.
function tone(e: CalEvent, other: boolean) {
  if (other) return "border border-dashed border-foreground/25 bg-background text-muted-foreground hover:bg-muted/50"
  if (e.status === "Ended") return "bg-muted/70 text-muted-foreground hover:bg-muted"
  return "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.11]"
}

/* ---------------- Day and Week ---------------- */

type Drag =
  | { kind: "create"; col: number; a: number; b: number; moved: boolean }
  | { kind: "move" | "resize"; id: string; start: number; end: number; moved: boolean }

function TimeGrid({ ctx, days, events }: { ctx: Ctx; days: number[]; events: CalEvent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const week = days.length > 1

  // Open on the working day: 8:00, or earlier if something starts before then.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const earliest = Math.min(8 * 60, ...events.filter((e) => days.some((d) => sameDay(d, e.start))).map((e) => minutesOf(e.start)))
    el.scrollTop = (earliest / 60) * HOUR - 8
    // Only when the range changes, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0], days.length])

  const pointAt = (x: number, y: number) => {
    const r = colsRef.current!.getBoundingClientRect()
    const col = clamp(Math.floor((x - r.left) / (r.width / days.length)), 0, days.length - 1)
    const raw = clamp(((y - r.top) / HOUR) * 60, 0, 24 * 60)
    return { col, raw }
  }

  const begin = (ev: React.PointerEvent, first: Drag, update: (d: Drag, p: { col: number; raw: number }) => Drag, end: (d: Drag) => void) => {
    if (ev.button !== 0) return
    ev.preventDefault()
    ev.stopPropagation()
    const x0 = ev.clientX
    const y0 = ev.clientY
    let d = first
    const move = (m: PointerEvent) => {
      if (!d.moved && Math.hypot(m.clientX - x0, m.clientY - y0) < 4) return
      d = { ...update(d, pointAt(m.clientX, m.clientY)), moved: true }
      setDrag(d)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      setDrag(null)
      end(d)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  // Click an empty slot for an hour there; drag to pick the length.
  const onEmpty = (ev: React.PointerEvent) => {
    if (!ctx.canCreate()) return
    const p = pointAt(ev.clientX, ev.clientY)
    const a = Math.floor(p.raw / SNAP) * SNAP
    begin(ev, { kind: "create", col: p.col, a, b: a + SNAP, moved: false }, (d, q) => (d.kind === "create" ? { ...d, b: snap(q.raw) } : d), (d) => {
      if (d.kind !== "create") return
      const day = days[d.col]
      if (!d.moved) {
        const s = Math.floor(a / 30) * 30
        return ctx.create(day + s * MIN, day + Math.min(s + 60, 24 * 60) * MIN)
      }
      const lo = Math.min(d.a, d.b)
      const hi = Math.max(Math.max(d.a, d.b), lo + SNAP)
      ctx.create(day + lo * MIN, day + hi * MIN)
    })
  }

  // Drag the body to move (across days in Week), the bottom edge to resize. A click opens details.
  const onEvent = (ev: React.PointerEvent, e: CalEvent, kind: "move" | "resize") => {
    const el = (ev.currentTarget as HTMLElement).closest("[data-event]")!
    const locked = e.status === "Ended"
    const p0 = pointAt(ev.clientX, ev.clientY)
    const length = e.end - e.start
    const grab = minutesOf(e.start) - p0.raw
    begin(ev, { kind, id: e.id, start: e.start, end: e.end, moved: false }, (d, p) => {
      if (locked || d.kind === "create") return d
      if (kind === "resize") {
        const endMin = clamp(snap(p.raw), minutesOf(e.start) + SNAP, 24 * 60)
        return { ...d, end: startOfDay(e.start) + endMin * MIN }
      }
      const startMin = clamp(snap(p.raw + grab), 0, 24 * 60 - length / MIN)
      const day = week ? days[p.col] : startOfDay(e.start)
      return { ...d, start: day + startMin * MIN, end: day + startMin * MIN + length }
    }, (d) => {
      if (d.kind === "create") return
      if (!d.moved || locked) return ctx.open(e, el)
      ctx.commit(e, d.start, d.end)
    })
  }

  const ghost = drag && drag.kind !== "create" && drag.moved ? drag : null
  const dragged = ghost ? events.find((e) => e.id === ghost.id) : undefined
  const nowMin = nowMinutes()
  const dayDecisions = (day: number) => ctx.decisions.filter((d) => dayOf(d.when) !== undefined && sameDay(dateOfDay(dayOf(d.when)!), day))
  const hasDecisions = days.some((d) => dayDecisions(d).length > 0)

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className={cn("rounded-lg border", week && "min-w-[620px]")}>
        {/* Day headers, then decisions made that day */}
        <div className="flex border-b">
          <div className="w-11 shrink-0" />
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((day) => {
              const isToday = sameDay(day, ctx.today)
              return (
                <div key={day} className="flex flex-col gap-1 border-l px-1.5 py-1.5 first:border-l-0">
                  <button
                    onClick={() => week && ctx.goDay(day)}
                    className={cn("flex w-fit items-center gap-1.5 rounded-md px-1 text-xs text-muted-foreground", week && "hover:bg-muted")}
                  >
                    {fmtDay(day, { weekday: "short" })}
                    <span className={cn("rounded px-1 tabular-nums", isToday && "bg-foreground font-medium text-background")}>{new Date(day).getDate()}</span>
                  </button>
                  {hasDecisions && <DecisionMarks decisions={dayDecisions(day)} />}
                </div>
              )
            })}
          </div>
        </div>

        <div ref={scrollRef} onScroll={ctx.closePopover} className="relative max-h-[28rem] overflow-y-auto">
          <div className="flex" style={{ height: 24 * HOUR }}>
            <div className="relative w-11 shrink-0 select-none">
              {Array.from({ length: 23 }, (_, i) => (
                <span key={i} className="absolute right-2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums" style={{ top: (i + 1) * HOUR }}>{i + 1}:00</span>
              ))}
            </div>
            <div ref={colsRef} className="relative grid flex-1 select-none" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {/* hour lines */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {Array.from({ length: 23 }, (_, i) => <div key={i} className="absolute inset-x-0 border-t border-border/70" style={{ top: (i + 1) * HOUR }} />)}
              </div>
              {days.map((day, col) => {
                const mine = layout(events.filter((e) => sameDay(e.start, day)))
                const creating = drag?.kind === "create" && drag.col === col ? drag : null
                return (
                  <div key={day} onPointerDown={onEmpty} className="relative border-l first:border-l-0" style={{ cursor: "cell" }}>
                    {mine.map(({ e, lane, lanes }) => (
                      <EventBlock
                        key={e.id}
                        e={e}
                        ctx={ctx}
                        style={{ top: (minutesOf(e.start) / 60) * HOUR, height: blockHeight(e), left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
                        faded={dragged?.id === e.id}
                        onPointerDown={(ev, kind) => onEvent(ev, e, kind)}
                      />
                    ))}
                    {ghost && dragged && sameDay(ghost.start, day) && (
                      <EventBlock
                        e={{ ...dragged, start: ghost.start, end: ghost.end }}
                        ctx={ctx}
                        ghost
                        style={{ top: (minutesOf(ghost.start) / 60) * HOUR, height: blockHeight({ start: ghost.start, end: ghost.end }), left: 2, right: 2 }}
                      />
                    )}
                    {creating && creating.moved && (
                      <div
                        className="pointer-events-none absolute inset-x-0.5 z-20 rounded-md border border-foreground/30 bg-foreground/10 px-1.5 py-1 text-[11px] tabular-nums"
                        style={{ top: (Math.min(creating.a, creating.b) / 60) * HOUR, height: Math.max(Math.abs(creating.b - creating.a), SNAP) / 60 * HOUR }}
                      >
                        {fmtTime(day + Math.min(creating.a, creating.b) * MIN)}–{fmtTime(day + Math.max(creating.a, creating.b, Math.min(creating.a, creating.b) + SNAP) * MIN)}
                      </div>
                    )}
                    {sameDay(day, ctx.today) && (
                      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: (nowMin / 60) * HOUR }}>
                        <span className="-ml-1 size-2 rounded-full bg-foreground" />
                        <span className="h-px flex-1 bg-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const blockHeight = (e: { start: number; end: number }) => Math.max(((e.end - e.start) / 3_600_000) * HOUR - 2, 16)

function EventBlock({ e, ctx, style, faded, ghost, onPointerDown }: { e: CalEvent; ctx: Ctx; style: React.CSSProperties; faded?: boolean; ghost?: boolean; onPointerDown?: (ev: React.PointerEvent, kind: "move" | "resize") => void }) {
  const other = ctx.isOther(e)
  const tall = (e.end - e.start) / MIN >= 45
  const locked = e.status === "Ended"
  return (
    <div
      data-event
      role="button"
      tabIndex={0}
      aria-label={`${e.title}, ${fmtDay(e.start)} ${fmtRange(e)}`}
      onPointerDown={onPointerDown && ((ev) => onPointerDown(ev, "move"))}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ctx.open(e, ev.currentTarget) } }}
      className={cn(
        "group/event @container absolute overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-snug transition-colors",
        tone(e, other),
        !other && e.status !== "Ended" && "border-l-2 border-l-foreground/60",
        locked ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        faded && "opacity-40",
        ghost && "pointer-events-none z-30 shadow-sm ring-1 ring-foreground/20",
      )}
      style={style}
    >
      <div className={cn("flex min-w-0 gap-1", tall ? "flex-col gap-0" : "items-baseline justify-between")}>
        <span className="flex min-w-0 items-center gap-1 font-medium">
          {(ctx.showMark || other) && <ProjectMark project={e.project} className="size-3" />}
          {e.status === "Live" && <Radio className="size-3 shrink-0" />}
          <span className="truncate">{e.title}</span>
        </span>
        <span className={cn("shrink-0 truncate text-muted-foreground tabular-nums", !tall && "hidden @[9rem]:inline")}>{fmtRange(e)}</span>
      </div>
      {onPointerDown && !locked && (
        <div
          aria-hidden
          onPointerDown={(ev) => onPointerDown(ev, "resize")}
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover/event:opacity-100"
        >
          <span className="mx-auto mt-0.5 block h-0.5 w-5 rounded-full bg-foreground/40" />
        </div>
      )}
    </div>
  )
}

// Side by side when times overlap: each cluster of overlapping meetings shares the column width.
function layout(evs: CalEvent[]) {
  const sorted = [...evs].sort((a, b) => a.start - b.start || b.end - a.end)
  const out: { e: CalEvent; lane: number; lanes: number }[] = []
  let cluster: typeof out = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity
  const flush = () => {
    cluster.forEach((c) => (c.lanes = laneEnds.length))
    out.push(...cluster)
    cluster = []
    laneEnds = []
  }
  for (const e of sorted) {
    if (e.start >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    let lane = laneEnds.findIndex((end) => end <= e.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(e.end)
    } else laneEnds[lane] = e.end
    cluster.push({ e, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, e.end)
  }
  flush()
  return out
}

// Decisions made that day, as state icons; grouped by thread when there are many.
function DecisionMarks({ decisions }: { decisions: Decision[] }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  if (!decisions.length) return <div className="h-4" />
  if (decisions.length > 4)
    return (
      <div className="flex flex-wrap gap-0.5">
        {partsOf(decisions).map((p) => <span key={p.name} className="rounded bg-muted px-1 text-[10px]">{p.name} {decisions.filter((d) => d.part === p.name).length}</span>)}
      </div>
    )
  return (
    <div className="flex flex-wrap gap-0.5">
      {decisions.map((d) => (
        <button key={d.id} title={d.title} aria-label={d.title} onClick={(ev) => { ev.stopPropagation(); openDecision(d.id) }} className="rounded p-0.5 hover:bg-muted">
          <StatusIcon status={statusOf(d)} className="size-3.5 text-foreground/70" />
        </button>
      ))}
    </div>
  )
}

/* ---------------- Month ---------------- */

const MAX_IN_CELL = 3

function MonthGrid({ ctx, cursor, events }: { ctx: Ctx; cursor: number; events: CalEvent[] }) {
  const first = startOfMonth(cursor)
  const month = new Date(first).getMonth()
  const gridStart = startOfWeek(first)
  const daysInMonth = new Date(new Date(first).getFullYear(), month + 1, 0).getDate()
  const weeks = Math.ceil(((first - gridStart) / DAY_MS + daysInMonth) / 7)
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i))
  const [over, setOver] = useState<number | null>(null)

  const moveTo = (id: string, day: number) => {
    const e = ctx.all.find((x) => x.id === id)
    if (!e || e.status === "Ended" || sameDay(e.start, day)) return
    const start = day + minutesOf(e.start) * MIN
    ctx.commit(e, start, start + (e.end - e.start))
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="min-w-[620px] overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 border-b">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => <div key={w} className="px-2 py-1.5 text-xs text-muted-foreground">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const items = events.filter((e) => sameDay(e.start, day)).sort((a, b) => a.start - b.start)
            const decisions = ctx.decisions.filter((d) => dayOf(d.when) !== undefined && sameDay(dateOfDay(dayOf(d.when)!), day))
            const inMonth = new Date(day).getMonth() === month
            const isToday = sameDay(day, ctx.today)
            const fits = items.length > MAX_IN_CELL ? MAX_IN_CELL - 1 : MAX_IN_CELL
            return (
              <div
                key={day}
                onClick={(ev) => {
                  if ((ev.target as HTMLElement).closest("button, [data-event]") || !ctx.canCreate()) return
                  ctx.create(day + 10 * 60 * MIN, day + 11 * 60 * MIN)
                }}
                onDragOver={(ev) => { ev.preventDefault(); setOver(day) }}
                onDragLeave={() => setOver((o) => (o === day ? null : o))}
                onDrop={(ev) => { ev.preventDefault(); setOver(null); moveTo(ev.dataTransfer.getData("text/plain"), day) }}
                className={cn(
                  "flex min-h-24 cursor-cell flex-col gap-0.5 border-b border-l p-1 transition-colors",
                  i % 7 === 0 && "border-l-0",
                  i >= days.length - 7 && "border-b-0",
                  !inMonth && "bg-muted/30",
                  over === day && "bg-muted",
                )}
              >
                <button
                  onClick={() => ctx.goDay(day)}
                  className={cn("w-fit rounded px-1 text-[11px] tabular-nums hover:bg-muted", inMonth ? "text-foreground" : "text-muted-foreground", isToday && "bg-foreground font-medium text-background hover:bg-foreground/80")}
                >
                  {new Date(day).getDate() === 1 ? fmtDay(day, { month: "short", day: "numeric" }) : new Date(day).getDate()}
                </button>
                {items.slice(0, fits).map((e) => <MonthChip key={e.id} e={e} ctx={ctx} />)}
                {items.length > fits && <MoreInDay day={day} items={items} hidden={items.length - fits} ctx={ctx} />}
                {decisions.length > 0 && <div className="mt-auto"><DecisionMarks decisions={decisions} /></div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MonthChip({ e, ctx, onPick }: { e: CalEvent; ctx: Ctx; onPick?: () => void }) {
  const other = ctx.isOther(e)
  return (
    <button
      data-event
      draggable={e.status !== "Ended"}
      onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", e.id); ev.dataTransfer.effectAllowed = "move" }}
      onClick={(ev) => { ev.stopPropagation(); onPick?.(); ctx.open(e, ev.currentTarget) }}
      title={`${e.title} · ${fmtRange(e)}`}
      className={cn("flex w-full min-w-0 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] leading-tight", tone(e, other))}
    >
      {(ctx.showMark || other) && <ProjectMark project={e.project} className="size-3" />}
      {e.status === "Live" && <Radio className="size-3 shrink-0" />}
      <span className="shrink-0 text-muted-foreground tabular-nums">{fmtTime(e.start)}</span>
      <span className="truncate">{e.title}</span>
    </button>
  )
}

// "+N more" lists the whole day in a popover; pick one for its details.
function MoreInDay({ day, items, hidden, ctx }: { day: number; items: CalEvent[]; hidden: number; ctx: Ctx }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button onClick={(ev) => ev.stopPropagation()} className="w-fit rounded px-1 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">+{hidden} more</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 space-y-1 p-2">
        <p className="px-1 pb-1 text-xs text-muted-foreground">{fmtDay(day, { weekday: "long", month: "short", day: "numeric" })}</p>
        {items.map((e) => <MonthChip key={e.id} e={e} ctx={ctx} onPick={() => setOpen(false)} />)}
      </PopoverContent>
    </Popover>
  )
}

/* ---------------- Details ---------------- */

function EventDetail({ e, all, onEdit, onDelete }: { e: CalEvent; all: CalEvent[]; onEdit: () => void; onDelete: () => void }) {
  const workshop = WORKSHOPS.find((w) => w.id === e.workshop)
  const clashes = e.status === "Ended" ? [] : overlapsOf(e, all)
  const editable = e.status !== "Ended"
  const canOpen = e.status !== "Ended" || !!e.session
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex items-center gap-1.5 font-medium leading-snug">{e.status === "Live" && <Radio className="size-3.5 shrink-0" />}{e.title}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{fmtDay(e.start)} · {fmtRange(e)}</p>
        </div>
        {editable && (
          <>
            <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={onEdit}><Pencil /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="Delete" onClick={onDelete}><Trash2 /></Button>
          </>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <ProjectLabel project={e.project} />
        {workshop && <p className="flex items-center gap-1.5 text-muted-foreground"><Shapes className="size-3.5" />{workshop.title}</p>}
        {e.repeats && <p className="flex items-center gap-1.5 text-muted-foreground"><Repeat className="size-3.5" />{e.repeats}</p>}
        {clashes.length > 0 && (
          <p className="flex items-start gap-1.5">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            <span>Overlaps {clashes.map((c) => `${c.title}${c.project !== e.project ? ` (${PROJECTS.find((p) => p.id === c.project)?.name})` : ""}`).join(", ")}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {e.people.map((id) => <span key={id} title={PEOPLE[id]?.name}><PersonAvatar id={id} className="size-6 ring-2 ring-popover" /></span>)}
        </div>
        {canOpen && (
          <Button size="sm" variant={e.status === "Ended" ? "outline" : "default"} className="ml-auto" onClick={() => navigate(meetingPath(e))}>
            {e.status === "Ended" ? "Open" : "Join"}
          </Button>
        )}
      </div>
    </div>
  )
}
