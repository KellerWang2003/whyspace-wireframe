import { MarkIcon } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { SURE_LABEL, type Sure } from "./duet"

// How sure your Duet was, drawn three ways while we pick one (#/playground/sure).
// meter: three short segments, as many filled as it was sure. words: the level in plain words, with
// "Not sure" in ink. marks: the decision marks (● ◉ ○).
export type SureLook = "meter" | "words" | "marks"
export const SURE_LOOK: SureLook = "meter"

const FILLED: Record<Sure, number> = { sure: 3, fairly: 2, unsure: 1 }
const MARK = { sure: "filled", fairly: "ringed", unsure: "empty" } as const

export function SureMark({ sure, look = SURE_LOOK, className }: { sure: Sure; look?: SureLook; className?: string }) {
  const label = SURE_LABEL[sure]
  if (look === "words") {
    return <span className={cn("shrink-0 text-xs whitespace-nowrap", sure === "unsure" ? "font-medium text-foreground" : "text-muted-foreground", className)}>{label}</span>
  }
  if (look === "marks") {
    return <span role="img" aria-label={label} className={cn("inline-flex shrink-0", className)}><MarkIcon mark={MARK[sure]} className="size-3.5 text-muted-foreground" /></span>
  }
  return (
    <span role="img" aria-label={label} className={cn("inline-flex shrink-0 items-center gap-0.5", className)}>
      {[0, 1, 2].map((i) => <span key={i} className={cn("h-1 w-2 rounded-full", i < FILLED[sure] ? "bg-foreground/65" : "bg-foreground/12")} />)}
    </span>
  )
}
