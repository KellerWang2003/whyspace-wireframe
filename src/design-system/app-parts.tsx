import type { CSSProperties } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Greeting, Messages } from "@/components/app/ask-whyspace"
import { ME, PEOPLE, decisionById } from "@/data"
import { Message } from "@/app/chats"
import { chatById, foldReplies, msgsOf } from "@/app/chats-model"
import { NeedsFocus, Skipped } from "@/app/needs-focus"
import { useNeedsItems, useNeedsQueue } from "@/app/needs-model"
import { RailSidebar } from "@/app/rail-sidebar"
import { Bubble, DuetNote } from "@/app/reply-dialog"
import { useTodayRows } from "@/app/today-model"
import { Group, Specimen } from "./kit"

// The app's own pieces that aren't shadcn components: Needs you, the rail, and messages.
// Each is the real component with Whiskr content, so answering or skipping here acts as it does in the app.

/* ---------- Needs you ---------- */

export function NeedsSection() {
  const queue = useNeedsQueue(useNeedsItems(useTodayRows()))
  // The count above the stack, as the section header shows it: where you are, and how many you skipped.
  const head = (compact?: boolean) => (
    <div className={compact ? "mb-2 flex h-6 items-center gap-2 text-xs" : "mb-4 flex h-8 items-center gap-2 text-sm"}>
      {queue.current && <span className="text-muted-foreground tabular-nums">{queue.pos} of {queue.total}</span>}
      <div className="ml-auto"><Skipped queue={queue} compact={compact} /></div>
    </div>
  )
  return (
    <>
      <Group title="On Today" note="One at a time, with its source and the answers as Suggested chips; the next ones wait behind, and skipped ones wait in the list above">
        <div className="max-w-3xl">{head()}<NeedsFocus queue={queue} onOpen={() => {}} /></div>
      </Group>
      <Group title="Compact" note="Beside a thread">
        <div className="max-w-sm">{head(true)}<NeedsFocus queue={queue} onOpen={() => {}} compact /></div>
      </Group>
    </>
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
