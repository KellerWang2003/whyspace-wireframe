import type { Plan } from "@/lib/store"
import { STAGE } from "@/lib/stage"
import { VIEWER } from "@/lib/viewer"

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
  // What backs the why: a clip, a source, a test result. Shown first on the decision sheet.
  evidence?: Evidence[]
  // Options the team weighed and didn't pick, with the reason.
  options?: { title: string; why: string }[]
  // The decision this one replaced (an id, so the sheet can show who decided it and when).
  replaces?: string
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
    "title": "Every element should move to catch a cat's attention",
    "part": "Research",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Live session",
    "why": "Luna ignored the static card, then pounced on a moving notification.",
    "snippet": "She only cares when something moves. We need the element to move.",
    "evidence": [{ "kind": "clip", "label": "Luna at 5:55", "artifact": "w3" }],
    "visual": { "before": "Static swipe card", "after": "Every element moves" }
  },
  {
    "id": "dot",
    "project": "whiskr",
    "title": "A moving dot leads the swipe",
    "part": "App",
    "status": "conf",
    "owner": "KL",
    "by": "Kelly and Trevor",
    "when": "Oct 22",
    "tool": "Claude Code",
    "why": "The dot works on the app, billboard and video.",
    "evidence": [{ "kind": "clip", "label": "Canvas comparison · footage review", "detail": "Three directions compared live.", "artifact": "w5" }],
    "options": [
      { "title": "A wiggling card", "why": "Hard for a paw to hit" },
      { "title": "A dangling feather", "why": "Covered the cat's photo" }
    ],
    "visual": { "before": "Static swipe card", "after": "A moving dot leads the swipe" }
  },
  {
    "id": "purr",
    "project": "whiskr",
    "title": "The dot purrs when it moves",
    "part": "App",
    "status": "conf",
    "owner": "KL",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Perplexity",
    "why": "Cats feel a 25 Hz buzz through their paws, like a purr.",
    "evidence": [{ "kind": "research", "label": "Perplexity · 3 sources", "artifact": "w2" }],
    "options": [{ "title": "A chirp sound", "why": "Lost when the phone is on mute" }]
  },
  {
    "id": "red",
    "project": "whiskr",
    "title": "Tuna red as the primary color",
    "part": "Brand",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 8",
    "tool": "Figma",
    "why": "Playful, food-related and bright on a phone."
  },
  {
    "id": "dotbrand",
    "project": "whiskr",
    "title": "The purring dot is a brand element",
    "part": "Brand",
    "status": "conf",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 22",
    "tool": "Figma",
    "why": "Cats should recognize the dot everywhere, not just in the app.",
    "options": [{ "title": "Keep the dot in the app only", "why": "Cats wouldn't know it elsewhere" }]
  },
  {
    "id": "nored",
    "project": "whiskr",
    "title": "Drop red from the brand; use blue and yellow",
    "part": "Brand",
    "status": "chg",
    "owner": "TR",
    "by": "Trevor",
    "when": "Oct 23",
    "tool": "Claude",
    "was": "Tuna red as the primary color",
    "why": "Cats see red as gray; blue and yellow stand out.",
    "replaces": "red",
    "evidence": [{ "kind": "research", "label": "Cat vision research · Perplexity", "artifact": "w2" }],
    "options": [{ "title": "Keep red as an accent", "why": "Still reads as gray to cats" }],
    "visual": { "before": "Tuna red", "after": "Blue and yellow" },
    "replies": [
      { "who": "MC", "text": "Posters too? They're mostly for owners.", "when": "Oct 23" },
      { "who": "TR", "text": "Yes, anything cats might see.", "when": "Oct 23" }
    ]
  },
  {
    "id": "short",
    "project": "whiskr",
    "title": "The promo video runs 15 seconds",
    "part": "Marketing",
    "status": "inf",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "snippet": "Let's keep it short, like 15 seconds.",
    "why": "Inferred: cats lose interest fast.",
    "evidence": [{ "kind": "chat", "label": "Keller's chat with Claude", "detail": "\"Let's keep it short, like 15 seconds.\"" }],
    "options": [{ "title": "30 seconds", "why": "Too long for cats" }]
  },
  {
    "id": "pounce",
    "project": "whiskr",
    "title": "Open the video on Luna's real pounce",
    "part": "Marketing",
    "status": "conf",
    "owner": "MC",
    "by": "Keller",
    "when": "Today",
    "tool": "Claude",
    "why": "A real catch shows the idea in one second.",
    "evidence": [{ "kind": "clip", "label": "Luna's pounce", "detail": "The catch at 5:55 is the opening shot.", "artifact": "w3" }],
    "options": [{ "title": "Open on the logo", "why": "Doesn't show the idea" }]
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
    "name": "Whiskr",
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
    }
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
  // Update tasks: Whyspace adds one when a decision changes something you own.
  // The prompt is ready to paste into the tool; finishing the task marks the work updated.
  prompt?: string
  tool?: string
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", prog: "In progress", review: "In review", done: "Done" }
export const PRIORITY_LABEL: Record<Priority, string> = { urgent: "Urgent", high: "High", med: "Medium", low: "Low", none: "No priority" }

const ALL_TASKS: Task[] = [
  {
    "id": "t7",
    "title": "Review the poster and promo video before launch",
    "project": "Whiskr",
    "part": "Marketing",
    "owner": "CH",
    "due": "Fri Oct 30",
    "status": "todo",
    "priority": "med",
    "decision": "short"
  },
  {
    "id": "t1",
    "title": "Update the poster for the moving dot and new palette",
    "project": "Whiskr",
    "part": "Marketing",
    "owner": "MC",
    "due": "Fri Oct 30",
    "status": "todo",
    "priority": "high",
    "decision": "nored",
    "description": "Swap tuna red for blue and yellow; add the dot.",
    "tool": "Figma",
    "prompt": "Recolor the 3 posters to the blue and yellow in brand guidelines v3 and add the purring dot. Cats see red as gray."
  },
  {
    "id": "t2",
    "title": "Plan and storyboard the 15-second promo video",
    "project": "Whiskr",
    "part": "Marketing",
    "owner": "MC",
    "due": "Mon Nov 2",
    "status": "prog",
    "priority": "high",
    "decision": "short",
    "subtasks": [
      {
        "title": "Write the plan with Claude",
        "done": true
      },
      {
        "title": "Storyboard in Runway",
        "done": false
      },
      {
        "title": "Review with Christine",
        "done": false
      }
    ]
  },
  {
    "id": "t3",
    "title": "Build the purring dot into the swipe card",
    "project": "Whiskr",
    "part": "App",
    "owner": "KL",
    "due": "Fri Oct 30",
    "status": "prog",
    "priority": "high",
    "decision": "purr"
  },
  {
    "id": "t4",
    "title": "Recolor the app to blue and yellow",
    "project": "Whiskr",
    "part": "App",
    "owner": "KL",
    "due": "Thu Oct 29",
    "status": "done",
    "priority": "med",
    "decision": "nored",
    "description": "App buttons still use tuna red.",
    "tool": "Claude Code",
    "prompt": "Replace tuna red in the swipe card with the blue and yellow tokens from brand guidelines v3. Cats see red as gray."
  },
  {
    "id": "t5",
    "title": "Add the purring dot to the brand guidelines",
    "project": "Whiskr",
    "part": "Brand",
    "owner": "TR",
    "due": "Oct 23",
    "status": "done",
    "priority": "med",
    "decision": "dotbrand"
  },
  {
    "id": "t6",
    "title": "Review Monday's cat-test footage",
    "project": "Whiskr",
    "part": "Research",
    "owner": "TR",
    "due": "Oct 22",
    "status": "done",
    "priority": "med",
    "decision": "move"
  },
  {
      "id": "t11",
      "title": "Connect Recall’s upload, quiz, and feedback screens",
      "project": "AI Studio · Recall",
      "part": "Prototype",
      "owner": "MC",
      "due": "Wed Oct 28",
      "status": "prog",
      "priority": "high",
      "decision": "figma",
      "description": "Use Jordan’s endpoint. Design loading, failure and retry states.",
      "subtasks": [
        {
          "title": "Upload and processing states",
          "done": true
        },
        {
          "title": "Answer submission and feedback",
          "done": false
        },
        {
          "title": "Source-page preview and retry",
          "done": false
        }
      ]
    },
  {
      "id": "t12",
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
      "title": "Outline our critique story and divide presentation roles",
      "project": "AI Studio · Recall",
      "part": "Final crit",
      "owner": "JK",
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
  invite: "Live session invites",
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
      { "id": "w1", "context": "Brand guidelines · new palette" },
      { "id": "w5", "context": "Swipe card prototype · buttons still red" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Trevor's brand guidelines update",
    "kind": "alert",
    "from": "TR",
    "project": "Whiskr",
    "summary": "Recolor the app: Trevor dropped red from the brand",
    "time": "2h",
    "unread": true,
    "decision": "nored",
    "body": "Red is out. Your task and Claude Code prompt are ready."
  },
  {
    "need": "decide", "touches": "Your brand guidelines", "id": "i5",
    "to": ["TR"],
    "relatedArtifacts": [
      { "id": "w7", "context": "Promo video plan" },
      { "id": "w1", "context": "Brand guidelines · palette and the purring dot" }
    ],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Keller's chat with Claude",
    "kind": "mention",
    "from": "MC",
    "project": "Whiskr",
    "summary": "Keller's promo video plan builds on your brand guidelines",
    "time": "20m",
    "unread": true,
    "decision": "short",
    "body": "Check the video plan matches your guidelines."
  },
  {
    "touches": "Marketing, which you follow", "id": "i9",
    "to": ["CH"],
    "relatedArtifacts": [{ "id": "w7", "context": "Promo video plan · length not confirmed" }],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Weekly digest",
    "kind": "change",
    "from": "MC",
    "project": "Whiskr",
    "summary": "This week: red is out, the dot moves",
    "time": "1h",
    "unread": true,
    "decision": "short",
    "body": "The video length waits on Keller; the poster still uses red."
  },
  {
    "need": "do", "task": "t1", "touches": "Your poster campaign", "id": "i1",
    "relatedArtifacts": [
      {
        "id": "w1",
        "context": "Brand guidelines · new palette"
      },
      {
        "id": "w6",
        "context": "Poster campaign · still uses tuna red"
      }
    ],
    "author": {
      "kind": "ai",
      "name": "Whyspace AI"
    },
    "source": "Trevor's brand guidelines update",
    "kind": "alert",
    "from": "TR",
    "project": "Whiskr",
    "summary": "Update your poster: Trevor dropped red from the brand",
    "time": "1d",
    "unread": true,
    "decision": "nored",
    "body": "Your poster still uses red. Your task and Figma prompt are ready."
  },
  {
    "touches": "Your poster and promo video", "id": "i2",
    "relatedArtifacts": [
      {
        "id": "w3",
        "context": "Luna at 5:55"
      },
      {
        "id": "w5",
        "context": "Swipe card prototype"
      }
    ],
    "author": {
      "kind": "ai",
      "name": "Whyspace AI"
    },
    "to": ["MC", "CH"],
    "source": "Footage review · live session",
    "kind": "change",
    "from": "TR",
    "project": "Whiskr",
    "summary": "Every element should move to catch a cat's attention",
    "time": "2d",
    "unread": false,
    "decision": "move",
    "body": "Trevor marked this important. It affects the poster and video."
  },
  {
    "need": "decide", "touches": "Your promo video plan", "id": "i3",
    "relatedArtifacts": [
      {
        "id": "w7",
        "context": "Promo video plan"
      }
    ],
    "author": {
      "kind": "ai",
      "name": "Whyspace AI"
    },
    "source": "Your chat with Claude",
    "kind": "review",
    "from": "MC",
    "project": "Whiskr",
    "summary": "Confirm why the promo video runs 15 seconds",
    "time": "10m",
    "unread": true,
    "decision": "short",
    "body": "Claude inferred the reason from your chat. Confirm or correct it."
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
  decisions: number
  summary?: string
  // A past meeting leads with what it decided, its outcomes and each person's next steps.
  decisionIds?: string[]
  outcomes?: string[]
  nextSteps?: { who: string; text: string }[]
}

const ALL_SESSIONS: Session[] = [
  {
    "id": "s1",
    "project": "whiskr",
    "title": "Footage review",
    "host": "TR",
    "people": [
      "TR",
      "KL"
    ],
    "status": "Ended",
    "when": "Oct 22",
    "length": "16 min",
    "decisions": 3,
    "summary": "Luna only reacted to movement. Kelly tried three interface directions; the moving dot won. Trevor's research added a 25 Hz purr. Trevor marked the movement finding as important.",
    "decisionIds": ["move", "dot", "purr"],
    "outcomes": ["Luna only reacts to movement", "The moving dot beat the wiggle and the feather", "Movement marked as important for the whole team"],
    "nextSteps": [
      { "who": "KL", "text": "Build the purring dot into the swipe card" },
      { "who": "TR", "text": "Add the purring dot to the brand guidelines" }
    ]
  },
  {
    "id": "s2",
    "project": "whiskr",
    "title": "Cat test with the prototype",
    "host": "KL",
    "people": [
      "KL",
      "TR"
    ],
    "status": "Ended",
    "when": "Oct 21",
    "length": "40 min",
    "decisions": 0,
    "outcomes": ["Luna ignored the static card", "Footage saved for review"],
    "nextSteps": [{ "who": "TR", "text": "Review the footage before Thursday" }]
  },
  {
    "id": "s3",
    "project": "whiskr",
    "title": "Poster and video review",
    "host": "MC",
    "people": [
      "MC",
      "CH",
      "TR",
      "KL"
    ],
    "status": "Scheduled",
    "when": "Fri Oct 30, 10:00",
    "decisions": 0
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
      "when": "Wed Oct 28, 18:00",
      "decisions": 0
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
      "length": "45 min",
      "decisions": 1,
      "summary": "Build one real PDF-to-practice loop. Keller owns interaction design and testing; Jordan owns extraction, generation, and evaluation.",
      "decisionIds": ["figma"],
      "outcomes": ["One real loop instead of a clickable mock", "Roles split by interaction and generation"],
      "nextSteps": [
        { "who": "MC", "text": "Connect the upload, quiz and feedback screens" },
        { "who": "JK", "text": "Evaluate questions on three course PDFs" }
      ]
    }
]

// Artifacts are the work itself: prototypes, design files, repos, docs, videos and AI outputs.
// Each belongs to a part of a project, so the decisions canvas can show them in place.
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
  // Evidence backs a why (research, tests, recordings); everything else is the work itself.
  evidence?: boolean
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
    "evidence": true,
    "meta": "Blue and yellow palette, purring dot · 18 frames"
  },
  {
    "id": "w2",
    "project": "whiskr",
    "part": "Research",
    "name": "Cat attention research",
    "kind": "AI output",
    "owner": "TR",
    "updated": "Oct 23",
    "decisions": 1,
    "evidence": true,
    "meta": "Perplexity · 3 sources on cat vision and vibration"
  },
  {
    "id": "w3",
    "project": "whiskr",
    "part": "Research",
    "name": "Cat test footage",
    "kind": "Video",
    "owner": "TR",
    "updated": "Oct 21",
    "decisions": 1,
    "meta": "Luna and Miso · 3 clips"
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
    "meta": "Swipe card, matches · 24 frames"
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
    "meta": "localhost:5173 · swipe card with purring dot"
  },
  {
    "id": "w6",
    "project": "whiskr",
    "part": "Marketing",
    "name": "Poster campaign",
    "kind": "Figma",
    "owner": "MC",
    "updated": "Oct 20",
    "decisions": 1,
    "meta": "3 posters · needs the new palette"
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
    "meta": "From Claude · 15 seconds, 3 beats",
    "content": {
      "heading": "Promo video plan",
      "paragraphs": [
        "0–5 s: Luna's real pounce on the moving dot.",
        "5–10 s: The dot leads a swipe on the Whiskr card, purring.",
        "10–15 s: Blue and yellow end card with the logo."
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
    "meta": "Runway storyboard · set up from the plan"
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
      "evidence": true,
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
      "evidence": true,
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
  {
    "project": "whiskr",
    "who": "MC",
    "tool": "Claude",
    "aiDoing": "Drafting the promo video plan",
    "artifact": "w7",
    "doing": "Promo video",
    "part": "Marketing",
    "since": "25 min",
    "state": "active"
  },
  {
    "project": "whiskr",
    "who": "KL",
    "tool": "Claude Code",
    "aiDoing": "Adding the purr buzz to the dot",
    "artifact": "w5",
    "doing": "Swipe card",
    "part": "App",
    "since": "40 min",
    "state": "active"
  },
  {
    "project": "whiskr",
    "who": "TR",
    "tool": "Perplexity",
    "aiDoing": "Researching what cats see",
    "artifact": "w2",
    "doing": "Cat vision research",
    "part": "Research",
    "since": "1 h",
    "state": "active"
  },
  {
    "project": "whiskr",
    "who": "CH",
    "doing": "Reviewed the week's decisions",
    "part": "Brand",
    "since": "Yesterday",
    "state": "idle"
  },
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

// Milestone timeline per project, for cadence on Overview.
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

// Whiskr's summaries at each stage of the week (see lib/stage.ts).
const WHISKR_SUMMARY = [
  { project: "A swipe app for cats. Tuna red brand, static swipe card.", week: "Kelly ran the first cat test. Trevor has the footage." },
  { project: "A swipe app for cats, led by a moving, purring dot.", week: "Luna only reacted to movement. The moving dot won." },
  { project: "A cat swipe app led by a purring dot in blue and yellow.", week: "Trevor dropped red. The app is recoloring; the poster isn't." },
  { project: "A cat swipe app led by a purring dot in blue and yellow.", week: "Red is out and the poster lags. Keller planned the promo video." },
][Math.min(STAGE, 4) - 1]

// AI summaries shown on the decisions canvas, one per part and one per project.
// Written by Whyspace from the decisions themselves, refreshed when one changes.
export const PART_SUMMARY: Record<string, string> = {
  Research: "Cats only react to things that move.",
  Brand: STAGE < 3 ? "Tuna red is the primary color." : "Blue and yellow with the purring dot. No red.",
  App: "A moving dot leads the swipe and purrs at 25 Hz.",
  Marketing: "A 15-second video opening on Luna's pounce. The poster needs new colors.",
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
    "Your posters are in tuna red. Trevor has the test footage.",
    "Movement is the new rule. It will reach your poster and video.",
    "Your poster still uses red. Trevor dropped it from the brand.",
    "You planned the promo video; confirm its length. The poster still uses red.",
  ],
  TR: [
    "Monday's cat-test footage is ready for you.",
    "Luna only reacts to movement. The dot and purr are logged.",
    "You dropped red. The app is recoloring; Keller's poster isn't.",
    "Your palette is in the app. The poster still uses red.",
  ],
  KL: [
    "You ran the first cat test. Trevor has the footage.",
    "Your moving dot won. Next: build it with the purr.",
    "Red is out: recolor the app to blue and yellow.",
    "The app is recolored and the dot purrs. Keller planned the video.",
  ],
}
export const WEEK_SUMMARY: Record<string, string> = {
  whiskr: WHISKR_WEEK_FOR[VIEWER]?.[Math.min(STAGE, 4) - 1] ?? WHISKR_SUMMARY.week,
  studio: "We switched to a real AI loop. Two questions lacked sources.",
}
export const CANVAS_EXTRAS: Record<string, { notePart?: string; note?: string; suggestion?: { name: string; from: string; moves: string[]; by: string; reason: string }; ask: string[] }> = {
  whiskr: {
    ...(STAGE >= 3 && { notePart: "Brand", note: "Trevor marked the palette change as important · Oct 23" }),
    ask: ["Why is there a dot everywhere?", "Why no red?", "What needs my review?", "What changed this week?"],
  },
  studio: {
    notePart: "Prototype", note: "Jordan linked the first question evaluation · Today",
    ask: ["Why build a working AI prototype?", "Which questions lacked source support?", "Show me Recall", "What do Jordan and I own?"],
  },
}

// Whiskr plays out over one week (see lib/stage.ts). Each item shows from the stage
// where it first happens, and until the stage where it is replaced. Unlisted items always show.
const FROM: Record<string, number> = {
  move: 2, dot: 2, purr: 2, dotbrand: 3, nored: 3, short: 4, pounce: 4,
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
    { until: 1, patch: { status: "Scheduled", when: "Thu Oct 22, 3:30 PM", length: undefined, decisions: 0, summary: undefined } },
    { until: 2, patch: { status: "Live", when: "Now", length: "8 min so far", decisions: 3, summary: undefined } },
  ],
  w1: [{ until: 2, patch: { updated: "Oct 8", decisions: 1, version: "v2", meta: "Tuna red palette · 16 frames" } }],
  w4: [{ until: 2, patch: { updated: "Oct 20", meta: "Static swipe card, matches · 20 frames" } }],
  w5: [{ until: 1, patch: { updated: "Oct 21", meta: "localhost:5173 · static swipe card" } }],
  w6: [{ until: 2, patch: { meta: "3 posters in tuna red" } }],
  t4: [{ until: 3, patch: { status: "prog" } }],
}

const inWhiskr = (item: { project: string }) => item.project === "whiskr" || item.project === "Whiskr"

function staged<T extends { id: string; project: string }>(items: T[]): T[] {
  return items
    .filter((item) => !inWhiskr(item) || ((FROM[item.id] ?? 1) <= STAGE && STAGE <= (UNTIL[item.id] ?? Infinity)))
    .map((item) => {
      const earlier = inWhiskr(item) ? EARLIER[item.id]?.find((e) => STAGE <= e.until) : undefined
      return earlier ? { ...item, ...earlier.patch } : item
    })
}

export const DECISIONS = staged(ALL_DECISIONS)
export const TASKS = staged(ALL_TASKS)
export const INBOX = staged(ALL_INBOX).filter((item) => (item.to ?? ["MC"]).includes(VIEWER))
export const SESSIONS = staged(ALL_SESSIONS)
export const ARTIFACTS = staged(ALL_ARTIFACTS)
// The projects the viewer is in. Use PROJECTS for lookups by id or name.
export const MY_PROJECTS = PROJECTS.filter((p) => p.members.includes(VIEWER))

// What the Whiskr team is doing at each stage.
const WHISKR_ACTIVITY: Record<number, Activity[]> = {
  1: [
    { project: "whiskr", who: "TR", doing: "Cat test footage", part: "Research", since: "1 h", state: "active", artifact: "w3" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Tidying the swipe card prototype", doing: "Swipe card", part: "App", since: "2 h", state: "active", artifact: "w5" },
    { project: "whiskr", who: "MC", tool: "Figma", aiDoing: "Laying out the poster series", doing: "Poster campaign", part: "Marketing", since: "3 h", state: "active", artifact: "w6" },
  ],
  2: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching how cats respond to vibration", doing: "Footage review · live", part: "Research", since: "8 min", state: "active", artifact: "w2" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Exploring card motion", doing: "Footage review · live", part: "App", since: "8 min", state: "active", artifact: "w5" },
  ],
  3: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching what cats see", doing: "Brand guidelines", part: "Brand", since: "1 h", state: "active", artifact: "w1" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Recoloring buttons to blue and yellow", doing: "Swipe card", part: "App", since: "30 min", state: "active", artifact: "w5" },
  ],
}
export const ACTIVITY: Activity[] = [
  ...(WHISKR_ACTIVITY[STAGE] ?? ALL_ACTIVITY.filter(inWhiskr)),
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
  pounce: [{ artifact: "w7", seen: ["MC"] }, { artifact: "w8", task: "t2", seen: ["MC", "TR"] }],
  cram: [{ artifact: "a12", seen: ["JK", "MC"] }],
  slides: [{ artifact: "a13", seen: ["MC", "JK"] }, { artifact: "a15", seen: ["MC", "JK"] }],
  cite: [{ artifact: "a15", task: "t12", seen: ["JK"] }, { artifact: "a16", seen: ["JK"] }],
  figma: [{ artifact: "a15", task: "t11", seen: ["MC", "JK"] }, { artifact: "a16", seen: ["JK", "MC"] }],
  deck: [{ artifact: "a17", task: "t15", seen: ["JK"] }],
  presenter: [{ artifact: "a17", seen: ["JK", "MC"] }],
}

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

// One line per day for the Catch up week strip.
export const DAY_INSIGHT: Record<string, Record<number, string>> = {
  whiskr: {
    21: "First cat test: Luna ignored the static card",
    22: "Movement is the rule; the dot leads and purrs",
    23: "Red is out; blue and yellow are in",
    25: "Promo video planned around Luna's pounce",
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
  | { kind: "decide"; id: string; decision: Decision; ask: "confirm" | "review" | "answer" }
  | { kind: "do"; id: string; task: Task }

export function needsYou(projectId: string, tasks: Task[] = TASKS, confirmed: Record<string, boolean> = {}): NeedsYou[] {
  const name = projectName(projectId)
  const asked = INBOX.filter((i) => i.project === name && i.need === "decide").map((i) => i.decision)
  const decide = DECISIONS.filter((d) => d.project === projectId && !confirmed[d.id] && (
    (d.status === "inf" && (d.owner === VIEWER || asked.includes(d.id))) || (d.status === "open" && d.owner === VIEWER) || (d.status !== "open" && d.status !== "inf" && asked.includes(d.id))
  ))
  const day = (t: Task) => Number(t.due.match(/\d+/)?.[0] ?? 99) + (t.due.includes("Nov") ? 31 : 0)
  const mine = tasks.filter((t) => t.project === name && t.owner === VIEWER && t.status !== "done").sort((a, b) => day(a) - day(b))
  return [
    ...decide.map((decision) => ({ kind: "decide" as const, id: decision.id, decision, ask: decision.status === "open" ? "answer" as const : decision.status === "inf" && decision.owner === VIEWER ? "confirm" as const : "review" as const })),
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
