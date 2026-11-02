import { DECISIONS, TASKS, needsYou, reachOf, type Decision, type Status } from "@/data"
import { useStore } from "@/lib/store"

// Hooks that read the shared work state: tasks with their latest status, what needs you,
// and decisions with any confirmations made in this session.

export function useTasks() {
  const { taskPatches } = useStore()
  return TASKS.map((t) => (taskPatches[t.id] ? { ...t, ...taskPatches[t.id] } : t))
}

export function useNeedsYou(projectId: string) {
  const { confirmed } = useStore()
  return needsYou(projectId, useTasks(), confirmed)
}

export function useReach(decisionId: string) {
  return reachOf(decisionId, useTasks())
}

export function useStatusOf() {
  const { confirmed } = useStore()
  return (d: Decision): Status => (confirmed[d.id] && d.status === "inf" ? "conf" : d.status)
}

// Decisions an artifact follows: the ones whose reach includes it.
export const decisionsFor = (artifactId: string) => DECISIONS.filter((d) => reachOf(d.id).some((r) => r.artifact.id === artifactId))
