import { useReducer } from "react"
import type { Mark } from "@/lib/marks"
import { clockFrom, guesses, useLater, type Caught, type Surface, type View } from "../kit/model"

// Scenario 2 of the test demo: Keller's Wednesday, making the video in Runway. He looks at what
// Trevor changed in the brand guidelines, starts the task in Runway with the ready prompt, adds one
// touch of his own and shares the cut. Demo data only; nothing touches the app's store.

export const VIEWER = { id: "MC", name: "Keller" }
export const PROJECTS = [{ id: "whiskr", name: "Whiskr" }, { id: "studio", name: "AI Studio · Recall" }, { id: "holiday", name: "Holiday campaign" }]
export const TODAY_LABEL = "Wednesday, October 28"
export const DAY = "Wed"
export const timeAt = clockFrom(10 * 60 + 2)

export const TASK = { title: "Make the promo video", due: "Friday", description: "The 15-second launch cut, from yesterday’s plan and Trevor’s brand guidelines." }
export const PROMPT = "Use the Whyspace MCP to read Whiskr’s Marketing thread: the promo video plan, its decisions and brand guidelines v3. Set up the 15-second video from the plan’s shot list: open on Luna’s clip at 0:42, blue title and end cards, no red, end on the dot darting like prey. Ask me before changing anything already decided."
export const LINES = [
  PROMPT,
  "Add a slow zoom on Luna’s pounce in the opening shot, so the eye lands on her first.",
  "Export it and share it to the Marketing thread.",
]
export const LABEL = "Say to Runway"

// Trevor's brand guidelines, v3 since Monday, and the decisions on their card.
export type BrandDecision = { id: string; title: string; why: string; when: string }
export const BRAND: BrandDecision[] = [
  { id: "blue", title: "Change the brand color from red to blue", why: "Research found that cats can’t see red. Blue is the color they see best.", when: "Monday" },
  { id: "dart", title: "Make the dot dart like prey, with short stops", why: "In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.", when: "Monday" },
  { id: "logo", title: "Add the swipe dot to the logo", why: "Cats already know the dot from the app, so they’ll recognize the logo.", when: "Oct 22" },
]
export const DECK_PAGES = ["Cover", "Color", "Logo", "Motion", "Type"] as const

// Yesterday's plan: four lines confirmed, the purr still a guess.
export const PLAN: { title: string; mark: Mark; why: string }[] = [
  { title: "Make the promo video 15 seconds", mark: "filled", why: "Cats lose interest fast" },
  { title: "Start the promo video with Luna’s real clip", mark: "filled", why: "Shows the idea in the first second" },
  { title: "Use blue as the brand color throughout", mark: "ringed", why: "Follows Trevor’s decision" },
  { title: "End the promo video on the moving dot", mark: "filled", why: "The dot is the app" },
  { title: "Add a purr when the dot moves in the video", mark: "empty", why: "" },
]
export const planCount = () => `${PLAN.filter((p) => p.mark !== "empty").length} of ${PLAN.length} confirmed`

// What the cut follows once Runway set it up: the plan and Trevor's brand decisions. Nothing to confirm.
const FOLLOWS: Omit<Caught, "when">[] = [
  { id: "f-len", title: "Make the promo video 15 seconds", kind: "prec", why: "Follows your plan", hints: [] },
  { id: "f-luna", title: "Open on Luna’s real clip, the pounce at 0:42", kind: "prec", why: "Follows your plan", hints: [] },
  { id: "f-blue", title: "Use blue for the title and end cards", kind: "prec", why: "Follows Trevor’s decision", hints: [] },
  { id: "f-dot", title: "End on the dot", kind: "prec", why: "Follows your plan", hints: [] },
  { id: "f-dart", title: "Make the dot dart like prey, with short stops", kind: "prec", why: "Follows Trevor’s decision", hints: [] },
  { id: "f-logo", title: "Put the logo with the dot on the end card", kind: "prec", why: "Follows Trevor’s decision", hints: [] },
]
const ZOOM: Omit<Caught, "when"> = { id: "zoom", title: "Add a slow zoom on Luna’s pounce", kind: "guess", hints: ["So the eye lands on her first"] }

export type Shot = { at: string; title: string; note: string }
export const SHOTS: Shot[] = [
  { at: "0:00", title: "Luna’s pounce", note: "Test clip, 0:42" },
  { at: "0:04", title: "Title card", note: "Blue, white type" },
  { at: "0:08", title: "The swipe card", note: "The dot darts, with stops" },
  { at: "0:13", title: "End card", note: "Blue, the logo with the dot" },
]

export type Turn = "setup" | "zoom" | "export" | "more"
// The reply follows the turn: the first line sets the cut up, a line about exporting or sharing
// ships it, anything else in between is the tester's own touch.
export function turnOf(text: string, i: number, hadZoom: boolean): Turn {
  if (i === 0) return "setup"
  if (/export|share|send/i.test(text)) return "export"
  return hadZoom ? "more" : "zoom"
}

export type Exchange = { me: string; at: string; turn: Turn }
export type Page = "today" | "artifacts"

export type State = {
  surface: Surface
  page: Page
  taskOpen: boolean
  deckOpen: boolean
  reviewOpen: boolean
  exchanges: Exchange[]
  pending: boolean
  caught: Caught[]
  pill: { open: boolean; view: View }
  checkIds: string[]
  shared: boolean
  checkClosed: boolean
  taskDone: boolean
  toast: string | null
  auto: "check" | null
}

export const INITIAL: State = {
  surface: "app", page: "today", taskOpen: false, deckOpen: false, reviewOpen: false,
  exchanges: [], pending: false, caught: [], pill: { open: false, view: "needs" }, checkIds: [],
  shared: false, checkClosed: false, taskDone: false, toast: null, auto: null,
}

export type Action =
  | { type: "surface"; to: Surface }
  | { type: "page"; to: Page }
  | { type: "task"; open: boolean }
  | { type: "deck"; open: boolean }
  | { type: "review"; open: boolean }
  | { type: "send"; text: string }
  | { type: "replied" }
  | { type: "confirm"; id: string; why: string }
  | { type: "pill"; open: boolean; view?: View }
  | { type: "checkDone" }
  | { type: "taskDone" }
  | { type: "toast"; text: string | null }
  | { type: "restart" }

export const hasCut = (s: State) => s.exchanges.some((x) => x.turn === "setup" && !(s.pending && x === s.exchanges[s.exchanges.length - 1]))
const defaultView = (s: State): View => (s.shared && !s.checkClosed ? "check" : "needs")

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "surface": return { ...s, surface: a.to, taskOpen: false, deckOpen: false }
    case "page": return { ...s, page: a.to }
    case "task": return { ...s, taskOpen: a.open }
    case "deck": return { ...s, deckOpen: a.open }
    case "review": return a.open ? { ...s, reviewOpen: true, checkIds: guesses(s.caught).map((c) => c.id) } : { ...s, reviewOpen: false }
    case "send": {
      if (s.pending) return s
      const i = s.exchanges.length
      const turn = turnOf(a.text, i, s.exchanges.some((x) => x.turn === "zoom"))
      return { ...s, pending: true, exchanges: [...s.exchanges, { me: a.text, at: timeAt(i), turn }] }
    }
    case "replied": {
      const i = s.exchanges.length - 1
      const turn = s.exchanges[i]?.turn
      const when = timeAt(i)
      if (turn === "setup") return { ...s, pending: false, caught: [...s.caught, ...FOLLOWS.map((c) => ({ ...c, when }))] }
      if (turn === "zoom") return { ...s, pending: false, caught: [...s.caught, { ...ZOOM, when }] }
      if (turn === "export") {
        const ids = guesses(s.caught).map((c) => c.id)
        return { ...s, pending: false, shared: true, taskDone: true, checkIds: ids, toast: "Exported and shared to Whiskr · Marketing", auto: ids.length ? "check" : null }
      }
      return { ...s, pending: false }
    }
    case "confirm": return { ...s, caught: s.caught.map((c) => (c.id === a.id ? { ...c, kind: "conf", why: a.why } : c)) }
    case "pill": {
      const view = a.view ?? (a.open ? defaultView(s) : s.pill.view)
      const checkClosed = s.checkClosed || (!a.open && s.pill.open && s.pill.view === "check")
      return { ...s, pill: { open: a.open, view }, checkClosed, auto: null }
    }
    case "checkDone": return { ...s, checkClosed: true, pill: { ...s.pill, open: false }, reviewOpen: false }
    case "taskDone": return { ...s, taskDone: true }
    case "toast": return { ...s, toast: a.text }
    case "restart": return INITIAL
  }
}

export function useScenario2(): [State, (a: Action) => void] {
  const [s, dispatch] = useReducer(reduce, INITIAL)
  useLater(s.pending, 1100, () => dispatch({ type: "replied" }), s.exchanges.length)
  useLater(s.auto === "check", 800, () => dispatch({ type: "pill", open: true, view: "check" }))
  useLater(!!s.toast, 2800, () => dispatch({ type: "toast", text: null }), s.toast)
  return [s, dispatch]
}

// What Runway says back, by turn.
export type Part =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "thread" }
  | { kind: "follows" }
  | { kind: "record"; ids: string[] }
  | { kind: "export" }

export function replyParts(turn: Turn): Part[] {
  if (turn === "setup") return [
    { kind: "thread" },
    { kind: "text", text: "Set up from the plan: 15 seconds, four shots. Luna’s pounce from the test clip, a blue title card, the swipe card with the darting dot, and a blue end card with the logo." },
    { kind: "follows" },
    { kind: "text", muted: true, text: "Nothing in it is new. Say what to change, or export." },
  ]
  if (turn === "zoom") return [
    { kind: "text", text: "Added a slow push-in on Luna over the first four seconds. The rest of the cut is unchanged." },
    { kind: "record", ids: ["zoom"] },
  ]
  if (turn === "export") return [
    { kind: "export" },
    { kind: "text", text: "Exported in 9:16 and 16:9 and shared to Whiskr’s Marketing thread." },
  ]
  return [{ kind: "text", text: "Done. Anything else for the cut?" }]
}

// The project's artifacts, by thread, for the Artifacts page.
export type ArtifactRow = { id: string; name: string; kind: string; owner: string; when: string; marks?: Mark[]; note?: string; deck?: boolean }
export const ARTIFACTS: { thread: string; items: ArtifactRow[] }[] = [
  { thread: "Brand", items: [{ id: "w1", name: "Brand guidelines v3", kind: "Figma", owner: "TR", when: "Monday", marks: ["filled", "filled", "filled"], deck: true }] },
  { thread: "Research", items: [
    { id: "w3", name: "Cat test videos", kind: "Video", owner: "TR", when: "Oct 21" },
    { id: "w2", name: "Cat research", kind: "AI output", owner: "TR", when: "Monday" },
  ] },
  { thread: "App", items: [
    { id: "w5", name: "Whiskr prototype", kind: "Prototype", owner: "KL", when: "Yesterday", marks: ["filled", "filled", "ringed", "ringed"] },
    { id: "w4", name: "App design", kind: "Figma", owner: "KL", when: "Yesterday", marks: ["filled", "ringed"] },
  ] },
  { thread: "Marketing", items: [
    { id: "w7", name: "Promo video plan", kind: "Doc", owner: "MC", when: "Yesterday", marks: PLAN.map((p) => p.mark) },
    { id: "w6", name: "Posters", kind: "Figma", owner: "MC", when: "Oct 20", note: "Still red · needs an update" },
  ] },
]
