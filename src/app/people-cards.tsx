import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { AI_TOOLS, ToolLogo } from "@/components/app/tool-logo"
import { ACTIVITY, PEOPLE, PROJECTS, type Activity, type Task } from "@/data"
import { navigate } from "@/lib/router"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { ThreadChip } from "./hifi-kit"
import { threadOf } from "./threads"
import { useAllTasks, useArtifactsOf, type Item } from "./work"

// Working now: one card per person, the same card wherever it shows. A thread's side column,
// a project's Home and Today differ only in how far they look (one thread, one project, all
// your projects) and how many cards fit across.
// Each card: who, what they're doing right now (in which tool, where, opening what they're on),
// then their next open tasks. People who are active come first; then anyone with open work here.

const firstName = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id
const isTheirs = (t: Task, id: string) => t.owner === id || !!t.assignees?.includes(id)
const idOfProject = (name: string) => PROJECTS.find((p) => p.name === name || p.id === name)?.id ?? name
const SHOWN_TASKS = 2

// projects: the projects in view. part: a thread, when the cards sit beside one.
export function WorkingNow({ projects, part, className }: { projects: string[]; part?: string; className?: string }) {
  const allTasks = useAllTasks()
  const artifacts = useArtifactsOf(projects)
  const inView = (project: string, p: string) => projects.includes(project) && (!part || p === part)
  // Beside a thread, what someone is doing in its other threads still shows on their card.
  const live = ACTIVITY.filter((a) => a.state === "active" && projects.includes(a.project))
  const here = live.filter((a) => inView(a.project, a.part))
  const tasks = allTasks.filter((t) => t.status !== "done" && inView(idOfProject(t.project), t.part))
  const people = [...new Set([...here.map((a) => a.who), ...tasks.flatMap((t) => [t.owner, ...(t.assignees ?? [])])])]
  const openOf = (id: string) => tasks.filter((t) => isTheirs(t, id))
  const isLive = (id: string) => here.some((a) => a.who === id)
  people.sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || openOf(b).length - openOf(a).length)

  if (!people.length) return <p className="text-sm text-muted-foreground">No one is working on anything here yet.</p>
  return (
    <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2.5", className)}>
      {people.map((id) => (
        <PersonCard key={id} id={id} part={part} across={projects.length > 1}
          doing={live.filter((a) => a.who === id)}
          tasks={openOf(id).sort((a, b) => Number(b.status === "prog") - Number(a.status === "prog"))}
          artifacts={artifacts} />
      ))}
    </ul>
  )
}

function PersonCard({ id, part, across, doing, tasks, artifacts }: {
  id: string; part?: string; across: boolean; doing: Activity[]; tasks: Task[]; artifacts: Item[]
}) {
  const hifi = useHifi()
  const active = doing.length > 0
  // The thread the card sits beside goes first; the rest are where else they're working.
  const sorted = [...doing].sort((a, b) => Number(b.part === part) - Number(a.part === part))
  return (
    <li className={cn("flex flex-col gap-3 border bg-card p-3.5", hifi ? "rounded-2xl" : "rounded-xl", active && "border-foreground/20")}>
      <div className="flex items-center gap-2.5">
        <PersonAvatar id={id} className={cn("size-8 shrink-0", active && "ring-2 ring-foreground ring-offset-2 ring-offset-card")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{firstName(id)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {active ? `Active for ${sorted[0].since}` : `${tasks.length} open task${tasks.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {sorted.map((a) => (
        <Doing key={a.project + a.part} activity={a} artifact={artifacts.find((x) => x.id === a.artifact)}
          where={across ? "project" : a.part !== part ? "thread" : undefined} inThread={!!part && a.part === part} />
      ))}

      {tasks.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {tasks.slice(0, SHOWN_TASKS).map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-xs leading-snug">
              <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", t.status === "prog" ? "bg-foreground" : "border border-muted-foreground")} />
              <span className="line-clamp-2 min-w-0 flex-1">{t.title}</span>
            </li>
          ))}
          {tasks.length > SHOWN_TASKS && <li className="pl-3.5 text-xs text-muted-foreground">{tasks.length - SHOWN_TASKS} more</li>}
        </ul>
      )}
    </li>
  )
}

// What they're doing now: the tool, the work shimmering while it runs, where it is, and the way into it.
function Doing({ activity: a, artifact, where, inThread }: { activity: Activity; artifact?: Item; where?: "project" | "thread"; inThread: boolean }) {
  const thread = threadOf(a.project, a.part)
  const open = () => artifact && navigate(inThread ? `/p/${a.project}/t/${thread.id}/artifacts/${artifact.id}` : `/p/${a.project}/artifacts/${artifact.id}`)
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted py-2 pr-1.5 pl-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug"><span className="shimmer-text">{a.aiDoing ?? a.doing}</span></p>
        <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
          {a.tool && <span className="inline-flex shrink-0 items-center gap-1">{AI_TOOLS.includes(a.tool) && <ToolLogo tool={a.tool} className="size-3" />}{a.tool}</span>}
          {where && a.tool && <span aria-hidden>·</span>}
          {where && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {where === "project" && <span title={PROJECTS.find((p) => p.id === a.project)?.name}><ProjectMark project={a.project} className="size-3.5" /></span>}
              <ThreadChip projectId={a.project} part={a.part} className="[&_svg]:size-3.5" />
            </span>
          )}
        </p>
      </div>
      {artifact && (
        <Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground" onClick={open} aria-label={`Open ${artifact.name}`} title={`Open ${artifact.name}`}>
          <ArrowUpRight />
        </Button>
      )}
    </div>
  )
}
