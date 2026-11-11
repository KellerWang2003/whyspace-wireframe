/* The illustration system, written down once. The design system page renders it, and the prompt
   you paste into an image tool is built from it, so the two never drift apart.
   Drawn from Keller's full painted set (12 pieces): welcome, create project, invite people,
   connect tools, meet your helper, loading, syncing, something went wrong, thinking,
   lost connection, no access, all saved. */

// The one idea every piece shows.
export const IDEA = "Separate strands become one shared thread"

// What the ribbon can do. Every piece is one of these, still or moving.
export const ACTIONS = [
  { verb: "Hold out", means: "An offer, a start", where: "Welcome, sign up" },
  { verb: "Pass", means: "Bringing someone in", where: "Invite, join" },
  { verb: "Lay out", means: "Making room", where: "New project, empty pages" },
  { verb: "Unroll", means: "Nothing yet, ready to begin", where: "No projects, no threads" },
  { verb: "Knot", means: "Things joined into one", where: "Create project" },
  { verb: "Braid", means: "Work coming together", where: "Loading" },
  { verb: "Loop", means: "Thinking it over", where: "Your Duet is working" },
  { verb: "Carry", means: "Bringing context along", where: "Your Duet, connect tools" },
  { verb: "Tangle", means: "Something is off", where: "Errors" },
  { verb: "Cut", means: "A link is gone", where: "Lost connection, deleted" },
  { verb: "Tie a bow", means: "Done, or kept for you", where: "All caught up, no access" },
] as const

// Sampled from the painted set. The brand pigments, watered down.
export const PAINT = [
  { name: "Leaf", hex: "#8FA05A", use: "Ribbons, clothes" },
  { name: "Olive", hex: "#6F7A42", use: "Cuffs, dark clothes" },
  { name: "Forest", hex: "#3F4A2A", use: "Hair, glyphs" },
  { name: "Apricot", hex: "#F7A660", use: "Ribbons, clothes" },
  { name: "Rose", hex: "#EE8E9A", use: "Ribbons, clothes" },
  { name: "Sky", hex: "#8DB6D6", use: "Ribbons, clothes" },
  { name: "Peach", hex: "#FDE9D3", use: "Doors, big light objects" },
  { name: "Card", hex: "#F6F1E6", use: "Paper, cards" },
] as const

export const SKIN = [
  { name: "Light", hex: "#F6C49B" },
  { name: "Tan", hex: "#D79A63" },
  { name: "Deep", hex: "#8A5A3A" },
] as const

// Tile washes. Pick one the piece barely uses, so the ribbon stands out.
export const WASH = [
  { name: "Leaf wash", hex: "#EEF4E4" },
  { name: "Sky wash", hex: "#E2F1FC" },
  { name: "Apricot wash", hex: "#FDEFE1" },
  { name: "Rose wash", hex: "#FBEFF1" },
] as const

export const RULES = {
  paint: [
    "Watercolor and gouache on cold-press paper",
    "One flat wash per shape, grain showing, darker at the rim",
    "Ribbons are see-through: where two cross, the color deepens",
    "Detail is a second wash of the same color",
    "No outlines, shadows, gradients or highlights",
  ],
  ribbon: [
    "In every piece, doing one action",
    "Wide and flat, with cut or notched ends",
    "One color per strand, three or four strands at most",
    "Folds and crossings are darker overlaps",
  ],
  hands: [
    "Enter from an edge on a diagonal",
    "Colored cuff, arm cropped by the frame",
    "Mitten fingers, a clear thumb",
    "Two hands are two skin tones",
    "Hands-only pieces show no heads or bodies",
  ],
  figures: [
    "Faceless, round heads, chunky bodies",
    "From above for groups and places",
    "From behind for waiting",
    "From the side only when walking",
    "Hair is a forest or warm brown mass. One-color clothes",
  ],
  objects: [
    "Soft rounded rectangles: doors, cards, tiles, bubbles",
    "Glyphs are short, thick forest strokes",
    "Only what the action needs",
  ],
  composition: [
    "One idea, one action",
    "The thing it is about is big and clear",
    "A gentle diagonal, at least 40% empty",
    "Three short dashes at most, for \"it just happened\"",
  ],
  frame: [
    "Float: on the paper, no edge. Dialogs and empty states",
    "Tile: a pale wash square, soft uneven edge. Full pages and motion",
    "Inline: text-size, motion only",
  ],
  motion: [
    "Motion is the action, played",
    "Moving ribbons are drawn in code as a marker stroke: same colors, cut ends, grain",
    "Paintings don't loop. They fade up 8px in 400ms, then hold",
    "One thing moves. Hands only move to finish the action",
    "Eased, 2 to 6 second loops. No bounce, no squash",
    "Reduced motion shows the last frame",
  ],
} as const

// Motion per state: which action plays, and how.
export const MOTION = [
  { state: "Loading", action: "Braid", how: "A pen draws one ribbon while the view pans; it loops now and then", time: "Continuous" },
  { state: "Duet is working", action: "Loop", how: "One loop draws itself, then lets go", time: "2.4s loop" },
  { state: "Lost connection", action: "Cut", how: "Two clean ends drift a little apart and back", time: "4s loop" },
  { state: "Something went wrong", action: "Tangle", how: "Painted. Fades up, holds", time: "400ms in" },
  { state: "All caught up", action: "Tie a bow", how: "Painted. Fades up, holds", time: "400ms in" },
] as const

export type Framing = "float" | "tile"

const STYLE = `Hand-painted watercolor and gouache illustration on white cold-press paper, in the style of a calm editorial spot illustration. Flat, simple, chunky rounded shapes. Each shape is one translucent wash with visible paper grain, soft mottled blooms inside and a slightly darker pooled rim at its edge. Ribbons are translucent: where two cross or fold, the colors multiply into a deeper shade. Small details are a second, darker wash of the same color. No outlines, no line art, no shadows, no gradients, no highlights, no 3D, no text.
The main motif is wide, flat painted ribbons with cut or notched ends, one color per strand, never more than four strands.
People are faceless with round heads and chunky bodies: seen from directly above for groups, from behind when waiting, from the side only when walking. Hair is a solid dark forest-green or warm brown mass; clothes are one color. Hands enter from the edge of the frame on a diagonal with a colored sleeve cuff and the arm cropped; mitten-like fingers with a clear thumb. When the subject is hands, show only hands and cuffs, never heads or bodies. Two hands are always two different skin tones (light #F6C49B, tan #D79A63, deep #8A5A3A).
Muted, washy colors only: leaf #8FA05A, olive #6F7A42, forest #3F4A2A, apricot #F7A660, rose #EE8E9A, sky #8DB6D6, peach #FDE9D3, card #F6F1E6.
One idea, one action. The object the idea is about is large and clear. Generous empty space (at least 40%), a gentle diagonal flow.`

const FRAME: Record<Framing, (wash: string) => string> = {
  float: () => "Framing: on pure white (#FFFFFF), no paper tint or texture outside the shapes, no background, no border. Square.",
  tile: (wash) => `Framing: on a pale ${wash} watercolor square that fills the frame, with a soft, slightly uneven painted edge and a thin white margin. Square.`,
}

export function illustrationPrompt(action = "{ribbon action}", subject = "{one idea, one action}", colors = "{2 to 3 colors}", framing: Framing = "float", wash = "leaf wash #EEF4E4") {
  return `${STYLE}\nRibbon action: ${action}.\nSubject: ${subject}\nColors: ${colors}.\n${FRAME[framing](wash)}`
}

export type Spot = {
  id: string
  label: string
  where: string
  action: (typeof ACTIONS)[number]["verb"] | "—"
  framing: Framing
  source: "keller" | "new" | "code" | "plain"
  /** For new paintings: what to paint. */
  subject?: string
  colors?: string
  wash?: string
}

// Every illustration spot in the app. "keller" = from Keller's painted set, "new" = painted from
// the prompt, "code" = drawn and moved in code, "plain" = stays without art.
export const SPOTS: Spot[] = [
  { id: "welcome", label: "Welcome", where: "Sign up, log in", action: "Hold out", framing: "float", source: "keller" },
  { id: "create-project", label: "Create project", where: "Onboarding", action: "Knot", framing: "float", source: "keller" },
  { id: "invite", label: "Invite people", where: "Invite dialog", action: "Pass", framing: "float", source: "keller" },
  { id: "join", label: "Join from an invite", where: "Join a workspace", action: "Pass", framing: "float", source: "new",
    subject: "the other side of an invite: one open hand from the bottom right receives the end of a ribbon that comes in from the top left edge; only the ribbon end and the receiving hand are visible",
    colors: "rose ribbon, sky cuff" },
  { id: "tools", label: "Connect tools", where: "My AI tools, none connected", action: "Carry", framing: "float", source: "keller" },
  { id: "helper", label: "Meet your Duet", where: "First visit to the Duet tab", action: "Carry", framing: "float", source: "keller" },
  { id: "no-projects", label: "No projects yet", where: "Projects", action: "Unroll", framing: "float", source: "new",
    subject: "three ribbon rolls standing on the empty paper, seen from slightly above, each still wound; one has begun to unroll, its loose end running out across the paper. No people, no hands",
    colors: "leaf, apricot and rose rolls" },
  { id: "no-threads", label: "No threads yet", where: "New project Home, Tasks, Artifacts", action: "Lay out", framing: "float", source: "new",
    subject: "seen from above, a single person sitting at the edge of the paper lays one ribbon down in a wide, open curve, marking out an empty space in front of them",
    colors: "apricot ribbon, leaf clothes" },
  { id: "nothing-yet", label: "Nothing yet", where: "Today in a new workspace", action: "Lay out", framing: "float", source: "new",
    subject: "one ribbon lying flat and straight across the paper, nothing tied to it yet, a single hand from the bottom left edge smoothing it flat",
    colors: "leaf ribbon, apricot cuff" },
  { id: "no-chats", label: "No chats yet", where: "Chats", action: "Hold out", framing: "float", source: "new",
    subject: "seen from directly above, two people at opposite corners of the paper, each holding out the end of a ribbon toward the other; the two ends point at each other across the empty middle",
    colors: "sky and rose clothes, the same two colors for their ribbons" },
  { id: "caught-up", label: "All caught up", where: "Today and Duet, after the last item", action: "Tie a bow", framing: "float", source: "new",
    subject: "two hands from opposite corners pulling a ribbon bow tight around a small stack of three paper cards",
    colors: "apricot ribbon, card paper, olive and sky cuffs" },
  { id: "loading", label: "Loading", where: "Opening Whyspace", action: "Braid", framing: "tile", source: "code" },
  { id: "thinking", label: "Duet is working", where: "Duet reply, inline", action: "Loop", framing: "tile", source: "code" },
  { id: "went-wrong", label: "Something went wrong", where: "Full page, app crash", action: "Tangle", framing: "tile", source: "keller" },
  { id: "lost-connection", label: "Lost connection", where: "Banner while offline", action: "Cut", framing: "tile", source: "code" },
  { id: "gone", label: "Isn't here anymore", where: "Deleted thread or chat, old link", action: "Cut", framing: "tile", source: "new",
    subject: "a ribbon cut clean; the long part lies across the paper and the short cut-off end lies on its own nearby. No tools, no people",
    colors: "sky ribbon", wash: "apricot wash #FDEFE1" },
  { id: "no-access", label: "No access", where: "A project you're not in", action: "Tie a bow", framing: "tile", source: "keller" },
  { id: "saved", label: "Saved", where: "Toasts", action: "Tie a bow", framing: "tile", source: "plain" },
]
