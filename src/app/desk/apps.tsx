import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown, Hash, Share2, Sparkles, Star } from "lucide-react"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import { PEOPLE, decisionById } from "@/data"
import { markOf } from "@/lib/marks"
import { cn } from "@/lib/utils"
import { firstName, markOfCaught, otherOf, type Caught } from "@/screens/overlay-model"
import { intentOf, threadOf } from "../threads"
import { CHANNEL, DM, READ_THREAD, type Scene, type SlackMsg } from "./data"
import { Toast, Win } from "./win"

// The apps on the Desk: Claude, Google Docs, Slack and Figma, as stand-ins. The one Whyspace piece
// inside them is the card where the work lands: the same card in a Docs margin, a Slack reply, a
// Claude tool result and Figma's Dev Mode, read live from what the pill holds.

// Windows leave the right of the screen to the pill on wide screens, so it never covers the card.
const WIN = "top-12 right-[4%] bottom-16 left-[3%] xl:right-[26%]"
const CLAUDE = "top-12 bottom-10 left-[3%] w-[56%] xl:w-[50%]"
const DOCS_BEHIND = "top-[60px] right-[3%] bottom-[90px] w-[52%] xl:right-[26%]"

// ── The card. One line per decision, a mark on each, the why or where it stands, whose it is. ──
export function CaughtCard({ items, title, time, dark, className }: { items: Caught[]; title: string; time?: string; dark?: boolean; className?: string }) {
  const n = items.filter((c) => c.kind === "conf" || c.kind === "prec").length
  return (
    <div className={cn("rounded-lg border p-3 text-[12px]", dark ? "border-white/10 bg-white/5 text-neutral-100" : "border-black/10 bg-white text-neutral-900", className)}>
      <div className={cn("flex items-center gap-2", dark ? "text-neutral-400" : "text-neutral-500")}>
        <span className={cn("flex size-5 items-center justify-center rounded-full font-serif text-[11px]", dark ? "bg-white text-black" : "bg-neutral-900 text-white")}>Y</span>
        <span className="truncate"><span className={dark ? "text-neutral-100" : "text-neutral-900"}>{title}</span> · {n} of {items.length} confirmed</span>
        {time && <span className="ml-auto shrink-0 tabular-nums">{time}</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((c) => (
          <li key={c.id} className="flex items-start gap-2 leading-5">
            <MarkIcon mark={markOfCaught(c)} className="mt-[3px] size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">
              {c.title} <span className={dark ? "text-neutral-400" : "text-neutral-500"}>{tail(c)}</span>
            </span>
            {c.owner && <PersonAvatar id={c.owner} agent={c.kind === "guess"} className="mt-0.5 size-5 text-neutral-900" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

// The line after a decision on the card: the why, or where it stands.
function tail(c: Caught) {
  const who = c.owner ? firstName(c.owner) : "you"
  if (c.kind === "conf") return c.why ?? ""
  if (c.kind === "prec") return c.why ?? "from an earlier decision"
  if (c.kind === "clash") {
    const o = otherOf(c)
    return o ? `clashes with ${firstName(o.owner)}’s “${o.title}”${c.reason ? ` · kept: ${c.reason}` : ""}` : "clashes with another decision"
  }
  return `${who}’s guess`
}

// ── Google Docs: the promo video plan. Share opens the check; the margin holds the card receivers see. ──
export function DocsWin({ scene, items, onShare, behind }: { scene: Scene; items: Caught[]; onShare: () => void; behind?: boolean }) {
  // v1 Monday, v2 Tuesday with captions, v3 after Kelly's Claude added the cut list.
  const v = scene.id <= 2 ? 1 : scene.id === 4 ? 2 : 3
  return (
    <Win title={`${scene.work} – Google Docs`} className={behind ? cn(DOCS_BEHIND, "opacity-95") : WIN} bar={<button type="button" onClick={onShare} className="rounded-full bg-[#c2e7ff] px-4 py-1 text-[12px] font-medium text-[#001d35] hover:bg-[#b3dcf7]">Share</button>}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-8 items-center gap-4 border-b border-black/5 px-4 text-[12px] text-neutral-500">
          <span className="text-neutral-900">{scene.work}</span>
          <span>Saved to Drive · Whiskr</span>
          {v > 1 && <span>Edited {scene.day} {v === 2 ? "9:10" : "10:58"}</span>}
        </div>
        <div className="relative flex min-h-0 flex-1 overflow-y-auto bg-neutral-100">
          <article className="mx-auto my-6 w-[600px] shrink-0 bg-white px-14 py-12 shadow-sm max-xl:w-[480px] max-xl:px-10">
            <h1 className="text-2xl font-semibold">{scene.work}</h1>
            <p className="mt-1 text-[12px] text-neutral-500">Keller · drafted with Claude{v === 3 && " · cut list by Kelly’s Claude"}</p>
            <Section h="Goal">Get cat owners to download Whiskr. One video for reels and for the site.</Section>
            <Section h="Length">15 seconds.</Section>
            <Section h="Opening">Luna’s real clip from the testing footage, the pounce at 0:42.</Section>
            <Section h="Sound">The dot purrs when it moves, as in the app.</Section>
            <Section h="Title card">Brand blue, white type.</Section>
            {v >= 2 && <Section h="Captions">Burned in. Most people watch muted.</Section>}
            <Section h="End card">{v === 3 ? "Blue, like the brand." : "Red, like the old logo."}</Section>
            {v === 3 && <Section h="Cut list">0:00 Luna’s pounce · 0:03 the swipe · 0:08 the purring dot · 0:12 title card · 0:14 end card. Exports: 9:16 for reels, 16:9 for the site.</Section>}
          </article>
          {!behind && (
            <aside className="sticky top-0 mt-6 mr-6 h-fit w-[300px] shrink-0 max-xl:w-[240px]">
              <CaughtCard items={items} title={scene.work} time={scene.time} className="shadow-sm" />
              <p className="mt-2 text-[11px] text-neutral-500">What the people you shared it with see.</p>
            </aside>
          )}
          {scene.share && !behind && <Toast>Shared with Whiskr · 4 people</Toast>}
        </div>
      </div>
    </Win>
  )
}

function Section({ h, children }: { h: string; children: ReactNode }) {
  return (
    <>
      <h2 className="mt-6 text-sm font-semibold">{h}</h2>
      <p className="mt-1 text-[13px] leading-6">{children}</p>
    </>
  )
}

// ── Slack: #marketing, where the share landed as a reply, and the DM with Keller's Duet. ──
export function SlackWin({ scene, items }: { scene: Scene; items: Caught[] }) {
  const [view, setView] = useState<"dm" | "channel">("dm")
  return (
    <Win title="Slack – Whiskr" className={WIN}>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-52 shrink-0 flex-col gap-0.5 bg-[#3f0e40] p-3 text-[13px] text-purple-100">
          <div className="mb-2 flex items-center justify-between px-2 font-semibold text-white">Whiskr <ChevronDown className="size-3.5" /></div>
          <SlackItem>Threads</SlackItem>
          <SlackItem>Mentions</SlackItem>
          <div className="mt-3 px-2 text-[11px] text-purple-200/70 uppercase">Channels</div>
          <SlackItem active={view === "channel"} onClick={() => setView("channel")}><Hash className="size-3.5" />marketing</SlackItem>
          <SlackItem><Hash className="size-3.5" />app</SlackItem>
          <SlackItem><Hash className="size-3.5" />general</SlackItem>
          <div className="mt-3 px-2 text-[11px] text-purple-200/70 uppercase">Direct messages</div>
          <SlackItem active={view === "dm"} onClick={() => setView("dm")}><span className="size-2 rounded-full bg-emerald-400" />Keller · Duet</SlackItem>
          <SlackItem><span className="size-2 rounded-full bg-emerald-400" />Trevor</SlackItem>
          <SlackItem><span className="size-2 rounded-full border border-purple-200/60" />Kelly</SlackItem>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4 text-[13px] font-semibold">
            {view === "dm" ? <>Keller · Duet <span className="font-normal text-neutral-500">answers from Keller’s decisions</span></> : <><Hash className="size-4" />marketing</>}
            <Star className="ml-auto size-3.5 text-neutral-400" />
          </div>
          <Bottom className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-5">
              {(view === "dm" ? DM : CHANNEL).map((m, i) => <Msg key={i} m={m} items={items} work={scene.work} />)}
            </div>
          </Bottom>
          <div className="m-4 mt-0 h-10 shrink-0 rounded-md border border-neutral-300 px-3 text-[12px] leading-10 text-neutral-400">Message {view === "dm" ? "Keller · Duet" : "#marketing"}</div>
        </div>
        {view === "dm" && (
          <aside className="hidden w-[380px] shrink-0 flex-col border-l border-black/10 xl:flex">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4 text-[13px] font-semibold"><Hash className="size-4" />marketing</div>
            <Bottom className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-5">
                {CHANNEL.map((m, i) => <Msg key={i} m={m} items={items} work={scene.work} />)}
              </div>
            </Bottom>
          </aside>
        )}
      </div>
    </Win>
  )
}

// A pane that opens scrolled to its newest message, like a chat.
function Bottom({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const down = () => { el.scrollTop = el.scrollHeight }
    down()
    // Fonts and cards arrive after the first paint; follow the content as it grows.
    const ro = new ResizeObserver(down)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => ro.disconnect()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}

function Msg({ m, items, work }: { m: SlackMsg; items: Caught[]; work: string }) {
  const name = PEOPLE[m.who]?.name ?? m.who
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <PersonAvatar id={m.who} agent={m.duet} className="size-8 rounded-md" />
        <div className="min-w-0 flex-1 text-[13px] leading-5">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{name}{m.duet && " · Duet"}</span>
            {m.duet && <span className="rounded bg-neutral-200 px-1 text-[10px] text-neutral-600">APP</span>}
            <span className="text-[11px] text-neutral-400">{m.time}</span>
          </div>
          <div>{m.text}{m.link && <> <span className="text-sky-700 underline">{m.link}</span></>}</div>
          {m.decision && (
            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-neutral-600">
              <MarkIcon mark={markOfCaught(m.decision)} className="size-3.5" />
              <span>{m.decision.title}{m.decision.why && <span className="text-neutral-400"> · {m.decision.why}</span>} · Keller, today</span>
            </div>
          )}
        </div>
      </div>
      {m.card && (
        <div className="ml-11 border-l-2 border-neutral-200 pl-3">
          <div className="mb-1 flex items-center gap-2 text-[12px]"><span className="flex size-4 items-center justify-center rounded-full bg-neutral-900 font-serif text-[9px] text-white">Y</span><span className="font-semibold">Whyspace</span><span className="text-neutral-400">APP · {m.time}</span></div>
          <CaughtCard items={items} title={work} className="max-w-[460px]" />
        </div>
      )}
    </div>
  )
}

function SlackItem({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex h-7 items-center gap-1.5 rounded px-2 text-left", active ? "bg-[#1164a3] text-white" : "text-purple-100/85 hover:bg-white/10")}>{children}</button>
}

// ── Claude: the person's own AI, connected to Whyspace over MCP. It reads the thread or the work
// before it builds, and records the decisions it makes with the person. ──
export function ClaudeWin({ scene, mine, items, onShare }: { scene: Scene; mine: Caught[]; items: Caught[]; onShare: () => void }) {
  const keller = scene.viewer === "MC"
  const thread = threadOf(scene.where.project, scene.where.part)
  const read = READ_THREAD.map((id) => decisionById(id)).filter((d) => !!d)
  const recorded = (ids: string[]) => mine.filter((c) => ids.includes(c.id))
  return (
    <>
      {!keller && <DocsWin scene={scene} items={items} onShare={onShare} behind />}
      <Win title="Claude" className={cn(keller ? WIN : CLAUDE, "bg-[#faf9f5]")}>
        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 flex-col gap-1 bg-[#efede6] p-3 text-[12px] text-[#6b6a64] md:flex">
            <div className="mb-2 font-semibold text-[#1f1e1b]">Claude</div>
            <div className="rounded bg-black/[0.07] px-2 py-1 text-[#1f1e1b]">{keller ? "Promo video plan" : "Promo cut"}</div>
            {keller ? <><div className="px-2 py-1">Onboarding copy ideas</div><div className="px-2 py-1">Match screen feedback</div></> : <><div className="px-2 py-1">Match screen states</div><div className="px-2 py-1">Panel notes</div></>}
          </nav>
          <div className="mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col overflow-y-auto px-6 py-6 text-[13px] leading-6 text-[#1f1e1b]">
            {keller ? (
              <>
                <Me>Plan the Whiskr promo video. Keep it short.</Me>
                <Ai>
                  <Tool name="read_thread" meta={`${scene.where.part} · ${read.length} decisions`}>
                    {thread && <p className="mb-1.5 text-neutral-600">{intentOf(thread)}</p>}
                    <ul className="flex flex-col gap-1">
                      {read.map((d) => (
                        <li key={d.id} className="flex items-center gap-2"><MarkIcon mark={markOf(d.status)} className="size-3.5" /><span className="min-w-0 flex-1 truncate">{d.title}</span><span className="shrink-0 text-neutral-400">{firstName(d.owner)}, {d.when}</span></li>
                      ))}
                    </ul>
                  </Tool>
                  <p className="mt-3">A plan built on those. 15 seconds, since cats lose interest fast and it fits a reel. It opens on Luna’s real clip from the testing footage, which shows the idea in the first second. The dot purrs when it moves, as in the app. The title card is the brand blue with white type, following Trevor’s change.</p>
                  <Tool name="record_decision" meta={`${scene.work} · 4`} className="mt-3">
                    <Rows items={recorded(["d1", "d2", "d3", "d4"])} />
                  </Tool>
                  <p className="mt-3 text-neutral-500">Want the shot list next?</p>
                </Ai>
                <Me>Good. End on the red logo card people know.</Me>
                <Ai>
                  <p>Trevor confirmed blue over red on Oct 23: cats see red as gray. A red end card clashes with that. I wrote it in as you said it, and Whyspace shows the clash to you and Trevor until one of you changes it.</p>
                  <Tool name="record_decision" meta={`${scene.work} · 1 clash`} className="mt-3">
                    <Rows items={recorded(["d5"])} />
                  </Tool>
                  <p className="mt-3 text-neutral-500">Shot list: Luna’s pounce · the swipe · the purring dot · title card · end card.</p>
                </Ai>
              </>
            ) : (
              <>
                <Me>Cut the promo video from the test footage. Follow the plan in Whyspace.</Me>
                <Ai>
                  <Tool name="read_work" meta={`${scene.work} · ${(scene.others ?? []).filter((c) => c.kind === "conf" || c.kind === "prec").length} of ${(scene.others ?? []).length} confirmed`}>
                    <Rows items={scene.others ?? []} />
                  </Tool>
                  <p className="mt-3">Keller stands behind 15 seconds, the Luna opening and burned-in captions, and took Trevor’s blue for the end card. The purr is still a guess, so I will cut without it and leave a marker where it would go.</p>
                  <p className="mt-2 text-neutral-500">Opening on Luna’s clip, then the swipe, the dot, the title card, the end card.</p>
                </Ai>
                <Me>Open on the pounce itself, not the whole clip. Export 9:16 for reels and 16:9 for the site.</Me>
                <Ai>
                  <p>Done. Both are yours to confirm when you share; I added the cut list to the plan.</p>
                  <Tool name="record_decision" meta={`${scene.work} · 2`} className="mt-3">
                    <Rows items={recorded(["k1", "k2"])} />
                  </Tool>
                </Ai>
              </>
            )}
            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-neutral-400">Reply to Claude…</div>
              <p className="mt-2 text-[11px] text-neutral-400">{PEOPLE[scene.viewer]?.name}’s Claude · connected to Whyspace, Google Drive</p>
            </div>
          </div>
        </div>
      </Win>
    </>
  )
}

function Me({ children }: { children: ReactNode }) {
  return <div className="mt-5 max-w-[80%] self-end rounded-2xl bg-[#ebe8df] px-4 py-2 first:mt-0">{children}</div>
}

function Ai({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2">
      <span className="mt-1 text-[#c96442]" aria-hidden>✳</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// An MCP tool call, the way a chat app shows one: the tool's name and a result the person can read.
function Tool({ name, meta, className, children }: { name: string; meta?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] leading-5", className)}>
      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
        <Sparkles className="size-3" />
        <span>whyspace · {name}</span>
        {meta && <span className="ml-auto">{meta}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Rows({ items }: { items: Caught[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((c) => (
        <li key={c.id} className="flex items-start gap-2">
          <MarkIcon mark={markOfCaught(c)} className="mt-[3px] size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">{c.title}{(c.why || c.kind === "clash") && <span className="text-neutral-500"> · {tail(c)}</span>}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Figma: Ready for dev is the share. The pill opens the check; Dev Mode shows the card. ──
export function FigmaWin({ scene, items, onShare }: { scene: Scene; items: Caught[]; onShare: () => void }) {
  const frames = ["Match card", "Match!", "Not now"]
  const [ready, setReady] = useState(!!scene.share)
  return (
    <Win title={`${scene.work} – Figma`} className={WIN} dark>
      <div className="flex min-h-0 flex-1 bg-[#1e1e1e] text-[12px] text-neutral-200">
        <nav className="hidden w-52 shrink-0 flex-col border-r border-white/10 p-3 xl:flex">
          <div className="mb-3 font-semibold">Whiskr · Match screen</div>
          <div className="mb-1 text-[11px] text-neutral-400 uppercase">Layers</div>
          {[...frames, "Swipe dot"].map((f) => <div key={f} className="flex h-7 items-center gap-2 rounded px-2 hover:bg-white/5"><span className="text-neutral-500">#</span>{f}</div>)}
        </nav>
        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#2c2c2c]">
          <div className="absolute inset-0 flex items-center justify-center gap-5">
            {frames.map((f, i) => (
              <div key={f} className="flex flex-col gap-2">
                <span className="text-[11px] text-neutral-400">{f}</span>
                <div className="relative flex h-60 w-32 flex-col rounded-[16px] border border-white/15 bg-white p-2.5 text-neutral-900">
                  <div className="h-24 rounded-lg bg-neutral-200" />
                  <div className="mt-2.5 h-2.5 w-16 rounded bg-neutral-800" />
                  <div className="mt-1.5 h-2 w-20 rounded bg-neutral-300" />
                  {i === 1 && <div className="mt-3 h-2.5 w-12 self-center rounded bg-neutral-800" />}
                  <span className={cn("absolute rounded-full bg-neutral-900", i === 1 ? "right-5 bottom-7 size-5" : "right-4 bottom-5 size-2.5")} aria-hidden />
                  {i === 2 && <span className="mt-auto text-[10px] text-neutral-400">Not now</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="flex w-72 shrink-0 flex-col border-l border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="font-semibold">Design</span><span className="text-neutral-400">Prototype</span>
            <span className="ml-auto flex items-center gap-1 rounded bg-[#0c8ce9] px-2 py-0.5 text-white"><Share2 className="size-3" />Share</span>
          </div>
          <label className="flex cursor-pointer items-center justify-between border-b border-white/10 px-3 py-2">
            <span>Ready for dev</span>
            <button type="button" role="switch" aria-checked={ready} aria-label="Ready for dev" onClick={() => { setReady((v) => !v); if (!ready) onShare() }} className={cn("flex h-4 w-7 items-center rounded-full px-0.5 transition-colors", ready ? "bg-[#14ae5c]" : "bg-white/20")}>
              <span className={cn("size-3 rounded-full bg-white transition-transform", ready && "translate-x-3")} />
            </button>
          </label>
          <div className="border-b border-white/10 px-3 py-2 text-neutral-400">{frames.length} frames{ready && ` · marked ${scene.day} ${scene.time}`}</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 text-[11px] text-neutral-400">What Dev Mode shows with these frames</div>
            <CaughtCard items={items} title={scene.work} dark />
          </div>
        </aside>
      </div>
    </Win>
  )
}
