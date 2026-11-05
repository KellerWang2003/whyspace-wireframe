import type { DeskConfig } from "../desks"
import { TITLE, ZOOM } from "../tools/runway-script"
import { S2Overlay, S2Runway } from "./runway"

// Scenario 2's desktop: Keller on Wednesday at 10:02, Whyspace open on Today, Runway behind it.
// Export shares the video to the Marketing thread and opens the check for the zoom, his one guess.
export const S2_DESK: DeskConfig = {
  person: "MC",
  clock: "Wed 10:02",
  front: "whyspace",
  tools: [{ id: "runway", name: "Runway", title: TITLE, icon: "runway", dark: true, App: S2Runway }],
  Overlay: S2Overlay,
  hints: { [ZOOM.id]: ["So the eye lands on her first", "Slows the opening down"] },
}
