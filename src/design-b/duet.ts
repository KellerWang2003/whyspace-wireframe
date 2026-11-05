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
  // The decision it answered from or applied; for a question, the decision that would answer it.
  decision?: string
  project: string
  when: string
  day: "today" | "yesterday" | "earlier"
  // First shown at this stage of the Whiskr week (see lib/stage.ts). Unset: from the start.
  stage?: number
}

const ALL: DuetLine[] = [
  { id: "du1", owner: "MC", kind: "answered", who: "KL", text: "the promo video opens on Luna's clip", decision: "pounce", project: "whiskr", when: "9:40", day: "today", stage: 4 },
  { id: "du2", owner: "MC", kind: "precedent", who: "MC", text: "blue for the promo title card, from Trevor's brand decision", decision: "bluecard", project: "whiskr", when: "10:12", day: "today", stage: 4 },
  { id: "du3", owner: "MC", kind: "asked", who: "TR", text: "how long the promo video will be", decision: "short", project: "whiskr", when: "11:05", day: "today", stage: 4 },
  { id: "du10", owner: "MC", kind: "asked", who: "CH", text: "whether the posters go up before the video", project: "whiskr", when: "12:40", day: "today", stage: 4 },
  { id: "du4", owner: "MC", kind: "answered", who: "JK", text: "the demo shows model failures next to the successes", decision: "deck", project: "studio", when: "16:20", day: "yesterday" },
  { id: "du5", owner: "TR", kind: "answered", who: "MC", text: "the brand is blue because cats can't see red", decision: "nored", project: "whiskr", when: "9:05", day: "today", stage: 3 },
  { id: "du6", owner: "TR", kind: "asked", who: "KL", text: "whether the posters keep the swipe dot", project: "whiskr", when: "14:30", day: "yesterday", stage: 3 },
  { id: "du7", owner: "KL", kind: "answered", who: "TR", text: "the dot purrs when it moves", decision: "purr", project: "whiskr", when: "10:50", day: "today", stage: 2 },
  { id: "du8", owner: "CH", kind: "asked", who: "MC", text: "whether the launch date moves", project: "whiskr", when: "8:30", day: "today" },
  { id: "du9", owner: "JK", kind: "answered", who: "MC", text: "the product is for students reviewing one lecture at a time", decision: "cram", project: "studio", when: "15:10", day: "yesterday" },
]

// The week plays out in stages; a line shows once its stage is reached. A test scenario
// (src/scenarios/data.ts) adds, patches and hides lines, and can show one before its stage.
const LINES = [...(PRESET.add?.duet ?? []), ...ALL]
  .filter((l) => !PRESET.hide?.includes(l.id))
  .map((l) => ({ ...l, ...PRESET.patch?.duet?.[l.id] }))
export const DUET_LOG: DuetLine[] = LINES.filter((l) => STAGE >= (l.stage ?? 1) || !!PRESET.showDuet?.includes(l.id))

export const duetOf = (owner: string) => DUET_LOG.filter((l) => l.owner === owner)
