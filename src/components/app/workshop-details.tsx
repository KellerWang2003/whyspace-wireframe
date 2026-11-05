import { CalendarDays } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AvatarStack } from "@/components/app/person"
import { SESSIONS, type Workshop } from "@/data"

// A workshop's metadata, behind its ⋯ menu. Meetings that linked this workshop are listed
// here only: a workshop is a place to work, not a meeting room, so they stay out of sight elsewhere.
export function WorkshopDetails({ workshop, open, onOpenChange }: { workshop: Workshop; open: boolean; onOpenChange: (o: boolean) => void }) {
  const linked = SESSIONS.filter((s) => s.workshop === workshop.id)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{workshop.title}</DialogTitle>
          <DialogDescription>Edited {workshop.edited}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">People</div>
            <AvatarStack ids={workshop.people} max={5} />
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Linked in meetings · {linked.length}</div>
            {linked.length ? linked.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{m.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{m.when}</span>
              </div>
            )) : <p className="text-muted-foreground">Not linked in any meeting.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
