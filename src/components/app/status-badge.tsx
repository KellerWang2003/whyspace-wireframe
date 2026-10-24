import { Circle, CircleCheck, CircleDashed, Square, Triangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL, type Status } from "@/data"

// Status is shape plus word, never color: solid check, dashed ring, triangle, ring, square.
const ICON = {
  conf: CircleCheck,
  inf: CircleDashed,
  chg: Triangle,
  open: Circle,
  flag: Square,
}

export function StatusIcon({ status, className }: { status: Status; className?: string }) {
  const Icon = ICON[status]
  return <Icon className={className ?? "size-4 shrink-0 text-muted-foreground"} />
}

export function StatusBadge({ status }: { status: Status }) {
  const Icon = ICON[status]
  return (
    <Badge variant={status === "conf" ? "secondary" : "outline"} className="gap-1 font-normal">
      <Icon />
      {STATUS_LABEL[status]}
    </Badge>
  )
}
