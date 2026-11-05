import { useReducer } from "react"
import { clockFrom, useLater } from "../kit/model"

// Scenario 3 of the test demo: Keller's Thursday, his Duet needs him. Overnight two teammates asked
// his Duet things. One it can't answer (no decision of his covers it), one it drafted from a guess
// and won't send without him. He also asks his Duet what changed in the app. Demo data only.

export const VIEWER = { id: "MC", name: "Keller" }
export const PROJECTS = [{ id: "whiskr", name: "Whiskr" }, { id: "studio", name: "AI Studio · Recall" }, { id: "holiday", name: "Holiday campaign" }]
export const TODAY_LABEL = "Thursday, October 29"
export const timeAt = clockFrom(9 * 60 + 4)

export const LINES = [
  "Yes. The posters go up on Monday, the video follows on launch day.",
  "What changed in the app this week?",
]
export const LABELS = ["Say to Christine", "Ask your Duet"]

export const CHRISTINE = { who: "CH", asked: "whether the posters go up before the video", when: "8:30", decision: "Put the posters up before the video" }
export const KELLY = { who: "KL", asked: "whether the video uses the dot’s purr", when: "Yesterday 17:40", draft: "Yes, the plan adds the purr when the dot moves.", guess: "Add a purr when the dot moves in the video", hint: "The dot purrs in the app" }

export type Msg = { who: "me" | "duet"; text: string; at: string; turn: number }
export type Page = "today" | "duet"

export type State = {
  page: Page
  panelOpen: boolean
  answerOpen: boolean
  // What you told Christine, once you did; your why for the purr, once you confirmed it.
  christine: string | null
  kelly: string | null
  msgs: Msg[]
  pending: boolean
  toast: string | null
}

export const INITIAL: State = { page: "today", panelOpen: false, answerOpen: false, christine: null, kelly: null, msgs: [], pending: false, toast: null }

export type Action =
  | { type: "page"; to: Page }
  | { type: "panel"; open: boolean }
  | { type: "answer"; open: boolean }
  | { type: "tellChristine"; text: string }
  | { type: "confirmKelly"; why: string }
  | { type: "ask"; text: string }
  | { type: "replied" }
  | { type: "toast"; text: string | null }
  | { type: "restart" }

export const asked = (s: State) => s.msgs.filter((m) => m.who === "me").length
// The tester's next line: Christine's answer first, then the question to the Duet.
export const stepOf = (s: State) => (s.christine === null ? 0 : asked(s) === 0 ? 1 : 2)
export const waiting = (s: State) => (s.christine === null ? 1 : 0) + (s.kelly === null ? 1 : 0)

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "page": return { ...s, page: a.to, panelOpen: false }
    case "panel": return { ...s, panelOpen: a.open }
    case "answer": return { ...s, answerOpen: a.open }
    case "tellChristine": return { ...s, christine: a.text, answerOpen: false, toast: "Told Christine. Kept as your decision." }
    case "confirmKelly": return { ...s, kelly: a.why, toast: "Told Kelly. The purr is confirmed in the plan." }
    case "ask": {
      if (s.pending) return s
      const turn = asked(s)
      return { ...s, pending: true, msgs: [...s.msgs, { who: "me", text: a.text, at: timeAt(turn), turn }] }
    }
    case "replied": {
      const turn = asked(s) - 1
      return { ...s, pending: false, msgs: [...s.msgs, { who: "duet", text: "", at: timeAt(turn), turn }] }
    }
    case "toast": return { ...s, toast: a.text }
    case "restart": return INITIAL
  }
}

export function useScenario3(): [State, (a: Action) => void] {
  const [s, dispatch] = useReducer(reduce, INITIAL)
  useLater(s.pending, 1000, () => dispatch({ type: "replied" }), s.msgs.length)
  useLater(!!s.toast, 2800, () => dispatch({ type: "toast", text: null }), s.toast)
  return [s, dispatch]
}

// What your Duet says back, by turn. It answers from the record, with the decisions it read.
export type Part =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "decisions"; rows: { title: string; who: string; sub: string }[] }

export function replyParts(turn: number): Part[] {
  if (turn === 0) return [
    { kind: "text", text: "Two things, both from Trevor’s second cat test on Monday." },
    { kind: "decisions", rows: [
      { title: "Change the brand color from red to blue", who: "TR", sub: "Kelly changed the app on Tuesday · cats can’t see red" },
      { title: "Make the dot dart like prey, with short stops", who: "TR", sub: "Kelly changed the motion on Tuesday · all three cats pounced on the darting dot" },
    ] },
    { kind: "text", muted: true, text: "Both are confirmed. Nothing in the App thread waits on you." },
  ]
  return [{ kind: "text", text: "Nothing else changed in the app this week. Kelly is building the match screen; the dot purrs when it moves, as before." }]
}
