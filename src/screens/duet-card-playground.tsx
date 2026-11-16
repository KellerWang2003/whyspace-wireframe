import { useState, type ReactNode } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ThinkingLoop } from "@/components/brand/ribbons"
import { ME } from "@/data"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { DuetAvatar } from "@/app/duet-avatar"
import { SURE_LABEL, SURE_LEVELS, type Sure } from "@/app/duet"
import { titleOf, useDuetActivity, useDuetState, type Handled } from "@/app/duet-state"
import { SureMark } from "@/app/sure-mark"

// Playground (#/playground/duet-card, Nov 14): what the rail's Duet tab shows on hover. Three cards,
// each with what your Duet decided for you and your chats with it, idle or with a chat in progress.
// Keller picked Tally (Nov 14); the real card is src/app/duet-card.tsx.

type Chat = { id: string; title: string; working?: boolean }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
// A chat your Duet is still answering, for the "Working" state (the real one is a chat whose last answer is thinking).
const MOCK_WORKING: Chat = { id: "mock", title: "Draft the poster brief for Chloe", working: true }

function useCard(working: boolean) {
  const { handled } = useDuetActivity()
  const { chats } = useDuetState()
  const decided = handled.filter((h): h is Handled & { sure: Sure } => !h.byYou && !!h.sure)
  const today = decided.filter((h) => h.day === "today")
  const live: Chat[] = chats.filter((c) => c.msgs.length).map((c) => ({ id: c.id, title: titleOf(c), working: !!c.msgs.at(-1)?.thinking }))
  const list = working && !live.some((c) => c.working) ? [MOCK_WORKING, ...live] : live
  return { decided, today, chats: list.slice(0, 3), unsure: today.filter((h) => h.sure === "unsure").length }
}

export function DuetCardPlayground() {
  const [state, setState] = useState<"idle" | "working">("working")
  const data = useCard(state === "working")
  const options: [string, ReactNode][] = [
    ["Rows", <Rows {...data} />],
    ["Tally", <Tally {...data} />],
    ["Now first", <NowFirst {...data} />],
  ]
  return (
    <div className="min-h-svh bg-(--hifi-layer) p-10">
      <ToggleGroup type="single" value={state} onValueChange={(v) => v && setState(v as typeof state)} className="mb-10">
        <ToggleGroupItem value="working" className="px-3">Working</ToggleGroupItem>
        <ToggleGroupItem value="idle" className="px-3">Idle</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex flex-wrap items-start gap-12">
        {options.map(([name, card], i) => (
          <div key={name} className="flex flex-col gap-3">
            <h2 className="type-label text-muted-foreground">{i + 1} {name}</h2>
            <Hovered>{card}</Hovered>
          </div>
        ))}
      </div>
    </div>
  )
}

// The face is on the rail tab right beside the card, so the card doesn't repeat it (Keller, Nov 14).
// The Duet tab as if hovered, with the card where the rail's peek puts it (10px right, tops aligned).
function Hovered({ children }: { children: ReactNode }) {
  const hifi = useHifi()
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex w-(--rail-w) justify-center rounded-lg bg-sidebar py-2">
        <span className="flex size-(--rail-tile) items-center justify-center rounded-lg bg-sidebar-accent">
          <DuetAvatar owner={ME.id} className={hifi ? "size-[30px]" : "size-6"} />
        </span>
      </div>
      <div data-rail-card className="w-64 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-sm">{children}</div>
    </div>
  )
}

type Data = ReturnType<typeof useCard>

// The card's first line reads as one sentence: "Duet decided 3 today" (Keller, Nov 14).
function Head({ n }: { n: number }) {
  return (
    <p className="truncate">
      <span className="font-medium">Duet</span>
      {n > 0 && <span className="text-muted-foreground tabular-nums"> decided {n} today</span>}
    </p>
  )
}

// A chat: its title, shimmering with the thinking loop in front while your Duet is still on it.
function ChatRow({ c }: { c: Chat }) {
  return (
    <li className="flex items-center gap-1.5 text-xs">
      {c.working && <ThinkingLoop className="-my-1 h-4 w-7 shrink-0" />}
      <span className={cn("min-w-0 truncate", c.working && "shimmer-text font-medium")}>{c.title}</span>
    </li>
  )
}

// 1 Rows: like a project's card. The latest decisions with how sure, then the chats.
function Rows({ decided, today, chats }: Data) {
  return (
    <div className="flex flex-col gap-2">
      <Head n={today.length} />
      {decided.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t pt-2">
          {decided.slice(0, 3).map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">{cap(h.text)}</span>
              <SureMark sure={h.sure} />
            </li>
          ))}
        </ul>
      )}
      {chats.length > 0 && <ul className="flex flex-col gap-1.5 border-t pt-2">{chats.map((c) => <ChatRow key={c.id} c={c} />)}</ul>}
    </div>
  )
}

// 2 Tally: today's decisions as one number beside the name, then three even cells, one per level of sure, then the chats.
// Round 2 (Keller, Nov 14): the boxed number with a loose column of meters read poorly.
function Tally({ today, chats }: Data) {
  const count = (s: Sure) => today.filter((h) => h.sure === s).length
  return (
    <div className="flex flex-col gap-2.5">
      <Head n={today.length} />
      <ul className="grid grid-cols-3 gap-1.5">
        {SURE_LEVELS.map((s) => (
          <li key={s} aria-label={`${SURE_LABEL[s]} ${count(s)}`} className={cn("flex flex-col gap-1.5 rounded-md bg-muted/60 px-2.5 py-2", !count(s) && "opacity-50")}>
            <span className="text-lg leading-none font-medium tabular-nums">{count(s)}</span>
            <SureMark sure={s} />
          </li>
        ))}
      </ul>
      {chats.length > 0 && <ul className="flex flex-col gap-1.5 border-t pt-2.5">{chats.map((c) => <ChatRow key={c.id} c={c} />)}</ul>}
    </div>
  )
}

// 3 Now first: a chat in progress leads; otherwise the latest decision does. One line for today, then the rest of the chats.
function NowFirst({ decided, today, chats, unsure }: Data) {
  const now = chats.find((c) => c.working)
  const latest = decided[0]
  const rest = chats.filter((c) => c !== now).slice(0, 2)
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
          {now ? (
            <>
              <span className="shimmer-text text-xs font-medium">Working</span>
              <span className="line-clamp-2 leading-snug">{now.title}</span>
            </>
          ) : latest ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{latest.when}<SureMark sure={latest.sure} /></span>
              <span className="line-clamp-2 leading-snug">{cap(latest.text)}</span>
            </>
          ) : (
            <span className="font-medium">Duet</span>
          )}
      </div>
      {today.length > 0 && (
        <p className="flex items-center gap-1.5 border-t pt-2.5 text-xs">
          <span className="tabular-nums"><span className="font-medium">Duet</span> decided {today.length} today</span>
          {unsure > 0 && <span className="text-muted-foreground tabular-nums">· {unsure} not sure</span>}
        </p>
      )}
      {rest.length > 0 && <ul className="flex flex-col gap-1.5 border-t pt-2.5">{rest.map((c) => <ChatRow key={c.id} c={c} />)}</ul>}
    </div>
  )
}
