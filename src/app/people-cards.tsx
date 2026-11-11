import { useState } from "react"
import { ArrowUpRight, ChevronRight, CircleCheck, Diamond } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { ToolLogo } from "@/components/app/tool-logo"
import { ACTIVITY, PEOPLE, type Activity, type Decision, type Project, type Task } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ThreadIcon } from "./thread-ui"
import { threadOf, type Thread } from "./threads"
import type { Item } from "./work"

// Working now, in two layouts. On a thread page: one compact card per person with what they're doing
// right now (live, in which tool), the rest of what they're on, and what they've done here (folded).
// On Home: one flat row per person working, marked with their thread's color instead of grouped by it.

const firstName = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id
const isMine = (t: Task, id: string) => t.owner === id || !!t.assignees?.includes(id)

export function PeopleCards({ project, thread, tasks, decisions, artifacts }: {
  project: Project; thread: Thread; tasks: Task[]; decisions: Decision[]; artifacts: Item[]
}) {
  const live = ACTIVITY.filter((a) => a.project === project.id && a.state === "active")
  const here = live.filter((a) => a.part === thread.part)
  const mineArtifacts = artifacts.filter((a) => a.part === thread.part)
  const people = [...new Set([
    ...here.map((a) => a.who),
    ...tasks.filter((t) => t.status !== "done").flatMap((t) => [t.owner, ...(t.assignees ?? [])]),
    ...decisions.map((d) => d.owner),
  ])]
  // Working now first, then by how much they have open here.
  const openOf = (id: string) => tasks.filter((t) => t.status !== "done" && isMine(t, id)).length
  people.sort((a, b) => Number(here.some((x) => x.who === b)) - Number(here.some((x) => x.who === a)) || openOf(b) - openOf(a))

  if (!people.length) return <p className="text-sm text-muted-foreground">No one yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {people.map((id) => (
        <PersonCard key={id} id={id} project={project} thread={thread}
          now={here.find((a) => a.who === id)}
          elsewhere={live.filter((a) => a.who === id && a.part !== thread.part)}
          tasks={tasks.filter((t) => isMine(t, id))}
          decisions={decisions.filter((d) => d.owner === id || d.by === id)}
          artifacts={mineArtifacts.filter((a) => a.owner === id)}
          allArtifacts={artifacts} />
      ))}
    </ul>
  )
}

function PersonCard({ id, project, thread, now, elsewhere, tasks, decisions, artifacts, allArtifacts }: {
  id: string; project: Project; thread: Thread
  now?: (typeof ACTIVITY)[number]; elsewhere: (typeof ACTIVITY)[number][]
  tasks: Task[]; decisions: Decision[]; artifacts: Item[]; allArtifacts: Item[]
}) {
  const { openDecision } = useStore()
  const [showDone, setShowDone] = useState(false)
  const open = tasks.filter((t) => t.status !== "done").sort((a, b) => Number(b.status === "prog") - Number(a.status === "prog"))
  const done = [
    ...tasks.filter((t) => t.status === "done").map((t) => ({ key: t.id, kind: "task" as const, title: t.title })),
    ...decisions.filter((d) => d.status === "conf").map((d) => ({ key: d.id, kind: "decision" as const, title: d.title, id: d.id })),
  ]
  const artifactOf = (aid?: string) => allArtifacts.find((a) => a.id === aid)
  const nowArtifact = artifactOf(now?.artifact)
  const touched = new Set([...artifacts.map((a) => a.id), ...(nowArtifact ? [nowArtifact.id] : [])])
  const openArtifact = (a: Item) => navigate(a.part === thread.part ? `/p/${project.id}/t/${thread.id}/artifacts/${a.id}` : `/p/${project.id}/artifacts/${a.id}`)

  return (
    <li className={cn("rounded-lg border bg-background p-3", now && "border-foreground/25")}>
      <div className="flex items-center gap-2.5">
        <span className="relative shrink-0">
          <PersonAvatar id={id} className={cn("size-8", now && "ring-2 ring-foreground ring-offset-2 ring-offset-background")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{firstName(id)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {now ? <>Active · {now.since}</> : open.length ? `${open.length} open here` : "Nothing open here"}
          </p>
        </div>
      </div>

      {now && (
        <div className="mt-2.5 flex items-start gap-1 rounded-md bg-muted py-1 pr-1 pl-2.5">
          <p className="min-w-0 flex-1 py-1 text-xs leading-snug"><WorkingText activity={now} /></p>
          {nowArtifact && <OpenArtifact artifact={nowArtifact} onOpen={() => openArtifact(nowArtifact)} />}
        </div>
      )}

      {(open.length > 0 || elsewhere.length > 0) && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {open.slice(0, now ? 2 : 3).map((t) => (
            <li key={t.id} className="flex items-start gap-1.5 text-xs leading-snug">
              <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", t.status === "prog" ? "bg-foreground" : "border border-muted-foreground")} />
              <span className="min-w-0 flex-1 line-clamp-2">{t.title}</span>
              {t.tool && <ToolLogo tool={t.tool} className="mt-px size-3 opacity-70" />}
            </li>
          ))}
          {open.length > (now ? 2 : 3) && <li className="pl-3 text-xs text-muted-foreground">+{open.length - (now ? 2 : 3)} more</li>}
          {elsewhere.map((a) => (
            <li key={a.part + a.doing} className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
              <span className="mt-1 size-1.5 shrink-0 animate-pulse rounded-full bg-muted-foreground" />
              <span className="min-w-0 flex-1">Also in {a.part}: {a.aiDoing ?? a.doing}</span>
            </li>
          ))}
        </ul>
      )}

      {(touched.size > 0 || done.length > 0) && (
        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
          {touched.size > 0 && <span>{touched.size} artifact{touched.size > 1 ? "s" : ""}</span>}
          {done.length > 0 && (
            <button onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="ml-auto flex items-center gap-0.5 hover:text-foreground">
              Done {done.length}<ChevronRight className={cn("size-3 transition-transform", showDone && "rotate-90")} />
            </button>
          )}
        </div>
      )}
      {showDone && (
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {done.map((d) => (
            <li key={d.key} className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
              {d.kind === "task" ? <CircleCheck className="mt-px size-3 shrink-0" /> : <Diamond className="mt-px size-3 shrink-0" />}
              {d.kind === "decision"
                ? <button onClick={() => openDecision(d.id)} className="min-w-0 flex-1 text-left hover:text-foreground hover:underline">{d.title}</button>
                : <span className="min-w-0 flex-1">{d.title}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// "Perplexity · Researching what cats see", shimmering while the tool works on it.
function WorkingText({ activity: a }: { activity: Activity }) {
  return <span className="shimmer-text">{a.tool ? `${a.tool} · ` : ""}{a.aiDoing ?? a.doing}</span>
}

function OpenArtifact({ artifact, onOpen }: { artifact: Item; onOpen: () => void }) {
  return (
    <Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground" onClick={onOpen} aria-label={`Open ${artifact.name}`} title={`Open ${artifact.name}`}>
      <ArrowUpRight />
    </Button>
  )
}

// Home: everyone working now in this project, one row each, newest first as listed. The dot is
// their thread's color; the row says what they're doing and opens the artifact they're on.
export function WorkingNowList({ project, artifacts }: { project: Project; artifacts: Item[] }) {
  const live = ACTIVITY.filter((a) => a.project === project.id && a.state === "active")
  if (!live.length) return <p className="text-sm text-muted-foreground">No one's working right now.</p>
  return (
    <ul className="divide-y rounded-lg border">
      {live.map((a) => {
        const thread = threadOf(project.id, a.part)
        const artifact = artifacts.find((x) => x.id === a.artifact)
        return (
          <li key={a.who + a.part} className="flex items-center gap-3 px-3 py-2">
            <PersonAvatar id={a.who} className="size-7" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm">
                <span className="truncate font-medium">{firstName(a.who)}</span>
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" title={thread.name}>
                  <ThreadIcon thread={thread} className="size-3" /><span className="truncate">{thread.name}</span>
                </span>
              </p>
              <p className="truncate text-xs leading-snug"><WorkingText activity={a} /></p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{a.since}</span>
            {artifact
              ? <OpenArtifact artifact={artifact} onOpen={() => navigate(`/p/${project.id}/artifacts/${artifact.id}`)} />
              : <span aria-hidden className="size-6 shrink-0" />}
          </li>
        )
      })}
    </ul>
  )
}
