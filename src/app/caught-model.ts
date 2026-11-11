import { DECISIONS, ME, MY_PROJECTS, type Decision } from "@/data"
import { PINS } from "@/lib/scenario"
import { useStatusOf } from "@/lib/work"
import { LAST_VISIT, TODAY, dayLabel, dayOf } from "@/playground/model"
import type { DuetLine } from "./duet"
import { useDuetActivity, type Handled } from "./duet-state"
import { useTopics, type Topic } from "./together"

// While you were away (the chat plan's row 3, first called Caught for you): what your Duet caught
// while you were away, from every thread's decisions and the questions people asked it, wherever they
// were said. It replaced Catch up on Home, and the same list opens in your Duet chat, so the Duet is
// the only AI in Whyspace.

// While you were away: since yesterday in a test scenario, since your last visit otherwise.
const SINCE = PINS ? TODAY - 1 : LAST_VISIT
export const sinceLabel = PINS ? "yesterday" : dayLabel(SINCE)

export type Caught = {
  // Clashes of yours: your Duet started a conversation with the other owner.
  clashes: Topic[]
  // Questions nothing of yours covers. `topic`: it touches someone's decision, so they are in the conversation.
  waiting: { line: DuetLine; topic?: Topic }[]
  // What your Duet told people from your confirmed decisions.
  answered: Handled[]
  // Decisions teammates confirmed, wherever they were said.
  confirmed: Decision[]
}

export function useCaught(projectId?: string): Caught {
  const { asked, handled } = useDuetActivity(projectId)
  const topics = useTopics(projectId)
  const statusOf = useStatusOf()
  const inScope = (project: string) => (projectId ? project === projectId : MY_PROJECTS.some((p) => p.id === project))
  const theirs = (d: Decision) => d.owner !== ME.id && !d.by?.split(" and ").includes(ME.name)
  return {
    clashes: topics.filter((t) => t.clash),
    waiting: asked.map((line) => ({ line, topic: topics.find((t) => t.ask?.id === line.id) })),
    answered: handled.filter((h) => h.kind === "answered" && !h.byYou && h.day !== "earlier"),
    confirmed: DECISIONS
      .filter((d) => inScope(d.project) && theirs(d) && ["conf", "chg"].includes(statusOf(d)) && (dayOf(d.when) ?? 0) >= SINCE)
      .sort((a, b) => (dayOf(b.when) ?? 0) - (dayOf(a.when) ?? 0)),
  }
}

export const isEmpty = (c: Caught) => !c.clashes.length && !c.waiting.length && !c.answered.length && !c.confirmed.length

// "Yesterday 17:40", "8:30", "Yesterday" for a decision dated the day before.
export const whenOf = (x: { when?: string; day?: string }) => {
  if (x.day) return x.day === "yesterday" ? `Yesterday ${x.when}` : x.when ?? ""
  const day = dayOf(x.when)
  return day === TODAY ? "Today" : day === TODAY - 1 ? "Yesterday" : x.when ?? ""
}
