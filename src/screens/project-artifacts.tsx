import { useMemo, useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { FileText, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArtifactStage } from '@/components/decisions/section-detail'
import { projectSections } from '@/components/decisions/section-data'
import { sectionPath, type SectionArtifact, type WorkSection } from '@/components/decisions/section-model'
import { SectionWindow } from '@/components/decisions/section-window'
import { PEOPLE, type Project } from '@/data'
import { navigate } from '@/lib/router'

type Entry = { artifact: SectionArtifact; sections: WorkSection[] }

export function ProjectArtifacts({ project, selectedId }: { project: Project; selectedId?: string }) {
  const sections = useMemo(() => projectSections(project.id), [project.id])
  const entries = useMemo(() => {
    const byId = new Map<string, Entry>()
    for (const section of sections) for (const artifact of section.artifacts) {
      const entry = byId.get(artifact.id)
      if (entry) { if (!entry.sections.some(item => item.id === section.id)) entry.sections.push(section) }
      else byId.set(artifact.id, { artifact, sections: [section] })
    }
    return [...byId.values()]
  }, [sections])
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const [openedSection, setOpenedSection] = useState<string | null>(null)
  const path = (id: string) => sectionPath(sections, id).map(section => section.name).join(' / ')
  const selected = entries.find(entry => entry.artifact.id === selectedId)
  const owner = (entry: Entry) => entry.artifact.source ? PEOPLE[entry.artifact.source.owner]?.name : entry.sections[0]?.owner
  const query = search.trim().toLowerCase()
  const matches = entries.filter(entry => (kind === 'all' || entry.artifact.kind === kind) && `${entry.artifact.name} ${entry.artifact.kind} ${owner(entry)} ${entry.sections.map(section => path(section.id)).join(' ')}`.toLowerCase().includes(query))
  const close = () => navigate(`/p/${project.id}/artifacts`)
  const tags = (entry: Entry) => entry.sections.map(section => <button key={section.id} title={`Open ${path(section.id)}`} className="rounded-full border bg-muted/30 px-2 py-1 text-left text-[11px] leading-tight hover:bg-muted" onClick={() => setOpenedSection(section.id)}>{path(section.id)}</button>)

  return <div className="relative min-h-0 min-w-0 flex-1">
    <div className="h-full space-y-6 overflow-y-auto p-6 sm:p-8">
      <header><h1 className="text-2xl font-semibold tracking-tight">Artifacts</h1><p className="mt-2 text-sm text-muted-foreground">All the work in {project.name}. Each artifact can belong to more than one section.</p></header>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><label className="relative"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="Find an artifact" placeholder="Search artifacts, sections, or people…" value={search} onChange={event => setSearch(event.target.value)} className="w-80 max-w-full pl-9" /></label><select aria-label="Artifact type" value={kind} onChange={event => setKind(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All types</option>{[...new Set(entries.map(entry => entry.artifact.kind))].sort().map(value => <option key={value}>{value}</option>)}</select></div><p className="text-xs text-muted-foreground">{matches.length} {matches.length === 1 ? 'artifact' : 'artifacts'}</p></div>
      <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead className="w-[30%] pl-4">Artifact</TableHead><TableHead>Type</TableHead><TableHead className="w-[35%]">Belongs to</TableHead><TableHead>Shared by</TableHead><TableHead className="pr-4">Updated</TableHead></TableRow></TableHeader><TableBody>
        {matches.map(entry => <TableRow key={entry.artifact.id}><TableCell className="py-4 pl-4"><button className="flex items-center gap-3 text-left font-medium hover:underline" onClick={() => navigate(`/p/${project.id}/artifacts/${entry.artifact.id}`)}><FileText className="size-4 shrink-0 text-muted-foreground" />{entry.artifact.name}</button></TableCell><TableCell><Badge variant="secondary" className="font-normal">{entry.artifact.kind}</Badge></TableCell><TableCell className="whitespace-normal"><div className="flex flex-wrap gap-1.5">{tags(entry)}</div></TableCell><TableCell className="text-xs text-muted-foreground">{owner(entry)}</TableCell><TableCell className="pr-4 text-xs text-muted-foreground">{entry.artifact.updated}</TableCell></TableRow>)}
        {!matches.length && <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">{entries.length ? 'No artifacts match your search.' : 'No artifacts in this project yet.'}</TableCell></TableRow>}
      </TableBody></Table></div>
    </div>
    <DialogPrimitive.Root open={!!selected} modal={false} onOpenChange={open => { if (!open) close() }}>
      {selected && <><div className="absolute inset-0 z-[44] bg-black/20" onPointerDown={close} /><DialogPrimitive.Content className="absolute inset-4 z-[45] flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl outline-none sm:inset-8" onInteractOutside={event => event.preventDefault()}>
        <div className="flex items-start justify-between gap-4 border-b p-5"><div><DialogPrimitive.Title className="text-lg font-semibold">{selected.artifact.name}</DialogPrimitive.Title><DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">{selected.artifact.kind} · {owner(selected)} · Updated {selected.artifact.updated}</DialogPrimitive.Description></div><DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label="Close artifact"><X /></Button></DialogPrimitive.Close></div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6"><div><p className="mb-2 text-xs text-muted-foreground">Belongs to</p><div className="flex flex-wrap gap-2">{tags(selected)}</div></div><div className="overflow-hidden rounded-lg border"><div className="h-[min(55vh,520px)] min-h-64 [&>div]:h-full [&>div]:min-h-0"><ArtifactStage artifact={selected.artifact} /></div></div>{selected.artifact.source?.meta && <p className="text-sm text-muted-foreground">{selected.artifact.source.meta}</p>}<p className="text-xs text-muted-foreground">Wireframe preview</p></div>
      </DialogPrimitive.Content></>}
    </DialogPrimitive.Root>
    <SectionWindow section={sections.find(section => section.id === openedSection)} sections={sections} onClose={() => setOpenedSection(null)} onSection={setOpenedSection} onDecision={decision => navigate(`/p/${project.id}/decisions/${decision.id}`)} />
  </div>
}
