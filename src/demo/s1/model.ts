import { useEffect, useReducer } from "react"
import type { Mark } from "@/lib/marks"

// Scenario 1 of the test demo: Keller's Tuesday, from Today to the promo video plan. One state for
// both surfaces (the Whyspace app and the desk with Claude), so what happens in Claude shows on
// Today and the other way round. Everything here is demo data; nothing touches the app's store.

export type Kind = "guess" | "conf" | "clash" | "prec"
export type Caught = { id: string; title: string; kind: Kind; why?: string; hints: string[]; when: string }
export const markOf = (c: Caught): Mark => (c.kind === "conf" ? "filled" : c.kind === "prec" ? "ringed" : c.kind === "clash" ? "triangle" : "empty")

export const WHERE = { project: "whiskr", part: "Marketing" }
export const PROMPT = "Use the Whyspace MCP to pull up everything Whiskr has on the promo video: the Marketing thread, its decisions and its attachments. Then help me plan it."
export const TREVOR = { who: "TR", title: "Change the brand color from red to blue", why: "Research found cats can’t see red", when: "Mon" }
export const TASK = { title: "Plan the promo video", due: "Today", description: "The launch video, for reels and the site. Trevor and Kelly build on the plan." }
export const TODAY_LABEL = "Tuesday, October 27"

// The tester's lines to Claude, in order. The first is also on the task (Copy prompt). The reply
// follows the turn, not the words, so a tester who paraphrases still gets the same scenario.
export const LINES = [
  PROMPT,
  "Make it 15 seconds, and use red, our brand color, throughout.",
  "Go on: open on Luna’s real clip from the cat test, end on the moving dot.",
  "Save the plan to our Drive and share it with the team.",
]

// What Claude reads from the Marketing thread before it plans.
export const THREAD_INTENT = "Get cat owners to download Whiskr at launch."
export const THREAD_DECISIONS = [
  { title: "Make things move to get cats’ attention", who: "TR", when: "Oct 22" },
  { title: "Add a purring sound to the dot", who: "KL", when: "Oct 22" },
  { title: TREVOR.title, who: "TR", when: "Oct 23" },
]
export const ATTACHMENTS = ["Brand guidelines", "Cat test videos"]

const BASE_MIN = 9 * 60 + 14
export const timeAt = (i: number) => { const m = BASE_MIN + i * 2; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}` }

const DEF: Record<string, Omit<Caught, "when">> = {
  len: { id: "len", title: "Make the promo video 15 seconds", kind: "guess", hints: ["Cats lose interest fast", "Fits a reel"] },
  red: { id: "red", title: "Use red as the brand color throughout", kind: "clash", hints: [] },
  luna: { id: "luna", title: "Start the promo video with Luna’s real clip", kind: "guess", hints: ["Shows the idea in the first second", "Real footage feels honest"] },
  dot: { id: "dot", title: "End the promo video on the moving dot", kind: "guess", hints: ["The dot is the app", "Ends where the swipe starts"] },
}
const BLUE_TITLE = "Use blue as the brand color throughout"

export type Exchange = { me: string; blue: boolean; at: string }
export type Asked = "none" | "duet-wait" | "duet" | "trevor"
export type View = "alert" | "needs" | "check"
export type Surface = "app" | "desk"

export type State = {
  surface: Surface
  taskOpen: boolean
  reviewOpen: boolean
  trevorOpen: boolean
  exchanges: Exchange[]
  pending: boolean
  caught: Caught[]
  clash: "none" | "open" | "taken"
  asked: Asked
  pill: { open: boolean; view: View }
  // The check when you share: the guesses it opened with.
  checkIds: string[]
  shared: boolean
  checkClosed: boolean
  taskDone: boolean
  toldTrevor: { by: "none" } | { by: "duet" } | { by: "you"; text: string }
  toast: string | null
  // Something the pill does by itself a moment later.
  auto: "alert" | "check" | "collapse" | null
}

export const INITIAL: State = {
  surface: "app", taskOpen: false, reviewOpen: false, trevorOpen: false,
  exchanges: [], pending: false, caught: [], clash: "none", asked: "none",
  pill: { open: false, view: "needs" }, checkIds: [], shared: false, checkClosed: false, taskDone: false,
  toldTrevor: { by: "none" }, toast: null, auto: null,
}

export type Action =
  | { type: "task"; open: boolean }
  | { type: "review"; open: boolean }
  | { type: "trevor"; open: boolean }
  | { type: "surface"; to: Surface }
  | { type: "send"; text: string }
  | { type: "replied" }
  | { type: "confirm"; id: string; why: string }
  | { type: "take" }
  | { type: "askWhy" }
  | { type: "duetReady" }
  | { type: "askTrevor" }
  | { type: "pill"; open: boolean; view?: View }
  | { type: "checkDone" }
  | { type: "tellTrevor"; text: string }
  | { type: "taskDone" }
  | { type: "toast"; text: string | null }
  | { type: "restart" }

export const guesses = (s: State) => s.caught.filter((c) => c.kind === "guess")
export const confirmed = (s: State) => s.caught.filter((c) => c.kind === "conf" || c.kind === "prec")
export const waiting = (s: State) => (s.clash === "open" ? 1 : 0) + guesses(s).length
// The view the pill opens on when you click it.
export const defaultView = (s: State): View => (s.clash === "open" ? "alert" : s.shared && !s.checkClosed ? "check" : "needs")

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "task": return { ...s, taskOpen: a.open }
    // Review on Today: the same check, over the guesses still in the plan.
    case "review": return a.open ? { ...s, reviewOpen: true, checkIds: guesses(s).map((c) => c.id) } : { ...s, reviewOpen: false }
    case "trevor": return { ...s, trevorOpen: a.open }
    case "surface": return { ...s, surface: a.to, taskOpen: false }
    case "send": {
      if (s.pending) return s
      const i = s.exchanges.length
      return { ...s, pending: true, exchanges: [...s.exchanges, { me: a.text, blue: s.clash === "taken", at: timeAt(i) }] }
    }
    case "replied": {
      const i = s.exchanges.length - 1
      const when = timeAt(i)
      const add = (ids: string[]) => [...s.caught, ...ids.map((id) => ({ ...DEF[id], when }))]
      if (i === 1) return { ...s, pending: false, caught: add(["len", "red"]), clash: "open", auto: "alert" }
      if (i === 2) return { ...s, pending: false, caught: add(["luna", "dot"]) }
      if (i === 3) {
        const ids = guesses(s).map((c) => c.id)
        return { ...s, pending: false, shared: true, taskDone: true, checkIds: ids, toast: "Shared with Whiskr · 4 people", auto: ids.length ? "check" : null }
      }
      return { ...s, pending: false }
    }
    case "confirm": {
      const caught = s.caught.map((c) => (c.id === a.id ? { ...c, kind: "conf" as Kind, why: a.why } : c))
      // Your Duet answers Trevor the moment the length is yours.
      const toldTrevor = a.id === "len" && s.toldTrevor.by === "none" ? { by: "duet" as const } : s.toldTrevor
      return { ...s, caught, toldTrevor }
    }
    case "take": {
      const caught = s.caught.map((c) => (c.id === "red" ? { ...c, kind: "prec" as Kind, title: BLUE_TITLE, why: "Follows Trevor’s decision" } : c))
      return { ...s, caught, clash: "taken", auto: s.pill.open && s.pill.view === "alert" ? "collapse" : null }
    }
    case "askWhy": return { ...s, asked: s.asked === "none" ? "duet-wait" : s.asked }
    case "duetReady": return { ...s, asked: "duet" }
    case "askTrevor": return { ...s, asked: "trevor" }
    case "pill": {
      const view = a.view ?? (a.open ? defaultView(s) : s.pill.view)
      // Closing the check is fine: the work travels as it is; Today offers a review.
      const checkClosed = s.checkClosed || (!a.open && s.pill.open && s.pill.view === "check")
      return { ...s, pill: { open: a.open, view }, checkClosed, auto: null }
    }
    case "checkDone": return { ...s, checkClosed: true, pill: { ...s.pill, open: false }, reviewOpen: false }
    case "tellTrevor": return { ...s, toldTrevor: { by: "you", text: a.text }, trevorOpen: false }
    case "taskDone": return { ...s, taskDone: true }
    case "toast": return { ...s, toast: a.text }
    case "restart": return INITIAL
  }
}

export function useScenario1(): [State, (a: Action) => void] {
  const [s, dispatch] = useReducer(reduce, INITIAL)

  // Claude takes a moment to answer.
  useEffect(() => {
    if (!s.pending) return
    const t = setTimeout(() => dispatch({ type: "replied" }), 1000)
    return () => clearTimeout(t)
  }, [s.pending, s.exchanges.length])

  // The pill opens by itself on a clash and on the check, and folds away once you took Trevor's.
  useEffect(() => {
    if (!s.auto) return
    const auto = s.auto
    const t = setTimeout(() => {
      if (auto === "collapse") dispatch({ type: "pill", open: false })
      else dispatch({ type: "pill", open: true, view: auto })
    }, auto === "collapse" ? 1100 : 800)
    return () => clearTimeout(t)
  }, [s.auto])

  // Trevor's Duet answers after a beat.
  useEffect(() => {
    if (s.asked !== "duet-wait") return
    const t = setTimeout(() => dispatch({ type: "duetReady" }), 900)
    return () => clearTimeout(t)
  }, [s.asked])

  useEffect(() => {
    if (!s.toast) return
    const t = setTimeout(() => dispatch({ type: "toast", text: null }), 2800)
    return () => clearTimeout(t)
  }, [s.toast])

  return [s, dispatch]
}

// What Claude says back, by turn. The tester's words are shown as typed; the reply follows the script,
// so the flow holds whatever they type. Turn 2 reads blue once Trevor's decision was taken before it.
export type Part =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "thread" }
  | { kind: "record"; ids: string[] }
  | { kind: "drive" }

export function replyParts(i: number, blue: boolean): Part[] {
  if (i === 0) return [
    { kind: "thread" },
    { kind: "text", text: "That’s everything on the promo video so far. The Marketing thread wants cat owners to download Whiskr at launch. Trevor’s brand guidelines and the cat test videos are attached, and nobody has planned the video yet." },
    { kind: "text", muted: true, text: "How long should it be, and what should it look like?" },
  ]
  if (i === 1) return [
    { kind: "text", text: "A 15-second cut, red throughout: red title card, red end card, red accents on the swipe dot. That fits a reel and leaves room for one idea." },
    { kind: "record", ids: ["len", "red"] },
    { kind: "text", muted: true, text: "What should it open on?" },
  ]
  if (i === 2) return [
    { kind: "text", text: blue
      ? "Opening on Luna’s real clip from the test footage, the pounce at 0:42, and ending on the moving dot on a blue card, following Trevor’s brand change."
      : "Opening on Luna’s real clip from the test footage, the pounce at 0:42, and ending on the moving dot on the red card." },
    { kind: "text", muted: true, text: "0:00 Luna’s pounce · 0:04 the swipe · 0:08 the dot · 0:12 title card · 0:14 end card" },
    { kind: "record", ids: ["luna", "dot"] },
  ]
  if (i === 3) return [
    { kind: "drive" },
    { kind: "text", text: "Saved to Drive as “Promo video plan” and shared with Whiskr, 4 people." },
  ]
  return [{ kind: "text", text: "Done. Anything else for the plan?" }]
}
