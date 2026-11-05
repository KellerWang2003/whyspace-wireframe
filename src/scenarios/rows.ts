import type { Mark } from "@/lib/marks"
import type { AppSnapshot } from "./frame"

// A decision a tool caught, as the pill and the tools show it: its mark comes from the app.
export type Kind = "guess" | "conf" | "clash" | "prec"
export type Row = { id: string; title: string; kind: Kind; why?: string; clashes?: string; hints: string[] }

export function rowOf(app: AppSnapshot, id: string, hints: Record<string, string[]> = {}): Row | null {
  const d = app.decisions.find((x) => x.id === id)
  const settled = app.clashes[id]
  if (!d || settled?.choice === "theirs") return null
  const s = app.status[id] ?? d.status
  const kind: Kind = settled ? "conf" : s === "flag" ? "clash" : s === "prec" ? "prec" : s === "conf" || s === "chg" ? "conf" : "guess"
  return { id, title: d.title, kind, why: d.why, clashes: d.clashes, hints: hints[id] ?? [] }
}
export const rowsOf = (app: AppSnapshot, ids: string[], hints?: Record<string, string[]>) => ids.map((id) => rowOf(app, id, hints)).filter((r): r is Row => !!r)
export const markOfKind = (k: Kind): Mark => (k === "conf" ? "filled" : k === "prec" ? "ringed" : k === "clash" ? "triangle" : "empty")
