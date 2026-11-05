// Design C mock content: a generic six-person product team ("Launch") shipping a new onboarding flow
// and pricing page. Each person works in their own AI tool and shares through Drive, Figma, Slack and
// GitHub. The week plays out as numbered scenes; the debug panel and the Desk step through them.
// Whiskr stays Design A and B's showcase; this team is for testing how real teams would use Design C.

export type PersonC = { id: string; name: string; role: string; ai: string; away?: number[] }

export const PEOPLE_C: Record<string, PersonC> = {
  maya: { id: "maya", name: "Maya", role: "Product", ai: "ChatGPT" },
  jonas: { id: "jonas", name: "Jonas", role: "Design", ai: "Figma, Claude" },
  priya: { id: "priya", name: "Priya", role: "Frontend", ai: "Cursor" },
  tom: { id: "tom", name: "Tom", role: "Backend", ai: "Claude Code" },
  lena: { id: "lena", name: "Lena", role: "Marketing", ai: "ChatGPT" },
  sam: { id: "sam", name: "Sam", role: "Research", ai: "Claude", away: [6, 7] },
}
export const VIEWERS_C = Object.keys(PEOPLE_C)

export type ProjectC = { id: string; name: string; members: string[] }
export const PROJECTS_C: ProjectC[] = [
  { id: "launch", name: "Launch", members: VIEWERS_C },
  { id: "site", name: "Website refresh", members: ["maya", "jonas", "lena"] },
]

export type ThreadC = { id: string; project: string; name: string; intent: string; color: string }
export const THREADS_C: ThreadC[] = [
  { id: "onboarding", project: "launch", name: "Onboarding", intent: "A new user reaches their first match in under two minutes.", color: "#4a8fd6" },
  { id: "pricing", project: "launch", name: "Pricing", intent: "One plan people understand in five seconds, priced from the study.", color: "#dcae3c" },
  { id: "comms", project: "launch", name: "Launch comms", intent: "Say one thing everywhere: start in two minutes.", color: "#e0805f" },
  { id: "api", project: "launch", name: "API", intent: "The app never waits on the API. Every call under 200 ms.", color: "#5fab78" },
  { id: "research", project: "launch", name: "Research", intent: "Every number we quote comes from a test with real users.", color: "#9a7fd1" },
  { id: "home", project: "site", name: "Homepage", intent: "A visitor knows what we do and why it matters in ten seconds.", color: "#c96b8a" },
  { id: "cases", project: "site", name: "Case studies", intent: "Every claim on the site points at a customer who said it.", color: "#5b9aa0" },
]

// Where work gets shared, which is where Whyspace meets it.
export type Where = "docs" | "sheets" | "figma" | "slack" | "github" | "notion" | "meet"
export const WHERE_LABEL: Record<Where, string> = { docs: "Google Docs", sheets: "Google Sheets", figma: "Figma", slack: "Slack", github: "GitHub", notion: "Notion", meet: "Meet" }

// A call is one decision inside a piece of work.
//   backed: a person stands behind it and said why
//   precedent: pre-filled by the person's own earlier call (their Duet), so it cost nothing
//   follows: matches a teammate's backed call; the sender took it rather than deciding again
//   guess: the AI wrote it and nobody checked
//   clash: contradicts a teammate's backed call; the sender takes theirs or talks
export type CallState = "backed" | "precedent" | "follows" | "guess" | "clash"
export type Call = {
  id: string
  text: string
  state: CallState
  why?: string
  // precedent: the person's earlier call; follows: whose call it follows; clash: the call it contradicts.
  // project: when the other call lives in another project.
  ref?: { call: string; who: string; when: string; project?: string }
  // A guess that people or their agents built on. From scene `at`, it comes back to its sender once.
  builtOn?: { by: { who: string; agent?: boolean }[]; at: number }
  // Why suggestions the check offers for this call.
  hints?: string[]
  // The talk a clash led to, in the story.
  talk?: string
  // How the story resolved a clash at the sender's check: took the other's call, or talked.
  resolved?: "took" | "talk"
}

export type Handoff = {
  id: string
  project: string
  thread: string
  from: string
  to: string[]
  title: string
  where: Where
  // Tool the work was made with, when it is not the place it was shared.
  tool?: string
  // Scene in which the share happens; the sender's check happens in the same scene.
  at: number
  day: string
  time: string
  calls: Call[]
  // Where the receivers saw the card.
  landed: string
  // Scene in which this work reaches customers; guesses still in it surface once to the sender.
  shipsAt?: number
  // Who read the card, person or their agent, and from which scene. Shown as faces on the card.
  readers?: { who: string; agent?: boolean; at: number }[]
}

// The week's scenes. Scene 0 is history (before the week).
export type Scene = {
  id: number
  day: string
  time: string
  // Who is at the keyboard in the Desk.
  viewer: string
  app: "meet" | "docs" | "sheets" | "slack" | "claude" | "github" | "figma"
  title: string
  handoff?: string
  talk?: string
}

export const SCENES: Scene[] = [
  { id: 1, day: "Mon", time: "9:30", viewer: "maya", app: "meet", title: "Kickoff", talk: "kickoff" },
  { id: 2, day: "Mon", time: "11:00", viewer: "sam", app: "sheets", title: "Sam shares the pricing study", handoff: "study" },
  { id: 3, day: "Tue", time: "10:12", viewer: "maya", app: "docs", title: "Maya shares PRD v2", handoff: "prd" },
  { id: 4, day: "Tue", time: "14:00", viewer: "jonas", app: "claude", title: "Jonas reads it in Slack, then Claude", handoff: "prd" },
  { id: 5, day: "Tue", time: "16:30", viewer: "tom", app: "github", title: "Tom opens the API pull request", handoff: "api" },
  { id: 6, day: "Wed", time: "9:40", viewer: "lena", app: "slack", title: "Lena asks Sam's Duet, then shares the launch email", handoff: "email" },
  { id: 7, day: "Wed", time: "15:00", viewer: "jonas", app: "figma", title: "Jonas marks the screens ready for dev", handoff: "screens" },
  { id: 8, day: "Thu", time: "10:00", viewer: "maya", app: "meet", title: "The talk about onboarding steps", talk: "steps" },
  { id: 9, day: "Thu", time: "16:00", viewer: "priya", app: "github", title: "Priya opens the empty states pull request", handoff: "empty" },
  { id: 10, day: "Fri", time: "11:00", viewer: "maya", app: "meet", title: "Weekly sync", talk: "sync" },
]

export const DAY_NAME: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" }

export const HANDOFFS: Handoff[] = [
  {
    id: "brief", project: "launch", thread: "pricing", from: "maya", to: ["sam"], title: "Pricing brief", where: "docs", tool: "ChatGPT",
    at: 0, day: "Oct 21", time: "", landed: "#launch", readers: [{ who: "sam", at: 0 }],
    calls: [
      { id: "brief-12", text: "$12 a month", state: "backed", why: "Our cost floor plus the margin we need. Test it." },
      { id: "brief-15", text: "Test $12 against $15", state: "backed", why: "If $15 holds, we take it." },
      { id: "brief-free", text: "No free tier", state: "backed", why: "Free users never converted in the last product." },
    ],
  },
  {
    id: "study", project: "launch", thread: "pricing", from: "sam", to: ["maya"], title: "Pricing study", where: "sheets", tool: "Claude",
    at: 2, day: "Mon", time: "11:00", landed: "#launch", readers: [{ who: "maya", at: 2 }, { who: "tom", agent: true, at: 3 }],
    calls: [
      { id: "study-12", text: "$12 a month", state: "backed", why: "62% of 40 people picked it over $15.", hints: ["62% picked it over $15", "Matches Maya's brief"] },
      { id: "study-annual", text: "20% off the annual plan", state: "backed", why: "Annual buyers expected a discount. 20% was the median.", hints: ["20% was the median people expected"] },
      { id: "study-trial", text: "14-day trial", state: "guess", hints: ["The study tested it"] },
    ],
  },
  {
    id: "prd", project: "launch", thread: "onboarding", from: "maya", to: ["jonas", "tom"], title: "PRD v2", where: "docs", tool: "ChatGPT",
    at: 3, day: "Tue", time: "10:12", landed: "#launch", readers: [{ who: "jonas", agent: true, at: 4 }, { who: "tom", agent: true, at: 5 }, { who: "priya", agent: true, at: 9 }],
    calls: [
      { id: "prd-steps", text: "3 onboarding steps", state: "backed", why: "Activation is this quarter's goal.", hints: ["Activation is this quarter's goal", "Fewer drop-offs in the last test"] },
      { id: "prd-12", text: "$12 a month", state: "precedent", why: "Our cost floor plus the margin we need. Sam's study agreed.", ref: { call: "brief-12", who: "maya", when: "Oct 21" } },
      { id: "prd-trial", text: "14-day trial", state: "backed", why: "Long enough to see a second match.", hints: ["Long enough to see a second match", "Matches the study"] },
      { id: "prd-email", text: "Email verification required", state: "guess", hints: ["Stops fake sign-ups", "Needed for billing"] },
      { id: "prd-button", text: "Button says \"Start free trial\"", state: "guess", hints: ["Says what happens next"], builtOn: { by: [{ who: "jonas", agent: true }, { who: "priya", agent: true }], at: 10 } },
      { id: "prd-plans", text: "Plans named Solo and Together", state: "guess", hints: ["Says who each plan is for"] },
    ],
  },
  {
    id: "api", project: "launch", thread: "api", from: "tom", to: ["priya"], title: "API v1", where: "github", tool: "Claude Code",
    at: 5, day: "Tue", time: "16:30", landed: "PR #412", readers: [{ who: "priya", agent: true, at: 9 }],
    calls: [
      { id: "api-one", text: "One call returns the whole onboarding state", state: "backed", why: "The app never waits. Under 200 ms.", hints: ["The app never waits", "One round trip on a slow phone"] },
      { id: "api-steps", text: "Step count fixed at 5", state: "clash", ref: { call: "prd-steps", who: "maya", when: "Tue" }, resolved: "took", hints: [] },
      { id: "api-12", text: "$12 in the plans table", state: "follows", ref: { call: "study-12", who: "sam", when: "Mon" } },
      { id: "api-trial", text: "Trial length is a config value, 14 days", state: "follows", ref: { call: "prd-trial", who: "maya", when: "Tue" } },
    ],
  },
  {
    id: "email", project: "launch", thread: "comms", from: "lena", to: ["maya"], title: "Launch email v1", where: "docs", tool: "ChatGPT",
    at: 6, day: "Wed", time: "10:05", landed: "#launch", readers: [{ who: "maya", at: 7 }],
    calls: [
      { id: "email-head", text: "Headline: Start in two minutes", state: "backed", why: "The one thing we say everywhere.", hints: ["The one thing we say everywhere", "Shortest of the three drafts"] },
      { id: "email-price", text: "$9.60 a month, billed yearly", state: "follows", ref: { call: "study-annual", who: "sam", when: "Mon" } },
      { id: "email-trial", text: "30-day trial", state: "clash", ref: { call: "prd-trial", who: "maya", when: "Tue" }, resolved: "took" },
      { id: "email-ps", text: "P.S. about the referral bonus", state: "guess", hints: ["Referrals drove the last launch"] },
    ],
  },
  {
    id: "screens", project: "launch", thread: "onboarding", from: "jonas", to: ["priya"], title: "Onboarding screens", where: "figma",
    at: 7, day: "Wed", time: "15:00", landed: "Figma · Dev Mode", readers: [{ who: "maya", at: 8 }, { who: "priya", agent: true, at: 9 }],
    calls: [
      // Jonas's reason came from his Claude on Tuesday, when it warned him about Maya's call (the check before the check).
      { id: "scr-steps", text: "4 onboarding steps", state: "clash", why: "Step 2 asked for two things and people stalled there.", ref: { call: "prd-steps", who: "maya", when: "Tue" }, resolved: "talk", talk: "steps" },
      { id: "scr-bar", text: "Progress bar across the top", state: "backed", why: "People kept going in the test when they saw the end.", hints: ["People kept going when they saw the end"] },
      { id: "scr-skip", text: "Skip button on the interests step", state: "guess", hints: ["Interests are optional", "Fewer drop-offs"] },
    ],
  },
  {
    id: "empty", project: "launch", thread: "onboarding", from: "priya", to: ["tom"], title: "Empty states", where: "github", tool: "Cursor",
    at: 9, day: "Thu", time: "16:00", landed: "PR #418", shipsAt: 10, readers: [{ who: "tom", at: 10 }],
    calls: [
      { id: "empty-copy", text: "Empty match list says \"No matches yet, check back tomorrow\"", state: "guess", hints: ["Good enough for launch", "Sets the right expectation"] },
      { id: "empty-retry", text: "Errors retry twice before showing anything", state: "backed", why: "Flaky connections in the test. Nobody wants a button.", hints: ["Flaky connections in the test", "Nobody wants a retry button"] },
      { id: "empty-loading", text: "Loading shows the steps greyed out", state: "backed", why: "Keeps the structure visible.", hints: ["Keeps the structure visible", "Feels faster"] },
      { id: "empty-tone", text: "No exclamation marks anywhere", state: "guess", hints: ["Calmer tone", "Matches the brand voice doc"] },
    ],
  },
  // Website refresh: a smaller project with three of the six. Its first week overlaps the Launch week.
  {
    id: "siteplan", project: "site", thread: "home", from: "maya", to: ["jonas", "lena"], title: "Site plan", where: "docs", tool: "ChatGPT",
    at: 0, day: "Oct 29", time: "", landed: "#site", readers: [{ who: "jonas", at: 0 }, { who: "lena", at: 0 }],
    calls: [
      { id: "sp-anon", text: "Customers quoted without names until legal clears them", state: "backed", why: "Two of three contracts forbid logos without approval." },
      { id: "sp-live", text: "The site goes live with the product", state: "backed", why: "One launch, one date." },
    ],
  },
  {
    id: "sitebrief", project: "site", thread: "home", from: "lena", to: ["jonas", "maya"], title: "Site brief", where: "docs", tool: "ChatGPT",
    at: 0, day: "Oct 30", time: "", landed: "#site", readers: [{ who: "jonas", agent: true, at: 0 }],
    calls: [
      { id: "sb-video", text: "No autoplaying video", state: "backed", why: "It doubled the page weight last time and mobile visitors left." },
      { id: "sb-tone", text: "Plain words, no superlatives", state: "backed", why: "The last site said \"revolutionary\" and nobody believed the rest." },
      { id: "sb-cases", text: "Three case studies at launch", state: "guess", hints: ["Three have quotes cleared"] },
    ],
  },
  {
    id: "cases", project: "site", thread: "cases", from: "lena", to: ["maya", "jonas"], title: "Case studies page", where: "docs", tool: "ChatGPT",
    at: 3, day: "Tue", time: "9:30", landed: "#site", readers: [{ who: "maya", at: 3 }, { who: "jonas", agent: true, at: 7 }],
    calls: [
      { id: "cs-three", text: "Three case studies at launch", state: "backed", why: "Three have quotes cleared.", hints: ["Three have quotes cleared"] },
      { id: "cs-names", text: "Customer names and logos shown", state: "clash", why: "A quote with no name reads as made up. The last site's did.", ref: { call: "sp-anon", who: "maya", when: "Oct 29" }, resolved: "talk", talk: "names" },
      { id: "cs-numbers", text: "One number per story", state: "guess", hints: ["Numbers are what people quote back"] },
    ],
  },
  {
    id: "hero", project: "site", thread: "home", from: "jonas", to: ["lena", "maya"], title: "Homepage hero", where: "figma",
    at: 8, day: "Thu", time: "9:30", landed: "Figma · Dev Mode", readers: [{ who: "lena", at: 9 }],
    calls: [
      { id: "hero-head", text: "Headline: Start in two minutes", state: "follows", ref: { call: "email-head", who: "lena", when: "Wed", project: "launch" } },
      { id: "hero-product", text: "The hero shows the product, not people", state: "backed", why: "Visitors asked what it looks like before who uses it.", hints: ["Visitors asked what it looks like first"] },
      { id: "hero-video", text: "Autoplaying video under the fold", state: "clash", why: "People scroll for it. In the Launch test 30% watched to the end.", ref: { call: "sb-video", who: "lena", when: "Oct 30" }, resolved: "talk", talk: "hero" },
      { id: "hero-cta", text: "One button: Start free", state: "guess", hints: ["One thing to do"] },
    ],
  },
]

export type Stance = { who: string; text: string; why: string }
export type Talk = {
  id: string
  project: string
  thread?: string
  title: string
  people: string[]
  day: string
  time: string
  minutes: number
  // Scenes: booked from, live during, done from.
  bookedAt: number
  liveAt?: number
  doneAt?: number
  // Who asked for it and why, when the Duet booked it.
  reason?: string
  brief: Stance[]
  captions?: { who: string; text: string }[]
  caught?: { text: string; why: string }
  outcome?: { text: string; why: string; backedBy: string[]; next?: string; calls?: { text: string; why: string }[] }
  // Written: no overlap to meet in, so each person writes a stance by the window. Same talk, no captions.
  mode?: "written"
  window?: string
  // Written: the scene each person's stance arrived in. Missing means still waiting.
  stances?: Record<string, number>
  // Written: settled by one person taking the other's stance.
  settledBy?: { who: string; took: string }
  // Ended without agreement: both stances stay on record with their faces.
  unsettled?: boolean
  // After an unsettled talk: who built on whose stance, and why.
  builtOn?: { who: string; stance: string; why: string; at: number }
}

export const TALKS: Talk[] = [
  {
    id: "kickoff", project: "launch", title: "Kickoff", people: VIEWERS_C, day: "Mon", time: "9:30", minutes: 30, bookedAt: 0, liveAt: 1, doneAt: 2,
    brief: [],
    captions: [
      { who: "maya", text: "One goal this quarter: activation. Everything else bends to it." },
      { who: "tom", text: "Then the API never makes the app wait. I'll hold every call under 200 milliseconds." },
      { who: "sam", text: "And no number goes out that we didn't test with real people." },
    ],
    outcome: {
      text: "Five threads, one line of intent each", why: "Everyone's agent reads the intent before it touches the work.", backedBy: VIEWERS_C,
      calls: THREADS_C.map((t) => ({ text: `${t.name}: ${t.intent}`, why: "" })),
    },
  },
  {
    id: "plans", project: "launch", thread: "pricing", title: "Plan names", people: ["lena", "maya", "sam"], day: "Thu", time: "11:00", minutes: 10, bookedAt: 6, liveAt: 9, doneAt: 9,
    reason: "Lena asked. Nobody has backed a name; Maya's PRD guessed Solo and Together.",
    brief: [
      { who: "lena", text: "Needs names by Friday", why: "The email and the pricing page both say the plan name." },
      { who: "maya", text: "Solo and Together, as a guess", why: "ChatGPT suggested them. Not tested." },
      { who: "sam", text: "No data on names", why: "The study tested prices, not names." },
    ],
    captions: [
      { who: "lena", text: "Can we just say Monthly and Yearly? It's one plan at two prices." },
      { who: "maya", text: "That's honest. The PRD's names made it sound like two products." },
    ],
    outcome: { text: "One plan, billed monthly or yearly. No plan names.", why: "It is one plan at two prices; names made it sound like two products.", backedBy: ["lena", "maya", "sam"] },
  },
  {
    id: "steps", project: "launch", thread: "onboarding", title: "Onboarding steps", people: ["maya", "jonas", "tom"], day: "Thu", time: "10:00", minutes: 10, bookedAt: 7, liveAt: 8, doneAt: 9,
    reason: "Jonas's screens have 4 steps. Maya backed 3.",
    brief: [
      { who: "maya", text: "3 steps", why: "Activation is this quarter's goal. PRD v2." },
      { who: "jonas", text: "4 steps", why: "Step 2 asked for two things and people stalled there. Onboarding screens." },
      { who: "tom", text: "API was built for 5, now 3", why: "From the old spec; took Maya's 3 on Tuesday." },
    ],
    captions: [
      { who: "jonas", text: "If step 2 splits, each step is one question." },
      { who: "maya", text: "Then we measure activation after step 4, not 3." },
      { who: "tom", text: "The API doesn't care how many screens. It's one call." },
    ],
    caught: { text: "4 onboarding steps, one question each", why: "Step 2 did two jobs. Activation is measured after step 4." },
    outcome: { text: "4 onboarding steps, one question each", why: "Step 2 did two jobs. Activation is measured after step 4.", backedBy: ["maya", "jonas", "tom"], next: "Tom's Claude Code updates the API" },
  },
  {
    id: "names", project: "site", thread: "cases", title: "Customer names", people: ["lena", "maya"], day: "Tue", time: "15:00", minutes: 10, bookedAt: 3, liveAt: 5, doneAt: 5,
    reason: "Lena's page shows names and logos. Maya backed anonymous quotes until legal clears them.",
    brief: [
      { who: "lena", text: "Names and logos", why: "A quote with no name reads as made up. The last site's did." },
      { who: "maya", text: "No names until legal clears them", why: "Two of three contracts forbid logos without approval." },
    ],
    captions: [
      { who: "lena", text: "A quote with no name is a quote nobody believes." },
      { who: "maya", text: "A logo without approval is a letter from their lawyer." },
    ],
    unsettled: true,
    builtOn: { who: "jonas", stance: "maya", why: "The page ships with the product on Friday. Names go in when legal clears them.", at: 7 },
  },
  {
    id: "hero", project: "site", thread: "home", title: "Hero video", people: ["jonas", "lena"], day: "Thu", time: "17:00", minutes: 0, bookedAt: 8, doneAt: 9,
    mode: "written", window: "Thu 17:00",
    reason: "Jonas's hero autoplays a video. Lena backed no autoplaying video on Oct 30.",
    brief: [
      { who: "jonas", text: "Autoplaying video under the fold", why: "People scroll for it. In the Launch test 30% watched to the end." },
      { who: "lena", text: "No autoplaying video", why: "It doubled the page weight last time and mobile visitors left. A still with a play button keeps the scroll cue." },
    ],
    stances: { jonas: 8, lena: 9 },
    settledBy: { who: "jonas", took: "lena" },
    outcome: { text: "No autoplaying video. A still with a play button.", why: "Page weight. The still keeps the scroll cue.", backedBy: ["jonas", "lena"] },
  },
  {
    id: "sync", project: "launch", title: "Weekly sync", people: VIEWERS_C, day: "Fri", time: "11:00", minutes: 20, bookedAt: 0, liveAt: 10,
    brief: [
      { who: "maya", text: "4 steps, backed Thursday", why: "Step 2 did two jobs." },
      { who: "lena", text: "Email and pricing page say one plan, two prices", why: "From the plan names talk." },
      { who: "priya", text: "Empty states shipped with 2 guesses", why: "Match list copy and the tone rule. Nobody backed them." },
    ],
    captions: [
      { who: "maya", text: "The two guesses in empty states: I'll back the copy, it's fine for launch." },
    ],
  },
]

// Things that settled without needing anyone: Duet answers from precedent, clashes taken at the seam,
// agents doing follow-up work. Shown as one quiet line each.
export type Handled = { id: string; at: number; day: string; time: string; kind: "duet" | "took" | "agent" | "read" | "backed" | "built"; text: string; who?: string; dots?: CallState[]; handoff?: string; talk?: string }
export const HANDLED: Handled[] = [
  { id: "h-tom-took", at: 5, day: "Tue", time: "16:40", kind: "took", who: "tom", text: "took Maya's 3 steps in API v1", handoff: "api" },
  { id: "h-api", at: 5, day: "Tue", time: "16:40", kind: "backed", who: "tom", text: "API v1 · 4 of 4 backed", dots: ["backed", "follows", "follows", "follows"], handoff: "api" },
  { id: "h-read", at: 4, day: "Tue", time: "14:05", kind: "read", who: "jonas", text: "Jonas’s Claude read PRD v2 · 3 of 6 backed", handoff: "prd" },
  { id: "h-duet", at: 6, day: "Wed", time: "9:40", kind: "duet", who: "sam", text: "answered Lena: $12 a month, 20% off yearly · from Sam's calls on Mon", handoff: "study" },
  { id: "h-lena-took", at: 6, day: "Wed", time: "10:05", kind: "took", who: "lena", text: "took Maya's 14-day trial in Launch email v1", handoff: "email" },
  { id: "h-agent", at: 9, day: "Thu", time: "10:12", kind: "agent", who: "tom", text: "Tom’s Claude Code updated the API to 4 steps · from the talk", talk: "steps" },
  { id: "h-site-read", at: 7, day: "Wed", time: "16:05", kind: "read", who: "jonas", text: "Jonas’s Claude read Case studies page · 2 of 3 backed", handoff: "cases" },
  { id: "h-built", at: 7, day: "Wed", time: "16:20", kind: "built", who: "jonas", text: "built on Maya’s stance in Case studies page · names wait for legal", talk: "names" },
  { id: "h-hero-took", at: 9, day: "Thu", time: "16:40", kind: "took", who: "jonas", text: "took Lena’s no autoplaying video in Homepage hero", talk: "hero" },
]

// What Sam's Duet said when Lena asked, scene 6. Answers only from Sam's backed calls; the rest books a talk.
export const DUET_ASKS = [
  { id: "ask-price", who: "lena", duet: "sam", question: "Is the price $12 or $9.60?", answer: "$12 a month. 20% off the yearly plan, so $9.60 a month billed yearly.", from: ["study-12", "study-annual"] },
  { id: "ask-names", who: "lena", duet: "sam", question: "What are the plans called?", answer: null, talk: "plans" },
]

export const initialsC = (id: string) => {
  const p = PEOPLE_C[id]
  return p ? p.name.slice(0, 2) : id.slice(0, 2)
}
export const nameOf = (id: string) => PEOPLE_C[id]?.name ?? id
export const threadOf = (id: string) => THREADS_C.find((t) => t.id === id)
export const callById = (id: string) => {
  for (const h of HANDOFFS) {
    const c = h.calls.find((x) => x.id === id)
    if (c) return { call: c, handoff: h }
  }
  return undefined
}
// Readable list: "Jonas and Tom", "Maya, Jonas and Tom".
export const listNames = (ids: string[]) => {
  const names = ids.map(nameOf)
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}
