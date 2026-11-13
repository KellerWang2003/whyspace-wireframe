import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Illo } from "@/components/brand/illo/pieces"
import { DECISIONS, reachOf, type Decision, type Project } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useTasks } from "@/lib/work"
import { ThreadArtifacts, artifactMatches } from "./artifact-views"
import { DecisionList, DecisionsFooter, decisionMatches } from "./decision-list"
import { WorkingNow } from "./people-cards"
import { ConfirmedCount } from "./confirmed"
import { ProjectSearch } from "./project-search"
import { Count } from "./home"
import { TaskList, taskMatches } from "./task-list"
import { ThreadIcon, ThreadIconButton, ThreadMenu } from "./thread-ui"
import { ThreadToolbarSlot } from "./thread-toolbar"
import { intentOf, threadOf, updateThread, useAnyThread, type Thread } from "./threads"
import { useAllTasks, useArtifacts } from "./work"
import { NeedsFocus } from "./needs-focus"
import { useNeedsItems, useNeedsQueue } from "./needs-model"
import { useTodayRows } from "./today-model"

// A thread's own page. Opens on Tasks; Decisions and Artifacts sit beside it.
// Beside Tasks, a rail gives the thread's context: what the thread is for (its intent, one sentence,
// editable, read by agents over MCP), what needs you here, who's working now, and changes from other threads.

export type ThreadTab = "tasks" | "decisions" | "artifacts"

export function ThreadPage({ project, threadId, tab, sub }: { project: Project; threadId: string; tab: ThreadTab; sub?: string }) {
  const thread = useAnyThread(project.id, threadId)
  // One search for the thread's tabs; it clears when you go to another thread.
  const [found, setFound] = useState({ id: threadId, q: "" })
  const [toolbar, setToolbar] = useState<HTMLDivElement | null>(null)
  const search = found.id === threadId ? found.q : ""
  const query = search.trim().toLowerCase()
  const allTasks = useAllTasks()
  const artifacts = useArtifacts(project.id)
  if (!thread) {
    return (
      <div className="p-6 sm:p-8">
        <Empty className="border border-dashed py-16">
          <EmptyHeader><Illo name="went-wrong" className="mb-3 h-20" /><EmptyTitle>This thread isn't here anymore</EmptyTitle></EmptyHeader>
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
    <>
      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
          {/* The icon's button pulls left so the icon itself lines up with the tabs and table below. */}
          <header className="flex items-center gap-2.5">
            <ThreadIconButton projectId={project.id} thread={thread} className="-mr-1 -ml-1.5" />
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
                {/* The open tab's own controls (⋯, New task, Add) land here. */}
                <div ref={setToolbar} className="ml-auto flex items-center gap-2" />
              </div>
              <ThreadToolbarSlot.Provider value={toolbar}>
              {tab === "decisions" ? (
                <DecisionList key={thread.id} projectId={project.id} decisions={decisions} thread={thread} search={search} />
              ) : tab === "artifacts" ? (
                <ThreadArtifacts key={thread.id} projectId={project.id} thread={thread} selectedId={sub} search={search} />
              ) : (
                <TaskList key={thread.id} projectId={project.id} tasks={tasks} thread={thread} search={search} />
              )}
              </ThreadToolbarSlot.Provider>
            </div>
            {tab === "tasks" && <ThreadContext project={project} thread={thread} />}
          </div>
        </div>
      </div>
      {tab === "decisions" && <DecisionsFooter />}
    </>
  )
}

function Block({ title, icon, count, children }: { title: string; icon?: ReactNode; count?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 type-section">{icon}{title}{count !== undefined && <span className="font-normal text-muted-foreground tabular-nums">{count}</span>}</h2>
      {children}
    </section>
  )
}

function ThreadContext({ project, thread }: { project: Project; thread: Thread }) {
  const { openDecision } = useStore()
  const reachTasks = useTasks()
  // Today's Needs you, kept to the decisions in this thread: the same items and answers, one at a time.
  const rows = useTodayRows().filter((r) => r.kind === "decide" && r.project === project.id && r.decision.part === thread.part)
  const queue = useNeedsQueue(useNeedsItems(rows))

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

      {queue.current && (
        <Block title="Needs you" count={`${queue.pos} of ${queue.total}`}>
          <NeedsFocus compact queue={queue} onOpen={({ row }) => row.kind === "decide" && openDecision(row.decision.id)} />
        </Block>
      )}

      <Block title="Working now">
        <WorkingNow projects={[project.id]} part={thread.part} />
      </Block>

      {upstream.length > 0 && (
        <Block title="From other threads" count={upstream.length}>
          <ul className="space-y-2.5">
            {upstream.map(({ d, what }) => (
              <li key={d.id}>
                <button onClick={() => openDecision(d.id)} className="flex w-full items-start gap-2 text-left">
                  <ThreadIcon thread={threadOf(project.id, d.part)} className="mt-[3px]" />
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
