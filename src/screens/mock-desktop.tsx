import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { ArrowUp, ChevronDown, ChevronRight, FolderClosed, MessageSquare, PanelLeft, Plus, Search, Share } from "lucide-react"
import { cn } from "@/lib/utils"

// A stand-in desktop for the overlay demo: a menu bar and a Claude-style chat app,
// so the overlay reads as sitting on top of someone's real work. Not Whyspace UI.
// Replies stream from the dev server's /api/chat (vite.config.ts) when ANTHROPIC_API_KEY
// is set in .env.local; otherwise they fall back to canned lines. Nothing here writes data.

type Line = { who: "me" | "ai"; text: string }
type Chat = { id: string; project: string | null; title: string; lines: Line[] }
type Project = { id: string; name: string; context: string }

const PROJECTS: Project[] = [
  {
    id: "whiskr",
    name: "Whiskr",
    context:
      "Project: Whiskr, a cat-matching app (think Tinder for cats). The team just changed the brand color from red to blue. The app has a moving dot that shows cats where to swipe, and the dot purrs. Current work: a 15-second promo video that starts with a real clip of Luna (the team's demo cat, her pounce is at 0:42) and ends on an end card, onboarding copy, and user testing with cat owners.",
  },
  {
    id: "studio",
    name: "AI Studio · Recall",
    context:
      "Project: Recall, an AI assistant prototype in a design studio course. Current work: how Recall handles questions it can't answer, and the prototype flow.",
  },
  {
    id: "holiday",
    name: "Holiday campaign",
    context: "Project: Whiskr's holiday campaign. Nothing has been planned yet.",
  },
]

const SEED: Chat[] = [
  {
    id: "promo",
    project: "whiskr",
    title: "Promo video plan",
    lines: [
      { who: "me", text: "Let's plan the Whiskr promo video. Use our brand guidelines for the visuals." },
      { who: "ai", text: "On it. I'll use the blue brand color and the moving dot. How long should it run?" },
      { who: "me", text: "Make it 15 seconds." },
      { who: "ai", text: "15 seconds works, cats lose interest fast. What should it open on?" },
      { who: "me", text: "Start with Luna's real clip, the pounce at 0:42." },
      { who: "ai", text: "Strong start. What color for the end card?" },
      { who: "me", text: "Make the end card red, like the old logo." },
      { who: "ai", text: "Done. Here's the shot list: Luna's pounce, the swipe, the purring dot, red end card." },
    ],
  },
  {
    id: "onboarding",
    project: "whiskr",
    title: "Onboarding copy ideas",
    lines: [
      { who: "me", text: "Give me three onboarding headlines for Whiskr. Playful, not cheesy." },
      { who: "ai", text: "Find your cat's next best friend.\nSwipe right on whiskers.\nEvery cat deserves a match.\n\nWant them shorter?" },
      { who: "me", text: "The second one, shorter." },
      { who: "ai", text: "Swipe for whiskers." },
    ],
  },
  {
    id: "panel",
    project: "whiskr",
    title: "Match screen feedback",
    lines: [
      { who: "me", text: "Summarize the panel notes on the match screen." },
      { who: "ai", text: "Three themes: owners want the cat's temperament up front, the paw animation feels slow, and people missed the Not now button. Want a fix list?" },
    ],
  },
  {
    id: "recall",
    project: "studio",
    title: "Recall fallback answers",
    lines: [
      { who: "me", text: "How should Recall reply when it can't answer?" },
      { who: "ai", text: "Say plainly what it can't answer, offer the closest thing it does know, and give a way to ask a person." },
    ],
  },
  {
    id: "packing",
    project: null,
    title: "Weekend packing list",
    lines: [
      { who: "me", text: "Packing list for two days in the mountains?" },
      { who: "ai", text: "Layers, a rain shell, good shoes, water bottle, snacks, sunscreen, headlamp, and a charger." },
    ],
  },
  {
    id: "grid",
    project: null,
    title: "CSS grid gap question",
    lines: [
      { who: "me", text: "Why does gap not work on my grid?" },
      { who: "ai", text: "Check that the parent has display: grid. Gap only applies to the grid or flex container, not its children." },
    ],
  },
]

const CANNED = ["Got it. I'll fold that into the plan.", "Makes sense. Anything else to change?", "Noted. Want me to update the shot list?"]

const SYSTEM_BASE =
  "You are Claude, chatting with Keller, a product designer, in a desktop chat app. This is a demo for a usability test, so stay in the scenario and keep it believable. Reply in plain text with no Markdown, headings or bullet symbols. Keep replies to one to three short sentences unless Keller asks for more."

// ── Palette (Claude-like warm neutrals, local to this mock) ──
const C = {
  side: "bg-[#efede6]",
  main: "bg-[#faf9f5]",
  ink: "text-[#1f1e1b]",
  soft: "text-[#6b6a64]",
  hover: "hover:bg-black/[0.05]",
  active: "bg-black/[0.07]",
  bubble: "bg-[#ebe8df]",
  accent: "bg-[#c96442]",
  accentText: "text-[#c96442]",
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })
}

function Spark({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("inline-grid place-items-center font-semibold leading-none", C.accentText, spinning && "animate-pulse", className)}>
      ✳
    </span>
  )
}

async function streamReply(chat: Chat, onText: (t: string) => void) {
  const project = PROJECTS.find((p) => p.id === chat.project)
  const system = project ? `${SYSTEM_BASE}\n\n${project.context}` : SYSTEM_BASE
  const messages = chat.lines.map((l) => ({ role: l.who === "me" ? "user" : "assistant", content: l.text }))
  const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, messages }) })
  if (!res.ok || !res.body) throw new Error(`chat ${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let got = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (text) { got = true; onText(text) }
  }
  if (!got) throw new Error("empty reply")
}

export function MockDesktop({ onShare }: { onShare?: () => void } = {}) {
  const clock = useClock()
  const [chats, setChats] = useState<Chat[]>(SEED)
  const [activeId, setActiveId] = useState("promo")
  const [open, setOpen] = useState<Record<string, boolean>>({ whiskr: true })
  const [sidebar, setSidebar] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const busy = busyId !== null
  const [draft, setDraft] = useState("")
  const active = chats.find((c) => c.id === activeId) ?? chats[0]
  const activeProject = PROJECTS.find((p) => p.id === active.project)

  // ── Window drag (title bar) ──
  const deskRef = useRef<HTMLDivElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  function onBarDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    const desk = deskRef.current!.getBoundingClientRect()
    const win = winRef.current!.getBoundingClientRect()
    drag.current = { dx: e.clientX - win.left, dy: e.clientY - win.top }
    setPos({ x: win.left - desk.left, y: win.top - desk.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onBarMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const desk = deskRef.current!.getBoundingClientRect()
    const w = winRef.current!.offsetWidth
    const x = Math.min(Math.max(e.clientX - desk.left - drag.current.dx, 120 - w), desk.width - 120)
    const y = Math.min(Math.max(e.clientY - desk.top - drag.current.dy, 28), desk.height - 40)
    setPos({ x, y })
  }
  function onBarUp() { drag.current = null }

  // ── Chat ──
  function patchLast(id: string, fn: (text: string) => string) {
    setChats((cs) => cs.map((c) => {
      if (c.id !== id) return c
      const lines = c.lines.slice()
      const last = lines[lines.length - 1]
      lines[lines.length - 1] = { ...last, text: fn(last.text) }
      return { ...c, lines }
    }))
  }

  async function send() {
    const text = draft.trim()
    if (!text || busy) return
    setDraft("")
    const id = active.id
    setBusyId(id)
    const title = active.lines.length === 0 ? text.split(/\s+/).slice(0, 5).join(" ") : active.title
    const withMe: Chat = { ...active, title, lines: [...active.lines, { who: "me", text }] }
    setChats((cs) => cs.map((c) => (c.id === id ? { ...withMe, lines: [...withMe.lines, { who: "ai", text: "" }] } : c)))
    try {
      await streamReply(withMe, (t) => patchLast(id, (prev) => prev + t))
    } catch (err) {
      console.warn("[mock chat] live reply unavailable, using a canned one.", err)
      const canned = CANNED[withMe.lines.length % CANNED.length]
      window.setTimeout(() => patchLast(id, () => canned), 500)
    } finally {
      setBusyId(null)
    }
  }

  function newChat(project: string | null) {
    const id = `chat-${Date.now()}`
    setChats((cs) => [{ id, project, title: "New chat", lines: [] }, ...cs])
    setActiveId(id)
    if (project) setOpen((o) => ({ ...o, [project]: true }))
  }

  const recents = chats.filter((c) => !c.project)

  return (
    <div ref={deskRef} className="absolute inset-0">
      {/* Menu bar */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-4 bg-white/50 px-4 text-[12px] backdrop-blur-xl">
        <span className="size-3 rounded-full bg-foreground/80" />
        <span className="font-semibold">Claude</span>
        {["File", "Edit", "View", "Window", "Help"].map((m) => <span key={m} className="text-foreground/80">{m}</span>)}
        <span className="ml-auto tabular-nums text-foreground/80">{clock}</span>
      </div>

      {/* App window */}
      <div
        ref={winRef}
        style={pos ? { left: pos.x, top: pos.y } : undefined}
        className={cn(
          "absolute flex h-[min(640px,calc(100%-72px))] w-[min(980px,calc(100%-48px))] flex-col overflow-hidden rounded-xl border border-black/10 shadow-2xl",
          C.main, C.ink,
          !pos && "left-1/2 top-[calc(50%+14px)] -translate-x-1/2 -translate-y-1/2",
        )}
      >
        {/* Title bar (drag handle) */}
        <div
          onPointerDown={onBarDown}
          onPointerMove={onBarMove}
          onPointerUp={onBarUp}
          onPointerCancel={onBarUp}
          className={cn("relative flex h-10 shrink-0 cursor-default select-none items-center gap-3 border-b border-black/[0.06] px-3", C.side)}
        >
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <button type="button" aria-label="Toggle sidebar" onClick={() => setSidebar((s) => !s)} className={cn("grid size-7 place-items-center rounded-md", C.soft, C.hover)}>
            <PanelLeft className="size-4" />
          </button>
          <span className={cn("pointer-events-none absolute inset-x-0 truncate px-40 text-center text-xs font-medium", C.soft)}>
            {activeProject ? `${activeProject.name} / ` : ""}{active.title}
          </span>
          {/* Sharing the chat is work reaching a shared place: Whyspace opens the check once. */}
          {onShare && <button type="button" onClick={onShare} className={cn("ml-auto flex h-7 items-center gap-1.5 rounded-md border border-black/10 px-2.5 text-xs font-medium", C.hover)}><Share className="size-3.5" />Share</button>}
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          {sidebar && (
            <aside className={cn("flex w-60 shrink-0 flex-col border-r border-black/[0.06]", C.side)}>
              <div className="space-y-0.5 p-2">
                <button type="button" onClick={() => newChat(null)} className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px] font-medium", C.hover)}>
                  <span className={cn("grid size-5 place-items-center rounded-full text-white", C.accent)}><Plus className="size-3.5" /></span>
                  New chat
                </button>
                <SideRow icon={<Search className="size-4" />} label="Search" />
                <SideRow icon={<MessageSquare className="size-4" />} label="Chats" />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                <p className={cn("px-2 pb-1 pt-3 text-[11px] font-medium", C.soft)}>Projects</p>
                {PROJECTS.map((p) => {
                  const list = chats.filter((c) => c.project === p.id)
                  const isOpen = open[p.id]
                  return (
                    <div key={p.id}>
                      <div className={cn("group flex h-8 items-center rounded-lg pr-1", C.hover)}>
                        <button type="button" onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]">
                          {isOpen ? <ChevronDown className={cn("size-3.5 shrink-0", C.soft)} /> : <ChevronRight className={cn("size-3.5 shrink-0", C.soft)} />}
                          <FolderClosed className={cn("size-4 shrink-0", C.soft)} />
                          <span className="truncate">{p.name}</span>
                        </button>
                        <button type="button" aria-label={`New chat in ${p.name}`} onClick={() => newChat(p.id)} className={cn("grid size-6 place-items-center rounded-md opacity-0 group-hover:opacity-100", C.soft, C.hover)}>
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="mb-1 ml-[22px] border-l border-black/10 pl-1.5">
                          {list.length === 0 && <p className={cn("px-2 py-1.5 text-[12px]", C.soft)}>No chats yet</p>}
                          {list.map((c) => <ChatRow key={c.id} chat={c} active={c.id === active.id} onClick={() => setActiveId(c.id)} />)}
                        </div>
                      )}
                    </div>
                  )
                })}

                <p className={cn("px-2 pb-1 pt-4 text-[11px] font-medium", C.soft)}>Recents</p>
                {recents.map((c) => <ChatRow key={c.id} chat={c} active={c.id === active.id} onClick={() => setActiveId(c.id)} />)}
              </div>

              <div className="flex items-center gap-2 border-t border-black/[0.06] p-3">
                <span className="grid size-7 place-items-center rounded-full bg-[#3d3a35] text-[11px] font-semibold text-white">K</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-medium">Keller</p>
                  <p className={cn("text-[11px]", C.soft)}>Pro plan</p>
                </div>
              </div>
            </aside>
          )}

          {/* Conversation */}
          <main className="flex min-w-0 flex-1 flex-col">
            {active.lines.length === 0 ? (
              <div className="grid flex-1 place-items-center px-8">
                <div className="w-full max-w-[600px] space-y-6">
                  <h2 className="flex items-center justify-center gap-3 font-serif text-[30px] tracking-tight">
                    <Spark className="text-[28px]" />
                    {activeProject ? activeProject.name : "How can I help, Keller?"}
                  </h2>
                  <Composer draft={draft} setDraft={setDraft} send={send} busy={busy} />
                </div>
              </div>
            ) : (
              <>
                <Messages lines={active.lines} busy={busyId === active.id} />
                <div className="mx-auto w-full max-w-[680px] px-6 pb-5">
                  <Composer draft={draft} setDraft={setDraft} send={send} busy={busy} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function SideRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button type="button" className={cn("flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[13px]", C.hover)}>
      <span className={C.soft}>{icon}</span>
      {label}
    </button>
  )
}

function ChatRow({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex h-8 w-full items-center truncate rounded-lg px-2 text-left text-[13px]", active ? C.active : C.hover)}>
      <span className="truncate">{chat.title}</span>
    </button>
  )
}

function Messages({ lines, busy }: { lines: Line[]; busy: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" })
  }, [lines])
  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[680px] space-y-5 px-6 py-8">
        {lines.map((l, i) => {
          const last = i === lines.length - 1
          return l.who === "me" ? (
            <div key={i} className="flex justify-end">
              <p className={cn("max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed", C.bubble)}>{l.text}</p>
            </div>
          ) : (
            <div key={i} className="space-y-2">
              {l.text ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{l.text}</p> : null}
              {last && <Spark className="text-lg" spinning={busy || !l.text} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Composer({ draft, setDraft, send, busy }: { draft: string; setDraft: (s: string) => void; send: () => void; busy: boolean }) {
  return (
    <form
      className="rounded-2xl border border-black/10 bg-white px-3 pb-2 pt-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      onSubmit={(e) => { e.preventDefault(); send() }}
    >
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
        }}
        rows={1}
        placeholder="Reply to Claude…"
        aria-label="Message"
        className="field-sizing-content max-h-40 min-h-6 w-full resize-none bg-transparent px-1 text-[15px] leading-6 outline-none placeholder:text-[#9a988f]"
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" aria-label="Attach" className={cn("grid size-8 place-items-center rounded-lg border border-black/10", C.soft, C.hover)}>
          <Plus className="size-4" />
        </button>
        <span className={cn("ml-auto flex items-center gap-1 text-[13px]", C.soft)}>
          Haiku 5.5 <ChevronDown className="size-3.5" />
        </span>
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim() || busy}
          className={cn("grid size-8 place-items-center rounded-lg text-white disabled:opacity-40", C.accent)}
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </form>
  )
}
