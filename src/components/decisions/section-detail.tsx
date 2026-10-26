import { useState } from 'react'
import { ArrowRight, FileText, Folder, Play, Sparkles } from 'lucide-react'
import { STATUS_LABEL } from '@/data'
import { ArtifactPicture } from '@/playground/artifact'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sectionPath, type SectionArtifact, type SectionDecision, type WorkSection } from './section-model'

// Illustrative artifact content, shared by the map's focus and the outline reader.
// These previews are wireframes, not embedded external files.
export function ArtifactStage({ artifact }: { artifact: SectionArtifact }) {
  if (artifact.source) return <div className="h-72 overflow-hidden rounded-lg bg-muted/40 p-5"><ArtifactPicture artifact={artifact.source} /></div>
  if (['Design', 'Prototype'].includes(artifact.kind)) return (
    <div className="flex min-h-72 items-center justify-center gap-5 overflow-hidden rounded-lg bg-muted/50 p-6">
      {['Your dinners', 'Choose dinners'].map((title, i) => <div key={title} className="flex h-60 w-32 shrink-0 flex-col rounded-[22px] border-2 border-foreground/50 bg-background p-3 shadow-sm">
        <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-foreground/30" />
        <p className="text-[11px] font-semibold">{title}</p>
        {i === 0 ? <><div className="mt-3 flex h-20 items-center justify-center rounded-lg bg-muted"><span className="text-3xl">◒</span></div><p className="mt-2 text-[9px] font-medium">Lemon chickpea bowls</p><p className="text-[8px] text-muted-foreground">25 min · 2 servings</p><div className="mt-3 h-6 rounded-md bg-muted" /></> : <><div className="mt-3 flex flex-1 items-center justify-center rounded-lg border border-dashed"><span className="text-3xl text-muted-foreground">+</span></div><div className="mt-3 rounded-full bg-foreground p-2 text-center text-[8px] text-background">Choose a recipe</div></>}
      </div>)}
    </div>
  )
  if (artifact.kind.includes('Video')) return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg bg-muted/60 p-8"><div className="mb-6 rounded-2xl border bg-background p-6 text-center"><p className="text-xs text-muted-foreground">Platiful</p><p className="mt-2 text-xl font-medium">Three dinners. One list. Less deciding.</p></div><div className="flex size-12 items-center justify-center rounded-full border bg-background"><Play className="size-5" /></div><p className="mt-4 text-xs text-muted-foreground">Video storyboard preview · 00:30</p></div>
  return <div className="min-h-72 rounded-lg bg-muted/40 p-5"><div className="mx-auto max-w-md rounded border bg-background p-6 shadow-xs"><FileText className="mb-4 size-5 text-muted-foreground" /><p className="font-medium">{artifact.name.replace('.md', '')}</p><p className="mt-4 text-xs font-medium">The direction</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Show three dinners becoming a flexible weekly plan and a grocery list. Use the current recipe-swap flow and explain how quantities update.</p><div className="mt-5 space-y-2">{[100, 90, 96, 60].map((width, i) => <div key={i} className="h-1.5 rounded bg-muted" style={{ width: `${width}%` }} />)}</div></div></div>
}

export function SectionDetail({ section, sections, onDecision, onSection }: {
  section: WorkSection
  sections: WorkSection[]
  onDecision: (decision: SectionDecision, section: WorkSection) => void
  onSection: (id: string) => void
}) {
  const [artifactId, setArtifactId] = useState<string | null>(null)
  const artifact = section.artifacts.find(a => a.id === artifactId) ?? section.artifacts[0]
  const incoming = sections.flatMap(source => source.decisions.filter(d => d.drives.includes(section.id)).map(decision => ({ source, decision })))
  const children = sections.filter(s => s.parent === section.id)
  return <div className="space-y-7" data-section-detail={section.id}>
    <div className="border-b pb-5">
      <p className="mb-2 text-xs text-muted-foreground">{sectionPath(sections, section.id).map(s => s.name).join(' / ')}</p>
      <h2 className="text-2xl font-semibold tracking-tight">{section.name}</h2>
      <p className="mt-2 text-xs text-muted-foreground">{section.owner} · {section.artifacts.length} artifacts · {section.decisions.length} decisions</p>
    </div>
    <div className="max-w-3xl space-y-2"><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />Current direction</p><p className="text-sm leading-relaxed">{section.summary}</p></div>
    <div className="grid items-start gap-6 @min-[800px]:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Artifacts</h3><span className="text-xs text-muted-foreground">{section.artifacts.length} in this section</span></div>
        {artifact ? <>
          <div className="overflow-hidden rounded-xl border bg-background"><ArtifactStage artifact={artifact} /><div className="flex items-center justify-between gap-3 border-t p-4"><div><p className="text-sm font-medium">{artifact.name}</p><p className="mt-1 text-xs text-muted-foreground">{artifact.kind} · Updated {artifact.updated}</p></div><span className="text-[10px] text-muted-foreground">Wireframe preview</span></div></div>
          {section.artifacts.length > 1 && <div className="grid grid-cols-2 gap-2">{section.artifacts.map(a => <button key={a.id} className={cn('flex items-center gap-2 rounded-lg border p-3 text-left text-xs hover:bg-muted', artifact.id === a.id && 'border-foreground bg-muted/50')} onClick={() => setArtifactId(a.id)}><FileText className="size-4 shrink-0" /><span>{a.name}</span></button>)}</div>}
        </> : <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No artifacts here yet. Work can live in the subsections below.</div>}
      </div>
      <div className="min-w-0 space-y-5">
        <div><h3 className="mb-3 text-sm font-semibold">Decisions</h3>{section.decisions.length ? <div className="space-y-3">{section.decisions.map(d => <button key={d.id} className={cn('w-full space-y-2 rounded-lg border p-4 text-left hover:bg-muted', d.inferred && 'border-dashed')} onClick={() => onDecision(d, section)}><span className="block text-xs text-muted-foreground">{d.source ? STATUS_LABEL[d.source.status] : d.inferred ? 'Inferred by AI · awaiting confirmation' : 'Confirmed'} · {section.owner}</span><span className="block text-sm font-medium">{d.title}</span><span className="block text-xs leading-relaxed text-muted-foreground">{d.why}</span><span className="flex items-center gap-1 text-xs">View reasoning<ArrowRight className="size-3" /></span></button>)}</div> : <p className="text-xs text-muted-foreground">No decisions recorded directly in this section.</p>}</div>
        {incoming.length > 0 && <div><p className="mb-3 text-xs font-medium text-muted-foreground">Decisions shaping this work</p><div className="space-y-2">{incoming.map(({ source, decision }) => <button key={decision.id} className="w-full rounded-lg border bg-muted/20 p-3 text-left hover:bg-muted" onClick={() => onDecision(decision, source)}><span className="block text-[10px] text-muted-foreground">From {source.name}</span><span className="mt-1 block text-xs font-medium">{decision.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{decision.why}</span></button>)}</div></div>}
      </div>
    </div>
    {children.length > 0 && <div className="border-t pt-5"><h3 className="mb-3 text-sm font-semibold">Subsections</h3><div className="grid gap-2 @min-[650px]:grid-cols-2">{children.map(child => <Button key={child.id} variant="outline" className="h-auto justify-start p-4" onClick={() => onSection(child.id)}><Folder className="size-4" />{child.name}<ArrowRight className="ml-auto size-4" /></Button>)}</div></div>}
  </div>
}
