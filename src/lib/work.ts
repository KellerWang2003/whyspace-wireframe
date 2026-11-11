import { DECISIONS, LINKS, TASKS, decisionById, needsYou, reachOf, type Decision, type Status } from "@/data"
import { DESIGN } from "@/lib/design"
import { markOf } from "@/lib/marks"
import { useStore } from "@/lib/store"

// Hooks that read the shared work state: tasks with their latest status, what needs you,
// and decisions with any confirmations made in this session.

export function useTasks() {
  const { taskPatches } = useStore()
  return TASKS.map((t) => (taskPatches[t.id] ? { ...t, ...taskPatches[t.id] } : t))
}

export function useNeedsYou(projectId: string) {
  const { confirmed, clashes } = useStore()
  const statusOf = useStatusOf()
  // A decision from precedent already stands on a confirmed one, so it waits on nobody; a settled clash neither.
  return needsYou(projectId, useTasks(), confirmed).filter((r) => r.kind !== "decide" || (statusOf(r.decision) !== "prec" && !clashes[r.decision.id]))
}

// A clash you settled by taking the other decision is withdrawn: it leaves every list.
export function useWithdrawn() {
  const { clashes } = useStore()
  return (d: Decision) => clashes[d.id]?.choice === "theirs"
}

export function useReach(decisionId: string) {
  return reachOf(decisionId, useTasks())
}

// An inferred decision that builds on a confirmed one (LINKS) is from precedent: ◉ in the main design.
const settled = (id: string, confirmed: Record<string, boolean>) => {
  const p = decisionById(id)
  return !!p && (p.status === "conf" || p.status === "chg" || !!confirmed[id])
}
export const fromPrecedent = (d: Decision, confirmed: Record<string, boolean> = {}) => d.status === "inf" && LINKS.some(([a, b]) => b === d.id && settled(a, confirmed))

export function useStatusOf() {
  const { confirmed } = useStore()
  return (d: Decision): Status => {
    if (confirmed[d.id] && d.status === "inf") return "conf"
    if (DESIGN === "b" && fromPrecedent(d, confirmed)) return "prec"
    return d.status
  }
}

// "n of m confirmed": how much of a record someone stands behind. Confirmed and from precedent count;
// a guess and a clash do not. The only number the main design keeps.
export function useConfirmed(all: Decision[]) {
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const decisions = all.filter((d) => !withdrawn(d))
  const m = decisions.length
  const n = decisions.filter((d) => { const mark = markOf(statusOf(d)); return mark === "filled" || mark === "ringed" }).length
  return { n, m }
}

// Decisions an artifact follows: the ones whose reach includes it.
export const decisionsFor = (artifactId: string) => DECISIONS.filter((d) => reachOf(d.id).some((r) => r.artifact.id === artifactId))
