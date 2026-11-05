import type { Decision } from "@/data"
import type { Item } from "@/design-b/work"

// Scenario 2's Runway: what the tester says, what Runway answers, and what it writes to Whyspace.
// Ids it points at come from scenario 2's data: t20 (Make the promo video), the plan's decisions
// (short, pounce, enddot) and Trevor's (nored, dart, dotbrand).

export const TITLE = "Runway — Whiskr promo"
export const PROMPT = "Use the Whyspace MCP to read Whiskr’s Marketing thread: the promo video plan, its decisions and brand guidelines v3. Set up the 15-second video from the plan’s shot list: open on Luna’s clip at 0:42, blue title and end cards, no red, end on the dot darting like prey. Ask me before changing anything already decided."
export const LINES = [
  PROMPT,
  "Add a slow zoom on Luna’s pounce in the opening shot, so the eye lands on her first.",
  "Export it and share it to the Marketing thread.",
]
export const LABEL = "Say to Runway"
export const TASK = "t20"

// What Runway reads from the thread before it sets the cut up.
export const READ = {
  plan: [
    { title: "Make the promo video 15 seconds", mark: "filled" as const },
    { title: "Start the promo video with a real cat clip", mark: "filled" as const },
    { title: "Use blue for the promo title card", mark: "ringed" as const },
    { title: "End the promo video on the moving dot", mark: "filled" as const },
    { title: "Add a purr when the dot moves in the video", mark: "empty" as const },
  ],
  brand: [
    "Change the brand color from red to blue",
    "Make the dot dart like prey, with short stops",
    "Add the swipe dot to the logo",
  ],
}

const made = (id: string, title: string, why: string, extra: Partial<Decision> = {}): Decision => ({
  id, project: "whiskr", part: "Marketing", title, why, status: "inf", owner: "MC", by: "Keller", tool: "Runway", when: "Today", ...extra,
})

// The cut follows the plan and Trevor's brand decisions: each line is from precedent, nothing to confirm.
export const FOLLOWS: Decision[] = [
  made("rw-len", "Cut the promo video to 15 seconds", "Follows your plan: cats lose interest fast."),
  made("rw-luna", "Open on Luna’s pounce at 0:42", "Follows your plan: a real cat explains the app in a second."),
  made("rw-blue", "Use blue for the title and end cards", "Follows Trevor’s decision: cats see blue best."),
  made("rw-dot", "End on the moving dot", "Follows your plan: the dot is the app."),
  made("rw-dart", "Make the dot dart like prey in the swipe shot", "Follows Trevor’s decision: all three cats pounced on the darting dot."),
  made("rw-logo", "Put the logo with the dot on the end card", "Follows Trevor’s decision: cats know the dot from the app."),
]
export const FOLLOW_LINKS: [string, string][] = [
  ["short", "rw-len"], ["pounce", "rw-luna"], ["nored", "rw-blue"], ["enddot", "rw-dot"], ["dart", "rw-dart"], ["dotbrand", "rw-logo"],
]
export const FOLLOWED_BY: Record<string, string> = { "rw-len": "MC", "rw-luna": "MC", "rw-blue": "TR", "rw-dot": "MC", "rw-dart": "TR", "rw-logo": "TR" }

// The tester's own touch: a guess until Keller says why.
export const ZOOM: Decision = made("rw-zoom", "Add a slow zoom on Luna’s pounce", "So the eye lands on Luna first.", {
  evidence: [{ kind: "chat", label: "Keller’s chat with Runway", detail: "“Add a slow zoom on Luna’s pounce in the opening shot, so the eye lands on her first.”" }],
})

// The video, once exported and shared to the Marketing thread.
export const exported = (zoom: boolean): Item => ({
  id: "w8", project: "whiskr", part: "Marketing", name: "Promo video", kind: "Video", owner: "MC", updated: "Today",
  decisions: FOLLOWS.length + (zoom ? 1 : 0), meta: "Runway · 15 s · 9:16 and 16:9",
  source: "Runway", where: "Whiskr promo", url: "https://runwayml.com",
})

export type Shot = { at: string; title: string; note: string }
export const SHOTS: Shot[] = [
  { at: "0:00", title: "Luna’s pounce", note: "Test clip, 0:42" },
  { at: "0:04", title: "Title card", note: "Blue, white type" },
  { at: "0:08", title: "The swipe card", note: "The dot darts, with stops" },
  { at: "0:13", title: "End card", note: "Blue, the logo with the dot" },
]

export type Turn = "setup" | "zoom" | "export" | "more"
// The reply follows the turn: the first line sets the cut up, a line about exporting or sharing
// ships it, anything else in between is the tester's own touch.
export function turnOf(text: string, i: number, hadZoom: boolean): Turn {
  if (i === 0) return "setup"
  if (/export|share|send/i.test(text)) return "export"
  return hadZoom ? "more" : "zoom"
}

export type Part =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "read" }
  | { kind: "follows" }
  | { kind: "zoom" }
  | { kind: "export" }

export function replyParts(turn: Turn): Part[] {
  if (turn === "setup") return [
    { kind: "read" },
    { kind: "text", text: "Set up from the plan: 15 seconds, four shots. Luna’s pounce from the test clip, a blue title card, the swipe card with the darting dot, and a blue end card with the logo." },
    { kind: "follows" },
    { kind: "text", muted: true, text: "Nothing in it is new. Say what to change, or export." },
  ]
  if (turn === "zoom") return [
    { kind: "text", text: "Added a slow push-in on Luna over the first four seconds. The rest of the cut is unchanged." },
    { kind: "zoom" },
  ]
  if (turn === "export") return [
    { kind: "export" },
    { kind: "text", text: "Exported in 9:16 and 16:9 and shared to Whiskr’s Marketing thread." },
  ]
  return [{ kind: "text", text: "Done. Anything else for the cut?" }]
}
