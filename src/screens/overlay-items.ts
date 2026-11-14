import type { LogEntry, OverlayAnswer, OverlayItem } from "@/components/app/overlay-stack"
import { caughtHere, firstName, markOfCaught, needsYou, otherOf, type Caught, type CaughtActions } from "./overlay-model"

// The Desk's overlay, one at a time: what the pill caught, as the cards Today shows (same words), and the log.
// A clash gets four answers (Keller, Nov 13): use theirs, use mine, add a task, ask them why.

type Where = { project: string; part: string }

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
// "Claude · Promo video plan · 10:21" → the tool and the time.
const sourceOf = (c: Caught) => {
  const parts = (c.source ?? "").split(" · ")
  return { tool: parts[0] || undefined, time: parts.length > 2 ? parts[parts.length - 1] : undefined }
}

export function itemOf(c: Caught, act: CaughtActions): OverlayItem {
  const { tool, time } = sourceOf(c)
  const me = c.owner ?? "MC"
  const saved = (note?: string) => ({ text: `Saved to ${c.part}`, note, undo: () => act.restore(c) })
  if (c.kind === "clash") {
    const other = otherOf(c)
    const name = other ? firstName(other.owner) : "them"
    const answers: OverlayAnswer[] = [
      { label: `Use ${name}’s`, primary: true, icon: "done", run: () => act.takeTheirs(c.id), flash: () => saved(c.taken ?? other?.title) },
      {
        label: "Use mine",
        icon: "write",
        input: { placeholder: `Why keep yours? ${name} will see it.`, save: "Keep mine", run: (why) => act.keepMine(c.id, why.trim()) },
        flash: (why) => ({ text: "Kept yours", note: why, undo: () => act.restore(c) }),
      },
      { label: "Add a task", icon: "task", run: () => act.addTask(c.id, c.settle ?? `Settle your clash with ${name}`), flash: () => ({ text: "Task added for today", note: c.settle, undo: () => act.restore(c) }) },
      ...(other ? [{ label: `Ask ${name} why`, icon: "talk" as const }] : []),
    ]
    return {
      id: c.id,
      level: "alert",
      source: { face: me, agent: true, who: "Your Duet", what: tool ? "caught this in" : "caught this", tool },
      title: c.alert ?? `Your decision clashes with ${name}’s.`,
      sides: [
        { label: ["Yours", time].filter(Boolean).join(" · "), text: c.title },
        ...(other ? [{ label: [`${name}’s`, other.when].filter(Boolean).join(" · "), text: other.title }] : []),
      ],
      answers,
      ask: other ? { face: other.owner, name, text: `${name} confirmed it on ${other.when}. ${other.why ?? ""}`.trim(), why: other.why, when: other.when, sure: "sure" } : undefined,
    }
  }
  return {
    id: c.id,
    level: "ask",
    source: { face: me, agent: true, who: "Your Duet", what: tool ? "saved this guess from" : "saved this guess", tool },
    title: c.ask ?? `Why ${lowerFirst(c.title)}?`,
    sides: [{ label: ["You said", time].filter(Boolean).join(" · "), text: c.title, note: "No reason yet." }],
    answers: [
      ...(c.hints ?? []).map((h, i): OverlayAnswer => ({ label: h, primary: i === 0, icon: "done", run: () => act.confirm(c.id, h), flash: () => saved(h) })),
      { label: "Other reason", icon: "write", input: { placeholder: "Why?", save: "Save", run: (why) => act.confirm(c.id, why.trim()) }, flash: (why) => saved(why) },
    ],
  }
}

// What needs you here, alerts first; the check after a share holds only what it opened with.
export const deskItems = (all: Caught[], where: Where, act: CaughtActions, only?: string[]) =>
  needsYou(all, where).filter((c) => !only || only.includes(c.id)).map((c) => itemOf(c, act))

// Saved this session: confirmed, taken from a teammate, kept with a reason, or turned into a task.
export const deskLog = (all: Caught[], where: Where, act: CaughtActions): LogEntry[] =>
  caughtHere(all, where).map((c) => (c.task
    ? { id: c.id, mark: "task", title: c.task, note: "A task, for today" }
    : { id: c.id, mark: markOfCaught(c), title: c.title, note: c.reason ?? c.why, onRemove: () => act.remove(c.id) }))
