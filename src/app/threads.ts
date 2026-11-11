import { useSyncExternalStore } from "react"
import { ARTIFACTS, DECISIONS, PART_SUMMARY, TASKS } from "@/data"

// A project is made of threads, and each thread owns its tasks, decisions and artifacts.
// Threads are kept here (order, name, icon, color, archived) so the sidebar, Home and the thread page
// stay in step. The data's `part` field is the thread a task, decision or artifact belongs to.

export type Thread = {
  id: string
  // Display name; can be renamed.
  name: string
  // The name the data uses (`part`). New threads use their first name.
  part: string
  color: string
  // The icon the team picked, drawn in the thread's color wherever the thread is named.
  icon?: string
  archived?: boolean
  // What the thread is for, in the team's own words. Agents read it over MCP before they build.
  intent?: string
}

// A strand color per thread. Muted, and only ever shown on a small icon, dot or line.
export const THREAD_COLORS = [
  { name: "Orange", value: "#e0805f" },
  { name: "Blue", value: "#4a8fd6" },
  { name: "Yellow", value: "#dcae3c" },
  { name: "Green", value: "#5fab78" },
  { name: "Purple", value: "#9a7fd1" },
  { name: "Pink", value: "#d6739c" },
  { name: "Teal", value: "#47acb0" },
  { name: "Gray", value: "#8f8f8f" },
] as const

// The threads each example project starts with, in a sensible working order.
const SEED: Record<string, string[]> = {
  whiskr: ["Research", "Brand", "App", "Marketing"],
  studio: ["Interviews", "Concept", "Prototype", "Final crit"],
}

// The intent each example thread starts with. A stored thread without one falls back here.
const INTENT: Record<string, string> = {
  Research: "Find out what makes a cat look at a screen.",
  Brand: "Give Whiskr a look that cats can see and owners like.",
  App: "Make the swipe card something a cat will actually use.",
  Marketing: "Get cat owners to download Whiskr.",
  Interviews: "Learn how students really review a lecture.",
  Concept: "Decide what Recall makes from one course PDF.",
  Prototype: "Get one real upload-to-feedback loop working before the crit.",
  "Final crit": "Show what Recall does, where it fails, and what we changed.",
}
export const intentOf = (t: Thread) => t.intent ?? INTENT[t.part]

// The icon each example thread starts with. Any other thread starts on a hash until someone picks one.
const ICON: Record<string, string> = {
  Research: "flask",
  Brand: "palette",
  App: "phone",
  Marketing: "megaphone",
  Interviews: "messages",
  Concept: "bulb",
  Prototype: "wrench",
  "Final crit": "presentation",
}
export const iconOf = (t: Pick<Thread, "icon" | "part">) => t.icon ?? ICON[t.part] ?? "hash"

export const slug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "thread"

function seed(projectId: string): Thread[] {
  const names = [...(SEED[projectId] ?? [])]
  // Any other thread the data uses, in the order it first appears.
  const projectName = projectId === "whiskr" ? "Whiskr (Demo project)" : projectId === "studio" ? "AI Studio · Recall" : projectId
  for (const item of [...DECISIONS.filter((d) => d.project === projectId), ...ARTIFACTS.filter((a) => a.project === projectId), ...TASKS.filter((t) => t.project === projectName)]) {
    if (!names.includes(item.part)) names.push(item.part)
  }
  return names.map((name, i) => ({ id: slug(name), name, part: name, color: THREAD_COLORS[i % THREAD_COLORS.length].value, intent: INTENT[name] }))
}

const KEY = "whyspace.b.threads"
type State = Record<string, Thread[]>

function load(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as State
  } catch {
    return {}
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function commit(projectId: string, threads: Thread[]) {
  state = { ...state, [projectId]: threads }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage blocked: changes last for this visit.
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

// Every thread of a project, archived ones included.
function allOf(projectId: string): Thread[] {
  const stored = state[projectId]
  if (!stored) return seed(projectId)
  // Keep threads the data gained since they were stored.
  const missing = seed(projectId).filter((s) => !stored.some((t) => t.part === s.part))
  return [...stored, ...missing]
}

const cache = new Map<string, { from: State; threads: Thread[] }>()
function listOf(projectId: string): Thread[] {
  const hit = cache.get(projectId)
  if (hit && hit.from === state) return hit.threads
  const threads = allOf(projectId).filter((t) => !t.archived)
  cache.set(projectId, { from: state, threads })
  return threads
}

export function useThreads(projectId: string): Thread[] {
  return useSyncExternalStore(subscribe, () => listOf(projectId))
}

export const threadsNow = (projectId: string) => listOf(projectId)

// The thread a piece of work belongs to, by its `part`.
export function threadOf(projectId: string, part: string): Thread {
  return allOf(projectId).find((t) => t.part === part) ?? { id: slug(part), name: part, part, color: THREAD_COLORS[7].value }
}

export function useThread(projectId: string, id?: string): Thread | undefined {
  const threads = useThreads(projectId)
  return threads.find((t) => t.id === id)
}

// Archived threads keep their page (read-only notice, Restore) and their work in Home's rollups.
const archivedCache = new Map<string, { from: State; threads: Thread[] }>()
function archivedOf(projectId: string): Thread[] {
  const hit = archivedCache.get(projectId)
  if (hit && hit.from === state) return hit.threads
  const threads = allOf(projectId).filter((t) => t.archived)
  archivedCache.set(projectId, { from: state, threads })
  return threads
}

export function useArchived(projectId: string): Thread[] {
  return useSyncExternalStore(subscribe, () => archivedOf(projectId))
}

// Live threads first, then archived ones: the order rollups sort and filter by.
const everyCache = new Map<string, { from: State; threads: Thread[] }>()
function everyOf(projectId: string): Thread[] {
  const hit = everyCache.get(projectId)
  if (hit && hit.from === state) return hit.threads
  const threads = [...listOf(projectId), ...archivedOf(projectId)]
  everyCache.set(projectId, { from: state, threads })
  return threads
}

export function useAllThreads(projectId: string): Thread[] {
  return useSyncExternalStore(subscribe, () => everyOf(projectId))
}

export function useAnyThread(projectId: string, id?: string): Thread | undefined {
  const live = useThreads(projectId)
  const archived = useArchived(projectId)
  return [...live, ...archived].find((t) => t.id === id)
}

// The one-line AI summary of where a thread stands, once it has decisions to summarize.
export const summaryOf = (projectId: string, part: string) =>
  DECISIONS.some((d) => d.project === projectId && d.part === part) ? PART_SUMMARY[part] : undefined

export function addThread(projectId: string, name: string, color: string, icon?: string): Thread {
  const all = allOf(projectId)
  let id = slug(name)
  for (let n = 2; all.some((t) => t.id === id); n++) id = `${slug(name)}-${n}`
  const thread: Thread = { id, name: name.trim() || "Untitled thread", part: name.trim() || "Untitled thread", color, icon }
  commit(projectId, [...all, thread])
  return thread
}

export function updateThread(projectId: string, id: string, patch: Partial<Pick<Thread, "name" | "color" | "icon" | "archived" | "intent">>) {
  commit(projectId, allOf(projectId).map((t) => (t.id === id ? { ...t, ...patch } : t)))
}

// Move a thread before another one (or to the end).
export function moveThread(projectId: string, id: string, before?: string) {
  const all = allOf(projectId)
  const moving = all.find((t) => t.id === id)
  if (!moving || id === before) return
  const rest = all.filter((t) => t.id !== id)
  const at = before ? rest.findIndex((t) => t.id === before) : -1
  rest.splice(at >= 0 ? at : rest.length, 0, moving)
  commit(projectId, rest)
}

// The next color nobody in the project uses yet.
export function nextColor(projectId: string) {
  const used = allOf(projectId).filter((t) => !t.archived).map((t) => t.color)
  return (THREAD_COLORS.find((c) => !used.includes(c.value)) ?? THREAD_COLORS[0]).value
}

// Which threads you've chosen not to see in your sidebar and on Home. Yours only, kept in this browser.
const HIDDEN_KEY = "whyspace.b.hidden"
let hidden: Record<string, string[]> = (() => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "{}") as Record<string, string[]>
  } catch {
    return {}
  }
})()
const hiddenListeners = new Set<() => void>()
const subscribeHidden = (l: () => void) => {
  hiddenListeners.add(l)
  return () => hiddenListeners.delete(l)
}
const NONE: string[] = []

export function useHidden(projectId: string): string[] {
  return useSyncExternalStore(subscribeHidden, () => hidden[projectId] ?? NONE)
}

export function setShown(projectId: string, id: string, shown: boolean) {
  const now = hidden[projectId] ?? []
  hidden = { ...hidden, [projectId]: shown ? now.filter((x) => x !== id) : [...new Set([...now, id])] }
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden))
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
  hiddenListeners.forEach((l) => l())
}

// The live threads you've chosen to see.
export function useShownThreads(projectId: string): Thread[] {
  const threads = useThreads(projectId)
  const off = useHidden(projectId)
  return off.length ? threads.filter((t) => !off.includes(t.id)) : threads
}
