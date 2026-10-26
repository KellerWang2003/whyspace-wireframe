import type { Plan } from "@/lib/store"

// Fictional scenario: Keller designs Platiful and builds Recall with one AI Studio teammate.

export type Person = { id: string; name: string; email: string; role: string }

export const PEOPLE: Record<string, Person> = {
  "MC": {
    "id": "MC",
    "name": "Keller",
    "email": "keller@platiful.example",
    "role": "Product designer"
  },
  "PS": {
    "id": "PS",
    "name": "Priya Shah",
    "email": "priya@platiful.example",
    "role": "Product manager"
  },
  "SO": {
    "id": "SO",
    "name": "Sam Okafor",
    "email": "sam@platiful.example",
    "role": "Engineer"
  },
  "AT": {
    "id": "AT",
    "name": "Ana Torres",
    "email": "ana@platiful.example",
    "role": "Growth designer"
  },
  "LB": {
    "id": "LB",
    "name": "Leo Brandt",
    "email": "leo@platiful.example",
    "role": "Brand designer"
  },
  "JK": {
    "id": "JK",
    "name": "Jordan Kim",
    "email": "jordan.kim@studio.example",
    "role": "AI Studio teammate"
  }
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
  {
    "id": "five",
    "project": "platiful",
    "title": "Start with busy people cooking for one or two",
    "part": "Research",
    "status": "conf",
    "owner": "PS",
    "by": "Priya Shah",
    "when": "Oct 12",
    "tool": "Claude",
    "why": "Six of eight interviewees plan dinner around late workdays and buy more groceries than they use."
  },
  {
    "id": "core",
    "project": "platiful",
    "title": "Plan three dinners before asking for a full week",
    "part": "Research",
    "status": "conf",
    "owner": "PS",
    "by": "Keller and Priya Shah",
    "when": "Oct 14",
    "tool": "Figma",
    "why": "In five concept tests, a seven-day plan felt like a commitment. Three dinners left room for leftovers and eating out.",
    "snippet": "Give me Tuesday through Thursday. I never know what my weekend looks like."
  },
  {
    "id": "digest",
    "project": "platiful",
    "title": "When should we prompt people to plan next week?",
    "part": "Research",
    "status": "open",
    "owner": "PS",
    "due": "Fri Oct 30"
  },
  {
    "id": "photo",
    "project": "platiful",
    "title": "Choose dinners before creating an account",
    "part": "Design",
    "status": "conf",
    "owner": "MC",
    "by": "Keller",
    "tool": "Figma",
    "when": "Oct 16",
    "why": "Four of six testers wanted to see useful recipes before sharing an email address.",
    "snippet": "Let people save three dinners, then explain why an account keeps their plan."
  },
  {
    "id": "calendar",
    "project": "platiful",
    "title": "Keep unscheduled meals in a flexible weekly tray",
    "part": "Design",
    "status": "conf",
    "owner": "MC",
    "by": "Keller",
    "tool": "Figma",
    "when": "Oct 19",
    "why": "Testers moved dinner plans when meetings ran late. Requiring a date made a simple swap feel like rescheduling work."
  },
  {
    "id": "type",
    "project": "platiful",
    "title": "Show cooking time and servings on every recipe card",
    "part": "Design",
    "status": "inf",
    "owner": "MC",
    "tool": "Claude",
    "when": "Today",
    "snippet": "Time and servings need to stay visible when a recipe title wraps to three lines."
  },
  {
    "id": "empty",
    "project": "platiful",
    "title": "Should a new plan start with suggested dinners?",
    "part": "Design",
    "status": "open",
    "owner": "MC",
    "due": "Mon Nov 2"
  },
  {
    "id": "swiftui",
    "project": "platiful",
    "title": "Ship the beta on iOS with the existing React Native app",
    "part": "Engineering",
    "status": "conf",
    "owner": "SO",
    "by": "Sam Okafor",
    "tool": "Cursor",
    "when": "Oct 16",
    "why": "The current beta cohort uses iOS. Reusing the existing app lets us test the new planning flow without a platform rewrite."
  },
  {
    "id": "ondevice",
    "project": "platiful",
    "title": "Combine groceries only when ingredient and unit match",
    "part": "Engineering",
    "status": "chg",
    "owner": "SO",
    "by": "Sam Okafor",
    "tool": "Cursor",
    "when": "Oct 22",
    "was": "Combine all grocery items with the same ingredient name",
    "why": "The prototype added tablespoons to grams. Keep incompatible units separate until we have verified conversion rules."
  },
  {
    "id": "local",
    "project": "platiful",
    "title": "Keep the last grocery list available offline",
    "part": "Engineering",
    "status": "inf",
    "owner": "SO",
    "tool": "Cursor",
    "when": "Yesterday",
    "snippet": "Cache the list locally so it still opens in the supermarket. Sync edits when the connection returns."
  },
  {
    "id": "tuesday",
    "project": "platiful",
    "title": "Invite 30 waitlist members to a staged beta",
    "part": "Marketing",
    "status": "conf",
    "owner": "AT",
    "by": "Ana Torres",
    "when": "Oct 20",
    "tool": "ChatGPT",
    "why": "We can support onboarding personally and fix planning issues before inviting the rest of the waitlist."
  },
  {
    "id": "screens",
    "project": "platiful",
    "title": "Lead beta onboarding with three dinners and one grocery list",
    "part": "Marketing",
    "status": "inf",
    "owner": "AT",
    "tool": "ChatGPT",
    "when": "Oct 23",
    "snippet": "Show the plan becoming a grocery list, then explain how recipe swaps work."
  },
  {
    "id": "freemium",
    "project": "platiful",
    "title": "Defer the paywall until after the beta",
    "part": "Marketing",
    "status": "flag",
    "owner": "PS",
    "by": "Priya Shah",
    "when": "Oct 21",
    "why": "We need repeat planning behavior before testing willingness to pay. The current welcome email still promises a paid trial."
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
  ["five", "core"],
  ["core", "digest"],
  ["core", "photo"],
  ["core", "calendar"],
  ["calendar", "ondevice"],
  ["photo", "screens"],
  ["swiftui", "local"],
  ["photo", "empty"],
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
    "id": "platiful",
    "name": "Platiful app",
    "brief": "Help busy people plan a few dinners, swap recipes, and shop from one grocery list. I own the planning and onboarding experience for the November beta.",
    "members": [
      "MC",
      "PS",
      "SO",
      "AT",
      "LB"
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

export const TASKS: Task[] = [
  {
    "id": "t1",
    "title": "Finish the dinner-swap flow for design review",
    "project": "Platiful app",
    "part": "Design",
    "owner": "MC",
    "due": "Mon Oct 26",
    "status": "prog",
    "priority": "high",
    "decision": "calendar",
    "description": "Cover swapping a planned dinner, keeping servings, and updating the grocery list. Bring the three edge cases to Monday’s review.",
    "subtasks": [
      {
        "title": "Design recipe replacement and undo",
        "done": true
      },
      {
        "title": "Show what happens to checked grocery items",
        "done": false
      },
      {
        "title": "Annotate serving-size behavior for Sam",
        "done": false
      }
    ]
  },
  {
    "id": "t2",
    "title": "Check long recipe titles and large text sizes",
    "project": "Platiful app",
    "part": "Design",
    "owner": "MC",
    "due": "Tue Oct 27",
    "status": "todo",
    "priority": "med",
    "decision": "type",
    "description": "Try 12 real recipe titles at default and enlarged text sizes. Cooking time and servings must remain readable."
  },
  {
    "id": "t3",
    "title": "Test suggested dinners against an empty weekly plan",
    "project": "Platiful app",
    "part": "Design",
    "owner": "MC",
    "due": "Mon Nov 2",
    "status": "todo",
    "priority": "high",
    "decision": "empty",
    "description": "Run 20-minute sessions with five waitlist members. Compare time to first saved dinner and whether suggestions feel relevant.",
    "subtasks": [
      {
        "title": "Prepare both prototype variants",
        "done": false
      },
      {
        "title": "Write a neutral task and follow-up questions",
        "done": false
      }
    ],
    "comments": [
      {
        "who": "PS",
        "text": "Please include two people with dietary restrictions. The current suggestions skew heavily toward pasta.",
        "when": "Yesterday"
      }
    ]
  },
  {
    "id": "t4",
    "title": "Review when beta users make their weekly plan",
    "project": "Platiful app",
    "part": "Research",
    "owner": "PS",
    "due": "Fri Oct 30",
    "status": "prog",
    "priority": "med",
    "decision": "digest",
    "description": "Compare diary notes from eight participants before choosing a default planning reminder."
  },
  {
    "id": "t5",
    "title": "Fix grocery merging for incompatible units",
    "project": "Platiful app",
    "part": "Engineering",
    "owner": "SO",
    "due": "Wed Oct 28",
    "status": "prog",
    "priority": "high",
    "decision": "ondevice",
    "description": "Keep grams and tablespoons separate. Add examples for canned tomatoes, olive oil, and fresh herbs.",
    "subtasks": [
      {
        "title": "Match normalized ingredient names",
        "done": true
      },
      {
        "title": "Separate incompatible units",
        "done": false
      },
      {
        "title": "Check edits after a recipe swap",
        "done": false
      }
    ]
  },
  {
    "id": "t6",
    "title": "Review offline grocery-list states",
    "project": "Platiful app",
    "part": "Design",
    "owner": "MC",
    "due": "Thu Oct 29",
    "status": "review",
    "priority": "med",
    "decision": "local",
    "description": "Sam has a build ready. Check cached, reconnecting, and failed-sync states against the Figma annotations."
  },
  {
    "id": "t7",
    "title": "Review the beta welcome email against the new onboarding",
    "project": "Platiful app",
    "part": "Marketing",
    "owner": "AT",
    "due": "Wed Oct 28",
    "status": "review",
    "priority": "med",
    "decision": "screens"
  },
  {
    "id": "t8",
    "title": "Prepare the first 30 beta invitations",
    "project": "Platiful app",
    "part": "Marketing",
    "owner": "AT",
    "due": "Fri Nov 6",
    "status": "todo",
    "priority": "low",
    "decision": "tuesday"
  },
  {
    "id": "t9",
    "title": "Synthesize eight meal-planning interviews",
    "project": "Platiful app",
    "part": "Research",
    "owner": "PS",
    "due": "Oct 12",
    "status": "done",
    "priority": "high",
    "decision": "five"
  },
  {
    "id": "t10",
    "title": "Document the planning handoff and component states",
    "project": "Platiful app",
    "part": "Design",
    "owner": "MC",
    "due": "Oct 23",
    "status": "done",
    "priority": "med",
    "decision": "photo"
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
  platiful: { name: "Beta design handoff", due: "Oct 30" },
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
  meeting?: { sessionId: string; startsAt: string; endsAt: string; timezone: string; agenda?: string }
}

export const INBOX: InboxItem[] = [
  {
    "id": "i1",
    "relatedArtifacts": [{"id": "a2", "context": "Recipe-card design under review"}, {"id": "a1", "context": "Current planning prototype"}],
    "author": {"kind": "ai", "name": "Whyspace AI"},
    "source": "Keller\u2019s layout review \u00b7 Claude",
    "kind": "review",
    "from": "MC",
    "project": "Platiful app",
    "summary": "Review: keep cooking time and servings visible on recipe cards",
    "time": "12m",
    "unread": true,
    "decision": "type",
    "body": "Claude captured this from your layout review. Confirm the rule before Sam implements the compact card."
  },
  {
    "id": "i5",
    "relatedArtifacts": [{"id": "a4", "context": "Diary-study notes for the review"}, {"id": "a3", "context": "Original meal-planning interviews"}],
    "author": {"kind": "ai", "name": "Whyspace AI"},
    "source": "Session invitation from Priya Shah",
    "kind": "invite",
    "from": "PS",
    "project": "Platiful app",
    "summary": "Planning reminder review · Tuesday at 11 AM",
    "time": "5m",
    "unread": true,
    "body": "Priya invited you to a 30-minute review on Tuesday, October 27. Compare a Sunday planning prompt with a reminder people schedule themselves. Bring the diary-study notes.",
    "meeting": { "agenda": "Compare a Sunday planning prompt with a reminder people schedule themselves.", "sessionId": "s10", "startsAt": "2026-10-27T18:00:00Z", "endsAt": "2026-10-27T18:30:00Z", "timezone": "America/Los_Angeles" }
  },
  {
    "id": "i4",
    "relatedArtifacts": [{"id": "a10", "context": "Email copy that introduced the paid-trial offer", "excerpt": "Start your paid trial and plan your first three dinners."}, {"id": "a8", "context": "Ana’s current email design and onboarding screenshots"}, {"id": "a9", "context": "Original beta plan · payment deferred until after the beta", "excerpt": "Invite 30 people to the November beta. Keep the beta free; revisit payment after feedback."}],
    "author": {"kind": "ai", "name": "Whyspace AI"},
    "source": "Ana\u2019s beta welcome email draft and the beta plan",
    "kind": "alert",
    "from": "AT",
    "project": "Platiful app",
    "summary": "Welcome email offer differs from the beta plan",
    "time": "3h",
    "unread": true,
    "decision": "freemium",
    "body": "The draft welcome email mentions a paid trial, while the beta plan defers payment. Review the offer copy with Ana before the invitations go out."
  },
  {
    "id": "i3",
    "relatedArtifacts": [{"id": "a6", "context": "Implementation · grocery-unit merge fix"}, {"id": "a7", "context": "Expected unit-matching behavior"}, {"id": "a1", "context": "Existing grocery-list mockup to update"}],
    "author": {"kind": "ai", "name": "Whyspace AI"},
    "source": "Sam\u2019s grocery-list implementation update",
    "kind": "change",
    "from": "SO",
    "project": "Platiful app",
    "summary": "Grocery items with incompatible units now stay separate",
    "time": "2d",
    "unread": true,
    "decision": "ondevice",
    "body": "Your grocery-list mockup combines all quantities into one row. Update the example and show how duplicate ingredients are labeled."
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

export const SESSIONS: Session[] = [
  { id: "s10", project: "platiful", title: "Planning reminder review", host: "PS", people: ["PS", "MC", "SO"], status: "Scheduled", when: "Tue Oct 27, 11:00 AM PT", decisions: 0 },
  {
    "id": "s1",
    "project": "platiful",
    "title": "Planning reminder review",
    "host": "PS",
    "people": [
      "PS",
      "MC",
      "SO"
    ],
    "status": "Live",
    "when": "Now",
    "length": "11 min so far",
    "decisions": 2
  },
  {
    "id": "s5",
    "project": "platiful",
    "title": "Dinner-swap design review",
    "host": "MC",
    "people": [
      "MC",
      "PS",
      "SO"
    ],
    "status": "Scheduled",
    "when": "Mon Oct 26, 10:00",
    "decisions": 0
  },
  {
    "id": "s6",
    "project": "platiful",
    "title": "Beta onboarding copy review",
    "host": "AT",
    "people": [
      "AT",
      "MC"
    ],
    "status": "Scheduled",
    "when": "Tue Oct 27, 14:30",
    "decisions": 0
  },
  {
    "id": "s2",
    "project": "platiful",
    "title": "First plan before sign-up",
    "host": "MC",
    "people": [
      "MC",
      "PS"
    ],
    "status": "Ended",
    "when": "Oct 16",
    "length": "35 min",
    "decisions": 1,
    "summary": "Let people choose three dinners before asking for an account. Keep dietary preferences editable."
  },
  {
    "id": "s3",
    "project": "platiful",
    "title": "Grocery-list unit handling",
    "host": "SO",
    "people": [
      "SO",
      "MC"
    ],
    "status": "Ended",
    "when": "Oct 22",
    "length": "22 min",
    "decisions": 1,
    "summary": "Combine quantities only when ingredient and unit match. Keller will update the grocery-list examples."
  },
  {
    "id": "s7",
    "project": "platiful",
    "title": "Beta readiness",
    "host": "PS",
    "people": [
      "MC",
      "PS",
      "SO",
      "AT"
    ],
    "status": "Ended",
    "when": "Oct 23",
    "length": "30 min",
    "decisions": 1,
    "summary": "Stage the beta with 30 waitlist members. Remove the paid-trial offer from the welcome email."
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
  content?: { heading: string; paragraphs: string[] }
  files?: string[] // repos: recently changed files
  pr?: string // repos: the open pull request
}

export const ARTIFACTS: Artifact[] = [
  {
    "id": "a1",
    "project": "platiful",
    "part": "Design",
    "name": "Platiful planning prototype",
    "kind": "Prototype",
    "owner": "MC",
    "updated": "Today",
    "decisions": 3,
    "meta": "Dinner selection, swaps, grocery list · 14 screens"
  },
  {
    "id": "a2",
    "project": "platiful",
    "part": "Design",
    "name": "Platiful product design",
    "kind": "Figma",
    "owner": "MC",
    "updated": "Yesterday",
    "decisions": 4,
    "meta": "Planning flow, components, handoff · 52 frames"
  },
  {
    "id": "a3",
    "project": "platiful",
    "part": "Research",
    "name": "Meal-planning interviews",
    "kind": "Doc",
    "owner": "PS",
    "updated": "Today",
    "decisions": 2,
    "meta": "8 participants · quotes and opportunity areas"
  },
  {
    "id": "a4",
    "project": "platiful",
    "part": "Research",
    "name": "Beta diary study",
    "kind": "Sheet",
    "owner": "PS",
    "updated": "Yesterday",
    "decisions": 1,
    "meta": "8 participants · 2 weeks of planning habits"
  },
  {
    "id": "a5",
    "project": "platiful",
    "part": "Research",
    "name": "Research synthesis · planning friction",
    "kind": "AI output",
    "owner": "PS",
    "updated": "Today",
    "decisions": 1,
    "meta": "Claude draft · checked against interview notes"
  },
  {
    "id": "a6",
    "project": "platiful",
    "part": "Engineering",
    "name": "platiful/mobile",
    "kind": "Repo",
    "owner": "SO",
    "updated": "Yesterday",
    "decisions": 3,
    "meta": "fix/grocery-units · PR #48 · review requested",
    "files": [
      "src/planning/MealSwap.tsx",
      "src/groceries/mergeItems.ts",
      "src/groceries/OfflineList.tsx"
    ],
    "pr": "PR #48 · Preserve incompatible grocery units · review requested"
  },
  {
    "id": "a7",
    "project": "platiful",
    "part": "Engineering",
    "name": "Grocery-list behavior specification",
    "kind": "Doc",
    "owner": "SO",
    "updated": "Today",
    "decisions": 2,
    "meta": "Unit matching, offline storage, and sync states"
  },
  {
    "id": "a8",
    "project": "platiful",
    "part": "Marketing",
    "name": "Beta onboarding assets",
    "kind": "Figma",
    "owner": "AT",
    "updated": "Yesterday",
    "decisions": 1,
    "meta": "Welcome email and 4 product screenshots"
  },
  {
    "id": "a9",
    "content": {"heading": "November beta · rollout plan", "paragraphs": ["Invite 30 people to the November beta. Keep the beta free; revisit payment after feedback.", "Lead with three dinners and one grocery list. Collect planning feedback and provide support during the beta."]},
    "project": "platiful",
    "part": "Marketing",
    "name": "November beta rollout",
    "kind": "Doc",
    "owner": "AT",
    "updated": "Today",
    "decisions": 2,
    "meta": "30 invitations · support and feedback plan"
  },
  {
    "id": "a10",
    "content": {"heading": "Subject: Your next three dinners, sorted", "paragraphs": ["Welcome to Platiful. Choose a few dinners, swap a recipe, and shop from one grocery list.", "Start your paid trial and plan your first three dinners.", "Draft offer copy · needs review before beta invitations are sent."]},
    "project": "platiful",
    "part": "Marketing",
    "name": "Beta welcome email variants",
    "kind": "AI output",
    "owner": "AT",
    "updated": "Yesterday",
    "decisions": 0,
    "meta": "ChatGPT draft · offer copy needs review"
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

export const ACTIVITY: Activity[] = [
  {
    "project": "platiful",
    "who": "MC",
    "tool": "Figma",
    "aiDoing": "Checking edge cases in the dinner-swap flow",
    "doing": "Dinner swaps and grocery-list handoff",
    "part": "Design",
    "since": "25 min",
    "state": "active"
  },
  {
    "project": "platiful",
    "who": "PS",
    "tool": "Claude",
    "aiDoing": "Comparing diary notes about planning routines",
    "doing": "Planning reminder review",
    "part": "Research",
    "since": "11 min",
    "state": "active"
  },
  {
    "project": "platiful",
    "who": "SO",
    "tool": "Cursor",
    "aiDoing": "Separating grocery items with incompatible units",
    "doing": "Grocery-list merge fix",
    "part": "Engineering",
    "since": "40 min",
    "state": "active"
  },
  {
    "project": "platiful",
    "who": "AT",
    "tool": "ChatGPT",
    "aiDoing": "Revising the beta welcome email",
    "doing": "Beta onboarding copy",
    "part": "Marketing",
    "since": "1 h",
    "state": "active"
  },
  {
    "project": "platiful",
    "who": "LB",
    "doing": "Brand asset review complete",
    "part": "Marketing",
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
  platiful: [
    { name: "Kickoff", date: "Sep 28", done: true },
    { name: "Research done", date: "Oct 12", done: true },
    { name: "Beta design handoff", date: "Oct 30", done: false },
    { name: "30-person beta", date: "Nov 13", done: false },
    { name: "Beta feedback review", date: "Dec 1", done: false },
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

// AI summaries shown on the decisions canvas, one per part and one per project.
// Written by Whyspace from the decisions themselves, refreshed when one changes.
export const PART_SUMMARY: Record<string, string> = {
  Research: "Eight interviews point to flexible planning for one or two people. Start with three dinners; reminder timing still needs diary-study evidence.",
  Design: "Choose dinners before sign-up, keep meals flexible, and make swaps update the grocery list clearly. Recipe-card metadata and suggested first dinners need review.",
  Engineering: "Reuse the React Native app for the iOS beta. Merge groceries only when units match. Offline list access is inferred from Sam’s implementation.",
  Marketing: "Invite 30 waitlist members first. Lead with three dinners and one grocery list. The welcome email still conflicts with the decision to defer the paywall.",
  Pricing: "Defer payment until we understand repeat planning behavior in the beta.",
  Interviews: "Six classmate interviews support short practice sessions after reviewing one lecture.",
  Concept: "Recall generates five questions from one course PDF. Every explanation should have a supporting passage and page reference.",
  Prototype: "Keller designs the upload, practice, and feedback experience. Jordan builds extraction and generation. Test real model failures in the Nov 4 working prototype.",
  "Final crit": "Show the product, the evaluation evidence, and how failures changed the design. Keller and Jordan still need to divide the presentation.",
}
export const PROJECT_DECISION_SUMMARY: Record<string, string> = {
  platiful: "A flexible dinner plan that becomes a grocery list. Start with three meals before sign-up; keep incompatible units separate. Open: reminder timing, first-plan suggestions, and beta offer copy.",
  studio: "Recall turns one course PDF into five practice questions. Our two-person team is building a working flow for Nov 4. Open: citation behavior, unsupported questions, and the critique presentation split.",
}
export const WEEK_SUMMARY: Record<string, string> = {
  platiful: "Grocery merging now preserves incompatible units. Recipe-card metadata and offline list access need confirmation. The beta email still promises a paid trial despite the deferred paywall.",
  studio: "We moved from prewritten prototype questions to a working AI flow. Jordan added source passages; Keller is designing verification and failure states. Two evaluation questions lacked support.",
}
export const CANVAS_EXTRAS: Record<string, { notePart?: string; note?: string; suggestion?: { name: string; from: string; moves: string[]; by: string; reason: string }; ask: string[] }> = {
  platiful: {
    notePart: "Marketing", note: "Ana grouped the beta onboarding decisions · Oct 23",
    suggestion: { name: "Pricing", from: "Marketing", moves: ["freemium"], by: "Priya’s Claude", reason: "Separate the beta offer from the launch messaging so the team can review it explicitly." },
    ask: ["Why do grocery units stay separate?", "What needs my review?", "Show me the planning prototype", "What changed this week?"],
  },
  studio: {
    notePart: "Prototype", note: "Jordan linked the first question evaluation · Today",
    ask: ["Why build a working AI prototype?", "Which questions lacked source support?", "Show me Recall", "What do Jordan and I own?"],
  },
}
