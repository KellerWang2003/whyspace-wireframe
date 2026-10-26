export type DecisionRecord = {
  id: string
  title: string
  why: string
  reasonInferred?: boolean
  owner: string
  decidedBy: string[]
  capture: { kind: 'person' | 'ai'; tool: string; onBehalfOf: string; basis: 'stated' | 'inferred' }
  state: 'proposed' | 'confirmed' | 'superseded'
  review: 'awaiting' | 'flagged' | 'clear'
  activity: 'new' | 'changed' | 'none'
  confirmedBy?: string
  confirmedAt?: string
  recordedAt: string
  sections: string[]
  artifacts: { name: string; kind: string; anchor: string }[]
  source: { title: string; kind: string; author: string; quote: string; context: string }
  history: { at: string; actor: string; event: string }[]
  alternatives: { title: string; tradeoff: string }[]
  relationships: { label: string; target: string }[]
  was?: string
  flag?: string
}

// Purpose-built examples, isolated from the app's decisions and confirmation state.
export const DECISION_EXAMPLES: DecisionRecord[] = [
  {
    "id": "photo",
    "title": "Choose dinners before creating an account",
    "why": "Four of six testers wanted to see useful recipes before sharing an email address.",
    "owner": "MC",
    "decidedBy": [
      "MC"
    ],
    "capture": {
      "kind": "person",
      "tool": "Figma",
      "onBehalfOf": "MC",
      "basis": "stated"
    },
    "state": "confirmed",
    "review": "clear",
    "activity": "none",
    "recordedAt": "Oct 22 · 2:15 PM",
    "sections": [
      "Design / Choose dinners"
    ],
    "artifacts": [
      {
        "name": "Platiful planning prototype",
        "kind": "Design",
        "anchor": "First plan · save dinners"
      }
    ],
    "source": {
      "title": "Choose dinners before creating an account · review",
      "kind": "Design review notes",
      "author": "MC",
      "quote": "Let people choose three dinners, then offer an account to save the plan.",
      "context": "Captured from the team’s review. A person confirms the product decision before implementation."
    },
    "history": [
      {
        "at": "Oct 25 · 9:12 AM",
        "actor": "MC",
        "event": "Recorded the choice and its supporting context."
      }
    ],
    "alternatives": [
      {
        "title": "Require sign-up first",
        "tradeoff": "Captures email sooner, but blocks people before they see the value."
      }
    ],
    "relationships": [],
    "confirmedBy": "MC",
    "confirmedAt": "Oct 25 · 10:04 AM"
  },
  {
    "id": "local",
    "title": "Keep the last grocery list available offline",
    "why": "Supermarket connectivity should not block access to an existing shopping list.",
    "owner": "SO",
    "decidedBy": [],
    "capture": {
      "kind": "ai",
      "tool": "Cursor",
      "onBehalfOf": "SO",
      "basis": "inferred"
    },
    "state": "proposed",
    "review": "awaiting",
    "activity": "new",
    "recordedAt": "Oct 25 · 9:12 AM",
    "sections": [
      "Engineering / Offline grocery list"
    ],
    "artifacts": [
      {
        "name": "platiful/mobile",
        "kind": "Repository",
        "anchor": "src/groceries/OfflineList.tsx"
      }
    ],
    "source": {
      "title": "Keep the last grocery list available offline · review",
      "kind": "AI chat excerpt",
      "author": "SO",
      "quote": "Cache the last list locally and sync edits when the connection returns.",
      "context": "Captured from the team’s review. A person confirms the product decision before implementation."
    },
    "history": [
      {
        "at": "Oct 25 · 9:12 AM",
        "actor": "SO",
        "event": "Recorded the choice and its supporting context."
      }
    ],
    "alternatives": [
      {
        "title": "Fetch the list on every visit",
        "tradeoff": "Simpler storage, but leaves shoppers without a list when connectivity drops."
      }
    ],
    "relationships": [],
    "reasonInferred": true
  },
  {
    "id": "type",
    "title": "Show time and servings on every recipe card",
    "why": "People need to compare dinners without opening every recipe; long titles must not hide the metadata.",
    "owner": "MC",
    "decidedBy": [
      "MC"
    ],
    "capture": {
      "kind": "ai",
      "tool": "Claude",
      "onBehalfOf": "MC",
      "basis": "inferred"
    },
    "state": "confirmed",
    "review": "clear",
    "activity": "new",
    "recordedAt": "Oct 25 · 9:12 AM",
    "sections": [
      "Design / Weekly meal plan"
    ],
    "artifacts": [
      {
        "name": "Platiful product design",
        "kind": "Design",
        "anchor": "Recipe card · compact variant"
      }
    ],
    "source": {
      "title": "Show time and servings on every recipe card · review",
      "kind": "AI chat excerpt",
      "author": "MC",
      "quote": "Keep cooking time and servings visible, including when the title wraps.",
      "context": "Captured from the team’s review. A person confirms the product decision before implementation."
    },
    "history": [
      {
        "at": "Oct 25 · 9:12 AM",
        "actor": "MC",
        "event": "Recorded the choice and its supporting context."
      }
    ],
    "alternatives": [
      {
        "title": "Hide metadata in recipe details",
        "tradeoff": "Creates smaller cards but makes comparing dinners slower."
      }
    ],
    "relationships": [],
    "confirmedBy": "MC",
    "confirmedAt": "Oct 25 · 10:04 AM"
  },
  {
    "id": "ondevice",
    "title": "Combine groceries only when ingredient and unit match",
    "why": "The prototype added tablespoons to grams. Preserve separate rows until conversion rules are verified.",
    "owner": "SO",
    "decidedBy": [
      "SO"
    ],
    "capture": {
      "kind": "person",
      "tool": "Whyspace",
      "onBehalfOf": "SO",
      "basis": "stated"
    },
    "state": "confirmed",
    "review": "flagged",
    "activity": "changed",
    "recordedAt": "Oct 22 · 2:15 PM",
    "sections": [
      "Engineering / Grocery merging"
    ],
    "artifacts": [
      {
        "name": "platiful/mobile",
        "kind": "Repository",
        "anchor": "src/groceries/mergeItems.ts"
      }
    ],
    "source": {
      "title": "Combine groceries only when ingredient and unit match · review",
      "kind": "Design review notes",
      "author": "SO",
      "quote": "Only combine a matching ingredient when the units match too.",
      "context": "Captured from the team’s review. A person confirms the product decision before implementation."
    },
    "history": [
      {
        "at": "Oct 25 · 9:12 AM",
        "actor": "SO",
        "event": "Recorded the choice and its supporting context."
      }
    ],
    "alternatives": [
      {
        "title": "Convert all quantities automatically",
        "tradeoff": "Produces fewer rows but risks incorrect amounts without verified conversions."
      }
    ],
    "relationships": [
      {
        "label": "Replaces",
        "target": "cloud"
      }
    ],
    "confirmedBy": "SO",
    "confirmedAt": "Oct 25 · 10:04 AM",
    "was": "Combine all quantities with the same ingredient name",
    "flag": "The grocery-list prototype still shows one combined quantity for incompatible units."
  },
  {
    "id": "cloud",
    "title": "Combine all quantities with the same ingredient name",
    "why": "The initial prototype used a single ingredient row to keep the grocery list short.",
    "owner": "SO",
    "decidedBy": [
      "SO"
    ],
    "capture": {
      "kind": "person",
      "tool": "Whyspace",
      "onBehalfOf": "SO",
      "basis": "stated"
    },
    "state": "superseded",
    "review": "clear",
    "activity": "none",
    "recordedAt": "Oct 22 · 2:15 PM",
    "sections": [
      "Engineering / Grocery merging"
    ],
    "artifacts": [
      {
        "name": "Grocery-list behavior specification",
        "kind": "Repository",
        "anchor": "Initial merge rule"
      }
    ],
    "source": {
      "title": "Combine all quantities with the same ingredient name · review",
      "kind": "Design review notes",
      "author": "SO",
      "quote": "Group quantities by ingredient name for the first prototype.",
      "context": "Captured from the team’s review. A person confirms the product decision before implementation."
    },
    "history": [
      {
        "at": "Oct 25 · 9:12 AM",
        "actor": "SO",
        "event": "Recorded the choice and its supporting context."
      }
    ],
    "alternatives": [
      {
        "title": "Keep every recipe ingredient separate",
        "tradeoff": "Avoids incorrect sums but creates a repetitive list."
      }
    ],
    "relationships": [
      {
        "label": "Replaced by",
        "target": "ondevice"
      }
    ],
    "confirmedBy": "SO",
    "confirmedAt": "Oct 25 · 10:04 AM"
  }
]
