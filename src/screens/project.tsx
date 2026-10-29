import { ProjectDecisions } from "@/screens/project-decisions"
import { OverviewSections } from "@/components/decisions/overview-sections"
import { ProjectWork } from "@/components/app/project-work"
import { ProjectArtifacts } from "@/screens/project-artifacts"
import { useState } from "react"
import { toast } from "sonner"
import {
  Archive,
  ArrowRight,
  CalendarPlus,
  CalendarDays,
  Clock3,
  MonitorPlay,
  Link2,
  MoreHorizontal,
  Radio,
  Settings,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app/app-shell"
import { ProBadge } from "@/components/app/global-dialogs"
import { AvatarStack, PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { TasksView } from "@/components/app/tasks"
import {
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

const PAGE: Record<string, string> = { overview: "Overview", tasks: "Tasks", decisions: "Decisions", artifacts: "Artifacts", sessions: "Meetings", settings: "Settings" }

// Project navigation: Overview, Tasks, Decisions, Artifacts, Meetings.
// Settings sit behind the project menu. Meetings open a shared canvas.
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
        <ProjectArtifacts key={project.id} project={project} selectedId={sub} />
      ) : section === "sessions" ? (
        <Meetings project={project} free={free} onUpgrade={() => setUpgradeOpen(true)} />
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
// column for the AI summary, sections, and key links, with team activity and
// project properties on the right. Detail lives in Tasks, Decisions and Sessions.
function Overview({ decisions: ds, project }: { decisions: Decision[]; project: Project }) {
  const tasks = TASKS.filter((t) => t.project === project.name)
  const timeline = TIMELINE[project.id] ?? []
  // A live session already shows as a live icon in the sidebar, so only scheduled ones go here.
  const session = SESSIONS.find((s) => s.project === project.id && s.status === "Scheduled")
  const done = tasks.filter((t) => t.status === "done").length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const needsYou = ds.filter((d) => ["chg", "inf", "flag"].includes(d.status))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-8">
        <header className="flex items-center gap-3">
          <ProjectMark project={project.id} className="size-8" />
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </header>

        <section aria-label="AI summary" className="space-y-2 rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium"><Sparkles className="size-3.5" />AI summary</span>
            <span>Updated since your last visit</span>
          </div>
          <p className="leading-relaxed">{WEEK_SUMMARY[project.id]}</p>
          {needsYou.length > 0 && (
            <a href={`#/p/${project.id}/decisions`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              {needsYou.length} {needsYou.length === 1 ? "decision needs" : "decisions need"} a look <ArrowRight className="size-3.5" />
            </a>
          )}
        </section>

        <OverviewSections key={project.id} project={project} />

      </div>

      {/* Team activity and project properties */}
      <aside aria-label="Project activity and properties" className="w-full min-w-0 shrink-0 space-y-6 text-sm lg:w-80 lg:border-l lg:pl-6">
        <div className="space-y-5">
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
          <Prop label="Next meeting">
            <a href={`#/p/${project.id}/sessions`} className="hover:underline">{session.title}</a>
          </Prop>
        )}
        </div>
        <div className="border-t pt-5"><ProjectWork project={project} /></div>
      </aside>
    </div>
    </div>
  )
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

/* ---------------- Sessions ---------------- */

// Upcoming and past sessions share the same list and detail view.
function Meetings({ project, free, onUpgrade }: { project: Project; free: boolean; onUpgrade: () => void }) {
  const all = SESSIONS.filter((s) => s.project === project.id)
  const upcoming = all.filter((s) => s.status !== "Ended").sort((a, b) => Number(b.status === "Live") - Number(a.status === "Live"))
  const past = all.filter((s) => s.status === "Ended").reverse()
  const [summary, setSummary] = useState<Session | null>(null)
  const start = () => (free ? onUpgrade() : navigate(`/p/${project.id}/sessions/new`))

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground">Meet with your team. Keep the decisions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast("Schedule a meeting")}><CalendarPlus />Schedule</Button>
          <Button size="sm" onClick={start}><Radio />Start meeting{free && <ProBadge />}</Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="gap-0">
        <div className="border-b">
          <TabsList variant="line" className="h-11 gap-5 p-0">
            <TabsTrigger value="upcoming" className="h-full rounded-none px-0 pb-3 after:bottom-0">Upcoming <span className="text-xs tabular-nums text-muted-foreground">{upcoming.length}</span></TabsTrigger>
            <TabsTrigger value="past" className="h-full rounded-none px-0 pb-3 after:bottom-0">Past <span className="text-xs tabular-nums text-muted-foreground">{past.length}</span></TabsTrigger>
          </TabsList>
        </div>
        {([{ key: "upcoming", sessions: upcoming }, { key: "past", sessions: past }] as const).map(({ key, sessions }) => (
          <TabsContent key={key} value={key}>
            <ul aria-label={`${key === "upcoming" ? "Upcoming" : "Past"} meetings`} className="divide-y">
              {sessions.map((session) => (
                <li key={session.id} className="flex flex-wrap items-center gap-x-6 gap-y-4 py-6">
                  <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border", session.status === "Live" ? "border-foreground bg-foreground text-background" : "bg-muted/40 text-muted-foreground")}>
                    {session.status === "Live" ? <Radio className="size-4" /> : session.status === "Ended" ? <MonitorPlay className="size-4" /> : <CalendarDays className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1 basis-48 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="text-left text-sm font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setSummary(session)}>{session.title}</button>
                      {session.status === "Live" && <Badge variant="secondary" className="gap-1.5 text-xs font-normal"><span className="size-1.5 rounded-full bg-current" />Live now</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{session.when}</span>
                      {session.length && <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{session.length}</span>}
                      <span>Hosted by {PEOPLE[session.host].name}</span>
                      {session.status !== "Scheduled" && <span>{session.decisions} {session.decisions === 1 ? "decision" : "decisions"}</span>}
                    </div>
                  </div>
                  <div className="ml-16 flex items-center gap-6 sm:ml-0">
                    <div className="flex w-24 flex-col items-start gap-1.5">
                      <AvatarStack ids={session.people} max={3} />
                      <span className="text-xs text-muted-foreground">{session.people.length} people</span>
                    </div>
                    <div className="flex w-28 justify-end">
                      {session.status === "Live" ? (
                        <Button size="sm" onClick={() => navigate(`/p/${project.id}/sessions/${session.id}`)}>Join meeting</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setSummary(session)}>{session.status === "Ended" ? "View summary" : "View details"}</Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!sessions.length && (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">{key === "upcoming" ? <CalendarDays /> : <MonitorPlay />}</EmptyMedia>
                  <EmptyTitle>{key === "upcoming" ? "No upcoming meetings" : "No past meetings yet"}</EmptyTitle>
                  <EmptyDescription>{key === "upcoming" ? "Start a meeting now or schedule time with your team." : "Past meetings and their summaries will appear here."}</EmptyDescription>
                </EmptyHeader>
                {key === "upcoming" && <EmptyContent><Button variant="outline" onClick={() => toast("Schedule a meeting")}><CalendarPlus />Schedule meeting</Button></EmptyContent>}
              </Empty>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Sheet open={!!summary} onOpenChange={(o) => !o && setSummary(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          {summary && (
            <>
              <SheetHeader>
                <SheetDescription>{summary.when}{summary.length && ` · ${summary.length}`} · hosted by {PEOPLE[summary.host].name}</SheetDescription>
                <SheetTitle className="text-lg">{summary.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{summary.status === "Ended" ? "Summary" : "Meeting details"}</div>
                  <p className="text-sm">{summary.summary ?? (summary.status === "Live" ? "Your team is working together on the shared canvas. Join to take part." : "A scheduled meeting with your team on a shared canvas.")}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">People</div>
                  <div className="flex flex-wrap gap-2">
                    {summary.people.map((p) => (
                      <span key={p} className="flex items-center gap-2 rounded-full border py-0.5 pr-3 pl-0.5 text-sm"><PersonAvatar id={p} />{PEOPLE[p].name}</span>
                    ))}
                  </div>
                </div>
                {summary.status !== "Scheduled" && <div className="text-sm text-muted-foreground">{summary.decisions} {summary.decisions === 1 ? "decision" : "decisions"} {summary.status === "Live" ? "caught so far" : "saved"}</div>}
              </div>
              <SheetFooter className="flex-row">
                {summary.status !== "Scheduled" && <Button onClick={() => navigate(`/p/${project.id}/sessions/${summary.id}`)}>{summary.status === "Live" ? "Join meeting" : "Open canvas"}</Button>}
                {summary.status === "Ended" && <Button variant="outline" onClick={() => navigate(`/p/${project.id}/decisions`)}>See decisions</Button>}
                {summary.status === "Scheduled" && <Button variant="outline" onClick={() => setSummary(null)}>Done</Button>}
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
