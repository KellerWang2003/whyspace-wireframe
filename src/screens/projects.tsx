import { ArrowUpRight, Bot, FolderKanban, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { ACTIVITY, DECISIONS, MY_PROJECTS, PEOPLE, WHISKR_CARD_SUMMARY, type Project } from "@/data"
import { DecisionSheet } from "@/screens/decisions"
import { useStore } from "@/lib/store"

const PROJECT_SUMMARIES: Record<string, string> = {
  whiskr: WHISKR_CARD_SUMMARY,
  studio: "The AI practice flow is working. Source verification and unsupported answers are the next focus.",
}

function ProjectCard({ project }: { project: Project }) {
  const overview = `#/p/${project.id}/overview`
  const activity = ACTIVITY.filter((item) => item.project === project.id && item.state === "active")
  const work = activity.flatMap((item) => [
    { id: item.who, name: PEOPLE[item.who]?.name ?? item.who, doing: item.doing, bot: false },
    ...(item.tool && item.aiDoing ? [{ id: `${item.who}-bot`, name: `${PEOPLE[item.who]?.name.split(" ")[0] ?? item.who}’s ${item.tool}`, doing: item.aiDoing, bot: true }] : []),
  ])
  const decisions = DECISIONS.filter((item) => item.project === project.id && (item.status === "open" || item.status === "inf"))
    .sort((a, b) => Number(b.status === "inf") - Number(a.status === "inf"))
  const cover = { whiskr: "whiskr", studio: "recall" }[project.id]

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
      <a href={overview} aria-label={`Open ${project.name}`} className="block overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2">
        {cover ? <img src={`/projects/${cover}.svg`} alt={`${project.name} concept preview`} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center"><FolderKanban className="size-10 text-muted-foreground" /></div>}
      </a>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h2 className="min-w-0 text-xl font-semibold tracking-tight"><a href={overview} className="block truncate hover:underline">{project.name}</a></h2>
        <span className="shrink-0 text-xs text-muted-foreground">{project.updated}</span>
      </div>
      <div className="px-5 pb-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3" />AI summary</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{PROJECT_SUMMARIES[project.id] ?? "Updates, upcoming plans, and relevant context will appear here as work gets underway."}</p>
      </div>
      <div className="mx-5 mb-5 grid min-w-0 grid-cols-2 gap-5 border-t pt-4">
        <section aria-label={`Activity in ${project.name}`} className="min-w-0">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium">Working on</h3>
          <ul className="space-y-3">
            {work.slice(0, 3).map((item) => (
              <li key={item.id}>
                <a href={overview} title={`${item.name} · ${item.doing}`} className="flex min-w-0 items-center gap-1.5 rounded-sm text-xs hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  {item.bot ? <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted"><Bot className="size-3" /></span> : <PersonAvatar id={item.id} className="size-5 shrink-0" />}
                  <span className="min-w-0 truncate"><span className="font-medium">{item.name.split("’s")[0].split(" ")[0]}{item.bot && `’s ${item.name.split("’s ")[1]}`}</span><span className="text-muted-foreground"> · {item.doing}</span></span>
                </a>
              </li>
            ))}
          </ul>
          {work.length === 0 && <p className="text-xs text-muted-foreground">No active work shared.</p>}
          <a href={overview} className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline">{work.length > 3 ? `+${work.length - 3} more` : "View activity"}<ArrowUpRight className="size-3" /></a>
        </section>
        <section aria-label={`Open decisions in ${project.name}`} className="min-w-0">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium">Open decisions</h3>
          <ul className="space-y-3">
            {decisions.slice(0, 2).map((decision) => (
              <li key={decision.id}>
                <a href={`#/projects/decisions/${decision.id}`} className="group flex min-w-0 items-start gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
                  <StatusIcon status={decision.status} className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                  <span className="min-w-0"><span title={decision.title} className="block truncate text-xs group-hover:underline">{decision.title}</span><span className="block mt-0.5 text-[11px] leading-4 text-muted-foreground">{decision.status === "inf" ? "Needs confirmation" : "Open"}</span></span>
                </a>
              </li>
            ))}
          </ul>
          {decisions.length === 0 && <p className="text-xs text-muted-foreground">All decisions are up to date.</p>}
          <a href={`#/p/${project.id}/decisions`} className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline">{decisions.length > 2 ? `+${decisions.length - 2} more decisions` : "View decisions"}<ArrowUpRight className="size-3" /></a>
        </section>
      </div>
    </Card>
  )
}

export function Projects({ selectedId }: { selectedId?: string }) {
  const { current, setNewProjectOpen } = useStore()
  const projects = current?.example ? MY_PROJECTS : []

  return (
    <AppShell crumbs={[{ label: current?.name ?? "" }, { label: "All projects" }]}>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <PageHeader title="All projects" description={`The latest work and decisions across ${current?.name}.`} actions={<Button size="sm" onClick={() => setNewProjectOpen(true)}><Plus />New project</Button>} />
        {projects.length === 0 ? (
          <Empty className="flex-1 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>Create a project to start bringing your team's work and decisions together.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button onClick={() => setNewProjectOpen(true)}><Plus />New project</Button></EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] items-start gap-6">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )}
      </div>
      {projects.length > 0 && <DecisionSheet basePath="/projects" id={selectedId} />}
    </AppShell>
  )
}
