import { useApp } from "../frame"
import { TesterCard } from "../tester"
import { S3_LABELS, S3_LINES } from "./data"

// Scenario 3 has no tool window: the tester answers Christine through the Duet, then asks it what
// changed in the app. The card follows what the app publishes.
export function S3Overlay() {
  const { duet } = useApp()
  const n = !duet.answered.du10 ? 0 : duet.asks.some((q) => q.toLowerCase().includes("changed")) ? 2 : 1
  return <TesterCard label={S3_LABELS[n] ?? ""} lines={S3_LINES} n={n} />
}
