import { useState } from "react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DECISIONS } from "@/data"
import { cn } from "@/lib/utils"
import { ThreadTag } from "./thread-ui"
import { threadOf, threadsNow, useThreads } from "./threads"

// Design B: a workshop belongs to the project, not to a thread. Each decision it catches
// gets its own thread instead: Whyspace suggests one, and you can change it before confirming.

const HINTS: [RegExp, string][] = [
  [/\b(colou?r|red|blue|yellow|palette|brand|logo)\b/i, "Brand"],
  [/\b(video|poster|promo|campaign|launch|ad)\b/i, "Marketing"],
  [/\b(dot|swipe|card|buzz|purr|vibrat|button|screen|app)\w*/i, "App"],
  [/\b(cat|cats|motion|move|test|footage|research)\b/i, "Research"],
  [/\b(student|interview|lecture|review)\w*/i, "Interviews"],
  [/\b(demo|crit|failure|presenter|evaluation)\w*/i, "Final crit"],
  [/\b(unverified|warning|reject|flow|upload|prototype)\w*/i, "Prototype"],
  [/\b(question|source|cite|citation|pdf|generate)\w*/i, "Concept"],
]

export function suggestThread(projectId: string, title: string) {
  const threads = threadsNow(projectId)
  const known = DECISIONS.find((d) => d.project === projectId && d.title === title)?.part
  const hinted = HINTS.find(([re, part]) => re.test(title) && threads.some((t) => t.part === part))?.[1]
  return known ?? hinted ?? threads[0]?.part ?? "General"
}

// The thread picked for each caught decision, so confirming can say where it went.
const picked = new Map<string, string>()

export function fileCaught(projectId: string, id: string, title: string) {
  const part = picked.get(id) ?? suggestThread(projectId, title)
  toast(`Filed to ${threadOf(projectId, part).name}`)
}

export function CaughtThread({ projectId, id, title, locked, className }: { projectId: string; id: string; title: string; locked?: boolean; className?: string }) {
  const threads = useThreads(projectId)
  const [part, setPartState] = useState(() => picked.get(id) ?? suggestThread(projectId, title))
  const setPart = (p: string) => { picked.set(id, p); setPartState(p) }
  if (locked) return <ThreadTag projectId={projectId} part={part} className={cn("text-xs text-muted-foreground", className)} />
  return (
    <Select value={part} onValueChange={setPart}>
      <SelectTrigger size="sm" aria-label="Thread" className={cn("h-7 gap-1 border-transparent bg-transparent px-1.5 text-xs shadow-none hover:bg-background dark:bg-transparent", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {threads.map((t) => <SelectItem key={t.id} value={t.part} className="text-xs"><ThreadTag projectId={projectId} part={t.part} /></SelectItem>)}
      </SelectContent>
    </Select>
  )
}
