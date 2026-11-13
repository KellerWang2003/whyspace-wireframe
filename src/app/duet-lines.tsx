import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { ME, decisionById, projectName } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { Faces, Item } from "./caught"
import { whenOf } from "./caught-model"
import { SURE_LABEL, SURE_LEVELS, type Sure } from "./duet"
import { first, openReply, useDuetActivity, type Handled } from "./duet-state"
import { SureMark, type SureLook } from "./sure-mark"
import { Illo } from "@/components/brand/illo/pieces"
import { PIGMENT_HEX, useDuetFace } from "./duet-face"
import { askTopicId, conversationOf, topicOf } from "./together"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const shortName = (project: string) => projectName(project).replace(/\s*\(.*\)$/, "")

// Waiting for you, pinned on top of your Duet chats: teammates' questions your Duet couldn't answer.
// Reply opens your conversation with that teammate. Below, what you told people yourself. What your
// Duet answered or decided on its own is on Decided for you.
export function DuetWaiting() {
  const { asked, handled } = useDuetActivity()
  const replied = handled.filter((h) => h.byYou)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 sm:p-8">
      <h1 className="type-title">Waiting for you</h1>
      {asked.length > 0 ? (
        <ul data-rows aria-label="Waiting for you" className="flex flex-col divide-y rounded-lg border">
          {asked.map((l) => {
            const topic = topicOf(askTopicId(l.id))
            const open = () => openReply(conversationOf(l))
            return (
              <Item key={l.id} face={<Faces ids={topic ? [l.who, topic.other] : [l.who]} />}
                text={<><span className="font-medium">{first(l.who)}</span> {l.message ?? `asked ${l.text}`}</>}
                sub={[...(topic ? [`With ${first(topic.other)}`] : []), ...(l.where ? [l.where] : []), whenOf(l), shortName(l.project)]}
                onOpen={open} wrap
                action={<Button size="xs" variant="outline" onClick={open}>Reply</Button>} />
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing is waiting for you.</p>
      )}
      {replied.length > 0 && (
        <section aria-label="Replied" className="flex flex-col gap-1.5">
          <h2 className="px-3 type-label text-muted-foreground">Replied</h2>
          <ul className="flex flex-col">{replied.map((h) => <HandledRow key={h.id} h={h} />)}</ul>
        </section>
      )}
    </div>
  )
}

// Decided for you, pinned under Waiting for you: everything your Duet answered or decided for you,
// latest first, each with how sure it was. The levels on top are the key and a filter.
// `look`: the playground draws the page with each way of showing how sure (sure-mark.tsx).
export function DuetDecided({ look, className }: { look?: SureLook; className?: string }) {
  const { handled } = useDuetActivity()
  const face = useDuetFace(ME.id)
  const [only, setOnly] = useState<Sure | null>(null)
  const decided = handled.filter((h): h is Handled & { sure: Sure } => !h.byYou && !!h.sure)
  const shown = only ? decided.filter((h) => h.sure === only) : decided
  const recent = shown.filter((h) => h.day !== "earlier")
  const earlier = shown.filter((h) => h.day === "earlier")
  const count = (s: Sure | null) => (s ? decided.filter((h) => h.sure === s) : decided).length
  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8", className)}>
      <h1 className="type-title">Decided for you</h1>
      {decided.length > 0 ? (
        <>
          <div role="tablist" aria-label="How sure" className="-my-2 flex flex-wrap items-center gap-1">
            {[null, ...SURE_LEVELS].map((s) => (
              <Button key={s ?? "all"} variant="ghost" size="sm" role="tab" aria-selected={only === s} onClick={() => setOnly(s)}
                className={cn("h-7 gap-1.5 rounded-full px-3 text-[13px]", only === s ? "bg-secondary hover:bg-secondary" : "text-muted-foreground hover:bg-transparent hover:text-foreground")}>
                {s && look !== "words" && <SureMark sure={s} look={look} />}
                {s ? SURE_LABEL[s] : "All"}
                <span className="text-muted-foreground tabular-nums">{count(s)}</span>
              </Button>
            ))}
          </div>
          {recent.length > 0 && <ul data-rows aria-label="Decided for you" className="flex flex-col divide-y rounded-lg border">{recent.map((h) => <DecidedItem key={h.id} h={h} look={look} />)}</ul>}
          {earlier.length > 0 && (
            <Collapsible defaultOpen={!recent.length}>
              <CollapsibleTrigger className="group flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />Earlier<span className="tabular-nums">{earlier.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent><ul data-rows className="mt-1.5 flex flex-col divide-y rounded-lg border">{earlier.map((h) => <DecidedItem key={h.id} h={h} look={look} />)}</ul></CollapsibleContent>
            </Collapsible>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Illo name="meet-duet" duet={PIGMENT_HEX[face.pigment]} className="h-32" />
          <p className="type-body text-muted-foreground">Nothing decided for you yet</p>
        </div>
      )}
    </div>
  )
}

// One thing your Duet did: the teammate it told (or your Duet, for what it took into your own work),
// what it said, and how sure it was. Opens the decision it came from.
function DecidedItem({ h, look }: { h: Handled & { sure: Sure }; look?: SureLook }) {
  const { openDecision } = useStore()
  const d = decisionById(h.decision)
  const face = h.kind === "precedent" ? <PersonAvatar id={ME.id} agent className="size-6" /> : <PersonAvatar id={h.who} className="size-6" />
  return (
    <Item face={face} text={cap(h.text)} wrap
      sub={[...(h.where ? [h.where] : []), whenOf(h), shortName(h.project)]}
      onOpen={d ? () => openDecision(d.id) : undefined}
      action={<SureMark sure={h.sure} look={look} />} />
  )
}

// What your Duet did, or what you told someone yourself. Opens the decision it came from.
function HandledRow({ h, compact }: { h: Handled; compact?: boolean }) {
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  const d = decisionById(h.decision)
  return (
    <li>
      <button type="button" disabled={!d} onClick={() => d && openDecision(d.id)} className={cn("flex w-full gap-2.5 rounded-md py-1.5 text-left text-sm enabled:hover:bg-muted/50", compact ? "items-center px-2" : "items-start px-3")}>
        <PersonAvatar id={ME.id} agent={!h.byYou} className="size-5" />
        <span className={cn("min-w-0 flex-1", compact && "truncate")}>{h.byYou ? `You ${h.text}` : cap(h.text)}</span>
        {d && <StatusIcon status={statusOf(d)} className={cn("size-3 shrink-0 text-muted-foreground", !compact && "mt-1")} />}
        <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", !compact && "leading-5")}>{h.when}</span>
      </button>
    </li>
  )
}

// The archived corner panel's version: a few lines of each, in one project or all. It is always
// compact now (`compact` stays for that caller).
export function DuetSide({ projectId, className }: { projectId?: string; compact?: boolean; className?: string }) {
  const { asked, handled } = useDuetActivity(projectId)
  const shown = handled.slice(0, 3)
  if (!asked.length && !handled.length) return null
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {asked.length > 0 && (
        <section aria-label="Asked" className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-2 px-2 type-label text-muted-foreground">Asked<span className="tabular-nums">{asked.length}</span></h3>
          <ul className="flex flex-col">
            {asked.map((l) => (
              <li key={l.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
                <PersonAvatar id={l.who} className="size-5" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{first(l.who)}</span> {l.message ?? `asked ${l.text}`}
                  {!projectId && <span className="text-muted-foreground"> · {projectName(l.project)}</span>}
                </span>
                <Button size="xs" variant="outline" onClick={() => openReply(conversationOf(l))}>Reply</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {handled.length > 0 && (
        <section aria-label="Handled" className="flex flex-col gap-1.5">
          <h3 className="px-2 type-label text-muted-foreground">Handled</h3>
          <ul className="flex flex-col">{shown.map((h) => <HandledRow key={h.id} h={h} compact />)}</ul>
          {handled.length > shown.length && <button type="button" onClick={() => navigate("/duet/decided")} className="px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground">All {handled.length}</button>}
        </section>
      )}
    </div>
  )
}
