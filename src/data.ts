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
}

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
    "why": "In Monday's footage, Luna ignored the static card for 5 minutes, then pounced the moment a notification slid in (5:55).",
    "snippet": "She only cares when something moves. We need the element to move."
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
    "why": "We compared a wiggling card, a moving dot and a dangling feather on the canvas. The dot works across the app, billboard and video; the wiggle was hard to hit and the feather covered the photo."
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
    "why": "Trevor's research: cats respond to a low buzz around 25 Hz, felt through their paw pads, like a purr."
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
    "why": "Playful and food-related, and it stands out on a phone screen."
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
    "why": "If the dot leads the swipe, the poster and video should use it too, so cats recognize it everywhere."
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
    "why": "Cats see red as a dull gray. Blue and yellow are the colors they see best."
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
    "why": "Inferred: cats lose interest fast."
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
    "why": "Real footage of a cat catching the dot shows the idea in the first second."
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
      "why": "In six classmate interviews, students struggled to tell which concepts they understood after rereading a lecture."
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
      "why": "One PDF and five questions give our two-person team a complete loop we can build and test before Nov 4.",
      "snippet": "Upload, practice, check the explanation, and return to the source."
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
      "snippet": "Only return questions with a supporting passage and a page number we can link back to."
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
      "was": "Use a clickable prototype with prewritten questions",
      "why": "The studio feedback asked us to test actual model mistakes. Keller owns the interaction design; Jordan owns PDF extraction and question generation."
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
      "why": "The critique needs evidence of iteration. Include unsupported questions, our rejection rules, and what changed after testing."
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
      MC: "A swipe app where cats find playdate matches. I lead marketing: the poster campaign and the 15-second promo video.",
      CH: "A swipe app where cats find playdate matches. I run the company; Trevor leads research and brand, Kelly the app, Keller marketing.",
      TR: "A swipe app where cats find playdate matches. I lead research and the brand: cat tests, footage reviews and the palette.",
      KL: "A swipe app where cats find playdate matches. I lead the app: the swipe card prototype and the moving dot.",
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
      "brief": "Jordan and I are building Recall: an AI study tool that turns course PDFs into practice questions with source citations. Working prototype due Nov 4; final critique Dec 10.",
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
    "description": "The poster still uses tuna red. Swap to blue and yellow and add the purring dot."
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
    "title": "Recolor app buttons to blue and yellow",
    "project": "Whiskr",
    "part": "App",
    "owner": "KL",
    "due": "Thu Oct 29",
    "status": "review",
    "priority": "med",
    "decision": "nored"
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
      "description": "Use Jordan’s generation endpoint. Design loading, scanned-PDF failure, and retry states before our studio check-in.",
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
      "description": "Make it possible to verify an explanation without losing the current question. Include missing-source behavior."
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
      "description": "Score 15 questions for source support, answer correctness, and clarity. Log failures instead of silently regenerating."
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
      "description": "Jordan and I will alternate facilitation and notes. Ask participants to bring one non-sensitive course PDF."
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
          "text": "Can you walk through the interaction changes? I’ll cover the evaluation results and model failures.",
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
}

const ALL_INBOX: InboxItem[] = [
  {
    "id": "i4",
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
    "summary": "Trevor changed the brand palette: recolor the app buttons",
    "time": "2h",
    "unread": true,
    "decision": "nored",
    "body": "Cats see red as a dull gray, so the palette is now blue and yellow. A prompt with the new colors and the reason is ready to copy into Claude Code."
  },
  {
    "id": "i5",
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
    "body": "The 15-second video opens on Luna's pounce and uses the blue and yellow palette with the purring dot. Check it matches the guidelines."
  },
  {
    "id": "i9",
    "to": ["CH"],
    "relatedArtifacts": [{ "id": "w7", "context": "Promo video plan · length not confirmed" }],
    "author": { "kind": "ai", "name": "Whyspace AI" },
    "source": "Weekly digest",
    "kind": "change",
    "from": "MC",
    "project": "Whiskr",
    "summary": "This week: red is out, the dot moves, and one decision waits on Keller",
    "time": "1h",
    "unread": true,
    "decision": "short",
    "body": "Trevor dropped red, Kelly recolored the app, and Keller planned the promo video. The 15-second length still needs Keller's confirmation; the poster still uses red."
  },
  {
    "id": "i1",
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
    "summary": "Possible misalignment: Trevor changed the brand palette to blue and yellow",
    "time": "1d",
    "unread": true,
    "decision": "nored",
    "body": "Cats see red as a dull gray, so Trevor dropped tuna red. Your poster still uses it. A prompt is ready to copy into Figma with the new palette and the reason."
  },
  {
    "id": "i2",
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
    "body": "Trevor marked this as important at the end of the footage review. It affects the poster and the promo video."
  },
  {
    "id": "i3",
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
    "body": "Claude captured the length from your chat and inferred the reason: cats lose interest fast. Confirm or correct it."
  },
  {
      "id": "i8",
      "relatedArtifacts": [{"id": "a16", "context": "Endpoint changes · verified source passages"}, {"id": "a15", "context": "Feedback screen and source preview"}],
      "author": {"kind": "ai", "name": "Whyspace AI"},
      "source": "Jordan\u2019s source-citation implementation update",
      "kind": "review",
      "from": "JK",
      "project": "AI Studio · Recall",
      "summary": "Jordan proposed source pages on every answer explanation",
      "time": "1h",
      "unread": true,
      "decision": "cite",
      "body": "The endpoint now includes page numbers and supporting passages. Review how the citation fits your feedback screen."
    },
  {
      "id": "i7",
      "relatedArtifacts": [{"id": "a16", "context": "Evaluation cases and source-support results"}, {"id": "a15", "context": "Current behavior for unsupported answers"}],
      "author": {"kind": "ai", "name": "Whyspace AI"},
      "source": "Jordan\u2019s first question evaluation \u00b7 15 questions",
      "kind": "alert",
      "from": "JK",
      "project": "AI Studio · Recall",
      "summary": "Two evaluation questions have no supporting source passage",
      "time": "4h",
      "unread": true,
      "decision": "slides",
      "body": "Jordan flagged two of the 15 questions in the first evaluation. Decide whether to reject them or show an unavailable state before the classmate tests."
    },
  {
      "id": "i6",
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
      "body": "“Keller, can you show the interaction changes? I’ll explain how we evaluated the questions.”"
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
    "summary": "Luna only reacted to movement. Kelly tried three interface directions; the moving dot won. Trevor's research added a 25 Hz purr. Trevor marked the movement finding as important."
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
    "decisions": 0
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
      "summary": "Build one real PDF-to-practice loop. Keller owns interaction design and testing; Jordan owns extraction, generation, and evaluation."
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
export type Activity = { project: string; who: string; tool?: string; aiDoing?: string; doing: string; part: string; since: string; state: "active" | "idle" }

const ALL_ACTIVITY: Activity[] = [
  {
    "project": "whiskr",
    "who": "MC",
    "tool": "Claude",
    "aiDoing": "Drafting the promo video plan",
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
      "aiDoing": "Exploring citation and missing-source states",
      "doing": "Recall feedback and source preview",
      "part": "Prototype",
      "since": "1 h",
      "state": "active"
    },
  {
      "project": "studio",
      "who": "JK",
      "tool": "Cursor",
      "aiDoing": "Scoring question support against source passages",
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
  { project: "A swipe app for cats. The brand is tuna red and the swipe card is static. Nothing open yet.", week: "Kelly ran the first cat test with the prototype. Trevor has the footage to review." },
  { project: "A swipe app for cats. Movement is the new rule: a moving dot leads the swipe, and it purrs.", week: "In the footage review, Luna only reacted to movement. Kelly tried three directions; the moving dot won." },
  { project: "A swipe app for cats, led by a moving, purring dot in blue and yellow. Open: the poster still uses red.", week: "Trevor dropped red from the brand and marked it important. Kelly is recoloring the app; the poster has not caught up." },
  { project: "A swipe app for cats, led by a moving, purring dot in blue and yellow. Open: the 15-second video length needs confirming, and the poster still uses red.", week: "Trevor dropped red from the brand. Kelly recolored the app buttons; the poster has not caught up yet. Keller planned the promo video with Claude." },
][Math.min(STAGE, 4) - 1]

// AI summaries shown on the decisions canvas, one per part and one per project.
// Written by Whyspace from the decisions themselves, refreshed when one changes.
export const PART_SUMMARY: Record<string, string> = {
  Research: "Cats only react to things that move. Luna ignored the static card and pounced on a sliding notification.",
  Brand: STAGE < 3 ? "Tuna red is the primary color. It feels playful and stands out on a phone screen." : "The purring dot is now a brand element. Red is out because cats see it as gray; the palette is blue and yellow.",
  App: "A moving dot leads the swipe and purrs at about 25 Hz. Kelly is building it into the prototype.",
  Marketing: "The promo video runs 15 seconds and opens on Luna's real pounce. The poster still needs the new palette.",
  Interviews: "Six classmate interviews support short practice sessions after reviewing one lecture.",
  Concept: "Recall generates five questions from one course PDF. Every explanation should have a supporting passage and page reference.",
  Prototype: "Keller designs the upload, practice, and feedback experience. Jordan builds extraction and generation. Test real model failures in the Nov 4 working prototype.",
  "Final crit": "Show the product, the evaluation evidence, and how failures changed the design. Keller and Jordan still need to divide the presentation.",
}
export const PROJECT_DECISION_SUMMARY: Record<string, string> = {
  whiskr: WHISKR_SUMMARY.project,
  studio: "Recall turns one course PDF into five practice questions. Our two-person team is building a working flow for Nov 4. Open: citation behavior, unsupported questions, and the critique presentation split.",
}
// Each lead's view of the week opens with their own part. Christine sees the whole project.
const WHISKR_WEEK_FOR: Record<string, string[]> = {
  MC: [
    "The poster series is laid out in tuna red. Kelly ran the first cat test; Trevor has the footage.",
    "The footage review is live: movement is the new rule, which will reach the poster and video.",
    "Your poster still uses red: Trevor dropped it from the brand and marked it important. Kelly is recoloring the app.",
    "You planned the 15-second promo video with Claude; confirm the length. The poster still uses red.",
  ],
  TR: [
    "You have Monday's cat-test footage to review. Kelly ran the test with the static card.",
    "You're reviewing the footage with Kelly: Luna only reacts to movement. Movement, the dot and the purr are logged.",
    "You dropped red from the brand and marked it important. Kelly is recoloring the app; Keller's poster hasn't caught up.",
    "Your palette is in the app. Keller's promo video plan builds on your guidelines; the poster still uses red.",
  ],
  KL: [
    "You ran the first cat test with the static swipe card. Trevor has the footage.",
    "In the footage review, the moving dot won out of your three directions. Next: build it with the purr.",
    "Red is out of the brand: recolor the app buttons to blue and yellow. The moving dot is in the prototype.",
    "You recolored the app buttons; the moving dot purrs at about 25 Hz. Keller planned the promo video.",
  ],
}
export const WEEK_SUMMARY: Record<string, string> = {
  whiskr: WHISKR_WEEK_FOR[VIEWER]?.[Math.min(STAGE, 4) - 1] ?? WHISKR_SUMMARY.week,
  studio: "We moved from prewritten prototype questions to a working AI flow. Jordan added source passages; Keller is designing verification and failure states. Two evaluation questions lacked support.",
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
  w1: [{ until: 2, patch: { updated: "Oct 8", decisions: 1, meta: "Tuna red palette · 16 frames" } }],
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
    { project: "whiskr", who: "TR", doing: "Cat test footage", part: "Research", since: "1 h", state: "active" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Tidying the swipe card prototype", doing: "Swipe card", part: "App", since: "2 h", state: "active" },
    { project: "whiskr", who: "MC", tool: "Figma", aiDoing: "Laying out the poster series", doing: "Poster campaign", part: "Marketing", since: "3 h", state: "active" },
  ],
  2: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching how cats respond to vibration", doing: "Footage review · live", part: "Research", since: "8 min", state: "active" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Exploring card motion", doing: "Footage review · live", part: "App", since: "8 min", state: "active" },
  ],
  3: [
    { project: "whiskr", who: "TR", tool: "Perplexity", aiDoing: "Researching what cats see", doing: "Brand guidelines", part: "Brand", since: "1 h", state: "active" },
    { project: "whiskr", who: "KL", tool: "Claude Code", aiDoing: "Recoloring buttons to blue and yellow", doing: "Swipe card", part: "App", since: "30 min", state: "active" },
  ],
}
export const ACTIVITY: Activity[] = [
  ...(WHISKR_ACTIVITY[STAGE] ?? ALL_ACTIVITY.filter(inWhiskr)),
  ...ALL_ACTIVITY.filter((a) => !inWhiskr(a)),
]

// Everything in a project that waits on the viewer. One rule, used by the Catch up chat,
// the sidebar badge and the Projects card:
// - confirm: inferred decisions you own, or that someone asked you to review
// - apply: misalignment alerts addressed to you, each with a ready prompt for your tool
// - task: your open tasks
export type NeedsYou =
  | { kind: "confirm"; id: string; decision: Decision }
  | { kind: "apply"; id: string; alert: InboxItem; prompt: string }
  | { kind: "task"; id: string; task: Task }

export function needsYou(projectId: string): NeedsYou[] {
  const name = projectName(projectId)
  const asked = INBOX.filter((i) => i.project === name && i.kind === "review").map((i) => i.decision)
  const confirm = DECISIONS.filter((d) => d.project === projectId && d.status === "inf" && (d.owner === VIEWER || asked.includes(d.id)))
  const alerts = INBOX.filter((i) => i.project === name && i.kind === "alert")
  const tasks = TASKS.filter((t) => t.project === name && t.owner === VIEWER && t.status !== "done")
  return [
    ...confirm.map((decision) => ({ kind: "confirm" as const, id: decision.id, decision })),
    ...alerts.map((alert) => {
      const d = DECISIONS.find((x) => x.id === alert.decision)
      const prompt = d ? `${d.title}. ${d.why ?? ""} Update ${alert.relatedArtifacts.at(-1)?.context.split(" · ")[0] ?? "this work"} to match.` : alert.body
      return { kind: "apply" as const, id: alert.id, alert, prompt }
    }),
    ...tasks.map((task) => ({ kind: "task" as const, id: task.id, task })),
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
