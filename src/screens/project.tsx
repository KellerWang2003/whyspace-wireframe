import { ProjectDecisions } from "@/screens/project-decisions"
import { Overview } from "@/screens/overview"
import { projectSections } from "@/components/decisions/section-data"
import { ProjectArtifacts } from "@/screens/project-artifacts"
import { useState } from "react"
import { toast } from "sonner"
import {
  MoreHorizontal,
  Plus,
  StickyNote,
  Radio,
  UserPlus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WorkshopDetails } from "@/components/app/workshop-details"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app/app-shell"
import { ProBadge } from "@/components/app/global-dialogs"
import { AvatarStack, PersonAvatar } from "@/components/app/person"
import { TasksView } from "@/components/app/tasks"
import {
  AI_TOOLS,
  SETTINGS_TABS,
  DECISIONS,
  PEOPLE,
  PROJECTS,
  SESSIONS,
  WORKSHOPS,
  type Workshop,
  TASKS,
  TIMELINE,
} from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type Project = (typeof PROJECTS)[number]

const PAGE: Record<string, string> = { home: "Home", tasks: "Tasks", decisions: "Decisions", artifacts: "Artifacts", sessions: "Workshops", settings: "Settings" }

// Project navigation: Home, Tasks, Decisions, Artifacts, Workshops.
// Settings and Archive sit behind the project's ⋯ in the sidebar. Workshops open a shared canvas.
export function Project({ id, section: asked, sub }: { id: string; section: string; sub?: string }) {
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const { current, setUpgradeOpen } = useStore()
  const free = current?.plan === "Free"
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  // Catch up, Ask and Overview became Home; old links still land there.
  const section = ["catch-up", "ask", "overview"].includes(asked) ? "home" : asked
  const live = SESSIONS.find((s) => s.project === project.id && s.status === "Live")

  return (
    <AppShell
      crumbs={[{ label: project.name, to: `/p/${project.id}/home` }, { label: PAGE[section] ?? "Home" }]}
      actions={<>
        {live && (
          <Badge asChild variant="secondary" className="gap-1.5 font-normal">
            <a href={`#/p/${project.id}/sessions/${live.id}`}><Radio className="size-3" />Live · {live.title}</a>
          </Badge>
        )}
      </>}
    >
      {section === "tasks" ? (
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <TasksView key={project.id} title="Tasks" tasks={TASKS.filter((t) => t.project === project.name)} defaultProject={project.name} />
        </div>
      ) : section === "decisions" ? (
        decisions.length ? (
          <ProjectDecisions key={project.id} project={project} selectedId={sub} />
        ) : (
          <div className="p-6 sm:p-8"><NoDecisions /></div>
        )
      ) : section === "artifacts" ? (
        <ProjectArtifacts key={project.id} project={project} selectedId={sub} />
      ) : section === "sessions" ? (
        <Workshops project={project} free={free} onUpgrade={() => setUpgradeOpen(true)} />
      ) : section === "settings" ? (
        <ProjectSettings project={project} tab={sub ?? "general"} />
      ) : (
        <Overview key={project.id} project={project} variant={sub} />
      )}
    </AppShell>
  )
}

/* ---------------- Sessions ---------------- */

// Workshops are lasting canvases, shown like files: a place to work on something, any time.
// Meetings don't show here; a meeting can link a workshop, and that shows only in the workshop's details.
function Workshops({ project, free, onUpgrade }: { project: Project; free: boolean; onUpgrade: () => void }) {
  const workshops = WORKSHOPS.filter((w) => w.project === project.id)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [details, setDetails] = useState<Workshop | null>(null)
  const create = () => (free ? onUpgrade() : setCreating(true))

  return (
    <div className="flex min-w-0 flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="type-title">Workshops</h1>
        <Button size="sm" onClick={create}><Plus />New workshop{free && <ProBadge />}</Button>
      </div>

      {workshops.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workshops.map((w) => (
            <div key={w.id} className="relative flex flex-col overflow-hidden rounded-xl bg-muted transition-colors hover:bg-muted/70">
              <button onClick={() => navigate(`/p/${project.id}/sessions/${w.id}`)} className="text-left focus-visible:outline-2 focus-visible:outline-ring">
                <WorkshopThumb seed={w.id} />
                <div className="flex flex-col gap-2 border-t p-4 pr-12">
                  <span className="truncate text-sm font-medium">{w.title}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Edited {w.edited}</span>
                    <AvatarStack ids={w.people} max={3} />
                  </div>
                </div>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="absolute right-2 bottom-[52px]"><MoreHorizontal /><span className="sr-only">More</span></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDetails(w)}>Details</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast("Rename workshop")}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast("Workshop duplicated")}>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toast("Workshop archived")}>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon"><StickyNote /></EmptyMedia>
            <EmptyTitle>No workshops yet</EmptyTitle>
          </EmptyHeader>
          <EmptyContent><Button size="sm" onClick={create}><Plus />New workshop</Button></EmptyContent>
        </Empty>
      )}

      {details && <WorkshopDetails workshop={details} open onOpenChange={(o) => !o && setDetails(null)} />}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New workshop</DialogTitle></DialogHeader>
          <Field>
            <FieldLabel htmlFor="workshop-name">Name</FieldLabel>
            <Input id="workshop-name" placeholder="Untitled workshop" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={() => { toast(`${name.trim() || "Untitled workshop"} created`); setCreating(false); navigate(`/p/${project.id}/sessions/new`) }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// A tiny grayscale canvas preview, like a file thumbnail.
function WorkshopThumb({ seed }: { seed: string }) {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <div className="relative h-36 bg-muted/40" style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "12px 12px" }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn("absolute h-9 w-14 rounded-sm shadow-sm", ["bg-neutral-100", "bg-neutral-200", "bg-neutral-300"][(i + n) % 3])} style={{ left: 20 + i * 52 + ((n * 7 + i * 13) % 18), top: 18 + ((n * 11 + i * 29) % 64) }} />
      ))}
    </div>
  )
}

/* ---------------- Shared bits ---------------- */

function NoDecisions() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>No decisions yet</EmptyTitle>
        <EmptyDescription>Connect an AI tool to start capturing them.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={() => navigate("/account/ai-tools")}>Connect an AI tool</Button>
      </EmptyContent>
    </Empty>
  )
}

// Project settings, reached from the project's ⋯ in the sidebar.
function ProjectSettings({ project, tab }: { project: Project; tab: string }) {
  const { setInviteOpen } = useStore()
  const timeline = TIMELINE[project.id] ?? []
  const leads = projectSections(project.id).filter((s) => !s.parent)
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <div className="space-y-1">
        <h1 className="type-title">Project settings</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate(`/p/${project.id}/settings/${v}`)}>
        <TabsList>
          {SETTINGS_TABS.map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
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
              <FieldDescription>AI tools read this.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="ps-target">Target date</FieldLabel>
              <Input id="ps-target" defaultValue={timeline.at(-1)?.date ?? ""} className="max-w-48" />
            </Field>
            {timeline.length > 0 && (
              <Field>
                <FieldLabel>Milestones</FieldLabel>
                <ul className="divide-y text-sm">
                  {timeline.map((m) => (
                    <li key={m.name} className="flex items-center gap-3 px-3 py-2">
                      <span className={cn("size-2 shrink-0 rounded-full border border-foreground/40", m.done && "bg-foreground/60")} />
                      <span className={cn("flex-1", m.done && "text-muted-foreground")}>{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.date}</span>
                    </li>
                  ))}
                </ul>
              </Field>
            )}
            <Field orientation="horizontal">
              <Button onClick={() => toast("Saved")}>Save changes</Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      )}
      {tab === "people" && (
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="type-section">Members</h2>
              <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}><UserPlus />Invite</Button>
            </div>
            <ItemGroup>
              {project.members.map((m, i) => (
                <div key={m}>
                  {i > 0 && <Separator />}
                  <Item size="sm">
                    <ItemMedia><PersonAvatar id={m} className="size-8" /></ItemMedia>
                    <ItemContent>
                      <ItemTitle>{PEOPLE[m].name}</ItemTitle>
                      <ItemDescription>{PEOPLE[m].email}</ItemDescription>
                    </ItemContent>
                    <ItemActions><span className="text-sm text-muted-foreground">{m === project.members[0] ? "Project lead" : "Member"}</span></ItemActions>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </div>
          {leads.length > 0 && (
            <div className="space-y-2">
              <h2 className="type-section">Thread leads</h2>
              <ul className="divide-y text-sm">
                {leads.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-3 py-2">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">{s.owner}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {tab === "ai-tools" && (
        <div className="max-w-2xl space-y-2">
          <ul className="divide-y text-sm">
            {AI_TOOLS.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
                <span className="text-xs text-muted-foreground">{t.connected ? "Connected" : "Not connected"}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="outline" onClick={() => navigate("/account/ai-tools")}>Manage my AI tools</Button>
        </div>
      )}
    </div>
  )
}
