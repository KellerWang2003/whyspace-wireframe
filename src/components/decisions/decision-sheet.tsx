import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowRight, BookOpen, Check, FlaskConical, Map as MapIcon, MessageSquare, Play, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { SectionWorkspace } from "@/components/decisions/section-workspace"
import { projectSections } from "@/components/decisions/section-data"
import { DECISIONS, LINKS, ME, PEOPLE, PROJECTS, decisionById, type Decision, type Evidence } from "@/data"
import { askWhyspace } from "@/lib/ask"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useReach, useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { KIND_ICON } from "@/playground/artifact"

// The one detailed view of a decision. Every touch point opens it: Catch up, the Inbox,
// an artifact, the Decisions table, Ask's citations and a meeting summary.
// On the Decisions tab it follows the route (/p/<id>/decisions/<decisionId>) so it can be linked;
// everywhere else it opens over the current page.
export function DecisionSheetHost() {
  const [first, second, third, fourth] = useRoute()
  const { sheet, openDecision } = useStore()
  const [pathFor, setPathFor] = useState<Decision | null>(null)
  // Older links (/decisions/<id>, /projects/decisions/<id>) open over All projects.
  const base = first === "p" && third === "decisions" ? `/p/${second}/decisions` : first === "decisions" && second ? "/decisions" : first === "projects" && second === "decisions" ? "/projects/decisions" : null
  const routed = base ? (first === "p" ? fourth : first === "decisions" ? second : third) : undefined
  const decision = decisionById(routed ?? (sheet?.at === window.location.hash ? sheet.id : undefined))

  // Moving to another decision keeps the same mode: the route on the Decisions tab, the sheet elsewhere.
  const go = (id: string) => (routed ? navigate(`${base}/${id}`) : openDecision(id))
  const close = () => (routed ? navigate(base === `/p/${second}/decisions` ? base : "/projects") : openDecision(null))
  const leave = (path: string) => { openDecision(null); navigate(path) }

  return (
    <>
      {/* The full path swaps in for the sheet; closing it brings the sheet back. */}
      <Sheet open={!!decision && !pathFor} onOpenChange={(open) => !open && close()}>
        <SheetContent className="w-[560px] gap-0 overflow-y-auto sm:max-w-[560px]">
          {decision && <DecisionBody key={decision.id} decision={decision} onDecision={go} onLeave={leave} onPath={() => setPathFor(decision)} />}
        </SheetContent>
      </Sheet>
      <Dialog open={!!pathFor} onOpenChange={(open) => !open && setPathFor(null)}>
        <DialogContent className="flex h-[88vh] w-[94vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          {pathFor && (
            <>
              <div className="border-b px-5 py-3 pr-12">
                <DialogTitle className="text-sm">Full path · {pathFor.title}</DialogTitle>
                <DialogDescription className="text-xs">Every section and the decisions that connect them. The traced decision is highlighted.</DialogDescription>
              </div>
              <div className="relative flex min-h-0 flex-1">
                <SectionWorkspace
                  project={PROJECTS.find((p) => p.id === pathFor.project) ?? PROJECTS[0]}
                  initialSections={projectSections(pathFor.project)}
                  traceDecision={pathFor.id}
                  onDecisionChange={(id) => { if (id) { setPathFor(null); go(id) } }}
                  onArtifact={(id) => { setPathFor(null); leave(`/p/${pathFor.project}/artifacts/${id}`) }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-2.5 border-t px-5 py-5">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

const EVIDENCE_ICON: Record<Evidence["kind"], typeof Play> = { clip: Play, research: BookOpen, test: FlaskConical, chat: MessageSquare, feedback: Users }

// Up to two steps back along "builds on" links.
function ledFrom(id: string) {
  const back = (to: string) => LINKS.filter(([, t]) => t === to).map(([from]) => from)
  const one = back(id)
  const two = one.flatMap(back)
  return [...two, ...one].map((x) => DECISIONS.find((d) => d.id === x)).filter((d): d is Decision => !!d)
}

function DecisionBody({ decision: d, onDecision, onLeave, onPath }: { decision: Decision; onDecision: (id: string) => void; onLeave: (path: string) => void; onPath: () => void }) {
  const { replies: added, addReply, confirmDecision } = useStore()
  const statusOf = useStatusOf()
  const status = statusOf(d)
  const reach = useReach(d.id)
  const [reply, setReply] = useState("")
  const project = PROJECTS.find((p) => p.id === d.project)
  const replaced = decisionById(d.replaces)
  const chain = ledFrom(d.id)
  const replies = [...(d.replies ?? []), ...(added[d.id] ?? [])]
  const seen = [...new Set(reach.flatMap((r) => r.seen))]
  const notSeen = (project?.members ?? []).filter((m) => !seen.includes(m))
  const decider = d.by ?? PEOPLE[d.owner]?.name
  const source = d.status === "inf" ? `Inferred by ${d.tool ?? "AI"}${d.by ? ` from ${d.by}'s work` : ""}` : d.status === "open" ? `Open question · ${PEOPLE[d.owner]?.name}` : `Stated by ${decider}${d.tool ? ` · ${d.tool}` : ""}`

  return (
    <>
      <SheetHeader className="gap-3 p-5">
        <SheetDescription className="text-xs">{project?.name} · {d.part}</SheetDescription>
        <SheetTitle className="text-lg leading-snug">{d.title}</SheetTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={status} />
          <Badge variant="outline" className="font-normal">{d.status === "inf" ? "Inferred" : d.status === "open" ? "Not decided" : "Stated"}</Badge>
          <span className="text-xs text-muted-foreground">{source}{d.when ? ` · ${d.when}` : d.due ? ` · due ${d.due}` : ""}</span>
        </div>
        {d.status === "inf" && status === "inf" && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
            <span className="flex-1">Nobody has confirmed this yet. {d.owner === ME.id ? "It's yours to confirm." : `${PEOPLE[d.owner]?.name} confirms it.`}</span>
            {d.owner === ME.id && <Button size="sm" onClick={() => { confirmDecision(d.id); toast("Decision confirmed", { description: "Everyone it reaches will see it as confirmed." }) }}><Check />Confirm</Button>}
          </div>
        )}
      </SheetHeader>

      <Section title="Why">
        <p className="text-sm leading-relaxed">{d.why ?? (d.status === "open" ? "Still open. Nobody has decided yet." : "No reason recorded yet.")}</p>
        {d.evidence?.map((e) => {
          const Icon = EVIDENCE_ICON[e.kind]
          return (
            <div key={e.label} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background"><Icon className="size-3.5" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{e.label}</div>
                {e.detail && <p className="text-xs leading-relaxed text-muted-foreground">{e.detail}</p>}
              </div>
              {e.artifact && <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onLeave(`/p/${d.project}/artifacts/${e.artifact}`)}>{e.kind === "clip" ? "Play" : "Open"}</Button>}
            </div>
          )
        })}
      </Section>

      {reach.length > 0 && (
        <Section title="Reach">
          <ul className="divide-y rounded-lg border">
            {reach.map(({ artifact: a, task, needsUpdate }) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <button className="min-w-0 flex-1 text-left" onClick={() => onLeave(`/p/${d.project}/artifacts/${a.id}`)}>
                    <span className="block truncate text-sm hover:underline">{a.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{PEOPLE[a.owner]?.name}{task && needsUpdate ? ` · task due ${task.due}` : ""}</span>
                  </button>
                  {needsUpdate ? <Badge variant="outline" className="font-normal">Needs update</Badge> : <Badge variant="secondary" className="gap-1 font-normal"><Check />Updated</Badge>}
                </li>
              )
            })}
          </ul>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex -space-x-1.5 *:ring-2 *:ring-background">{seen.map((p) => <PersonAvatar key={p} id={p} className="size-5" />)}</span>
            Seen by {seen.map((p) => PEOPLE[p]?.name.split(" ")[0]).join(", ")}{notSeen.length > 0 && ` · not yet ${notSeen.map((p) => PEOPLE[p]?.name.split(" ")[0]).join(", ")}`}
          </p>
        </Section>
      )}

      <Section title="Led here from" aside={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onPath}><MapIcon />Show full path</Button>}>
        {chain.length ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {chain.map((c) => (
              <span key={c.id} className="contents">
                <button onClick={() => onDecision(c.id)} className="flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs hover:bg-muted">
                  <StatusIcon status={statusOf(c)} className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{c.title}</span>
                </button>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              </span>
            ))}
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">This decision</span>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nothing led here. This decision starts its own path.</p>}
      </Section>

      {d.visual && (
        <Section title="Before and after">
          <div className="grid grid-cols-2 gap-3">
            <VisualPlate label="Before" text={d.visual.before} />
            <VisualPlate label="After" text={d.visual.after} after />
          </div>
        </Section>
      )}

      {(replaced || d.was) && (
        <Section title="What it replaced">
          <button disabled={!replaced} onClick={() => replaced && onDecision(replaced.id)} className="w-full rounded-lg border p-3 text-left enabled:hover:bg-muted">
            <span className="block text-sm text-muted-foreground line-through">{replaced?.title ?? d.was}</span>
            {replaced && <span className="mt-1 block text-xs text-muted-foreground">{replaced.by} · {replaced.when} · {replaced.why}</span>}
          </button>
        </Section>
      )}

      {d.options && d.options.length > 0 && (
        <Section title="Options not picked">
          <ul className="space-y-1.5">
            {d.options.map((o) => (
              <li key={o.title} className="flex gap-3 text-sm">
                <span className="mt-2 size-1.5 shrink-0 rounded-full border border-muted-foreground" />
                <span><span className="font-medium">{o.title}</span> <span className="text-muted-foreground">· {o.why}</span></span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`Replies${replies.length ? ` · ${replies.length}` : ""}`}>
        {replies.map((r, i) => (
          <div key={i} className="flex gap-2.5 text-sm">
            <PersonAvatar id={r.who} className="mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs"><span className="font-medium">{PEOPLE[r.who]?.name}</span> <span className="text-muted-foreground">{r.when}</span></div>
              <p className="leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
        <form className="space-y-2" onSubmit={(e) => {
          e.preventDefault()
          if (!reply.trim()) return
          addReply(d.id, { who: ME.id, text: reply.trim(), when: "Just now" })
          setReply("")
          toast(`${PEOPLE[d.owner]?.name.split(" ")[0]} will see your reply`)
        }}>
          <Textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={d.owner === ME.id ? "Add context…" : `Push back or add context for ${PEOPLE[d.owner]?.name.split(" ")[0]}…`} />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" variant="outline" disabled={!reply.trim()}>Reply</Button>
            <Button type="button" size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => askWhyspace(`Why ${d.title.charAt(0).toLowerCase()}${d.title.slice(1)}?`)}><Sparkles />Ask about this</Button>
          </div>
        </form>
      </Section>
    </>
  )
}

// A grayscale stand-in for a visual change. Color names become labelled swatches;
// anything else gets a small swipe card, with the dot once it moves.
function VisualPlate({ label, text, after }: { label: string; text: string; after?: boolean }) {
  const colors = text.match(/red|blue|yellow/gi)
  return (
    <div className={cn("space-y-2 rounded-lg border p-3", after && "border-foreground/40")}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex h-20 items-center justify-center gap-2 rounded-md bg-muted/50">
        {colors ? colors.map((c) => (
          <div key={c} className="flex flex-col items-center gap-1">
            <span className={cn("size-8 rounded-full border", { red: "bg-neutral-500", blue: "bg-neutral-700", yellow: "bg-neutral-200" }[c.toLowerCase()])} />
            <span className="text-[10px] text-muted-foreground capitalize">{c}</span>
          </div>
        )) : (
          <div className="relative h-14 w-10 rounded-md border-2 border-foreground/40 bg-background">
            <div className="mx-auto mt-1.5 h-5 w-6 rounded-sm bg-muted" />
            {after && <span className="absolute bottom-2 left-1/2 size-2.5 -translate-x-1/2 animate-pulse rounded-full bg-foreground motion-reduce:animate-none" />}
          </div>
        )}
      </div>
      <div className="text-xs font-medium">{text}</div>
    </div>
  )
}
