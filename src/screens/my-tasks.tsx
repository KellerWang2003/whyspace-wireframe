import { ListChecks } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { TasksView } from "@/components/app/tasks"
import { ME, TASKS } from "@/data"
import { useStore } from "@/lib/store"
import { ComingUp } from "@/screens/inbox"

// Every task assigned to you, across all projects.
export function MyTasks() {
  const { current } = useStore()
  const mine = current?.example ? TASKS.filter((t) => t.owner === ME.id || !!t.assignees?.includes(ME.id)) : []

  return (
    <AppShell crumbs={[{ label: "My tasks" }]}>
      {/* Two panes split by a full-height divider, like Inbox: tasks, then Coming up. */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-6 sm:p-8 xl:overflow-y-auto">
        {mine.length ? (
          <TasksView title="My tasks" tasks={mine} showProject />
        ) : (
          <><PageHeader title="My tasks" /><Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ListChecks /></EmptyMedia>
              <EmptyTitle>No tasks here</EmptyTitle>
            </EmptyHeader>
          </Empty></>
        )}
        </div>
        {current?.example && <ComingUp className="shrink-0 border-t p-6 sm:p-8 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-6" />}
      </div>
    </AppShell>
  )
}
