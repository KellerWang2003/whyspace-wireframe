import { useState } from "react"
import { ArrowUp, Check, ChevronRight, ClipboardCopy, Copy, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PersonAvatar } from "@/components/app/person"
import { ProjectNewMenu } from "@/components/app/project-new-menu"
import { ProjectMark } from "@/components/app/project-mark"
import { ProjectCalendar } from "@/components/app/calendar/calendar"
import { StatusIcon } from "@/components/app/status-badge"
import { TaskStatusIcon } from "@/components/app/tasks"
import {
  ACTIVITY,
  ARTIFACTS,
  CANVAS_EXTRAS,
  DECISIONS,
  PEOPLE,
  PROJECT_DECISION_SUMMARY,
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
import { ASK_LABEL, askWhyspace } from "@/lib/ask"
import { DESIGN } from "@/lib/design"
import { navigate } from "@/lib/router"
import { STAGE, STAGES } from "@/lib/stage"
import { useStore } from "@/lib/store"
import { VIEWER } from "@/lib/viewer"
import { useNeedsYou, useStatusOf, useTasks } from "@/lib/work"
import { cn } from "@/lib/utils"
import { ArtifactPicture } from "@/playground/artifact"
import { reply, type Msg } from "@/playground/reply"
import { LAST_VISIT, TODAY, dayOf } from "@/playground/model"

// Overview is the project's landing page, centred, in two columns.
// Left (wide): the project calendar, then a fixed-height Catch up card (See more opens the whole
// catch up beside a chat). Right (narrow): members as overlapping avatars with +, and the threads.
// Only the Catch up card has a background; everything else is plain.
// Ask Whyspace sits in the corner, as on every page; "Ask about this" sends a question there.
export function Overview({ project }: { project: Project; variant?: string }) {
  return (
    <div className="@container min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl space-y-8 p-6 sm:p-8">
        <OverviewHeader project={project} />
        <div className="grid items-start gap-10 @4xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-8">
            <ProjectCalendar project={project} today={todayOf(project)} />
            <CatchUpCard project={project} />
          </div>
          <aside aria-label="About this project" className="space-y-8">
            <Members project={project} />
            <Threads project={project} />
          </aside>
        </div>
      </div>
    </div>
  )
}

// The prototype's today: the Whiskr stage's date, or Oct 25 for other projects.
const todayOf = (project: Project) => (project.id === "whiskr" ? dayOf(STAGES[STAGE - 1].date) ?? TODAY : TODAY)
const openArtifact = (a: Artifact) => navigate(`/p/${a.project}/artifacts/${a.id}`)
// Day numbers count from Oct 0 (see dayOf): Sep 28 = -2, Oct 19 = 19, Nov 1 = 32.
const dateLabel = (day: number) => (day > 31 ? `Nov ${day - 31}` : day < 1 ? `Sep ${day + 30}` : `Oct ${day}`)

function Block({ title, count, children, aside }: { title: string; count?: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="type-label text-muted-foreground">{title}{count !== undefined && <span className="ml-1.5 tabular-nums">{count}</span>}</h2>
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
    <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" title="Ask about this" aria-label={`${ASK_LABEL}: ${question}`} onClick={() => askWhyspace(question)}>
      <Sparkles className="size-3.5" />
    </Button>
  )
}

function copy(text: string, message: string) {
  try { void navigator.clipboard?.writeText(text) } catch { /* clipboard blocked: the toast still explains */ }
  toast(message)
}

// Next milestone health, worked out from the tasks, never set by hand.
function useMilestone(project: Project) {
  const tasks = useTasks().filter((t) => t.project === project.name)
  const next = nextMilestone(project.id)
  if (!next || !tasks.length) return null
  const left = tasks.filter((t) => t.status !== "done")
  const late = left.some((t) => (dayOf(t.due) ?? 99) < todayOf(project))
  const pct = Math.round(((tasks.length - left.length) / tasks.length) * 100)
  return { next, pct, left: left.length, late }
}

// A titled block. Shaded (gray card, white rows inside) only for Catch up.
function Panel({ title, count, aside, className, children, labelId, shaded }: { title: React.ReactNode; count?: number; aside?: React.ReactNode; className?: string; children: React.ReactNode; labelId?: string; shaded?: boolean }) {
  return (
    <section aria-labelledby={labelId} className={cn("flex flex-col gap-3", shaded && "rounded-xl bg-muted p-4", className)}>
      <div className="flex min-h-8 items-center gap-2">
        <h2 id={labelId} className="flex items-center gap-1.5 type-section">{title}</h2>
        {count !== undefined && <span className="text-sm text-muted-foreground tabular-nums">{count}</span>}
        {aside && <div className="ml-auto flex items-center gap-2">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/* ---------------- Header ---------------- */

// The project's logo and name, with the project-wide New menu as the primary action on the right.
function OverviewHeader({ project }: { project: Project }) {
  return (
    <header className="flex items-center gap-3">
      <ProjectMark project={project.id} className="size-9 rounded-lg" />
      <h1 className="min-w-0 truncate type-title">{project.name}</h1>
      <div className="ml-auto">
        <ProjectNewMenu project={project} align="end" trigger={<Button size="lg"><Plus />New</Button>} />
      </div>
    </header>
  )
}

/* ---------------- Members and threads ---------------- */

// Everyone joins as a member: overlapping avatars, + at the end to invite.
export function Members({ project }: { project: Project }) {
  const { setInviteOpen } = useStore()
  return (
    <Panel title="Members" count={project.members.length}>
      <div className="flex items-center -space-x-1.5">
        {project.members.map((id) => <span key={id} title={PEOPLE[id]?.name}><PersonAvatar id={id} className="size-8 ring-2 ring-background" /></span>)}
        <button aria-label="Invite people" onClick={() => setInviteOpen(true)} className="relative flex size-8 items-center justify-center rounded-full border border-dashed bg-background text-muted-foreground ring-2 ring-background transition-colors hover:text-foreground">
          <Plus className="size-3.5" />
        </button>
      </div>
    </Panel>
  )
}

// Each thread with its decision count. A thread needs attention when something in it waits on you.
function Threads({ project }: { project: Project }) {
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  const threads = partsOf(decisions)
  const needs = useNeedsYou(project.id)
  const attention = (name: string) => needs.some((i) => (i.kind === "decide" ? i.decision.part : i.task.part) === name)
  if (!threads.length) return null
  return (
    <Panel title="Threads" count={threads.length}>
      <ul className="-mx-2">
        {threads.map((t) => {
          const count = decisions.filter((d) => d.part === t.name).length
          return (
            <li key={t.name}>
              <button onClick={() => navigate(`/p/${project.id}/decisions`)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted">
                <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                {attention(t.name) && <span className="flex shrink-0 items-center gap-1 text-xs"><span className="size-1.5 rounded-full bg-foreground" />Needs you</span>}
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/* ---------------- Catch up ---------------- */

// A fixed-height card: the start of what you missed, faded at the bottom. See more opens the
// whole catch up on the left with a chat on the right.
// twoPart (Design B): the summary opens with where the project stands, then what changed since your last visit.
export function CatchUpCard({ project, twoPart }: { project: Project; twoPart?: boolean }) {
  const [open, setOpen] = useState(false)
  const changed = changedSince(project.id)
  const summary = WEEK_SUMMARY[project.id]
  const milestone = useMilestone(project)
  const update = [
    `${project.name} · update`,
    summary,
    ...changed.decisions.map((d) => `• ${d.title} (${d.by ?? PEOPLE[d.owner]?.name})`),
    milestone && `Next: ${milestone.next.name} · ${milestone.next.date} · ${milestone.pct}% · ${milestone.late ? "at risk" : "on track"}`,
  ].filter(Boolean).join("\n")

  return (
    <Panel
      labelId="catch-up"
      title={<><Sparkles className="size-3.5" />Catch up</>}
      aside={<>
        <span className="text-xs text-muted-foreground">Since {dateLabel(LAST_VISIT)}</span>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => copy(update, "Update copied")}><ClipboardCopy />Copy as update</Button>
      </>}
      className="h-[30rem]"
      shaded
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <CatchUpBody project={project} twoPart={twoPart} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-muted to-transparent" />
      </div>
      <Button variant="outline" size="sm" className="self-center bg-background" onClick={() => setOpen(true)}>See more</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn("flex h-[min(90vh,900px)] flex-col gap-0 overflow-hidden p-0", DESIGN === "b" ? "sm:max-w-3xl" : "sm:max-w-6xl")}>
          <DialogHeader className="flex-row items-center gap-3 border-b py-3.5 pr-14 pl-6 text-left">
            <DialogTitle>Catch up</DialogTitle>
            <span className="truncate text-sm text-muted-foreground">{project.name} · since {dateLabel(LAST_VISIT)}</span>
            <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => copy(update, "Update copied")}><ClipboardCopy />Copy as update</Button>
          </DialogHeader>
          <div className={cn("grid min-h-0 flex-1", DESIGN !== "b" && "md:grid-cols-[minmax(0,1fr)_400px]")}>
            <div className="min-h-0 overflow-y-auto px-8 py-8 [&_.cu-row]:ring-1 [&_.cu-row]:ring-border [&_section>div>h2]:text-sm [&_section>div>h2]:text-foreground">
              <div className="mx-auto max-w-2xl"><CatchUpBody project={project} large twoPart={twoPart} /></div>
            </div>
            {/* Design B: the Duet panel in the corner is the chat, so the catch up stands alone. */}
            {DESIGN !== "b" && <CatchUpChat project={project} onLeave={() => setOpen(false)} />}
          </div>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

// Top to bottom: a short AI summary of what happened, then what needs you, what changed,
// who's working on what, and the sources last.
function CatchUpBody({ project, large, twoPart }: { project: Project; large?: boolean; twoPart?: boolean }) {
  const changed = changedSince(project.id)
  return (
    <div className={cn(large ? "space-y-9" : "space-y-6")}>
      {twoPart && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />Where it stands</p>
          <p className={cn("leading-relaxed", large && "type-prose")}>{PROJECT_DECISION_SUMMARY[project.id]}</p>
        </div>
      )}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{!twoPart && <Sparkles className="size-3.5" />}{twoPart ? "Since you were here" : "What happened"}</p>
        <p className={cn("leading-relaxed", large && "type-prose")}>{WEEK_SUMMARY[project.id]}</p>
      </div>
      <NeedsYouBlock project={project} />
      <WhatChanged decisions={changed.decisions} artifacts={changed.artifacts} />
      {/* Design B shows who's working on Home itself. */}
      {!twoPart && <WhoIsWorking project={project} />}
      {changed.decisions.length > 0 && (
        <Block title="Sources" count={changed.decisions.length}>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {changed.decisions.map((d) => <DecisionChip key={d.id} decision={d} />)}
          </div>
        </Block>
      )}
    </div>
  )
}

// Ask Whyspace inside the catch up: questions about what you missed, answered with the decisions.
function CatchUpChat({ project, onLeave }: { project: Project; onLeave: () => void }) {
  const { current, openDecision } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const context = {
    scopeName: project.name,
    decisions: current?.example ? DECISIONS.filter((d) => d.project === project.id) : [],
    artifacts: current?.example ? ARTIFACTS.filter((a) => a.project === project.id) : [],
  }
  const suggested = CANVAS_EXTRAS[project.id]?.ask ?? ["What changed since I was here?", "What's still open?"]
  const send = (q: string) => {
    if (!q.trim()) return
    setMsgs((ms) => [...ms, { who: "me", text: q }, reply(q, context)])
    setText("")
  }
  return (
    <div className="flex min-h-0 flex-col border-t md:border-t-0 md:border-l">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6" aria-live="polite">
        {!msgs.length ? (
          <div className="mt-auto space-y-4">
            <div className="space-y-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted"><Sparkles className="size-4" strokeWidth={1.75} /></span>
              <p className="text-base font-medium tracking-tight">Ask about what you missed</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggested.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">{q}</button>
              ))}
            </div>
          </div>
        ) : msgs.map((m, i) => m.who === "me" ? (
          <div key={i} className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-3.5 py-2 text-sm leading-relaxed">{m.text}</p>
          </div>
        ) : (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"><Sparkles className="size-3" /></span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.refs && m.refs.length > 0 && (
                <ul className="divide-y overflow-hidden rounded-lg border">
                  {m.refs.map((d) => (
                    <li key={d.id}>
                      <button onClick={() => { onLeave(); openDecision(d.id) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50">
                        <StatusIcon status={d.status} className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{d.title}</span>
                        <span className="shrink-0 text-muted-foreground">{d.part}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
      <form className="p-4 pt-0" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <div className="flex items-end gap-2 rounded-2xl border bg-background py-2 pr-2 pl-3.5 shadow-xs transition-colors focus-within:border-foreground/30">
          <textarea
            rows={1}
            aria-label="Ask Whyspace"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text) } }}
            placeholder="Ask Whyspace…"
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <Button type="submit" size="icon-sm" className="rounded-full" disabled={!text.trim()} aria-label="Send message"><ArrowUp /></Button>
        </div>
      </form>
    </div>
  )
}

function DecisionChip({ decision: d }: { decision: Decision }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  return (
    <button onClick={() => openDecision(d.id)} className="cu-row flex max-w-64 items-center gap-1 rounded-full bg-background px-2 py-0.5 hover:text-foreground">
      <StatusIcon status={statusOf(d)} className="size-3 shrink-0" />
      <span className="truncate">{d.title}</span>
    </button>
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
      ) : <p className="text-sm text-muted-foreground">All clear.</p>}
    </Block>
  )
}

function NeedsYouCard({ item, project }: { item: NeedsYou; project: Project }) {
  const { openDecision, confirmDecision, patchTask } = useStore()
  const row = "cu-row flex items-center gap-3 rounded-lg bg-background px-3 py-2"

  if (item.kind === "decide") {
    const d = item.decision
    const ask = { confirm: d.why ?? "No reason yet", review: `${d.by ?? PEOPLE[d.owner]?.name} · ${d.part}`, answer: d.due ? `Due ${d.due}` : d.part, clash: `Clashes with a confirmed decision · ${d.part}` }[item.ask]
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
    toast("Task done", { action: { label: "Undo", onClick: () => patchTask(t.id, { status: t.status }) } })
  }
  return (
    <div className={row}>
      <TaskStatusIcon status={t.status} />
      <button onClick={() => (t.decision ? openDecision(t.decision) : navigate(`/p/${project.id}/tasks`))} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm hover:underline">{t.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{t.prompt ? `${t.tool} · ` : ""}Due {t.due}</span>
      </button>
      {t.prompt && <Button size="sm" variant="ghost" className="text-muted-foreground" title={t.prompt} onClick={() => copy(t.prompt!, "Prompt copied")}><Copy />Copy prompt</Button>}
      <Button size="sm" variant="outline" onClick={finish}><Check />Done</Button>
    </div>
  )
}

// What changed, split by the Inbox rule: decisions and work that touch yours open by default.
function WhatChanged({ decisions, artifacts }: { decisions: Decision[]; artifacts: Artifact[] }) {
  const [elsewhereOpen, setElsewhereOpen] = useState(false)
  const mine = decisions.filter(touchesMe)
  const others = decisions.filter((d) => !touchesMe(d))
  const myWork = artifacts.filter((a) => a.owner === VIEWER || mine.some((d) => d.part === a.part))
  const otherWork = artifacts.filter((a) => !myWork.includes(a))
  if (!decisions.length && !artifacts.length) return null
  return (
    <Block title="What changed">
      <div className="cu-row divide-y rounded-lg bg-background">
        <div className="space-y-1.5 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">Touches your work</p>
          {mine.length || myWork.length ? (
            <ChangeList decisions={mine} artifacts={myWork} />
          ) : <p className="text-sm text-muted-foreground">Nothing new for you.</p>}
        </div>
        {(others.length > 0 || otherWork.length > 0) && (
          <div className="px-3 py-2">
            <button aria-expanded={elsewhereOpen} onClick={() => setElsewhereOpen((o) => !o)} className="flex w-full items-center gap-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground">
              <ChevronRight className={cn("size-3 transition-transform duration-200 motion-reduce:transition-none", elsewhereOpen && "rotate-90")} />
              Elsewhere <span className="tabular-nums">{others.length + otherWork.length}</span>
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
      <ul className="cu-row divide-y rounded-lg bg-background">
        {activity.map((a) => {
          const artifact = ARTIFACTS.find((x) => x.id === a.artifact)
          return (
            <li key={a.who} className="flex items-center gap-3 px-3 py-2 text-sm">
              <PersonAvatar id={a.who} />
              <span className="w-20 shrink-0 truncate font-medium">{PEOPLE[a.who]?.name.split(" ")[0]}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.tool ? `${a.tool} · ` : ""}{a.aiDoing ?? a.doing}</span>
              {artifact ? <button onClick={() => openArtifact(artifact)} className="max-w-48 shrink-0 truncate rounded-md bg-muted px-2 py-0.5 text-xs hover:bg-muted/60">{artifact.name}</button> : <span className="shrink-0 text-xs text-muted-foreground">{a.doing}</span>}
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">{a.since}</span>
            </li>
          )
        })}
      </ul>
    </Block>
  )
}

function ArtifactChip({ artifact: a }: { artifact: Artifact }) {
  return (
    <button onClick={() => openArtifact(a)} className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md bg-muted p-1 pr-2.5 text-left transition hover:bg-muted/60">
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
