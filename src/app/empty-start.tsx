import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ListTodo, Plus, Spline, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useHifi } from "@/lib/hifi"
import { AddTaskDialog } from "./new-task"
import { NewThreadDialog } from "./thread-ui"
import { threadOf } from "./threads"
import { Illo } from "@/components/brand/illo/pieces"

// What a page shows before a project has anything in it.
// Everything lives in a thread, so a project with no threads starts there.

// `art`: the illustration a project's very first page gets under High-fi, in place of the icon.
export function EmptyStart({ icon: Icon, title, action, art }: { icon: LucideIcon; title: string; action?: ReactNode; art?: ReactNode }) {
  const hifi = useHifi()
  return (
    <Empty className="flex-none border border-dashed py-16">
      <EmptyHeader>
        {art && hifi ? art : <EmptyMedia variant="icon"><Icon /></EmptyMedia>}
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
      <EmptyStart icon={Spline} title="Start with a thread" art={<Illo name="new-project" className="mb-3 h-28" />} action={<Button size="sm" onClick={() => setCreating(true)}><Plus />New thread</Button>} />
      <NewThreadDialog projectId={projectId} open={creating} onOpenChange={setCreating} />
    </>
  )
}

export function StartTask({ projectId }: { projectId: string }) {
  const [creating, setCreating] = useState(false)
  return (
    <>
      <EmptyStart icon={ListTodo} title="Create your first task" art={<Illo name="new-project" className="mb-3 h-28" />} action={<Button size="sm" onClick={() => setCreating(true)}><Plus />New task</Button>} />
      <AddTaskDialog projectId={projectId} open={creating} onOpenChange={setCreating} onCreated={(t) => toast(`Task added to ${threadOf(projectId, t.part).name}`)} />
    </>
  )
}
