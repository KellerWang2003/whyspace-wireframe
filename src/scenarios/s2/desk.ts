import type { DeskConfig } from "../desks"
import { STAR, TITLE } from "../tools/runway-script"
import { S2Overlay, S2Runway } from "./runway"

// Scenario 2's desktop: Keller on Wednesday at 10:02, Whyspace open on Today, Runway behind it.
// Export shares the video to the Marketing thread and opens the check for Luna as the main character,
// his one guess: he never said why, so the check asks.
export const S2_DESK: DeskConfig = {
  person: "MC",
  clock: "Wed 10:02",
  front: "whyspace",
  tools: [{ id: "runway", name: "Runway", title: TITLE, icon: "runway", dark: true, App: S2Runway }],
  Overlay: S2Overlay,
  hints: { [STAR.id]: ["Luna looks the best on camera", "Her pounce is the clearest clip"] },
  asks: { [STAR.id]: "Why Luna?" },
}
