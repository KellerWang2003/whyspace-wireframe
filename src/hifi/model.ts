import { toast } from "sonner"
import { Cat, Gift, GraduationCap, type LucideIcon } from "lucide-react"
import { ACTIVITY, DECISIONS, ME, MY_PROJECTS, PEOPLE, PROJECTS, PROJECT_DECISION_SUMMARY, SESSIONS, WEEK_SUMMARY, changedSince, decisionById, initials, type ArtifactKind, type Decision, type Task, type TaskStatus } from "@/data"
import { dateOfDay, fmtDay, fmtTime, sameDay, useEvents } from "@/components/app/calendar/events"
import { markOf, type Mark } from "@/lib/marks"
import { PINS } from "@/lib/scenario"
import { STAGE, STAGES } from "@/lib/stage"
import { useStore } from "@/lib/store"
import { useNeedsYou, useStatusOf, useWithdrawn } from "@/lib/work"
import { LAST_VISIT, TODAY, dayOf } from "@/playground/model"
import { dueDay, first, projectIdOf, useHandledLines, useRecap, useTodayRows, type Row } from "@/design-b/today-model"
import { intentOf, threadOf, useThreads } from "@/design-b/threads"
import { useAllTasks, useArtifacts } from "@/design-b/work"

// The high-fi playground's data: Today and Whiskr's Home as plain view data, read from the same
// hooks the wireframe uses, so the three styles show the same Whiskr week and the same actions.

export const BRAND = {
  forest: "#445332",
  forestDeep: "#2E3922",
  paper: "#FDFDFC",
  leaf: "#6A854C",
  apricot: "#F19D57",
  sky: "#75A6C4",
  rose: "#E97EA1",
  leafWash: "#EAF5DF",
  apricotWash: "#FFE9D2",
  skyWash: "#E2F3FE",
  roseWash: "#FFE4EF",
  leafInk: "#5A753C",
  apricotInk: "#A25600",
  skyInk: "#42718D",
  roseInk: "#A8486A",
  muted: "#676F5D",
  line: "#E0E5DC",
  subtle: "#F3F6F0",
} as const

export type Pigment = "leaf" | "apricot" | "sky" | "rose"
export const PIGMENTS: Pigment[] = ["apricot", "sky", "rose", "leaf"]
export const WASH: Record<Pigment, string> = { leaf: BRAND.leafWash, apricot: BRAND.apricotWash, sky: BRAND.skyWash, rose: BRAND.roseWash }
export const INK: Record<Pigment, string> = { leaf: BRAND.leafInk, apricot: BRAND.apricotInk, sky: BRAND.skyInk, rose: BRAND.roseInk }

// The wireframe's muted thread colors, mapped onto the four brand pigments (yellow has no pigment, so it takes rose).
const PIGMENT_OF: Record<string, Pigment> = {
  "#e0805f": "apricot", "#4a8fd6": "sky", "#dcae3c": "rose", "#5fab78": "leaf",
  "#9a7fd1": "sky", "#d6739c": "rose", "#47acb0": "sky", "#8f8f8f": "leaf",
}
const pigmentOf = (color: string): Pigment => PIGMENT_OF[color.toLowerCase()] ?? "leaf"

// A pigment per person, for painted and blocked avatars.
const PERSON_PIGMENT: Record<string, Pigment> = { MC: "leaf", CH: "sky", TR: "apricot", KL: "rose", JK: "sky" }
export const personPigment = (id: string): Pigment => PERSON_PIGMENT[id] ?? "leaf"
// Keller and Kelly share a first letter, so their avatars use two.
const AVATAR: Record<string, string> = { MC: "Ke", KL: "Kl" }
export const initialsOf = (id: string) => AVATAR[id] ?? initials(PEOPLE[id]?.name ?? id)
export const nameOf = (id: string) => PEOPLE[id]?.name ?? id

export const PROJECT_ID = "whiskr"

// Each project's icon, and the pigment the high-fi styles give it.
export const PROJECT_MARK: Record<string, { icon: LucideIcon; pigment: Pigment }> = {
  whiskr: { icon: Cat, pigment: "apricot" },
  studio: { icon: GraduationCap, pigment: "sky" },
  holiday: { icon: Gift, pigment: "rose" },
}

// The Whiskr project's pages, as the sidebar lists them. Only Home is built here.
export const PROJECT_PAGES = ["Home", "Tasks", "Decisions", "Artifacts"] as const
export const shortName = (name: string) => name.replace(/\s*\(.*\)$/, "")

export type HThread = { id: string; name: string; pigment: Pigment; intent?: string; n: number; m: number }
export type HAction = { label: string; primary?: boolean; run?: () => void }
export type HNeed = {
  id: string
  kind: "clash" | "decide" | "asked" | "invite" | "do"
  lead: string
  mark?: Mark
  title: string
  sub: string
  who: string
  agent?: boolean
  thread?: HThread
  actions: HAction[]
}
export type HEvent = { id: string; time: string; title: string; mins: number; live: boolean; project: string }
export type HDay = { key: string; weekday: string; num: number; month: string; today: boolean; events: HEvent[] }

const isMine = (t: Task) => t.owner === ME.id || !!t.assignees?.includes(ME.id)

// Whiskr's week stands at its stage's day; a test scenario pins its own.
function stageDay() {
  return PINS ? TODAY : dayOf(STAGES[STAGE - 1].date) ?? TODAY
}

function useThreadLookup() {
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const threads = useThreads(PROJECT_ID)
  const counted = (part: string) => {
    const live = DECISIONS.filter((d) => d.project === PROJECT_ID && d.part === part && !withdrawn(d))
    return { n: live.filter((d) => ["filled", "ringed"].includes(markOf(statusOf(d)))).length, m: live.length }
  }
  const of = (part?: string): HThread | undefined => {
    if (!part) return undefined
    const t = threads.find((x) => x.part === part) ?? threadOf(PROJECT_ID, part)
    return { id: t.id, name: t.name, pigment: pigmentOf(t.color), intent: intentOf(t), ...counted(t.part) }
  }
  return { threads: threads.map((t) => of(t.part)!), of }
}

function useActions() {
  const { confirmDecision, settleClash, setInboxDone, patchTask, setInviteResponse } = useStore()
  return {
    confirm: (id: string, item?: string) => () => { confirmDecision(id); if (item) setInboxDone(item, true); toast("Decision confirmed") },
    clash: (id: string, choice: "theirs" | "mine", name: string) => () => { settleClash(id, choice); toast(choice === "theirs" ? `Took ${name}’s decision` : `Kept yours. ${name} sees the clash.`) },
    done: (task: Task, item?: string) => () => {
      patchTask(task.id, { status: "done" })
      if (item) setInboxDone(item, true)
      toast("Task done", { action: { label: "Undo", onClick: () => { patchTask(task.id, { status: task.status }); if (item) setInboxDone(item, false) } } })
    },
    invite: (item: string, response: "accepted" | "declined") => () => { setInviteResponse(item, response); toast(response === "accepted" ? "Accepted" : "Declined") },
  }
}

function decisionNeed(d: Decision, ask: "confirm" | "review" | "answer" | "clash", ctx: { status: ReturnType<ReturnType<typeof useStatusOf>>; thread?: HThread; act: ReturnType<typeof useActions>; item?: string }): HNeed {
  const guess = ctx.status === "inf" || ctx.status === "open"
  const who = d.by ?? PEOPLE[d.owner]?.name
  const other = ask === "clash" ? decisionById(d.clashes) : undefined
  const otherName = other ? first(other.owner) : ""
  const lead = { confirm: "Confirm", review: "Review", answer: "Answer", clash: "Clash" }[ask]
  const sub = other ? `${otherName} confirmed “${other.title}”` : ask === "confirm" ? d.why ?? "No reason yet" : ask === "answer" ? (d.due ? `Due ${d.due}` : "Open question") : guess ? `${who}'s guess` : `${who} decided`
  const actions: HAction[] = other
    ? [{ label: `Take ${otherName}’s`, primary: true, run: ctx.act.clash(d.id, "theirs", otherName) }, { label: "Keep mine", run: ctx.act.clash(d.id, "mine", otherName) }]
    : ask === "confirm" ? [{ label: "Confirm", primary: true, run: ctx.act.confirm(d.id, ctx.item) }] : [{ label: lead }]
  return { id: `d-${d.id}`, kind: ask === "clash" ? "clash" : "decide", lead, mark: markOf(ctx.status), title: d.title, sub, who: d.owner, agent: guess && !!d.tool, thread: ctx.thread, actions }
}

/* ---------------- Today ---------------- */

export function useHifiToday() {
  const statusOf = useStatusOf()
  const act = useActions()
  const { of } = useThreadLookup()
  const tasks = useAllTasks()
  const events = useEvents()
  const rows = useTodayRows().filter((r) => r.project === PROJECT_ID)
  const recap = useRecap()
  const lines = useHandledLines()

  const need = (r: Row): HNeed => {
    if (r.kind === "decide") return decisionNeed(r.decision, r.ask, { status: statusOf(r.decision), thread: of(r.decision.part), act, item: r.item?.id })
    if (r.kind === "asked") return { id: r.id, kind: "asked", lead: "Asked your Duet", title: `${first(r.line.who)} asked ${r.line.text}`, sub: "Nothing of yours covers it yet", who: r.line.who, actions: [{ label: "Answer", primary: true }] }
    if (r.kind === "invite") {
      const session = SESSIONS.find((s) => s.id === r.item.meeting?.sessionId)
      return { id: r.id, kind: "invite", lead: "Invitation", title: session?.title ?? r.item.summary, sub: `${nameOf(r.item.from)} invited you`, who: r.item.from, actions: [{ label: "Accept", primary: true, run: act.invite(r.item.id, "accepted") }, { label: "Decline", run: act.invite(r.item.id, "declined") }] }
    }
    return { id: r.id, kind: "do", lead: "Do", title: r.item?.summary ?? r.task.title, sub: `Due ${r.task.due}`, who: r.item?.from ?? r.task.owner, thread: of(r.task.part), actions: [{ label: "Done", primary: true, run: act.done(r.task, r.item?.id) }] }
  }

  // What you and your Duet handled, kept to Whiskr.
  const inWhiskr = (l: (typeof lines)[number]) =>
    (l.decision ? DECISIONS.find((d) => d.id === l.decision)?.project === PROJECT_ID : false) ||
    (l.item ? projectIdOf(l.item.project) === PROJECT_ID : false) ||
    (l.task ? projectIdOf(l.task.project) === PROJECT_ID : false)

  const from = dateOfDay(TODAY)
  const next = events
    .filter((e) => e.project === PROJECT_ID && (e.status === "Live" || (e.status === "Scheduled" && e.end >= from)))
    .sort((a, b) => Number(b.status === "Live") - Number(a.status === "Live") || a.start - b.start)
    .slice(0, 6)
  const upcoming: { label: string; weekday: string; num: number; events: HEvent[] }[] = []
  for (const e of next) {
    const label = e.status === "Live" ? "Now" : fmtDay(e.start)
    const ev: HEvent = { id: e.id, time: e.status === "Live" ? "Live" : fmtTime(e.start), title: e.title, mins: Math.round((e.end - e.start) / 60000), live: e.status === "Live", project: e.project }
    const group = upcoming.find((g) => g.label === label)
    if (group) group.events.push(ev)
    else upcoming.push({ label, weekday: fmtDay(e.start, { weekday: "short" }), num: new Date(e.start).getDate(), events: [ev] })
  }

  const day = stageDay()
  const needs = rows.map(need)
  return {
    weekday: fmtDay(dateOfDay(day), { weekday: "long" }),
    date: fmtDay(dateOfDay(day), { month: "long", day: "numeric" }),
    lead: WEEK_SUMMARY[PROJECT_ID] ?? "",
    needs,
    recap: recap.map((r) => ({ id: r.project.id, name: shortName(r.project.name), summary: r.summary, unread: r.unread })),
    tasks: tasks
      .filter((t) => projectIdOf(t.project) === PROJECT_ID && isMine(t))
      .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || dueDay(a) - dueDay(b))
      .map((t) => ({ id: t.id, title: t.title, due: t.due, status: t.status as TaskStatus, thread: of(t.part), done: t.status === "done", finish: act.done(t) })),
    handled: lines.filter(inWhiskr).map((l) => ({ id: l.id, text: l.text, when: l.when, who: l.who ?? ME.id, agent: !!l.agent, day: l.day })),
    upcoming,
  }
}

/* ---------------- Home ---------------- */

export function useHifiHome() {
  const statusOf = useStatusOf()
  const act = useActions()
  const { threads, of } = useThreadLookup()
  const events = useEvents()
  const artifacts = useArtifacts(PROJECT_ID)
  const project = PROJECTS.find((p) => p.id === PROJECT_ID) ?? PROJECTS[0]
  const changed = changedSince(PROJECT_ID)

  const needs = useNeedsYou(PROJECT_ID).map((n): HNeed => {
    if (n.kind === "decide") {
      const d = n.decision
      const base = decisionNeed(d, n.ask, { status: statusOf(d), thread: of(d.part), act })
      // Home names what a clash is against instead of who; the Today row carries the choice.
      return n.ask === "clash" ? { ...base, sub: "Clashes with a confirmed decision", actions: [{ label: "Review" }] } : base
    }
    const t = n.task
    return { id: `t-${t.id}`, kind: "do", lead: "Do", title: t.title, sub: `${t.tool ? `${t.tool} · ` : ""}Due ${t.due}`, who: t.owner, thread: of(t.part), actions: [{ label: "Done", primary: true, run: act.done(t) }] }
  })

  // The week ahead from today, Whiskr's meetings only.
  const week: HDay[] = Array.from({ length: 7 }, (_, i) => {
    const ms = dateOfDay(TODAY + i)
    return {
      key: String(ms),
      weekday: fmtDay(ms, { weekday: "short" }),
      num: new Date(ms).getDate(),
      month: fmtDay(ms, { month: "short" }),
      today: i === 0,
      events: events
        .filter((e) => e.project === PROJECT_ID && sameDay(e.start, ms))
        .sort((a, b) => a.start - b.start)
        .map((e) => ({ id: e.id, time: fmtTime(e.start), title: e.title, mins: Math.round((e.end - e.start) / 60000), live: e.status === "Live", project: e.project })),
    }
  })

  return {
    name: shortName(project.name),
    members: project.members.map((id) => ({ id, name: nameOf(id), role: PEOPLE[id]?.role ?? "" })),
    stands: PROJECT_DECISION_SUMMARY[PROJECT_ID] ?? "",
    since: WEEK_SUMMARY[PROJECT_ID] ?? "",
    sinceLabel: `Since ${fmtDay(dateOfDay(LAST_VISIT), { month: "short", day: "numeric" })}`,
    threads,
    decide: needs.filter((n) => n.kind !== "do"),
    todo: needs.filter((n) => n.kind === "do"),
    working: ACTIVITY.filter((a) => a.project === PROJECT_ID && a.state === "active").map((a) => ({
      who: a.who, name: first(a.who), thread: of(a.part), tool: a.tool, doing: a.aiDoing ?? a.doing, since: a.since,
    })),
    changed: [
      ...changed.decisions.map((d) => ({ id: d.id, kind: "decision" as const, title: d.title, mark: markOf(statusOf(d)), thread: of(d.part), meta: d.by ?? nameOf(d.owner) })),
      ...changed.artifacts.map((a) => {
        const live = artifacts.find((x) => x.id === a.id)
        return { id: a.id, kind: "artifact" as const, title: live?.name ?? a.name, artifact: a.kind as ArtifactKind, thread: of(a.part), meta: `${a.kind} · ${a.updated}` }
      }),
    ],
    week,
    range: `${week[0].month} ${week[0].num} – ${week[6].month === week[0].month ? "" : `${week[6].month} `}${week[6].num}`,
  }
}

/* ---------------- Navigation ---------------- */

export function useHifiNav() {
  const { current } = useStore()
  const { threads } = useThreadLookup()
  const today = useTodayRows().filter((r) => r.project === PROJECT_ID).length
  return {
    workspace: current?.name ?? "Workspace",
    me: { id: ME.id, name: ME.name },
    today,
    projects: MY_PROJECTS.map((p) => ({ id: p.id, name: shortName(p.name) })),
    threads,
  }
}

export type HToday = ReturnType<typeof useHifiToday>
export type HHome = ReturnType<typeof useHifiHome>
export type HNav = ReturnType<typeof useHifiNav>
