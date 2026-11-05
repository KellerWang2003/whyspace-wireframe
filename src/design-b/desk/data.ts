import type { Caught } from "@/screens/overlay-model"
import type { Where } from "@/screens/desktop-overlay"

// The Desk for Design B: three days of Whiskr's promo video on three people's desktops, in the apps
// they work in. Six scenes. The Whyspace pieces are real: the pill, the check that follows a share,
// and the card where the work lands. Each scene holds what the person at the keyboard has decided
// (`mine`, which the pill owns) and what teammates already decided in the same work (`others`).

export type App = "claude" | "docs" | "slack" | "figma"

export type Scene = {
  id: number
  day: string
  time: string
  // Who is at the keyboard (an id in PEOPLE).
  viewer: string
  app: App
  title: string
  where: Where
  // The piece of work the card belongs to.
  work: string
  // The viewer's own decisions in this session, as the pill holds them.
  mine: Caught[]
  // Teammates' decisions already in the work; the card lists them with yours.
  others?: Caught[]
  // Opens with the check: the work was shared a moment ago.
  share?: boolean
}

const M: Where = { project: "whiskr", part: "Marketing" }
const A: Where = { project: "whiskr", part: "App" }

// Keller's decisions in the promo video plan, Monday morning with Claude.
const LEN: Caught = { id: "d1", title: "Make the promo video 15 seconds", kind: "guess", hints: ["Cats lose interest fast", "Fits a reel"], source: "Claude · Promo video plan · 10:12", owner: "MC", ...M }
const LUNA: Caught = { id: "d2", title: "Start the promo video with Luna’s real clip", kind: "guess", hints: ["Shows the idea in the first second", "Real footage feels honest"], source: "Claude · Promo video plan · 10:14", owner: "MC", ...M }
const BLUE: Caught = { id: "d3", title: "Use blue for the title card", kind: "prec", why: "Follows Trevor’s brand decision", source: "Claude · Promo video plan · 10:16", owner: "MC", ...M }
const PURR: Caught = { id: "d4", title: "Add a purr when the dot moves in the video", kind: "guess", hints: ["The dot purrs in the app"], source: "Claude · Promo video plan · 10:19", owner: "MC", ...M }
const RED: Caught = { id: "d5", title: "Make the end card red, like the old logo", kind: "clash", clashes: "nored", taken: "Make the end card blue, like the brand", source: "Claude · Promo video plan · 10:21", owner: "MC", ...M }
// Tuesday's rework adds one guess.
const CAPTIONS: Caught = { id: "d6", title: "Burn the captions into the video", kind: "guess", hints: ["Most people watch muted"], source: "Docs · Promo video plan · 9:10", owner: "MC", ...M }

export const MONDAY: Caught[] = [LEN, LUNA, BLUE, PURR, RED]
// After round one (Mon 10:30): two confirmed at the check, the purr left a guess, the clash untouched.
export const ROUND1: Caught[] = [
  { ...LEN, kind: "conf", why: "Cats lose interest fast" },
  { ...LUNA, kind: "conf", why: "Shows the idea in the first second" },
  BLUE,
  { ...PURR, checked: true },
  RED,
]
// After round two (Tue 9:15): captions confirmed, Trevor's blue taken for the end card.
export const ROUND2: Caught[] = [
  ROUND1[0],
  ROUND1[1],
  BLUE,
  { ...PURR, checked: true },
  { ...RED, kind: "prec", title: RED.taken!, why: "Follows Trevor’s decision", clashes: undefined },
  { ...CAPTIONS, kind: "conf", why: "Most people watch muted" },
]

// Kelly's decisions while cutting the video, Tuesday with Claude.
const POUNCE: Caught = { id: "k1", title: "Open on the pounce at 0:42, not the whole clip", kind: "guess", hints: ["It’s the one shot that explains the app"], source: "Claude · Promo cut · 10:52", owner: "KL", ...M }
const EXPORT: Caught = { id: "k2", title: "Export 9:16 for reels and 16:9 for the site", kind: "guess", hints: ["Where the ads run"], source: "Claude · Promo cut · 10:55", owner: "KL", ...M }

// Kelly's decisions in the match screen, Wednesday in Figma.
const APP_PURR: Caught = { id: "a1", title: "The dot purrs when it moves", kind: "prec", why: "From your decision, Oct 22", source: "Figma · App design · 14:35", owner: "KL", ...A }
const SWIPE: Caught = { id: "a2", title: "Swipe right is a match, left is a pass", kind: "guess", hints: ["Every swipe app does it this way"], source: "Figma · App design · 14:40", owner: "KL", ...A }
const TWO_SECONDS: Caught = { id: "a3", title: "Show the match screen for two seconds, then go back", kind: "guess", hints: ["Cats don’t read", "Keeps the loop going"], source: "Figma · App design · 14:48", owner: "KL", ...A }
const BIG_DOT: Caught = { id: "a4", title: "Make the dot bigger on the match screen", kind: "conf", why: "Cats track big, slow things", source: "Figma · App design · 14:52", owner: "KL", ...A }

export const SCENES: Scene[] = [
  { id: 1, day: "Mon", time: "10:08", viewer: "MC", app: "claude", title: "Keller plans the promo video with Claude", where: M, work: "Promo video plan", mine: MONDAY },
  { id: 2, day: "Mon", time: "10:30", viewer: "MC", app: "docs", title: "Keller shares the plan: the check", where: M, work: "Promo video plan", mine: MONDAY, share: true },
  { id: 3, day: "Mon", time: "14:00", viewer: "CH", app: "slack", title: "Christine reads the card and asks Keller’s Duet", where: M, work: "Promo video plan", mine: [], others: ROUND1 },
  { id: 4, day: "Tue", time: "9:15", viewer: "MC", app: "docs", title: "Keller shares it again: only what changed", where: M, work: "Promo video plan", mine: [...ROUND1, CAPTIONS], share: true },
  { id: 5, day: "Tue", time: "11:00", viewer: "KL", app: "claude", title: "Kelly’s Claude reads the plan before the cut", where: M, work: "Promo video plan", mine: [POUNCE, EXPORT], others: ROUND2 },
  { id: 6, day: "Wed", time: "15:00", viewer: "KL", app: "figma", title: "Kelly marks the match screen ready for dev", where: A, work: "App design", mine: [APP_PURR, SWIPE, TWO_SECONDS, BIG_DOT], share: true },
]

// Slack, Monday afternoon: #marketing, where the share landed, and Christine's DM with Keller's Duet.
export type SlackMsg = { who: string; time: string; text: string; link?: string; card?: boolean; duet?: boolean; decision?: Caught }
export const CHANNEL: SlackMsg[] = [
  { who: "TR", time: "9:05", text: "Brand guidelines are updated: blue everywhere, posters too." },
  { who: "MC", time: "10:31", text: "Promo video plan is in Drive.", link: "docs.google.com/document/d/1f…", card: true },
]
export const DM: SlackMsg[] = [
  { who: "CH", time: "13:52", text: "Is the video still opening on a real cat?" },
  { who: "MC", duet: true, time: "13:52", text: "Yes. Keller confirmed it this morning.", decision: ROUND1[1] },
  { who: "CH", time: "13:55", text: "Do the posters go up before the video?" },
  { who: "MC", duet: true, time: "13:55", text: "No decision of Keller’s covers that. I’ve asked him; you’ll hear back here." },
]

// What Claude read from the Marketing thread over MCP before it planned (ids in DECISIONS).
export const READ_THREAD = ["nored", "purr", "move"]
