import { useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { ArrowRight, Bot, Check, ChevronDown, ChevronRight, FileText, Flag, History, Maximize2, Quote, RotateCcw, User, X } from 'lucide-react'
import { AppShell } from '@/components/app/app-shell'
import { PersonAvatar } from '@/components/app/person'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PEOPLE } from '@/data'
import { cn } from '@/lib/utils'
import { DECISION_EXAMPLES, type DecisionRecord } from '@/playground/decision-records'

const fullName = (id: string) => PEOPLE[id]?.name ?? id
const firstName = (id: string) => fullName(id).split(' ')[0]
const captureLabel = (d: DecisionRecord) => d.capture.kind === 'ai'
  ? `Recorded by ${firstName(d.capture.onBehalfOf)}’s ${d.capture.tool}`
  : `Recorded by ${firstName(d.capture.onBehalfOf)} · ${d.capture.tool}`
const stateLabel = (d: DecisionRecord) => ({ proposed: 'Proposed', confirmed: 'Confirmed', superseded: 'Superseded' })[d.state]

function Marks({ decision: d }: { decision: DecisionRecord }) {
  return <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
    <Badge variant="outline" className={cn('gap-1 font-normal', d.state === 'proposed' && 'border-dashed', d.state === 'superseded' && 'text-muted-foreground')}>{d.state === 'confirmed' && <Check className="size-3" />}{stateLabel(d)}</Badge>
    {d.review === 'awaiting' && <span className="rounded-md border border-dashed px-2 py-0.5">Awaiting confirmation</span>}
    {d.review === 'flagged' && <span className="flex items-center gap-1 rounded-md border px-2 py-0.5"><Flag className="size-3" />Flagged</span>}
    {d.activity !== 'none' && <span className="flex items-center gap-1.5 px-1"><span className="size-1 rounded-full bg-foreground" />{d.activity === 'new' ? 'New' : 'Changed'}</span>}
  </div>
}

function Attribution({ decision: d }: { decision: DecisionRecord }) {
  return <div className="space-y-1.5 text-xs text-muted-foreground">
    <div className="flex items-center gap-2"><PersonAvatar id={d.decidedBy[0] ?? d.owner} className="size-5" /><span>{d.decidedBy.length ? `Decided by ${d.decidedBy.map(fullName).join(' and ')}` : `For ${fullName(d.owner)} to confirm`}</span></div>
    {d.decidedBy.length > 0 && !d.decidedBy.includes(d.owner) && <p>Owner: {fullName(d.owner)}</p>}
    <div className="flex items-center gap-1.5 pl-0.5">{d.capture.kind === 'ai' ? <Bot className="size-3.5" /> : <User className="size-3.5" />}<span>{captureLabel(d)}</span></div>
    {d.confirmedBy && d.capture.kind === 'ai' && <p className="pl-0.5">Confirmed by {fullName(d.confirmedBy)} · {d.confirmedAt}</p>}
  </div>
}

function Locations({ decision: d }: { decision: DecisionRecord }) {
  return <div className="flex flex-wrap gap-1.5">{d.sections.map(section => <span key={section} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{section}</span>)}</div>
}

function Evidence({ decision: d }: { decision: DecisionRecord }) {
  return <div className="space-y-3 rounded-xl border bg-muted/25 p-4">
    <div className="flex items-start gap-2"><Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs font-medium">{d.source.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{d.source.kind} · {fullName(d.source.author)}</p></div></div>
    <blockquote className="border-l-2 pl-3 text-sm leading-relaxed">“{d.source.quote}”</blockquote>
    <p className="text-xs leading-relaxed text-muted-foreground">{d.source.context}</p>
    <p className="text-[10px] text-muted-foreground">Illustrative source excerpt</p>
  </div>
}

type RecordActions = { decision: DecisionRecord; onOpen: () => void }

function ShortOrigin({ decision: d }: { decision: DecisionRecord }) {
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{d.capture.kind === 'ai' ? <Bot className="size-3.5 shrink-0" /> : <PersonAvatar id={d.decidedBy[0] ?? d.owner} className="size-4" />}{d.capture.kind === 'ai' ? `${firstName(d.capture.onBehalfOf)}’s ${d.capture.tool}` : d.decidedBy.map(firstName).join(' & ')}</span>
}

function StateMark({ decision: d }: { decision: DecisionRecord }) {
  return <span title={`${stateLabel(d)}${d.review === 'awaiting' ? ' · awaiting human confirmation' : d.review === 'flagged' ? ' · flagged' : ''}`} className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border text-muted-foreground', d.review === 'awaiting' && 'border-dashed')}>
    {d.review === 'flagged' ? <Flag className="size-3" /> : d.state === 'confirmed' ? <Check className="size-3" /> : d.state === 'superseded' ? <History className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
  </span>
}

function Reference({ decision: d, onOpen }: RecordActions) {
  return <button onClick={onOpen} className={cn('inline-flex max-w-full items-center gap-2 rounded-full border bg-background py-1.5 pr-3 pl-2 text-left text-xs shadow-xs hover:border-foreground/40', d.review === 'awaiting' && 'border-dashed')}><StateMark decision={d} /><span className="truncate">{d.title}</span>{d.capture.kind === 'ai' && <Bot className="size-3.5 shrink-0 text-muted-foreground" aria-label={`${firstName(d.capture.onBehalfOf)}’s ${d.capture.tool}`} />}</button>
}

function CompactCard({ decision: d, onOpen }: RecordActions) {
  return <article className={cn('w-full max-w-sm space-y-3 rounded-xl border bg-background p-4 shadow-xs', d.review === 'awaiting' && 'border-dashed')} data-display-state="compact">
    <div className="flex items-start gap-2"><StateMark decision={d} /><button onClick={onOpen} className="flex-1 text-left text-sm font-semibold leading-snug hover:underline">{d.title}</button></div>
    <ShortOrigin decision={d} />
    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{d.reasonInferred && 'Suggested reason: '}{d.why}</p>
    <div className="flex items-center justify-between gap-2 border-t pt-2.5"><span className="text-[10px] text-muted-foreground">{d.review === 'awaiting' ? 'To confirm' : d.review === 'flagged' ? 'Flagged' : stateLabel(d)} · {d.sections.length} sections</span><button onClick={onOpen} aria-label="Expand compact decision" className="rounded p-1 text-muted-foreground hover:bg-muted"><Maximize2 className="size-3.5" /></button></div>
  </article>
}

function ExpandedCard({ decision: d, onOpen }: RecordActions) {
  return <article className={cn('space-y-4 rounded-xl border bg-background p-5 shadow-xs', d.review === 'awaiting' && 'border-dashed')} data-display-state="expanded">
    <Marks decision={d} /><h3 className="text-base font-semibold leading-snug">{d.title}</h3>
    <div><p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{d.reasonInferred ? 'Suggested reason · AI inference' : 'Why'}</p><p className="text-sm leading-relaxed">{d.why}</p></div>
    {d.was && <p className="text-xs text-muted-foreground line-through">{d.was}</p>}
    <Attribution decision={d} /><Locations decision={d} />
    <div className="rounded-lg bg-muted/40 p-3"><p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Quote className="size-3" />{d.source.kind} · {d.source.title}</p><blockquote className="mt-2 line-clamp-2 text-xs leading-relaxed">“{d.source.quote}”</blockquote></div>
    <div className="flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{d.artifacts.length} {d.artifacts.length === 1 ? 'artifact' : 'artifacts'} · {d.history.length} {d.history.length === 1 ? 'history entry' : 'history entries'}</span><Button variant="ghost" size="sm" onClick={onOpen}>Full record<ArrowRight /></Button></div>
  </article>
}

function FullRecord({ decision: d, records, onConfirm, onRelated }: {
  decision: DecisionRecord; records: DecisionRecord[]; onConfirm: (id: string) => void; onRelated: (id: string) => void
}) {
  return <article className="@container space-y-7" data-display-state="full">
    <header className="space-y-3 border-b pb-6"><Marks decision={d} /><h3 className="text-2xl font-semibold tracking-tight">{d.title}</h3><p className="text-xs text-muted-foreground">Whiskr · Recorded {d.recordedAt}</p></header>
    {d.review === 'awaiting' && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4"><div><p className="text-sm font-medium">A person needs to confirm this choice.</p><p className="mt-1 text-xs text-muted-foreground">{firstName(d.capture.onBehalfOf)}’s {d.capture.tool} inferred it from the work.</p></div><Button size="sm" onClick={() => onConfirm(d.id)}>Confirm as Keller</Button></div>}
    {d.flag && <p className="flex items-start gap-2 rounded-lg border p-3 text-sm"><Flag className="mt-0.5 size-4 shrink-0" />{d.flag}</p>}
    <div className="grid items-start gap-8 @min-[750px]:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-7">
        <section><h4 className="mb-2 text-xs font-medium text-muted-foreground">{d.reasonInferred ? 'Suggested reason · inferred by AI' : 'Why this choice'}</h4><p className="text-sm leading-relaxed">{d.why}</p></section>
        {d.was && <section><h4 className="mb-2 text-xs font-medium text-muted-foreground">Previously</h4><p className="text-sm text-muted-foreground line-through">{d.was}</p></section>}
        <section><h4 className="mb-3 text-xs font-medium text-muted-foreground">Source evidence</h4><Evidence decision={d} /></section>
        {d.alternatives.length > 0 && <section><h4 className="mb-3 text-xs font-medium text-muted-foreground">Alternatives considered</h4><div className="space-y-2">{d.alternatives.map(alt => <div key={alt.title} className="rounded-lg border p-3"><p className="text-sm font-medium">{alt.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alt.tradeoff}</p></div>)}</div></section>}
      </div>
      <div className="min-w-0 space-y-6">
        <section><h4 className="mb-3 text-xs font-medium text-muted-foreground">People & capture</h4><Attribution decision={d} /><div className="mt-3 space-y-1 text-[11px] text-muted-foreground"><p>Responsible: {fullName(d.owner)}</p><p>Basis: {d.capture.basis === 'inferred' ? 'AI inference' : 'Explicit human statement'}</p><p>Recorded: {d.recordedAt}</p>{d.confirmedBy && <p>Confirmed: {fullName(d.confirmedBy)} · {d.confirmedAt}</p>}</div></section>
        <section><h4 className="mb-3 text-xs font-medium text-muted-foreground">Sections</h4><Locations decision={d} /></section>
        <section><h4 className="mb-3 text-xs font-medium text-muted-foreground">Artifacts & anchors</h4><div className="space-y-2">{d.artifacts.map(artifact => <div key={artifact.name} className="flex gap-2 rounded-lg border p-3"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs font-medium">{artifact.name}</p><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{artifact.kind} · {artifact.anchor}</p></div></div>)}</div></section>
        {d.relationships.length > 0 && <section><h4 className="mb-2 text-xs font-medium text-muted-foreground">Relationships</h4>{d.relationships.map(relation => <button key={`${relation.label}:${relation.target}`} className="flex w-full items-start gap-2 border-b py-3 text-left text-xs hover:bg-muted/40" onClick={() => onRelated(relation.target)}><div className="flex-1"><span className="block text-[10px] text-muted-foreground">{relation.label}</span><span className="mt-1 block">{records.find(record => record.id === relation.target)?.title}</span></div><ArrowRight className="mt-1 size-3.5 shrink-0" /></button>)}</section>}
      </div>
    </div>
    <section className="border-t pt-6"><h4 className="mb-4 text-xs font-medium text-muted-foreground">History</h4><div className="space-y-4">{d.history.map((entry, index) => <div key={`${entry.at}:${index}`} className="flex items-start gap-3"><History className="mt-1 size-3.5 shrink-0 text-muted-foreground" /><div><p className="text-[11px] text-muted-foreground">{entry.at} · {fullName(entry.actor)}</p><p className="mt-1 text-sm leading-relaxed">{entry.event}</p></div></div>)}</div></section>
  </article>
}

const EXAMPLES: Record<string, string> = {
  move: 'Human decision', short: 'AI inference · awaiting confirmation', pounce: 'AI capture · confirmed', nored: 'Changed & flagged', red: 'Superseded decision',
}

function SpecimenHeading({ number, title, context }: { number: string; title: string; context: string }) {
  return <div className="mb-4 flex items-start gap-3"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border text-[10px] text-muted-foreground">{number}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{context}</p></div></div>
}

export function DecisionPlayground() {
  const [records, setRecords] = useState<DecisionRecord[]>(DECISION_EXAMPLES)
  const [selectedId, setSelectedId] = useState('short')
  const [rowExpanded, setRowExpanded] = useState(false)
  const [windowOpen, setWindowOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const selected = records.find(record => record.id === selectedId) ?? records[0]
  const open = () => setWindowOpen(true)
  const confirm = (id: string) => {
    setRecords(old => old.map(d => d.id === id && d.review === 'awaiting' ? {
      ...d, state: 'confirmed', review: 'clear', decidedBy: ['MC'], confirmedBy: 'MC', confirmedAt: 'Oct 25 · just now',
      history: [...d.history, { at: 'Oct 25 · just now', actor: 'MC', event: 'Confirmed the decision in Whyspace. Original AI attribution and the suggested reason remain attached to the record.' }],
    } : d))
    setNotice('Confirmed as Keller. Every display below reflects the same record; the AI capture remains visible.')
  }
  const choose = (id: string) => { setSelectedId(id); setRowExpanded(false); setNotice('') }

  return <AppShell crumbs={[{ label: 'Prototype' }, { label: 'Decision display states' }]}>
    <div className="relative min-h-0 min-w-0 flex-1">
      <div className="h-full overflow-y-auto p-5 sm:p-7">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-4"><div><p className="mb-1 text-xs text-muted-foreground">Decision component playground</p><h1 className="text-2xl font-semibold tracking-tight">One decision, at every size</h1><p className="mt-2 text-sm text-muted-foreground">The same record shown as a reference, a row, a compact card, an expanded card, and a full record.</p></div><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex flex-wrap items-center gap-3 text-xs"><span className="text-muted-foreground">Example</span><select aria-label="Decision example" value={selectedId} onChange={event => choose(event.target.value)} className="h-10 max-w-full rounded-md border bg-background px-3 text-sm">{records.map(d => <option value={d.id} key={d.id}>{EXAMPLES[d.id]} — {d.title}</option>)}</select></label><Button variant="ghost" size="sm" onClick={() => { setRecords(DECISION_EXAMPLES); setRowExpanded(false); setNotice('') }}><RotateCcw />Reset examples</Button></div></header>
          {notice && <p role="status" className="rounded-lg border bg-muted/30 p-3 text-xs">{notice}</p>}
          <section data-specimen="reference"><SpecimenHeading number="01" title="Inline reference" context="A mention inside a note, an artifact, or a conversation. Just enough to recognize the decision." /><div className="rounded-xl border bg-muted/20 p-5"><p className="mb-3 text-xs text-muted-foreground">This part of the implementation follows:</p><Reference decision={selected} onOpen={open} /></div></section>
          <section data-specimen="row"><SpecimenHeading number="02" title="Collapsed row" context="A single line in a list. Click the row to expand it in place." /><div className="overflow-hidden rounded-xl border"><button aria-label="Expand decision row" aria-expanded={rowExpanded} aria-controls="decision-row-content" onClick={() => setRowExpanded(value => !value)} className="flex h-12 w-full items-center gap-3 bg-background px-4 text-left hover:bg-muted/30" data-display-state="row">{rowExpanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}<StateMark decision={selected} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{selected.title}</span><span className="hidden shrink-0 sm:block"><ShortOrigin decision={selected} /></span><span className="hidden shrink-0 text-[10px] text-muted-foreground lg:block">{selected.review === 'awaiting' ? 'To confirm' : selected.review === 'flagged' ? 'Flagged' : stateLabel(selected)}</span></button>{rowExpanded && <div id="decision-row-content" className="border-t bg-muted/20 p-4"><ExpandedCard decision={selected} onOpen={open} /></div>}</div></section>
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <section data-specimen="compact"><SpecimenHeading number="03" title="Compact card" context="A small decision on the section canvas. Title, short why, attribution, and status." /><div className="flex min-h-64 items-center justify-center rounded-xl border bg-muted/25 p-5"><CompactCard decision={selected} onOpen={open} /></div></section>
            <section data-specimen="expanded"><SpecimenHeading number="04" title="Expanded card" context="More context in place: the full reason, people, sections, and a source excerpt." /><ExpandedCard decision={selected} onOpen={open} /></section>
          </div>
          <section data-specimen="full"><div className="flex flex-wrap items-start justify-between gap-3"><SpecimenHeading number="05" title="Fully expanded record" context="The complete decision, with evidence, artifacts, relationships, alternatives, and history visible together." /><Button variant="outline" size="sm" onClick={open}><Maximize2 />Open as window</Button></div><div className="rounded-xl border bg-background p-5 sm:p-7"><FullRecord decision={selected} records={records} onConfirm={confirm} onRelated={choose} /></div></section>
          <p className="text-[10px] text-muted-foreground">One shared record across all five display states · Example data only · Reset to undo confirmation experiments</p>
        </div>
      </div>
      <DialogPrimitive.Root open={windowOpen} modal={false} onOpenChange={setWindowOpen}>{windowOpen && <><div className="absolute inset-0 z-[45] bg-black/20" onPointerDown={() => setWindowOpen(false)} /><DialogPrimitive.Content className="absolute inset-3 z-[46] flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl outline-none sm:inset-6" onInteractOutside={event => event.preventDefault()}><DialogPrimitive.Title className="sr-only">{selected.title}</DialogPrimitive.Title><DialogPrimitive.Description className="sr-only">Fully expanded decision record</DialogPrimitive.Description><div className="flex items-center justify-between border-b px-5 py-3"><span className="text-xs text-muted-foreground">Decision record · Whiskr</span><DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label="Close decision window"><X /></Button></DialogPrimitive.Close></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8"><div className="mx-auto max-w-6xl"><FullRecord decision={selected} records={records} onConfirm={confirm} onRelated={choose} /></div></div></DialogPrimitive.Content></>}</DialogPrimitive.Root>
    </div>
  </AppShell>
}
