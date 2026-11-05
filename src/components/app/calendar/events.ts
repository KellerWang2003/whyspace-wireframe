import { useSyncExternalStore } from "react"
import { MY_PROJECTS, SESSIONS, type Session } from "@/data"
import { TODAY, dayOf } from "@/playground/model"

// Calendar events: every meeting across the viewer's projects. Seeded from SESSIONS plus the
// meetings that live only in the team's own calendar (Google, Outlook). Mock state, kept in
// memory so the Overview calendar, the Inbox and the Schedule meeting dialog stay in sync;
// it resets on reload.

export type CalEvent = {
  id: string
  project: string
  title: string
  start: number // epoch ms
  end: number
  people: string[]
  status: Session["status"]
  workshop?: string
  session?: string // the meeting's own page, when it has one
  repeats?: string // "Every Monday"
}

const MIN = 60_000
const YEAR = 2026
// Day numbers count from Oct 0 (see dayOf), so Oct 30 = 30 and Nov 2 = 33.
export const dateOfDay = (day: number, minutes = 0) => new Date(YEAR, 9, day, 0, minutes).getTime()
export const dayOfDate = (ms: number) => {
  const d = new Date(ms)
  return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(YEAR, 9, 0).getTime()) / 86_400_000)
}

// Ended meetings only say the day; give them the time they actually ran.
const PAST_TIME: Record<string, number> = { s1: 14 * 60, s2: 11 * 60, s4: 15 * 60 }

function fromSession(s: Session & { workshop?: string }): CalEvent | null {
  const day = dayOf(s.when) ?? (s.status === "Live" ? TODAY : undefined)
  if (day === undefined) return null
  const time = s.when.match(/(\d{1,2}):(\d{2})/)
  const startMin = time ? Number(time[1]) * 60 + Number(time[2]) : PAST_TIME[s.id] ?? (s.status === "Live" ? 10 * 60 : 13 * 60)
  const length = Number(s.length?.match(/\d+/)?.[0] ?? 60)
  return {
    id: s.id,
    project: s.project,
    title: s.title,
    start: dateOfDay(day, startMin),
    end: dateOfDay(day, startMin + Math.max(length, 30)),
    people: s.people,
    status: s.status,
    workshop: s.workshop,
    session: s.id,
  }
}

const at = (day: number, h: number, m = 0) => dateOfDay(day, h * 60 + m)
const later = (id: string, project: string, title: string, start: number, mins: number, people: string[], extra: Partial<CalEvent> = {}): CalEvent => ({
  id, project, title, start, end: start + mins * MIN, people, status: start < dateOfDay(TODAY + 1) ? "Ended" : "Scheduled", ...extra,
})

function seed(): CalEvent[] {
  const fromSessions = SESSIONS.map(fromSession).filter((e): e is CalEvent => !!e)
  // Weekly sync on Mondays, Oct 12 to Nov 23.
  const syncs = [12, 19, 26, 33, 40, 47, 54].map((d) => later(`sync-${d}`, "whiskr", "Weekly sync", at(d, 9, 30), 30, ["MC", "CH", "TR", "KL"], { repeats: "Every Monday" }))
  const extra = [
    later("e1", "studio", "Interview synthesis", at(27, 16), 60, ["JK", "MC"]),
    later("e2", "whiskr", "App store screenshots", at(29, 14), 60, ["KL", "MC"]),
    later("e3", "whiskr", "Print proof call", at(30, 10, 30), 30, ["MC"]),
    later("e4", "studio", "Final crit", at(30, 13), 120, ["JK", "MC"]),
    later("e5", "whiskr", "Vet call about the purr", at(30, 16), 30, ["TR"]),
    later("e6", "studio", "Studio desk crit", at(23, 10), 60, ["JK", "MC"]),
  ]
  const mine = new Set(MY_PROJECTS.map((p) => p.id))
  return [...fromSessions, ...syncs, ...extra].filter((e) => mine.has(e.project))
}

let events: CalEvent[] = seed()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useEvents = () => useSyncExternalStore(subscribe, () => events)

let next = 1
export function addEvent(e: Omit<CalEvent, "id" | "status">): CalEvent {
  const created: CalEvent = { ...e, id: `new-${next++}`, status: "Scheduled" }
  events = [...events, created]
  emit()
  return created
}

export function updateEvent(id: string, patch: Partial<CalEvent>) {
  events = events.map((e) => (e.id === id ? { ...e, ...patch } : e))
  emit()
}

export function removeEvent(id: string) {
  events = events.filter((e) => e.id !== id)
  emit()
}

export function restoreEvent(e: CalEvent) {
  events = [...events.filter((x) => x.id !== e.id), e]
  emit()
}

// Where Join / Open goes: the meeting's page, else the linked workshop, else a fresh call.
export const meetingPath = (e: CalEvent) => `/p/${e.project}/sessions/${e.session ?? e.workshop ?? "new"}`

/* ---------------- Time helpers ---------------- */

export const DAY_MS = 86_400_000
export const startOfDay = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
export const addDays = (ms: number, n: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes()).getTime()
}
// Weeks start on Monday.
export const startOfWeek = (ms: number) => addDays(startOfDay(ms), -((new Date(ms).getDay() + 6) % 7))
export const startOfMonth = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}
export const minutesOf = (ms: number) => {
  const d = new Date(ms)
  return d.getHours() * 60 + d.getMinutes()
}
export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b)
export const pad = (n: number) => String(n).padStart(2, "0")
export const fmtTime = (ms: number) => {
  const d = new Date(ms)
  return `${d.getHours()}:${pad(d.getMinutes())}`
}
export const fmtRange = (e: { start: number; end: number }) => `${fmtTime(e.start)}–${fmtTime(e.end)}`
export const fmtDay = (ms: number, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
  new Intl.DateTimeFormat("en-US", opts).format(ms)

// Events whose times overlap this one (same day, any project).
export const overlapsOf = (e: CalEvent, all: CalEvent[]) => all.filter((x) => x.id !== e.id && x.start < e.end && e.start < x.end)
