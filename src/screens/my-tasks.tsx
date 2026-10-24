import { ListChecks } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { TasksView } from "@/components/app/tasks"
import { ME, TASKS } from "@/data"
import { useStore } from "@/lib/store"

// Every task assigned to you, across all projects.
export function MyTasks() {
  const { current } = useStore()
  const mine = current?.example ? TASKS.filter((t) => t.owner === ME.id) : []
  const open = mine.filter((t) => t.status !== "done").length

  return (
    <AppShell crumbs={[{ label: "My tasks" }]}>
      <div className="flex flex-col gap-6 p-8">
        <PageHeader title="My tasks" description={`${open} open tasks assigned to you across every project.`} />
        {mine.length ? (
          <TasksView tasks={mine} showProject />
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ListChecks /></EmptyMedia>
              <EmptyTitle>No tasks here</EmptyTitle>
              <EmptyDescription>Tasks come from open decisions and handoffs in your projects.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </AppShell>
  )
}
