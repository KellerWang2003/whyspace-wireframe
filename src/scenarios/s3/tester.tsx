import { useApp } from "../frame"
import { TesterCard } from "../tester"
import { S3_LABELS, S3_LINES } from "./data"

// Scenario 3 has no tool window: the tester answers Kelly and Christine through the Duet, then asks
// it what changed in the app. The card follows what the app publishes: the question being answered,
// else the first one still open, else the line for the Duet.
export function S3Overlay() {
  const { duet } = useApp()
  const ask = duet.pending ?? ["du11", "du10"].find((id) => !duet.answered[id])
  const n = ask === "du11" ? 0 : ask === "du10" ? 1 : duet.asks.some((q) => q.toLowerCase().includes("changed")) ? 3 : 2
  return <TesterCard label={S3_LABELS[n] ?? ""} lines={S3_LINES} n={n} />
}
