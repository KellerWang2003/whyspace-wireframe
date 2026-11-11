import { useSyncExternalStore } from "react"
import { DECISIONS, ME, MY_PROJECTS, PEOPLE, recordDecision, type Decision } from "@/data"
import { DESIGN } from "@/lib/design"
import { SCENARIO } from "@/lib/scenario"
import { STAGE } from "@/lib/stage"
import { DUET_LOG, sureOf, type DuetLine, type Sure } from "./duet"
import { answerAsk, first, getDuetState, subscribeDuet, useDuetActivity } from "./duet-state"
import { onToday } from "./today-model"
import { askTopicId, clashTopicId, sendTogether, topicOf, useTopics } from "./together"
import { threadsNow } from "./threads"

// Chats (the chat plan's row 4): Whyspace's own chat, a tab of its own in the rail, there with or
// without Slack. Chat belongs to people, not projects: DMs, plus groups anyone makes and links to the
// threads they talk about. Your Duet has its own tab, outside Chats. Each chat is one flat
// conversation with quote replies.
// A teammate's question to your Duet is their DM with you, the same conversation the reply window
// opens from Today. A conversation your Duet started between two owners is a DM (a clash) or a group
// (a question that touches someone else's decision). Decisions said in a group are caught as guesses
// for whoever said them, and an away teammate's Duet answers for them from their confirmed decisions.
// What was said in Slack stays in Slack.

export type Day = DuetLine["day"]

export type ChatMsg = {
  id: string
  who: string
  // Said by `who`'s Duet.
  duet?: boolean
  text: string
  day: Day
  // "9:05". Empty: no time shown.
  time: string
  // Sent while the prototype runs, in order. Shown as "Just now".
  seq?: number
  // A quote reply: the message it quotes, in the same chat.
  quote?: string
  // Decisions shown under the message.
  cards?: string[]
  // A Duet's answer: the decision it answered from. A Duet only answers while its person is away.
  from?: string
  // A guess caught from this message.
  caught?: string
  // A teammate's question to you (a DuetLine id). It counts as unread until you answer it.
  ask?: string
  // Your Duet's opening of a conversation it started (a together topic id).
  topic?: string
  // A note only you see.
  only?: boolean
  // A Duet's reply to a question in the same chat. It folds under the question (app/duet-reply.tsx).
  replyTo?: string
  // How sure the Duet was of a reply.
  sure?: Sure
}

// A thread a chat talks about. A decision caught in a group is filed in its first linked thread.
export type Link = { project: string; part: string }

export type Chat = {
  id: string
  kind: "dm" | "group"
  name: string
  // Everyone in it, you included.
  members: string[]
  links: Link[]
  // What was said before you opened the app.
  msgs: ChatMsg[]
}

// The groups the Whiskr week starts with. Only outside test scenarios, which bring their own chat
// (scenario 3's team talks in Slack), and from the promo video stage on, when everything they say exists.
const SEEDED = DESIGN === "b" && !SCENARIO && STAGE >= 4 && MY_PROJECTS.some((p) => p.id === "whiskr")

const GROUPS: Chat[] = [
  {
    id: "g-brand", kind: "group", name: "Brand team", members: ["MC", "TR", "KL"], links: [{ project: "whiskr", part: "Brand" }],
    msgs: [
      { id: "b1", who: "KL", text: "@Trevor do the posters keep the swipe dot?", day: "yesterday", time: "14:30" },
      { id: "b2", who: "TR", duet: true, text: "No decision of Trevor’s covers this yet, so I passed it to Trevor.", replyTo: "b1", day: "yesterday", time: "14:30" },
      { id: "b3", who: "KL", text: "@Trevor which blue should the app use?", day: "today", time: "9:30" },
      { id: "b4", who: "TR", duet: true, text: "The brand blue. Research found that cats can’t see red, so I changed the brand from red to blue.", cards: ["nored"], from: "nored", replyTo: "b3", sure: "sure", day: "today", time: "9:30" },
      { id: "b5", who: "MC", text: "Then the posters go blue too.", caught: "ch-posters", day: "today", time: "9:52" },
    ],
  },
  {
    id: "g-marketing", kind: "group", name: "Marketing team", members: ["MC", "CH", "KL"], links: [{ project: "whiskr", part: "Marketing" }],
    msgs: [
      { id: "m1", who: "CH", text: "Can we see a first cut of the promo video by Friday?", day: "yesterday", time: "16:40" },
      { id: "m2", who: "MC", text: "Yes. It’ll be 15 seconds.", quote: "m1", caught: "short", day: "yesterday", time: "16:52" },
      { id: "m3", who: "KL", text: "I can record the app screens for it.", day: "today", time: "10:20" },
    ],
  },
]

// Keller's line in the Brand team, caught as his guess. It waits for him in the chat, on Today and in Decisions.
const SEED_GUESSES: Decision[] = [
  { id: "ch-posters", project: "whiskr", part: "Brand", title: "Make the posters blue, like the brand", status: "inf", owner: "MC", by: "Keller", when: "Today", tool: "Chats", snippet: "Then the posters go blue too.", evidence: [{ kind: "chat", label: "Brand team", detail: "“Then the posters go blue too.”" }] },
]
if (SEEDED) for (const d of SEED_GUESSES) if (!DECISIONS.some((x) => x.id === d.id)) recordDecision(d)

// Who is away now. Their Duet answers for them when you write to them, or @ them in a group. Jordan
// is asleep in another time zone; everyone on Whiskr is online, so they answer for themselves.
const AWAY = new Set<string>(SEEDED ? ["JK"] : [])
export const isAway = (id: string) => AWAY.has(id)

// What the asker said, for questions the Duet log keeps only as a clause.
const QUESTION: Record<string, string> = {
  du1: "What does the promo video open on?",
  du4: "Does the demo show the failures too?",
  du5: "Why is the brand blue now?",
  du8: "Does the launch date move?",
  du9: "Who is Recall for?",
}

const sentence = (s: string) => {
  const t = s.trim()
  return t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? "" : ".")
}
const passedOn = (owner: string) => `No decision of ${first(owner)}’s covers this yet, so I passed it to ${first(owner)}.`

// The chat a line of the Duet log happened in. Lines said elsewhere (Slack) stay there.
export function chatOfLine(l: DuetLine): string | undefined {
  if (l.kind === "precedent" || l.where) return undefined
  if (l.owner === ME.id) return l.kind === "asked" && topicOf(askTopicId(l.id)) ? askTopicId(l.id) : `dm-${l.who}`
  if (l.who === ME.id) return `dm-${l.owner}`
  return undefined
}

// The chat a conversation the Duet started lives in: a clash is your DM with the other owner.
export function chatOfTopic(id: string): string | undefined {
  const t = topicOf(id)
  if (!t || t.ask?.where) return undefined
  return t.clash ? `dm-${t.other}` : t.id
}

const dm = (other: string): Chat => ({ id: `dm-${other}`, kind: "dm", name: PEOPLE[other]?.name ?? other, members: [ME.id, other], links: [], msgs: [] })

function lineMsgs(l: DuetLine): ChatMsg[] {
  const mine = l.owner === ME.id
  const topic = mine && l.kind === "asked" && l.touches ? topicOf(askTopicId(l.id)) : undefined
  const at = { day: l.day, time: l.when }
  const q = l.message ?? QUESTION[l.id]
  const msgs: ChatMsg[] = []
  if (q) msgs.push({ id: `${l.id}-q`, who: mine ? l.who : ME.id, text: q, ...at, ...(mine && l.kind === "asked" && { ask: l.id }) })
  if (topic) {
    const other = first(topic.other)
    msgs.push({ id: `${topic.id}-intro`, who: ME.id, duet: true, text: `No decision of ${first(ME.id)}’s covers this, and it touches ${other}’s decision, so I brought ${first(ME.id)} and ${other} in.`, cards: topic.decisions.map((d) => d.id), topic: topic.id, ...at })
  } else if (l.kind === "answered") {
    msgs.push({ id: `${l.id}-a`, who: l.owner, duet: true, text: sentence(l.text), ...(l.decision && { cards: [l.decision], from: l.decision }), ...(q && { replyTo: `${l.id}-q` }), sure: sureOf(l), ...at })
  } else {
    msgs.push({ id: `${l.id}-a`, who: l.owner, duet: true, text: passedOn(l.owner), ...(q && { replyTo: `${l.id}-q` }), ...at })
  }
  return msgs
}

const DAY_RANK = { today: 2, yesterday: 1, earlier: 0 } as const
const minutes = (t: string) => { const [h, m] = t.split(":").map(Number); return Number.isNaN(h) ? 0 : h * 60 + (m || 0) }
export const rankOf = (m: ChatMsg) => (m.seq !== undefined ? 30000 + m.seq : DAY_RANK[m.day] * 10000 + (m.time ? minutes(m.time) : 1439))

// Chats that exist when the app opens: the seeded groups, and every DM and conversation the Duet
// log implies. Your clashes open as your Duet's message in your DM with the other owner.
function startingChats(): Chat[] {
  const chats = new Map<string, Chat>()
  const get = (id: string, make: () => Chat) => chats.get(id) ?? chats.set(id, make()).get(id)!
  for (const l of DUET_LOG) {
    const id = chatOfLine(l)
    if (!id) continue
    const topic = id.startsWith("a-") ? topicOf(id) : undefined
    const chat = topic
      ? get(id, () => ({ id, kind: "group", name: topic.people.map(first).join(", "), members: [ME.id, ...topic.people], links: [{ project: topic.project, part: topic.part }], msgs: [] }))
      : get(id, () => dm(id.slice(3)))
    chat.msgs.push(...lineMsgs(l))
  }
  for (const d of DECISIONS) {
    if (d.owner !== ME.id || d.status !== "flag" || !d.clashes) continue
    const t = topicOf(clashTopicId(d.id))
    if (!t) continue
    get(`dm-${t.other}`, () => dm(t.other)).msgs.push({
      id: `${t.id}-intro`, who: ME.id, duet: true, text: `${first(ME.id)}’s decision clashes with ${first(t.other)}’s, so I brought you both in.`,
      cards: t.decisions.map((x) => x.id), topic: t.id, day: "today", time: "",
    })
  }
  const groups = SEEDED ? GROUPS.filter((g) => g.members.includes(ME.id)) : []
  return [...groups, ...chats.values()].map((c) => ({ ...c, msgs: [...c.msgs].sort((a, b) => rankOf(a) - rankOf(b)) }))
}
const BASE = DESIGN === "b" ? startingChats() : []

// What changes while the prototype runs: messages sent, chats made, links changed, the chat open last
// and who is typing. Module state, so the rail, the list and the chat stay in step.
export type ChatsState = {
  log: Record<string, ChatMsg[]>
  made: Chat[]
  links: Record<string, Link[]>
  last?: string
  typing: Record<string, string | undefined>
}
let state: ChatsState = { log: {}, made: [], links: {}, typing: {} }
let seq = 0
const listeners = new Set<() => void>()
const set = (patch: Partial<ChatsState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useChatsState = () => useSyncExternalStore(subscribe, () => state)

let cache: { made: Chat[]; links: ChatsState["links"]; chats: Chat[] } | null = null
const chatsOf = (s: ChatsState) => {
  if (cache?.made !== s.made || cache.links !== s.links) cache = { made: s.made, links: s.links, chats: [...BASE, ...s.made].map((c) => (s.links[c.id] ? { ...c, links: s.links[c.id] } : c)) }
  return cache.chats
}
export const useChats = () => chatsOf(useChatsState())
export const chatById = (id?: string) => chatsOf(state).find((c) => c.id === id)
export const msgsOf = (chat: Chat, s: ChatsState = state) => [...chat.msgs, ...(s.log[chat.id] ?? [])]
// The chat the rail opens: the one open last, else the latest.
export const lastChat = () => {
  const chats = chatsOf(state)
  if (chats.some((c) => c.id === state.last)) return state.last
  return [...chats].sort((a, b) => activityOf(b, state) - activityOf(a, state))[0]?.id
}
export const setLastChat = (id: string) => { if (state.last !== id) set({ last: id }) }
// When each chat you made was made, so a new chat sorts to the top of the list.
const MADE = new Map<string, number>()
// The latest activity in a chat, for the list's order.
export const activityOf = (chat: Chat, s: ChatsState) => Math.max(MADE.has(chat.id) ? 30000 + MADE.get(chat.id)! : -1, ...msgsOf(chat, s).map(rankOf))

function append(chatId: string, ...msgs: Omit<ChatMsg, "id" | "day" | "time" | "seq">[]): ChatMsg[] {
  const added = msgs.map((m) => ({ ...m, id: `live-${++seq}`, day: "today" as const, time: "", seq }))
  set({ log: { ...state.log, [chatId]: [...(state.log[chatId] ?? []), ...added] } })
  return added
}
function patchMsg(chatId: string, id: string, patch: Partial<ChatMsg>) {
  set({ log: { ...state.log, [chatId]: (state.log[chatId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)) } })
}

// Questions to you that still wait, and conversations your Duet started that are still open: one
// count per chat. Only asks to you count as unread.
export function useUnread(): Record<string, number> {
  const { asked } = useDuetActivity()
  const topics = useTopics()
  const counts: Record<string, number> = {}
  const add = (id?: string) => { if (id) counts[id] = (counts[id] ?? 0) + 1 }
  for (const l of asked) if (onToday(l.id, "other")) add(chatOfLine(l))
  for (const t of topics) if (t.clash && onToday(t.clash.id, "decision")) add(chatOfTopic(t.id))
  return counts
}

// The messages in a chat still waiting on you: questions and conversations your Duet opened.
export function usePending(msgs: ChatMsg[]): ChatMsg[] {
  const { asked } = useDuetActivity()
  const topics = useTopics()
  const waiting = new Set(asked.map((l) => l.id))
  const open = new Set(topics.map((t) => t.id))
  return msgs.filter((m) => (m.ask && waiting.has(m.ask)) || (m.topic && open.has(m.topic)))
}

// You write in a chat. In a conversation your Duet started, it goes to the other owner. Quoting a
// teammate's question answers it, so Today and the reply window see the answer too. Anything else is
// a message: in a group, a decision in it is caught as your guess; to someone away, their Duet answers.
export function sendChat(chat: Chat, text: string, quoteId?: string) {
  const words = text.trim()
  if (!words) return
  const quoted = msgsOf(chat).find((m) => m.id === quoteId)
  const s = getDuetState()
  const topicId = chat.id.startsWith("a-") ? chat.id : quoted?.topic
  const topic = topicId && !s.together[topicId]?.saved ? topicOf(topicId) : undefined
  if (topic) return sendTogether(topic, words)
  if (quoted?.ask && !s.answered[quoted.ask]) return answerAsk(quoted.ask, words)
  const [msg] = append(chat.id, { who: ME.id, text: words, quote: quoted?.id })
  if (chat.kind === "group") catchGuess(chat, msg)
  for (const p of addressed(chat, words)) if (isAway(p)) duetAnswers(chat, p, words, msg.id)
}

// Who a message is to: the other person in a DM, the people it @s in a group.
const addressed = (chat: Chat, text: string) => chat.members.filter((p) => p !== ME.id && (chat.kind === "dm" || new RegExp(`@${first(p)}\\b`, "i").test(text)))

// An away teammate's Duet answers from their confirmed decisions, or passes the question to them.
function duetAnswers(chat: Chat, person: string, question: string, replyTo: string) {
  set({ typing: { ...state.typing, [chat.id]: person } })
  setTimeout(() => {
    const d = answerFrom(person, question)
    append(chat.id, d ? { who: person, duet: true, text: d.why ?? sentence(d.title), cards: [d.id], from: d.id, replyTo, sure: "sure" } : { who: person, duet: true, text: passedOn(person), replyTo })
    set({ typing: { ...state.typing, [chat.id]: undefined } })
  }, 1200)
}

const STOP = new Set(["why", "what", "the", "and", "for", "how", "who", "are", "was", "there", "this", "that", "with", "about", "does", "should", "can", "will", "you", "your", "have", "has", "too", "any", "our", "did", "its", "it’s"])
function answerFrom(person: string, question: string): Decision | undefined {
  const words = question.toLowerCase().replace(/@\w+/g, " ").split(/[^\w’']+/).filter((w) => w.length > 2 && !STOP.has(w))
  const score = (d: Decision) => words.filter((w) => new RegExp(`\\b${w.replace(/\W/g, "")}`).test(`${d.title} ${d.why ?? ""}`.toLowerCase())).length
  return DECISIONS
    .filter((d) => d.owner === person && (d.status === "conf" || d.status === "chg") && score(d) > 0)
    .sort((a, b) => score(b) - score(a))[0]
}

// A decision said in a group, caught as a guess for whoever said it, in the group's first linked
// thread. "Let's …", "We'll …", "Use …", "Make …" and the like; a question is never one.
const LEAD = /^(?:(?:then|ok|okay|so|yes|yeah|agreed|fine|great|good)[,.!]?\s+)+/i
const CUE = /^(?:let['’]s|we['’]ll|we will|we should|go with|use|make|keep|add|change|drop|ship|start|switch|launch|put|move|show|cut|post|print)\b/i
export function guessOf(text: string): string | undefined {
  const t = text.trim().replace(LEAD, "")
  if (!CUE.test(t) || /\?\s*$/.test(t)) return undefined
  const title = t.replace(/^(?:let['’]s|we['’]ll|we will|we should)\s+/i, "").replace(/[.!\s]+$/, "")
  return title.charAt(0).toUpperCase() + title.slice(1)
}
function catchGuess(chat: Chat, msg: ChatMsg) {
  const title = guessOf(msg.text)
  const link = (state.links[chat.id] ?? chat.links)[0]
  if (!title || !link) return
  const id = `ch-${msg.id}`
  recordDecision({
    id, project: link.project, part: link.part, title, status: "inf", owner: msg.who, by: PEOPLE[msg.who]?.name, when: "Today", tool: "Chats",
    snippet: msg.text, evidence: [{ kind: "chat", label: chat.name, detail: `“${msg.text}”` }],
  })
  patchMsg(chat.id, msg.id, { caught: id })
}

// A new chat: one person and no name is a DM (the one you have, if any); anything else is a group.
export function makeChat(people: string[], name: string, links: Link[]): string {
  const others = [...new Set(people)].filter((p) => p !== ME.id)
  const all = chatsOf(state)
  if (others.length === 1 && !name.trim()) {
    const id = `dm-${others[0]}`
    if (!all.some((c) => c.id === id)) { MADE.set(id, ++seq); set({ made: [...state.made, { ...dm(others[0]), links }] }) }
    return id
  }
  const id = `g-${++seq}`
  MADE.set(id, seq)
  set({ made: [...state.made, { id, kind: "group", name: name.trim() || others.map(first).join(", "), members: [ME.id, ...others], links, msgs: [] }] })
  return id
}
export const setLinks = (chatId: string, links: Link[]) => set({ links: { ...state.links, [chatId]: links } })

// The threads a chat can link to: every thread of your projects.
export const linkOptions = (): (Link & { name: string })[] =>
  MY_PROJECTS.flatMap((p) => threadsNow(p.id).filter((t) => !t.archived).map((t) => ({ project: p.id, part: t.part, name: t.name })))

// Answers and conversations from the reply window, Today or Slack land in their chat too, in order:
// the answer you sent, the decision you saved from it, and what you and the other owner said.
const seen = { answered: new Set<string>(), saved: new Set<string>(), together: {} as Record<string, number>, settled: new Set<string>() }
function mirror() {
  const s = getDuetState()
  const lineChat = (id: string) => { const l = DUET_LOG.find((x) => x.id === id); return l && chatOfLine(l) }
  for (const [id, text] of Object.entries(s.answered)) {
    if (seen.answered.has(id)) continue
    seen.answered.add(id)
    const chat = lineChat(id)
    // In a conversation your Duet started, the answer is one of its messages, below.
    if (chat && !chat.startsWith("a-")) append(chat, { who: ME.id, text, quote: `${id}-q` })
  }
  for (const [id, decision] of Object.entries(s.saved)) {
    if (seen.saved.has(id)) continue
    seen.saved.add(id)
    const chat = lineChat(id)
    if (chat) append(chat, { who: ME.id, duet: true, only: true, text: "Saved as your decision. Next time I can answer this.", cards: [decision] })
  }
  for (const [id, t] of Object.entries(s.together)) {
    const chat = chatOfTopic(id)
    const from = seen.together[id] ?? 0
    seen.together[id] = t.msgs.length
    if (chat) t.msgs.slice(from).forEach((m, i) => append(chat, { who: m.who, text: m.text, ...(from + i === 0 && m.who === ME.id && { quote: `${id}-intro` }) }))
    if (t.saved && !seen.settled.has(id)) {
      seen.settled.add(id)
      if (chat) append(chat, { who: ME.id, duet: true, text: "Saved with both your names.", cards: [t.saved] })
    }
  }
}
if (DESIGN === "b") subscribeDuet(mirror)

// Duet replies fold under the questions they answer (Keller's pick, Nov 11): `shown` is the chat without
// them, `replyOf` finds a question's reply.
export function foldReplies(msgs: ChatMsg[]) {
  const ids = new Set(msgs.map((m) => m.id))
  const replies = new Map<string, ChatMsg>()
  for (const m of msgs) if (m.duet && m.replyTo && ids.has(m.replyTo)) replies.set(m.replyTo, m)
  const folded = new Set([...replies.values()].map((m) => m.id))
  return { shown: msgs.filter((m) => !folded.has(m.id)), replyOf: (id: string) => replies.get(id) }
}
