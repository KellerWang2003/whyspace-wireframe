import { useEffect, useSyncExternalStore } from "react"
import { ME, PEOPLE, decisionById } from "@/data"
import { useStore } from "@/lib/store"
import type { Msg } from "@/playground/reply"
import { duetOf, type DuetLine } from "./duet"

// One conversation with your Duet, shared by the corner panel and the Duet page. Module state, so
// the two surfaces are one conversation; nothing is kept across reloads.

type State = {
  workspace: string | null
  msgs: Msg[]
  model: string
  // A teammate's question you are answering in the conversation: your next message answers it.
  pendingAsk: string | null
  // Answers you typed for teammates' questions, by DuetLine id.
  answered: Record<string, string>
  // The switch on the Duet page: whether it answers teammates from your decisions at all.
  answersOn: boolean
}

let state: State = { workspace: null, msgs: [], model: "Auto", pendingAsk: null, answered: {}, answersOn: true }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }

export const useDuetState = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
export const pushMsgs = (...m: Msg[]) => set({ msgs: [...state.msgs, ...m] })
export const setModel = (model: string) => set({ model })
export const setPendingAsk = (pendingAsk: string | null) => set({ pendingAsk })
export const answerAsk = (id: string, text: string) => set({ answered: { ...state.answered, [id]: text }, pendingAsk: null })
export const setAnswersOn = (answersOn: boolean) => set({ answersOn })

// A new workspace starts a new conversation.
export function useConversationFor(workspace: string | undefined) {
  useEffect(() => { if (workspace && state.workspace !== workspace) set({ workspace, msgs: [], pendingAsk: null }) }, [workspace])
}

export const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

// A line of what your Duet did: "told Kelly …" or "took …", lowercase so a sentence can start with it.
export type Handled = { id: string; who: string; text: string; decision?: string; project: string; when: string; day: DuetLine["day"] }

// What your Duet did and what waits on you, in one project or all of them. A question is handled
// once you typed an answer, or once you confirmed the decision that answers it.
export function useDuetActivity(projectId?: string): { asked: DuetLine[]; handled: Handled[] } {
  const { confirmed } = useStore()
  const { answered } = useDuetState()
  const asked: DuetLine[] = []
  const handled: Handled[] = []
  for (const l of duetOf(ME.id)) {
    if (projectId && l.project !== projectId) continue
    if (l.kind === "answered") handled.push({ ...l, text: `told ${first(l.who)} ${l.text}` })
    else if (l.kind === "precedent") handled.push({ ...l, text: `took ${l.text}` })
    else if (answered[l.id]) handled.push({ ...l, text: `told ${first(l.who)}: ${answered[l.id]}`, when: "Just now", day: "today" })
    else if (l.decision && confirmed[l.decision]) handled.push({ ...l, text: `told ${first(l.who)}: ${decisionById(l.decision)?.title ?? l.text}`, when: "Just now", day: "today" })
    else asked.push(l)
  }
  // Latest first: today before yesterday before earlier, "Just now" at the top of today.
  const rank = (h: Handled) => DAY_RANK[h.day] * 10000 + (h.when === "Just now" ? 9999 : minutes(h.when))
  return { asked, handled: handled.sort((a, b) => rank(b) - rank(a)) }
}

const DAY_RANK = { today: 2, yesterday: 1, earlier: 0 } as const
const minutes = (t: string) => { const [h, m] = t.split(":").map(Number); return Number.isNaN(h) ? 0 : h * 60 + (m || 0) }
