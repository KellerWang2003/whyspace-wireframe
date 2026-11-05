import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { StatusIcon } from "@/components/app/status-badge"
import { decisionById, DECISIONS, PEOPLE, reachOf, type Decision, type NeedsYou, type Project, type Task } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useNeedsYou, useStatusOf, useTasks } from "@/lib/work"
import { ThreadArtifacts, artifactMatches } from "./artifact-views"
import { DecisionList, decisionMatches } from "./decision-list"
import { PeopleCards } from "./people-cards"
import { ConfirmedCount } from "./confirmed"
import { ProjectSearch } from "./project-search"
import { Count } from "./home"
import { TaskList, taskMatches } from "./task-list"
import { ThreadDot, ThreadMenu } from "./thread-ui"
import { intentOf, threadOf, updateThread, useAnyThread, type Thread } from "./threads"
import { useAllTasks, useArtifacts, type Item } from "./work"

// A thread's own page. Opens on Tasks; Decisions and Artifacts sit beside it.
// Beside Tasks, a rail gives the thread's context: what the thread is for (its intent, one sentence,
// editable, read by agents over MCP), what needs you here, who's working now, and changes from other threads.

export type ThreadTab = "tasks" | "decisions" | "artifacts"

export function ThreadPage({ project, threadId, tab, sub }: { project: Project; threadId: string; tab: ThreadTab; sub?: string }) {
  const thread = useAnyThread(project.id, threadId)
  // One search for the thread's tabs; it clears when you go to another thread.
  const [found, setFound] = useState({ id: threadId, q: "" })
  const search = found.id === threadId ? found.q : ""
  const query = search.trim().toLowerCase()
  const allTasks = useAllTasks()
  const artifacts = useArtifacts(project.id)
  if (!thread) {
    return (
      <div className="p-6 sm:p-8">
        <Empty className="border border-dashed py-16">
          <EmptyHeader><EmptyTitle>This thread isn't here anymore</EmptyTitle></EmptyHeader>
          <EmptyContent><Button size="sm" variant="outline" onClick={() => navigate(`/p/${project.id}/home`)}>Go to Home</Button></EmptyContent>
        </Empty>
      </div>
    )
  }
  const tasks = allTasks.filter((t) => t.project === project.name && t.part === thread.part)
  const decisions = DECISIONS.filter((d) => d.project === project.id && d.part === thread.part)
  const mine = artifacts.filter((a) => a.part === thread.part)
  const base = `/p/${project.id}/t/${thread.id}`

  return (
    <div className="@container min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
        {/* The dot hangs in the left margin so the title lines up with the tabs and table below. */}
        <header className="relative flex items-center gap-2.5">
          <ThreadDot color={thread.color} className="absolute top-1/2 -left-5 size-3 -translate-y-1/2" />
          <h1 className="min-w-0 truncate type-title">{thread.name}</h1>
          <ThreadMenu projectId={project.id} thread={thread} />
          <ConfirmedCount decisions={decisions} className="text-sm" />
          <div className="ml-auto">
            <ProjectSearch label={`Search ${thread.name}`} value={search} onChange={(q) => setFound({ id: threadId, q })} />
          </div>
        </header>
        {thread.archived && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-2.5 text-sm">
            <Archive className="size-4 text-muted-foreground" />
            <span className="flex-1">Archived</span>
            <Button size="sm" variant="outline" onClick={() => { updateThread(project.id, thread.id, { archived: false }); toast(`${thread.name} restored`) }}>Restore</Button>
          </div>
        )}
        {/* The context rail sits with Tasks, where the thread opens. Decisions and Artifacts take the full width. */}
        <div className={cn("grid items-start gap-10", tab === "tasks" && "@4xl:grid-cols-[minmax(0,1fr)_260px]")}>
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-1.5">
              <Tabs value={tab} onValueChange={(v) => navigate(v === "tasks" ? base : `${base}/${v}`)}>
                <TabsList variant="line" className="-ml-2 [&>button]:focus-visible:border-transparent [&>button]:focus-visible:bg-muted [&>button]:focus-visible:ring-0 [&>button]:focus-visible:outline-none [&>button]:after:!bottom-[-11px]">
                  <TabsTrigger value="tasks">Tasks<Count n={tasks.filter((t) => t.status !== "done" && taskMatches(t, query)).length} /></TabsTrigger>
                  <TabsTrigger value="decisions">Decisions<Count n={decisions.filter((d) => decisionMatches(d, query)).length} /></TabsTrigger>
                  <TabsTrigger value="artifacts">Artifacts<Count n={mine.filter((a) => artifactMatches(a, query)).length} /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {tab === "decisions" ? (
              <DecisionList key={thread.id} projectId={project.id} decisions={decisions} thread={thread} search={search} />
            ) : tab === "artifacts" ? (
              <ThreadArtifacts key={thread.id} projectId={project.id} thread={thread} selectedId={sub} search={search} />
            ) : (
              <TaskList key={thread.id} projectId={project.id} tasks={tasks} thread={thread} search={search} />
            )}
          </div>
          {tab === "tasks" && <ThreadContext project={project} thread={thread} tasks={tasks} artifacts={artifacts} />}
        </div>
      </div>
    </div>
  )
}

function Block({ title, icon, count, children }: { title: string; icon?: ReactNode; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 type-section">{icon}{title}{count !== undefined && <span className="font-normal text-muted-foreground tabular-nums">{count}</span>}</h2>
      {children}
    </section>
  )
}

function ThreadContext({ project, thread, tasks, artifacts }: { project: Project; thread: Thread; tasks: Task[]; artifacts: Item[] }) {
  const { openDecision, confirmDecision, settleClash } = useStore()
  const statusOf = useStatusOf()
  const reachTasks = useTasks()
  const needs = useNeedsYou(project.id).filter((i): i is Extract<NeedsYou, { kind: "decide" }> => i.kind === "decide" && i.decision.part === thread.part)
  const decisions = DECISIONS.filter((d) => d.project === project.id && d.part === thread.part)

  // Decisions made in other threads that changed this thread's work and still need an update here.
  const upstream: { d: Decision; what: string }[] = []
  for (const d of DECISIONS) {
    if (d.project !== project.id || d.part === thread.part) continue
    const hits = reachOf(d.id, reachTasks).filter((r) => r.needsUpdate && r.artifact.part === thread.part)
    if (hits.length) upstream.push({ d, what: [...new Set(hits.map((r) => r.artifact.name))].join(", ") })
  }

  return (
    <aside aria-label="About this thread" className="grid content-start gap-8 @2xl:grid-cols-2 @4xl:grid-cols-1">
      <IntentCard projectId={project.id} thread={thread} />

      {needs.length > 0 && (
        <Block title="Needs you" count={needs.length}>
          <ul className="space-y-2">
            {needs.map((i) => {
              const d = i.decision
              return (
                <li key={d.id} className="flex items-start gap-2">
                  <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  {/* A clash keeps its two buttons under the title, so the title keeps its width. */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <button onClick={() => openDecision(d.id)} className="min-w-0 text-left text-sm leading-snug hover:underline">{d.title}</button>
                    {i.ask === "clash" && <ClashButtons decision={d} onSettle={(choice, name) => { settleClash(d.id, choice); toast(choice === "theirs" ? `Took ${name}’s decision` : `Kept yours. ${name} sees the clash.`) }} />}
                  </div>
                  {i.ask === "confirm"
                    ? <Button size="xs" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}>Confirm</Button>
                    : i.ask !== "clash" && <Button size="xs" variant="outline" onClick={() => openDecision(d.id)}>{i.ask === "answer" ? "Decide" : "Review"}</Button>}
                </li>
              )
            })}
          </ul>
        </Block>
      )}

      <Block title="Working now">
        <PeopleCards project={project} thread={thread} tasks={tasks} decisions={decisions} artifacts={artifacts} />
      </Block>

      {upstream.length > 0 && (
        <Block title="From other threads" count={upstream.length}>
          <ul className="space-y-2.5">
            {upstream.map(({ d, what }) => (
              <li key={d.id}>
                <button onClick={() => openDecision(d.id)} className="flex w-full items-start gap-2 text-left">
                  <ThreadDot color={threadOf(project.id, d.part).color} className="mt-1.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug hover:underline">{d.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">Update {what}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Block>
      )}

    </aside>
  )
}

// Take the other person's confirmed decision, or keep yours; the clash stays visible to both until one changes.
function ClashButtons({ decision: d, onSettle }: { decision: Decision; onSettle: (choice: "theirs" | "mine", name: string) => void }) {
  const other = decisionById(d.clashes)
  if (!other) return null
  const name = PEOPLE[other.owner]?.name.split(" ")[0] ?? other.owner
  return (
    <span className="flex shrink-0 gap-1">
      <Button size="xs" onClick={() => onSettle("theirs", name)}>Take {name}’s</Button>
      <Button size="xs" variant="outline" onClick={() => onSettle("mine", name)}>Keep mine</Button>
    </span>
  )
}

// What the thread is for, in one sentence the team wrote. Click to change it.
function IntentCard({ projectId, thread }: { projectId: string; thread: Thread }) {
  const intent = intentOf(thread)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(intent ?? "")
  const save = () => {
    const next = draft.trim()
    if (next !== (intent ?? "")) { updateThread(projectId, thread.id, { intent: next }); toast("Intent saved") }
    setEditing(false)
  }
  return (
    <Block title="Intent">
      {editing ? (
        <Textarea
          autoFocus
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save() } if (e.key === "Escape") { setDraft(intent ?? ""); setEditing(false) } }}
          aria-label="Intent"
          placeholder="What is this thread for?"
          className="min-h-0 resize-none text-sm leading-relaxed"
        />
      ) : (
        <button type="button" onClick={() => { setDraft(intent ?? ""); setEditing(true) }} title="Edit" className={cn("rounded-md text-left text-sm leading-relaxed hover:bg-muted/60", !intent && "text-muted-foreground")}>
          {intent ?? "What is this thread for?"}
        </button>
      )}
    </Block>
  )
}
