import { useState } from "react"
import { Check, ChevronRight, ClipboardCopy, Copy, Radio, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { TaskStatusIcon } from "@/components/app/tasks"
import {
  ACTIVITY,
  ARTIFACTS,
  DAY_INSIGHT,
  DECISIONS,
  PEOPLE,
  PROJECT_DECISION_SUMMARY,
  SESSIONS,
  SHAPED,
  WEEK_SUMMARY,
  changedSince,
  nextMilestone,
  partsOf,
  touchesMe,
  type Artifact,
  type Decision,
  type NeedsYou,
  type Project,
} from "@/data"
import { askWhyspace } from "@/lib/ask"
import { navigate } from "@/lib/router"
import { STAGE, STAGES } from "@/lib/stage"
import { useStore } from "@/lib/store"
import { VIEWER } from "@/lib/viewer"
import { useNeedsYou, useStatusOf, useTasks } from "@/lib/work"
import { cn } from "@/lib/utils"
import { ArtifactPicture } from "@/playground/artifact"
import { TODAY, dayOf } from "@/playground/model"

// Catch up is the project's landing page: a briefing written for the viewer at this stage.
// Order: summary, the week, milestone health, what needs you, what changed, who's working.
// "New here" (first visit) swaps the week for the decisions that shaped the project.
// Ask Whyspace's bar sits at the bottom; "Ask about this" sends a question there.
export function CatchUp({ project, variant }: { project: Project; variant?: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-32 sm:px-6">
        {variant === "new-here" ? <NewHere project={project} /> : <Briefing project={project} />}
      </div>
    </div>
  )
}

// The prototype's today: the Whiskr stage's date, or Oct 25 for other projects.
const todayOf = (project: Project) => (project.id === "whiskr" ? dayOf(STAGES[STAGE - 1].date) ?? TODAY : TODAY)
const openArtifact = (a: Artifact) => navigate(`/p/${a.project}/artifacts/${a.id}`)

function Block({ title, count, children, aside }: { title: string; count?: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">{title}{count !== undefined && <span className="ml-1.5 tabular-nums">{count}</span>}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

// A quiet button that sends a question about one row to Ask Whyspace.
function AskAbout({ question }: { question: string }) {
  return (
    <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground" title="Ask about this" aria-label={`Ask Whyspace: ${question}`} onClick={() => askWhyspace(question)}>
      <Sparkles className="size-3.5" />
    </Button>
  )
}

function copy(text: string, message: string) {
  try { void navigator.clipboard?.writeText(text) } catch { /* clipboard blocked: the toast still explains */ }
  toast(message)
}

function Briefing({ project }: { project: Project }) {
  const changed = changedSince(project.id)
  const summary = WEEK_SUMMARY[project.id]
  const milestone = useMilestone(project)

  const update = [
    `${project.name} · update`,
    summary,
    ...changed.decisions.map((d) => `• ${d.title} (${d.by ?? PEOPLE[d.owner]?.name})`),
    milestone && `Milestone: ${milestone}`,
  ].filter(Boolean).join("\n")

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />Since you were last here</p>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-muted-foreground" onClick={() => copy(update, "Update copied. Paste it wherever you report.")}><ClipboardCopy />Copy as update</Button>
        </div>
        <p className="leading-relaxed">{summary}</p>
        {changed.decisions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Sources</span>
            {changed.decisions.slice(0, 4).map((d) => <DecisionChip key={d.id} decision={d} />)}
          </div>
        )}
        {milestone && <p className="text-xs text-muted-foreground">{milestone}</p>}
      </header>

      <WeekStrip project={project} />
      <NeedsYouBlock project={project} />
      <WhatChanged project={project} decisions={changed.decisions} artifacts={changed.artifacts} />
      <WhoIsWorking project={project} />
    </div>
  )
}

// "<milestone> · <date> · 80% · 2 tasks left · on track". Worked out from the tasks, never set by hand.
function useMilestone(project: Project) {
  const tasks = useTasks().filter((t) => t.project === project.name)
  const next = nextMilestone(project.id)
  if (!next || !tasks.length) return null
  const left = tasks.filter((t) => t.status !== "done")
  const late = left.some((t) => (dayOf(t.due) ?? 99) < todayOf(project))
  const pct = Math.round(((tasks.length - left.length) / tasks.length) * 100)
  return `${next.name} · ${next.date} · ${pct}% · ${left.length} ${left.length === 1 ? "task" : "tasks"} left · ${late ? "at risk" : "on track"}`
}

function DecisionChip({ decision: d }: { decision: Decision }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  return (
    <button onClick={() => openDecision(d.id)} className="flex max-w-56 items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-muted hover:text-foreground">
      <StatusIcon status={statusOf(d)} className="size-3 shrink-0" />
      <span className="truncate">{d.title}</span>
    </button>
  )
}

// One tile per day, one small shape per decision, one insight line. Meeting days are marked.
// Busy days group shapes by part so the strip still reads at a glance.
function WeekStrip({ project }: { project: Project }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  const today = todayOf(project)
  const days = Array.from({ length: 7 }, (_, i) => 19 + i)
  const decisions = DECISIONS.filter((d) => d.project === project.id && d.when)
  const meetings = SESSIONS.filter((s) => s.project === project.id && s.status !== "Scheduled")
  return (
    <Block title="This week" aside={<span className="text-xs text-muted-foreground">Oct 19 – 25</span>}>
      <div className="-mx-1 overflow-x-auto px-1">
        <ol className="grid min-w-[560px] grid-cols-7 gap-1.5">
          {days.map((day, i) => {
            const ds = decisions.filter((d) => dayOf(d.when) === day)
            const meeting = meetings.find((s) => (dayOf(s.when) ?? (s.status === "Live" ? today : undefined)) === day)
            const future = day > today
            const byPart = ds.length > 4 ? partsOf(ds) : null
            return (
              <li key={day} className={cn("flex min-h-28 flex-col gap-2 rounded-lg border p-2", day === today && "border-foreground/50", future && "border-dashed opacity-50")}>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className={cn(day === today && "font-medium text-foreground")}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]} {day}</span>
                  {meeting && <span title={`Meeting · ${meeting.title}`} className="ml-auto"><Radio className="size-3" /><span className="sr-only">Meeting: {meeting.title}</span></span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {byPart
                    ? byPart.map((p) => <span key={p.name} className="rounded border px-1 text-[10px]">{p.name} {ds.filter((d) => d.part === p.name).length}</span>)
                    : ds.map((d) => (
                        <button key={d.id} title={d.title} aria-label={d.title} onClick={() => openDecision(d.id)} className="rounded p-0.5 hover:bg-muted">
                          <StatusIcon status={statusOf(d)} className="size-3.5 text-foreground/70" />
                        </button>
                      ))}
                </div>
                <p className="mt-auto text-[11px] leading-snug text-muted-foreground">{future ? "" : DAY_INSIGHT[project.id]?.[day] ?? (ds.length ? `${ds.length} ${ds.length === 1 ? "decision" : "decisions"}` : "Quiet")}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </Block>
  )
}

// Needs you, in two kinds: Decide (confirm, review, answer) and Do (tasks, including updates to apply).
function NeedsYouBlock({ project }: { project: Project }) {
  const items = useNeedsYou(project.id)
  const decide = items.filter((i) => i.kind === "decide")
  const doing = items.filter((i) => i.kind === "do")
  return (
    <Block title="Needs you" count={items.length}>
      {items.length ? (
        <div className="space-y-4">
          {decide.length > 0 && <div className="space-y-1.5"><p className="text-[11px] text-muted-foreground">Decide</p>{decide.map((item) => <NeedsYouCard key={item.id} item={item} project={project} />)}</div>}
          {doing.length > 0 && <div className="space-y-1.5"><p className="text-[11px] text-muted-foreground">Do</p>{doing.map((item) => <NeedsYouCard key={item.id} item={item} project={project} />)}</div>}
        </div>
      ) : <p className="text-sm text-muted-foreground">Nothing waits on you.</p>}
    </Block>
  )
}

function NeedsYouCard({ item, project }: { item: NeedsYou; project: Project }) {
  const { openDecision, confirmDecision, patchTask } = useStore()
  const row = "flex items-center gap-3 rounded-lg border px-3 py-2"

  if (item.kind === "decide") {
    const d = item.decision
    const ask = { confirm: `Confirm the reason · ${d.why ?? "No reason recorded"}`, review: `Review · ${d.by ?? PEOPLE[d.owner]?.name} · ${d.part}`, answer: `Decide${d.due ? ` by ${d.due}` : ""} · ${d.part}` }[item.ask]
    return (
      <div className={row}>
        <StatusIcon status={d.status} className="size-4 shrink-0 text-muted-foreground" />
        <button onClick={() => openDecision(d.id)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm hover:underline">{d.title}</span>
          <span className="block truncate text-xs text-muted-foreground">{ask}</span>
        </button>
        <AskAbout question={`Why ${lowerFirst(d.title)}?`} />
        {item.ask === "confirm"
          ? <Button size="sm" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}>Confirm</Button>
          : <Button size="sm" variant="outline" onClick={() => openDecision(d.id)}>{item.ask === "answer" ? "Decide" : "Review"}</Button>}
      </div>
    )
  }

  const t = item.task
  const finish = () => {
    patchTask(t.id, { status: "done" })
    toast("Task done", { description: t.prompt ? "The work now shows as updated on the decision." : undefined, action: { label: "Undo", onClick: () => patchTask(t.id, { status: t.status }) } })
  }
  return (
    <div className={row}>
      <TaskStatusIcon status={t.status} />
      <button onClick={() => (t.decision ? openDecision(t.decision) : navigate(`/p/${project.id}/tasks`))} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm hover:underline">{t.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{t.prompt ? `Update · ${t.tool} · ` : ""}Due {t.due}</span>
      </button>
      {t.prompt && <Button size="sm" variant="ghost" className="text-muted-foreground" title={t.prompt} onClick={() => copy(t.prompt!, `Prompt copied. Paste it into ${t.tool}.`)}><Copy />Prompt</Button>}
      <Button size="sm" variant="outline" onClick={finish}><Check />Done</Button>
    </div>
  )
}

// What changed, split by the Inbox rule: decisions and work that touch yours open by default.
function WhatChanged({ project, decisions, artifacts }: { project: Project; decisions: Decision[]; artifacts: Artifact[] }) {
  const [elsewhereOpen, setElsewhereOpen] = useState(false)
  const mine = decisions.filter(touchesMe)
  const others = decisions.filter((d) => !touchesMe(d))
  const myWork = artifacts.filter((a) => a.owner === VIEWER || mine.some((d) => d.part === a.part))
  const otherWork = artifacts.filter((a) => !myWork.includes(a))
  if (!decisions.length && !artifacts.length) return null
  return (
    <Block title="What changed">
      <div className="divide-y rounded-lg border">
        <div className="space-y-1.5 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">Touches your work</p>
          {mine.length || myWork.length ? (
            <ChangeList decisions={mine} artifacts={myWork} />
          ) : <p className="text-sm text-muted-foreground">Nothing new touches your work.</p>}
        </div>
        {(others.length > 0 || otherWork.length > 0) && (
          <div className="px-3 py-2">
            <button aria-expanded={elsewhereOpen} onClick={() => setElsewhereOpen((o) => !o)} className="flex w-full items-center gap-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground">
              <ChevronRight className={cn("size-3 transition-transform duration-200 motion-reduce:transition-none", elsewhereOpen && "rotate-90")} />
              Elsewhere in {project.name} <span className="tabular-nums">{others.length + otherWork.length}</span>
            </button>
            <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none", elsewhereOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} inert={!elsewhereOpen}>
              <div className="min-h-0 overflow-hidden"><div className="space-y-1.5 pt-2"><ChangeList decisions={others} artifacts={otherWork} /></div></div>
            </div>
          </div>
        )}
      </div>
    </Block>
  )
}

function ChangeList({ decisions, artifacts }: { decisions: Decision[]; artifacts: Artifact[] }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  return (
    <>
      {decisions.map((d) => (
        <div key={d.id} className="flex items-center gap-2">
          <button onClick={() => openDecision(d.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm hover:underline">
            <StatusIcon status={statusOf(d)} className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{d.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{d.part} · {d.by?.split(" ")[0] ?? PEOPLE[d.owner]?.name}</span>
          </button>
          <AskAbout question={`Why ${lowerFirst(d.title)}?`} />
        </div>
      ))}
      {artifacts.length > 0 && <div className="flex flex-wrap gap-1.5 pt-0.5">{artifacts.map((a) => <ArtifactChip key={a.id} artifact={a} />)}</div>}
    </>
  )
}

// Who's working on what: person, their tool and the artifact they're on. Awareness is the most frequent need.
function WhoIsWorking({ project }: { project: Project }) {
  const activity = ACTIVITY.filter((a) => a.project === project.id && a.state === "active")
  if (!activity.length) return null
  return (
    <Block title="Who's working on what">
      <ul className="divide-y rounded-lg border">
        {activity.map((a) => {
          const artifact = ARTIFACTS.find((x) => x.id === a.artifact)
          return (
            <li key={a.who} className="flex items-center gap-3 px-3 py-2 text-sm">
              <PersonAvatar id={a.who} />
              <span className="w-20 shrink-0 truncate font-medium">{PEOPLE[a.who]?.name.split(" ")[0]}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.tool ? `${a.tool} · ` : ""}{a.aiDoing ?? a.doing}</span>
              {artifact ? <button onClick={() => openArtifact(artifact)} className="max-w-48 shrink-0 truncate rounded-md border px-2 py-0.5 text-xs hover:bg-muted">{artifact.name}</button> : <span className="shrink-0 text-xs text-muted-foreground">{a.doing}</span>}
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">{a.since}</span>
            </li>
          )
        })}
      </ul>
    </Block>
  )
}

// First visit: the 5 to 10 decisions that shaped the project, not all of them.
function NewHere({ project }: { project: Project }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  const milestone = useMilestone(project)
  const shaped = (SHAPED[project.id] ?? []).map((id) => DECISIONS.find((d) => d.id === id)).filter((d): d is Decision => !!d)
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />New here</p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to {project.name}</h1>
        <p className="leading-relaxed">{PROJECT_DECISION_SUMMARY[project.id] ?? project.brief}</p>
        {milestone && <p className="text-xs text-muted-foreground">{milestone}</p>}
      </header>
      <Block title="Decisions that shaped this project" count={shaped.length}>
        {shaped.length ? (
          <ol className="divide-y rounded-lg border">
            {shaped.map((d, i) => (
              <li key={d.id}>
                <button onClick={() => openDecision(d.id)} className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-muted/50">
                  <span className="w-4 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <StatusIcon status={statusOf(d)} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{d.title}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{d.why}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{d.part} · {d.when}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">Nothing has shaped the project yet.</p>}
      </Block>
      <WhoIsWorking project={project} />
    </div>
  )
}

function ArtifactChip({ artifact: a }: { artifact: Artifact }) {
  return (
    <button onClick={() => openArtifact(a)} className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border bg-background p-1 pr-2.5 text-left transition hover:border-foreground/40">
      <div className="pointer-events-none relative h-full w-12 shrink-0 overflow-hidden rounded-sm bg-muted/60">
        <div className="absolute top-0 left-0 h-[150px] w-[260px] origin-top-left scale-[0.185]">
          <ArtifactPicture artifact={{ ...a, content: undefined }} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium leading-tight">{a.name}</div>
        <div className="truncate text-[11px] leading-tight text-muted-foreground">{a.kind} · {a.updated}</div>
      </div>
    </button>
  )
}
