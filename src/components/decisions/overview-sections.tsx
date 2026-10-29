import { useMemo } from 'react'
import { Folder } from 'lucide-react'
import type { Artifact, Project } from '@/data'
import { navigate } from '@/lib/router'
import { ArtifactPicture } from '@/playground/artifact'
import { projectSections } from './section-data'
import { descendants } from './section-model'

// Each top-level section with the work it holds. Sections aren't clickable yet;
// the artifacts open on their own page.
export function OverviewSections({ project }: { project: Project }) {
  const sections = useMemo(() => projectSections(project.id), [project.id])
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Sections</h2>
        <a href={`#/p/${project.id}/decisions`} className="text-xs text-muted-foreground hover:text-foreground">Section map</a>
      </div>
      <div className="divide-y rounded-xl border">
        {sections.filter(s => !s.parent).map(section => {
          const branch = new Set([section.id, ...descendants(sections, section.id)])
          const artifacts = [...new Map(sections.filter(s => branch.has(s.id)).flatMap(s => s.artifacts).flatMap(a => a.source ? [[a.id, a.source] as const] : [])).values()]
          return (
            <div key={section.id} className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{section.name}</span>
                <span className="text-xs text-muted-foreground">{section.owner}</span>
              </div>
              {artifacts.length > 0 && (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {artifacts.map(a => <ArtifactCard key={a.id} artifact={a} onOpen={() => navigate(`/p/${project.id}/artifacts/${a.id}`)} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ArtifactCard({ artifact: a, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border bg-background text-left transition hover:border-foreground/40 hover:shadow-sm">
      <div className="pointer-events-none h-20 overflow-hidden border-b bg-muted/50">
        <ArtifactPicture artifact={{ ...a, content: undefined }} />
      </div>
      <div className="space-y-0.5 px-2.5 py-2">
        <div className="truncate text-xs font-medium">{a.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">{a.kind} · {a.updated}</div>
      </div>
    </button>
  )
}
