import type { Preset } from "../data"
import { FOLLOWS, FOLLOW_LINKS, ZOOM } from "../tools/runway-script"
import { onWeek } from "../week"

// Scenario 3: Keller, Thursday Oct 29. The video went out of Runway yesterday. Overnight two
// teammates asked his Duet things: Christine asked something none of his decisions covers, Kelly
// asked about the purr, which is still his guess. He also asks his Duet what changed in the app.

export const S3_LINES = [
  "Yes. The posters go up on Monday, the video follows on launch day.",
  "What changed in the app this week?",
]
export const S3_LABELS = ["Say to Christine", "Ask your Duet"]

const yesterday = { when: "Wed Oct 28" }

export const S3: Preset = onWeek({
  // What Runway recorded yesterday: the cut follows the plan and Trevor's brand, and the zoom is confirmed.
  add: {
    decisions: [...FOLLOWS.map((d) => ({ ...d, ...yesterday })), { ...ZOOM, ...yesterday, status: "conf", why: "So the eye lands on Luna first." }],
    duet: [
      { id: "du11", owner: "MC", kind: "asked", who: "KL", text: "whether the video uses the dot’s purr", decision: "vpurr", project: "whiskr", when: "17:40", day: "yesterday" },
      { id: "du12", owner: "MC", kind: "answered", who: "CH", text: "the video is blue, following Trevor’s decision", decision: "bluecard", project: "whiskr", when: "14:20", day: "yesterday" },
    ],
  },
  links: FOLLOW_LINKS,
  patch: {
    tasks: {
      t2: { title: "Plan the promo video", status: "done", due: "Tue Oct 27" },
    },
    artifacts: {
      w8: { updated: "Yesterday", decisions: 7, meta: "Runway · 15 s · 9:16 and 16:9" },
    },
    duet: {
      du1: { day: "earlier" },
      du2: { day: "earlier" },
      du3: { kind: "answered", text: "the promo video is 15 seconds", when: "9:40", day: "earlier" },
      du10: { when: "8:30", day: "today" },
    },
  },
  hide: ["i1"],
  week: { whiskr: "The video is out of Runway, following the blue brand. Your posters are still red." },
  answers: [{
    words: ["changed", "app"],
    text: "Two changes reached the app, both from Trevor: the brand went from red to blue, and on Monday the dot started darting like prey. Kelly updated the app for both. Both are confirmed, and nothing in the App thread waits on you.",
    refs: ["nored", "dart"],
  }],
})
