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
    "id": "move",
    "title": "Every element should move to catch a cat's attention",
    "why": "Luna ignored the static card for five minutes, then pounced the moment a notification slid in.",
    "owner": "TR",
    "decidedBy": [
      "TR"
    ],
    "capture": {
      "kind": "person",
      "tool": "Live session",
      "onBehalfOf": "TR",
      "basis": "stated"
    },
    "state": "confirmed",
    "review": "clear",
    "activity": "none",
    "recordedAt": "Oct 22 · 3:40 PM",
    "sections": [
      "Research"
    ],
    "artifacts": [
      {
        "name": "Cat test footage",
        "kind": "Video",
        "anchor": "Luna · 5:55"
      }
    ],
    "source": {
      "title": "Footage review",
      "kind": "Live session",
      "author": "TR",
      "quote": "She only cares when something moves. We need the element to move.",
      "context": "Trevor logged this while the team watched Luna's clip on the live canvas."
    },
    "history": [
      {
        "at": "Oct 22 · 3:40 PM",
        "actor": "TR",
        "event": "Logged the finding and marked it as important."
      }
    ],
    "alternatives": [
      {
        "title": "Keep the card static and brighter",
        "tradeoff": "Simpler to build, but Luna ignored the static card entirely."
      }
    ],
    "relationships": [],
    "confirmedBy": "TR",
    "confirmedAt": "Oct 22 · 3:41 PM"
  },
  {
    "id": "short",
    "title": "The promo video runs 15 seconds",
    "why": "Cats lose interest fast.",
    "reasonInferred": true,
    "owner": "MC",
    "decidedBy": [],
    "capture": {
      "kind": "ai",
      "tool": "Claude",
      "onBehalfOf": "MC",
      "basis": "inferred"
    },
    "state": "proposed",
    "review": "awaiting",
    "activity": "new",
    "recordedAt": "Today · 9:12 AM",
    "sections": [
      "Marketing / Promo video"
    ],
    "artifacts": [
      {
        "name": "Promo video plan",
        "kind": "Doc",
        "anchor": "Length"
      }
    ],
    "source": {
      "title": "Promo video planning",
      "kind": "Claude chat",
      "author": "MC",
      "quote": "Let's keep it short, like 15 seconds.",
      "context": "Claude captured the length from Keller's chat and inferred the reason. Keller confirms or corrects it."
    },
    "history": [
      {
        "at": "Today · 9:12 AM",
        "actor": "Claude",
        "event": "Captured the decision and inferred why."
      }
    ],
    "alternatives": [
      {
        "title": "A 30-second cut",
        "tradeoff": "Room for more features, but cats wander off before the end."
      }
    ],
    "relationships": []
  },
  {
    "id": "pounce",
    "title": "Open the video on Luna's real pounce",
    "why": "Real footage of a cat catching the dot shows the idea in the first second.",
    "owner": "MC",
    "decidedBy": [
      "MC"
    ],
    "capture": {
      "kind": "ai",
      "tool": "Claude",
      "onBehalfOf": "MC",
      "basis": "stated"
    },
    "state": "confirmed",
    "review": "clear",
    "activity": "new",
    "recordedAt": "Today · 9:20 AM",
    "sections": [
      "Marketing / Promo video"
    ],
    "artifacts": [
      {
        "name": "Promo video",
        "kind": "Video",
        "anchor": "0–5 s"
      }
    ],
    "source": {
      "title": "Promo video planning",
      "kind": "Claude chat",
      "author": "MC",
      "quote": "Start with Luna catching the dot. That's the whole idea.",
      "context": "Captured from Keller's chat with Claude."
    },
    "history": [
      {
        "at": "Today · 9:20 AM",
        "actor": "MC",
        "event": "Confirmed the opening shot."
      }
    ],
    "alternatives": [
      {
        "title": "Open on the app screen",
        "tradeoff": "Shows the product, but not why cats care."
      }
    ],
    "relationships": [],
    "confirmedBy": "MC",
    "confirmedAt": "Today · 9:21 AM"
  },
  {
    "id": "nored",
    "title": "Drop red from the brand; use blue and yellow",
    "why": "Cats see red as a dull gray. Blue and yellow are the colors they see best.",
    "owner": "TR",
    "decidedBy": [
      "TR"
    ],
    "capture": {
      "kind": "person",
      "tool": "Whyspace",
      "onBehalfOf": "TR",
      "basis": "stated"
    },
    "state": "confirmed",
    "review": "flagged",
    "activity": "changed",
    "recordedAt": "Oct 23 · 11:05 AM",
    "sections": [
      "Brand"
    ],
    "artifacts": [
      {
        "name": "Brand guidelines",
        "kind": "Figma",
        "anchor": "Color"
      },
      {
        "name": "Poster campaign",
        "kind": "Figma",
        "anchor": "All three posters"
      }
    ],
    "source": {
      "title": "Cat vision research",
      "kind": "Perplexity research",
      "author": "TR",
      "quote": "Cats are dichromats: red reads as gray, blue and yellow stay vivid.",
      "context": "Trevor linked the research and marked the change as important for everyone using the palette."
    },
    "history": [
      {
        "at": "Oct 23 · 11:05 AM",
        "actor": "TR",
        "event": "Replaced tuna red with blue and yellow."
      }
    ],
    "alternatives": [
      {
        "title": "Keep red as an accent",
        "tradeoff": "Familiar to people, but invisible to the cats we are designing for."
      }
    ],
    "relationships": [
      {
        "label": "Replaces",
        "target": "red"
      }
    ],
    "confirmedBy": "TR",
    "confirmedAt": "Oct 23 · 11:05 AM",
    "was": "Tuna red as the primary color",
    "flag": "The poster campaign still uses tuna red."
  },
  {
    "id": "red",
    "title": "Tuna red as the primary color",
    "why": "It felt playful and food-related to the team.",
    "owner": "TR",
    "decidedBy": [
      "TR"
    ],
    "capture": {
      "kind": "person",
      "tool": "Whyspace",
      "onBehalfOf": "TR",
      "basis": "stated"
    },
    "state": "superseded",
    "review": "clear",
    "activity": "none",
    "recordedAt": "Oct 8 · 2:00 PM",
    "sections": [
      "Brand"
    ],
    "artifacts": [
      {
        "name": "Brand guidelines",
        "kind": "Figma",
        "anchor": "Color · v1"
      }
    ],
    "source": {
      "title": "Brand kickoff",
      "kind": "Meeting notes",
      "author": "TR",
      "quote": "Let's go with tuna red.",
      "context": "Recorded at the brand kickoff."
    },
    "history": [
      {
        "at": "Oct 8 · 2:00 PM",
        "actor": "TR",
        "event": "Recorded the first palette."
      },
      {
        "at": "Oct 23 · 11:05 AM",
        "actor": "TR",
        "event": "Replaced by blue and yellow."
      }
    ],
    "alternatives": [],
    "relationships": [
      {
        "label": "Replaced by",
        "target": "nored"
      }
    ],
    "confirmedBy": "TR",
    "confirmedAt": "Oct 8 · 2:00 PM"
  }
]
