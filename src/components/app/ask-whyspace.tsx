import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { ArrowUp, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusIcon } from "@/components/app/status-badge"
import { ARTIFACTS, CANVAS_EXTRAS, DECISIONS, PROJECTS } from "@/data"
import { onAskWhyspace } from "@/lib/ask"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ArtifactThumb } from "@/playground/artifact"
import { reply, type Msg } from "@/playground/reply"

const findSlot = () => document.querySelector<HTMLElement>("[data-assistant-slot]")

function watchDom(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

// The one AI: a chat bar at the bottom centre of the page, like a regular chatbot.
// Asking expands the conversation upward. It's mounted above the routes and drawn into
// each page's assistant slot, so the conversation carries across pages.
export function AskWhyspace() {
  const [first, second, third] = useRoute()
  const { current } = useStore()
  const project = ["p", "playground"].includes(first) ? PROJECTS.find((item) => item.id === second) : undefined
  const context = {
    scopeName: project?.name ?? current?.name ?? "your workspace",
    decisions: current?.example ? DECISIONS.filter((item) => !project || item.project === project.id) : [],
    artifacts: current?.example ? ARTIFACTS.filter((item) => !project || item.project === project.id) : [],
  }
  // A project's Catch up keeps the bar out; elsewhere it rests as a small button in the corner,
// clear of canvas controls, and opens into the same centred bar.
  const catchUp = first === "p" && (!third || ["catch-up", "ask", "overview"].includes(third))
  const suggested = (project && CANVAS_EXTRAS[project.id]?.ask) || ["What changed since I was here?", "What's still open?", "Which decisions need confirmation?"]

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [expanded, setExpanded] = useState(false)
  const [barOpen, setBarOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // The current page's slot; pages replace it as you move around.
  const slot = useSyncExternalStore(watchDom, findSlot)

  function send(q: string) {
    if (!q.trim()) return
    setMsgs((ms) => [...ms, { who: "me", text: q }, reply(q, context)])
    setText("")
    setExpanded(true)
  }

  // "Ask about this" on a page sends into this conversation.
  const latest = useRef(send)
  useEffect(() => { latest.current = send })
  useEffect(() => onAskWhyspace((q) => latest.current(q)), [])

  useEffect(() => {
    if (expanded) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs, expanded])

  function collapse() {
    setExpanded(false)
    if (!catchUp && !text) setBarOpen(false)
  }

  const showBar = catchUp || barOpen || expanded
  const ui = (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end px-4 pb-4" onKeyDown={(e) => { if (e.key === "Escape") collapse() }}>
      {expanded && <div className="pointer-events-auto absolute inset-0 bg-background/50 backdrop-blur-[1px]" onClick={collapse} />}

      {showBar ? (
        <div className="pointer-events-auto relative flex w-full max-w-2xl flex-col gap-2">
          {expanded && (
            <section aria-label="Ask Whyspace" className="flex max-h-[min(60vh,560px)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
              <header className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
                <Sparkles className="size-3.5" />
                <span className="text-sm font-medium">Ask Whyspace</span>
                <span className="truncate text-xs text-muted-foreground">· {context.scopeName}</span>
                <Button variant="ghost" size="icon" className="ml-auto size-7" aria-label="Collapse Ask Whyspace" onClick={collapse}><ChevronDown /></Button>
              </header>
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
                {msgs.map((msg, i) => (
                  <div key={i} className={cn("space-y-1.5", msg.who === "me" && "flex justify-end")}>
                    <div className={cn("text-sm", msg.who === "me" && "max-w-[80%] rounded-2xl bg-muted px-3 py-1.5")}>{msg.text}</div>
                    {msg.refs?.map((d) => (
                      <button key={d.id} onClick={() => { collapse(); navigate(`/p/${d.project}/decisions/${d.id}`) }} className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs hover:bg-muted">
                        <StatusIcon status={d.status} className="size-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{d.title}</span>
                        <span className="text-muted-foreground">{d.part}</span>
                      </button>
                    ))}
                    {msg.arts && <div className="grid grid-cols-2 gap-2">{msg.arts.map((a) => <ArtifactThumb key={a.id} artifact={a} onOpen={() => { collapse(); navigate(`/p/${a.project}/artifacts/${a.id}`) }} />)}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!expanded && focused && !msgs.length && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggested.map((q) => (
                <button key={q} onMouseDown={(e) => e.preventDefault()} onClick={() => send(q)} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground">{q}</button>
              ))}
            </div>
          )}

          <form
            className="flex items-end gap-2 rounded-2xl border bg-background py-2 pr-2 pl-3.5 shadow-lg focus-within:border-ring/50"
            onSubmit={(e) => { e.preventDefault(); send(text) }}
          >
            <Sparkles className="mb-1.5 size-4 shrink-0 text-muted-foreground" />
            <textarea
              ref={inputRef}
              rows={1}
              aria-label="Ask Whyspace"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => { setFocused(false); if (!catchUp && !text && !expanded) setBarOpen(false) }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send(text)
                }
              }}
              placeholder={`Ask Whyspace about ${context.scopeName}…`}
              className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
            />
            {msgs.length > 0 && !expanded && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setExpanded(true)}>Show chat</Button>
            )}
            <Button type="submit" size="icon" className="size-7 shrink-0 rounded-lg shadow-none" disabled={!text.trim()} aria-label="Send message"><ArrowUp className="size-4" /></Button>
          </form>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="pointer-events-auto self-end rounded-full bg-background text-muted-foreground shadow-md hover:text-foreground"
          onClick={() => { setBarOpen(true); requestAnimationFrame(() => inputRef.current?.focus()) }}
        >
          <Sparkles />Ask Whyspace
        </Button>
      )}
    </div>
  )

  return slot ? createPortal(ui, slot) : null
}
