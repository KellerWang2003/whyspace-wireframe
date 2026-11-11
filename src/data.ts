import type { Plan } from "@/lib/store"
import { DESIGN } from "@/lib/design"
import { STAGE } from "@/lib/stage"
import { VIEWER } from "@/lib/viewer"
import { PRESET } from "@/scenarios/data"

// Fictional scenario: Keller markets Whiskr, a swipe app for cats, and builds Recall with one AI Studio teammate.

export type Person = { id: string; name: string; email: string; role: string }

export const PEOPLE: Record<string, Person> = {
  "MC": {
    "id": "MC",
    "name": "Keller",
    "email": "keller@whiskr.example",
    "role": "Chief marketing officer"
  },
  "CH": {
    "id": "CH",
    "name": "Christine",
    "email": "christine@whiskr.example",
    "role": "CEO"
  },
  "TR": {
    "id": "TR",
    "name": "Trevor",
    "email": "trevor@whiskr.example",
    "role": "Chief research officer"
  },
  "KL": {
    "id": "KL",
    "name": "Kelly",
    "email": "kelly@whiskr.example",
    "role": "Chief product officer"
  },
  "JK": {
    "id": "JK",
    "name": "Jordan Kim",
    "email": "jordan.kim@studio.example",
    "role": "AI Studio teammate"
  }
}

// Whoever the debug panel is viewing as (see lib/viewer.ts). Keller by default.
export const ME = PEOPLE[VIEWER]

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)

// "prec" (from precedent) is never stored: the main design derives it for an inferred decision that builds on a confirmed one.
export type Status = "conf" | "prec" | "inf" | "open" | "chg" | "flag"

export const STATUS_LABEL: Record<Status, string> = {
  conf: "Confirmed",
  prec: "From precedent",
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
  // What backs the why: a clip, a source, a test result. Shown first on the decision sheet.
  evidence?: Evidence[]
  // Options the team weighed and didn't pick, with the reason.
  options?: { title: string; why: string }[]
  // The decision this one replaced (an id, so the sheet can show who decided it and when).
  replaces?: string
  // A clash: the confirmed decision this one contradicts (its id). The main design shows ▲ until one side changes.
  clashes?: string
  // Visual changes get a before and after on the decision sheet.
  visual?: { before: string; after: string }
  replies?: Reply[]
}

export type Evidence = { kind: "clip" | "research" | "test" | "chat" | "feedback"; label: string; detail?: string; artifact?: string }
export type Reply = { who: string; text: string; when: string }

const ALL_DECISIONS: Decision[] = [
  {
    "id": "move",
    "project": "whiskr",
    "title": "Make things move to get cats' attention",
    "part": "Research",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Claude",
    "why": "In user testing, all 3 cats ignored the still card and chased anything that moved.",
    "snippet": "She only looks when something moves.",
    "evidence": [
      { "kind": "test", "label": "User testing", "detail": "3 cats, Oct 21" },
      { "kind": "clip", "label": "Luna pounces · 0:42", "artifact": "w3" }
    ],
    "visual": { "before": "Still swipe card", "after": "Moving swipe card" }
  },
  {
    "id": "dot",
    "project": "whiskr",
    "title": "Add a moving dot that shows cats where to swipe",
    "part": "App",
    "status": "conf",
    "owner": "KL",
    "by": "Kelly",
    "when": "Oct 22",
    "tool": "Claude Code",
    "why": "Cats follow a moving dot, so it shows them where to swipe.",
    "evidence": [{ "kind": "test", "label": "Kelly's 2 prototypes", "detail": "The dot beat the wiggling card." }],
    "options": [
      { "title": "Wiggle the whole card", "why": "Hard for a paw to hit" },
      { "title": "A feather toy", "why": "Covered the cat's photo" }
    ],
    "visual": { "before": "Still swipe card", "after": "Swipe card with a moving dot" }
  },
  {
    "id": "purr",
    "project": "whiskr",
    "title": "Add a purring sound to the dot",
    "part": "App",
    "status": "conf",
    "owner": "KL",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Perplexity",
    "why": "Research found that cats pay attention to purring sounds.",
    "evidence": [{ "kind": "research", "label": "Cat research", "detail": "Perplexity · 3 sources", "artifact": "w2" }]
  },
  {
    "id": "red",
    "project": "whiskr",
    "title": "Use red as the brand color",
    "part": "Brand",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 8",
    "tool": "Figma",
    "why": "Red feels playful and stands out."
  },
  {
    "id": "dotbrand",
    "project": "whiskr",
    "title": "Add the swipe dot to the logo",
    "part": "Brand",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Figma",
    "why": "Cats already know the dot from the app, so they'll recognize the logo.",
    "options": [{ "title": "Keep the dot in the app only", "why": "Cats wouldn't spot it on posters" }]
  },
  {
    "id": "nored",
    "project": "whiskr",
    "title": "Change the brand color from red to blue",
    "part": "Brand",
    "status": "chg",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 23",
    "tool": "Claude",
    "was": "Use red as the brand color",
    "why": "Research found that cats can't see red. Blue is the color they see best.",
    "replaces": "red",
    "evidence": [{ "kind": "research", "label": "Cat research", "detail": "Cats see red as gray.", "artifact": "w2" }],
    "options": [{ "title": "Keep red for small details", "why": "Cats still can't see it" }],
    "visual": { "before": "Red", "after": "Blue" },
    "replies": [
      { "who": "MC", "text": "Posters too? They're mostly for owners.", "when": "Oct 23" },
      { "who": "TR", "text": "Yes, cats see them too.", "when": "Oct 23" }
    ]
  },
  {
    "id": "short",
    "project": "whiskr",
    "title": "Make the promo video 15 seconds",
    "part": "Marketing",
    "status": "inf",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "snippet": "Let's keep it short, like 15 seconds.",
    "why": "Cats lose interest fast.",
    "evidence": [{ "kind": "chat", "label": "Keller's chat with Claude", "detail": "\"Let's keep it short, like 15 seconds.\"" }],
    "options": [{ "title": "30 seconds", "why": "Too long for cats" }]
  },
  {
    "id": "bluecard",
    "project": "whiskr",
    "title": "Use blue for the promo title card",
    "part": "Marketing",
    "status": "inf",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "snippet": "Title card in the brand blue, white type.",
    "why": "Follows the brand color change: cats see blue best.",
    "evidence": [{ "kind": "chat", "label": "Keller's chat with Claude", "detail": "\"Title card in the brand blue, white type.\"" }]
  },
  {
    "id": "redcard",
    "project": "whiskr",
    "title": "Make the end card red, like the old logo",
    "part": "Marketing",
    "status": "flag",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "snippet": "End on the red logo card people know.",
    "why": "People know the red logo from the posters.",
    "clashes": "nored",
    "evidence": [{ "kind": "chat", "label": "Keller's chat with Claude", "detail": "\"End on the red logo card people know.\"" }]
  },
  {
    "id": "pounce",
    "project": "whiskr",
    "title": "Start the promo video with a real cat clip",
    "part": "Marketing",
    "status": "conf",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "why": "Seeing a real cat chase the screen explains the app in a second.",
    "evidence": [{ "kind": "clip", "label": "Luna pounces · 0:42", "artifact": "w3" }],
    "options": [{ "title": "Start with the logo", "why": "Doesn't show what the app does" }]
  },
  {
      "id": "cram",
      "project": "studio",
      "title": "Focus on students reviewing one lecture at a time",
      "part": "Interviews",
      "status": "conf",
      "owner": "JK",
      "by": "Jordan Kim",
      "tool": "Claude",
      "when": "Oct 13",
      "why": "Students couldn't tell what they understood after rereading.",
      "evidence": [{ "kind": "research", "label": "Six classmate interviews", "artifact": "a11" }]
    },
  {
      "id": "slides",
      "project": "studio",
      "title": "Generate five practice questions from one course PDF",
      "part": "Concept",
      "status": "conf",
      "owner": "MC",
      "by": "Keller and Jordan Kim",
      "tool": "Claude",
      "when": "Oct 15",
      "why": "A full loop two people can build and test by Nov 4.",
      "snippet": "Upload, practice, check the explanation, and return to the source.",
      "options": [{ "title": "Summaries of whole courses", "why": "Too big for Nov 4" }]
    },
  {
      "id": "cite",
      "project": "studio",
      "title": "Attach a source page to every answer explanation",
      "part": "Concept",
      "status": "inf",
      "owner": "JK",
      "tool": "Cursor",
      "when": "Yesterday",
      "snippet": "Only return questions with a supporting passage and a page number we can link back to.",
      "evidence": [{ "kind": "test", "label": "First evaluation · 15 questions", "detail": "2 questions had no supporting passage.", "artifact": "a16" }]
    },
  {
      "id": "figma",
      "project": "studio",
      "title": "Build one working upload-to-feedback flow",
      "part": "Prototype",
      "status": "chg",
      "owner": "MC",
      "by": "Keller and Jordan Kim",
      "when": "Oct 21",
      "was": "A clickable mock with prewritten questions",
      "why": "Studio feedback: test real model mistakes, not a mock.",
      "evidence": [{ "kind": "feedback", "label": "Studio feedback · Oct 20" }]
    },
  {
      "id": "deck",
      "project": "studio",
      "title": "Show model failures alongside the successful demo",
      "part": "Final crit",
      "status": "conf",
      "owner": "JK",
      "by": "Jordan Kim",
      "when": "Oct 23",
      "why": "The critique needs proof we iterated.",
      "evidence": [{ "kind": "test", "label": "First evaluation · 15 questions", "artifact": "a16" }]
    },
  {
      "id": "presenter",
      "project": "studio",
      "title": "How should we split the demo and evaluation story?",
      "part": "Final crit",
      "status": "open",
      "owner": "MC",
      "due": "Fri Oct 30"
    }
]

// "Builds on" links between decisions. The canvas draws the ones that cross parts.
export const LINKS: [string, string][] = [
  ["move", "dot"],
  ["dot", "purr"],
  ["purr", "dotbrand"],
  ["dotbrand", "pounce"],
  ["nored", "pounce"],
  ["nored", "bluecard"],
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
  {
    "id": "whiskr",
    "name": "Whiskr (Demo project)",
    "brief": {
      MC: "A swipe app for cat playdates. I lead marketing.",
      CH: "A swipe app for cat playdates. I run the company.",
      TR: "A swipe app for cat playdates. I lead research and brand.",
      KL: "A swipe app for cat playdates. I lead the app.",
    }[VIEWER] ?? "",
    "members": [
      "MC",
      "CH",
      "TR",
      "KL"
    ],
    "updated": "25 min ago"
  },
  {
      "id": "studio",
      "name": "AI Studio · Recall",
      "brief": "Recall turns course PDFs into cited practice questions. Prototype due Nov 4.",
      "members": [
        "MC",
        "JK"
      ],
      "updated": "1 hour ago"
    },
  // Empty example projects, so everyone has more than one. Only Whiskr has content.
  { id: "holiday", name: "Holiday campaign", brief: "", members: ["MC", "CH"], updated: "2 days ago" },
  { id: "seed", name: "Seed round", brief: "", members: ["CH"], updated: "3 days ago" },
  { id: "panel", name: "Cat owner panel", brief: "", members: ["TR", "KL"], updated: "4 days ago" },
  { id: "android", name: "Android app", brief: "", members: ["KL"], updated: "1 week ago" },
]

// Projects with no work in them yet: their pages show empty states.
export const EMPTY_PROJECTS = ["holiday", "seed", "panel", "android"]

export type TaskStatus = "todo" | "prog" | "review" | "done"
export type Priority = "urgent" | "high" | "med" | "low" | "none"
export type Task = {
  id: string
  title: string
  project: string
  part: string
  owner: string
  // More people on the task besides the owner.
  assignees?: string[]
  due: string
  status: TaskStatus
  priority: Priority
  decision?: string
  description?: string
  comments?: { who: string; text: string; when: string }[]
  // Context the task came from: meetings, decisions and artifacts. Hidden until opened.
  related?: { meetings?: string[]; decisions?: string[]; artifacts?: string[] }
  // Every task suggests a tool and a prompt to start it there. The prompt tells the tool to read
  // the context from Whyspace over MCP, then says how to do the task. Update tasks (added when a
  // decision changes something you own) are done once the work is updated.
  prompt?: string
  tool?: string
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", prog: "In progress", review: "In review", done: "Done" }
export const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Urgent", high: "High", med: "Medium", low: "Low", none: "No priority" }

const ALL_TASKS: Task[] = [
  {
    "id": "t7",
    "tool": "Claude",
    "prompt": "Use the Whyspace MCP to read Whiskr's Marketing thread.\n\nThen check the posters and the promo video against its decisions. List anything that doesn't match, with the fix.",
    "related": {"decisions": ["nored", "pounce"], "meetings": ["s3"], "artifacts": ["w6", "w8"]},
    "description": "Check both match this week's decisions.",
    "title": "Review the posters and video before launch",
    "project": "Whiskr (Demo project)",
    "part": "Marketing",
    "owner": "CH",
    "assignees": ["MC"],
    "due": "Fri Oct 30",
    "status": "todo",
    "priority": "med",
    "decision": "short"
  },
  {
    "id": "t1",
    "related": {"decisions": ["nored", "dotbrand"], "artifacts": ["w1", "w6"]},
    "title": "Change the posters from red to blue",
    "project": "Whiskr (Demo project)",
    "part": "Marketing",
    "owner": "MC",
    "due": "Fri Oct 30",
    "status": "todo",
    "priority": "high",
    "decision": "nored",
    "description": "Cats can't see red. Add the swipe dot too.",
    "tool": "Figma",
    "prompt": "Change the 3 posters from red to the blue in brand guidelines v3, and add the dot from the logo. Cats can't see red."
  },
  {
    "id": "t2",
    "tool": "Claude",
    "prompt": "Use the Whyspace MCP to read Whiskr's Marketing thread and the promo video plan.\n\nThen plan the 15-second promo video:\n1. A one-line idea.\n2. A shot list: seconds, shot, text on screen.\n3. Start with Luna's real clip, use blue, end on the dot.\n\nAsk me before changing anything already decided.",
    "related": {"decisions": ["pounce", "nored"], "meetings": ["s3"], "artifacts": ["w7", "w1"]},
    "description": "Start with a real cat clip. Use blue, not red.",
    "title": "Plan the 15-second promo video",
    "project": "Whiskr (Demo project)",
    "part": "Marketing",
    "owner": "MC",
    "assignees": ["CH"],
    "due": "Mon Nov 2",
    "status": "prog",
    "priority": "high",
    "decision": "short"
  },
  {
    "id": "t3",
    "tool": "Claude Code",
    "prompt": "Use the Whyspace MCP to read Whiskr's App thread.\n\nThen add the dot to the swipe card: it moves toward the swipe direction and purrs. Use the blue color tokens.",
    "related": {"decisions": ["dot"], "meetings": ["s1", "s2"], "artifacts": ["w5", "w4"]},
    "description": "The dot moves toward the swipe and purrs.",
    "title": "Add the moving dot to the swipe card",
    "project": "Whiskr (Demo project)",
    "part": "App",
    "owner": "KL",
    "due": "Fri Oct 30",
    "status": "prog",
    "priority": "high",
    "decision": "purr"
  },
  {
    "id": "t4",
    "related": {"artifacts": ["w1", "w5"]},
    "title": "Change the app from red to blue",
    "project": "Whiskr (Demo project)",
    "part": "App",
    "owner": "KL",
    "due": "Thu Oct 29",
    "status": "done",
    "priority": "med",
    "decision": "nored",
    "description": "The buttons are still red.",
    "tool": "Claude Code",
    "prompt": "Use the Whyspace MCP to read the decision \"Change the brand color from red to blue\" in Whiskr's Brand thread.\n\nThen replace red in the app with the blue tokens from brand guidelines v3. Cats can't see red."
  },
  {
    "id": "t5",
    "tool": "Claude",
    "prompt": "Use the Whyspace MCP to read Whiskr's Brand thread.\n\nThen draft a brand guidelines page for the dot in the logo: sizes, motion, and do and don't examples.",
    "related": {"decisions": ["dot"], "artifacts": ["w1"]},
    "description": "One guidelines page: sizes, motion, do and don't.",
    "title": "Add the swipe dot to the logo",
    "project": "Whiskr (Demo project)",
    "part": "Brand",
    "owner": "TR",
    "due": "Oct 23",
    "status": "done",
    "priority": "med",
    "decision": "dotbrand"
  },
  {
    "id": "t6",
    "tool": "Claude",
    "prompt": "Use the Whyspace MCP to read Whiskr's Research thread.\n\nThen summarize the cat test videos: what each cat reacted to, with timestamps.",
    "related": {"meetings": ["s1"], "artifacts": ["w3", "w2"]},
    "description": "Note what each cat reacted to.",
    "title": "Review the cat test videos",
    "project": "Whiskr (Demo project)",
    "part": "Research",
    "owner": "TR",
    "due": "Oct 22",
    "status": "done",
    "priority": "med",
    "decision": "move"
  },
  {
      "id": "t11",
      "tool": "Claude Code",
      "prompt": "Use the Whyspace MCP to read Recall's Prototype thread and the decision \"Build one working upload-to-feedback flow\".\n\nThen connect the upload, quiz and feedback screens to Jordan's endpoint, with loading, failure and retry states.",
      "related": {"meetings": ["s9"], "artifacts": ["a15", "a16"]},
      "title": "Connect Recall’s upload, quiz, and feedback screens",
      "project": "AI Studio · Recall",
      "part": "Prototype",
      "owner": "MC",
      "due": "Wed Oct 28",
      "status": "prog",
      "priority": "high",
      "decision": "figma",
      "description": "Use Jordan’s endpoint. Design loading, failure and retry states."
    },
  {
      "id": "t12",
      "tool": "Claude",
      "prompt": "Use the Whyspace MCP to read Recall's Concept thread and the decision \"Attach a source page to every answer explanation\".\n\nThen propose 3 ways a citation opens the right PDF page without leaving the question. Pick one and say why.",
      "related": {"artifacts": ["a15", "a13"]},
      "title": "Design a source citation that opens the right PDF page",
      "project": "AI Studio · Recall",
      "part": "Prototype",
      "owner": "MC",
      "due": "Thu Oct 29",
      "status": "todo",
      "priority": "high",
      "decision": "cite",
      "description": "Verify an answer without losing the question."
    },
  {
      "id": "t13",
      "tool": "Claude",
      "prompt": "Use the Whyspace MCP to read Recall's Prototype thread and the decision \"Generate five practice questions from one course PDF\".\n\nThen score 15 generated questions from three course PDFs for support, correctness and clarity, in one table.",
      "related": {"artifacts": ["a15"]},
      "title": "Evaluate generated questions on three course PDFs",
      "project": "AI Studio · Recall",
      "part": "Prototype",
      "owner": "JK",
      "due": "Tue Oct 27",
      "status": "prog",
      "priority": "high",
      "decision": "slides",
      "description": "Score 15 questions for support, correctness and clarity."
    },
  {
      "id": "t14",
      "tool": "Claude",
      "prompt": "Use the Whyspace MCP to read Recall's Interviews thread and the classmate interviews.\n\nThen write a short message inviting four classmates to test the prototype, each bringing one course PDF, with three time slots.",
      "related": {"artifacts": ["a11"]},
      "title": "Schedule four classmate tests for the working prototype",
      "project": "AI Studio · Recall",
      "part": "Interviews",
      "owner": "MC",
      "due": "Fri Oct 30",
      "status": "todo",
      "priority": "med",
      "description": "Each brings one course PDF."
    },
  {
      "id": "t15",
      "tool": "Claude",
      "prompt": "Use the Whyspace MCP to read Recall's Final crit thread: \"Show model failures alongside the successful demo\" and the critique outline.\n\nThen outline our critique story in 5 beats and split the roles: Jordan on evaluation, Keller on interaction changes.",
      "related": {"decisions": ["presenter"], "meetings": ["s4"], "artifacts": ["a17"]},
      "title": "Outline our critique story and divide presentation roles",
      "project": "AI Studio · Recall",
      "part": "Final crit",
      "owner": "JK",
      "assignees": ["MC"],
      "due": "Fri Oct 30",
      "status": "todo",
      "priority": "med",
      "decision": "deck",
      "comments": [
        {
          "who": "JK",
          "text": "Can you cover the interaction changes? I’ll take evaluation.",
          "when": "Yesterday"
        }
      ]
    },
  {
      "id": "t16",
      "tool": "Claude",
      "prompt": "Use the Whyspace MCP to read Recall's Interviews thread.\n\nThen write a 6-question interview guide about how classmates review lectures before an exam.",
      "related": {"artifacts": ["a11", "a12"]},
      "title": "Interview six classmates about reviewing lectures",
      "project": "AI Studio · Recall",
      "part": "Interviews",
      "owner": "JK",
      "due": "Oct 13",
      "status": "done",
      "priority": "high",
      "decision": "cram"
    }
]

// Milestones per project, for the progress card on Overview.
export const MILESTONES: Record<string, { name: string; due: string }> = {
  whiskr: { name: "Cat-testable prototype", due: "Oct 30" },
  studio: { name: "Prototype due", due: "Nov 4" },
}

export type InboxKind = "review" | "change" | "alert" | "invite" | "mention"

export const INBOX_KIND_LABEL: Record<InboxKind, string> = {
  review: "Decisions to review",
  change: "Changes for you",
  alert: "Misalignment alerts",
  invite: "Meeting invites",
  mention: "Mentions",
}

export type InboxItem = {
  id: string; kind: InboxKind; from: string; project: string; summary: string
  time: string; unread: boolean; decision?: string; body: string
  author: { kind: "ai" | "person"; name: string }; source: string
  relatedArtifacts: { id: string; context: string; excerpt?: string }[]
  // Who gets it. Unset means Keller only.
  to?: string[]
  meeting?: { sessionId: string; startsAt: string; endsAt: string; timezone: string; agenda?: string }
  // Needs you: decide (confirm, review, sign off) or do (a task). Unset means FYI.
  need?: "decide" | "do"
  // Do items point at the update task Whyspace made; finishing it clears the item.
  task?: string
  // Which of your things it touches. The Inbox only gets items that touch your work.
  touches?: string
}

const ALL_INBOX: InboxItem[] = [
  {
    "need": "do", "task": "t4", "touches": "Your app design and prototype", "id": "i4",
    "to": ["KL"],
    "relatedArtifacts": [
      { "id": "w1", "context": "Brand guidelines · now blue" },
      { "id": "w5", "context": "Whiskr prototype · buttons still red" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Trevor's brand update",
    "kind": "alert",
    "from": "TR",
    "project": "Whiskr (Demo project)",
    "summary": "Cats can't see red. Change the app to blue.",
    "time": "2h",
    "unread": true,
    "decision": "nored",
    "body": "Trevor changed the brand color. Your task and Claude Code prompt are ready."
  },
  {
    "need": "decide", "touches": "Your brand guidelines", "id": "i5",
    "to": ["TR"],
    "relatedArtifacts": [
      { "id": "w7", "context": "Promo video plan" },
      { "id": "w1", "context": "Brand guidelines" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Keller's chat with Claude",
    "kind": "mention",
    "from": "MC",
    "project": "Whiskr (Demo project)",
    "summary": "Keller's promo video plan uses your brand guidelines",
    "time": "20m",
    "unread": true,
    "decision": "short",
    "body": "Check that it uses the new blue."
  },
  {
    "touches": "Marketing, which you follow", "id": "i9",
    "to": ["CH"],
    "relatedArtifacts": [{ "id": "w7", "context": "Promo video plan · length not confirmed" }],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Weekly digest",
    "kind": "change",
    "from": "MC",
    "project": "Whiskr (Demo project)",
    "summary": "This week: the brand changed to blue, and the app got a moving dot",
    "time": "1h",
    "unread": true,
    "decision": "short",
    "body": "Keller still needs to confirm the video length. The posters are still red."
  },
  {
    "need": "do", "task": "t1", "touches": "Your posters", "id": "i1",
    "relatedArtifacts": [
      { "id": "w1", "context": "Brand guidelines · now blue" },
      { "id": "w6", "context": "Posters · still red" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Trevor's brand update",
    "kind": "alert",
    "from": "TR",
    "project": "Whiskr (Demo project)",
    "summary": "Cats can't see red. Change your posters to blue.",
    "time": "1d",
    "unread": true,
    "decision": "nored",
    "body": "Trevor changed the brand color. Your task and Figma prompt are ready."
  },
  {
    "touches": "Your posters and promo video", "id": "i2",
    "relatedArtifacts": [
      { "id": "w3", "context": "Luna pounces · 0:42" },
      { "id": "w5", "context": "Whiskr prototype" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "to": ["MC", "CH"],
    "source": "Trevor's chat with Claude",
    "kind": "change",
    "from": "TR",
    "project": "Whiskr (Demo project)",
    "summary": "Make things move to get cats' attention",
    "time": "2d",
    "unread": false,
    "decision": "move",
    "body": "Trevor marked this important. Your posters and video should move too."
  },
  {
    "need": "decide", "touches": "Your promo video plan", "id": "i3",
    "relatedArtifacts": [{ "id": "w7", "context": "Promo video plan" }],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Your chat with Claude",
    "kind": "review",
    "from": "MC",
    "project": "Whiskr (Demo project)",
    "summary": "Confirm the promo video is 15 seconds",
    "time": "10m",
    "unread": true,
    "decision": "short",
    "body": "Claude guessed why from your chat. Confirm or fix it."
  },
  {
      "need": "decide", "touches": "Your feedback screen", "id": "i8",
      "relatedArtifacts": [{"id": "a16", "context": "Endpoint changes · verified source passages"}, {"id": "a15", "context": "Feedback screen and source preview"}],
      "author": {"kind": "ai", "name": "Whyspace AI"},
      "source": "Jordan\u2019s source-citation implementation update",
      "kind": "review",
      "from": "JK",
      "project": "AI Studio · Recall",
      "summary": "Jordan proposed a source page on every answer",
      "time": "1h",
      "unread": true,
      "decision": "cite",
      "body": "Check how citations fit your feedback screen."
    },
  {
      "need": "decide", "touches": "Your working prototype", "id": "i7",
      "relatedArtifacts": [{"id": "a16", "context": "Evaluation cases and source-support results"}, {"id": "a15", "context": "Current behavior for unsupported answers"}],
      "author": {"kind": "ai", "name": "Whyspace AI"},
      "source": "Jordan\u2019s first question evaluation \u00b7 15 questions",
      "kind": "alert",
      "from": "JK",
      "project": "AI Studio · Recall",
      "summary": "Two questions have no source passage",
      "time": "4h",
      "unread": true,
      "decision": "slides",
      "body": "Reject them, or show an unavailable state?"
    },
  {
      "touches": "Your part of the critique", "id": "i6",
      "relatedArtifacts": [{"id": "a17", "context": "The critique outline where Jordan mentioned you"}, {"id": "a15", "context": "Interaction changes for the demo"}],
      "author": {"kind": "person", "name": "Jordan Kim"},
      "source": "Comment in Recall \u00b7 critique outline",
      "kind": "mention",
      "from": "JK",
      "project": "AI Studio · Recall",
      "summary": "Jordan mentioned you in the critique outline",
      "time": "1d",
      "unread": false,
      "decision": "presenter",
      "body": "“Can you show the interaction changes? I’ll cover evaluation.”"
    }
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
}

const ALL_SESSIONS: Session[] = [
  {
    "id": "s1",
    "project": "whiskr",
    "title": "Cat video review",
    "host": "TR",
    "people": ["TR", "KL"],
    "status": "Ended",
    "when": "Oct 22",
    "length": "16 min"
  },
  {
    "id": "s2",
    "project": "whiskr",
    "title": "First cat test",
    "host": "KL",
    "people": ["KL", "TR"],
    "status": "Ended",
    "when": "Oct 21",
    "length": "40 min"
  },
  {
    "id": "s3",
    "project": "whiskr",
    "title": "Poster and video review",
    "host": "MC",
    "people": ["MC", "CH", "TR", "KL"],
    "status": "Scheduled",
    "when": "Fri Oct 30, 10:00"
  },
  {
      "id": "s9",
      "project": "studio",
      "title": "Recall prototype check-in",
      "host": "MC",
      "people": [
        "MC",
        "JK"
      ],
      "status": "Scheduled",
      "when": "Wed Oct 28, 18:00"
    },
  {
      "id": "s4",
      "project": "studio",
      "title": "Scope our working AI prototype",
      "host": "JK",
      "people": [
        "JK",
        "MC"
      ],
      "status": "Ended",
      "when": "Oct 21",
      "length": "45 min"
    }
]

// Artifacts are links to the work wherever it lives (Figma, Drive, GitHub, Runway, an AI chat).
// Only manual uploads and pasted text are stored in Whyspace. Each belongs to a thread
// (the internal field is still `part`), so the decisions canvas can show them in place.
export type ArtifactKind = "Prototype" | "Figma" | "Repo" | "Doc" | "AI output" | "Sheet" | "Video"
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
  content?: { heading: string; paragraphs: string[] }
  files?: string[] // repos: recently changed files
  pr?: string // repos: the open pull request
  version?: string
}

const ALL_ARTIFACTS: Artifact[] = [
  {
    "id": "w1",
    "project": "whiskr",
    "part": "Brand",
    "name": "Brand guidelines",
    "kind": "Figma",
    "owner": "TR",
    "updated": "Oct 23",
    "decisions": 2,
    "version": "v3",
    "meta": "Blue brand color, swipe dot in the logo · 18 frames"
  },
  {
    "id": "w2",
    "project": "whiskr",
    "part": "Research",
    "name": "Cat research",
    "kind": "AI output",
    "owner": "TR",
    "updated": "Oct 23",
    "decisions": 2,
    "meta": "Perplexity · what cats see and hear"
  },
  {
    "id": "w3",
    "project": "whiskr",
    "part": "Research",
    "name": "Cat test videos",
    "kind": "Video",
    "owner": "TR",
    "updated": "Oct 21",
    "decisions": 2,
    "meta": "Luna, Mochi and Biscuit · 3 clips"
  },
  {
    "id": "w4",
    "project": "whiskr",
    "part": "App",
    "name": "App design",
    "kind": "Figma",
    "owner": "KL",
    "updated": "Yesterday",
    "decisions": 2,
    "meta": "Swipe card with the moving dot · 24 frames"
  },
  {
    "id": "w5",
    "project": "whiskr",
    "part": "App",
    "name": "Whiskr prototype",
    "kind": "Prototype",
    "owner": "KL",
    "updated": "Today",
    "decisions": 3,
    "meta": "localhost:5173 · swipe card with the moving dot"
  },
  {
    "id": "w6",
    "project": "whiskr",
    "part": "Marketing",
    "name": "Posters",
    "kind": "Figma",
    "owner": "MC",
    "updated": "Oct 20",
    "decisions": 1,
    "meta": "3 posters · still in red"
  },
  {
    "id": "w7",
    "project": "whiskr",
    "part": "Marketing",
    "name": "Promo video plan",
    "kind": "Doc",
    "owner": "MC",
    "updated": "Today",
    "decisions": 2,
    "meta": "From Claude · 15 seconds, 3 shots",
    "content": {
      "heading": "Promo video plan",
      "paragraphs": [
        "0–5 s: Luna's real pounce from testing.",
        "5–10 s: The moving dot leads a swipe and purrs.",
        "10–15 s: The logo on a blue end card."
      ]
    }
  },
  {
    "id": "w8",
    "project": "whiskr",
    "part": "Marketing",
    "name": "Promo video",
    "kind": "Video",
    "owner": "MC",
    "updated": "Today",
    "decisions": 1,
    "meta": "Runway · set up from the plan"
  },
  {
      "id": "a11",
      "project": "studio",
      "part": "Interviews",
      "name": "Recall · classmate interviews",
      "kind": "Doc",
      "owner": "JK",
      "updated": "Today",
      "decisions": 1,
    "meta": "6 interviews · lecture-review habits"
    },
  {
      "id": "a12",
      "project": "studio",
      "part": "Interviews",
      "name": "Recall · research themes",
      "kind": "AI output",
      "owner": "JK",
      "updated": "Yesterday",
      "decisions": 1,
    "meta": "Claude synthesis · linked to interview quotes"
    },
  {
      "id": "a13",
      "project": "studio",
      "part": "Concept",
      "name": "Recall · concept exploration",
      "kind": "Figma",
      "owner": "MC",
      "updated": "Today",
      "decisions": 2,
      "meta": "3 directions · selected PDF-to-practice loop"
    },
  {
      "id": "a14",
      "project": "studio",
      "part": "Concept",
      "name": "AI Studio · project brief",
      "kind": "Doc",
      "owner": "JK",
      "updated": "Yesterday",
      "decisions": 0,
      "meta": "Two-person project · Nov 4 prototype · Dec 10 critique"
    },
  {
      "id": "a15",
      "project": "studio",
      "part": "Prototype",
      "name": "Recall · working prototype",
      "kind": "Prototype",
      "owner": "MC",
      "updated": "Today",
      "decisions": 2,
      "meta": "PDF upload, 5 questions, feedback, source preview"
    },
  {
      "id": "a16",
      "project": "studio",
      "part": "Prototype",
      "name": "ai-studio/recall",
      "kind": "Repo",
      "owner": "JK",
      "updated": "Yesterday",
      "decisions": 1,
      "meta": "feat/source-citations · PR #7 · evaluation in progress",
      "files": [
        "src/upload/PdfUpload.tsx",
        "src/api/generate.ts",
        "evals/source-support.json"
      ],
      "pr": "PR #7 · Return verified source passages · evaluation in progress"
    },
  {
      "id": "a17",
      "project": "studio",
      "part": "Final crit",
      "name": "Recall · critique outline",
      "kind": "Doc",
      "owner": "JK",
      "updated": "Today",
      "decisions": 1,
      "meta": "Problem, demo, evaluation failures, next iteration"
    }
]

// What each person, and their AI tool, is working on right now. High level only, never prompts.
export type Activity = { project: string; who: string; tool?: string; aiDoing?: string; doing: string; part: string; since: string; state: "active" | "idle"; artifact?: string }

const ALL_ACTIVITY: Activity[] = [
  { "project": "whiskr", "who": "MC", "tool": "Claude", "aiDoing": "Planning the promo video", "artifact": "w7", "doing": "Promo video", "part": "Marketing", "since": "25 min", "state": "active" },
  { "project": "whiskr", "who": "KL", "tool": "Claude Code", "aiDoing": "Adding the purr to the dot", "artifact": "w5", "doing": "Swipe card", "part": "App", "since": "40 min", "state": "active" },
  { "project": "whiskr", "who": "TR", "tool": "Perplexity", "aiDoing": "Researching what cats hear", "artifact": "w2", "doing": "Cat research", "part": "Research", "since": "1 h", "state": "active" },
  { "project": "whiskr", "who": "CH", "doing": "Read the week's decisions", "part": "Brand", "since": "Yesterday", "state": "idle" },
  {
      "project": "studio",
      "who": "MC",
      "tool": "Claude",
      "aiDoing": "Exploring citation states",
      "artifact": "a15",
      "doing": "Recall feedback and source preview",
      "part": "Prototype",
      "since": "1 h",
      "state": "active"
    },
  {
      "project": "studio",
      "who": "JK",
      "tool": "Cursor",
      "aiDoing": "Scoring questions against sources",
      "artifact": "a16",
      "doing": "Recall evaluation on three course PDFs",
      "part": "Prototype",
      "since": "45 min",
      "state": "active"
    }
]

// Milestone timeline per project: next milestone and target date on Overview.
export const TIMELINE: Record<string, { name: string; date: string; done: boolean }[]> = {
  whiskr: [
    { name: "Kickoff", date: "Oct 5", done: true },
    { name: "First cat test", date: "Oct 21", done: true },
    { name: "Cat-testable prototype", date: "Oct 30", done: false },
    { name: "Launch campaign", date: "Nov 16", done: false },
  ],
  studio: [
    { name: "Kickoff", date: "Sep 30", done: true },
    { name: "Concept review", date: "Oct 15", done: true },
    { name: "Prototype due", date: "Nov 4", done: false },
    { name: "Usability test", date: "Nov 18", done: false },
    { name: "Final crit", date: "Dec 10", done: false },
  ],
}

// Links pinned to the top of a project's Overview: where the real work lives.
export const PINNED: Record<string, string[]> = { whiskr: ["w1", "w5", "w6"], studio: ["a14", "a15", "a16"] }

export const AI_TOOLS = [
  { id: "claude", name: "Claude", desc: "Desktop app and Claude Code", connected: true },
  { id: "cursor", name: "Cursor", desc: "Editor sessions and chat", connected: true },
  { id: "chatgpt", name: "ChatGPT", desc: "Desktop app", connected: false },
  { id: "figma", name: "Figma", desc: "Comments and Dev Mode", connected: true },
]

export const PLANS: { name: Plan; price: string; blurb: string; features: string[] }[] = [
  { name: "Free", price: "$0", blurb: "For trying it with a small team", features: ["Up to 5 people", "5 projects", "Decision log and inbox", "Connect 2 AI tools each"] },
  { name: "Pro", price: "$12", blurb: "Per person, per month", features: ["Unlimited projects", "Team view", "Misalignment alerts", "Your Duet answers in Slack"] },
  { name: "Business", price: "$24", blurb: "Per person, per month", features: ["Everything in Pro", "SSO and audit log", "Admin roles", "Priority support"] },
]

// Whiskr's summaries at each stage of the week (see lib/stage.ts).
const WHISKR_SUMMARY = [
  { project: "Whiskr is a swipe app for cats. The brand color is red.", week: "Kelly tested the app with 3 cats. Trevor has the videos to review." },
  { project: "Whiskr is a swipe app for cats. A moving dot now shows cats where to swipe.", week: "In testing, cats only noticed things that moved. So we added a moving dot that shows them where to swipe." },
  { project: "Whiskr is a swipe app for cats. The brand color changed from red to blue, and a moving dot shows cats where to swipe.", week: "Research found that cats can't see red, so Trevor changed the brand color to blue. The posters are still red." },
  { project: "Whiskr is a swipe app for cats. The brand color changed from red to blue, and a moving dot shows cats where to swipe.", week: "The brand color is now blue, but the posters are still red. Keller planned a 15-second promo video." },
][Math.min(STAGE, 4) - 1]

// AI summaries shown on the decisions canvas, one per part and one per project.
// Written by Whyspace from the decisions themselves, refreshed when one changes.
export const PART_SUMMARY: Record<string, string> = {
  Research: "Cats only notice things that move.",
  Brand: STAGE < 3 ? "The brand color is red." : "The brand color changed from red to blue, because cats can't see red. The logo now has the swipe dot.",
  App: "A moving dot shows cats where to swipe, and it purrs.",
  Marketing: "The promo video is 15 seconds and starts with a real cat clip.",
  Interviews: "Students review one lecture at a time.",
  Concept: "Five cited questions from one course PDF.",
  Prototype: "One working loop by Nov 4. Keller: interaction; Jordan: generation.",
  "Final crit": "Show the demo, the failures and what changed.",
}
export const PROJECT_DECISION_SUMMARY: Record<string, string> = {
  whiskr: WHISKR_SUMMARY.project,
  studio: "Recall turns one PDF into five cited questions. Three things are open.",
}
// Each lead's view of the week opens with their own part. Christine sees the whole project.
const WHISKR_WEEK_FOR: Record<string, string[]> = {
  MC: [
    "Your posters use the red brand color. Trevor has the test videos.",
    "Cats only notice things that move. This will change your posters and video.",
    "Cats can't see red, so the brand is now blue. Your posters are still red.",
    "Confirm the promo video length. Your posters are still red.",
  ],
  TR: [
    "The videos from the first cat test are ready for you.",
    "Cats only notice things that move. The moving dot and the purr are logged.",
    "You changed the brand from red to blue. Kelly is updating the app; Keller's posters are still red.",
    "The app is blue now. Keller's posters are still red.",
  ],
  KL: [
    "You tested the app with 3 cats. Trevor has the videos.",
    "Your moving dot won. Next, build it with the purring sound.",
    "Cats can't see red, so change the app from red to blue.",
    "The app is blue and the dot purrs. Keller planned the promo video.",
  ],
}
export const WEEK_SUMMARY: Record<string, string> = {
  whiskr: WHISKR_WEEK_FOR[VIEWER]?.[Math.min(STAGE, 4) - 1] ?? WHISKR_SUMMARY.week,
  studio: "We switched to a real AI loop. Two questions lacked sources.",
}
export const CANVAS_EXTRAS: Record<string, { notePart?: string; note?: string; suggestion?: { name: string; from: string; moves: string[]; by: string; reason: string }; ask: string[] }> = {
  whiskr: {
    ...(STAGE >= 3 && { notePart: "Brand", note: "Trevor marked the change to blue as important · Oct 23" }),
    ask: ["Why did the brand change to blue?", "What is the moving dot for?", "What needs me?", "What changed this week?"],
  },
  studio: {
    notePart: "Prototype", note: "Jordan linked the first question evaluation · Today",
    ask: ["Why build a working AI prototype?", "Which questions lacked source support?", "Show me Recall", "What do Jordan and I own?"],
  },
}

// Whiskr plays out over one week (see lib/stage.ts). Each item shows from the stage
// where it first happens, and until the stage where it is replaced. Unlisted items always show.
const FROM: Record<string, number> = {
  move: 2, dot: 2, purr: 2, dotbrand: 3, nored: 3, short: 4, pounce: 4, bluecard: 4, redcard: 5,
  t3: 2, t1: 3, t4: 3, t5: 3, t2: 4, t7: 5,
  i2: 2, i1: 3, i4: 3, i3: 4, i5: 4, i9: 5,
  s3: 4,
  w2: 2, w7: 4, w8: 4,
}
const UNTIL: Record<string, number> = { red: 2 }

// How an item looked at an earlier stage, before later events changed it.
const EARLIER: Record<string, { until: number; patch: object }[]> = {
  t6: [{ until: 1, patch: { status: "todo" } }],
  s1: [
    { until: 1, patch: { status: "Scheduled", when: "Thu Oct 22, 3:30 PM", length: undefined } },
    { until: 2, patch: { status: "Live", when: "Now", length: "8 min so far" } },
  ],
  w1: [{ until: 2, patch: { updated: "Oct 8", decisions: 1, version: "v2", meta: "Red brand color · 16 frames" } }],
  w4: [{ until: 2, patch: { updated: "Oct 20", meta: "Still swipe card, no dot · 20 frames" } }],
  w5: [{ until: 1, patch: { updated: "Oct 21", meta: "localhost:5173 · still swipe card" } }],
  w6: [{ until: 2, patch: { meta: "3 posters in red" } }],
  t4: [{ until: 3, patch: { status: "prog" } }],
}

const inWhiskr = (item: { project: string }) => item.project === "whiskr" || item.project === "Whiskr (Demo project)"

function staged<T extends { id: string; project: string }>(items: T[]): T[] {
  return items
    .filter((item) => !inWhiskr(item) || ((FROM[item.id] ?? 1) <= STAGE && STAGE <= (UNTIL[item.id] ?? Infinity)))
    .map((item) => {
      const earlier = inWhiskr(item) ? EARLIER[item.id]?.find((e) => STAGE <= e.until) : undefined
      return earlier ? { ...item, ...earlier.patch } : item
    })
}

// A test scenario (src/scenarios/data.ts) sets Whiskr up for its moment: its items join the lists
// (a hidden decision that a shown one replaces still resolves in decisionById), then its patches
// and hides apply over the stage's.
ALL_DECISIONS.unshift(...(PRESET.add?.decisions ?? []))
ALL_TASKS.unshift(...(PRESET.add?.tasks ?? []))
ALL_INBOX.unshift(...(PRESET.add?.inbox ?? []))
ALL_ARTIFACTS.push(...(PRESET.add?.artifacts ?? []))
LINKS.push(...(PRESET.links ?? []))
Object.assign(WEEK_SUMMARY, PRESET.week)
Object.assign(PART_SUMMARY, PRESET.part)
const HIDDEN = new Set(PRESET.hide ?? [])
function inScenario<T extends { id: string }>(items: T[], patches?: Record<string, Partial<T>>): T[] {
  return items.filter((item) => !HIDDEN.has(item.id)).map((item) => (patches?.[item.id] ? { ...item, ...patches[item.id] } : item))
}

// Decisions can be recorded while the prototype runs (a scenario's Claude records them as you talk).
// The list is changed in place, so every screen reads the latest, and a version lets hooks re-render.
export const DECISIONS: Decision[] = inScenario(staged(ALL_DECISIONS), PRESET.patch?.decisions)
let dataVersion = 0
const dataListeners = new Set<() => void>()
export const subscribeData = (l: () => void) => { dataListeners.add(l); return () => dataListeners.delete(l) }
export const getDataVersion = () => dataVersion
const bumpData = () => { dataVersion += 1; dataListeners.forEach((l) => l()) }
// Decisions recorded while the prototype runs (a scenario's tools write them), by id.
export const RECORDED = new Set<string>()
export function recordDecision(d: Decision) {
  const i = DECISIONS.findIndex((x) => x.id === d.id)
  if (i >= 0) DECISIONS.splice(i, 1)
  DECISIONS.push(d)
  RECORDED.add(d.id)
  bumpData()
}
export function patchDecision(id: string, patch: Partial<Decision>) {
  const i = DECISIONS.findIndex((d) => d.id === id)
  if (i >= 0) DECISIONS[i] = { ...DECISIONS[i], ...patch }
  bumpData()
}
// New LINKS edges [followed, follower] while the prototype runs: a recorded guess that follows a
// confirmed decision reads ◉ from precedent.
export function addLinks(links: [string, string][]) {
  for (const [a, b] of links) if (!LINKS.some(([x, y]) => x === a && y === b)) LINKS.push([a, b])
  bumpData()
}
export const TASKS = inScenario(staged(ALL_TASKS), PRESET.patch?.tasks)
export const INBOX = inScenario(staged(ALL_INBOX), PRESET.patch?.inbox).filter((item) => (item.to ?? ["MC"]).includes(VIEWER))
export const SESSIONS = staged(ALL_SESSIONS)
export const ARTIFACTS = inScenario(staged(ALL_ARTIFACTS), PRESET.patch?.artifacts)

// Where each artifact lives. Whyspace links out to it; "Whyspace" means it is stored here.
export type ArtifactSource = "Figma" | "Google Drive" | "GitHub" | "Runway" | "Claude" | "Notion" | "Link" | "Whyspace"
export const ARTIFACT_SOURCE: Record<string, { source: ArtifactSource; where: string; url?: string }> = {
  w1: { source: "Figma", where: "Whiskr / Brand", url: "https://figma.com" },
  w2: { source: "Whyspace", where: "Uploaded · research.md" },
  w3: { source: "Google Drive", where: "Whiskr / Footage", url: "https://drive.google.com" },
  w4: { source: "Figma", where: "Whiskr / App", url: "https://figma.com" },
  w5: { source: "Link", where: "whiskr-proto.vercel.app", url: "https://vercel.com" },
  w6: { source: "Figma", where: "Whiskr / Marketing", url: "https://figma.com" },
  w7: { source: "Google Drive", where: "Whiskr / Marketing", url: "https://docs.google.com" },
  w8: { source: "Runway", where: "Whiskr promo", url: "https://runwayml.com" },
  a11: { source: "Google Drive", where: "Recall / Interviews", url: "https://drive.google.com" },
  a12: { source: "Claude", where: "Chat · research themes", url: "https://claude.ai" },
  a13: { source: "Figma", where: "Recall / Concept", url: "https://figma.com" },
  a14: { source: "Notion", where: "AI Studio", url: "https://notion.so" },
  a15: { source: "Link", where: "recall-proto.vercel.app", url: "https://vercel.com" },
  a16: { source: "GitHub", where: "ai-studio/recall", url: "https://github.com" },
  a17: { source: "Google Drive", where: "Recall / Final crit", url: "https://docs.google.com" },
}
for (const a of PRESET.add?.artifacts ?? []) if (a.source) ARTIFACT_SOURCE[a.id] = { source: a.source, where: a.where ?? "", url: a.url }
// The projects the viewer is in. Use PROJECTS for lookups by id or name.
export const MY_PROJECTS = PROJECTS.filter((p) => p.members.includes(VIEWER))

// What the Whiskr team is doing at each stage.
const WHISKR_ACTIVITY: Record<number, Activity[]> = {
  1: [
    { project: "whiskr", who: "TR", doing: "Cat test videos", part: "Research", since: "1 h", state: "active", artifact: "w3" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Tidying the swipe card", doing: "Swipe card", part: "App", since: "2 h", state: "active", artifact: "w5" },
    { project: "whiskr", who: "MC", tool: "Figma", aiDoing: "Laying out the posters", doing: "Posters", part: "Marketing", since: "3 h", state: "active", artifact: "w6" },
  ],
  2: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching what cats hear", doing: "Cat video review · live", part: "Research", since: "8 min", state: "active", artifact: "w2" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Trying card motion", doing: "Cat video review · live", part: "App", since: "8 min", state: "active", artifact: "w5" },
  ],
  3: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching what cats see", doing: "Brand guidelines", part: "Brand", since: "1 h", state: "active", artifact: "w1" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Changing the buttons to blue", doing: "Swipe card", part: "App", since: "30 min", state: "active", artifact: "w5" },
  ],
}
export const ACTIVITY: Activity[] = [
  ...(PRESET.activity ?? WHISKR_ACTIVITY[STAGE] ?? ALL_ACTIVITY.filter(inWhiskr)),
  ...ALL_ACTIVITY.filter((a) => !inWhiskr(a)),
]

// Where each decision reaches: the artifacts it affects. An entry with a task needs an update
// until that task is done; without one, the artifact already follows the decision.
// `seen` is who has opened the decision since it changed.
const ALL_REACH: Record<string, { artifact: string; task?: string; seen: string[] }[]> = {
  move: [{ artifact: "w5", seen: ["KL", "TR", "MC"] }, { artifact: "w4", seen: ["KL"] }],
  dot: [{ artifact: "w4", seen: ["KL", "TR"] }, { artifact: "w5", task: "t3", seen: ["KL", "TR"] }],
  purr: [{ artifact: "w5", task: "t3", seen: ["KL", "TR"] }],
  red: [{ artifact: "w1", seen: ["TR"] }, { artifact: "w6", seen: ["MC"] }],
  dotbrand: [{ artifact: "w1", task: "t5", seen: ["TR", "KL"] }, { artifact: "w6", task: "t1", seen: ["TR"] }, { artifact: "w8", seen: ["MC"] }],
  nored: [{ artifact: "w1", seen: ["TR", "CH"] }, { artifact: "w4", task: "t4", seen: ["KL"] }, { artifact: "w5", task: "t4", seen: ["KL"] }, { artifact: "w6", task: "t1", seen: ["TR"] }],
  short: [{ artifact: "w7", seen: ["MC"] }, { artifact: "w8", task: "t2", seen: ["MC"] }],
  bluecard: [{ artifact: "w7", seen: ["MC"] }, { artifact: "w8", task: "t2", seen: ["MC"] }],
  redcard: [{ artifact: "w7", seen: ["MC"] }],
  pounce: [{ artifact: "w7", seen: ["MC"] }, { artifact: "w8", task: "t2", seen: ["MC", "TR"] }],
  cram: [{ artifact: "a12", seen: ["JK", "MC"] }],
  slides: [{ artifact: "a13", seen: ["MC", "JK"] }, { artifact: "a15", seen: ["MC", "JK"] }],
  cite: [{ artifact: "a15", task: "t12", seen: ["JK"] }, { artifact: "a16", seen: ["JK"] }],
  figma: [{ artifact: "a15", task: "t11", seen: ["MC", "JK"] }, { artifact: "a16", seen: ["JK", "MC"] }],
  deck: [{ artifact: "a17", task: "t15", seen: ["JK"] }],
  presenter: [{ artifact: "a17", seen: ["JK", "MC"] }],
}
for (const [id, entries] of Object.entries(PRESET.reach ?? {})) ALL_REACH[id] = [...(ALL_REACH[id] ?? []), ...entries]

// Reach as it stands at this stage: only artifacts and tasks that exist yet.
export function reachOf(decisionId: string, tasks: Task[] = TASKS) {
  return (ALL_REACH[decisionId] ?? []).flatMap((entry) => {
    const artifact = ARTIFACTS.find((a) => a.id === entry.artifact)
    if (!artifact) return []
    const task = tasks.find((t) => t.id === entry.task)
    return [{ artifact, task, seen: entry.seen, needsUpdate: !!task && task.status !== "done" }]
  })
}

// A decision as of this stage, or one that a current decision replaced (for "What it replaced").
export const decisionById = (id?: string) =>
  DECISIONS.find((d) => d.id === id) ?? ALL_DECISIONS.find((d) => d.id === id && DECISIONS.some((x) => x.replaces === id))

// Decisions each viewer follows without leading the part or owning the work.
const FOLLOWING: Record<string, string[]> = { CH: ["nored", "short", "dotbrand"], MC: ["dotbrand"], KL: ["nored"], TR: ["pounce"] }

// Parts the viewer leads: the owner of a part's first decision leads it.
export const ledBy = (projectId: string, who = VIEWER) =>
  partsOf(ALL_DECISIONS.filter((d) => d.project === projectId)).filter((p) => p.owner === who).map((p) => p.name)

// The Inbox rule, also used to split Catch up: a decision touches your work when you
// lead its part, own an artifact it reaches, or follow it.
export function touchesMe(d: Decision) {
  return ledBy(d.project).includes(d.part) || (ALL_REACH[d.id] ?? []).some((r) => ARTIFACTS.find((a) => a.id === r.artifact)?.owner === VIEWER) || (FOLLOWING[VIEWER] ?? []).includes(d.id)
}

// One line per day for the Overview calendar.
export const DAY_INSIGHT: Record<string, Record<number, string>> = {
  whiskr: {
    21: "First cat test: cats ignored the still swipe card",
    22: "Cats follow movement, so we added a moving dot",
    23: "Cats can't see red, so the brand changed to blue",
    25: "Keller planned a 15-second promo video",
  },
  studio: {
    21: "A real AI loop instead of a clickable mock",
    23: "Show failures, not just the happy path",
    24: "Every explanation should cite its page",
  },
}

// The decisions that shaped each project, for someone who just joined.
export const SHAPED: Record<string, string[]> = {
  whiskr: ["move", "dot", "purr", "dotbrand", "nored", "pounce"],
  studio: ["cram", "slides", "figma", "cite", "deck"],
}

// Everything in a project that waits on the viewer, in two kinds. One rule, used by
// Catch up, the Inbox and the sidebar badge:
// - decide: inferred decisions you own or were asked to review, and open questions you own
// - do: your open tasks, including the update tasks Whyspace adds when a decision changes your work
export type NeedsYou =
  | { kind: "decide"; id: string; decision: Decision; ask: "confirm" | "review" | "answer" | "clash" }
  | { kind: "do"; id: string; task: Task }

export function needsYou(projectId: string, tasks: Task[] = TASKS, confirmed: Record<string, boolean> = {}): NeedsYou[] {
  const name = projectName(projectId)
  const asked = INBOX.filter((i) => i.project === name && i.need === "decide").map((i) => i.decision)
  const decide = DECISIONS.filter((d) => d.project === projectId && !confirmed[d.id] && (
    (d.status === "inf" && (d.owner === VIEWER || asked.includes(d.id))) || (d.status === "open" && d.owner === VIEWER) || (d.status !== "open" && d.status !== "inf" && asked.includes(d.id)) ||
    // Main design: a clash of yours waits on you until you take theirs or keep yours.
    (DESIGN === "b" && d.status === "flag" && d.owner === VIEWER)
  ))
  const day = (t: Task) => Number(t.due.match(/\d+/)?.[0] ?? 99) + (t.due.includes("Nov") ? 31 : 0)
  const mine = tasks.filter((t) => t.project === name && (t.owner === VIEWER || !!t.assignees?.includes(VIEWER)) && t.status !== "done").sort((a, b) => day(a) - day(b))
  return [
    ...decide.map((decision) => ({ kind: "decide" as const, id: decision.id, decision, ask: decision.status === "flag" ? "clash" as const : decision.status === "open" ? "answer" as const : decision.status === "inf" && decision.owner === VIEWER ? "confirm" as const : "review" as const })),
    ...mine.map((task) => ({ kind: "do" as const, id: task.id, task })),
  ]
}

// What changed since the viewer's last visit: Whiskr items that arrived at this stage or
// the one before; for other projects, recent decisions and artifacts.
export function changedSince(projectId: string): { decisions: Decision[]; artifacts: Artifact[] } {
  if (projectId === "whiskr") {
    const recent = (id: string) => (FROM[id] ?? 1) >= STAGE - 1 && STAGE > 1
    return {
      decisions: DECISIONS.filter((d) => d.project === projectId && recent(d.id)),
      artifacts: ARTIFACTS.filter((a) => a.project === projectId && recent(a.id)),
    }
  }
  return {
    decisions: DECISIONS.filter((d) => d.project === projectId && ["Today", "Yesterday"].includes(d.when ?? "")),
    artifacts: ARTIFACTS.filter((a) => a.project === projectId && /ago|Today|Yesterday/.test(a.updated)),
  }
}

// Project settings pages, opened from the project's ⋯ in the sidebar.
export const SETTINGS_TABS = [["general", "General"], ["people", "People"], ["ai-tools", "AI tools"]] as const

// The next milestone that isn't done yet.
export const nextMilestone = (projectId: string) => TIMELINE[projectId]?.find((m) => !m.done)
