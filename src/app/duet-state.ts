import { useEffect, useSyncExternalStore } from "react"
import { DECISIONS, ME, MY_PROJECTS, PEOPLE, decisionById, patchDecision, subscribeData, type Decision } from "@/data"
import { DESIGN } from "@/lib/design"
import { SCENARIO } from "@/lib/scenario"
import { STAGE } from "@/lib/stage"
import { useStore } from "@/lib/store"
import type { Msg } from "@/playground/reply"
import { duetOf, sureOf, type DuetLine, type Sure } from "./duet"

// Your chats with your Duet, listed in the Duet tab. The open one takes questions from anywhere
// (Ask Duet on a decision starts a new one). Module state; nothing is kept across reloads.

// Duet settings: how your Duet treats a teammate's question.
export type Level = "answer" | "draft" | "off"
export const LEVELS: { value: Level; label: string; detail: string }[] = [
  { value: "answer", label: "Answer from my decisions", detail: "Answers from what you’ve confirmed. Anything else waits for you." },
  { value: "draft", label: "Draft for me", detail: "Writes a reply from your decisions. You send it." },
  { value: "off", label: "Off", detail: "Questions come straight to you." },
]

type State = {
  workspace: string | null
  // Your chats, latest first, and the open one. `msgs` is the open chat's messages.
  chats: DuetChat[]
  chat: string
  msgs: Msg[]
  model: string
  // A teammate's question you are answering in the conversation: your next message answers it.
  pendingAsk: string | null
  // Answers you typed for teammates' questions, by DuetLine id.
  answered: Record<string, string>
  level: Level
  // The teammate's question in the reply window. It stays set while the window closes, so it can animate out.
  reply: { id: string; open: boolean } | null
  // Answers you saved as decisions, by DuetLine id: the decision's id.
  saved: Record<string, string>
  // Conversations your Duet started between you and another owner (see together.ts), by id.
  together: Record<string, Together>
  // Decisions saved from answers, conversations and Slack messages, in order. Slack posts each to the
  // channel linked to its thread.
  posted: string[]
  // Your Duet answers for you in Slack while you're away. Needs Pro.
  slack: boolean
}

// `with`: the other owner. `typing`: they are answering. `saved`: the decision you both stand behind.
export type Together = { with: string; msgs: { who: string; text: string }[]; typing?: boolean; saved?: string }

// One chat with your Duet. The list names it by your first message in it; a chat Home's Open in
// Duet started is named after that card.
export type DuetChat = { id: string; msgs: Msg[] }
export function titleOf(c: DuetChat) {
  const m = c.msgs.find((x) => x.who === "me") ?? c.msgs[0]
  return !m ? "New chat" : m.who === "ai" && m.caught ? "While you were away" : m.text
}

let made = 0
const fresh = (): DuetChat => ({ id: `chat-${++made}`, msgs: [] })
const start = fresh()

let state: State = { workspace: null, chats: [start], chat: start.id, msgs: [], model: "Auto", pendingAsk: null, answered: {}, level: "answer", reply: null, saved: {}, together: {}, posted: [], slack: true }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }

export const subscribeDuet = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useDuetState = () => useSyncExternalStore(subscribeDuet, () => state)
// The open chat takes the messages and moves to the top of the list.
export const pushMsgs = (...m: Msg[]) => {
  const msgs = [...state.msgs, ...m]
  set({ msgs, chats: [{ id: state.chat, msgs }, ...state.chats.filter((c) => c.id !== state.chat)] })
}
// Changes one message in a chat, open or not (a streaming answer keeps filling in after you switch chats).
export function patchMsg(chatId: string, index: number, patch: Partial<Msg>) {
  const c = state.chats.find((x) => x.id === chatId)
  if (!c?.msgs[index]) return
  const msgs = c.msgs.map((m, i) => (i === index ? { ...m, ...patch } : m))
  set({ chats: state.chats.map((x) => (x.id === chatId ? { ...x, msgs } : x)), ...(state.chat === chatId && { msgs }) })
}
// A new chat, unless the open one is still empty.
export function newChat() {
  if (!state.msgs.length) return
  const c = fresh()
  set({ chat: c.id, msgs: [], pendingAsk: null, chats: [c, ...state.chats] })
}
// Leaving an empty chat drops it.
export function openChat(id: string) {
  const c = state.chats.find((x) => x.id === id)
  if (!c || id === state.chat) return
  set({ chat: id, msgs: c.msgs, pendingAsk: null, chats: state.chats.filter((x) => x.msgs.length || x.id === id) })
}
export const setModel = (model: string) => set({ model })
export const setPendingAsk = (pendingAsk: string | null) => set({ pendingAsk })
export const answerAsk = (id: string, text: string) => set({ answered: { ...state.answered, [id]: text }, pendingAsk: null })
export const setLevel = (level: Level) => set({ level })
export const openReply = (id: string) => set({ reply: { id, open: true } })
export const closeReply = () => set({ reply: state.reply && { ...state.reply, open: false } })
export const setSlack = (slack: boolean) => set({ slack })
export const getDuetState = () => state
const post = (id: string) => [...state.posted.filter((x) => x !== id), id]
export const markSaved = (askId: string, decisionId: string) => set({ saved: { ...state.saved, [askId]: decisionId }, posted: post(decisionId) })
export const markPosted = (decisionId: string) => set({ posted: post(decisionId) })
export function patchTogether(id: string, other: string, patch: (t: Together) => Partial<Together>) {
  const t = state.together[id] ?? { with: other, msgs: [] }
  const next = { ...t, ...patch(t) }
  set({ together: { ...state.together, [id]: next }, ...(next.saved && next.saved !== t.saved && { posted: post(next.saved) }) })
}

// A decision saved with two names keeps both, even when a tool records it again under the same id.
const NAMES: Record<string, string> = {}
export const keepNames = (id: string, by: string) => { NAMES[id] = by }
subscribeData(() => {
  for (const [id, by] of Object.entries(NAMES)) if (DECISIONS.some((d) => d.id === id && d.by !== by)) patchDecision(id, { by })
})

// A new workspace starts over with a new chat. The example workspace also has a few earlier chats.
export function useConversationFor(workspace: string | undefined, example?: boolean) {
  useEffect(() => {
    if (!workspace || state.workspace === workspace) return
    const c = fresh()
    set({ workspace, chat: c.id, msgs: [], pendingAsk: null, chats: [c, ...(example ? earlierChats() : [])] })
  }, [workspace, example])
}

// Earlier chats with your Duet in the example workspace (not in test scenarios), latest first. Each
// turn is your question, the answer, and the decisions the answer cites.
function earlierChats(): DuetChat[] {
  if (DESIGN !== "b" || SCENARIO || STAGE < 4 || !MY_PROJECTS.some((p) => p.id === "whiskr")) return []
  const studio = MY_PROJECTS.some((p) => p.id === "studio")
  const refs = (ids: string[]) => ids.map((id) => decisionById(id)).filter((d): d is Decision => !!d)
  type Turn = [question: string, answer: string, ...cites: string[]]
  const chat = (...turns: Turn[]): DuetChat => ({
    ...fresh(),
    msgs: turns.flatMap(([q, a, ...ids]): Msg[] => [{ who: "me", text: q }, { who: "ai", text: a, ...(ids.length ? { refs: refs(ids) } : {}) }]),
  })
  return [
    chat(
      ["Draft this week’s marketing update", "The promo video starts with a real cat clip. The blue title card and the 15 second length are still your guesses, so I left them out until you confirm them.", "pounce", "bluecard", "short"],
      ["Make it shorter for Slack", "Promo video update: it opens on a real cat clip. The title card and the length come once I confirm them."],
    ),
    chat(
      ["Do the posters need to change?", "Yes. Trevor changed the brand color from red to blue and said cats see the posters too. Your guess to make the posters blue isn’t confirmed yet.", "nored", "ch-posters"],
      ["And the end card?", "Your end card is still red, like the old logo, so it clashes with Trevor’s decision. You can talk it over with Trevor from Today.", "redcard", "nored"],
    ),
    chat(["How long should the promo video be?", "Your guess is 15 seconds, because cats lose interest fast. It isn’t confirmed yet, so I’m holding Trevor’s question about the length until you confirm it.", "short"]),
    chat(["What should the promo video open with?", "You decided to start it with a real cat clip. Seeing a real cat chase the screen explains the app in a second.", "pounce"]),
    ...(studio ? [
      chat(
        ["Catch me up on Recall", "We switched to a real AI loop: one working upload-to-feedback flow, because studio feedback asked us to test real model mistakes. Jordan’s guess to attach a source page to every answer explanation isn’t confirmed yet.", "figma", "cite"],
        ["What’s still open there?", "One decision, and it’s yours: how to split the demo and evaluation story for the final crit.", "presenter"],
      ),
      chat(["Why five practice questions?", "You decided to generate five practice questions from one course PDF. It’s a full loop two people can build and test by Nov 4.", "slides"]),
    ] : []),
    chat(["What does the logo look like now?", "Trevor added the swipe dot to the logo, so cats recognize it from the app. Its color changed from red to blue with the rest of the brand.", "dotbrand", "nored"]),
    chat(["How does the app get cats’ attention?", "It moves. In user testing, all 3 cats ignored the still card and chased anything that moved, so Kelly added a moving dot that shows cats where to swipe, with a purring sound.", "move", "dot", "purr"]),
  ]
}

export const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

// A line of what your Duet did: "told Kelly …" or "took …", lowercase so a sentence can start with it.
// `byYou`: you answered it yourself, in the reply window; otherwise `sure` says how sure your Duet was.
export type Handled = { id: string; who: string; text: string; decision?: string; project: string; when: string; day: DuetLine["day"]; byYou?: boolean; kind?: DuetLine["kind"]; where?: string; sure?: Sure }

// What your Duet did and what waits on you, in one project or all of them. A question is handled
// once you typed an answer, or once you confirmed the decision that answers it. A conversation the
// Duet started is handled once you and the other owner saved what you settled.
export function useDuetActivity(projectId?: string): { asked: DuetLine[]; handled: Handled[] } {
  const { confirmed } = useStore()
  const { answered, together } = useDuetState()
  const asked: DuetLine[] = []
  const handled: Handled[] = []
  for (const l of duetOf(ME.id)) {
    if (projectId && l.project !== projectId) continue
    if (l.kind === "answered") handled.push({ ...l, text: `told ${first(l.who)} ${l.text}`, sure: sureOf(l) })
    else if (l.kind === "precedent") handled.push({ ...l, text: `took ${l.text}`, sure: sureOf(l) })
    else if (answered[l.id]) handled.push({ ...l, text: `told ${first(l.who)}: ${answered[l.id]}`, when: "Just now", day: "today", byYou: true })
    // You confirmed the decision that answers it, so your Duet passed it on word for word.
    else if (l.decision && confirmed[l.decision]) handled.push({ ...l, text: `told ${first(l.who)}: ${decisionById(l.decision)?.title ?? l.text}`, when: "Just now", day: "today", sure: "sure" })
    else asked.push(l)
  }
  for (const [id, t] of Object.entries(together)) {
    const d = decisionById(t.saved)
    if (!d || (projectId && d.project !== projectId)) continue
    handled.push({ id: `s-${id}`, who: t.with, text: `and ${first(t.with)} settled: ${d.title}`, decision: d.id, project: d.project, when: "Just now", day: "today", byYou: true })
  }
  // Latest first: today before yesterday before earlier, "Just now" at the top of today.
  const rank = (h: Handled) => DAY_RANK[h.day] * 10000 + (h.when === "Just now" ? 9999 : minutes(h.when))
  return { asked, handled: handled.sort((a, b) => rank(b) - rank(a)) }
}

const DAY_RANK = { today: 2, yesterday: 1, earlier: 0 } as const
const minutes = (t: string) => { const [h, m] = t.split(":").map(Number); return Number.isNaN(h) ? 0 : h * 60 + (m || 0) }
