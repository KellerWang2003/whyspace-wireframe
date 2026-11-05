import { useEffect, useRef, useState } from "react"
import { ArrowUp, Check, ChevronDown, FileText, Maximize2, MessageCircle, PanelRight, Paperclip, PictureInPicture2, Plus, Spline, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { StatusIcon } from "@/components/app/status-badge"
import { ME } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { DESIGN } from "@/lib/design"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { ResizeGrip, ResizeHandle } from "@/components/app/resize-handle"
import { usePanelWidth } from "@/lib/use-panel-width"
import { DuetSide } from "@/design-b/duet-lines"
import { ArtifactThumb } from "@/playground/artifact"
import type { Msg } from "@/playground/reply"
import { ALL, MODELS, NAME, useAskEvents, useConversation, type ComposerControls, type Conversation, type Jumpstart } from "./conversation"
import { nowMinutes } from "@/lib/scenario"

type Mode = "closed" | "float" | "dock"

// A small time-aware hello, like Claude's empty state.
function greeting(name: string, hour = Math.floor(nowMinutes() / 60)) {
  if (hour < 5) return "Hey, night owl"
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 18) return `Good afternoon, ${name}`
  if (hour < 22) return `Good evening, ${name}`
  return `Still up, ${name}?`
}

// The one AI, in the same place on every page: the corner button opens a panel docked on
// the right, or floating. It's mounted above the routes, so every page shares one conversation.
export function AskWhyspace() {
  const [first_, , third] = useRoute()
  const convo = useConversation()
  const [mode, setMode] = useState<Mode>("closed")
  const decisionsTab = first_ === "p" && third === "decisions"
  // On the Decisions tab Ask docks on the right by default; its answers filter the table.
  const [wasDecisions, setWasDecisions] = useState(false)
  if (decisionsTab !== wasDecisions) {
    setWasDecisions(decisionsTab)
    // Design B keeps Decisions as one of Home's tabs, so Ask stays where you left it.
    if (decisionsTab && mode === "closed" && DESIGN !== "b") setMode("dock")
  }
  const send = (q: string, askId?: string) => {
    if (!q.trim()) return
    convo.send(q, askId)
    setMode((m) => (m === "closed" ? "dock" : m))
  }
  useAskEvents(send)

  return (
    <SidePanel convo={convo} mode={mode} setMode={setMode} onSend={send}>
      <Messages msgs={convo.msgs} />
    </SidePanel>
  )
}


export function Messages({ msgs }: { msgs: Msg[] }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  // Citations open the decision sheet over the page you're on.
  return msgs.map((msg, i) => (
    <div key={i} className={cn("space-y-1.5", msg.who === "me" && "flex justify-end")}>
      <div className={cn("text-sm", msg.who === "me" && "max-w-[80%] rounded-2xl bg-muted px-3 py-1.5")}>{msg.text}</div>
      {msg.refs?.map((d) => (
        <button key={d.id} onClick={() => openDecision(d.id)} className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs hover:bg-muted">
          <StatusIcon status={statusOf(d)} className="size-3.5 text-muted-foreground" />
          <span className="flex-1 truncate">{d.title}</span>
          <span className="text-muted-foreground">{d.part}</span>
        </button>
      ))}
      {msg.arts && <div className="grid grid-cols-2 gap-2">{msg.arts.map((a) => <ArtifactThumb key={a.id} artifact={a} onOpen={() => navigate(`/p/${a.project}/artifacts/${a.id}`)} />)}</div>}
    </div>
  ))
}

// Empty conversation: a small hello, then a few ways in.
export function Greeting({ className }: { className?: string }) {
  return <h2 className={cn("text-center type-display", className)}>{greeting(ME.name.split(" ")[0])}</h2>
}

export function Jumpstarts({ jumpstarts, onSend, className }: { jumpstarts: Jumpstart[]; onSend: (q: string) => void; className?: string }) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {jumpstarts.map(({ icon: Icon, label }) => (
        <button key={label} onClick={() => onSend(label)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  )
}


// A text box that sends on Enter, with attach, thread scope and model below it.
export function Composer({ placeholder, onSend, inputRef, className, controls }: {
  placeholder: string
  onSend: (q: string) => void
  inputRef?: React.Ref<HTMLTextAreaElement>
  className?: string
  controls: ComposerControls
}) {
  const [text, setText] = useState("")
  const submit = () => {
    onSend(text)
    setText("")
  }
  const c = controls
  return (
    <form className={cn("rounded-2xl border border-border/80 bg-background p-2.5 transition-colors focus-within:border-ring/50", className)} onSubmit={(e) => { e.preventDefault(); submit() }}>
      {c.attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {c.attachments.map((a) => (
            <span key={a.id} className="flex max-w-full items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2 text-xs">
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{a.name}</span>
              <button type="button" onClick={() => c.onRemove(a.id)} aria-label={`Remove ${a.name}`} className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={inputRef}
        rows={2}
        aria-label={NAME === "Duet" ? "Ask your Duet" : NAME}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        className="block max-h-40 min-h-12 w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
      />
      <div className="mt-1 flex items-center gap-1">
        <AttachMenu controls={c} />
        {c.scopes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 min-w-0 gap-1 px-2 text-xs font-normal text-muted-foreground">
                <Spline className="size-3.5" />
                <span className="truncate">{c.scope === ALL ? c.scopeAll : c.scope}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <ScopeItem label={c.scopeAll} active={c.scope === ALL} onSelect={() => c.setScope(ALL)} />
              <DropdownMenuSeparator />
              {c.scopes.map((s) => <ScopeItem key={s} label={s} active={c.scope === s} onSelect={() => c.setScope(s)} />)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs font-normal text-muted-foreground">
              {c.model}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {MODELS.map((m) => <ScopeItem key={m} label={m} active={c.model === m} onSelect={() => c.setModel(m)} />)}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="submit" size="icon" className="size-7 shrink-0 rounded-lg shadow-none" disabled={!text.trim()} aria-label="Send message"><ArrowUp className="size-4" /></Button>
      </div>
    </form>
  )
}

function ScopeItem({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <span className="flex-1 truncate">{label}</span>
      {active && <Check className="size-3.5" />}
    </DropdownMenuItem>
  )
}

// Attach a file from your computer, or something already in Whyspace.
function AttachMenu({ controls: c }: { controls: ComposerControls }) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          for (const f of Array.from(e.target.files ?? [])) c.onAttach({ id: `file-${f.name}-${f.size}`, name: f.name })
          e.target.value = ""
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Attach"><Plus className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}><Upload />Upload a file</DropdownMenuItem>
          {c.artifacts.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><FileText />Add an artifact</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Recent</DropdownMenuLabel>
                {c.artifacts.slice(0, 8).map((a) => (
                  <DropdownMenuItem key={a.id} onSelect={() => c.onAttach({ id: a.id, name: a.name })}><span className="truncate">{a.name}</span></DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

// The corner button opens a panel docked on the right, or floating. In Design B the empty panel
// also shows what your Duet handled and who is waiting on you, condensed; the page has it all.
function SidePanel({ convo, mode, setMode, onSend, children }: {
  convo: Conversation
  mode: Mode
  setMode: (mode: Mode) => void
  onSend: (q: string) => void
  children: React.ReactNode
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dockWidth, setDockWidth] = usePanelWidth("ask-dock", 420)
  const [floatWidth, setFloatWidth] = usePanelWidth("ask-float", 400)
  const [floatHeight, setFloatHeight] = usePanelWidth("ask-float-height", 560)
  const floatSize = () => ({ w: floatWidth, h: floatHeight })
  const setFloatSize = ({ w, h }: { w: number; h: number }) => { setFloatWidth(w); setFloatHeight(h) }
  const resetFloat = () => setFloatSize({ w: 400, h: 560 })
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
          <Button variant="outline" size="icon" aria-label={NAME === "Duet" ? "Open Duet" : NAME} onClick={() => setMode("dock")} className="fixed right-5 bottom-5 z-40 size-10 rounded-xl border-border/70 bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground">
            <MessageCircle className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>{NAME}</TooltipContent>
      </Tooltip>
    )

  return (
    <div role="region" aria-label={NAME} onKeyDown={(e) => { if (e.key === "Escape" && e.currentTarget.contains(e.target as Node)) setMode("closed") }} style={mode === "float" ? { width: floatWidth, height: floatHeight } : { width: dockWidth }} className={cn("flex flex-col border bg-background", mode === "float" ? "fixed right-5 bottom-5 z-40 max-h-[calc(100svh-2.5rem)] max-w-[calc(100vw-2.5rem)] rounded-xl shadow-md" : "relative h-full min-w-0 max-w-[60vw] shrink-0 border-y-0 border-r-0")}>
      {mode === "float"
        // Floating: anchored bottom-right, so the left edge, top edge and top-left corner resize it.
        ? <>
            <ResizeGrip x={-1} getSize={floatSize} onSize={setFloatSize} minW={320} maxW={900} onReset={resetFloat} className="inset-y-3 -left-1 w-2" />
            <ResizeGrip y={-1} getSize={floatSize} onSize={setFloatSize} minH={320} onReset={resetFloat} className="inset-x-3 -top-1 h-2" />
            <ResizeGrip x={-1} y={-1} getSize={floatSize} onSize={setFloatSize} minW={320} maxW={900} minH={320} onReset={resetFloat} className="-top-1 -left-1 size-4" />
          </>
        : <ResizeHandle edge="left" getWidth={() => dockWidth} onWidth={setDockWidth} min={320} max={760} reset={420} />}
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <span className="text-sm font-medium">{NAME}</span>
        <div className="ml-auto flex shrink-0 text-muted-foreground">
          {DESIGN === "b" && <Button variant="ghost" size="icon" className="size-7" title="Open the Duet page" aria-label="Open the Duet page" onClick={() => { setMode("closed"); navigate("/duet") }}><Maximize2 /></Button>}
          <Button variant="ghost" size="icon" className="size-7" title={mode === "float" ? "Dock to the side" : "Float"} onClick={() => setMode(mode === "float" ? "dock" : "float")}>
            {mode === "float" ? <PanelRight /> : <PictureInPicture2 />}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" aria-label={`Minimize ${NAME}`} onClick={() => setMode("closed")}><X /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6" aria-live="polite">
        {convo.hasMsgs ? (
          <div className="space-y-5">{children}</div>
        ) : (
          // Empty: a small hello in the middle, a few ways in just above the composer.
          <>
            <Greeting className="my-auto" />
            {DESIGN === "b" && <DuetSide compact projectId={convo.projectId} className="-mx-2.5 mb-6" />}
            <Jumpstarts jumpstarts={convo.jumpstarts} onSend={onSend} className="-mx-2.5" />
          </>
        )}
      </div>
      <Composer inputRef={inputRef} placeholder={convo.hasMsgs ? "Reply…" : "How can I help?"} onSend={onSend} controls={convo.controls} className="m-3 mt-0" />
    </div>
  )
}
