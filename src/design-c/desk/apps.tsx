import { useEffect, useRef, type ReactNode } from "react"
import { Bell, ChevronDown, GitPullRequest, Hash, Lock, Search, Share2, Sparkles, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { CallList, ReceiverCard } from "../handoff-card"
import { DUET_ASKS, HANDOFFS, PEOPLE_C, TALKS, callById, nameOf, type Handoff } from "../data"
import { counts, useEffective } from "../model"
import { useC } from "../state"
import { Dot, Face } from "../ui"
import { MAIN, Toast, Win } from "./win"

// ── Google Docs: Maya's PRD. The check follows the Share dialog; receivers see a comment in the margin. ──
export function DocsWin({ handoff, live }: { handoff: Handoff; live: boolean }) {
  const effs = useEffective(handoff)
  return (
    <Win title={`${handoff.title} – Google Docs`} style={MAIN} bar={<GButton>Share</GButton>}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-8 items-center gap-4 border-b border-black/5 px-4 text-[12px] text-neutral-500">
          <span className="text-neutral-900">{handoff.title}</span>
          <span>Saved to Drive · Launch</span>
        </div>
        <div className="relative flex min-h-0 flex-1 overflow-y-auto bg-neutral-100">
          <article className="mx-auto my-6 w-[640px] shrink-0 bg-white px-16 py-14 shadow-sm">
            <h1 className="text-2xl font-semibold">{handoff.title}</h1>
            <p className="mt-1 text-[12px] text-neutral-500">{nameOf(handoff.from)} · drafted with {handoff.tool}</p>
            <h2 className="mt-8 text-sm font-semibold">Goal</h2>
            <p className="mt-1 text-[13px] leading-6">A new user reaches their first match in under two minutes. Activation is the quarter’s goal; everything in this flow serves it.</p>
            {handoff.id === "prd" ? (
              <>
                <h2 className="mt-6 text-sm font-semibold">Flow</h2>
                <p className="mt-1 text-[13px] leading-6">Three steps: account, interests, first match. Each step is one screen. A progress indicator shows where the user is.</p>
                <h2 className="mt-6 text-sm font-semibold">Pricing and trial</h2>
                <p className="mt-1 text-[13px] leading-6">$12 a month, from the pricing study. A 14-day trial, long enough to see a second match. Plans are named Solo and Together.</p>
                <h2 className="mt-6 text-sm font-semibold">Sign-up</h2>
                <p className="mt-1 text-[13px] leading-6">Email verification is required before the first match. The primary button says “Start free trial”.</p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-sm font-semibold">Subject</h2>
                <p className="mt-1 text-[13px] leading-6">Start in two minutes.</p>
                <h2 className="mt-6 text-sm font-semibold">Body</h2>
                <p className="mt-1 text-[13px] leading-6">The new onboarding gets you to a first match before your coffee cools. $9.60 a month, billed yearly, with a 30-day trial. P.S. Bring a friend and you both get a month free.</p>
              </>
            )}
          </article>
          {!live && (
            <aside className="sticky top-0 mt-6 mr-6 h-fit w-[300px] shrink-0">
              <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-[12px] text-neutral-500">
                  <span className="flex size-5 items-center justify-center rounded-full bg-neutral-900 font-serif text-[11px] text-white">Y</span>
                  <span>Whyspace</span>
                  <span className="ml-auto">{handoff.time}</span>
                </div>
                <ReceiverCard handoff={handoff} dense className="border-0 p-0" />
                <p className="mt-2 text-[11px] text-neutral-500">{counts(effs).backed} of {counts(effs).total} backed · the rest are guesses</p>
              </div>
            </aside>
          )}
          {live && <Toast>Shared with Launch · 6 people</Toast>}
        </div>
      </div>
    </Win>
  )
}

// ── Google Sheets: Sam's study. ──
export function SheetsWin({ handoff, live }: { handoff: Handoff; live: boolean }) {
  const rows = [
    ["Price", "Picked", "n", "Note"],
    ["$12 / month", "62%", "25", "Over $15 in the pair test"],
    ["$15 / month", "38%", "15", ""],
    ["Annual discount", "20%", "median", "What people expected"],
    ["Trial length", "14 days", "", "Tested; no preference found"],
  ]
  return (
    <Win title={`${handoff.title} – Google Sheets`} style={MAIN} bar={<GButton>Share</GButton>}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-8 items-center gap-4 border-b border-black/5 px-4 text-[12px] text-neutral-500">
          <span className="text-neutral-900">{handoff.title}</span>
          <span>Saved to Drive · Launch</span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="w-8 border border-neutral-200 bg-neutral-50 text-center text-neutral-400">{i + 1}</td>
                  {r.map((c, j) => <td key={j} className={cn("h-7 min-w-[140px] border border-neutral-200 px-2", i === 0 && "bg-neutral-50 font-medium")}>{c}</td>)}
                  {Array.from({ length: 4 }).map((_, j) => <td key={`e${j}`} className="h-7 min-w-[120px] border border-neutral-200" />)}
                </tr>
              ))}
              {Array.from({ length: 14 }).map((_, i) => (
                <tr key={`r${i}`}>
                  <td className="w-8 border border-neutral-200 bg-neutral-50 text-center text-neutral-400">{rows.length + i + 1}</td>
                  {Array.from({ length: 8 }).map((_, j) => <td key={j} className="h-7 border border-neutral-200" />)}
                </tr>
              ))}
            </tbody>
          </table>
          {live && <Toast>Shared with Launch · 6 people</Toast>}
          {!live && (
            <div className="absolute top-3 right-3 w-[300px] rounded-lg border border-black/10 bg-white p-3 shadow-md">
              <div className="mb-2 flex items-center gap-2 text-[12px] text-neutral-500">
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-900 font-serif text-[11px] text-white">Y</span>
                <span>Whyspace</span>
                <span className="ml-auto">{handoff.time}</span>
              </div>
              <ReceiverCard handoff={handoff} dense className="border-0 p-0" />
            </div>
          )}
        </div>
      </div>
    </Win>
  )
}

// ── Slack: #launch, where shares get announced and the card is the thread reply. Scene 6 also has Sam's Duet in a DM. ──
export function SlackWin({ handoff, live, back }: { handoff: Handoff; live: boolean; back?: boolean }) {
  const s = useC()
  const asks = DUET_ASKS.filter((a) => a.who === s.viewer && handoff.id === "email")
  const duet = asks.length > 0
  const channel = HANDOFFS.filter((h) => h.at >= 1 && h.at <= s.scene && h.landed === "#launch").slice(-3)
  return (
    <Win title="Slack – Launch" style={back ? { left: "3%", top: 44, width: "60%", bottom: 90 } : MAIN} className={cn(back && "opacity-95")}>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-52 shrink-0 flex-col gap-0.5 bg-[#3f0e40] p-3 text-[13px] text-purple-100">
          <div className="mb-2 flex items-center justify-between px-2 font-semibold text-white">Launch <ChevronDown className="size-3.5" /></div>
          <SlackItem>Threads</SlackItem>
          <SlackItem>Mentions</SlackItem>
          <div className="mt-3 px-2 text-[11px] text-purple-200/70 uppercase">Channels</div>
          <SlackItem active={!duet}><Hash className="size-3.5" />launch</SlackItem>
          <SlackItem><Hash className="size-3.5" />design</SlackItem>
          <SlackItem><Hash className="size-3.5" />eng</SlackItem>
          <div className="mt-3 px-2 text-[11px] text-purple-200/70 uppercase">Direct messages</div>
          {duet && <SlackItem active><span className="size-2 rounded-full bg-emerald-400" />Sam · Duet</SlackItem>}
          <SlackItem><span className="size-2 rounded-full bg-emerald-400" />Maya</SlackItem>
          <SlackItem><span className="size-2 rounded-full border border-purple-200/60" />Jonas</SlackItem>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4 text-[13px] font-semibold">
            {duet ? <>Sam · Duet <span className="font-normal text-neutral-500">{PEOPLE_C.sam.away?.includes(s.scene) ? "Sam is away today · " : ""}answers from Sam’s calls</span></> : <><Hash className="size-4" />launch</>}
            <Star className="ml-auto size-3.5 text-neutral-400" />
          </div>
          <Bottom className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {duet ? (
              <div className="flex flex-col gap-4">
                {asks.map((a) => {
                  const talk = TALKS.find((t) => t.id === a.talk)
                  return (
                    <div key={a.id} className="flex flex-col gap-3">
                      <Msg who={a.who} time="9:40">{a.question}</Msg>
                      <Msg who="sam" duet time="9:40">
                        {a.answer ? (
                          <>
                            <span>{a.answer}</span>
                            <ul className="mt-2 flex flex-col gap-1 text-[12px] text-neutral-500">
                              {a.from?.map((id) => { const f = callById(id); return f && <li key={id} className="flex items-center gap-2"><Dot mark="filled" />{f.call.text} · Sam, {f.handoff.day}</li> })}
                            </ul>
                          </>
                        ) : (
                          <span>No call of Sam’s covers that. {talk && <>Booked {talk.minutes} min, {talk.day} {talk.time}, with {talk.people.filter((p) => p !== a.who).map(nameOf).join(" and ")}.</>}</span>
                        )}
                      </Msg>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {channel.map((h) => <ShareMsg key={h.id} handoff={h} live={h.id === handoff.id && live} />)}
              </div>
            )}
          </Bottom>
          <div className="m-4 mt-0 h-10 shrink-0 rounded-md border border-neutral-300 px-3 text-[12px] leading-10 text-neutral-400">Message {duet ? "Sam · Duet" : "#launch"}</div>
        </div>
        {duet && (
          <aside className="flex w-[360px] shrink-0 flex-col border-l border-black/10">
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-black/10 px-4 text-[13px] font-semibold"><Hash className="size-4" />launch</div>
            <Bottom className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-5">
                {channel.map((h) => <ShareMsg key={h.id} handoff={h} live={h.id === handoff.id && live} />)}
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

function ShareMsg({ handoff, live }: { handoff: Handoff; live: boolean }) {
  const where = { docs: "in Drive", sheets: "in Drive", figma: "in Figma", github: "on GitHub", notion: "in Notion", slack: "", meet: "" }[handoff.where]
  return (
    <div className="flex flex-col gap-2">
      <Msg who={handoff.from} time={handoff.time}>
        <span>{handoff.title} is {where}. <span className="text-sky-700 underline">drive.google.com/…</span></span>
      </Msg>
      <div className="ml-11 border-l-2 border-neutral-200 pl-3">
        {live ? (
          <div className="flex items-center gap-2 text-[12px] text-neutral-500"><span className="flex size-4 items-center justify-center rounded-full bg-neutral-900 font-serif text-[9px] text-white">Y</span>Whyspace is reading it…</div>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2 text-[12px]"><span className="flex size-4 items-center justify-center rounded-full bg-neutral-900 font-serif text-[9px] text-white">Y</span><span className="font-semibold">Whyspace</span><span className="text-neutral-400">APP · {handoff.time}</span></div>
            <ReceiverCard handoff={handoff} dense className="max-w-[460px]" />
          </>
        )}
      </div>
    </div>
  )
}

function Msg({ who, time, duet, children }: { who: string; time: string; duet?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Face id={who} className="size-8 rounded-md" />
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        <div className="flex items-baseline gap-2"><span className="font-semibold">{nameOf(who)}{duet && " · Duet"}</span>{duet && <span className="rounded bg-neutral-200 px-1 text-[10px] text-neutral-600">APP</span>}<span className="text-[11px] text-neutral-400">{time}</span></div>
        <div>{children}</div>
      </div>
    </div>
  )
}

function SlackItem({ children, active }: { children: ReactNode; active?: boolean }) {
  return <div className={cn("flex h-7 items-center gap-1.5 rounded px-2", active ? "bg-[#1164a3] text-white" : "text-purple-100/85")}>{children}</div>
}

// ── Claude: Jonas's own AI reads the card over MCP before it touches the work. ──
export function ClaudeWin({ handoff }: { handoff: Handoff }) {
  const s = useC()
  const effs = useEffective(handoff)
  const n = counts(effs)
  const backed = effs.filter((e) => e.state === "backed" || e.state === "precedent")
  const guesses = effs.filter((e) => e.state === "guess")
  return (
    <>
      <SlackWin handoff={handoff} live={false} back />
      <Win title="Claude" style={{ right: "3%", top: 92, width: "54%", bottom: 40 }} className="bg-[#faf9f5]">
        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 flex-col gap-1 bg-[#efede6] p-3 text-[12px] text-[#6b6a64] md:flex">
            <div className="mb-2 font-semibold text-[#1f1e1b]">Claude</div>
            <div className="rounded bg-black/[0.07] px-2 py-1 text-[#1f1e1b]">Onboarding screens</div>
            <div className="px-2 py-1">Type ramp</div>
            <div className="px-2 py-1">Icon set</div>
          </nav>
          <div className="mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col overflow-y-auto px-6 py-6 text-[13px] leading-6 text-[#1f1e1b]">
            <div className="self-end rounded-2xl bg-[#ebe8df] px-4 py-2">Read Maya’s PRD v2 in Launch and lay out the onboarding screens.</div>
            <div className="mt-5 flex items-start gap-2">
              <span className="mt-1 text-[#c96442]" aria-hidden>✳</span>
              <div className="min-w-0 flex-1">
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Sparkles className="size-3" />
                    <span>whyspace · read_handoff</span>
                    <span className="ml-auto">{handoff.title} · {n.backed} of {n.total} backed</span>
                  </div>
                  <CallList effs={effs} dense className="mt-2" />
                </div>
                <p className="mt-3">
                  {nameOf(handoff.from)} stands behind {backed.length} of these: {backed.map((e) => e.text.toLowerCase()).join(", ")}. {backed[0]?.why && <>Her why for the steps: “{backed[0].why}”</>}
                </p>
                <p className="mt-2">The other {guesses.length} are guesses nobody checked, so I will not design around them. I will lay out three steps, keep the trial copy, and leave email verification, the button label and the plan names as open questions in the file.</p>
                <p className="mt-2 text-neutral-500">Screens: 1 Account · 2 Interests and photo · 3 First match. Want them in Figma?</p>
              </div>
            </div>
            <div className="mt-5 self-end rounded-2xl bg-[#ebe8df] px-4 py-2">Split step 2. Interests and photo were one screen in the test and people stalled there. Four steps.</div>
            <div className="mt-5 flex items-start gap-2">
              <span className="mt-1 text-[#c96442]" aria-hidden>✳</span>
              <div className="min-w-0 flex-1">
                <p>Four steps will clash with Maya’s call when you share: she backed three on Tuesday, for activation. I have kept your reason with the frames, so the check will show it next to hers. You can take hers then, or talk.</p>
                <p className="mt-2 text-neutral-500">Laying out four: 1 Account · 2 Interests · 3 Photo · 4 First match.</p>
              </div>
            </div>
            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-neutral-400">Reply to Claude…</div>
              <p className="mt-2 text-[11px] text-neutral-400">{PEOPLE_C[s.viewer]?.name}’s Claude · connected to Whyspace, Figma</p>
            </div>
          </div>
        </div>
      </Win>
    </>
  )
}

// ── GitHub: the pull request is the share. The check lands as a bot comment in the timeline. ──
export function GitHubWin({ handoff, live }: { handoff: Handoff; live: boolean }) {
  const number = handoff.landed
  const title = handoff.id === "api" ? "API v1: one call returns the onboarding state" : "Empty states for the match list, loading and errors"
  const effs = useEffective(handoff)
  const n = counts(effs)
  return (
    <Win title={`${title} · ${number} – GitHub`} style={MAIN} dark>
      <div className="flex min-h-0 flex-1 flex-col bg-[#0d1117] text-[#e6edf3]">
        <div className="flex h-10 shrink-0 items-center gap-4 border-b border-white/10 px-4 text-[12px]">
          <span className="font-semibold">launch / app</span>
          <span className="text-neutral-400">Code · Issues · <span className="text-white">Pull requests</span> · Actions</span>
          <Search className="ml-auto size-3.5 text-neutral-400" />
          <Bell className="size-3.5 text-neutral-400" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
          <h1 className="text-xl font-semibold">{title} <span className="font-normal text-neutral-400">{number}</span></h1>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-neutral-400">
            <span className="rounded-full bg-[#238636] px-2 py-0.5 text-white"><GitPullRequest className="mr-1 inline size-3" />Open</span>
            <span>{nameOf(handoff.from).toLowerCase()} wants to merge 3 commits into <code className="rounded bg-white/10 px-1">main</code> from <code className="rounded bg-white/10 px-1">{handoff.id}-v1</code></span>
          </div>
          <div className="mt-4 flex gap-6 border-b border-white/10 text-[12px]">
            <span className="border-b-2 border-[#f78166] pb-2">Conversation</span><span className="pb-2 text-neutral-400">Commits 3</span><span className="pb-2 text-neutral-400">Files changed {handoff.id === "api" ? 9 : 6}</span>
          </div>
          <div className="mt-5 flex gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="rounded-md border border-white/10">
                <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-[12px]"><Face id={handoff.from} className="size-5" /><span className="font-semibold">{nameOf(handoff.from).toLowerCase()}</span><span className="text-neutral-400">commented {handoff.day} {handoff.time}</span></div>
                <div className="px-3 py-3 text-[13px] leading-6">
                  {handoff.id === "api" ? (
                    <>One endpoint, <code className="rounded bg-white/10 px-1">GET /onboarding/state</code>, returns everything the app needs for the flow in one round trip. Plans table seeded with $12. Trial length is a config value. Built with Claude Code from the spec.</>
                  ) : (
                    <>Empty, loading and error states for the match list. Errors retry twice before showing anything. Copy is first-pass. Built in Cursor.</>
                  )}
                </div>
              </div>
              <div className="rounded-md border border-white/10">
                <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2 text-[12px]">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white font-serif text-[11px] text-black">Y</span>
                  <span className="font-semibold">whyspace</span><span className="rounded border border-white/20 px-1 text-[10px] text-neutral-300">bot</span>
                  <span className="text-neutral-400">{live ? "reading this pull request…" : `${n.backed} of ${n.total} backed`}</span>
                </div>
                {!live && <div className="px-3 py-3"><ReceiverCard handoff={handoff} dense className="border-white/10 bg-transparent text-[#e6edf3] [&_*]:text-inherit" /></div>}
                {live && <div className="px-3 py-3 text-[12px] text-neutral-400">{n.total} calls found. The check is open on {nameOf(handoff.from)}’s desk.</div>}
              </div>
            </div>
            <aside className="hidden w-56 shrink-0 flex-col gap-4 text-[12px] lg:flex">
              <div><div className="text-neutral-400">Reviewers</div><div className="mt-1 flex items-center gap-2"><Face id={handoff.to[0]} className="size-5" />{nameOf(handoff.to[0])}</div></div>
              <div><div className="text-neutral-400">Labels</div><div className="mt-1 inline-block rounded-full border border-white/20 px-2 py-0.5">{handoff.id === "api" ? "api" : "frontend"}</div></div>
              <div><div className="text-neutral-400">Linked</div><div className="mt-1 flex items-center gap-1"><Lock className="size-3" />Whyspace · {handoff.thread}</div></div>
            </aside>
          </div>
        </div>
      </div>
    </Win>
  )
}

// ── Figma: Ready for dev is the share. The check sits in the right panel; Dev Mode shows the card. ──
export function FigmaWin({ handoff, live }: { handoff: Handoff; live: boolean }) {
  const frames = ["Step 1 · Account", "Step 2 · Interests", "Step 3 · Photo", "Step 4 · First match"]
  const effs = useEffective(handoff)
  const n = counts(effs)
  return (
    <Win title="Onboarding screens – Figma" style={MAIN} dark>
      <div className="flex min-h-0 flex-1 bg-[#1e1e1e] text-[12px] text-neutral-200">
        <nav className="flex w-52 shrink-0 flex-col border-r border-white/10 p-3">
          <div className="mb-3 font-semibold">Launch · Onboarding</div>
          <div className="mb-1 text-[11px] text-neutral-400 uppercase">Layers</div>
          {frames.map((f) => <div key={f} className="flex h-7 items-center gap-2 rounded px-2 hover:bg-white/5"><span className="text-neutral-500">#</span>{f}</div>)}
        </nav>
        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#2c2c2c]">
          <div className="absolute inset-0 flex items-center justify-center gap-8">
            {frames.map((f, i) => (
              <div key={f} className="flex flex-col gap-2">
                <span className="text-[11px] text-neutral-400">{f}</span>
                <div className="flex h-72 w-40 flex-col gap-2 rounded-[18px] border border-white/15 bg-white p-3 text-neutral-900">
                  <div className="h-1 w-full rounded bg-neutral-200"><div className="h-1 rounded bg-neutral-800" style={{ width: `${(i + 1) * 25}%` }} /></div>
                  <div className="mt-2 h-3 w-24 rounded bg-neutral-800" />
                  <div className="h-2 w-28 rounded bg-neutral-300" />
                  <div className="mt-3 flex flex-col gap-2">{[0, 1, 2].map((k) => <div key={k} className="h-7 rounded-md border border-neutral-300" />)}</div>
                  {i === 1 && <span className="mt-auto self-end text-[10px] text-neutral-400">Skip</span>}
                  <div className={cn("h-7 rounded-md bg-neutral-900", i !== 1 && "mt-auto")} />
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
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span>Ready for dev</span>
            <span className="flex h-4 w-7 items-center rounded-full bg-[#14ae5c] px-0.5"><span className="ml-auto size-3 rounded-full bg-white" /></span>
          </div>
          <div className="border-b border-white/10 px-3 py-2 text-neutral-400">4 frames · marked {handoff.day} {handoff.time}</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] text-neutral-400"><span className="flex size-4 items-center justify-center rounded-full bg-white font-serif text-[9px] text-black">Y</span>Whyspace{!live && <span className="ml-auto">{n.backed} of {n.total} backed</span>}</div>
            {live ? <p className="text-neutral-400">{n.total} calls found in these frames. The check is open.</p> : <ReceiverCard handoff={handoff} dense className="border-white/10 bg-transparent text-neutral-100 [&_*]:text-inherit" />}
          </div>
        </aside>
      </div>
    </Win>
  )
}

function GButton({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#c2e7ff] px-4 py-1 text-[12px] font-medium text-[#001d35]">{children}</span>
}

