import { MarkIcon } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { Group } from "./kit"
import { ZoomImage } from "./zoom-image"

// Explorations: the options we tried for this design system and which one won, so a decision can be
// traced back to what it beat. Newest first. The pictures are screenshots of the option pickers and
// playgrounds at the time (public/ds-explorations), enlarged in the page on click; the pickers themselves are mostly gone.
// When a new exploration ends, add it at the top.

type Shot = { src: string; caption: string; wide?: boolean }
type Exploration = {
  title: string
  when: string
  tried: string
  options: string[]
  // The option that won, as written in options. Leave it out while the choice is still open.
  picked?: string
  outcome?: string
  shots: Shot[]
}

const img = (name: string) => `${import.meta.env.BASE_URL}ds-explorations/${name}.webp`

const EXPLORATIONS: Exploration[] = [
  {
    title: "Skipping a Needs you card",
    when: "Nov 13",
    tried: "Skip used to send a card to the back of the stack, so it came around again. Keller wanted a skipped card out of the stack, with a small count and a way back. Three ways for skipped cards to come back, each built on Today.",
    options: ["Skipped list", "Pile under the stack", "Back on their own"],
    picked: "Skipped list",
    outcome: "A skipped card leaves the stack and the Today badge. “2 skipped” at the top right of Needs you opens the list, and Put back puts a card on top of the stack. It stays skipped until you put it back.",
    shots: [{ src: img("needs-skip"), caption: "1 Skipped list, 2 Pile under the stack, 3 Back on their own", wide: true }],
  },
  {
    title: "Illustrations",
    when: "Nov 11",
    tried: "Started from Keller's painted sheet, then drew everything in code with the marker ribbon from Loading and the Duet loop. People drawn in code looked wrong, so people are painted in Figma AI with empty hands and the ribbon is drawn in code from the hand. Then we tried a person in every spot.",
    options: ["A person everywhere", "A mix: a person only for people moments"],
    picked: "A mix: a person only for people moments",
    outcome: "A person only when the moment is about you, your Duet or resting; the rest is just the ribbon, drawn in code, and moves. Each color has one meaning: rose for wrong or blocked, leaf for starting something, apricot for people and rest, sky for your Duet and AI tools. Invite people keeps its painted hands.",
    shots: [
      { src: img("illustrations-final"), caption: "The set", wide: true },
      { src: img("illustrations-people"), caption: "A person in every spot", wide: true },
      { src: img("illustrations-options"), caption: "Last round of options: No projects A and New project B won", wide: true },
    ],
  },
  {
    title: "Bars, tabs and tables",
    when: "Nov 11",
    tried: "Keller dropped the sheet tab and disliked two gray bars stacked at different heights (views over the table header). Four tab looks first (#/playground/system/tabs-again), then four system rules for where the gray layer may go (#/playground/system/bars).",
    options: ["Bar on the table", "Bar on the controls", "One tray", "Same height"],
    picked: "One tray",
    outcome: "Gray is a tray that holds things, never a stripe: the table sits in the gray layer like the rows do. Views and switches are text with a soft tile on the open one, line tabs carry a Forest marker, and every control in a toolbar row is 36px.",
    shots: [
      { src: img("system-bars"), caption: "1 Bar on the table, 2 Bar on the controls, 3 One tray, 4 Same height", wide: true },
      { src: img("system-tabs-again"), caption: "Tabs, again: Marker, Quiet fill, Ink underline, Serif", wide: true },
    ],
  },
  {
    title: "Paint on components",
    when: "Nov 11",
    tried: "The brand's paint on top of each pick: hand-drawn edges, watercolor washes, marker strokes and the thread running through lists (#/playground/paint).",
    options: ["Picks as they are", "Painted"],
    picked: "Picks as they are",
    outcome: "Components stay as picked; the paint stays in illustrations and quiet spots.",
    shots: [
      { src: img("painted-round"), caption: "Rows: picked, pigment edge, thread through", wide: true },
      { src: img("painted-round-card"), caption: "Decision card: picked, painted header, on a thread", wide: true },
    ],
  },
  {
    title: "Inputs",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Filled", "Paper ring", "Underline"],
    picked: "Paper ring",
    outcome: "Fields are paper with a faint ring; focus draws the ring in leaf.",
    shots: [{ src: img("system-inputs"), caption: "1 Filled, 2 Paper ring, 3 Underline", wide: true }],
  },
  {
    title: "Choices",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Soft", "Painted", "Ring"],
    picked: "Soft",
    outcome: "Gray fills when off, Forest when on. The chosen segment takes Painted's gray pebble.",
    shots: [{ src: img("system-choices"), caption: "1 Soft, 2 Painted, 3 Ring", wide: true }],
  },
  {
    title: "Tabs",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Sheet tab", "Marker", "Quiet fill"],
    picked: "Sheet tab",
    outcome: "The open tab was paper cut from the gray layer, like the rail's sheet tab. Replaced the same day by One tray (Bars, tabs and tables).",
    shots: [{ src: img("system-tabs"), caption: "1 Sheet tab, 2 Marker, 3 Quiet fill", wide: true }],
  },
  {
    title: "Menus and dialogs",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Paper", "Layer", "Ink"],
    picked: "Paper",
    outcome: "Menus, popovers and dialogs are paper with a faint ring; dialog titles are in the serif.",
    shots: [{ src: img("system-menus"), caption: "1 Paper, 2 Layer, 3 Ink", wide: true }],
  },
  {
    title: "Rows",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Tiles", "Tray", "Ruled"],
    picked: "Tray",
    outcome: "Paper rows held in the gray layer, with more room inside each row.",
    shots: [{ src: img("system-rows"), caption: "1 Tiles, 2 Tray, 3 Ruled", wide: true }],
  },
  {
    title: "Decision card",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Tile", "Pigment", "Ledger"],
    picked: "Pigment",
    outcome: "The card's header is washed in its thread's pigment.",
    shots: [{ src: img("system-card"), caption: "1 Tile, 2 Pigment, 3 Ledger", wide: true }],
  },
  {
    title: "Table",
    when: "Nov 11",
    tried: "Three high-fi options side by side, drawn on the real components.",
    options: ["Layer header", "Tiles", "Ruled"],
    picked: "Layer header",
    outcome: "The header row sat in the gray layer. Replaced the same day by One tray (Bars, tabs and tables): the whole table sits in the layer.",
    shots: [{ src: img("system-table"), caption: "1 Layer header, 2 Tiles, 3 Ruled", wide: true }],
  },
  {
    title: "Title weight",
    when: "Nov 11",
    tried: "Geist Serif has one weight, so titles were thickened with a thin stroke at four strengths.",
    options: ["None", "0.35px", "0.5px", "0.7px"],
    picked: "0.5px",
    outcome: "Titles like Today are one step heavier under High-fi.",
    shots: [{ src: img("title-weight"), caption: "From the top: none, 0.35px, 0.5px, 0.7px" }],
  },
  {
    title: "Button shape",
    when: "Nov 11",
    tried: "Under the rounder high-fi shape, every button first became a pill.",
    options: ["Pill", "Rounded rectangle"],
    picked: "Rounded rectangle",
    outcome: "Buttons and segmented controls use 10px corners; fields, cards and the page stay round.",
    shots: [{ src: img("buttons-pill"), caption: "The pill version, before" }],
  },
  {
    title: "Needs you stack",
    when: "Nov 11",
    tried: "How much of the cards waiting behind should show, and how the next card arrives. The painted pieces stay; they only peek out on the right and below.",
    options: ["Peek below", "One piece", "Small tilt"],
    picked: "Peek below",
    outcome: "Two pieces peek out below and on the right, and the next card rises from behind.",
    shots: [
      { src: img("stack-peek"), caption: "Peek below" },
      { src: img("stack-one"), caption: "One piece" },
      { src: img("stack-tilt"), caption: "Small tilt" },
    ],
  },
  {
    title: "Suggested actions",
    when: "Nov 11",
    tried: "The answers on a Needs you card are suggestions, so they were drawn as suggestions in three ways.",
    options: ["Chips", "List", "Footer"],
    picked: "Chips",
    shots: [{ src: img("suggested"), caption: "Chips, List, Footer, and Chips on a guess" }],
  },
  {
    title: "Count badges",
    when: "Nov 11",
    tried: "Four looks for the counts on the rail and in lists.",
    options: ["Ink", "Painted pebble", "Marker ring", "Sticky note"],
    picked: "Painted pebble",
    outcome: "Painted, a little more saturated than Forest for contrast.",
    shots: [{ src: img("badges"), caption: "Ink, Painted pebble, Marker ring, Sticky note" }],
  },
  {
    title: "Project icons",
    when: "Nov 11",
    tried: "Each project gets an icon you can change, with a default for new projects.",
    options: ["Ink tile", "Pigment wash", "Painted"],
    picked: "Painted",
    outcome: "Some colors take a white icon.",
    shots: [{ src: img("project-icons"), caption: "Ink tile, Pigment wash, Painted", wide: true }],
  },
  {
    title: "Rail open tab",
    when: "Nov 9 and Nov 11",
    tried: "The bar on the rail's left edge went away, so the open tab needed its own look. A gray tile came first; under High-fi it was tried again.",
    options: ["Sheet tab", "Gray tile", "Ink only"],
    picked: "Sheet tab",
    outcome: "The open tab is paper and runs into the page.",
    shots: [
      { src: img("rail-tab-nov11"), caption: "Nov 11: Sheet tab, Gray tile, Ink only" },
      { src: img("rail-tab-nov9"), caption: "Nov 9: Gray tile, Paper tile, Ink tile", wide: true },
    ],
  },
  {
    title: "Duet replies in chats",
    when: "Nov 11",
    tried: "The Duet's answers in a chat folded away like a Slack thread reply, in twelve versions, with the reason one click away.",
    options: ["Versions 1 to 12"],
    picked: "Version 10",
    shots: [
      { src: img("fold-all"), caption: "Versions 1 to 8", wide: true },
      { src: img("fold-v10"), caption: "Version 10, picked" },
    ],
  },
  {
    title: "Duet faces",
    when: "Nov 11",
    tried: "Every Duet gets its own face, made from the brand's painting, that each person can change.",
    options: ["Painted pebble", "Two strands", "Ink doodle"],
    picked: "Painted pebble",
    shots: [{ src: img("faces"), caption: "Painted pebble, Two strands, Ink doodle", wide: true }],
  },
  {
    title: "Illustrations",
    when: "Nov 11",
    tried: "Where painted art sits in empty states and rare moments, and which pieces to keep.",
    options: ["Float"],
    picked: "Float",
    outcome: "The art sits straight on the paper, with no frame.",
    shots: [{ src: img("illustrations"), caption: "The Illustrations section after the pick" }],
  },
  {
    title: "Icon set",
    when: "Nov 11",
    tried: "Lucide, Phosphor and Iconoir side by side in the app, then Lucide at thinner strokes.",
    options: ["Lucide", "Phosphor", "Iconoir"],
    picked: "Lucide",
    outcome: "Drawn at 1.5px under High-fi.",
    shots: [
      { src: img("icons-sets"), caption: "The three sets in the same slice of the app" },
      { src: img("icons-stroke"), caption: "Lucide at 1.5, 1.75 and 2px" },
    ],
  },
  {
    title: "High-fi shape",
    when: "Nov 11",
    tried: "A softer, more human look tried on Today: rounder corners, more room, the rail as a layer behind the page, Needs you as a stack. First as its own switch, then folded into High-fi and made lighter.",
    options: ["Wireframe shape", "Softer look", "Lighter softer look"],
    picked: "Lighter softer look",
    outcome: "No drop shadows and few strokes; fills and layers instead.",
    shots: [
      { src: img("shape-before"), caption: "Before" },
      { src: img("shape-soft"), caption: "First softer look" },
      { src: img("shape-light"), caption: "Lighter, the one we kept" },
    ],
  },
  {
    title: "Confidence marker",
    when: "Nov 10",
    tried: "Three ways to show how sure the Duet was about what it answered or decided for you.",
    options: ["Meter", "Words", "Decision marks"],
    picked: "Meter",
    shots: [{ src: img("confidence"), caption: "Meter, Words, Decision marks", wide: true }],
  },
  {
    title: "Needs you",
    when: "Nov 9",
    tried: "Three plans for what needs you: ask the real question, group by what changed, or one at a time.",
    options: ["Ask the real question", "Group by what changed", "One at a time"],
    picked: "One at a time",
    shots: [],
  },
  {
    title: "High-fi direction",
    when: "Nov 5",
    tried: "Visual directions for the whole app, drawn on Today and a project's home.",
    options: ["Editorial", "Studio", "Weave", "Gesture", "Blocks", "Painterly"],
    picked: "Editorial",
    outcome: "Type and hairlines; brand painting only in quiet spots.",
    shots: [
      { src: img("hifi-editorial"), caption: "Editorial" },
      { src: img("hifi-editorial-v2"), caption: "Editorial, second pass" },
      { src: img("hifi-blocks"), caption: "Blocks" },
      { src: img("hifi-painterly"), caption: "Painterly" },
      { src: img("hifi-studio"), caption: "Studio", wide: true },
      { src: img("hifi-weave"), caption: "Weave", wide: true },
      { src: img("hifi-gesture"), caption: "Gesture", wide: true },
    ],
  },
  {
    title: "Left navigation",
    when: "Nov 3",
    tried: "Ways to move between many projects with many threads each.",
    options: ["Drill in", "Rail", "Views and panel", "Switcher", "Dock"],
    picked: "Rail",
    shots: [
      { src: img("nav-rail"), caption: "Rail" },
      { src: img("nav-drill"), caption: "Drill in" },
      { src: img("nav-views"), caption: "Views and panel" },
      { src: img("nav-switcher"), caption: "Switcher" },
      { src: img("nav-dock"), caption: "Dock" },
    ],
  },
  {
    title: "Decisions layouts",
    when: "Nov 2",
    tried: "Laying out a project's decisions by thread, with views as plain filters.",
    options: ["Sections", "Rail", "Board", "Cards", "Map"],
    outcome: "No pick yet.",
    shots: [
      { src: img("decisions-sections"), caption: "Sections" },
      { src: img("decisions-rail"), caption: "Rail" },
      { src: img("decisions-board"), caption: "Board" },
      { src: img("decisions-cards"), caption: "Cards" },
      { src: img("decisions-map"), caption: "Map" },
    ],
  },
]

export function ExplorationsSection() {
  return (
    <>
      {EXPLORATIONS.map((e) => (
        <Group key={e.title} title={e.title} note={e.when}>
          <div className="flex flex-col gap-4">
            <p className="max-w-[64ch] type-body text-pretty">{e.tried}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Options">
              {e.options.map((o) => {
                const won = o === e.picked
                return (
                  <li key={o} className={cn("flex items-center gap-1.5 type-body", won ? "text-foreground" : "text-muted-foreground")}>
                    <MarkIcon mark={won ? "filled" : "empty"} className="size-3" />
                    {o}
                  </li>
                )
              })}
              {e.picked && !e.options.includes(e.picked) && (
                <li className="flex items-center gap-1.5 type-body text-foreground"><MarkIcon mark="filled" className="size-3" />{e.picked}</li>
              )}
            </ul>
            {e.outcome && <p className="type-caption text-muted-foreground">{e.outcome}</p>}
            {e.shots.length > 0 && (
              <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                {e.shots.map((s, i) => (
                  <figure key={s.src} className={cn("flex min-w-0 flex-col gap-2", s.wide && "sm:col-span-2")}>
                    <ZoomImage pics={e.shots} index={i} />
                    <figcaption className="type-caption text-muted-foreground">{s.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </Group>
      ))}
    </>
  )
}
