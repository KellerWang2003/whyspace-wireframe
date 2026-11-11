import { DECISIONS, LINKS, PEOPLE, decisionById, reachOf, type Artifact, type Decision, type Status, type Task } from "@/data"
import { MARK_CHAR, markOf } from "@/lib/marks"

// What a piece of work's card says. The components live in card.tsx; this file has no components
// so they can be imported anywhere.

const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

// The decisions a piece of work carries: those whose reach includes it, or that cite it as evidence.
export const decisionsOf = (a: Artifact, tasks: Task[]) =>
  DECISIONS.filter((d) => reachOf(d.id, tasks).some((r) => r.artifact.id === a.id) || d.evidence?.some((e) => e.artifact === a.id))

// The line after a decision: the why, or where it came from.
export function tailOf(d: Decision, status: Status) {
  const who = d.by ?? PEOPLE[d.owner]?.name ?? ""
  if (status === "conf" || status === "chg") return d.why ? `${who}: ${d.why}` : who
  if (status === "prec") {
    const from = LINKS.flatMap(([a, b]) => (b === d.id ? [decisionById(a)] : [])).find(Boolean)
    return from ? `from ${first(from.owner)}’s decision${from.when ? `, ${from.when}` : ""}` : "from an earlier decision"
  }
  if (status === "flag") {
    const other = decisionById(d.clashes)
    return other ? `clashes with ${first(other.owner)}’s “${other.title}”` : "clashes with another decision"
  }
  if (status === "open") return "open question"
  return `${first(d.owner)}’s guess${d.why ? ` · ${d.why}` : ""}`
}

export function cardText(a: Artifact, decisions: Decision[], statusOf: (d: Decision) => Status, n: number) {
  const lines = [`Whyspace · ${a.name} · ${n} of ${decisions.length} confirmed`]
  for (const d of decisions) lines.push(`${MARK_CHAR[markOf(statusOf(d))]} ${d.title} — ${tailOf(d, statusOf(d))}`)
  return lines.join("\n")
}
