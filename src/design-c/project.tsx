import { AppShell } from "@/components/app/app-shell"
import { navigate, useRoute } from "@/lib/router"
import { cn } from "@/lib/utils"
import { HandoffCard } from "./handoff-card"
import { PROJECTS_C, TALKS, THREADS_C, type ProjectC, type ThreadC } from "./data"
import { handoffsOfProject, handoffsOfThread, needsYou, talkPhase, talksOfProject, threadStanding } from "./model"
import { useC } from "./state"
import { TalkPage, TalkRow } from "./talk"
import { Count, Faces, Lane, MarkC, ThreadDotC } from "./ui"

// Design C routes:
//   /today                               what needs you, what was handled
//   /projects                            your projects
//   /p/<id>                              a project: its threads and talks
//   /p/<id>/t/<thread>(/h/<handoff>)     a thread: one line of intent, handoffs newest first
//   /p/<id>/talks/<talk>                 a talk
export function ProjectC() {
  const [, id, kind, a, , c] = useRoute()
  const project = PROJECTS_C.find((p) => p.id === id) ?? PROJECTS_C[0]
  if (kind === "t") {
    const thread = THREADS_C.find((t) => t.project === project.id && t.id === a)
    return <AppShell crumbs={[{ label: project.name, to: `/p/${project.id}` }, { label: thread?.name ?? "Thread" }]}>{thread ? <ThreadPage project={project} thread={thread} focus={c} /> : <ProjectPage project={project} />}</AppShell>
  }
  if (kind === "talks") {
    const talk = TALKS.find((t) => t.id === a && t.project === project.id)
    return <AppShell crumbs={[{ label: project.name, to: `/p/${project.id}` }, { label: talk?.title ?? "Talk" }]}>{talk ? <TalkPage talk={talk} /> : <ProjectPage project={project} />}</AppShell>
  }
  return <AppShell crumbs={[{ label: project.name }]}><ProjectPage project={project} /></AppShell>
}

function ProjectPage({ project }: { project: ProjectC }) {
  const s = useC()
  const threads = THREADS_C.filter((t) => t.project === project.id)
  const talks = talksOfProject(project.id, s)
  const order = { live: 0, booked: 1, done: 2 } as const
  const sorted = [...talks].sort((x, y) => order[talkPhase(x, s)!] - order[talkPhase(y, s)!] || (talkPhase(x, s) === "done" ? (y.doneAt ?? 0) - (x.doneAt ?? 0) : x.bookedAt - y.bookedAt))
  const recent = handoffsOfProject(project.id, s.scene).slice(0, 3)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-6 sm:p-8">
      <header className="flex items-center gap-4">
        <MarkC project={project.id} className="size-9 text-base" />
        <h1 className="min-w-0 flex-1 type-title">{project.name}</h1>
        <Faces ids={project.members} max={6} />
      </header>

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No threads yet. The first share starts one.</p>
      ) : (
        <Lane title="Threads">
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {threads.map((t) => <ThreadRow key={t.id} thread={t} />)}
          </ul>
        </Lane>
      )}

      {sorted.length > 0 && (
        <Lane title="Talks">
          {sorted.map((t) => <TalkRow key={t.id} talk={t} phase={talkPhase(t, s)!} />)}
        </Lane>
      )}

      {recent.length > 0 && (
        <Lane title="Latest">
          {recent.map((h) => <HandoffCard key={h.id} handoff={h} showThread />)}
        </Lane>
      )}
    </div>
  )
}

function ThreadRow({ thread }: { thread: ThreadC }) {
  const s = useC()
  const st = threadStanding(thread.id, s)
  const mine = needsYou(s).filter((r) => (r.kind === "check" || r.kind === "ships") && r.handoff.thread === thread.id).length
  return (
    <li>
      <button type="button" onClick={() => navigate(`/p/${thread.project}/t/${thread.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <ThreadDotC thread={thread.id} className="size-2.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{thread.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{thread.intent}</span>
        </span>
        {mine > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] text-background tabular-nums">{mine}</span>}
        {st.total > 0 && <Count backed={st.backed} total={st.total} className="shrink-0 text-xs text-muted-foreground" />}
      </button>
    </li>
  )
}

function ThreadPage({ project, thread, focus }: { project: ProjectC; thread: ThreadC; focus?: string }) {
  const s = useC()
  const handoffs = handoffsOfThread(thread.id, s.scene)
  const talks = TALKS.filter((t) => t.thread === thread.id && talkPhase(t, s) !== null)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 sm:p-8">
      <header className="relative flex flex-col gap-1.5">
        <ThreadDotC thread={thread.id} className="absolute top-[15px] -left-5 size-3" />
        <h1 className="type-title">{thread.name}</h1>
        <p className="text-sm text-muted-foreground">{thread.intent}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Faces ids={project.members} max={6} size="size-5" />{project.name}</div>
      </header>

      {talks.length > 0 && (
        <div className="flex flex-col gap-2">
          {talks.map((t) => <TalkRow key={t.id} talk={t} phase={talkPhase(t, s)!} />)}
        </div>
      )}

      <div className={cn("flex flex-col gap-3")}>
        {handoffs.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing shared here yet.</p>}
        {handoffs.map((h) => <HandoffCard key={h.id} handoff={h} open={h.id === focus} />)}
      </div>
    </div>
  )
}

// All projects: a list, since the rail already carries their marks.
export function ProjectsC() {
  const s = useC()
  const mine = PROJECTS_C.filter((p) => p.members.includes(s.viewer))
  return (
    <AppShell crumbs={[{ label: "Projects" }]}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 sm:p-8">
        <h1 className="type-title">Projects</h1>
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {mine.map((p) => {
            const threads = THREADS_C.filter((t) => t.project === p.id).length
            const shares = handoffsOfProject(p.id, s.scene).length
            return (
              <li key={p.id}>
                <button type="button" onClick={() => navigate(`/p/${p.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                  <MarkC project={p.id} />
                  <span className="min-w-0 flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{threads === 0 ? "No threads" : `${threads} threads · ${shares} shared this week`}</span>
                  <Faces ids={p.members} max={6} size="size-5" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </AppShell>
  )
}
