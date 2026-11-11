import { DECISIONS, ME, PEOPLE, addLinks, decisionById, recordDecision, type Decision } from "@/data"
import { useStore } from "@/lib/store"
import { DUET_LOG, TOGETHER, type DuetLine } from "./duet"
import { answerAsk, first, getDuetState, keepNames, markPosted, markSaved, patchTogether, useDuetState } from "./duet-state"

// Bring people together (the chat plan's row 2). When a question to your Duet touches someone else's
// decision, or a decision of yours clashes with a teammate's, your Duet starts one conversation with
// both owners, each decision and its why on top. What you settle there is saved as one decision with
// both names. The conversation opens in the reply window, and in Slack when the team uses it.
// Also here: saving an answer or a Slack message as a decision, so the record grows from real answers.

export type Topic = {
  // "x-<your clashing decision>" or "a-<the question>".
  id: string
  project: string
  // The thread the settled decision goes to.
  part: string
  // The other owner, who answers in the conversation.
  other: string
  // Everyone in it besides you: the teammate who asked, if anyone, then the other owner.
  people: string[]
  // Each decision with its why, yours first.
  decisions: Decision[]
  ask?: DuetLine
  clash?: Decision
}

export const clashTopicId = (decisionId: string) => `x-${decisionId}`
export const askTopicId = (lineId: string) => `a-${lineId}`
export const isTopicId = (id?: string | null) => !!id && /^[xa]-/.test(id)
// The question a conversation started from ("a-du11" → "du11").
export const askOfTopic = (id?: string | null) => (id?.startsWith("a-") ? id.slice(2) : undefined)

export function topicOf(id: string): Topic | undefined {
  const script = TOGETHER[id]
  const shown = (fallback: (Decision | undefined)[]) => (script?.decisions?.map((x) => decisionById(x)) ?? fallback).filter((d): d is Decision => !!d)
  if (id.startsWith("x-")) {
    const mine = DECISIONS.find((d) => d.id === id.slice(2))
    const theirs = decisionById(mine?.clashes)
    if (!mine || !theirs) return undefined
    return { id, project: mine.project, part: mine.part, other: theirs.owner, people: [theirs.owner], decisions: shown([mine, theirs]), clash: mine }
  }
  const ask = DUET_LOG.find((l) => l.id === askOfTopic(id))
  const theirs = decisionById(ask?.touches)
  if (!ask || !theirs || theirs.owner === ME.id || theirs.owner === ask.who) return undefined
  return { id, project: ask.project, part: theirs.part, other: theirs.owner, people: [ask.who, theirs.owner], decisions: shown([theirs]), ask }
}

// Where Reply goes for a question: the conversation with the other owner when it touches their decision.
export const conversationOf = (line: DuetLine) => (topicOf(askTopicId(line.id)) ? askTopicId(line.id) : line.id)

// Conversations waiting on you, in one project or all: clashes of yours not settled yet, and
// questions that touch someone else's decision, not answered yet.
export function useTopics(projectId?: string): Topic[] {
  const { clashes } = useStore()
  const { answered, together } = useDuetState()
  const fromClashes = DECISIONS.filter((d) => d.status === "flag" && d.owner === ME.id && d.clashes && !clashes[d.id]).map((d) => topicOf(clashTopicId(d.id)))
  const fromAsks = DUET_LOG.filter((l) => l.owner === ME.id && l.kind === "asked" && l.touches && !answered[l.id]).map((l) => topicOf(askTopicId(l.id)))
  return [...fromClashes, ...fromAsks].filter((t): t is Topic => !!t && (!projectId || t.project === projectId) && !together[t.id]?.saved)
}

// What the other owner says back the first time you write, and what to save.
export const replyOf = (t: Topic) => TOGETHER[t.id]?.reply ?? t.decisions.find((d) => d.owner === t.other)?.why
export const suggestionOf = (t: Topic) => TOGETHER[t.id]?.save ?? t.decisions.find((d) => d.owner === t.other)?.title ?? ""

// You write in the conversation. A question it started from counts as answered, and the first time,
// the other owner answers.
export function sendTogether(t: Topic, text: string) {
  const words = text.trim()
  if (!words) return
  const replied = getDuetState().together[t.id]?.msgs.some((m) => m.who === t.other)
  const reply = replyOf(t)
  patchTogether(t.id, t.other, (c) => ({ msgs: [...c.msgs, { who: ME.id, text: words }], typing: !replied && !!reply }))
  if (t.ask && !getDuetState().answered[t.ask.id]) answerAsk(t.ask.id, words)
  if (replied || !reply || answering.has(t.id)) return
  answering.add(t.id)
  setTimeout(() => {
    answering.delete(t.id)
    patchTogether(t.id, t.other, (c) => ({ msgs: [...c.msgs, { who: t.other, text: reply }], typing: false }))
  }, 1400)
}
const answering = new Set<string>()

type SettleClash = (id: string, choice: "theirs" | "mine", reason?: string) => void

// Save what you settled as one decision with both names, in the thread it belongs to. A clash is
// over: your decision is withdrawn and this one replaces it.
export function settleTogether(t: Topic, title: string, settleClash: SettleClash, tool = "Whyspace") {
  const words = title.trim()
  if (!words || getDuetState().together[t.id]?.saved) return
  const theirs = t.decisions.find((d) => d.owner === t.other)
  const id = TOGETHER[t.id]?.id ?? `tog-${t.id.slice(2)}`
  const by = `${ME.name} and ${PEOPLE[t.other]?.name ?? t.other}`
  const msgs = getDuetState().together[t.id]?.msgs ?? []
  const mine = msgs.find((m) => m.who === ME.id)?.text
  const said = msgs.find((m) => m.who === t.other)?.text
  recordDecision({
    id, project: t.project, part: t.part, title: words, status: "conf",
    owner: t.clash ? ME.id : t.other, by, when: "Today", tool,
    why: (t.clash ? said : mine) ?? theirs?.why,
    replaces: t.clash?.id,
    evidence: [{ kind: "chat", label: `${by}’s conversation`, detail: [mine, said].filter(Boolean).map((x) => `“${x}”`).join(" ") || undefined }],
  })
  if (theirs) addLinks([[theirs.id, id]])
  keepNames(id, by)
  if (t.clash) settleClash(t.clash.id, "theirs", "Settled together")
  patchTogether(t.id, t.other, () => ({ saved: id }))
}

export function useSettleTogether() {
  const { settleClash } = useStore()
  return (t: Topic, title: string) => settleTogether(t, title, settleClash)
}

// What an answer is saved as: the question's own suggestion, else your words.
export const answerSuggestion = (line: DuetLine, answer: string) => line.save ?? answer

// Save your answer to a question as your decision, so your Duet can answer it next time.
export function saveAnswer(line: DuetLine, title: string, tool = "Whyspace") {
  const words = title.trim()
  const answer = getDuetState().answered[line.id]
  if (!words || !answer || getDuetState().saved[line.id]) return
  const id = `ans-${line.id}`
  recordDecision({
    id, project: line.project, part: line.part ?? decisionById(line.decision)?.part ?? "Marketing", title: words, status: "conf",
    owner: ME.id, by: ME.name, when: "Today", tool, why: answer === words ? undefined : answer,
    evidence: [{ kind: "chat", label: `${first(line.who)} asked`, detail: `“${line.message ?? line.text}”` }],
  })
  markSaved(line.id, id)
}

// Save as decision on a Slack message, filed in the thread its channel links to. Yours is
// confirmed; a teammate's waits as a guess for them to confirm.
export type SlackSave = { id: string; who: string; text: string; title: string; project: string; part: string; where: string }
export function saveMessage(m: SlackSave) {
  const id = `sl-${m.id}`
  if (DECISIONS.some((d) => d.id === id)) return
  recordDecision({
    id, project: m.project, part: m.part, title: m.title, status: m.who === ME.id ? "conf" : "inf",
    owner: m.who, by: PEOPLE[m.who]?.name, when: "Today", tool: "Slack", snippet: m.text,
    evidence: [{ kind: "chat", label: m.where, detail: `“${m.text}”` }],
  })
  markPosted(id)
}
