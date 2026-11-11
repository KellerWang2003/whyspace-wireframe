import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ME, PEOPLE, PROJECTS, type Task } from "@/data"
import { ThreadTag } from "./thread-ui"
import { useThreads } from "./threads"
import { addTask, projectNameOf } from "./work"

// A new task always lands in a thread. From a thread page the thread is set already.
export function AddTaskDialog({ projectId, thread, open, onOpenChange, onCreated }: {
  projectId: string
  thread?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (t: Task) => void
}) {
  const threads = useThreads(projectId)
  const members = PROJECTS.find((p) => p.id === projectId)?.members ?? [ME.id]
  const [title, setTitle] = useState("")
  const [picked, setPicked] = useState<string | null>(null)
  const [owner, setOwner] = useState(ME.id)
  const [due, setDue] = useState("")
  const part = picked ?? thread ?? threads[0]?.part ?? "General"
  const close = () => { setTitle(""); setDue(""); setPicked(null); onOpenChange(false) }

  const create = () => {
    const task: Task = {
      id: `t-${Date.now()}`,
      title: title.trim() || "Untitled task",
      project: projectNameOf(projectId),
      part,
      owner,
      due: due.trim() || "No date",
      status: "todo",
      priority: "none",
    }
    addTask(task)
    onCreated?.(task)
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription className="sr-only">Add a task to a thread.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create() }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ntb-title">Title</FieldLabel>
              <Input id="ntb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Thread</FieldLabel>
                <Select value={part} onValueChange={setPicked}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {threads.map((t) => <SelectItem key={t.id} value={t.part}><ThreadTag projectId={projectId} part={t.part} /></SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Assignee</FieldLabel>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{members.map((id) => <SelectItem key={id} value={id}>{PEOPLE[id]?.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="ntb-due">Due</FieldLabel>
                <Input id="ntb-due" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Fri Nov 6" />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Create task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
