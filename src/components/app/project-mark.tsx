import { useId } from "react"
import { handPath } from "@/components/brand/hand"
import { Paint } from "@/components/brand/paint"
import { paintTint } from "@/components/brand/tint"
import { PROJECTS } from "@/data"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { MARK_HEX, MARK_INK, MARK_WASH, MARK_WASH_INK, hashId, iconOf, useProjectIcon, type ProjectIcon } from "./project-icon"

// Wireframe: each project's own shade, so you can tell projects apart without adding color to the grayscale UI.
const TONE: Record<string, string> = {
  whiskr: "bg-foreground text-background",
  studio: "border border-foreground/40 bg-background text-foreground",
}

// `project` can be a project's id or its name.
export function ProjectMark({ project, look, className }: { project: string; look?: Look; className?: string }) {
  const p = PROJECTS.find((x) => x.id === project || x.name === project)
  const id = p?.id ?? project
  const icon = useProjectIcon(id)
  return <MarkTile id={id} name={p?.name ?? project} icon={icon} look={look} className={className} />
}

// The painted tile's hand-cut outline in its 64 box, seeded by the project. The rail's open tab grows it to the tab's size.
export const markOutline = (id: string) => handPath([[3, 3], [61, 3], [61, 61], [3, 61]], { seed: (hashId(id) % 40) + 1, radius: 18, wobble: 1, unevenCorners: 0.4 })

// Keller picked Painted, then Wash (so project icons never look like the painted Duet faces), then Plain (Nov 11):
// no tile, just the icon in its pigment. Every project has an icon (no letters since Nov 14).
// Tile (Nov 14, the rail and headers): a hand-cut painted tile at MARK_STRENGTH (45% pigment) with an ink icon, the same paint as the Duet faces.
type Look = "painted" | "wash" | "plain" | "tile"
export const MARK_LOOK: Look = "plain"

// The mark itself, for a given icon (the picker previews with it before saving).
export function MarkTile({ id, icon, look = MARK_LOOK, className }: { id: string; name: string; icon: ProjectIcon; look?: Look; className?: string }) {
  const hifi = useHifi()
  const uid = useId().replace(/:/g, "")
  const Icon = iconOf(icon, id)
  if (!hifi) {
    return (
      <span className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] [container-type:size]", TONE[id] ?? "bg-muted text-foreground", className)}>
        <Icon className="size-[70%]" />
      </span>
    )
  }
  const glyph = <Icon className="relative size-[62%]" strokeWidth={1.75} />
  if (look === "tile") {
    const t = paintTint(MARK_HEX[icon.color])
    return (
      <span data-project-mark data-mark-look="tile" className={cn("relative inline-flex size-4 shrink-0 items-center justify-center [container-type:size]", className, "rounded-none")} style={{ color: t.ink }}>
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs><Paint id={`pt${uid}`} level="soft" seed={(hashId(id) % 40) + 1} /></defs>
          <path d={markOutline(id)} fill={t.bg} opacity={0.55} transform="translate(32 32) scale(0.9) translate(-32 -32)" />
          <path d={markOutline(id)} fill={t.bg} filter={`url(#pt${uid})`} />
        </svg>
        <Icon className="relative size-[60%]" strokeWidth={1.5} />
      </span>
    )
  }
  if (look === "plain") {
    return (
      <span data-project-mark className={cn("inline-flex size-4 shrink-0 items-center justify-center [container-type:size]", className, "rounded-none")} style={{ color: MARK_WASH_INK[icon.color] }}>
        <Icon className="size-[88%]" strokeWidth={1.75} />
      </span>
    )
  }
  if (look === "wash") {
    return <span data-project-mark className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[28%] [container-type:size]", className, "rounded-[28%]")} style={{ background: MARK_WASH[icon.color], color: MARK_WASH_INK[icon.color] }}>{glyph}</span>
  }
  // High-fi: a painted pigment tile, with an ink or white icon depending on the pigment.
  const seed = (hashId(id) % 40) + 1
  return (
    <span data-project-mark className={cn("relative inline-flex size-4 shrink-0 items-center justify-center [container-type:size]", className, "rounded-none")} style={{ color: MARK_INK[icon.color] }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs><Paint id={`pm${uid}`} level="soft" seed={seed} /></defs>
        <path fill={MARK_HEX[icon.color]} filter={`url(#pm${uid})`} d={handPath([[4, 4], [60, 4], [60, 60], [4, 60]], { seed, radius: 16, wobble: 1, unevenCorners: 0.4 })} />
      </svg>
      {glyph}
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
