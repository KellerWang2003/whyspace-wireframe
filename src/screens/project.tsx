import { ProjectDecisions } from "@/screens/project-decisions"
import { ProjectArtifacts } from "@/screens/project-artifacts"
import { useState } from "react"
import { toast } from "sonner"
import {
  Archive,
  ArrowRight,
  Circle,
  CircleCheck,
  Plus,
  CalendarPlus,
  Code,
  FileText,
  MonitorPlay,
  PenTool,
  Link2,
  MoreHorizontal,
  Radio,
  Settings,
  Sheet as SheetIcon,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app/app-shell"
import { ProBadge } from "@/components/app/global-dialogs"
import { AvatarStack, PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { TasksView } from "@/components/app/tasks"
import {
  ACTIVITY,
  ARTIFACTS,
  DECISIONS,
  PEOPLE,
  PROJECTS,
  SESSIONS,
  TASKS,
  TIMELINE,
  WEEK_SUMMARY,
  type Decision,
  type Session,
} from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type Project = (typeof PROJECTS)[number]

const PAGE: Record<string, string> = { overview: "Overview", tasks: "Tasks", decisions: "Decisions", artifacts: "Artifacts", sessions: "Sessions", settings: "Settings" }

// A project has four sections, picked in the sidebar: Overview, Tasks, Decisions, Sessions.
// Settings sit behind the ⋯ menu. A session itself opens full screen from Sessions.
export function Project({ id, section, sub }: { id: string; section: string; sub?: string }) {
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const { current, setUpgradeOpen } = useStore()
  const free = current?.plan === "Free"
  const decisions = DECISIONS.filter((d) => d.project === project.id)

  return (
    <AppShell
      crumbs={[{ label: project.name, to: `/p/${project.id}/overview` }, { label: PAGE[section] ?? "Overview" }]}
      actions={
        <>
          <AvatarStack ids={project.members} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost"><MoreHorizontal /><span className="sr-only">Project menu</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => navigate(`/p/${project.id}/settings/general`)}><Settings />Project settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toast("Link copied")}><Link2 />Copy link</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast("Archive project")}><Archive />Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      {section === "tasks" ? (
        <div className="flex flex-col gap-6 p-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">Everything to do in {project.name}. Yours also show in My tasks.</p>
          </div>
          <TasksView tasks={TASKS.filter((t) => t.project === project.name)} defaultProject={project.name} />
        </div>
      ) : section === "decisions" ? (
        decisions.length ? (
          <ProjectDecisions project={project} selectedId={sub} />
        ) : (
          <div className="p-8"><NoDecisions /></div>
        )
      ) : section === "artifacts" ? (
        <ProjectArtifacts project={project} />
      ) : section === "sessions" ? (
        <Sessions project={project} free={free} onUpgrade={() => setUpgradeOpen(true)} />
      ) : section === "settings" ? (
        <ProjectSettings project={project} tab={sub ?? "general"} />
      ) : (
        <Overview decisions={decisions} project={project} />
      )}
    </AppShell>
  )
}

/* ---------------- Overview ---------------- */

// Overview is a calm one-page brief, like Linear's or Asana's project overview: a main
// column you read top to bottom (AI summary, what needs you, milestones, key links) and a
// thin properties rail on the right. Detail lives in Tasks, Decisions and Sessions.
function Overview({ decisions: ds, project }: { decisions: Decision[]; project: Project }) {
  const tasks = TASKS.filter((t) => t.project === project.name)
  const timeline = TIMELINE[project.id] ?? []
  const next = timeline.find((m) => !m.done)
  // A live session already shows as a live icon in the sidebar, so only scheduled ones go here.
  const session = SESSIONS.find((s) => s.project === project.id && s.status === "Scheduled")
  const done = tasks.filter((t) => t.status === "done").length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const needsYou = ds.filter((d) => ["chg", "inf", "flag"].includes(d.status))
  const active = ACTIVITY.filter((a) => a.project === project.id && a.state === "active")
  const links = ARTIFACTS.filter((a) => a.project === project.id).slice(0, 4)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-8 py-10 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-10">
        <header className="space-y-2">
          <ProjectMark project={project.id} className="size-8" />
          <h1 className="pt-2 text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.brief}</p>
        </header>

        <section className="space-y-3">
          <SectionTitle><span className="flex items-center gap-1.5"><Sparkles className="size-3.5" />AI summary · this week</span></SectionTitle>
          <p className="leading-relaxed">{WEEK_SUMMARY[project.id]}</p>
          {needsYou.length > 0 && (
            <a href={`#/p/${project.id}/decisions`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              {needsYou.length} decisions need a look <ArrowRight className="size-3.5" />
            </a>
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle>Milestones</SectionTitle>
          <ul className="divide-y rounded-lg border">
            {timeline.map((m) => (
              <li key={m.name} className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", m.done && "text-muted-foreground")}>
                {m.done ? <CircleCheck className="size-4" /> : <Circle className={cn("size-4", m !== next && "text-muted-foreground")} />}
                <span className={cn("flex-1", m === next && "font-medium")}>{m.name}</span>
                {m === next && <Badge variant="secondary" className="font-normal">Next</Badge>}
                <span className="w-14 text-right text-muted-foreground tabular-nums">{m.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Key links</SectionTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toast("Share an artifact")}><Plus />Add</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {links.map((a) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <button key={a.id} onClick={() => toast(`Opens ${a.name}`)} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm hover:bg-muted/50">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.kind}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* Properties rail */}
      <aside className="w-full shrink-0 space-y-5 text-sm lg:w-60 lg:border-l lg:pl-8">
        <Prop label="Progress">
          <div className="flex w-full items-center gap-2">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="tabular-nums">{pct}%</span>
          </div>
        </Prop>
        <Prop label="Lead"><PersonAvatar id={project.members[0]} />{PEOPLE[project.members[0]].name}</Prop>
        <Prop label="Members"><AvatarStack ids={project.members} /></Prop>
        <Prop label="Target date">{timeline.at(-1)?.date ?? "None"}</Prop>
        {session && (
          <Prop label="Next session">
            <a href={`#/p/${project.id}/sessions`} className="hover:underline">{session.title}</a>
          </Prop>
        )}
        <Prop label="Working now">
          <div className="flex -space-x-1.5">
            {active.map((a) => (
              <span key={a.who} title={`${PEOPLE[a.who].name}: ${a.doing}${a.tool ? ` (${a.tool})` : ""}`}>
                <PersonAvatar id={a.who} className="ring-2 ring-background" />
              </span>
            ))}
          </div>
        </Prop>
      </aside>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

const KIND_ICON = { Prototype: MonitorPlay, Figma: PenTool, Doc: FileText, Repo: Code, "AI output": Sparkles, Sheet: SheetIcon }

/* ---------------- Sessions ---------------- */

// Sessions works like a meeting room for the project: join what's live, start or
// schedule one, and look back at past sessions with their summaries.
function Sessions({ project, free, onUpgrade }: { project: Project; free: boolean; onUpgrade: () => void }) {
  const all = SESSIONS.filter((s) => s.project === project.id)
  const live = all.find((s) => s.status === "Live")
  const scheduled = all.filter((s) => s.status === "Scheduled")
  const past = all.filter((s) => s.status === "Ended")
  const [summary, setSummary] = useState<Session | null>(null)
  const start = () => (free ? onUpgrade() : navigate(`/p/${project.id}/sessions/new`))

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">Work through decisions together on a shared canvas. Whyspace saves what you decide.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast("Schedule a session")}><CalendarPlus />Schedule</Button>
          <Button size="sm" onClick={start}><Radio />Start session{free && <ProBadge />}</Button>
        </div>
      </div>

      {live ? (
        <div className="flex items-center gap-5 rounded-xl border bg-muted/40 p-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background"><Radio className="size-5" /></div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-lg font-semibold">{live.title}<Badge>Live</Badge></div>
            <div className="text-sm text-muted-foreground">{PEOPLE[live.host].name} is hosting · {live.length} · {live.decisions} decisions caught so far</div>
          </div>
          <AvatarStack ids={live.people} />
          <Button onClick={() => navigate(`/p/${project.id}/sessions/${live.id}`)}>Join</Button>
        </div>
      ) : (
        <Empty className="border border-dashed py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Radio /></EmptyMedia>
            <EmptyTitle>No session running</EmptyTitle>
            <EmptyDescription>Start one when a decision needs the group. Everyone joins the same canvas.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button onClick={start}>Start session</Button></EmptyContent>
        </Empty>
      )}

      {scheduled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Scheduled</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {scheduled.map((s) => (
              <Item key={s.id} variant="outline">
                <ItemMedia variant="icon"><CalendarPlus /></ItemMedia>
                <ItemContent>
                  <ItemTitle>{s.title}</ItemTitle>
                  <ItemDescription>{s.when} · hosted by {PEOPLE[s.host].name}</ItemDescription>
                </ItemContent>
                <ItemActions><AvatarStack ids={s.people} max={3} /></ItemActions>
              </Item>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Past sessions</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>People</TableHead>
                <TableHead className="text-right">Decisions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSummary(s)}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-muted-foreground">{s.when}</TableCell>
                  <TableCell className="text-muted-foreground">{s.length}</TableCell>
                  <TableCell><AvatarStack ids={s.people} max={3} /></TableCell>
                  <TableCell className="text-right tabular-nums">{s.decisions}</TableCell>
                </TableRow>
              ))}
              {!past.length && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No past sessions yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!summary} onOpenChange={(o) => !o && setSummary(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          {summary && (
            <>
              <SheetHeader>
                <SheetDescription>{summary.when} · {summary.length} · hosted by {PEOPLE[summary.host].name}</SheetDescription>
                <SheetTitle className="text-lg">{summary.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Summary</div>
                  <p className="text-sm">{summary.summary}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">People</div>
                  <div className="flex flex-wrap gap-2">
                    {summary.people.map((p) => (
                      <span key={p} className="flex items-center gap-2 rounded-full border py-0.5 pr-3 pl-0.5 text-sm"><PersonAvatar id={p} />{PEOPLE[p].name}</span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{summary.decisions} decisions saved · 1 idea archived</div>
              </div>
              <SheetFooter className="flex-row">
                <Button onClick={() => navigate(`/p/${project.id}/sessions/${summary.id}`)}>Open canvas</Button>
                <Button variant="outline" onClick={() => navigate(`/p/${project.id}/decisions`)}>See decisions</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ---------------- Shared bits ---------------- */

function NoDecisions() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>No decisions yet</EmptyTitle>
        <EmptyDescription>Connect an AI tool and work as usual. Decisions it picks up land here as inferred until someone confirms them.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={() => navigate("/account/ai-tools")}>Connect an AI tool</Button>
      </EmptyContent>
    </Empty>
  )
}

// Project settings, reached from the ⋯ menu.
function ProjectSettings({ project, tab }: { project: Project; tab: string }) {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Project settings</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate(`/p/${project.id}/settings/${v}`)}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "general" && (
        <FieldSet className="max-w-2xl">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ps-name">Project name</FieldLabel>
              <Input id="ps-name" defaultValue={project.name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ps-brief">Brief</FieldLabel>
              <Textarea id="ps-brief" defaultValue={project.brief} rows={3} />
              <FieldDescription>Connected AI tools read this to know what the project is for.</FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Button onClick={() => toast("Saved")}>Save changes</Button>
              <Button variant="outline" onClick={() => toast("Archive project")}>Archive project</Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      )}
      {tab === "members" && (
        <ItemGroup className="max-w-2xl rounded-lg border">
          {project.members.map((m, i) => (
            <div key={m}>
              {i > 0 && <Separator />}
              <Item size="sm">
                <ItemMedia><PersonAvatar id={m} className="size-8" /></ItemMedia>
                <ItemContent>
                  <ItemTitle>{PEOPLE[m].name}</ItemTitle>
                  <ItemDescription>{PEOPLE[m].email}</ItemDescription>
                </ItemContent>
                <ItemActions><span className="text-sm text-muted-foreground">{m === project.members[0] ? "Lead" : "Member"}</span></ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      )}
    </div>
  )
}
