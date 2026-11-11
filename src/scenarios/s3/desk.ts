import type { DeskConfig } from "../desks"
import { S3Slack } from "./slack"
import { S3Overlay } from "./tester"

// Scenario 3's desktop: Keller on Thursday at 9:04, Whyspace open on Today, Slack behind it. His Duet
// needs him: the questions came in Slack, and he can answer them there or in Whyspace.
export const S3_DESK: DeskConfig = {
  person: "MC",
  clock: "Thu 9:04",
  front: "whyspace",
  tools: [{ id: "slack", name: "Slack", title: "Slack", icon: "slack", App: S3Slack }],
  Overlay: S3Overlay,
  hints: { vpurr: ["The dot purrs in the app", "Cats notice the purr"] },
}
