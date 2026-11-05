import type { InboxItem, Task } from "@/data"
import type { Preset } from "../data"
import { PROMPT } from "../tools/claude-code-script"
import { onWeek } from "../week"

// Scenario 4: Kelly, Tuesday Oct 27. On Monday Trevor's second cat test changed the dot's motion
// from a glide to short darts. Her prototype and app design follow the old rule, so Whyspace made
// her an update task. She reads the why and pastes the task's prompt into Claude Code.

export const S4_TASK: Task = {
  id: "t21",
  title: "Change the dot’s motion from a glide to short darts",
  project: "Whiskr (Demo project)",
  part: "App",
  owner: "KL",
  due: "Wed Oct 28",
  status: "todo",
  priority: "high",
  decision: "dart",
  tool: "Claude Code",
  prompt: PROMPT,
  description: "Your prototype and app design follow a decision Trevor replaced on Monday.",
  related: { decisions: ["dart"], artifacts: ["w5", "w4", "w1"] },
}

const S4_ITEM: InboxItem = {
  id: "i21",
  need: "do",
  task: "t21",
  to: ["KL"],
  kind: "change",
  from: "TR",
  project: "Whiskr (Demo project)",
  decision: "dart",
  summary: "Trevor changed the dot’s motion: short darts instead of a glide",
  touches: "Your prototype and app design",
  time: "1d",
  unread: true,
  body: "In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.",
  author: { kind: "ai", name: "Whyspace AI" },
  source: "Trevor’s brand update",
  relatedArtifacts: [
    { id: "w1", context: "Brand guidelines v3 · the dot darts" },
    { id: "w5", context: "Whiskr prototype · the dot still glides" },
  ],
}

export const S4: Preset = onWeek({
  add: { tasks: [S4_TASK], inbox: [S4_ITEM] },
  // Kelly's Today holds only the update Whyspace made; the rest of her work stays in the projects.
  today: [S4_TASK.id],
  patch: {
    artifacts: {
      w5: { updated: "Oct 22", meta: "localhost:5173 · swipe card, the dot glides" },
      w4: { meta: "Swipe card with the gliding dot · 24 frames" },
      w7: { updated: "Today" },
    },
  },
  // Wednesday's video and Thursday's questions haven't happened yet.
  hide: ["w8", "du10"],
  activity: [
    { project: "whiskr", who: "MC", tool: "Claude", aiDoing: "Planning the promo video", artifact: "w7", doing: "Promo video", part: "Marketing", since: "9:04", state: "active" },
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Reading up on what cats see", artifact: "w2", doing: "Cat research", part: "Brand", since: "10:20", state: "active" },
    { project: "whiskr", who: "KL", doing: "Swipe card", part: "App", since: "Yesterday", state: "idle" },
    { project: "whiskr", who: "CH", doing: "Read the week’s decisions", part: "Brand", since: "Yesterday", state: "idle" },
  ],
  week: { whiskr: "Monday: after the second cat test, Trevor made the dot dart like prey instead of gliding. Your prototype and app design still glide." },
})
