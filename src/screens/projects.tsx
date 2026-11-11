import { FolderKanban, Pin, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { MY_PROJECTS, WEEK_SUMMARY, nextMilestone, type Project } from "@/data"
import { useNeedsYou } from "@/lib/work"
import { useStore } from "@/lib/store"
import { useHifi } from "@/lib/hifi"
import { setPinned, usePinned } from "@/app/pins"
import { cn } from "@/lib/utils"
import { Illo } from "@/components/brand/illo/pieces"

function ProjectCard({ project }: { project: Project }) {
  const ask = `#/p/${project.id}/home`
  const summary = WEEK_SUMMARY[project.id]?.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? "No updates yet."
  const waiting = useNeedsYou(project.id).length
  const next = nextMilestone(project.id)
  const cover = { whiskr: "whiskr", studio: "recall" }[project.id]

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
      <a href={ask} aria-label={`Open ${project.name}`} className="block overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2">
        {cover ? <img src={`${import.meta.env.BASE_URL}projects/${cover}.svg`} alt={`${project.name} concept preview`} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center"><FolderKanban className="size-10 text-muted-foreground" /></div>}
      </a>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 type-heading"><a href={ask} className="block truncate hover:underline">{project.name}</a></h2>
          <span className="shrink-0 text-xs text-muted-foreground">{project.updated}</span>
          <PinButton id={project.id} name={project.name} />
        </div>
        <p className="flex gap-1.5 text-sm leading-relaxed text-muted-foreground"><Sparkles className="mt-1 size-3 shrink-0" />{summary}</p>
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs">
          <a href={ask} className={waiting ? "font-medium hover:underline" : "text-muted-foreground"}>{waiting ? `${waiting} need you` : "All clear"}</a>
          {next && <span className="text-muted-foreground">Next: {next.name} · {next.date}</span>}
        </div>
      </div>
    </Card>
  )
}

// Pinned projects sit in the rail. Filled pin = pinned.
function PinButton({ id, name }: { id: string; name: string }) {
  const pinned = usePinned(id)
  return (
    <Button variant="ghost" size="icon-sm" aria-pressed={pinned} aria-label={pinned ? `Unpin ${name} from the rail` : `Pin ${name} to the rail`} title={pinned ? "Unpin from rail" : "Pin to rail"} onClick={() => setPinned(id, !pinned)} className="-my-1 -mr-2 shrink-0">
      <Pin className={cn(pinned ? "fill-current text-foreground" : "text-muted-foreground")} />
    </Button>
  )
}

export function Projects({ empty }: { empty?: boolean }) {
  const { current, setNewProjectOpen } = useStore()
  const hifi = useHifi()
  const projects = current?.example && !empty ? MY_PROJECTS : []

  return (
    <AppShell crumbs={[{ label: current?.name ?? "" }, { label: "All projects" }]}>
      <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
        <PageHeader title="All projects" actions={<Button onClick={() => setNewProjectOpen(true)}><Plus />New project</Button>} />
        {projects.length === 0 ? (
          <Empty className="flex-1 border border-dashed">
            <EmptyHeader>
              {hifi ? <Illo name="no-projects" className="mb-3 h-20" /> : <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>}
              <EmptyTitle>No projects yet</EmptyTitle>
            </EmptyHeader>
            <EmptyContent><Button onClick={() => setNewProjectOpen(true)}><Plus />New project</Button></EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] items-start gap-6">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )}
      </div>
    </AppShell>
  )
}
