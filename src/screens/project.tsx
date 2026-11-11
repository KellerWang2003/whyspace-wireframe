import { ProjectDecisions } from "@/screens/project-decisions"
import { Overview } from "@/screens/overview"
import { projectSections } from "@/components/decisions/section-data"
import { ProjectArtifacts } from "@/screens/project-artifacts"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { AI_TOOLS as TOOL_LOGOS, ToolLogo } from "@/components/app/tool-logo"
import { DESIGN } from "@/lib/design"
import { PROJECT_TABS } from "@/lib/project-tabs"
import { TasksView } from "@/components/app/tasks"
import {
  AI_TOOLS,
  DECISIONS,
  PEOPLE,
  PROJECTS,
  TASKS,
  TIMELINE,
} from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type Project = (typeof PROJECTS)[number]

const PAGE: Record<string, string> = { home: "Home", tasks: "Tasks", decisions: "Decisions", artifacts: "Artifacts", settings: "Settings" }

// Project navigation: Home, Tasks, Decisions, Artifacts.
// Settings and Archive sit behind the project's ⋯ in the sidebar.
export function Project({ id, section: asked, sub }: { id: string; section: string; sub?: string }) {
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  // Catch up, Ask and Overview became Home; old links still land there.
  const section = ["catch-up", "ask", "overview"].includes(asked) ? "home" : asked

  return (
    <AppShell crumbs={[{ label: project.name, to: `/p/${project.id}/home` }, { label: PAGE[section] ?? "Home" }]}>
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
      ) : section === "settings" ? (
        <ProjectSettings project={project} tab={sub ?? "general"} />
      ) : (
        <Overview key={project.id} project={project} variant={sub} />
      )}
    </AppShell>
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
// The tools each member works in, from the decisions they logged (main design only).
const toolsOf = (person: string) => [...new Set(DECISIONS.filter((d) => d.owner === person && d.tool).map((d) => d.tool as string))].filter((t) => TOOL_LOGOS.includes(t) || t === "ChatGPT")

function ProjectSettings({ project, tab: asked }: { project: Project; tab: string }) {
  const tab = PROJECT_TABS.some(([key]) => key === asked) ? asked : "general"
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
          {PROJECT_TABS.map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
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
                    <ItemActions>
                      {DESIGN === "b" && toolsOf(m).map((t) => <ToolLogo key={t} tool={t} className="size-3.5" />)}
                      <span className="ml-2 text-sm text-muted-foreground">{m === project.members[0] ? "Project lead" : "Member"}</span>
                    </ItemActions>
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
