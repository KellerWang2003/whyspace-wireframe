import type { Preset } from "../data"
import { FOLLOWS, FOLLOW_LINKS, STAR } from "../tools/runway-script"
import { onWeek } from "../week"

// Scenario 3: Keller, Thursday Oct 29. The video went out of Runway yesterday. Overnight two
// teammates asked his Duet things none of his decisions covers: Kelly wants the video's exact blue
// to match the app prototype, Christine wants to know how many more days the video needs. He also
// asks his Duet what changed in the app.

export const S3_LINES = [
  "#2F6BFF. It’s the blue on the title and end cards.",
  "Three more days. The sound still needs to go in.",
  "What changed in the app this week?",
]
export const S3_LABELS = ["Say to Kelly", "Say to Christine", "Ask your Duet"]

const yesterday = { when: "Wed Oct 28" }

export const S3: Preset = onWeek({
  // What Runway recorded yesterday: the cut follows the plan and Trevor's brand, and Luna as the main character is confirmed.
  add: {
    decisions: [...FOLLOWS.map((d) => ({ ...d, ...yesterday })), { ...STAR, ...yesterday, status: "conf", why: "Luna looks the best on camera." }],
    duet: [
      { id: "du11", owner: "MC", kind: "asked", who: "KL", text: "for the exact hex of the blue in the promo video, to match the app prototype", project: "whiskr", when: "17:40", day: "yesterday" },
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
      du10: { text: "how many more days the video needs, to push the launch back a little", when: "8:30", day: "today" },
    },
  },
  // Jordan's studio line is another project: it only distracts here.
  hide: ["i1", "du4"],
  week: { whiskr: "The video is out of Runway, following the blue brand. Your posters are still red." },
  answers: [{
    words: ["changed", "app"],
    text: "Two changes reached the app, both from Trevor: the brand went from red to blue, and on Monday the dot started darting like prey. Kelly updated the app for both. Both are confirmed, and nothing in the App thread waits on you.",
    refs: ["nored", "dart"],
  }],
})
