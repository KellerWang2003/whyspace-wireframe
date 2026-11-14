import { useState } from "react"
import { PEOPLE, decisionById, type Decision } from "@/data"
import type { Mark } from "@/lib/marks"

// What the overlay caught in this session, in one person's words, and what each one still needs.
// No components here: the overlay and the pill playground both use it.

export type Caught = {
  id: string
  // Your decision, as you said it.
  title: string
  // conf: you stand behind it. guess: nobody confirmed it. clash: it contradicts a teammate's
  // confirmed decision. prec: you took theirs, so yours now follows it.
  kind: "conf" | "guess" | "clash" | "prec"
  why?: string
  // Chips made from your own words, for a one-tap why.
  hints?: string[]
  // Where it was caught.
  source?: string
  // For a clash: the confirmed decision (an id in DECISIONS) yours contradicts.
  clashes?: string
  // For a clash you kept: your reason. The clash stays visible to both until one side changes.
  reason?: string
  // For a clash you take: what yours becomes (theirs, worded for your work). Defaults to their title.
  taken?: string
  // A clash in one sentence, for its card: "Your end card is red, but Trevor made the brand blue."
  alert?: string
  // A guess's question, for its card: "Why 15 seconds?"
  ask?: string
  // A clash you turned into a task (Add a task): what the task says, to settle it with them.
  settle?: string
  task?: string
  // Whose decision, where one card lists more than one person's. Yours when unset.
  owner?: string
  project: string
  part: string
  // The check when you share already asked about it.
  checked?: boolean
}

// The expanded pill's three layouts (the rows carry their actions differently); the overlay uses one.
export type Layout = "right" | "inline" | "panes"
export const LAYOUTS: { id: Layout; name: string; note: string }[] = [
  { id: "right", name: "Buttons on the right", note: "One line per row, the actions at its end" },
  { id: "inline", name: "Chips inline", note: "Your words as chips under the line" },
  { id: "panes", name: "Two panes", note: "Their why always beside yours" },
]

export const INITIAL: Caught[] = [
  { id: "o4", title: "Make the end card red, like the old logo", kind: "clash", clashes: "nored", taken: "Make the end card blue, like the brand", alert: "Your end card is red, but Trevor made the brand blue.", settle: "Settle the end card color with Trevor", source: "Claude · Promo video plan · 10:21", project: "whiskr", part: "Marketing" },
  { id: "o1", title: "Make the promo video 15 seconds", kind: "guess", ask: "Why 15 seconds?", hints: ["Cats lose interest fast", "Fits a reel"], source: "Claude · Promo video plan · 10:12", project: "whiskr", part: "Marketing" },
  { id: "o2", title: "Start the promo video with Luna’s real clip", kind: "guess", ask: "Why open on Luna’s real clip?", hints: ["Shows the idea in the first second", "Real footage feels honest"], source: "Claude · Promo video plan · 10:14", project: "whiskr", part: "Marketing" },
  { id: "o5", title: "Add a purr when the dot moves in the video", kind: "guess", ask: "Why a purr when the dot moves?", hints: ["The dot purrs in the app"], source: "Claude · Promo video plan · 10:19", project: "whiskr", part: "Marketing" },
  { id: "o3", title: "Use the brand guidelines for the visuals", kind: "conf", why: "Blue, with the moving dot", source: "Claude · Promo video plan · 10:08", project: "whiskr", part: "Marketing" },
  { id: "o6", title: "Cut the video from the testing footage", kind: "conf", source: "Claude · Promo video plan · 10:09", project: "whiskr", part: "Marketing" },
  { id: "o7", title: "Keep the poster type in the brand sans", kind: "guess", ask: "Why the brand sans on the posters?", hints: ["One typeface everywhere"], source: "Figma · Posters · 9:50", project: "whiskr", part: "Brand" },
]

export const markOfCaught = (c: Caught): Mark => (c.kind === "conf" ? "filled" : c.kind === "prec" ? "ringed" : c.kind === "clash" ? "triangle" : "empty")
export const otherOf = (c: Caught): Decision | undefined => decisionById(c.clashes)
export const firstName = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

const inWhere = (c: Caught, where: { project: string; part: string }) => c.project === where.project && c.part === where.part
// A clash waits until you take theirs, keep yours with a reason, or turn it into a task.
const waits = (c: Caught) => (c.kind === "clash" && !c.reason && !c.task) || c.kind === "guess"

// Every decision captured here this session, for the folded pill's count.
export const caughtIn = (all: Caught[], where: { project: string; part: string }) => all.filter((c) => inWhere(c, where))

// What waits in other threads, for "3 more in Today".
export const needsElsewhere = (all: Caught[], where: { project: string; part: string }) => all.filter((c) => !inWhere(c, where) && waits(c))

// What still needs you here: clashes first, then the guesses that matter (the ones with words to tap).
export const needsYou = (all: Caught[], where: { project: string; part: string }) =>
  all.filter((c) => inWhere(c, where) && waits(c)).sort((a, b) => Number(b.kind === "clash") - Number(a.kind === "clash") || Number(!!b.hints?.length) - Number(!!a.hints?.length))

// Caught this session and not waiting: confirmed, taken from precedent, or a clash you kept.
export const caughtHere = (all: Caught[], where: { project: string; part: string }) => all.filter((c) => inWhere(c, where) && !waits(c))

export const confirmedHere = (all: Caught[], where: { project: string; part: string }) => all.filter((c) => inWhere(c, where) && (c.kind === "conf" || c.kind === "prec"))

// The check when you share: the guesses still in the work, at most six. A second share asks only about new ones.
export const checkRows = (all: Caught[], where: { project: string; part: string }) => all.filter((c) => inWhere(c, where) && c.kind === "guess" && !c.checked).slice(0, 6)

// "n of m confirmed" for the work here, the one count the design keeps.
export const countsHere = (all: Caught[], where: { project: string; part: string }) => {
  const here = all.filter((c) => inWhere(c, where))
  return { n: here.filter((c) => c.kind === "conf" || c.kind === "prec").length, m: here.length }
}

export type CaughtActions = {
  confirm: (id: string, why?: string) => void
  takeTheirs: (id: string) => void
  keepMine: (id: string, reason: string) => void
  addWhy: (id: string, why: string) => void
  remove: (id: string) => void
  finishCheck: (ids: string[]) => void
  // Turn a clash into a task to settle it.
  addTask: (id: string, title: string) => void
  // Put a decision back as it was before an answer (Undo).
  restore: (c: Caught) => void
  reset: () => void
}

export function useCaught(initial: Caught[] = INITIAL): [Caught[], CaughtActions] {
  const [all, setAll] = useState<Caught[]>(initial)
  const patch = (id: string, fn: (c: Caught) => Caught | null) => setAll((xs) => xs.flatMap((c) => (c.id === id ? (fn(c) ? [fn(c)!] : []) : [c])))
  return [all, {
    confirm: (id, why) => patch(id, (c) => ({ ...c, kind: "conf", why: why ?? c.why })),
    // Yours changes to theirs: it now follows their decision.
    takeTheirs: (id) => patch(id, (c) => { const o = otherOf(c); return o ? { ...c, kind: "prec", title: c.taken ?? o.title, why: `Follows ${firstName(o.owner)}’s decision`, clashes: undefined } : c }),
    keepMine: (id, reason) => patch(id, (c) => ({ ...c, reason })),
    addWhy: (id, why) => patch(id, (c) => ({ ...c, why })),
    remove: (id) => patch(id, () => null),
    finishCheck: (ids) => setAll((xs) => xs.map((c) => (ids.includes(c.id) ? { ...c, checked: true } : c))),
    addTask: (id, title) => patch(id, (c) => ({ ...c, task: title })),
    restore: (before) => setAll((xs) => (xs.some((c) => c.id === before.id) ? xs.map((c) => (c.id === before.id ? before : c)) : [...xs, before])),
    reset: () => setAll(initial),
  }]
}
