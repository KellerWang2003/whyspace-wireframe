import { DECISIONS, INBOX, ME, MY_PROJECTS, PEOPLE, PROJECTS, RECORDED, TASKS, WEEK_SUMMARY, decisionById, needsYou, type Decision, type InboxItem, type Project, type Task } from "@/data"
import { markOf } from "@/lib/marks"
import { PINS } from "@/lib/scenario"
import { STAGE, STAGES } from "@/lib/stage"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { TODAY, dayOf } from "@/playground/model"
import { PRESET } from "@/scenarios/data"
import type { DuetLine, Sure } from "./duet"
import { useDuetActivity, useDuetState } from "./duet-state"
import { useAllTasks } from "./work"

// Today's three lists, from the same rules the rest of the app uses. Needs you is one queue across
// every project: the decisions waiting on you, questions teammates asked your Duet, invitations, and
// the work due now. Clashes come first, then whoever is waiting. The rail badge is its length.

export type Row =
  // waiting: teammates' questions this guess of yours answers. Confirming it answers them too, so they wait here instead of in rows of their own.
  | { kind: "decide"; id: string; project: string; decision: Decision; ask: "confirm" | "review" | "answer" | "clash"; item?: InboxItem; waiting?: DuetLine[] }
  | { kind: "asked"; id: string; project: string; line: DuetLine }
  | { kind: "invite"; id: string; project: string; item: InboxItem }
  | { kind: "do"; id: string; project: string; task: Task; item?: InboxItem }

export type Day = "today" | "yesterday" | "earlier"
// `sure`: how sure your Duet was, on what it did for you.
export type Line = { id: string; day: Day; when: string; who?: string; agent?: boolean; text: string; decision?: string; item?: InboxItem; task?: Task; sure?: Sure }

export const projectIdOf = (nameOrId: string) => PROJECTS.find((p) => p.id === nameOrId || p.name === nameOrId)?.id ?? nameOrId
// Due dates on the calendar's day scale: "Fri Oct 30" is 30, "Mon Nov 2" is 33. No date sorts last.
export const dueDay = (t: Task) => { const n = Number(t.due.match(/\d+/)?.[0]); return Number.isNaN(n) ? 999 : n + (t.due.includes("Nov") ? 31 : 0) }
// Inbox times are relative: minutes and hours are today, "1d" is yesterday, older is earlier.
export const dayOfTime = (time: string): Day => (/[mh]$/.test(time) ? "today" : time === "1d" ? "yesterday" : "earlier")
const dayOfWhen = (when?: string): Day => (when === "Today" ? "today" : when === "Yesterday" ? "yesterday" : "earlier")

// The day Today stands on: a test scenario's own day, otherwise the Whiskr week at its stage.
export const todayDay = () => (PINS ? TODAY : MY_PROJECTS.some((p) => p.id === "whiskr") ? dayOf(STAGES[STAGE - 1].date) ?? TODAY : TODAY)

// A test scenario about one task keeps Today to that task, plus what its flow adds: decisions its
// tools record and tasks made while it runs.
export const onToday = (id: string, kind: "decision" | "task" | "other") =>
  !PRESET.today || PRESET.today.includes(id) || (kind === "decision" ? RECORDED.has(id) : kind === "task" && !TASKS.some((t) => t.id === id))

export const useInboxDone = () => {
  const { inboxState } = useStore()
  const tasks = useAllTasks()
  return (item: InboxItem) => !!inboxState[item.id]?.done || tasks.find((t) => t.id === item.task)?.status === "done"
}

export function useTodayRows(): Row[] {
  const { confirmed, inboxState, current, clashes } = useStore()
  const { asked } = useDuetActivity()
  const tasks = useAllTasks()
  const statusOf = useStatusOf()
  const isDone = useInboxDone()
  if (!current?.example) return []
  const rows: Row[] = []
  for (const p of MY_PROJECTS) {
    const items = INBOX.filter((i) => projectIdOf(i.project) === p.id && !isDone(i))
    for (const n of needsYou(p.id, tasks, confirmed)) {
      if (n.kind === "decide") {
        // A decision from precedent stands on a confirmed one; it waits on nobody. Nor does a settled clash.
        if (statusOf(n.decision) === "prec" || clashes[n.decision.id]) continue
        const item = items.find((i) => i.need === "decide" && i.decision === n.decision.id)
        if (!item && INBOX.some((i) => i.need === "decide" && i.decision === n.decision.id && isDone(i))) continue
        rows.push({ kind: "decide", id: `d-${n.id}`, project: p.id, decision: n.decision, ask: n.ask, item })
      } else {
        // Work shows here when it is due now, or when Whyspace made it from a changed decision.
        const item = items.find((i) => i.need === "do" && i.task === n.task.id)
        if (!item && dueDay(n.task) > TODAY) continue
        rows.push({ kind: "do", id: `t-${n.id}`, project: p.id, task: n.task, item })
      }
    }
    for (const i of items) if (i.meeting && !inboxState[i.id]?.response) rows.push({ kind: "invite", id: `i-${i.id}`, project: p.id, item: i })
  }
  for (const l of asked) {
    // A question a guess of yours answers waits inside that guess: one answer settles both.
    const guess = rows.find((r): r is Extract<Row, { kind: "decide" }> => r.kind === "decide" && r.ask === "confirm" && r.decision.id === l.decision)
    if (guess) guess.waiting = [...(guess.waiting ?? []), l]
    else rows.push({ kind: "asked", id: `q-${l.id}`, project: l.project, line: l })
  }
  const shown = rows.filter((r) => (r.kind === "decide" ? onToday(r.decision.id, "decision") : r.kind === "do" ? onToday(r.task.id, "task") : onToday(r.kind === "asked" ? r.line.id : r.item.id, "other")))
  // Clashes, then whoever is waiting on you, then work due today, decisions, invitations, and the rest of the work.
  const order = (r: Row) => (r.kind === "decide" && markOf(statusOf(r.decision)) === "triangle" ? 0 : r.kind === "asked" || (r.kind === "decide" && r.waiting?.length) ? 1 : r.kind === "do" && dueDay(r.task) <= TODAY ? 2 : r.kind === "decide" ? 3 : r.kind === "invite" ? 4 : 5)
  const sorted = shown.sort((a, b) => order(a) - order(b) || (a.kind === "do" && b.kind === "do" ? dueDay(a.task) - dueDay(b.task) : 0))
  // The stack holds a few, not the whole backlog: the first ones when Today first opens, plus anything
  // that arrives later (work made from a changed decision). Answering one doesn't pull the next from the backlog.
  let held = HELD.get(current.id)
  if (!held) HELD.set(current.id, (held = { all: new Set(sorted.map((r) => r.id)), top: new Set(sorted.slice(0, NEEDS_CAP).map((r) => r.id)) }))
  const h = held
  return sorted.filter((r) => h.top.has(r.id) || !h.all.has(r.id))
}

// How many cards the Needs you stack holds.
export const NEEDS_CAP = 4
const HELD = new Map<string, { all: Set<string>; top: Set<string> }>()

export type Recap = { project: Project; summary: string; items: InboxItem[]; unread: number }

// One line per project: the week in a sentence, then the stream of updates behind it.
export function useRecap(): Recap[] {
  const { inboxState, current } = useStore()
  const isDone = useInboxDone()
  if (!current?.example) return []
  return MY_PROJECTS.map((project) => {
    const items = INBOX.filter((i) => projectIdOf(i.project) === project.id && !i.need && !isDone(i))
    const unread = items.filter((i) => !(inboxState[i.id]?.read ?? !i.unread)).length
    const summary = WEEK_SUMMARY[project.id]?.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? WEEK_SUMMARY[project.id] ?? "Nothing new this week."
    return { project, summary, items, unread }
  })
}

// Handled: what you did and what your Duet did for you. Today and yesterday open; earlier folds.
export function useHandledLines(): Line[] {
  const { confirmed, inboxState, current, clashes, taskPatches } = useStore()
  const { handled } = useDuetActivity()
  const { together } = useDuetState()
  const tasks = useAllTasks()
  const isDone = useInboxDone()
  if (!current?.example) return []
  const lines: Line[] = []
  // Decisions saved with two names have their own line from the Duet's activity.
  const settled = new Set(Object.values(together).map((t) => t.saved))
  const decisions = MY_PROJECTS.flatMap((p) => needsYou(p.id, tasks).filter((n) => n.kind === "decide").map((n) => (n as Extract<typeof n, { kind: "decide" }>).decision))
  for (const d of decisions) if (confirmed[d.id]) lines.push({ id: `c-${d.id}`, day: "today", when: "Just now", who: ME.id, text: `You confirmed ${lower(d.title)}`, decision: d.id })
  for (const [id, c] of Object.entries(clashes)) {
    // Settled in a conversation: the line with both names (from the Duet's activity) says it.
    if (c.reason === "Settled together") continue
    const d = DECISIONS.find((x) => x.id === id)
    const other = decisionById(d?.clashes)
    if (d && other) lines.push({ id: `x-${id}`, day: "today", when: "Just now", who: ME.id, text: c.choice === "theirs" ? `You took ${first(other.owner)}’s decision: ${lower(other.title)}` : `You kept ${lower(d.title)}`, decision: c.choice === "theirs" ? other.id : d.id })
  }
  for (const p of MY_PROJECTS) {
    for (const d of DECISIONS.filter((d) => d.project === p.id)) if ((d.status === "conf" || d.status === "chg") && (d.owner === ME.id || d.by === ME.id) && d.when && !settled.has(d.id)) {
      lines.push({ id: `k-${d.id}`, day: dayOfWhen(d.when), when: d.when, who: ME.id, text: `You confirmed ${lower(d.title)}`, decision: d.id })
    }
  }
  for (const i of INBOX) if (isDone(i)) {
    const task = tasks.find((t) => t.id === i.task)
    lines.push({ id: `i-${i.id}`, day: inboxState[i.id]?.done ? "today" : dayOfTime(i.time), when: inboxState[i.id]?.done ? "Just now" : i.time, who: i.from, text: task ? `You finished “${task.title}”` : i.summary, item: i, task })
  }
  // A task of yours you finished here, when no update on Today was about it.
  for (const t of tasks) if (taskPatches[t.id]?.status === "done" && t.owner === ME.id && !INBOX.some((i) => i.task === t.id && isDone(i))) {
    lines.push({ id: `t-${t.id}`, day: "today", when: "Just now", who: ME.id, text: `You finished “${t.title}”`, task: t })
  }
  for (const [id, state] of Object.entries(inboxState)) {
    const i = INBOX.find((x) => x.id === id)
    if (i && state.response) lines.push({ id: `r-${id}`, day: "today", when: "Just now", who: ME.id, text: `You ${state.response} ${lower(i.summary)}`, item: i })
  }
  for (const h of handled) {
    lines.push({ id: `u-${h.id}`, day: h.day, when: h.when, who: ME.id, agent: !h.byYou, decision: h.decision, text: `${h.byYou ? "You" : "Your Duet"} ${h.text}`, sure: h.sure })
  }
  const rank: Record<Day, number> = { today: 0, yesterday: 1, earlier: 2 }
  return lines.sort((a, b) => rank[a.day] - rank[b.day])
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
export const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id
