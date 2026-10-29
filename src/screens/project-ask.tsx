import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUp, Check, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { TaskStatusIcon } from "@/components/app/tasks"
import { projectSections } from "@/components/decisions/section-data"
import { ACTIVITY, ARTIFACTS, CANVAS_EXTRAS, DECISIONS, PEOPLE, WEEK_SUMMARY, changedSince, needsYou, type Artifact, type NeedsYou, type Project } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { ArtifactPicture } from "@/playground/artifact"
import { reply, type Msg } from "@/playground/reply"

// Ask is the project's landing page: a chat with Whyspace about this project. It opens with
// the catch-up briefing, written for the viewer at this stage.
export function ProjectAsk({ project }: { project: Project }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const context = useMemo(() => ({
    scopeName: project.name,
    decisions: DECISIONS.filter((d) => d.project === project.id),
    artifacts: ARTIFACTS.filter((a) => a.project === project.id),
  }), [project])

  useEffect(() => {
    if (msgs.length) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs])

  function send(q: string) {
    if (!q.trim()) return
    setMsgs((ms) => [...ms, { who: "me", text: q }, reply(q, context)])
    setText("")
  }

  const ask = CANVAS_EXTRAS[project.id]?.ask ?? []
  const openArtifact = (a: Artifact) => navigate(`/p/${project.id}/artifacts/${a.id}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6">
          <Briefing project={project} onArtifact={openArtifact} />
          {msgs.map((msg, i) => (
            <div key={i} className={cn("space-y-2", msg.who === "me" && "flex justify-end")}>
              {msg.who === "me" ? (
                <div className="max-w-[80%] rounded-2xl bg-muted px-3.5 py-2 text-sm">{msg.text}</div>
              ) : (
                <AiMessage>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.refs?.map((d) => (
                    <button key={d.id} onClick={() => navigate(`/p/${d.project}/decisions/${d.id}`)} className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs hover:bg-muted">
                      <StatusIcon status={d.status} className="size-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{d.title}</span>
                      <span className="text-muted-foreground">{d.part}</span>
                    </button>
                  ))}
                  {msg.arts && <div className="grid gap-1.5 sm:grid-cols-2">{msg.arts.map((a) => <ArtifactChip key={a.id} artifact={a} onOpen={() => openArtifact(a)} />)}</div>}
                </AiMessage>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-2 px-4 pb-4 sm:px-6">
        {ask.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ask.map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{q}</button>
            ))}
          </div>
        )}
        <form className="rounded-xl border bg-background p-3 shadow-xs focus-within:border-ring/50" onSubmit={(e) => { e.preventDefault(); send(text) }}>
          <textarea
            rows={2}
            aria-label={`Ask about ${project.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder={`Ask anything about ${project.name}…`}
            className="block w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
          <div className="mt-1 flex justify-end">
            <Button type="submit" size="icon" className="size-7 rounded-lg shadow-none" disabled={!text.trim()} aria-label="Send message"><ArrowUp className="size-4" /></Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AiMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background"><Sparkles className="size-3.5" /></div>
      <div className="min-w-0 flex-1 space-y-2 pt-1">{children}</div>
    </div>
  )
}

function Block({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}{count !== undefined && <span className="ml-1.5 tabular-nums">{count}</span>}</h3>
      {children}
    </div>
  )
}

// The catch-up: Whyspace's opening message with the summary, what needs you, what changed
// and who's working.
function Briefing({ project, onArtifact }: { project: Project; onArtifact: (a: Artifact) => void }) {
  const items = needsYou(project.id)
  const changed = changedSince(project.id)
  const leads = projectSections(project.id).filter((s) => !s.parent)
  const parts = [...new Set([...changed.decisions.map((d) => d.part), ...changed.artifacts.map((a) => a.part)])]
  const activity = ACTIVITY.filter((a) => a.project === project.id && a.state === "active")

  return (
    <AiMessage>
      <p className="text-xs font-medium text-muted-foreground">Since you were last here</p>
      <p className="text-sm leading-relaxed">{WEEK_SUMMARY[project.id]}</p>

      <div className="space-y-6 pt-3">
        <Block title="Needs you" count={items.length}>
          {items.length ? (
            <div className="space-y-1.5">{items.map((item) => <NeedsYouCard key={item.id} item={item} project={project} />)}</div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing waits on you.</p>
          )}
        </Block>

        {parts.length > 0 && (
          <Block title="What changed since you were last here">
            <div className="divide-y rounded-lg border">
              {parts.map((part) => {
                const lead = leads.find((s) => s.name === part)?.owner
                const ds = changed.decisions.filter((d) => d.part === part)
                const as = changed.artifacts.filter((a) => a.part === part)
                return (
                  <div key={part} className="space-y-1.5 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{part}</span>
                      {lead && <span className="text-muted-foreground">· {lead}</span>}
                    </div>
                    {ds.map((d) => (
                      <button key={d.id} onClick={() => navigate(`/p/${project.id}/decisions/${d.id}`)} className="flex w-full items-center gap-2 text-left text-sm hover:underline">
                        <StatusIcon status={d.status} className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{d.title}</span>
                      </button>
                    ))}
                    {as.length > 0 && <div className="flex flex-wrap gap-1.5 pt-0.5">{as.map((a) => <ArtifactChip key={a.id} artifact={a} onOpen={() => onArtifact(a)} />)}</div>}
                  </div>
                )
              })}
            </div>
          </Block>
        )}

        {activity.length > 0 && (
          <Block title="Who's working on what">
            <div className="flex flex-wrap gap-1.5">
              {activity.map((a) => (
                <span key={a.who} className="flex min-w-0 items-center gap-1.5 rounded-full border py-0.5 pr-3 pl-0.5 text-xs">
                  <PersonAvatar id={a.who} className="size-5" />
                  <span className="font-medium">{PEOPLE[a.who]?.name.split(" ")[0]}</span>
                  <span className="truncate text-muted-foreground">{a.tool ? `${a.tool} · ` : ""}{a.doing}</span>
                </span>
              ))}
            </div>
          </Block>
        )}
      </div>
    </AiMessage>
  )
}

function NeedsYouCard({ item, project }: { item: NeedsYou; project: Project }) {
  const [done, setDone] = useState(false)
  const row = "flex items-center gap-3 rounded-lg border px-3 py-2"

  if (item.kind === "confirm") {
    const d = item.decision
    return (
      <div className={cn(row, done && "opacity-60")}>
        <StatusIcon status={done ? "conf" : d.status} className="size-4 shrink-0 text-muted-foreground" />
        <button onClick={() => navigate(`/p/${project.id}/decisions/${d.id}`)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm hover:underline">{d.title}</span>
          <span className="block truncate text-xs text-muted-foreground">Confirm the reason · {d.why ?? "No reason recorded"}</span>
        </button>
        <Button size="sm" variant={done ? "ghost" : "default"} disabled={done} onClick={() => { setDone(true); toast("Decision confirmed") }}>
          {done ? <><Check />Confirmed</> : "Confirm"}
        </Button>
      </div>
    )
  }

  if (item.kind === "apply") {
    return (
      <div className={cn(row, done && "opacity-60")}>
        <Copy className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm">{item.alert.summary}</span>
          <span className="block truncate text-xs text-muted-foreground" title={item.prompt}>Prompt · {item.prompt}</span>
        </div>
        <Button size="sm" variant={done ? "ghost" : "default"} onClick={() => {
          try { void navigator.clipboard?.writeText(item.prompt) } catch { /* clipboard blocked: the toast still explains */ }
          setDone(true)
          toast("Prompt copied. Paste it into your AI tool.")
        }}>
          {done ? <><Check />Copied</> : "Apply"}
        </Button>
      </div>
    )
  }

  const t = item.task
  return (
    <div className={row}>
      <TaskStatusIcon status={t.status} />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm">{t.title}</span>
        <span className="block truncate text-xs text-muted-foreground">Task · {t.part} · due {t.due}</span>
      </div>
      <Button size="sm" variant="outline" onClick={() => navigate(`/p/${project.id}/tasks`)}>Open task</Button>
    </div>
  )
}

function ArtifactChip({ artifact: a, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md border bg-background p-1 pr-2.5 text-left transition hover:border-foreground/40">
      <div className="pointer-events-none relative h-full w-12 shrink-0 overflow-hidden rounded-sm bg-muted/60">
        <div className="absolute top-0 left-0 h-[150px] w-[260px] origin-top-left scale-[0.185]">
          <ArtifactPicture artifact={{ ...a, content: undefined }} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium leading-tight">{a.name}</div>
        <div className="truncate text-[11px] leading-tight text-muted-foreground">{a.kind} · {a.updated}</div>
      </div>
    </button>
  )
}
