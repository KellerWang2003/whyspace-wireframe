import { useState } from "react"
import { toast } from "sonner"
import { INBOX, ME, SESSIONS, decisionById, patchDecision, projectName, recordDecision, type Decision, type InboxItem } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { makeChat } from "./chats-model"
import { openReply } from "./duet-state"
import { first, type Row } from "./today-model"
import { askTopicId, clashTopicId, conversationOf, topicOf } from "./together"

// Needs you, one at a time. Each row becomes one item: a plain sentence of what needs you, its two
// sides (yours and the other person's, or what you said and who is waiting), and the answers.
// Every answer finishes the item, or opens the talk it names.

export type Side = { label: string; text: string; note?: string }
// What the answer does, for its icon: finish it, talk it over, write your own, say no, copy, open.
export type AnswerIcon = "done" | "talk" | "write" | "no" | "copy" | "open"
export type Answer = {
  label: string
  primary?: boolean
  icon?: AnswerIcon
  run?: () => void
  // Answers you write yourself: a changed guess, an open question decided.
  input?: { placeholder: string; save: string; run: (text: string) => void }
}
// Where the item comes from: who raised it and how ("Your Duet" "caught this in", tool "Claude").
export type Source = { face: string; agent?: boolean; who: string; what: string; tool?: string }
export type NeedsItem = { id: string; row: Row; face: string; agent?: boolean; source: Source; title: string; sides: Side[]; answers: Answer[] }

// Plain words for rows the data can't phrase on its own: a clash's sentence and the answer that takes
// the teammate's side, or a review's question with its options. Keyed by decision id or inbox item id.
type Copy = { title?: string; take?: string; first?: Side; options?: { label: string; decision: string }[] }
const COPY: Record<string, Copy> = {
  redcard: { title: "Your end card is red, but Trevor made the brand blue.", take: "Make it blue" },
  "s1-red": { title: "Your video uses red, but Trevor made the brand blue.", take: "Use blue" },
  i7: {
    title: "Two of 15 test questions have no source page.",
    first: { label: "Jordan’s test", text: "15 questions from three course PDFs", note: "Two had no supporting passage." },
    options: [
      { label: "Remove them", decision: "Remove questions that have no source page" },
      { label: "Show as unavailable", decision: "Show questions with no source page as unavailable" },
    ],
  },
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const sentence = (s: string) => { const t = s.trim(); return upper(t) + (/[.!?]$/.test(t) ? "" : ".") }
const quoted = (s: string) => `“${s.replace(/^["“]+|["”]+$/g, "")}”`
const dayOf = (when?: string) => (when === "Today" || when === "Yesterday" ? lower(when) : when ?? "")
const shortName = (project: string) => projectName(project).replace(/\s*\(.*\)$/, "")
// "today in Claude", "today in Brand team": when a decision of yours was said, and where.
const saidAt = (d: Decision) => {
  const where = d.tool === "Chats" ? d.evidence?.[0]?.label : d.tool
  return [dayOf(d.when), where ? `in ${where}` : ""].filter(Boolean).join(" ")
}
// Inbox times: "20m", "4h", "1d".
const ago = (time: string) => {
  const n = Number.parseInt(time, 10)
  if (Number.isNaN(n)) return time
  if (time.endsWith("m")) return `${n} minute${n === 1 ? "" : "s"} ago`
  if (time.endsWith("h")) return `${n} hour${n === 1 ? "" : "s"} ago`
  return n === 1 ? "yesterday" : `${n} days ago`
}
const names = (ids: string[]) => {
  const all = [...new Set(ids)].map(first)
  return all.length > 1 ? `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}` : all[0] ?? ""
}

const DUET: Pick<Source, "face" | "agent" | "who"> = { face: ME.id, agent: true, who: "Your Duet" }
// Where a decision was said: the tool, or for Whyspace's own Chats, which chat.
const toolOf = (d: Decision) => (d.tool === "Chats" ? d.evidence?.[0]?.label : d.tool)
// "Jordan’s first question evaluation · 15 questions" -> "first question evaluation".
const sourceName = (source: string) => lower(source.replace(/^[^\s’']+[’']s\s+/, "").replace(/\s*·.*$/, ""))

export function useNeedsItems(rows: Row[]): NeedsItem[] {
  const { confirmDecision, openDecision, patchTask, setInboxDone, setInviteResponse, settleClash } = useStore()
  const confirm = (d: Decision, item?: InboxItem) => { confirmDecision(d.id); if (item) setInboxDone(item.id, true) }

  return rows.flatMap((r): NeedsItem[] => {
    if (r.kind === "decide") {
      const d = r.decision
      const copy = COPY[d.id] ?? (r.item && COPY[r.item.id]) ?? {}

      if (r.ask === "clash") {
        const other = decisionById(d.clashes)
        if (!other) return []
        const name = first(other.owner)
        return [{
          id: r.id, row: r, face: other.owner,
          source: { ...DUET, what: toolOf(d) ? "caught this in" : "caught this", tool: toolOf(d) },
          title: copy.title ?? `Your decision clashes with ${name}’s.`,
          sides: [
            { label: ["Yours", saidAt(d)].filter(Boolean).join(" · "), text: d.title, note: d.why },
            { label: `${name}’s · confirmed${other.when ? ` ${dayOf(other.when)}` : ""}`, text: other.title, note: other.why },
          ],
          answers: [
            { label: copy.take ?? `Use ${name}’s`, primary: true, icon: "done", run: () => { settleClash(d.id, "theirs"); toast(`Took ${name}’s decision`) } },
            // Your Duet brings you both into one conversation, each decision and why on top. Keep mine stays on the decision sheet.
            { label: `Talk with ${name}`, icon: "talk", run: () => openReply(clashTopicId(d.id)) },
          ],
        }]
      }

      if (r.ask === "confirm") {
        const waiting = r.waiting ?? []
        const who = names(waiting.map((l) => l.who))
        const asked = waiting[0]
        return [{
          id: r.id, row: r, face: ME.id, agent: !!d.tool,
          source: { ...DUET, what: toolOf(d) ? "saved this guess from" : "saved this guess", tool: toolOf(d) },
          title: copy.title ?? `${d.title}?`,
          sides: [
            { label: ["You said", saidAt(d)].filter(Boolean).join(" · "), text: d.snippet ? quoted(d.snippet) : d.title, note: d.why ?? "No reason yet." },
            ...(asked ? [{ label: `${who} ${waiting.length > 1 ? "are" : "is"} waiting · ${asked.day === "yesterday" ? "yesterday " : ""}${asked.when}`, text: quoted(asked.message ?? sentence(asked.text)) }] : []),
          ],
          answers: [
            { label: who ? `Yes, tell ${who}` : "Yes", primary: true, icon: "done", run: () => { confirm(d, r.item); toast(who ? `Confirmed and told ${who}` : "Decision confirmed") } },
            {
              label: "Change",
              icon: "write",
              input: {
                placeholder: "What did you decide?",
                save: who ? `Save and tell ${who}` : "Save",
                run: (text) => { patchDecision(d.id, { title: upper(text.trim()) }); confirm(d, r.item); toast(who ? `Saved and told ${who}` : "Decision saved") },
              },
            },
          ],
        }]
      }

      if (r.ask === "review" && r.item) {
        const item = r.item
        const from = first(item.from)
        const asked: Side = copy.first ? { ...copy.first, label: `${copy.first.label} · ${ago(item.time)}` } : { label: `${from} · ${ago(item.time)}`, text: item.body }
        const touched: Side = d.owner === ME.id
          ? { label: "Your decision it touches", text: d.title }
          : { label: `${first(d.owner)}’s ${d.status === "inf" ? "guess" : "decision"}`, text: d.title, note: d.why }
        // Picking an option saves it as your decision, in the thread of the decision it touches.
        const answers: Answer[] = copy.options
          ? copy.options.map((o): Answer => ({
              label: o.label,
              icon: "done",
              run: () => {
                recordDecision({ id: `rv-${item.id}`, project: d.project, part: d.part, title: o.decision, status: "conf", owner: ME.id, by: ME.name, when: "Today", tool: "Whyspace", why: sentence(item.summary), evidence: [{ kind: "test", label: item.source }] })
                setInboxDone(item.id, true)
                toast("Decision saved")
              },
            }))
          : [
              { label: "Looks right", primary: true, icon: "done", run: () => { setInboxDone(item.id, true); toast("Reviewed") } },
              { label: `Talk with ${from}`, icon: "talk", run: () => navigate(`/chats/${makeChat([item.from], "", [])}/${d.id}`) },
            ]
        const source: Source = { face: item.from, who: from, what: `shared their ${sourceName(item.source)}` }
        return [{ id: r.id, row: r, face: item.from, source, title: copy.title ?? item.summary, sides: [asked, touched], answers }]
      }

      if (r.ask === "review") {
        return [{ id: r.id, row: r, face: d.owner, source: { face: d.owner, who: first(d.owner), what: "made a decision you rely on" }, title: d.title, sides: [{ label: `${first(d.owner)}’s decision`, text: d.title, note: d.why }], answers: [{ label: "Open the decision", primary: true, icon: "open", run: () => openDecision(d.id) }] }]
      }

      // An open question of yours: deciding it turns the question into your decision.
      const mention = INBOX.find((i) => i.decision === d.id && !i.need && !i.meeting)
      return [{
        id: r.id, row: r, face: ME.id,
        source: mention ? { face: mention.from, who: first(mention.from), what: "is waiting on your open question" } : { face: ME.id, who: "You", what: toolOf(d) ? "left this open in" : "left this open", tool: toolOf(d) },
        title: copy.title ?? d.title,
        sides: [
          { label: d.due ? `Your open question · due ${d.due}` : "Your open question", text: `${d.part}, in ${shortName(d.project)}` },
          ...(mention ? [{ label: `${first(mention.from)} · ${ago(mention.time)}`, text: mention.summary }] : []),
        ],
        answers: [{
          label: "Decide",
          primary: true,
          icon: "write",
          input: {
            placeholder: "What did you decide?",
            save: "Save decision",
            run: (text) => {
              patchDecision(d.id, { title: upper(text.trim()), status: "conf", by: ME.name, when: "Today", tool: "Whyspace", evidence: [{ kind: "chat", label: "Your open question", detail: quoted(d.title) }] })
              confirmDecision(d.id)
              toast("Decision saved")
            },
          },
        }],
      }]
    }

    if (r.kind === "asked") {
      // A teammate's question no decision of yours covers. Replying opens your conversation with them,
      // and with the owner of a decision it touches, whom your Duet brought in.
      const l = r.line
      const topic = topicOf(askTopicId(l.id))
      const theirs = topic?.decisions.find((x) => x.owner === topic.other)
      const who = first(l.who)
      return [{
        id: r.id, row: r, face: l.who,
        source: { face: l.who, who, what: l.where ? `asked your Duet in ${l.where.replace(/\s*·\s*DM$/, "")}` : "asked your Duet" },
        title: l.message ?? sentence(l.text),
        sides: [
          { label: "Your decisions", text: "None covers this yet.", note: "You can save your answer as one." },
          ...(topic && theirs ? [{ label: `${first(topic.other)}’s decision`, text: theirs.title, note: theirs.why }] : []),
        ],
        answers: [{ label: topic ? `Talk with ${who} and ${first(topic.other)}` : `Reply to ${who}`, primary: true, icon: "talk", run: () => openReply(conversationOf(l)) }],
      }]
    }

    if (r.kind === "invite") {
      const item = r.item
      const m = item.meeting
      const session = SESSIONS.find((s) => s.id === m?.sessionId)
      const when = m ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: m.timezone }).format(new Date(m.startsAt)) : item.time
      const minutes = m ? Math.round((Date.parse(m.endsAt) - Date.parse(m.startsAt)) / 60000) : 0
      return [{
        id: r.id, row: r, face: item.from,
        source: { face: item.from, who: first(item.from), what: "invited you" },
        title: session?.title ?? item.summary,
        sides: [
          { label: "When", text: when, note: minutes ? `${minutes} min` : undefined },
          { label: `${first(item.from)} invited you`, text: m?.agenda ?? item.body },
        ],
        answers: [
          { label: "Accept", primary: true, icon: "done", run: () => { setInviteResponse(item.id, "accepted"); toast("Accepted") } },
          { label: "Decline", icon: "no", run: () => { setInviteResponse(item.id, "declined"); toast("Declined") } },
        ],
      }]
    }

    // Work: due now, or made by Whyspace from a changed decision.
    const t = r.task
    const item = r.item
    const from = decisionById(item?.decision ?? t.decision)
    const done = () => {
      patchTask(t.id, { status: "done" })
      if (item) setInboxDone(item.id, true)
      toast("Task done", { action: { label: "Undo", onClick: () => { patchTask(t.id, { status: t.status }); if (item) setInboxDone(item.id, false) } } })
    }
    const copyPrompt = () => {
      try { void navigator.clipboard?.writeText(t.prompt ?? "") } catch { /* clipboard blocked: the toast still says it */ }
      toast("Prompt copied")
    }
    return [{
      id: r.id, row: r, face: item?.from ?? t.owner,
      source: item?.author.kind === "ai"
        ? { ...DUET, what: `made this from ${item.source.replace(/^Your /, "your ")}` }
        : item ? { face: item.from, who: first(item.from), what: "asked you for this" } : { face: t.owner, who: t.owner === ME.id ? "Your task" : first(t.owner), what: `due ${lower(t.due ?? "today")}` },
      title: t.title,
      sides: [
        from
          ? { label: from.owner === ME.id ? "From your decision" : `From ${first(from.owner)}’s decision`, text: from.title, note: from.why }
          : { label: shortName(r.project), text: `${t.part} thread`, note: t.description },
        { label: `Due ${t.due}`, text: t.prompt && t.tool ? `A ${t.tool} prompt is ready` : t.tool ? `In ${t.tool}` : `${t.part} thread` },
      ],
      answers: [
        { label: "Mark done", primary: true, icon: "done", run: done },
        ...(t.prompt ? [{ label: t.tool ? `Copy ${t.tool} prompt` : "Copy prompt", icon: "copy" as const, run: copyPrompt }] : []),
      ],
    }]
  })
}

// The queue: items in order, skipped ones moved to the back. "2 of 7" counts what you've handled
// since the page opened.
export function useNeedsQueue(items: NeedsItem[]) {
  const [skipped, setSkipped] = useState<string[]>([])
  const [seen, setSeen] = useState<string[]>(() => items.map((i) => i.id))
  const added = items.filter((i) => !seen.includes(i.id)).map((i) => i.id)
  if (added.length) setSeen([...seen, ...added])
  const queue = [...items].sort((a, b) => skipped.indexOf(a.id) - skipped.indexOf(b.id))
  const total = seen.length + added.length
  return {
    queue,
    current: queue[0] as NeedsItem | undefined,
    pos: total - items.length + 1,
    total,
    cleared: items.length === 0 && total > 0,
    skip: (id: string) => setSkipped((s) => [...s.filter((x) => x !== id), id]),
  }
}
export type NeedsQueue = ReturnType<typeof useNeedsQueue>
