import { FolderKanban, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { MY_PROJECTS, WEEK_SUMMARY, needsYou, nextMilestone, type Project } from "@/data"
import { DecisionSheet } from "@/screens/decisions"
import { useStore } from "@/lib/store"

function ProjectCard({ project }: { project: Project }) {
  const ask = `#/p/${project.id}/ask`
  const summary = WEEK_SUMMARY[project.id]?.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? "Updates will appear here as work gets underway."
  const waiting = needsYou(project.id).length
  const next = nextMilestone(project.id)
  const cover = { whiskr: "whiskr", studio: "recall" }[project.id]

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
      <a href={ask} aria-label={`Open ${project.name}`} className="block overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2">
        {cover ? <img src={`/projects/${cover}.svg`} alt={`${project.name} concept preview`} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center"><FolderKanban className="size-10 text-muted-foreground" /></div>}
      </a>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 text-xl font-semibold tracking-tight"><a href={ask} className="block truncate hover:underline">{project.name}</a></h2>
          <span className="shrink-0 text-xs text-muted-foreground">{project.updated}</span>
        </div>
        <p className="flex gap-1.5 text-sm leading-relaxed text-muted-foreground"><Sparkles className="mt-1 size-3 shrink-0" />{summary}</p>
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs">
          <a href={ask} className={waiting ? "font-medium hover:underline" : "text-muted-foreground"}>{waiting ? `${waiting} ${waiting === 1 ? "thing needs" : "things need"} you` : "Nothing needs you"}</a>
          {next && <span className="text-muted-foreground">Next: {next.name} · {next.date}</span>}
        </div>
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
