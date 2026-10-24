import { GraduationCap, Sprout, type LucideIcon } from "lucide-react"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"

// Each project gets its own icon and shade, so you can tell at a glance where a task
// or inbox item comes from without adding color to the grayscale UI.
const MARKS: Record<string, { icon: LucideIcon; tone: string }> = {
  plantpal: { icon: Sprout, tone: "bg-foreground text-background" },
  studio: { icon: GraduationCap, tone: "border border-foreground/40 bg-background text-foreground" },
}

// `project` can be a project's id or its name.
export function ProjectMark({ project, className }: { project: string; className?: string }) {
  const p = PROJECTS.find((x) => x.id === project || x.name === project)
  const mark = p && MARKS[p.id]
  const Icon = mark?.icon
  return (
    <span className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[4px]", mark?.tone ?? "bg-muted text-foreground", className)}>
      {Icon ? <Icon className="size-[70%]" /> : <span className="text-[9px] font-semibold">{(p?.name ?? project)[0]}</span>}
    </span>
  )
}

// A project mark followed by its name, for rows that list where something comes from.
export function ProjectLabel({ project, className }: { project: string; className?: string }) {
  const p = PROJECTS.find((x) => x.id === project || x.name === project)
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <ProjectMark project={project} />
      <span className="truncate">{p?.name ?? project}</span>
    </span>
  )
}
