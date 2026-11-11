import { PIGMENT } from "@/components/brand/hand"
import { THREAD_COLORS, threadOf, type Thread } from "./threads"
import type { Row } from "./today-model"

// High-fi: each thread takes one of the brand's pigments.
// The brand has four pigments, so the eight thread colors share them, in the order threads are made:
// Whiskr's Research, Brand, App and Marketing come out apricot, sky, rose and leaf.
const PIGMENT_OF: Record<string, string> = Object.fromEntries(
  THREAD_COLORS.map((c, i) => [c.value, [PIGMENT.apricot, PIGMENT.sky, PIGMENT.rose, PIGMENT.leaf][i % 4]]),
)
export const pigmentOf = (t: Pick<Thread, "color">) => PIGMENT_OF[t.color] ?? PIGMENT.leaf

const partOf = (r: Row) => (r.kind === "decide" ? r.decision.part : r.kind === "do" ? r.task.part : r.kind === "asked" ? r.line.part : undefined)
export const threadOfRow = (r: Row) => {
  const part = partOf(r)
  return part ? threadOf(r.project, part) : undefined
}

