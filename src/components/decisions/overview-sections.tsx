import { useMemo } from 'react'
import { PEOPLE, type Artifact, type Project } from '@/data'
import { PersonAvatar } from '@/components/app/person'
import { navigate } from '@/lib/router'
import { ArtifactPicture } from '@/playground/artifact'
import { projectSections } from './section-data'
import { descendants } from './section-model'

// Each top-level section with its lead and the work it holds, as compact tiles.
// Sections aren't clickable yet; the artifacts open on their own page.
export function OverviewSections({ project }: { project: Project }) {
  const sections = useMemo(() => projectSections(project.id), [project.id])
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Sections</h2>
        <a href={`#/p/${project.id}/decisions`} className="text-xs text-muted-foreground hover:text-foreground">Section map</a>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.filter(s => !s.parent).map(section => {
          const branch = new Set([section.id, ...descendants(sections, section.id)])
          const artifacts = [...new Map(sections.filter(s => branch.has(s.id)).flatMap(s => s.artifacts).flatMap(a => a.source ? [[a.id, a.source] as const] : [])).values()]
          const lead = Object.values(PEOPLE).find(p => p.name.split(' ')[0] === section.owner)
          return (
            <div key={section.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-sm font-medium">{section.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Lead
                  {lead && <PersonAvatar id={lead.id} className="size-5" />}
                  <span className="text-foreground">{section.owner}</span>
                </span>
              </div>
              {artifacts.length > 0 && (
                <div className="space-y-1">
                  {artifacts.map(a => <ArtifactChip key={a.id} artifact={a} onOpen={() => navigate(`/p/${project.id}/artifacts/${a.id}`)} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// A one-row chip, like an attached artifact: a small preview, then name, kind and date.
function ArtifactChip({ artifact: a, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex h-11 w-full items-center gap-2.5 rounded-md border bg-background p-1 pr-2.5 text-left transition hover:border-foreground/40">
      <div className="pointer-events-none relative h-full w-14 shrink-0 overflow-hidden rounded-sm bg-muted/60">
        {/* Draw the preview at a readable size, then scale it into the thumbnail. */}
        <div className="absolute top-0 left-0 h-[150px] w-[260px] origin-top-left scale-[0.215]">
          <ArtifactPicture artifact={{ ...a, content: undefined }} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium leading-tight">{a.name}</div>
        <div className="truncate text-[11px] leading-tight text-muted-foreground">{a.kind} · {a.updated}</div>
      </div>
    </button>
  )
}
