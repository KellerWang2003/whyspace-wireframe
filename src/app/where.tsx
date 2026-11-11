import { ProjectLabel } from "@/components/app/project-mark"
import { DECISIONS, PROJECTS, TASKS, type InboxItem, type Task } from "@/data"
import { cn } from "@/lib/utils"
import { ThreadTag } from "./thread-ui"

// Work outside a project page says which thread it belongs to, not just the project.

const projectIdOf = (nameOrId: string) => PROJECTS.find((p) => p.id === nameOrId || p.name === nameOrId)?.id ?? nameOrId

// My tasks: "Project · ● Thread", the thread opening its page.
export function TaskWhere({ task }: { task: Task }) {
  const id = projectIdOf(task.project)
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{PROJECTS.find((p) => p.id === id)?.name ?? task.project}</span>
      <span aria-hidden>·</span>
      <ThreadTag projectId={id} part={task.part} link className="shrink-0" />
    </span>
  )
}

// Inbox: the project mark and name, then the thread the item asks you to act in:
// the task's thread for something to do, the decision's thread for something to decide.
export function InboxWhere({ item, className }: { item: InboxItem; className?: string }) {
  const id = projectIdOf(item.project)
  const ofTask = TASKS.find((t) => t.id === item.task)?.part
  const ofDecision = DECISIONS.find((d) => d.id === item.decision)?.part
  const part = item.need === "do" ? ofTask ?? ofDecision : ofDecision ?? ofTask
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <ProjectLabel project={item.project} />
      {part && <><span aria-hidden>·</span><ThreadTag projectId={id} part={part} className="shrink-0" /></>}
    </span>
  )
}
