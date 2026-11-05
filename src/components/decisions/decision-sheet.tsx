import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { AppWindow, BookOpen, Check, CircleDot, FlaskConical, History, Maximize2, MessageSquare, PanelRight, Play, Shapes, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge } from "@/components/app/status-badge"
import { LINKS, ME, PEOPLE, PROJECTS, decisionById, type Decision, type Evidence } from "@/data"
import { askWhyspace } from "@/lib/ask"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useReach, useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { DESIGN } from "@/lib/design"
import { ThreadTag } from "@/design-b/thread-ui"
import { KIND_ICON } from "@/playground/artifact"

// The one detailed view of a decision. Every touch point opens it: Catch up, the Inbox,
// an artifact, the Decisions table, Ask's citations and a workshop summary.
// On the Decisions tab it follows the route (/p/<id>/decisions/<decisionId>) so it can be linked;
// everywhere else it opens over the current page.
export function DecisionSheetHost() {
  const [first, second, third, fourth] = useRoute()
  const { sheet, openDecision } = useStore()
  // Older links (/decisions/<id>, /projects/decisions/<id>) open over All projects.
  const base = first === "p" && third === "decisions" ? `/p/${second}/decisions` : first === "decisions" && second ? "/decisions" : first === "projects" && second === "decisions" ? "/projects/decisions" : null
  const routed = base ? (first === "p" ? fourth : first === "decisions" ? second : third) : undefined
  const decision = decisionById(routed ?? (sheet?.at === window.location.hash ? sheet.id : undefined))
  const [mode, setMode] = useOpenMode()

  const close = () => (routed ? navigate(base === `/p/${second}/decisions` ? base : "/projects") : openDecision(null))
  const leave = (path: string) => { openDecision(null); navigate(path) }
  const body = decision && <DecisionBody key={decision.id} decision={decision} mode={mode} onMode={setMode} onLeave={leave} onClose={close} />

  // Opens like a task: centered window (default), side panel or full page.
  if (mode === "side") {
    return (
      <Sheet open={!!decision} onOpenChange={(open) => !open && close()}>
        <SheetContent resizeKey="decision" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[560px] gap-0 overflow-y-auto sm:max-w-[560px]">{body}</SheetContent>
      </Sheet>
    )
  }
  return (
    <Dialog open={!!decision} onOpenChange={(open) => !open && close()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={cn("gap-0 overflow-y-auto p-0", mode === "full" ? "top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none" : "max-h-[85vh] max-w-2xl sm:max-w-2xl")}>{body}</DialogContent>
    </Dialog>
  )
}

type OpenMode = "center" | "side" | "full"
const OPEN_MODES: [OpenMode, string, typeof PanelRight][] = [["center", "Center peek", AppWindow], ["side", "Side peek", PanelRight], ["full", "Full page", Maximize2]]
function useOpenMode() {
  const [mode, setMode] = useState<OpenMode>(() => {
    try { const m = localStorage.getItem("whyspace-decision-open"); return m === "side" || m === "full" ? m : "center" } catch { return "center" }
  })
  return [mode, (m: OpenMode) => { setMode(m); try { localStorage.setItem("whyspace-decision-open", m) } catch { /* storage blocked: still switches for now */ } }] as const
}

const EVIDENCE_ICON: Record<Evidence["kind"], typeof Play> = { clip: Play, research: BookOpen, test: FlaskConical, chat: MessageSquare, feedback: Users }

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2.5">
      <h3 className="type-label text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

// A small card in a horizontal row: a source behind the why, or an artifact the decision affects.
function Tile({ icon: Icon, label, sub, strong, onClick }: { icon: typeof Play; label: string; sub?: string; strong?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} title={label} className="flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors enabled:hover:bg-accent/50">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        {sub && <span className={cn("block truncate text-xs", strong ? "font-medium text-foreground" : "text-muted-foreground")}>{sub}</span>}
      </span>
    </button>
  )
}

// Cards sit side by side and wrap, so nothing hides off to the side.
const Row = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">{children}</div>

function DecisionBody({ decision: d, mode, onMode, onLeave, onClose }: { decision: Decision; mode: OpenMode; onMode: (m: OpenMode) => void; onLeave: (path: string) => void; onClose: () => void }) {
  const { replies: added, addReply, confirmDecision, clashes, settleClash } = useStore()
  const statusOf = useStatusOf()
  const status = statusOf(d)
  // Design B: the confirmed decision this one clashes with, and how you settled it, if you did.
  const clashWith = DESIGN === "b" && d.status === "flag" ? decisionById(d.clashes) : undefined
  const settled = clashes[d.id]
  const [reason, setReason] = useState("")
  const reach = useReach(d.id)
  const [reply, setReply] = useState("")
  const project = PROJECTS.find((p) => p.id === d.project)
  const replies = [...(d.replies ?? []), ...(added[d.id] ?? [])]
  const who = d.status === "open" ? PEOPLE[d.owner]?.name : d.by ?? PEOPLE[d.owner]?.name
  // History: what this decision replaced, or (Design B) the confirmed decision it follows.
  const replaced = decisionById(d.replaces)
  const precedents = status === "prec" ? LINKS.flatMap(([a, b]) => (b === d.id ? [decisionById(a)] : [])).filter((x): x is Decision => !!x) : []
  const ModeIcon = OPEN_MODES.find(([m]) => m === mode)![2]

  return (
    <div className={cn("relative flex min-w-0 flex-col gap-8 p-8", mode === "full" && "mx-auto w-full max-w-2xl py-16")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("absolute right-11 size-7 text-muted-foreground", mode === "full" ? "top-3 fixed" : "top-2.5")} aria-label="Open as"><ModeIcon /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {OPEN_MODES.map(([m, label, Icon]) => (
            <DropdownMenuItem key={m} onSelect={() => onMode(m)}><Icon />{label}{m === mode && <Check className="ml-auto" />}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <header className="flex flex-col gap-2">
        <SheetDescription className="flex items-center gap-1 text-xs">{project?.name} · {DESIGN === "b" ? <ThreadTag projectId={d.project} part={d.part} link /> : d.part}</SheetDescription>
        <SheetTitle className="type-title">{d.title}</SheetTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={status} />
          <span>{who}{d.when ? ` · ${d.when}` : d.due ? ` · due ${d.due}` : ""}</span>
          {d.status === "inf" && status !== "conf" && d.owner === ME.id && (
            <Button size="sm" className="ml-auto" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}><Check />Confirm</Button>
          )}
        </div>
      </header>

      <Block title="Why">
        <p className="leading-relaxed">{d.why ?? (d.status === "open" ? "Not decided yet." : "No reason yet.")}</p>
        {!!d.evidence?.length && (
          <Row>
            {d.evidence.map((e) => (
              <Tile
                key={e.label}
                icon={e.workshop ? Shapes : EVIDENCE_ICON[e.kind]}
                label={e.label}
                sub={e.detail}
                onClick={e.artifact ? () => onLeave(`/p/${d.project}/artifacts/${e.artifact}`) : e.workshop ? () => onLeave(`/p/${d.project}/sessions/${e.workshop}`) : undefined}
              />
            ))}
          </Row>
        )}
      </Block>

      {clashWith && (
        <Block title="Clashes with">
          <Row>
            <Tile icon={CircleDot} label={clashWith.title} sub={`${clashWith.by ?? PEOPLE[clashWith.owner]?.name}${clashWith.when ? ` · ${clashWith.when}` : ""}`} onClick={() => onLeave(`/p/${clashWith.project}/decisions/${clashWith.id}`)} />
          </Row>
          {clashWith.why && <p className="text-sm leading-relaxed text-muted-foreground">{PEOPLE[clashWith.owner]?.name.split(" ")[0]}: {clashWith.why}</p>}
          {settled?.choice === "theirs" ? (
            <p className="text-sm text-muted-foreground">You took {PEOPLE[clashWith.owner]?.name.split(" ")[0]}’s decision. Yours is withdrawn.</p>
          ) : settled?.choice === "mine" ? (
            <p className="text-sm text-muted-foreground">You kept yours{settled.reason ? `: ${settled.reason}` : ""}. {PEOPLE[clashWith.owner]?.name.split(" ")[0]} sees the clash until one of you changes it.</p>
          ) : d.owner === ME.id && (
            <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); settleClash(d.id, "mine", reason.trim() || undefined); toast("Kept yours") }}>
              <Button type="button" size="sm" onClick={() => { settleClash(d.id, "theirs"); toast(`Took ${PEOPLE[clashWith.owner]?.name.split(" ")[0]}’s decision`) }}>Take {PEOPLE[clashWith.owner]?.name.split(" ")[0]}’s</Button>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why keep yours?" aria-label="Why keep yours" className="h-8 w-56 text-sm" />
              <Button type="submit" size="sm" variant="outline">Keep mine</Button>
            </form>
          )}
        </Block>
      )}

      {(replaced || precedents.length > 0) && (
        <Block title={replaced ? "Replaced" : "Precedent"}>
          <Row>
            {replaced && <Tile icon={History} label={replaced.title} sub={`${replaced.by ?? PEOPLE[replaced.owner]?.name}${replaced.when ? ` · ${replaced.when}` : ""}`} onClick={() => onLeave(`/p/${d.project}/decisions/${replaced.id}`)} />}
            {precedents.map((p) => (
              <Tile key={p.id} icon={CircleDot} label={p.title} sub={`${p.by ?? PEOPLE[p.owner]?.name}${p.when ? ` · ${p.when}` : ""}`} onClick={() => onLeave(`/p/${d.project}/decisions/${p.id}`)} />
            ))}
          </Row>
        </Block>
      )}

      {reach.length > 0 && (
        <Block title="Artifacts">
          <Row>
            {[...reach].sort((a, b) => Number(b.needsUpdate) - Number(a.needsUpdate)).map(({ artifact: a, needsUpdate }) => (
              <Tile key={a.id} icon={KIND_ICON[a.kind]} label={a.name} sub={needsUpdate ? "Needs update" : PEOPLE[a.owner]?.name} strong={needsUpdate} onClick={() => onLeave(`/p/${d.project}/artifacts/${a.id}`)} />
            ))}
          </Row>
        </Block>
      )}

      <Block title={`Replies${replies.length ? ` · ${replies.length}` : ""}`}>
        {replies.map((r, i) => (
          <div key={i} className="flex gap-2.5 text-sm">
            <PersonAvatar id={r.who} className="mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs"><span className="font-medium">{PEOPLE[r.who]?.name}</span> <span className="text-muted-foreground">{r.when}</span></div>
              <p className="leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
        <form className="flex items-center gap-2" onSubmit={(e) => {
          e.preventDefault()
          if (!reply.trim()) return
          addReply(d.id, { who: ME.id, text: reply.trim(), when: "Just now" })
          setReply("")
          toast("Reply sent")
        }}>
          <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="h-8" />
          <Button type="submit" size="sm" variant="outline" disabled={!reply.trim()}>Reply</Button>
          <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { onClose(); askWhyspace(`Why ${d.title.charAt(0).toLowerCase()}${d.title.slice(1)}?`) }}><Sparkles />{DESIGN === "b" ? "Ask Duet" : "Ask AI"}</Button>
        </form>
      </Block>
    </div>
  )
}
