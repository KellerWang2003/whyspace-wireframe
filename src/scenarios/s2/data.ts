import type { Task } from "@/data"
import type { Preset } from "../data"
import { PROMPT } from "../tools/runway-script"
import { onWeek } from "../week"

// Scenario 2: Keller, Wednesday Oct 28. Yesterday's plan is confirmed and Trevor's brand guidelines
// v3 are in Artifacts. He looks at the deck, opens the task and makes the video in Runway.

export const S2_TASK: Task = {
  id: "t20",
  title: "Make the promo video",
  project: "Whiskr (Demo project)",
  part: "Marketing",
  owner: "MC",
  due: "Wed Oct 28",
  status: "todo",
  priority: "high",
  decision: "short",
  tool: "Runway",
  prompt: PROMPT,
  description: "The 15-second launch cut, from yesterday’s plan and Trevor’s brand guidelines.",
  related: { decisions: ["short", "pounce", "enddot", "dart"], artifacts: ["w1", "w7", "w3"] },
}

export const S2: Preset = onWeek({
  add: { tasks: [S2_TASK] },
  // Keller's Today holds only the video; the rest of his work stays in the projects.
  today: [S2_TASK.id],
  patch: {
    tasks: { t2: { title: "Plan the promo video", status: "done", due: "Tue Oct 27" } },
    duet: {
      du1: { day: "yesterday" },
      du2: { day: "yesterday" },
      du3: { kind: "answered", text: "the promo video is 15 seconds", when: "9:40", day: "yesterday" },
    },
  },
  // The video doesn't exist until Runway exports it; Christine's ask belongs to Thursday; the
  // posters update waits behind the video.
  hide: ["w8", "du10", "i1"],
  week: { whiskr: "Trevor changed the brand guidelines on Monday. Your plan is confirmed; the video is next." },
})
