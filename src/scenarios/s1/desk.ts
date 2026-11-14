import type { DeskConfig } from "../desks"
import { S1Claude, S1Overlay } from "./claude"
import { S1_DECISIONS, S1_HINTS } from "./data"

// Scenario 1's desktop: Keller on Tuesday at 9:14, Whyspace open on Today, Claude behind it.
// Taking Trevor's side of the clash records the plan's blue, following Trevor's decision.
export const S1_DESK: DeskConfig = {
  person: "MC",
  clock: "Tue 9:14",
  front: "whyspace",
  tools: [{ id: "claude", name: "Claude", title: "Claude", icon: "claude", App: S1Claude }],
  Overlay: S1Overlay,
  takes: { [S1_DECISIONS.red.id]: { decision: S1_DECISIONS.blue, link: ["nored", S1_DECISIONS.blue.id] } },
  hints: S1_HINTS,
  asks: { short: "Why 15 seconds?", "s1-luna": "Why open on Luna’s real clip?", "s1-dot": "Why end on the moving dot?" },
}
