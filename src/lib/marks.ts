import { STATUS_LABEL, type Status } from "@/data"
import { DESIGN } from "@/lib/design"

// Design B shows every decision with one of four marks, the same marks the overlay and the Desk use:
// ● confirmed, ◉ from precedent, ○ guess, ▲ clash. Shape, never color. A changed decision is a
// confirmed one whose history sits on its sheet. The drawing lives in components/app/status-badge.tsx.
export type Mark = "filled" | "ringed" | "empty" | "triangle"
export const MARKS: Mark[] = ["filled", "ringed", "empty", "triangle"]
export const MARK_OF: Record<Status, Mark> = { conf: "filled", chg: "filled", prec: "ringed", inf: "empty", open: "empty", flag: "triangle" }
export const MARK_LABEL: Record<Mark, string> = { filled: "Confirmed", ringed: "From precedent", empty: "Guess", triangle: "Clash" }
export const MARK_CHAR: Record<Mark, string> = { filled: "●", ringed: "◉", empty: "○", triangle: "▲" }
export const markOf = (status: Status): Mark => MARK_OF[status]

// The word next to a mark. An open question keeps its own word: nobody guessed it yet.
export const B_LABEL: Record<Status, string> = { conf: "Confirmed", chg: "Confirmed", prec: "From precedent", inf: "Guess", open: "Open", flag: "Clash" }
export const stateLabel = (status: Status) => (DESIGN === "b" ? B_LABEL[status] : STATUS_LABEL[status])
