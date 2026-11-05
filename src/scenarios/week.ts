import type { Decision } from "@/data"
import type { Preset } from "./data"

// Whiskr's week as scenarios 2 to 4 share it. Mon Oct 26: Trevor's second cat test, so brand
// guidelines v3 make the dot dart like prey. Tue Oct 27: Keller's promo video plan is confirmed
// (scenario 1's outcome, Trevor's blue taken), and Kelly updates the app (scenario 4). Wed Oct 28:
// Runway (scenario 2). Thu Oct 29: Keller's Duet (scenario 3). All of it starts from stage 5.

const brand = { project: "whiskr", part: "Brand", owner: "TR", by: "Trevor" } as const
const plan = { project: "whiskr", part: "Marketing", owner: "MC", by: "Keller", tool: "Claude" } as const

export const WEEK_DECISIONS = {
  // The decision dart replaced: added and hidden, so "What it replaced" still finds it.
  glide: { ...brand, id: "glide", title: "Move the dot in a smooth glide", status: "conf", when: "Oct 22", tool: "Figma", why: "Smooth motion is easy for a paw to follow." },
  dart: {
    ...brand, id: "dart", title: "Make the dot dart like prey, with short stops", status: "chg", when: "Mon Oct 26", tool: "User testing workshop",
    was: "Move the dot in a smooth glide",
    why: "In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.",
    replaces: "glide",
    evidence: [{ kind: "test", label: "Second cat test", detail: "Luna, Mochi and Biscuit · Mon Oct 26", artifact: "w3" }],
    visual: { before: "A smooth glide", after: "Short darts, with stops" },
  },
  enddot: { ...plan, id: "enddot", title: "End the promo video on the moving dot", status: "conf", when: "Tue Oct 27", why: "The dot is the app.", snippet: "End on the moving dot." },
  // Keller's one open guess in the plan: nothing he decided covers it.
  vpurr: { ...plan, id: "vpurr", title: "Add a purr when the dot moves in the video", status: "inf", when: "Tue Oct 27", snippet: "Add the purr when the dot moves." },
} satisfies Record<string, Decision>

export const WEEK: Preset = {
  deck: "w1",
  add: { decisions: Object.values(WEEK_DECISIONS) },
  patch: {
    decisions: {
      short: { status: "conf", when: "Tue Oct 27" },
      pounce: { title: "Start the promo video with Luna’s real clip", when: "Tue Oct 27" },
      bluecard: { when: "Tue Oct 27", why: "Follows Trevor’s decision: cats can’t see red." },
    },
    artifacts: {
      w1: { name: "Brand guidelines v3", version: "v3", updated: "Mon Oct 26", decisions: 3, meta: "Blue, the dot darts like prey, the dot in the logo · 20 frames" },
      w7: { updated: "Tue Oct 27", decisions: 5, meta: "From Claude · 15 seconds, 4 shots" },
    },
  },
  // redcard was settled on Tuesday (Keller took Trevor's blue); i3 asked him to confirm the length, done since.
  hide: ["glide", "redcard", "i3"],
  reach: {
    dart: [{ artifact: "w1", seen: ["TR", "CH"] }, { artifact: "w5", task: "t21", seen: ["TR"] }, { artifact: "w4", task: "t21", seen: ["TR"] }, { artifact: "w7", seen: ["MC"] }],
    enddot: [{ artifact: "w7", seen: ["MC"] }, { artifact: "w8", seen: ["MC"] }],
    vpurr: [{ artifact: "w7", seen: ["MC"] }],
  },
}

// One scenario's preset on top of the week: lists and patches add up, the rest replaces.
export function onWeek(p: Preset): Preset {
  const add = (k: keyof NonNullable<Preset["add"]>) => [...(p.add?.[k] ?? []), ...(WEEK.add?.[k] ?? [])]
  const patch = (k: keyof NonNullable<Preset["patch"]>) => {
    const a: Record<string, object> = WEEK.patch?.[k] ?? {}
    const b: Record<string, object> = p.patch?.[k] ?? {}
    return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((id) => [id, { ...a[id], ...b[id] }]))
  }
  return {
    ...WEEK,
    ...p,
    add: { decisions: add("decisions") as Decision[], tasks: add("tasks") as never, inbox: add("inbox") as never, artifacts: add("artifacts") as never, duet: add("duet") as never },
    patch: { decisions: patch("decisions"), tasks: patch("tasks"), inbox: patch("inbox"), artifacts: patch("artifacts"), duet: patch("duet") } as Preset["patch"],
    hide: [...(WEEK.hide ?? []), ...(p.hide ?? [])],
    links: [...(WEEK.links ?? []), ...(p.links ?? [])],
    reach: { ...WEEK.reach, ...p.reach },
  }
}
