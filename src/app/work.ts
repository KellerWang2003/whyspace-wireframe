import { useSyncExternalStore } from "react"
import { ARTIFACTS, ARTIFACT_SOURCE, PROJECTS, TASKS, type Artifact, type ArtifactSource, type Task } from "@/data"
import { useStore } from "@/lib/store"

// Work added in this visit (tasks, artifacts) shows on Home and on its thread page alike,
// so it lives here instead of in each page.

type Added = { tasks: Task[]; artifacts: Item[]; moved: Record<string, string>; removed: string[] }
export type Item = Artifact & { source: ArtifactSource; where: string; url?: string }

let added: Added = { tasks: [], artifacts: [], moved: {}, removed: [] }
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const set = (patch: Partial<Added>) => {
  added = { ...added, ...patch }
  listeners.forEach((l) => l())
}
const useAdded = () => useSyncExternalStore(subscribe, () => added)

export const projectNameOf = (projectId: string) => PROJECTS.find((p) => p.id === projectId)?.name ?? projectId

// Every task with its latest status: the project's own plus any added here.
export function useAllTasks() {
  const { taskPatches } = useStore()
  const { tasks } = useAdded()
  return [...tasks, ...TASKS].map((t) => (taskPatches[t.id] ? { ...t, ...taskPatches[t.id] } : t))
}

export const addTask = (task: Task) => set({ tasks: [task, ...added.tasks] })

// A project's artifacts as links, with anything added, moved or removed in this visit.
export function useArtifacts(projectId: string): Item[] {
  return artifactsOf(useAdded(), projectId)
}

// Every project's artifacts at once, for search across projects.
export function useArtifactsOf(projectIds: string[]): Item[] {
  const a = useAdded()
  return projectIds.flatMap((id) => artifactsOf(a, id))
}

function artifactsOf({ artifacts, moved, removed }: Added, projectId: string): Item[] {
  return [
    ...ARTIFACTS.filter((a) => a.project === projectId).map((a) => ({ ...a, ...(ARTIFACT_SOURCE[a.id] ?? { source: "Link" as const, where: "" }) })),
    ...artifacts.filter((a) => a.project === projectId),
  ].filter((a) => !removed.includes(a.id)).map((a) => ({ ...a, part: moved[a.id] ?? a.part }))
}

export const addArtifact = (item: Item) => set({ artifacts: [...added.artifacts, item] })
export const moveArtifact = (id: string, part: string) => set({ moved: { ...added.moved, [id]: part } })
export const removeArtifact = (id: string) => set({ removed: [...added.removed, id] })
export const restoreArtifact = (id: string) => set({ removed: added.removed.filter((x) => x !== id) })

// "Fri Oct 30" / "Mon Nov 2" as a day number counted from Oct 0, so due dates sort.
export const dueDay = (t: Task) => {
  const n = Number(t.due.match(/\d+/)?.[0])
  return Number.isNaN(n) ? 999 : n + (t.due.includes("Nov") ? 31 : 0)
}
