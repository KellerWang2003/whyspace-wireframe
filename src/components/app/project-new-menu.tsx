import { useState, type ReactNode } from "react"
import { CalendarPlus, ListTodo, Plus, Radio, Spline } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScheduleMeetingDialog } from "@/components/app/schedule-meeting"
import { NewTaskDialog } from "@/components/app/tasks"
import { navigate } from "@/lib/router"

// One New menu for the whole project: start or schedule a meeting, add a task, add a thread.
// Shown beside the project name on Home, and as + on the project's sidebar row.
export function ProjectNewMenu({
  project,
  trigger,
  side,
  align = "start",
}: {
  project: { id: string; name: string }
  trigger?: ReactNode
  side?: "right" | "bottom"
  align?: "start" | "end"
}) {
  const [dialog, setDialog] = useState<"schedule" | "task" | "thread" | null>(null)
  const [threadName, setThreadName] = useState("")
  const close = (o: boolean) => !o && setDialog(null)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger ?? <Button variant="outline" size="sm"><Plus />New</Button>}</DropdownMenuTrigger>
        <DropdownMenuContent side={side} align={align} className="w-44">
          <DropdownMenuItem onSelect={() => navigate(`/p/${project.id}/sessions/new`)}><Radio />Start meeting</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("schedule")}><CalendarPlus />Schedule meeting</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("task")}><ListTodo />New task</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("thread")}><Spline />New thread</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ScheduleMeetingDialog project={project.id} open={dialog === "schedule"} onOpenChange={close} />
      <NewTaskDialog open={dialog === "task"} onOpenChange={close} defaultProject={project.name} onCreate={() => toast("Task created")} />
      <Dialog open={dialog === "thread"} onOpenChange={close}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New thread</DialogTitle></DialogHeader>
          <Field>
            <FieldLabel htmlFor="thread-name">Name</FieldLabel>
            <Input id="thread-name" placeholder="Untitled thread" value={threadName} onChange={(e) => setThreadName(e.target.value)} autoFocus />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => { toast(`${threadName.trim() || "Untitled thread"} created`); setThreadName(""); setDialog(null) }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
