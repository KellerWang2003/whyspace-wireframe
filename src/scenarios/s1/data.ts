import type { Decision, Task } from "@/data"
import type { Item } from "@/design-b/work"
import type { Preset } from "../data"

// Scenario 1: Keller, Tuesday Oct 27, plans the promo video with Claude. Whiskr stands at stage 3
// (the brand is blue since Monday, the posters are still red, nothing on the video yet).

export const S1_PROMPT = "Use the Whyspace MCP to pull up everything Whiskr has on the promo video: the Marketing thread, its decisions and its attachments. Then help me plan it."

export const S1_TASK: Task = {
  id: "s1-plan",
  title: "Plan the promo video",
  project: "Whiskr (Demo project)",
  part: "Marketing",
  owner: "MC",
  due: "Tue Oct 27",
  status: "todo",
  priority: "high",
  tool: "Claude",
  prompt: S1_PROMPT,
  description: "The launch video, for reels and the site. Trevor and Kelly build on the plan.",
  related: { decisions: ["nored", "move"], artifacts: ["w1", "w3"] },
}


const base = { project: "whiskr", part: "Marketing", owner: "MC", by: "Keller", tool: "Claude", when: "Today" } as const

// What Claude records as the tester talks, in the order of the turns. "short" keeps the real id, so
// Trevor's question (du3) is answered the moment it is confirmed.
export const S1_DECISIONS = {
  len: { ...base, id: "short", title: "Make the promo video 15 seconds", status: "inf", snippet: "Make it 15 seconds.", evidence: [{ kind: "chat", label: "Keller's chat with Claude", detail: "\"Make it 15 seconds.\"" }] },
  red: { ...base, id: "s1-red", title: "Use red as the brand color throughout", status: "flag", clashes: "nored", snippet: "Use red, our brand color, throughout.", evidence: [{ kind: "chat", label: "Keller's chat with Claude", detail: "\"Use red, our brand color, throughout.\"" }] },
  blue: { ...base, id: "s1-blue", title: "Use blue as the brand color throughout", status: "inf", why: "Follows Trevor’s decision: cats can’t see red.", snippet: "Blue throughout, then." },
  luna: { ...base, id: "s1-luna", title: "Start the promo video with Luna’s real clip", status: "inf", snippet: "Open on Luna’s real clip from the cat test.", evidence: [{ kind: "clip", label: "Luna pounces · 0:42", artifact: "w3" }] },
  dot: { ...base, id: "s1-dot", title: "End the promo video on the moving dot", status: "inf", snippet: "End on the moving dot.", evidence: [{ kind: "chat", label: "Keller's chat with Claude", detail: "\"End on the moving dot.\"" }] },
} satisfies Record<string, Decision>

// The tester's words, as chips for a one-tap why in the check.
export const S1_HINTS: Record<string, string[]> = {
  short: ["Cats lose interest fast", "Fits a reel"],
  "s1-luna": ["Shows the idea in the first second", "Real footage feels honest"],
  "s1-dot": ["The dot is the app", "Ends where the swipe starts"],
}

// The tester's lines to Claude, in order. The first is also on the task (Copy prompt). The reply
// follows the turn, not the words, so a tester who paraphrases still gets the same scenario.
export const S1_LINES = [
  S1_PROMPT,
  "Make it 15 seconds, and use red, our brand color, throughout.",
  "Go on: open on Luna’s real clip from the cat test, end on the moving dot.",
  "Save the plan to our Drive and share it with the team.",
]

// What Claude reads from the Marketing thread before it plans.
export const S1_THREAD = {
  intent: "Get cat owners to download Whiskr at launch.",
  decisions: [
    { title: "Make things move to get cats’ attention", who: "TR", when: "Oct 22" },
    { title: "Add a purring sound to the dot", who: "KL", when: "Oct 22" },
    { title: "Change the brand color from red to blue", who: "TR", when: "Oct 23" },
  ],
  attachments: ["Brand guidelines", "Cat test videos"],
}

// The plan, once shared: a Google Doc on the Marketing thread's shelf.
export const S1_ARTIFACT: Item = {
  id: "s1-plan-doc",
  project: "whiskr",
  part: "Marketing",
  name: "Promo video plan",
  kind: "Doc",
  owner: "MC",
  updated: "Just now",
  decisions: 4,
  meta: "From Claude · 15 seconds, 3 shots",
  content: { heading: "Promo video plan", paragraphs: ["0–4 s: Luna’s real pounce from the cat test.", "4–12 s: the swipe, then the moving dot.", "12–15 s: title card and end card in the brand blue."] },
  source: "Google Drive",
  where: "Whiskr promo",
}

// Whiskr's data on Tuesday morning: the task, Trevor's question to Keller's Duet (du3 shows before
// its stage), and nothing that tells Keller the brand is blue before he says red. Trevor's
// posters task (t1) and its Today row (i1) would give the clash away, and the week's line too.
export const S1: Preset = {
  add: { tasks: [S1_TASK] },
  hide: ["t1", "i1"],
  showDuet: ["du3"],
  // Keller's Today holds only the promo plan; the rest of his work stays in the projects.
  today: [S1_TASK.id],
  week: { whiskr: "The first cat test is in. The promo video is next." },
}
