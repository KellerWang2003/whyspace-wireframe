import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { CalendarPlus, ListTodo, Plus, Spline } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScheduleMeetingDialog } from "@/components/app/schedule-meeting"
import { AddTaskDialog } from "./new-task"
import { NewThreadDialog } from "./thread-ui"
import { threadOf } from "./threads"

// The New menu: same items as archived Design A's, but tasks and threads go into the thread store.
// On a thread page, pass `thread` so a new task lands there.
export function NewMenu({ project, trigger, side, align = "start", thread }: {
  project: { id: string; name: string }
  trigger?: ReactNode
  side?: "right" | "bottom"
  align?: "start" | "end"
  thread?: string
}) {
  const [dialog, setDialog] = useState<"schedule" | "task" | "thread" | null>(null)
  const close = (o: boolean) => !o && setDialog(null)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger ?? <Button variant="outline" size="sm"><Plus />New</Button>}</DropdownMenuTrigger>
        <DropdownMenuContent side={side} align={align} className="w-44">
          <DropdownMenuItem onSelect={() => setDialog("schedule")}><CalendarPlus />Schedule meeting</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("task")}><ListTodo />New task</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("thread")}><Spline />New thread</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ScheduleMeetingDialog project={project.id} open={dialog === "schedule"} onOpenChange={close} />
      <AddTaskDialog projectId={project.id} thread={thread} open={dialog === "task"} onOpenChange={close} onCreated={(t) => toast(`Task added to ${threadOf(project.id, t.part).name}`)} />
      <NewThreadDialog projectId={project.id} open={dialog === "thread"} onOpenChange={close} />
    </>
  )
}
