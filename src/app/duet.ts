import { SCENARIO } from "@/lib/scenario"
import { STAGE } from "@/lib/stage"
import { PRESET } from "@/scenarios/data"

// What each person's Duet did on their behalf. The Duet answers teammates only from its person's
// confirmed decisions (and the precedent they set); with nothing to answer from it says so and
// queues the question for its person. Today and the Duet panel read the same log.

export type DuetLine = {
  id: string
  // Whose Duet.
  owner: string
  // answered: told a teammate, from a decision. precedent: applied an earlier decision while the person
  // worked. asked: a teammate asked and no decision covered it, so the question waits for the person.
  kind: "answered" | "precedent" | "asked"
  // The teammate it spoke with (asked, answered) or the person themselves (precedent).
  who: string
  // What it said, applied or was asked, as a clause after "told Kelly" / "took" / "asked your Duet".
  text: string
  // A question in the teammate's own words, as they sent it. The reply window shows it as their message.
  message?: string
  // The decision it answered from or applied; for a question, the decision that would answer it.
  decision?: string
  project: string
  when: string
  day: "today" | "yesterday" | "earlier"
  // First shown at this stage of the Whiskr week (see lib/stage.ts). Unset: from the start.
  stage?: number
  // Where it was said, when not in Whyspace: "Slack · DM", "Slack · #marketing".
  where?: string
  // The thread an answer saved as a decision goes to. Unset: the thread of `decision`, else Marketing.
  part?: string
  // Someone else's decision the question touches. The Duet brings that owner in, with each decision and why.
  touches?: string
  // The decision an answer is saved as, when the answer's own words don't read as one.
  save?: string
  // How sure the Duet was of what it said or took (see sureOf). Unset: the usual level for its kind.
  sure?: Sure
}

// How sure your Duet was. sure: a decision says it outright. fairly: it applied a decision to a
// similar case. unsure: it stretched a decision to cover something further away.
export type Sure = "sure" | "fairly" | "unsure"
export const SURE_LEVELS: Sure[] = ["sure", "fairly", "unsure"]
export const SURE_LABEL: Record<Sure, string> = { sure: "Sure", fairly: "Fairly sure", unsure: "Not sure" }

// An answer comes from a decision that says it; taking a decision into your own work applies it to a new case.
export const sureOf = (l: DuetLine): Sure => l.sure ?? (l.kind === "precedent" ? "fairly" : "sure")

// A conversation the Duet started between two owners ("x-<clash>" or "a-<question>"): what the other
// owner says back, what to save as the decision both stand behind, and, optionally, the saved
// decision's id and the decisions to show on top.
export type TogetherScript = { reply: string; save: string; id?: string; decisions?: string[] }

const ALL: DuetLine[] = [
  { id: "du1", owner: "MC", kind: "answered", who: "KL", text: "the promo video opens on Luna's clip", decision: "pounce", project: "whiskr", when: "9:40", day: "today", stage: 4 },
  { id: "du2", owner: "MC", kind: "precedent", who: "MC", text: "blue for the promo title card, from Trevor's brand decision", decision: "bluecard", project: "whiskr", when: "10:12", day: "today", stage: 4 },
  { id: "du3", owner: "MC", kind: "asked", who: "TR", text: "how long the promo video will be", message: "How long will the promo video be?", decision: "short", project: "whiskr", when: "11:05", day: "today", stage: 4 },
  { id: "du10", owner: "MC", kind: "asked", who: "CH", text: "whether the posters go up before the video", message: "Do the posters go up before the video?", project: "whiskr", when: "12:40", day: "today", stage: 4 },
  { id: "du4", owner: "MC", kind: "answered", who: "JK", text: "the demo shows model failures next to the successes", decision: "deck", project: "studio", when: "16:20", day: "yesterday" },
  { id: "du5", owner: "TR", kind: "answered", who: "MC", text: "the brand is blue because cats can't see red", decision: "nored", project: "whiskr", when: "9:05", day: "today", stage: 3 },
  { id: "du6", owner: "TR", kind: "asked", who: "KL", text: "whether the posters keep the swipe dot", project: "whiskr", when: "14:30", day: "yesterday", stage: 3 },
  { id: "du7", owner: "KL", kind: "answered", who: "TR", text: "the dot purrs when it moves", decision: "purr", project: "whiskr", when: "10:50", day: "today", stage: 2 },
  { id: "du8", owner: "CH", kind: "asked", who: "MC", text: "whether the launch date moves", project: "whiskr", when: "8:30", day: "today" },
  { id: "du9", owner: "JK", kind: "answered", who: "MC", text: "the product is for students reviewing one lecture at a time", decision: "cram", project: "studio", when: "15:10", day: "yesterday" },
]

// Only in the example workspace, so the test scenarios stay as they were tested: an answer your
// Duet wasn't sure of.
const EXAMPLE: DuetLine[] = SCENARIO ? [] : [
  { id: "du20", owner: "MC", kind: "answered", who: "KL", text: "the app should open on a cat clip too, like the promo video", message: "Should the app open on a cat clip, like the promo video?", decision: "pounce", sure: "unsure", project: "whiskr", when: "11:30", day: "today", stage: 4 },
]

// The week plays out in stages; a line shows once its stage is reached. A test scenario
// (src/scenarios/data.ts) adds, patches and hides lines, and can show one before its stage.
const LINES = [...(PRESET.add?.duet ?? []), ...ALL, ...EXAMPLE]
  .filter((l) => !PRESET.hide?.includes(l.id))
  .map((l) => ({ ...l, ...PRESET.patch?.duet?.[l.id] }))
export const DUET_LOG: DuetLine[] = LINES.filter((l) => STAGE >= (l.stage ?? 1) || !!PRESET.showDuet?.includes(l.id))

export const duetOf = (owner: string) => DUET_LOG.filter((l) => l.owner === owner)

// Scripts for the conversations the Duet starts (see together.ts). A scenario adds its own.
export const TOGETHER: Record<string, TogetherScript> = {
  "x-redcard": { reply: "Cats see red as gray, so a red end card would disappear for them. Blue works for owners too.", save: "Make the end card blue, like the brand" },
  "x-s1-red": { reply: "Cats can’t see red, so the video should be blue throughout.", save: "Use blue as the brand color throughout", id: "s1-blue" },
  ...PRESET.together,
}
