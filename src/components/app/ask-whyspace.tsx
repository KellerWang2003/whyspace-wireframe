import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { ArrowUp, ChevronDown, ChevronRight, PanelRight, PictureInPicture2, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { StatusIcon } from "@/components/app/status-badge"
import { ARTIFACTS, CANVAS_EXTRAS, DECISIONS, PROJECTS } from "@/data"
import { onAskWhyspace } from "@/lib/ask"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ArtifactThumb } from "@/playground/artifact"
import { reply, type Msg } from "@/playground/reply"

type Mode = "closed" | "float" | "dock"

const findSlot = () => document.querySelector<HTMLElement>("[data-assistant-slot]")

function watchDom(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

// The one AI. On a project's Catch up it's a chat bar at the bottom centre that expands
// upward; everywhere else it's the corner button that opens a side panel or pop-up.
// It's mounted above the routes, so both views share one conversation.
export function AskWhyspace() {
  const [first, second, third] = useRoute()
  const { current } = useStore()
  const project = ["p", "playground"].includes(first) ? PROJECTS.find((item) => item.id === second) : undefined
  const context = {
    scopeName: project?.name ?? current?.name ?? "your workspace",
    decisions: current?.example ? DECISIONS.filter((item) => !project || item.project === project.id) : [],
    artifacts: current?.example ? ARTIFACTS.filter((item) => !project || item.project === project.id) : [],
  }
  const catchUp = first === "p" && (!third || ["catch-up", "ask", "overview"].includes(third))
  const suggested = (project && CANVAS_EXTRAS[project.id]?.ask) || ["What changed since I was here?", "What's still open?", "Which decisions need confirmation?"]

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<Mode>("closed")
  // Coming back to Catch up shows just the bar; the conversation is a click away.
  const [wasCatchUp, setWasCatchUp] = useState(catchUp)
  if (catchUp !== wasCatchUp) {
    setWasCatchUp(catchUp)
    setExpanded(false)
  }
  // The current page's slot for the centre chat; pages replace it as you move around.
  const slot = useSyncExternalStore(watchDom, findSlot)

  function send(q: string) {
    if (!q.trim()) return
    setMsgs((ms) => [...ms, { who: "me", text: q }, reply(q, context)])
    if (catchUp) setExpanded(true)
    else setMode((m) => (m === "closed" ? "dock" : m))
  }

  // "Ask about this" on a page sends into this conversation.
  const latest = useRef(send)
  useEffect(() => { latest.current = send })
  useEffect(() => onAskWhyspace((q) => latest.current(q)), [])

  const thread = <Messages msgs={msgs} onLeave={() => setExpanded(false)} />

  if (catchUp)
    return slot ? createPortal(
      <CenterChat scopeName={context.scopeName} suggested={suggested} hasMsgs={msgs.length > 0} expanded={expanded} setExpanded={setExpanded} onSend={send}>{thread}</CenterChat>,
      slot,
    ) : null
  return <SidePanel suggested={suggested} hasMsgs={msgs.length > 0} mode={mode} setMode={setMode} onSend={send}>{thread}</SidePanel>
}

function Messages({ msgs, onLeave }: { msgs: Msg[]; onLeave: () => void }) {
  return msgs.map((msg, i) => (
    <div key={i} className={cn("space-y-1.5", msg.who === "me" && "flex justify-end")}>
      <div className={cn("text-sm", msg.who === "me" && "max-w-[80%] rounded-2xl bg-muted px-3 py-1.5")}>{msg.text}</div>
      {msg.refs?.map((d) => (
        <button key={d.id} onClick={() => { onLeave(); navigate(`/p/${d.project}/decisions/${d.id}`) }} className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs hover:bg-muted">
          <StatusIcon status={d.status} className="size-3.5 text-muted-foreground" />
          <span className="flex-1 truncate">{d.title}</span>
          <span className="text-muted-foreground">{d.part}</span>
        </button>
      ))}
      {msg.arts && <div className="grid grid-cols-2 gap-2">{msg.arts.map((a) => <ArtifactThumb key={a.id} artifact={a} onOpen={() => { onLeave(); navigate(`/p/${a.project}/artifacts/${a.id}`) }} />)}</div>}
    </div>
  ))
}

// A text box that sends on Enter.
function Composer({ placeholder, onSend, inputRef, className, before, after, onFocus, onBlur }: {
  placeholder: string
  onSend: (q: string) => void
  inputRef?: React.Ref<HTMLTextAreaElement>
  className?: string
  before?: React.ReactNode
  after?: React.ReactNode
  onFocus?: () => void
  onBlur?: () => void
}) {
  const [text, setText] = useState("")
  const submit = () => {
    onSend(text)
    setText("")
  }
  return (
    <form className={className} onSubmit={(e) => { e.preventDefault(); submit() }}>
      {before}
      <textarea
        ref={inputRef}
        rows={1}
        aria-label="Ask Whyspace"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      {after}
      <Button type="submit" size="icon" className="size-7 shrink-0 rounded-lg shadow-none" disabled={!text.trim()} aria-label="Send message"><ArrowUp className="size-4" /></Button>
    </form>
  )
}

// Catch up: a bar at the bottom centre; asking expands the conversation upward.
function CenterChat({ scopeName, suggested, hasMsgs, expanded, setExpanded, onSend, children }: {
  scopeName: string
  suggested: string[]
  hasMsgs: boolean
  expanded: boolean
  setExpanded: (on: boolean) => void
  onSend: (q: string) => void
  children: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (expanded) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  })
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end px-4 pb-4" onKeyDown={(e) => { if (e.key === "Escape") setExpanded(false) }}>
      {expanded && <div className="pointer-events-auto absolute inset-0 bg-background/50 backdrop-blur-[1px]" onClick={() => setExpanded(false)} />}
      <div className="pointer-events-auto relative flex w-full max-w-2xl flex-col gap-2">
        {expanded && (
          <section aria-label="Ask Whyspace" className="flex max-h-[min(60vh,560px)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
            <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
              <Sparkles className="size-3.5" />
              <span className="text-sm font-medium">Ask Whyspace</span>
              <span className="truncate text-xs text-muted-foreground">· {scopeName}</span>
              <Button variant="ghost" size="icon" className="ml-auto size-7" aria-label="Collapse Ask Whyspace" onClick={() => setExpanded(false)}><ChevronDown /></Button>
            </header>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">{children}</div>
          </section>
        )}
        {!expanded && focused && !hasMsgs && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggested.map((q) => (
              <button key={q} onMouseDown={(e) => e.preventDefault()} onClick={() => onSend(q)} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground">{q}</button>
            ))}
          </div>
        )}
        <Composer
          placeholder={`Ask Whyspace about ${scopeName}…`}
          onSend={onSend}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex items-end gap-2 rounded-2xl border bg-background py-2 pr-2 pl-3.5 shadow-lg focus-within:border-ring/50"
          before={<Sparkles className="mb-1.5 size-4 shrink-0 text-muted-foreground" />}
          after={hasMsgs && !expanded && <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setExpanded(true)}>Show chat</Button>}
        />
      </div>
    </div>
  )
}

// Everywhere else: the corner button opens a panel docked on the right, or floating.
function SidePanel({ suggested, hasMsgs, mode, setMode, onSend, children }: {
  suggested: string[]
  hasMsgs: boolean
  mode: Mode
  setMode: (mode: Mode) => void
  onSend: (q: string) => void
  children: React.ReactNode
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (mode !== "closed") inputRef.current?.focus()
  }, [mode])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  })

  if (mode === "closed")
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Ask Whyspace" onClick={() => setMode("dock")} className="fixed right-5 bottom-5 z-40 size-10 rounded-xl border-border/70 bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground">
            <Sparkles className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>Ask Whyspace</TooltipContent>
      </Tooltip>
    )

  return (
    <div role="region" aria-label="Ask Whyspace" onKeyDown={(e) => { if (e.key === "Escape") setMode("closed") }} className={cn("flex flex-col border bg-background", mode === "float" ? "fixed right-5 bottom-5 z-40 h-[520px] max-h-[calc(100svh-2.5rem)] w-[380px] max-w-[calc(100vw-2.5rem)] rounded-xl shadow-xl" : "relative h-full min-w-0 w-[min(400px,45vw)] shrink-0 border-y-0 border-r-0")}>
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <span className="text-sm font-medium">Ask Whyspace</span>
        <div className="ml-auto flex shrink-0 text-muted-foreground">
          <Button variant="ghost" size="icon" className="size-7" title={mode === "float" ? "Dock to the side" : "Float"} onClick={() => setMode(mode === "float" ? "dock" : "float")}>
            {mode === "float" ? <PanelRight /> : <PictureInPicture2 />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Minimize Ask Whyspace" onClick={() => setMode("closed")}><X /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6" aria-live="polite">
        {!hasMsgs && (
          <div className="pt-10">
            <Sparkles className="mb-4 size-6 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-lg font-medium tracking-tight">Where should we start?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Find the thinking behind your team's work.</p>
            <div className="-mx-2 mt-6 space-y-1">
              {suggested.map((s) => <button key={s} onClick={() => onSend(s)} className="group flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"><ChevronRight className="size-3.5 shrink-0 opacity-60" />{s}</button>)}
            </div>
          </div>
        )}
        {children}
      </div>
      <Composer
        inputRef={inputRef}
        placeholder="Ask anything about your work…"
        onSend={onSend}
        className="m-3 mt-0 flex items-end gap-2 rounded-xl border border-border/80 bg-muted/20 p-3 transition-colors focus-within:border-ring/50"
      />
    </div>
  )
}
