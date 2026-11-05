import type { DeskConfig } from "../desks"
import { S3Overlay } from "./tester"

// Scenario 3's desktop: Keller on Thursday at 9:04, Whyspace alone. His Duet needs him.
export const S3_DESK: DeskConfig = {
  person: "MC",
  clock: "Thu 9:04",
  front: "whyspace",
  tools: [],
  Overlay: S3Overlay,
  hints: { vpurr: ["The dot purrs in the app", "Cats notice the purr"] },
}
