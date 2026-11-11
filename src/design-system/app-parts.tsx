import type { CSSProperties } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Greeting, Messages } from "@/components/app/ask-whyspace"
import { ME, PEOPLE, decisionById } from "@/data"
import { Message } from "@/app/chats"
import { chatById, foldReplies, msgsOf } from "@/app/chats-model"
import { NeedsFocus } from "@/app/needs-focus"
import { useNeedsItems, useNeedsQueue } from "@/app/needs-model"
import { RailSidebar } from "@/app/rail-sidebar"
import { Bubble, DuetNote } from "@/app/reply-dialog"
import { useTodayRows } from "@/app/today-model"
import { setStackLook, useStackLook, type StackBehind, type StackMotion } from "@/app/needs-stack"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Group, Specimen } from "./kit"

// The app's own pieces that aren't shadcn components: Needs you, the rail, and messages.
// Each is the real component with Whiskr content, so answering or skipping here acts as it does in the app.

/* ---------- Needs you ---------- */

export function NeedsSection() {
  const queue = useNeedsQueue(useNeedsItems(useTodayRows()))
  return (
    <>
      <Group title="Stack options" note="Temporary: pick how much shows behind and how the next card arrives. Today follows this too.">
        <StackPicker />
      </Group>
      <Group title="On Today" note="One at a time, with its source and the answers as Suggested chips; the next ones wait behind">
        <div className="max-w-3xl"><NeedsFocus queue={queue} onOpen={() => {}} /></div>
      </Group>
      <Group title="Compact" note="Beside a thread">
        <div className="max-w-sm"><NeedsFocus queue={queue} onOpen={() => {}} compact /></div>
      </Group>
    </>
  )
}

const BEHIND: { v: StackBehind; label: string }[] = [{ v: "two", label: "Peek below" }, { v: "one", label: "One piece" }, { v: "tilt", label: "Small tilt" }]
const MOTION: { v: StackMotion; label: string }[] = [{ v: "rise", label: "Rise" }, { v: "fade", label: "Fade" }, { v: "none", label: "None" }]

function StackPicker() {
  const look = useStackLook()
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Behind</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={look.behind} onValueChange={(v) => v && setStackLook({ behind: v as StackBehind })} aria-label="Cards behind">
          {BEHIND.map((o) => <ToggleGroupItem key={o.v} value={o.v} className="px-3">{o.label}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Motion</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={look.motion} onValueChange={(v) => v && setStackLook({ motion: v as StackMotion })} aria-label="Motion">
          {MOTION.map((o) => <ToggleGroupItem key={o.v} value={o.v} className="px-3">{o.label}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
    </div>
  )
}

/* ---------- Rail ---------- */

// The open tab is a sheet tab: cut from the paper sheet and running into it. Hover a tab for its name,
// a project for its card.
export function RailSection() {
  return (
    <>
      <Group title="Rail" note="Hover a tab or a project">
        <div className="flex flex-wrap gap-3">
          <RailBox at={["p", "whiskr", "home"]} width="w-80" sidebar="260px" />
          <RailBox at={["today"]} width="w-24" />
        </div>
      </Group>
      <Group title="Specs" note="Under High-fi">
        <dl className="grid max-w-2xl grid-cols-[9rem_minmax(0,1fr)] gap-x-6 gap-y-3 type-body">
          {RAIL_SPECS.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Group>
    </>
  )
}

const RAIL_SPECS: [string, string][] = [
  ["Size", "52px wide, 40px tiles, 4px between tabs"],
  ["Open tab", "A sheet tab: a paper tile that runs into the page with curved corners, and slides when you switch"],
  ["Hover", "A light gray tile, so it never reads as the open tab"],
  ["Icons", "Lucide at 20px, every stroke at 1.5px; Today is a line-drawn calendar page with the date"],
  ["Duet", "Your own Duet face"],
  ["Projects", "Plain project marks; a dot when something needs you"],
  ["Names", "A tooltip after 500ms; projects show a card with what's new instead"],
]

// The real rail, held in a box: the transform makes its fixed layout sit inside the box instead of the window.
function RailBox({ at, width, sidebar = "var(--rail-w)" }: { at: string[]; width: string; sidebar?: string }) {
  return (
    <div className={`ds-rail relative h-[440px] ${width} overflow-hidden rounded-xl bg-[var(--hifi-layer,var(--background))] [transform:translateZ(0)]`}>
      <SidebarProvider defaultOpen className="h-full min-h-0" style={{ "--sidebar-width": sidebar } as CSSProperties}>
        <RailSidebar at={at} />
        <div data-slot="sidebar-inset" className="min-w-0 flex-1 bg-background" />
      </SidebarProvider>
    </div>
  )
}

/* ---------- Messages ---------- */

export function MessagesSection() {
  const brand = chatById("g-brand")
  const { shown, replyOf } = foldReplies(brand ? msgsOf(brand).filter((m) => ["b3", "b4", "b5"].includes(m.id)) : [])
  const blue = decisionById("nored")
  return (
    <>
      <Group title="Chats" note="A Duet's answer folds under the question like a thread reply, with the reason one click away">
        <div className="flex max-w-2xl flex-col">
          {shown.map((m) => <Message key={m.id} m={m} reply={replyOf(m.id)} grouped={false} waiting={false} onQuote={() => {}} onOpen={() => {}} />)}
        </div>
      </Group>
      <Group title="Your Duet" note="Greeting, then the conversation">
        <div className="flex max-w-2xl flex-col gap-8">
          <Specimen name="Greeting"><Greeting /></Specimen>
          <div className="flex w-full flex-col gap-5">
            <Messages msgs={[
              { who: "me", text: "Which blue should the app use?" },
              { who: "ai", text: "The brand blue. Trevor changed the brand from red to blue because cats can’t see red.", refs: blue ? [blue] : [] },
            ]} />
          </div>
        </div>
      </Group>
      <Group title="Reply" note="Talking with a teammate">
        <div className="flex max-w-xl flex-col gap-3">
          <Bubble who="KL" name={PEOPLE.KL?.name} when="9:30">Which blue should the app use?</Bubble>
          <DuetNote>Trevor’s decision answers this: the brand blue.</DuetNote>
          <Bubble who={ME.id} mine when="9:31">The brand blue. I’ll send the hex.</Bubble>
        </div>
      </Group>
    </>
  )
}
