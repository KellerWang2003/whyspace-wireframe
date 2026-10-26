import { Dialog as DialogPrimitive } from 'radix-ui'
import { Folder, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionDetail } from './section-detail'
import type { SectionDecision, WorkSection } from './section-model'

// This dialog stays inside the project's content bounds, including its outline.
// The main application navigation remains available outside those bounds.
export function SectionWindow({ section, sections, onClose, onSection, onDecision, onMove }: {
  section: WorkSection | undefined
  sections: WorkSection[]
  onClose: () => void
  onSection: (id: string) => void
  onDecision: (decision: SectionDecision, section: WorkSection) => void
  onMove?: (id: string) => void
}) {
  return <DialogPrimitive.Root open={!!section} modal={false} onOpenChange={open => { if (!open) onClose() }}>
    {section && <>
      <div className="absolute inset-0 z-[45] bg-black/20" data-slot="section-window-backdrop" onPointerDown={onClose} />
      <DialogPrimitive.Content
        className="absolute inset-3 z-[46] flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl outline-none sm:inset-6 lg:inset-8"
        onInteractOutside={event => event.preventDefault()}
      >
        <DialogPrimitive.Title className="sr-only">{section.name}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Section detail: current direction, artifacts, and decisions.</DialogPrimitive.Description>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3">
          <p className="text-xs text-muted-foreground">Section · {section.name}</p>
          <div className="flex items-center gap-2">
            {onMove && <Button variant="ghost" size="sm" onClick={() => onMove(section.id)}><Folder />Move section</Button>}
            <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Close expanded section"><X /></Button></DialogPrimitive.Close>
          </div>
        </div>
        <div className="@container min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="mx-auto max-w-6xl"><SectionDetail key={section.id} section={section} sections={sections} onDecision={onDecision} onSection={onSection} /></div>
        </div>
      </DialogPrimitive.Content>
    </>}
  </DialogPrimitive.Root>
}
