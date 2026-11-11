import { Circle, CircleCheck, CircleDashed, Square, Triangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { STATUS_LABEL, type Status } from "@/data"
import { DESIGN } from "@/lib/design"
import { MARK_OF, stateLabel, type Mark } from "@/lib/marks"
import { useMarkLook, type MarkLook } from "@/lib/mark-look"
import { cn } from "@/lib/utils"
import { HifiMark } from "./mark-shapes"

// The main design draws the four marks from lib/marks.ts (● ◉ ○ ▲). Archived Design A keeps its five icons.
const ICON = {
  conf: CircleCheck,
  prec: CircleDashed,
  inf: CircleDashed,
  chg: Triangle,
  open: Circle,
  flag: Square,
}

// One mark, drawn inside a box the size the caller gives (size-4 by default), in the current text color.
// While High-fi is on it is drawn in Forest and rose (mark-shapes.tsx); `look` pins one drawing, for a place
// not redrawn yet (the pill's big mark with the count inside).
export function MarkIcon({ mark, look, className }: { mark: Mark; look?: MarkLook; className?: string }) {
  const tried = useMarkLook()
  const drawn = look ?? tried
  if (drawn === "hifi") return <HifiMark mark={mark} className={className} />
  if (mark === "triangle") {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className={cn("size-4 shrink-0 fill-current", className)}>
        <path d="M8 3 L13.2 12.8 H2.8 Z" />
      </svg>
    )
  }
  return (
    <span aria-hidden className={cn("inline-flex size-4 shrink-0 items-center justify-center", className)}>
      <span className={cn("flex size-[62%] items-center justify-center rounded-full", mark === "filled" ? "bg-current" : "border border-current")}>
        {mark === "ringed" && <span className="size-[45%] rounded-full bg-current" />}
      </span>
    </span>
  )
}

export function StatusIcon({ status, className }: { status: Status; className?: string }) {
  if (DESIGN === "b") return <MarkIcon mark={MARK_OF[status]} className={className ?? "size-4 shrink-0 text-muted-foreground"} />
  const Icon = ICON[status]
  return <Icon className={className ?? "size-4 shrink-0 text-muted-foreground"} />
}

export function StatusBadge({ status }: { status: Status }) {
  if (DESIGN === "b") {
    return (
      <Badge variant={MARK_OF[status] === "filled" ? "secondary" : "outline"} className="gap-1.5 font-normal">
        <MarkIcon mark={MARK_OF[status]} className="size-3" />
        {stateLabel(status)}
      </Badge>
    )
  }
  const Icon = ICON[status]
  return (
    <Badge variant={status === "conf" ? "secondary" : "outline"} className="gap-1 font-normal">
      <Icon />
      {STATUS_LABEL[status]}
    </Badge>
  )
}

// What each mark means, for the bottom of screens that show them.
const MEANING: [Mark, string][] = [
  ["filled", "Confirmed by a person"],
  ["ringed", "Follows an earlier confirmed decision"],
  ["empty", "A guess, nobody confirmed it yet"],
  ["triangle", "Clashes with another decision"],
]
const MEANING_A: [Status, string][] = [
  ["conf", "Confirmed by the team"],
  ["inf", "Inferred by AI, not confirmed yet"],
  ["chg", "Changed an earlier decision"],
  ["open", "Open, not decided yet"],
]

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground"} aria-label="Decision states">
      {DESIGN === "b"
        ? MEANING.map(([m, text]) => <span key={m} className="flex items-center gap-1.5"><MarkIcon mark={m} className="size-3.5 shrink-0" />{text}</span>)
        : MEANING_A.map(([s, text]) => <span key={s} className="flex items-center gap-1.5"><StatusIcon status={s} className="size-3.5 shrink-0" />{text}</span>)}
    </div>
  )
}
