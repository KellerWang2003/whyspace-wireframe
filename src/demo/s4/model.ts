import { useReducer } from "react"
import { clockFrom, useLater, type Caught, type Surface, type View } from "../kit/model"

// Scenario 4 of the test demo: Kelly's Tuesday. Trevor replaced a brand rule on Monday (the dot
// darts like prey instead of gliding); her prototype and app design follow the old one, so Whyspace
// made her an update task. She reads the why, pastes the ready prompt into Claude Code, and the
// update follows Trevor's decision with nothing to confirm. Demo data only.

export const VIEWER = { id: "KL", name: "Kelly" }
export const PROJECTS = [{ id: "whiskr", name: "Whiskr" }, { id: "panel", name: "Cat owner panel" }, { id: "android", name: "Android app" }]
export const TODAY_LABEL = "Tuesday, October 27"
export const DAY = "Tue"
export const timeAt = clockFrom(11 * 60 + 4)

export const TREVOR_NEW = { who: "TR", title: "Make the dot dart like prey, with short stops", why: "In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.", when: "Monday", evidence: "Second cat test · Luna, Mochi, Biscuit · Monday" }
export const TREVOR_OLD = { who: "TR", title: "Move the dot in a smooth glide", why: "Smooth motion is easy for a paw to follow.", when: "Oct 22" }
export const REACH = [
  { name: "Whiskr prototype", owner: "KL", state: "Needs this update" },
  { name: "App design", owner: "KL", state: "Needs an update" },
  { name: "Promo video plan", owner: "MC", state: "Follows it" },
]
export const SEEN_BY = ["TR", "CH"]

export const TASK = { title: "Change the dot’s motion from a glide to short darts", description: "Whyspace made this task on Monday: your prototype and app design follow a decision Trevor replaced." }
export const PROMPT = "Use the Whyspace MCP to read the decision “Make the dot dart like prey, with short stops” in Whiskr’s Brand thread. Then change the dot’s motion in the swipe card and the match screen: short darts and stops instead of a glide. Keep its size and the purr."
export const LINES = [PROMPT]
export const LABEL = "Say to Claude Code"

// Her own task, beside the one Whyspace made.
export const MATCH_TASK = { title: "Build the match screen", description: "The screen after two cats match: both photos, the purr, and one line for the owners to set up a playdate.", prompt: "Continue the match screen in src/screens/match-screen.tsx: both cats’ photos side by side, the dot between them with the purr on load, and one button for the owners, “Set up a playdate”. Follow Whiskr’s decisions over the Whyspace MCP." }

// Home, the optional opener: who is working now, and the week so far.
export const WORKING_NOW = [
  { who: "MC", name: "Keller", thread: "Marketing", tool: "Claude", text: "Planning the promo video", since: "9:04" },
  { who: "TR", name: "Trevor", thread: "Brand", tool: "Perplexity", text: "Reading up on what cats see", since: "10:20" },
]
export const CATCH_UP = {
  week: "Monday: after the second cat test, Trevor replaced two brand rules. The brand is blue, not red, and the dot darts like prey instead of gliding. Christine saw both.",
  you: "For you: your prototype and app design still glide, so Whyspace made you an update task. Keller is planning the promo video on the new guidelines.",
}
export const THREADS = [
  { name: "Marketing", who: "MC", state: "Promo video plan, in progress" },
  { name: "Brand", who: "TR", state: "Guidelines v3, Monday" },
  { name: "App", who: "KL", state: "Match screen in progress" },
]

// The scripted run in Claude Code, one line at a time.
export type RunLine = { kind: "tool" | "read" | "edit" | "note" | "done"; text: string; sub?: string }
export const RUN: RunLine[] = [
  { kind: "tool", text: "whyspace · read_decision(“Make the dot dart like prey, with short stops”)", sub: "Trevor · Monday · confirmed · replaces “Move the dot in a smooth glide”" },
  { kind: "read", text: "Read src/dot/motion.ts, src/screens/match-screen.tsx" },
  { kind: "edit", text: "Update src/dot/motion.ts", sub: "glide(1200 ms) → dart: three steps of 220 ms, 140 ms stops" },
  { kind: "edit", text: "Update src/screens/match-screen.tsx", sub: "Dot size 24 and the purr unchanged" },
  { kind: "tool", text: "whyspace · record_decision", sub: "Whiskr prototype · The dot darts like prey, with short stops · follows Trevor’s decision" },
  { kind: "note", text: "Preview", sub: "http://localhost:5173/match" },
  { kind: "done", text: "The dot darts with short stops on the swipe card and the match screen. Size and purr unchanged." },
]
// The pill catches the line when the run records it.
const RECORD_AT = 5
const FOLLOWS: Omit<Caught, "when"> = { id: "dart", title: "Change the dot’s motion from a glide to short darts", kind: "prec", why: "Follows Trevor’s decision", hints: [] }

export type Page = "today" | "home"
export type Exchange = { me: string; at: string }

export type State = {
  surface: Surface
  page: Page
  taskOpen: boolean
  matchOpen: boolean
  exchanges: Exchange[]
  // How many lines of the run are on screen for the latest exchange.
  shown: number
  pending: boolean
  caught: Caught[]
  pill: { open: boolean; view: View }
  taskDone: boolean
  toast: string | null
}

export const INITIAL: State = { surface: "app", page: "today", taskOpen: false, matchOpen: false, exchanges: [], shown: 0, pending: false, caught: [], pill: { open: false, view: "needs" }, taskDone: false, toast: null }

export type Action =
  | { type: "surface"; to: Surface }
  | { type: "page"; to: Page }
  | { type: "task"; open: boolean }
  | { type: "match"; open: boolean }
  | { type: "send"; text: string }
  | { type: "step" }
  | { type: "confirm"; id: string; why: string }
  | { type: "pill"; open: boolean; view?: View }
  | { type: "taskDone" }
  | { type: "toast"; text: string | null }
  | { type: "restart" }

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "surface": return { ...s, surface: a.to, taskOpen: false, matchOpen: false }
    case "page": return { ...s, page: a.to }
    case "task": return { ...s, taskOpen: a.open }
    case "match": return { ...s, matchOpen: a.open }
    case "send": {
      if (s.pending) return s
      // The first prompt runs the update; later ones get a short reply.
      return { ...s, pending: true, shown: 0, exchanges: [...s.exchanges, { me: a.text, at: timeAt(s.exchanges.length) }] }
    }
    case "step": {
      const first = s.exchanges.length === 1
      if (!first) return { ...s, pending: false, shown: 1 }
      const shown = s.shown + 1
      const caught = shown === RECORD_AT && !s.caught.length ? [{ ...FOLLOWS, when: timeAt(0) }] : s.caught
      const finished = shown >= RUN.length
      return { ...s, shown, caught, pending: !finished, taskDone: s.taskDone || finished, toast: finished && !s.taskDone ? "Whyspace · the prototype follows Trevor’s decision now" : s.toast }
    }
    case "confirm": return { ...s, caught: s.caught.map((c) => (c.id === a.id ? { ...c, kind: "conf", why: a.why } : c)) }
    case "pill": return { ...s, pill: { open: a.open, view: a.view ?? s.pill.view } }
    case "taskDone": return { ...s, taskDone: true }
    case "toast": return { ...s, toast: a.text }
    case "restart": return INITIAL
  }
}

export function useScenario4(): [State, (a: Action) => void] {
  const [s, dispatch] = useReducer(reduce, INITIAL)
  useLater(s.pending, s.shown === 0 ? 900 : 550, () => dispatch({ type: "step" }), `${s.exchanges.length}-${s.shown}`)
  useLater(!!s.toast, 3200, () => dispatch({ type: "toast", text: null }), s.toast)
  return [s, dispatch]
}

export const LATER_REPLY = "Nothing else to change for that decision. The swipe card and the match screen both dart now."
