import type { Plan } from "@/lib/store"

// One made-up team (Tidepool, a small product studio) used on every screen.

export type Person = { id: string; name: string; email: string; role: string }

export const PEOPLE: Record<string, Person> = {
  MC: { id: "MC", name: "Maya Chen", email: "maya@tidepool.co", role: "Lead" },
  PS: { id: "PS", name: "Priya Shah", email: "priya@tidepool.co", role: "Member" },
  SO: { id: "SO", name: "Sam Okafor", email: "sam@tidepool.co", role: "Member" },
  AT: { id: "AT", name: "Ana Torres", email: "ana@tidepool.co", role: "Member" },
  LB: { id: "LB", name: "Leo Brandt", email: "leo@tidepool.co", role: "Member" },
  // Classmates on Maya's school project
  JK: { id: "JK", name: "Jordan Kim", email: "jordan.kim@school.edu", role: "Member" },
  NR: { id: "NR", name: "Nina Rossi", email: "nina.rossi@school.edu", role: "Member" },
}

export const ME = PEOPLE.MC

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)

export type Status = "conf" | "inf" | "open" | "chg" | "flag"

export const STATUS_LABEL: Record<Status, string> = {
  conf: "Confirmed",
  inf: "Inferred",
  open: "Open",
  chg: "Changed",
  flag: "Flagged",
}

export type Decision = {
  id: string
  project: string
  title: string
  part: string
  status: Status
  owner: string
  by?: string
  tool?: string
  when?: string
  why?: string
  was?: string
  snippet?: string
  due?: string
}

export const DECISIONS: Decision[] = [
  // PlantPal: an iPhone app that reminds you to water your plants
  { id: "five", project: "plantpal", title: "Design for people with 5 or more plants", part: "Research", status: "conf", owner: "PS", by: "Priya Shah", tool: "Claude", when: "Oct 9", why: "In 18 interviews, people with 5+ plants lost the most plants and asked for reminders the most." },
  { id: "core", project: "plantpal", title: "Reminders are the core feature, not a plant encyclopedia", part: "Research", status: "conf", owner: "PS", by: "Priya Shah and Maya Chen", tool: "Claude", when: "Oct 12", why: "Everyone already Googles care tips. Nobody has a good way to remember to water.", snippet: "16 of 18 said remembering is the hard part, not knowing what to do." },
  { id: "digest", project: "plantpal", title: "One daily digest instead of a push for every plant", part: "Research", status: "open", owner: "PS", due: "Fri Oct 30" },
  { id: "photo", project: "plantpal", title: "Add a plant by snapping a photo", part: "Design", status: "conf", owner: "MC", by: "Maya Chen", tool: "Figma", when: "Oct 14", why: "Typing plant names was the biggest drop-off in the prototype test: 7 of 12 testers gave up.", snippet: "Camera first, with search as a fallback link under the shutter." },
  { id: "calendar", project: "plantpal", title: "Watering schedule shows as a weekly calendar", part: "Design", status: "conf", owner: "MC", by: "Maya Chen", tool: "Figma", when: "Oct 15", why: "Testers wanted to see the whole week at once, not one plant at a time." },
  { id: "type", project: "plantpal", title: "Body text is SF Pro at 17pt", part: "Design", status: "inf", owner: "MC", tool: "Cursor", when: "Today", snippet: "bump body to 17, 15 is hard to read on the plant cards" },
  { id: "empty", project: "plantpal", title: "Empty state shows one sample plant", part: "Design", status: "open", owner: "MC", due: "Mon Nov 2" },
  { id: "swiftui", project: "plantpal", title: "iPhone only for v1, built in SwiftUI", part: "Engineering", status: "conf", owner: "SO", by: "Sam Okafor", tool: "Cursor", when: "Oct 16", why: "Android is 18% of the waitlist. One platform gets us to launch 6 weeks sooner." },
  { id: "ondevice", project: "plantpal", title: "Plant ID runs on the phone, not in the cloud", part: "Engineering", status: "chg", owner: "SO", by: "Sam Okafor", tool: "Cursor", when: "Oct 22", was: "Plant ID calls a cloud API", why: "The cloud API costs 4 cents a photo and fails without signal. On the phone it's free and works in the garden." },
  { id: "local", project: "plantpal", title: "Reminders are scheduled on the phone, no server", part: "Engineering", status: "inf", owner: "SO", tool: "Cursor", when: "Yesterday", snippet: "we don't need a backend for v1, local notifications are enough" },
  { id: "tuesday", project: "plantpal", title: "Launch on Product Hunt on a Tuesday", part: "Marketing", status: "conf", owner: "AT", by: "Ana Torres", tool: "ChatGPT", when: "Oct 17", why: "Tuesdays get the most traffic without the Monday pile-up of big launches." },
  { id: "screens", project: "plantpal", title: "App Store screenshots lead with the photo moment", part: "Marketing", status: "inf", owner: "AT", tool: "ChatGPT", when: "Oct 21", snippet: "lead with snap a photo, it's the wow moment" },
  { id: "freemium", project: "plantpal", title: "Free for 3 plants, $2.99 a month for unlimited", part: "Marketing", status: "flag", owner: "AT", by: "Ana Torres", tool: "Claude", when: "Oct 19", why: "Matches what similar apps charge. Flagged: Priya thinks 3 plants is too few to get hooked." },
  // AI Studio class: a school team project
  { id: "cram", project: "studio", title: "Design for students cramming the night before an exam", part: "Interviews", status: "conf", owner: "JK", by: "Jordan Kim", tool: "Claude", when: "Oct 9", why: "In our 12 interviews, cramming came up more than any other study habit." },
  { id: "slides", project: "studio", title: "The tool turns lecture slides into practice questions", part: "Concept", status: "conf", owner: "MC", by: "Maya Chen and Jordan Kim", tool: "Claude", when: "Oct 14", why: "Everyone already has the slides. Nobody has good practice questions.", snippet: "Upload the deck, get a quiz. That's the whole pitch." },
  { id: "cite", project: "studio", title: "Every answer shows the slide it came from", part: "Concept", status: "inf", owner: "NR", tool: "ChatGPT", when: "Yesterday", snippet: "show which slide each answer came from so people trust it" },
  { id: "figma", project: "studio", title: "Prototype in Figma, not code", part: "Prototype", status: "chg", owner: "MC", by: "Maya Chen", when: "Oct 21", was: "Build a working web app", why: "Prof. Alvarez said the crit grades the experience, not the code. Saves us two weeks." },
  { id: "deck", project: "studio", title: "Final crit deck is 10 slides max", part: "Final crit", status: "conf", owner: "NR", by: "Nina Rossi", when: "Oct 16", why: "Each team gets 12 minutes, and the demo needs at least 5 of them." },
  { id: "presenter", project: "studio", title: "Who presents the demo at the final crit", part: "Final crit", status: "open", owner: "NR", due: "Fri Oct 30" },
]

// "Builds on" links between decisions. The canvas draws the ones that cross parts.
export const LINKS: [string, string][] = [
  ["five", "core"],
  ["core", "digest"],
  ["core", "photo"],
  ["photo", "ondevice"],
  ["photo", "screens"],
  ["swiftui", "local"],
  ["digest", "local"],
  ["cram", "slides"],
  ["slides", "cite"],
  ["slides", "figma"],
  ["figma", "deck"],
]

export const projectName = (id: string) => PROJECTS.find((p) => p.id === id)?.name ?? id

// Parts of a project, in the order they first appear, with the owner of their first decision.
export function partsOf(decisions: Decision[]) {
  const seen = new Map<string, string>()
  for (const d of decisions) if (!seen.has(d.part)) seen.set(d.part, d.owner)
  return [...seen].map(([name, owner]) => ({ name, owner }))
}

export type Project = { id: string; name: string; brief: string; members: string[]; updated: string }

export const PROJECTS: Project[] = [
  { id: "plantpal", name: "PlantPal app", brief: "An iPhone app that reminds you when to water each of your plants. Launching on the App Store Dec 1.", members: ["MC", "PS", "SO", "AT", "LB"], updated: "2 hours ago" },
  { id: "studio", name: "AI Studio class", brief: "Team project for school: design an AI tool that helps students study. Final crit is Dec 10.", members: ["MC", "JK", "NR"], updated: "Today" },
]

export type TaskStatus = "todo" | "prog" | "review" | "done"
export type Priority = "urgent" | "high" | "med" | "low" | "none"
export type Task = {
  id: string
  title: string
  project: string
  part: string
  owner: string
  due: string
  status: TaskStatus
  priority: Priority
  decision?: string
  description?: string
  subtasks?: { title: string; done: boolean }[]
  comments?: { who: string; text: string; when: string }[]
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", prog: "In progress", review: "In review", done: "Done" }
export const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Urgent", high: "High", med: "Medium", low: "Low", none: "No priority" }

export const TASKS: Task[] = [
  { id: "t1", title: "Mock up the plant photo flow on small iPhones", project: "PlantPal app", part: "Design", owner: "MC", due: "Today", status: "prog", priority: "urgent", decision: "photo", description: "The shutter button sits too low on the iPhone SE. Check it before Sam builds the camera screen.", subtasks: [{ title: "iPhone SE frame", done: true }, { title: "iPhone 15 Pro Max frame", done: false }] },
  { id: "t2", title: "Confirm SF Pro 17pt on the plant cards", project: "PlantPal app", part: "Design", owner: "MC", due: "Mon Oct 26", status: "todo", priority: "high", decision: "type", description: "Cursor logged this from my session. Confirm it reads well with long plant names." },
  { id: "t3", title: "Design the empty state for new users", project: "PlantPal app", part: "Design", owner: "MC", due: "Mon Nov 2", status: "todo", priority: "med", decision: "empty", subtasks: [{ title: "Sample plant version", done: false }, { title: "Blank version with a big Add button", done: false }], comments: [{ who: "PS", text: "Testers liked seeing a sample, it showed them what a reminder looks like.", when: "Yesterday" }] },
  { id: "t4", title: "Pick the reminder style: per plant or daily digest", project: "PlantPal app", part: "Research", owner: "PS", due: "Fri Oct 30", status: "todo", priority: "high", decision: "digest" },
  { id: "t5", title: "Move plant ID onto the phone", project: "PlantPal app", part: "Engineering", owner: "SO", due: "Tue Nov 3", status: "prog", priority: "high", decision: "ondevice", subtasks: [{ title: "Convert the model", done: true }, { title: "Hook up the camera", done: false }, { title: "Test with 50 houseplant photos", done: false }] },
  { id: "t6", title: "Spike: schedule reminders without a server", project: "PlantPal app", part: "Engineering", owner: "SO", due: "Thu Oct 29", status: "review", priority: "med", decision: "local" },
  { id: "t7", title: "Write the App Store screenshot captions", project: "PlantPal app", part: "Marketing", owner: "AT", due: "Wed Oct 28", status: "review", priority: "med", decision: "screens" },
  { id: "t8", title: "Draft the Product Hunt launch page", project: "PlantPal app", part: "Marketing", owner: "AT", due: "Fri Nov 6", status: "todo", priority: "low", decision: "tuesday" },
  { id: "t9", title: "Interview 18 plant owners", project: "PlantPal app", part: "Research", owner: "PS", due: "Oct 9", status: "done", priority: "high", decision: "five" },
  { id: "t10", title: "Set up the SwiftUI project", project: "PlantPal app", part: "Engineering", owner: "SO", due: "Oct 16", status: "done", priority: "med", decision: "swiftui" },
  { id: "t11", title: "Build the quiz flow prototype in Figma", project: "AI Studio class", part: "Prototype", owner: "MC", due: "Wed Oct 28", status: "prog", priority: "urgent", decision: "figma", subtasks: [{ title: "Upload slides screen", done: true }, { title: "Quiz screen", done: false }, { title: "Results screen", done: false }] },
  { id: "t12", title: "Add slide citations to the answer screen", project: "AI Studio class", part: "Prototype", owner: "MC", due: "Mon Nov 2", status: "todo", priority: "med", decision: "cite" },
  { id: "t13", title: "Turn 3 lecture decks into sample questions", project: "AI Studio class", part: "Concept", owner: "JK", due: "Mon Oct 26", status: "prog", priority: "high", decision: "slides" },
  { id: "t14", title: "Book a usability test with 5 classmates", project: "AI Studio class", part: "Interviews", owner: "NR", due: "Thu Oct 29", status: "review", priority: "med" },
  { id: "t15", title: "Outline the final crit deck", project: "AI Studio class", part: "Final crit", owner: "NR", due: "Fri Oct 30", status: "todo", priority: "med", decision: "deck", comments: [{ who: "NR", text: "@Maya can you take the demo part?", when: "Yesterday" }] },
  { id: "t16", title: "Interview 12 classmates about how they study", project: "AI Studio class", part: "Interviews", owner: "JK", due: "Oct 9", status: "done", priority: "high", decision: "cram" },
]

// Milestones per project, for the progress card on Overview.
export const MILESTONES: Record<string, { name: string; due: string }> = {
  plantpal: { name: "Design locked", due: "Oct 30" },
  studio: { name: "Prototype due", due: "Nov 4" },
}

export type InboxKind = "review" | "change" | "alert" | "invite" | "mention"

export const INBOX_KIND_LABEL: Record<InboxKind, string> = {
  review: "Decisions to review",
  change: "Changes for you",
  alert: "Misalignment alerts",
  invite: "Live session invites",
  mention: "Mentions",
}

export type InboxItem = { id: string; kind: InboxKind; from: string; project: string; summary: string; time: string; unread: boolean; decision?: string; body: string }

export const INBOX: InboxItem[] = [
  { id: "i1", kind: "review", from: "MC", project: "PlantPal app", summary: "Your AI tool logged “Body text is SF Pro at 17pt”", time: "12m", unread: true, decision: "type", body: "Cursor picked this up from your session. Confirm it so the team can build on it, or fix the wording first." },
  { id: "i5", kind: "invite", from: "PS", project: "PlantPal app", summary: "Priya invited you to a live session on reminder style", time: "5m", unread: true, body: "Starts now. Your AI tool joins with you, and decisions from the session are logged for review." },
  { id: "i4", kind: "alert", from: "AT", project: "PlantPal app", summary: "Ana's screenshots show an Android phone, but v1 is iPhone only", time: "3h", unread: true, decision: "swiftui", body: "Ana's ChatGPT drafted App Store screenshots on a Pixel frame. That conflicts with “iPhone only for v1”. Ask why, or flag it." },
  { id: "i3", kind: "change", from: "SO", project: "PlantPal app", summary: "Plant ID now runs on the phone", time: "2d", unread: true, decision: "ondevice", body: "Was: a cloud API. Your photo flow has a loading screen that may not be needed anymore." },
  { id: "i8", kind: "review", from: "NR", project: "AI Studio class", summary: "Nina's AI tool logged “Every answer shows the slide it came from”", time: "1h", unread: true, decision: "cite", body: "This touches the answer screen in your prototype. Confirm it, or fix the wording first." },
  { id: "i7", kind: "alert", from: "JK", project: "AI Studio class", summary: "Jordan started a React app, but the class prototype is in Figma", time: "4h", unread: true, decision: "figma", body: "Jordan's Cursor session created a new repo for the quiz. That conflicts with “Prototype in Figma, not code”. Ask why, or flag it." },
  { id: "i6", kind: "mention", from: "NR", project: "AI Studio class", summary: "Nina mentioned you on the crit deck", time: "1d", unread: false, decision: "presenter", body: "“@Maya can you take the demo part of the final crit?”" },
]

export type Session = {
  id: string
  project: string
  title: string
  host: string
  people: string[]
  status: "Live" | "Scheduled" | "Ended"
  when: string
  length?: string
  decisions: number
  summary?: string
}

export const SESSIONS: Session[] = [
  { id: "s1", project: "plantpal", title: "Reminder style", host: "PS", people: ["PS", "MC", "SO"], status: "Live", when: "Now", length: "11 min so far", decisions: 2 },
  { id: "s5", project: "plantpal", title: "Weekly sync", host: "MC", people: ["MC", "PS", "SO", "AT", "LB"], status: "Scheduled", when: "Mon Oct 26, 10:00", decisions: 0 },
  { id: "s6", project: "plantpal", title: "App Store screenshots review", host: "AT", people: ["AT", "MC"], status: "Scheduled", when: "Tue Oct 27, 14:30", decisions: 0 },
  { id: "s2", project: "plantpal", title: "Photo or search to add a plant", host: "MC", people: ["MC", "PS"], status: "Ended", when: "Oct 14", length: "42 min", decisions: 3, summary: "Picked photo first, with search as a fallback. The search-only flow went to the idea archive. The weekly calendar view was agreed." },
  { id: "s3", project: "plantpal", title: "iPhone only for v1?", host: "SO", people: ["SO", "LB", "MC"], status: "Ended", when: "Oct 16", length: "18 min", decisions: 1, summary: "iPhone only for v1, built in SwiftUI. Android goes on the roadmap after launch." },
  { id: "s7", project: "plantpal", title: "Weekly sync", host: "MC", people: ["MC", "PS", "SO", "AT"], status: "Ended", when: "Oct 19", length: "27 min", decisions: 1, summary: "Pricing raised as a question: Priya thinks 3 free plants is too few." },
  { id: "s9", project: "studio", title: "Crit rehearsal", host: "NR", people: ["NR", "MC", "JK"], status: "Scheduled", when: "Thu Oct 29, 18:00", decisions: 0 },
  { id: "s4", project: "studio", title: "Pick our concept", host: "JK", people: ["JK", "MC", "NR"], status: "Ended", when: "Oct 14", length: "40 min", decisions: 2, summary: "Picked slides to practice questions over a flashcard app. The flashcard idea went to the idea archive." },
]

// Artifacts are the work itself: prototypes, design files, repos, docs and AI outputs.
// Each belongs to a part of a project, so the decisions canvas can show them in place.
export type ArtifactKind = "Prototype" | "Figma" | "Repo" | "Doc" | "AI output" | "Sheet"
export type Artifact = {
  id: string
  project: string
  part: string
  name: string
  kind: ArtifactKind
  owner: string
  updated: string
  decisions: number
  meta: string
  files?: string[] // repos: recently changed files
  pr?: string // repos: the open pull request
}

export const ARTIFACTS: Artifact[] = [
  { id: "a1", project: "plantpal", part: "Design", name: "PlantPal iPhone prototype", kind: "Prototype", owner: "MC", updated: "1h ago", decisions: 3, meta: "Add a plant, schedule, reminders · 9 screens" },
  { id: "a2", project: "plantpal", part: "Design", name: "PlantPal app design", kind: "Figma", owner: "MC", updated: "2h ago", decisions: 4, meta: "4 pages · 38 frames" },
  { id: "a3", project: "plantpal", part: "Research", name: "Interview notes, 18 plant owners", kind: "Doc", owner: "PS", updated: "Oct 9", decisions: 2, meta: "Quotes and themes" },
  { id: "a4", project: "plantpal", part: "Research", name: "Waitlist survey results", kind: "Sheet", owner: "PS", updated: "Oct 11", decisions: 1, meta: "312 responses" },
  { id: "a5", project: "plantpal", part: "Research", name: "Interview themes", kind: "AI output", owner: "PS", updated: "Oct 10", decisions: 1, meta: "Summarized by Claude" },
  { id: "a6", project: "plantpal", part: "Engineering", name: "plantpal/ios-app", kind: "Repo", owner: "SO", updated: "40m ago", decisions: 3, meta: "on-device-id · PR #12 open · 8 commits", files: ["AddPlant/PhotoCapture.swift", "ML/PlantClassifier.mlmodel", "Reminders/Scheduler.swift", "Tests/SchedulerTests.swift"], pr: "PR #12 · Run plant ID on the phone · 3 checks passing" },
  { id: "a7", project: "plantpal", part: "Engineering", name: "Tech plan", kind: "Doc", owner: "SO", updated: "Oct 16", decisions: 2, meta: "Architecture and risks" },
  { id: "a8", project: "plantpal", part: "Marketing", name: "App Store screenshots", kind: "Figma", owner: "AT", updated: "Today", decisions: 1, meta: "6 screenshots · draft" },
  { id: "a9", project: "plantpal", part: "Marketing", name: "Launch plan", kind: "Doc", owner: "AT", updated: "Yesterday", decisions: 2, meta: "Product Hunt, waitlist, press" },
  { id: "a10", project: "plantpal", part: "Marketing", name: "Tagline ideas", kind: "AI output", owner: "AT", updated: "Oct 21", decisions: 0, meta: "From ChatGPT · 12 options" },
  { id: "a11", project: "studio", part: "Interviews", name: "Interview notes, 12 classmates", kind: "Doc", owner: "JK", updated: "Oct 9", decisions: 1, meta: "Quotes and study habits" },
  { id: "a12", project: "studio", part: "Interviews", name: "Study habit themes", kind: "AI output", owner: "JK", updated: "Oct 10", decisions: 1, meta: "Summarized by Claude" },
  { id: "a13", project: "studio", part: "Concept", name: "Concept sketches", kind: "Figma", owner: "MC", updated: "Oct 14", decisions: 2, meta: "3 concepts · 1 picked" },
  { id: "a14", project: "studio", part: "Concept", name: "Project brief", kind: "Doc", owner: "NR", updated: "Sep 30", decisions: 0, meta: "From Prof. Alvarez" },
  { id: "a15", project: "studio", part: "Prototype", name: "Quiz flow prototype", kind: "Prototype", owner: "MC", updated: "2h ago", decisions: 2, meta: "Upload slides, quiz, results · 7 screens" },
  { id: "a16", project: "studio", part: "Prototype", name: "jkim/study-buddy", kind: "Repo", owner: "JK", updated: "4h ago", decisions: 0, meta: "main · 5 commits · not in the plan", files: ["src/App.tsx", "src/quiz/Question.tsx", "src/api/generate.ts"] },
  { id: "a17", project: "studio", part: "Final crit", name: "Crit deck outline", kind: "Doc", owner: "NR", updated: "Yesterday", decisions: 1, meta: "10 slides" },
]

// What each person, and their AI tool, is working on right now. High level only, never prompts.
export type Activity = { project: string; who: string; tool?: string; doing: string; part: string; since: string; state: "active" | "idle" }

export const ACTIVITY: Activity[] = [
  { project: "plantpal", who: "MC", tool: "Cursor", doing: "Photo flow on small iPhones", part: "Design", since: "20 min", state: "active" },
  { project: "plantpal", who: "PS", tool: "Claude", doing: "Reminder style (in a live session)", part: "Research", since: "11 min", state: "active" },
  { project: "plantpal", who: "SO", tool: "Cursor", doing: "Plant ID on the phone", part: "Engineering", since: "40 min", state: "active" },
  { project: "plantpal", who: "AT", tool: "ChatGPT", doing: "App Store screenshot captions", part: "Marketing", since: "1 h", state: "active" },
  { project: "plantpal", who: "LB", doing: "Nothing right now", part: "Engineering", since: "Yesterday", state: "idle" },
  { project: "studio", who: "MC", tool: "Claude", doing: "Quiz flow prototype", part: "Prototype", since: "2 h", state: "active" },
  { project: "studio", who: "JK", tool: "Cursor", doing: "A React version of the quiz", part: "Prototype", since: "4 h", state: "active" },
  { project: "studio", who: "NR", tool: "ChatGPT", doing: "Crit deck outline", part: "Final crit", since: "30 min", state: "active" },
]

// Milestone timeline per project, for cadence on Overview.
export const TIMELINE: Record<string, { name: string; date: string; done: boolean }[]> = {
  plantpal: [
    { name: "Kickoff", date: "Sep 28", done: true },
    { name: "Research done", date: "Oct 12", done: true },
    { name: "Design locked", date: "Oct 30", done: false },
    { name: "TestFlight beta", date: "Nov 13", done: false },
    { name: "App Store launch", date: "Dec 1", done: false },
  ],
  studio: [
    { name: "Kickoff", date: "Sep 30", done: true },
    { name: "Concept review", date: "Oct 14", done: true },
    { name: "Prototype due", date: "Nov 4", done: false },
    { name: "Usability test", date: "Nov 18", done: false },
    { name: "Final crit", date: "Dec 10", done: false },
  ],
}

export const AI_TOOLS = [
  { id: "claude", name: "Claude", desc: "Desktop app and Claude Code", connected: true },
  { id: "cursor", name: "Cursor", desc: "Editor sessions and chat", connected: true },
  { id: "chatgpt", name: "ChatGPT", desc: "Desktop app", connected: false },
  { id: "figma", name: "Figma", desc: "Comments and Dev Mode", connected: true },
]

export const PLANS: { name: Plan; price: string; blurb: string; features: string[] }[] = [
  { name: "Free", price: "$0", blurb: "For trying it with a small team", features: ["Up to 5 people", "5 projects", "Decision log and inbox", "Connect 2 AI tools each"] },
  { name: "Pro", price: "$12", blurb: "Per person, per month", features: ["Unlimited projects", "Live sessions", "Team view", "Misalignment alerts"] },
  { name: "Business", price: "$24", blurb: "Per person, per month", features: ["Everything in Pro", "SSO and audit log", "Admin roles", "Priority support"] },
]

// AI summaries shown on the decisions canvas, one per part and one per project.
// Written by Whyspace from the decisions themselves, refreshed when one changes.
export const PART_SUMMARY: Record<string, string> = {
  Research: "Built for people with 5 or more plants, and reminders are the whole point. Still open: one daily digest or a push per plant, being settled in today's live session.",
  Design: "Add a plant by snapping a photo, then see the week's watering on a calendar. SF Pro at 17pt is inferred and needs a confirm. The empty state is still open.",
  Engineering: "iPhone only for v1, in SwiftUI. Plant ID moved onto the phone (changed Oct 22). Reminders scheduled on the phone with no server is inferred from Sam's code.",
  Marketing: "Launch on Product Hunt on a Tuesday, with screenshots that lead with the photo moment. Pricing is flagged: 3 free plants may be too few.",
  Pricing: "Free for 3 plants, then $2.99 a month. Flagged by Priya, who thinks people need more plants free to get hooked.",
  Interviews: "Built for students cramming the night before an exam, based on 12 classmate interviews.",
  Concept: "Upload lecture slides, get practice questions. Showing the source slide for each answer is inferred from Nina's chat and needs a confirm.",
  Prototype: "Prototype in Figma, not code (changed Oct 21, after Prof. Alvarez's feedback). Jordan has started a React repo anyway.",
  "Final crit": "The deck is 10 slides max. Who presents the demo is still open.",
}

export const PROJECT_DECISION_SUMMARY: Record<string, string> = {
  plantpal: "PlantPal is a reminders app first: snap a photo to add a plant, see the week on a calendar. iPhone only for v1, and plant ID now runs on the phone. What's open: digest or per-plant reminders, the empty state and pricing.",
  studio: "A study tool that turns lecture slides into practice questions, for students cramming before exams. Prototyped in Figma for the Dec 10 crit. What's open: who presents the demo, and whether answers show their source slide.",
}

// What changed this week, per project, for the Decisions overview in the main nav.
export const WEEK_SUMMARY: Record<string, string> = {
  plantpal: "Plant ID moved from a cloud API onto the phone, which makes it free and offline. Two decisions came in from AI tools and need a person: SF Pro at 17pt and reminders with no server. Pricing got flagged.",
  studio: "The prototype moved from code to Figma after Prof. Alvarez's feedback, but Jordan started a React repo anyway, which is worth a quick talk. Nina's ChatGPT logged that answers should show their source slide.",
}

// Canvas extras per project: an AI note on a part, an AI suggestion waiting for a person,
// and suggested questions for Ask Whyspace.
export const CANVAS_EXTRAS: Record<string, { notePart?: string; note?: string; suggestion?: { name: string; from: string; moves: string[]; by: string; reason: string }; ask: string[] }> = {
  plantpal: {
    notePart: "Marketing",
    note: "Ana's ChatGPT sorted 2 decisions here over MCP · Oct 21",
    suggestion: { name: "Pricing", from: "Marketing", moves: ["freemium"], by: "Priya's Claude", reason: "Pricing has its own open questions now, separate from launch marketing." },
    ask: ["Why is plant ID on the phone?", "What's still open?", "Show me the prototype", "What changed this week?"],
  },
  studio: {
    notePart: "Interviews",
    note: "Jordan's Claude sorted these decisions here over MCP · Oct 10",
    ask: ["Why Figma and not code?", "What's still open?", "Show me the prototype", "What changed this week?"],
  },
}
