import { useState } from "react"
import { ChevronRight, ListFilter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ProjectIconButton } from "@/components/app/project-icon-picker"
import { ProjectCalendar } from "@/components/app/calendar/calendar"
import { DECISIONS, PEOPLE, type Project } from "@/data"
import { navigate } from "@/lib/router"
import { PINS } from "@/lib/scenario"
import { STAGE, STAGES } from "@/lib/stage"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { TODAY, dayOf } from "@/playground/model"
import { PersonAvatar } from "@/components/app/person"
import { useStore } from "@/lib/store"
import { HomeArtifacts, artifactMatches } from "./artifact-views"
import { WorkingNowList } from "./people-cards"
import { DecisionList, DecisionsFooter, decisionMatches } from "./decision-list"
import { ProjectSearch } from "./project-search"
import { NewMenu } from "./new-menu"
import { TaskList, taskMatches } from "./task-list"
import { NewThreadDialog, ShowThreadsMenu, ThreadIcon } from "./thread-ui"
import { intentOf, summaryOf, useAllThreads, useArchived, useShownThreads, useThreads, type Thread } from "./threads"
import { StartTask, StartThread } from "./empty-start"
import { ConfirmedCount } from "./confirmed"
import { pigmentOf } from "./hifi-model"
import { useAllTasks, useArtifacts } from "./work"
import { CaughtForYou } from "./caught"

// Home: the project's landing page, plus the rollup pages (Tasks, Decisions, Artifacts),
// each reached from the project nav, not tabs.
// Overview keeps the calendar, who's working now, Caught for you, members and threads. Tasks, Decisions and Artifacts
// show every thread's work in one place.

export type HomeTab = "home" | "tasks" | "decisions" | "artifacts"
// Whiskr's calendar opens on its stage's day; a test scenario pins its own day.
const todayOf = (project: Project) => (project.id === "whiskr" && !PINS ? dayOf(STAGES[STAGE - 1].date) ?? TODAY : TODAY)

export function ProjectHome({ project, tab, sub }: { project: Project; tab: HomeTab; sub?: string }) {
  const tasks = useAllTasks().filter((t) => t.project === project.name)
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  const artifacts = useArtifacts(project.id)
  // One search for the rollup tabs; it follows you between them and clears when you change project.
  const [found, setFound] = useState({ id: project.id, q: "" })
  const search = found.id === project.id ? found.q : ""
  const query = search.trim().toLowerCase()
  const open = tasks.filter((t) => t.status !== "done" && taskMatches(t, query)).length
  // A new project: Home leads with the first step instead of empty Working now and Caught for you.
  const noThreads = useAllThreads(project.id).length === 0
  const noWork = !tasks.length && !decisions.length && !artifacts.length

  return (
    <>
      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
          {/* Home is just Home. Tasks, Decisions and Artifacts are their own pages in the project nav. */}
          <header className="flex items-center gap-3">
            {tab === "home" ? <>
              <ProjectIconButton id={project.id} className="size-9 rounded-lg" />
              <h1 className="min-w-0 truncate type-title">{project.name}</h1>
            </> : (
              <h1 className="flex min-w-0 items-baseline gap-2 type-title">
                {PAGE_TITLE[tab]}
                <Count n={tab === "tasks" ? open : tab === "decisions" ? decisions.filter((d) => decisionMatches(d, query)).length : artifacts.filter((a) => artifactMatches(a, query)).length} />
              </h1>
            )}
            <div className="ml-auto flex items-center gap-2">
              <ProjectSearch label={`Search ${project.name}`} value={search} onChange={(q) => { setFound({ id: project.id, q }); if (tab === "home" && q) navigate(`/p/${project.id}/tasks`) }} />
              <NewMenu project={project} align="end" trigger={<Button><Plus />New</Button>} />
            </div>
          </header>
          {tab === "tasks" ? (
            <TaskList key={project.id} projectId={project.id} tasks={tasks} search={search} />
          ) : tab === "decisions" ? (
            <DecisionList key={project.id} projectId={project.id} decisions={decisions} search={search} />
          ) : tab === "artifacts" ? (
            <HomeArtifacts key={project.id} projectId={project.id} selectedId={sub} search={search} />
          ) : (
            <div className="grid items-start gap-10 pt-2 @4xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0 space-y-8">
                {noWork && (noThreads ? <StartThread projectId={project.id} /> : <StartTask projectId={project.id} />)}
                <ProjectCalendar project={project} today={todayOf(project)} />
                {!noWork && <>
                  <section aria-labelledby="working-now" className="flex flex-col gap-3">
                    <h2 id="working-now" className="type-section">Working now</h2>
                    <WorkingNowList project={project} artifacts={artifacts} />
                  </section>
                  <CaughtForYou project={project} />
                </>}
              </div>
              <aside aria-label="About this project" className="space-y-8">
                <Members project={project} />
                {!noThreads && <ThreadsPanel project={project} />}
              </aside>
            </div>
          )}
        </div>
      </div>
      {tab === "decisions" && <DecisionsFooter />}
    </>
  )
}

const PAGE_TITLE = { home: "Home", tasks: "Tasks", decisions: "Decisions", artifacts: "Artifacts" } as const

export function Count({ n }: { n: number }) {
  return <span className="text-xs font-normal text-muted-foreground tabular-nums">{n}</span>
}

// Each thread, in sidebar order, with where it stands, opening its own page.
// Archived threads fold away at the bottom and still open.
function ThreadsPanel({ project }: { project: Project }) {
  const hifi = useHifi()
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  const all = useThreads(project.id)
  const threads = useShownThreads(project.id)
  const archived = useArchived(project.id)
  const [creating, setCreating] = useState(false)
  const row = (t: Thread, muted = false) => {
    const summary = muted ? undefined : intentOf(t) ?? summaryOf(project.id, t.part)
    return (
      <li key={t.id}>
        <button data-tile onClick={() => navigate(`/p/${project.id}/t/${t.id}`)} className={cn("flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors", muted ? "hover:bg-muted" : "bg-muted/60 hover:bg-muted")}>
          <span className={cn("flex w-full items-center gap-2 text-sm", muted && "text-muted-foreground")}>
            <ThreadIcon thread={t} className={cn(muted && "opacity-50")} style={hifi ? { color: pigmentOf(t) } : undefined} />
            <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
            {!muted && <ConfirmedCount decisions={decisions.filter((d) => d.part === t.part)} />}
          </span>
          {summary && <span className="line-clamp-2 pl-[22px] text-xs leading-relaxed text-muted-foreground">{summary}</span>}
        </button>
      </li>
    )
  }
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center gap-2">
        <h2 className="type-section">Threads</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{threads.length}</span>
        {all.length > 0 && (
          <span className="ml-auto flex items-center">
            <ShowThreadsMenu projectId={project.id} trigger={<Button variant="ghost" size="icon-sm" className={cn("text-muted-foreground", threads.length < all.length && "text-foreground")} aria-label="Show threads" title="Show threads"><ListFilter /></Button>} />
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="New thread" onClick={() => setCreating(true)}><Plus /></Button>
          </span>
        )}
      </div>
      {threads.length > 0
        ? <ul className="flex flex-col gap-1.5">{threads.map((t) => row(t))}</ul>
        : all.length > 0
          ? <p className="text-sm text-muted-foreground">All threads hidden.</p>
          : <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setCreating(true)}><Plus />New thread</Button>}
      {archived.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />Archived<span className="tabular-nums">{archived.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent><ul className="mt-1.5 flex flex-col gap-1.5">{archived.map((t) => row(t, true))}</ul></CollapsibleContent>
        </Collapsible>
      )}
      <NewThreadDialog projectId={project.id} open={creating} onOpenChange={setCreating} />
    </section>
  )
}

// Members: avatars, with invite as + in the header, like Threads.
function Members({ project }: { project: Project }) {
  const { setInviteOpen } = useStore()
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center gap-2">
        <h2 className="type-section">Members</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{project.members.length}</span>
        <Button variant="ghost" size="icon-sm" className="ml-auto text-muted-foreground" aria-label="Invite people" onClick={() => setInviteOpen(true)}><Plus /></Button>
      </div>
      <div className="flex items-center -space-x-1.5">
        {project.members.map((id) => <span key={id} title={PEOPLE[id]?.name}><PersonAvatar id={id} className="size-8 ring-2 ring-background" /></span>)}
      </div>
    </section>
  )
}
