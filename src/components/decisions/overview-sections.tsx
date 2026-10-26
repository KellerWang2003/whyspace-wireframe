import { useMemo, useState } from 'react'
import { ArrowRight, ChevronRight, Folder } from 'lucide-react'
import type { Project } from '@/data'
import { navigate } from '@/lib/router'
import { projectSections } from './section-data'
import { descendants } from './section-model'
import { SectionWindow } from './section-window'

export function OverviewSections({ project }: { project: Project }) {
  const sections = useMemo(() => projectSections(project.id), [project.id])
  const [opened, setOpened] = useState<string | null>(null)
  return <>
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium text-muted-foreground">Sections</h2><a href={`#/p/${project.id}/decisions`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Open section map<ArrowRight className="size-3" /></a></div>
      <div className="divide-y rounded-xl border">
        {sections.filter(s => !s.parent).map(section => {
          const branch = new Set([section.id, ...descendants(sections, section.id)])
          const artifacts = sections.filter(s => branch.has(s.id)).flatMap(s => s.artifacts)
          const featured = artifacts.find(a => a.source?.kind === 'Prototype') ?? artifacts.find(a => a.source) ?? artifacts[0]
          return <div key={section.id} className="space-y-3 p-4">
            <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpened(section.id)}><Folder className="size-4 text-muted-foreground" /><span className="flex-1 text-sm font-medium">{section.name}</span><span className="text-xs text-muted-foreground">{section.owner}</span><ChevronRight className="size-3.5 text-muted-foreground" /></button>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{section.summary}</p>
            {sections.some(s => s.parent === section.id) && <div className="flex flex-wrap gap-x-3 gap-y-1">{sections.filter(s => s.parent === section.id).map(child => <button key={child.id} className="text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={() => setOpened(child.id)}>{child.name}</button>)}</div>}
            {featured && <a href={`#/p/${project.id}/artifacts/${featured.id}`} className="inline-flex items-center gap-1.5 text-xs hover:underline">{featured.name}<ArrowRight className="size-3" /></a>}
          </div>
        })}
      </div>
    </section>
    <SectionWindow section={sections.find(s => s.id === opened)} sections={sections} onClose={() => setOpened(null)} onSection={setOpened} onDecision={decision => navigate(`/p/${project.id}/decisions/${decision.id}`)} />
  </>
}
