import { useEffect, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, ArrowUp, Blend, Check, ChevronDown, Eye, Lock, Loader2, PenLine, Plus, RotateCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { ToolLogo } from "@/components/app/tool-logo"
import { ME } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { PROVIDERS, connect, isProvider, type ProviderId } from "./connections"
import { Pair, WhyspaceTile } from "./connect-dialog"

// The connect flow as it runs in a browser: a second tab opens on the tool's page for Whyspace, the
// tool hands you to Whyspace's consent page (OAuth), you allow it, and the tool's tab comes back with
// Whyspace connected. The Whyspace tab stays open behind; clicking it goes back to My AI tools.
// Routes: #/connect/<tool> (the tool's listing), /authorize (Whyspace), /done (the tool's settings), /chat.
// The tool's own pages are plain stand-ins, not copies of Claude's or ChatGPT's interface.

type Step = "listing" | "authorize" | "done" | "chat"
const STEPS: Step[] = ["listing", "authorize", "done", "chat"]

export function ConnectFlow({ tool, step: raw }: { tool?: string; step?: string }) {
  const id: ProviderId = isProvider(tool) ? tool : "claude"
  const step: Step = STEPS.includes(raw as Step) ? (raw as Step) : "listing"
  const p = PROVIDERS[id]
  const go = (s: Step, q = "") => navigate(`/connect/${id}${s === "listing" ? "" : `/${s}`}${q}`)
  const address = {
    listing: p.listing,
    authorize: `whyspace.app/oauth/authorize?client=${id}`,
    done: p.settings,
    chat: id === "claude" ? "claude.ai/new" : "chatgpt.com",
  }[step]
  const title = step === "authorize" ? "Allow access · Whyspace" : step === "chat" ? `New chat · ${p.name}` : `Whyspace · ${p.name}`

  return (
    <Browser address={address} title={title} favicon={step === "authorize" ? <WhyspaceTile className="size-3.5 rounded-[3px] text-[9px]" /> : <ToolLogo tool={p.name} className="size-3.5" />}>
      {step === "listing" && <Listing id={id} onConnect={() => go("authorize")} />}
      {step === "authorize" && <Authorize id={id} onAllow={() => { connect(id); go("done") }} onCancel={() => go("listing", "?denied")} />}
      {step === "done" && <Connected id={id} onChat={() => go("chat")} />}
      {step === "chat" && <Chat id={id} />}
    </Browser>
  )
}

// A browser window: the Whyspace tab you came from, the tool's tab in front, and the address bar.
function Browser({ address, title, favicon, children }: { address: string; title: string; favicon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-svh bg-neutral-300/70 p-4 sm:p-6">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-400/50 bg-white text-neutral-900">
        <div className="flex h-10 shrink-0 items-end gap-1 bg-neutral-200 px-3">
          <div className="mr-3 mb-3.5 flex gap-1.5">
            {["bg-red-400", "bg-amber-400", "bg-green-500"].map((c) => <span key={c} className={cn("size-3 rounded-full", c)} />)}
          </div>
          <button onClick={() => navigate("/settings/connectors")} className="mb-1 flex h-7 w-48 items-center gap-2 rounded-md px-3 text-xs text-neutral-600 hover:bg-neutral-300/60">
            <WhyspaceTile className="size-3.5 rounded-[3px] text-[9px]" />
            <span className="truncate">Connectors · Whyspace</span>
          </button>
          <div className="flex h-8 w-56 items-center gap-2 rounded-t-lg bg-white px-3 text-xs">
            {favicon}
            <span className="truncate">{title}</span>
          </div>
        </div>
        <div className="flex h-10 shrink-0 items-center gap-3 border-b border-neutral-200 px-3 text-neutral-500">
          <ArrowLeft className="size-4" /><ArrowRight className="size-4 opacity-40" /><RotateCw className="size-3.5" />
          <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-full bg-neutral-100 px-3 text-xs">
            <Lock className="size-3 shrink-0" />
            <span className="truncate text-neutral-700">{address}</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// What Whyspace's server offers, as each tool lists it.
const TOOLS: { name: string; mode: Mode }[] = [
  { name: "Search decisions", mode: "always" },
  { name: "Read a thread", mode: "always" },
  { name: "Log a decision", mode: "ask" },
  { name: "Add a task", mode: "ask" },
  { name: "Ask a teammate's Duet", mode: "ask" },
]
type Mode = "always" | "ask" | "off"
const MODE: Record<Mode, string> = { always: "Always allow", ask: "Ask first", off: "Off" }

// The tool's own top bar: its mark and name. A stand-in, not the tool's real interface.
function ToolBar({ id }: { id: ProviderId }) {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-neutral-100 px-5 text-sm font-medium">
      <ToolLogo tool={PROVIDERS[id].name} className="size-4" />
      {PROVIDERS[id].name}
    </div>
  )
}

const Pending = () => <Loader2 className="size-4 animate-spin" />

// 1 · The tool's page for Whyspace in its directory.
function Listing({ id, onConnect }: { id: ProviderId; onConnect: () => void }) {
  const [busy, setBusy] = useState(false)
  const denied = window.location.hash.includes("?denied")
  const press = () => { setBusy(true); setTimeout(onConnect, 700) }
  return (
    <div className="font-sans">
      <ToolBar id={id} />
      <div className="mx-auto max-w-xl px-6 pt-16 pb-12">
        <WhyspaceTile className="size-16 rounded-2xl text-3xl" />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Whyspace</h1>
        <p className="mt-1.5 text-neutral-500">Your team's decisions and the why behind them</p>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={press} disabled={busy} className="flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-70">
            {busy && <Pending />}Connect
          </button>
          <span className="text-sm text-neutral-400">whyspace.app</span>
        </div>
        {denied && <p className="mt-3 text-sm text-red-600">Whyspace wasn't connected.</p>}
        <div className="mt-12 border-t border-neutral-100 pt-6">
          <div className="text-sm font-medium">Tools</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOOLS.map((t) => <span key={t.name} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">{t.name}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// 2 · Whyspace's consent page (our design): who's asking, as whom, what it can do. A connection is yours,
// not a project's: it reaches every workspace and project you're in, and the tool finds the project from the chat.
function Authorize({ id, onAllow, onCancel }: { id: ProviderId; onAllow: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false)
  const p = PROVIDERS[id]
  const allow = () => { setBusy(true); setTimeout(onAllow, 800) }
  return (
    <div className="flex min-h-full items-start justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-[400px]">
        <Pair id={id} className="justify-center" />
        <h1 className="type-title mt-6 text-center">{p.name} wants to use your Whyspace</h1>

        <div className="mt-8 flex items-center gap-3 rounded-xl border px-3 py-2.5">
          <PersonAvatar id={ME.id} className="size-8" />
          <div className="min-w-0 flex-1">
            <div className="type-label truncate">{ME.name}</div>
            <div className="type-caption truncate text-muted-foreground">{ME.email}</div>
          </div>
          <button className="type-caption text-muted-foreground underline-offset-2 hover:underline">Switch</button>
        </div>

        <div className="type-label mt-8">{p.name} will be able to</div>
        <ul className="mt-3 space-y-3">
          {[
            [Eye, "Read your projects, threads and decisions"],
            [PenLine, "Log decisions and tasks as you work"],
            [Blend, "Ask your teammates' Duets"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof Eye
            return <li key={text as string} className="type-body flex items-center gap-3"><I className="size-4 shrink-0 text-muted-foreground" />{text as string}</li>
          })}
        </ul>

        <div className="mt-10 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button className="flex-1" onClick={allow} disabled={busy}>{busy && <Pending />}Allow</Button>
        </div>
      </div>
    </div>
  )
}

// 3 · Back in the tool: Whyspace connected, and what each of its tools may do without asking.
function Connected({ id, onChat }: { id: ProviderId; onChat: () => void }) {
  const [modes, setModes] = useState<Record<string, Mode>>(() => Object.fromEntries(TOOLS.map((t) => [t.name, t.mode])))
  return (
    <div className="font-sans">
      <ToolBar id={id} />
      <div className="mx-auto max-w-2xl px-6 pt-10 pb-12">
        <div className="text-sm text-neutral-400">Settings</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{id === "claude" ? "Connectors" : "Apps"}</h1>
        <div className="mt-6 rounded-2xl border border-neutral-200">
          <div className="flex items-center gap-3 p-4">
            <WhyspaceTile className="size-10" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Whyspace</div>
              <div className="flex items-center gap-1 text-sm text-green-700"><Check className="size-3.5" />Connected</div>
            </div>
            <button className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm hover:bg-neutral-50">Disconnect</button>
          </div>
          <div className="divide-y divide-neutral-100 border-t border-neutral-100">
            {TOOLS.map((t) => (
              <div key={t.name} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <span>{t.name}</span>
                <label className="relative flex items-center gap-1 text-neutral-500">
                  <select value={modes[t.name]} onChange={(e) => setModes({ ...modes, [t.name]: e.target.value as Mode })} className="cursor-pointer appearance-none bg-transparent pr-5 text-right outline-none">
                    {(Object.keys(MODE) as Mode[]).map((m) => <option key={m} value={m}>{MODE[m]}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 size-3.5" />
                </label>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onChat} className="mt-6 flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-700">Start a chat</button>
      </div>
    </div>
  )
}

// 4 · First use: ask about a decision, the tool reads it from Whyspace and links back.
function Chat({ id }: { id: ProviderId }) {
  const p = PROVIDERS[id]
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setShown(1), 500)
    const b = setTimeout(() => setShown(2), 1500)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  return (
    <div className="flex h-full flex-col font-sans">
      <ToolBar id={id} />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 pt-10">
        <div className="ml-auto w-fit max-w-[80%] rounded-2xl bg-neutral-100 px-4 py-2.5">Why did Whiskr switch the brand color to blue?</div>
        {shown >= 1 && (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500">
            {shown < 2 ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            <WhyspaceTile className="size-4 rounded text-[10px]" />
            Whyspace · Search decisions
          </div>
        )}
        {shown >= 2 && (
          <div className="space-y-3 leading-relaxed">
            <p>Trevor changed it on Oct 23. Research found that cats can't see red, and blue is the color they see best. It applies to the posters too, since cats see them as well.</p>
            <button onClick={() => navigate("/p/whiskr/decisions/nored")} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50">
              <WhyspaceTile className="size-4 rounded text-[10px]" />
              Change the brand color from red to blue
              <ArrowRight className="size-3.5 text-neutral-400" />
            </button>
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-2xl px-6 pb-6">
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 p-2 pl-3">
          <Plus className="size-4 text-neutral-500" />
          <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs"><WhyspaceTile className="size-3.5 rounded-[3px] text-[9px]" />Whyspace</span>
          <span className="flex-1 text-sm text-neutral-400">Reply to {p.name}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-neutral-900 text-white"><ArrowUp className="size-4" /></span>
        </div>
      </div>
    </div>
  )
}
