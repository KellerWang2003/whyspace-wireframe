import type { Decision } from "@/data"

// Scenario 4's Claude Code: the prompt from Kelly's update task, the scripted run, and what it
// writes to Whyspace. Ids it points at come from scenario 4's data: t21 (the update task) and
// Trevor's decision dart.

export const TITLE = "kelly — whiskr-app — claude"
export const PROMPT = "Use the Whyspace MCP to read the decision “Make the dot dart like prey, with short stops” in Whiskr’s Brand thread. Then change the dot’s motion in the swipe card and the match screen: short darts and stops instead of a glide. Keep its size and the purr."
export const LINES = [PROMPT]
export const LABEL = "Say to Claude Code"
export const TASK = "t21"

export type RunLine = { kind: "tool" | "read" | "edit" | "note" | "done"; text: string; sub?: string }
export const RUN: RunLine[] = [
  { kind: "tool", text: "whyspace · read_decision(“Make the dot dart like prey, with short stops”)", sub: "Trevor · Monday · confirmed · replaces “Move the dot in a smooth glide”" },
  { kind: "read", text: "Read src/dot/motion.ts, src/screens/match-screen.tsx" },
  { kind: "edit", text: "Update src/dot/motion.ts", sub: "glide(1200 ms) → dart: three steps of 220 ms, 140 ms stops" },
  { kind: "edit", text: "Update src/screens/match-screen.tsx", sub: "Dot size 24 and the purr unchanged" },
  { kind: "tool", text: "whyspace · record_decision", sub: "Whiskr prototype · Make the dot dart in the swipe card and the match screen · follows Trevor’s decision" },
  { kind: "note", text: "Preview", sub: "http://localhost:5173/match" },
  { kind: "done", text: "The dot darts with short stops on the swipe card and the match screen. Size and purr unchanged." },
]
// The run writes its decision when it reaches this line (1-based).
export const RECORD_AT = 5
export const LATER_REPLY = "Nothing else to change for that decision. The swipe card and the match screen both dart now."
export const DONE_TOAST = "Whyspace · the prototype follows Trevor’s decision now"

// What the update recorded: it follows Trevor's decision, so it reads ◉ and asks nothing.
export const FOLLOW: Decision = {
  id: "kc-dart", project: "whiskr", part: "App", title: "Make the dot dart in the swipe card and the match screen",
  why: "Follows Trevor’s decision: in the second cat test, all three cats pounced on the darting dot.",
  status: "inf", owner: "KL", by: "Kelly", tool: "Claude Code", when: "Today",
}
export const FOLLOW_LINKS: [string, string][] = [["dart", "kc-dart"]]
