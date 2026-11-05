import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ListTodo, Plus, Spline, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { NewTaskDialogB } from "./new-task"
import { NewThreadDialog } from "./thread-ui"
import { threadOf } from "./threads"

// Design B: what a page shows before a project has anything in it.
// Everything lives in a thread, so a project with no threads starts there.

export function EmptyStart({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
  return (
    <Empty className="flex-none border border-dashed py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

export function StartThread({ projectId }: { projectId: string }) {
  const [creating, setCreating] = useState(false)
  return (
    <>
      <EmptyStart icon={Spline} title="Start with a thread" action={<Button size="sm" onClick={() => setCreating(true)}><Plus />New thread</Button>} />
      <NewThreadDialog projectId={projectId} open={creating} onOpenChange={setCreating} />
    </>
  )
}

export function StartTask({ projectId }: { projectId: string }) {
  const [creating, setCreating] = useState(false)
  return (
    <>
      <EmptyStart icon={ListTodo} title="Create your first task" action={<Button size="sm" onClick={() => setCreating(true)}><Plus />New task</Button>} />
      <NewTaskDialogB projectId={projectId} open={creating} onOpenChange={setCreating} onCreated={(t) => toast(`Task added to ${threadOf(projectId, t.part).name}`)} />
    </>
  )
}
