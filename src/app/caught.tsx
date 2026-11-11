import { useState, type ReactNode } from "react"
import { ChevronDown, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon, StatusIcon } from "@/components/app/status-badge"
import { ME, WEEK_SUMMARY, decisionById, projectName, type Project } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { isEmpty, sinceLabel, useCaught, whenOf, type Caught } from "./caught-model"
import { first, newChat, openReply, pushMsgs } from "./duet-state"
import { SureMark } from "./sure-mark"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const shortName = (project: string) => projectName(project).replace(/\s*\(.*\)$/, "")

// Home's card, While you were away: the week in a line, then the list. Open in Duet puts the same
// list in a new Duet chat.
export function CaughtForYou({ project }: { project: Project }) {
  const openInDuet = () => {
    newChat()
    pushMsgs({ who: "ai", text: "Here’s what happened while you were away.", caught: { project: project.id } })
    navigate("/duet")
  }
  return (
    <section aria-labelledby="while-away" className="flex flex-col gap-4 rounded-xl bg-muted p-4">
      <div className="flex min-h-8 items-center gap-2">
        <h2 id="while-away" className="flex items-center gap-2 type-section"><PersonAvatar id={ME.id} agent className="size-6" />While you were away</h2>
        <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={openInDuet}><MessageCircle />Open in Duet</Button>
      </div>
      {WEEK_SUMMARY[project.id] && <p className="leading-relaxed">{WEEK_SUMMARY[project.id]}</p>}
      <AtAGlance projectId={project.id} />
    </section>
  )
}

// At a glance (Keller picked the digest, Nov 11): one plain line per group, each opening into its list.
// The whole list is in your Duet chat (Open in Duet).
type Kind = "clashes" | "waiting" | "answered" | "confirmed"
const KINDS: Kind[] = ["clashes", "waiting", "answered", "confirmed"]
const countOf = (c: Caught, k: Kind) => c[k].length
const facesOf = (c: Caught, k: Kind): string[] => [...new Set(
  k === "clashes" ? c.clashes.map((t) => t.other)
  : k === "waiting" ? c.waiting.map((w) => w.line.who)
  : k === "answered" ? c.answered.map((h) => h.who)
  : c.confirmed.map((d) => d.owner),
)]
const names = (ids: string[]) => {
  const all = ids.map(first)
  if (all.length <= 2) return all.join(" and ")
  return `${all.slice(0, 2).join(", ")} and ${all.length - 2} more`
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
// One plain sentence per group, for the digest.
function sentenceOf(c: Caught, k: Kind): string {
  const n = countOf(c, k)
  const who = names(facesOf(c, k))
  if (k === "clashes") return n === 1 ? `Your “${c.clashes[0].clash?.title}” clashes with ${first(c.clashes[0].other)}’s decision.` : `${n} of your decisions clash with ${who}’s.`
  if (k === "waiting") return `${who} ${facesOf(c, k).length > 1 ? "are" : "is"} waiting on you.`
  if (k === "answered") return `Your Duet answered ${plural(n, "question")} from ${who}.`
  return `${who} confirmed ${plural(n, "decision")}, like “${c.confirmed[0].title}”.`
}

function Stack({ ids, size = "size-6" }: { ids: string[]; size?: string }) {
  return (
    <span className="flex shrink-0 items-center">
      {ids.slice(0, 3).map((id, i) => <PersonAvatar key={id} id={id} className={cn(size, "ring-2 ring-muted", i > 0 && "-ml-2")} />)}
    </span>
  )
}

function AtAGlance({ projectId }: { projectId: string }) {
  const c = useCaught(projectId)
  const [open, setOpen] = useState<Kind | null>(null)
  const toggle = (k: Kind) => setOpen(open === k ? null : k)
  if (isEmpty(c)) return <p className="text-sm text-muted-foreground">Nothing new since {sinceLabel}.</p>
  const kinds = KINDS.filter((k) => countOf(c, k) > 0)
  const list = open && <CaughtList projectId={projectId} only={open} />

  return (
    <ul className="flex flex-col">
      {kinds.map((k) => (
        <li key={k}>
          <button type="button" onClick={() => toggle(k)} aria-expanded={open === k} className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-background/60">
            <span className="flex w-11 shrink-0 items-center">{k === "clashes" ? <span className="flex size-6 items-center justify-center"><MarkIcon mark="triangle" className="size-3.5" /></span> : k === "answered" ? <PersonAvatar id={ME.id} agent className="size-6" /> : <Stack ids={facesOf(c, k)} />}</span>
            <span className="min-w-0 flex-1 text-[15px]">{sentenceOf(c, k)}</span>
            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100", open === k && "rotate-180 opacity-100")} />
          </button>
          {open === k && <div className="pt-1 pb-3">{list}</div>}
        </li>
      ))}
    </ul>
  )
}

// Clashes, questions waiting for you, what your Duet answered for you, and what teammates confirmed.
// `compact`: inside a Duet message, where rows carry a border of their own.
// `only`: one group, without its title (the digest opens one group at a time).
export function CaughtList({ projectId, compact, only }: { projectId?: string; compact?: boolean; only?: Kind }) {
  const c = useCaught(projectId)
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  const where = (project: string) => (projectId ? [] : [shortName(project)])
  if (isEmpty(c)) return <p className="text-sm text-muted-foreground">Nothing new since {sinceLabel}.</p>
  return (
    <div className={cn("flex flex-col", only ? "gap-2" : "gap-4")}>
      {c.clashes.length > 0 && (!only || only === "clashes") && (
        <Group title="Clashes" count={c.clashes.length} compact={compact} bare={!!only}>
          {c.clashes.map((t) => {
            const theirs = t.decisions.find((d) => d.owner === t.other)
            return (
              <Item key={t.id} face={<span className="flex size-6 items-center justify-center"><MarkIcon mark="triangle" className="size-3.5" /></span>}
                text={<>Your “{t.clash?.title}” clashes with {first(t.other)}’s decision</>}
                sub={[`${first(t.other)} confirmed “${theirs?.title}”`, ...where(t.project)]}
                onOpen={() => openReply(t.id)}
                action={<Button size="xs" variant="outline" onClick={() => openReply(t.id)}>Talk it over</Button>} />
            )
          })}
        </Group>
      )}
      {c.waiting.length > 0 && (!only || only === "waiting") && (
        <Group title="Waiting for you" count={c.waiting.length} compact={compact} bare={!!only}>
          {c.waiting.map(({ line: l, topic }) => (
            <Item key={l.id} face={<Faces ids={topic ? [l.who, topic.other] : [l.who]} />}
              text={<><span className="font-medium">{first(l.who)}</span> {l.message ?? `asked ${l.text}`}</>}
              sub={[...(topic ? [`With ${first(topic.other)}`] : []), ...(l.where ? [l.where] : []), whenOf(l), ...where(l.project)]}
              onOpen={() => openReply(topic?.id ?? l.id)}
              action={<Button size="xs" variant="outline" onClick={() => openReply(topic?.id ?? l.id)}>Reply</Button>} />
          ))}
        </Group>
      )}
      {c.answered.length > 0 && (!only || only === "answered") && (
        <Group title="Answered for you" count={c.answered.length} compact={compact} bare={!!only}>
          {c.answered.map((h) => {
            const d = decisionById(h.decision)
            return (
              <Item key={h.id} face={<PersonAvatar id={ME.id} agent className="size-6" />}
                text={cap(h.text)} action={h.sure && <SureMark sure={h.sure} />}
                sub={[...(h.where ? [h.where] : []), whenOf(h), ...where(h.project)]}
                onOpen={d ? () => openDecision(d.id) : undefined} />
            )
          })}
        </Group>
      )}
      {c.confirmed.length > 0 && (!only || only === "confirmed") && (
        <Group title="Confirmed" count={c.confirmed.length} compact={compact} bare={!!only}>
          {c.confirmed.map((d) => (
            <Item key={d.id} face={<PersonAvatar id={d.owner} className="size-6" />}
              text={d.title} mark={<StatusIcon status={statusOf(d)} className="size-3 shrink-0 text-muted-foreground" />}
              sub={[d.by ?? first(d.owner), ...(d.tool ? [d.tool] : []), whenOf(d), ...where(d.project)]}
              onOpen={() => openDecision(d.id)} />
          ))}
        </Group>
      )}
    </div>
  )
}

function Group({ title, count, compact, bare, children }: { title: string; count: number; compact?: boolean; bare?: boolean; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      {!bare && <h3 className="flex items-center gap-1.5 type-label text-muted-foreground">{title}<span className="tabular-nums">{count}</span></h3>}
      <ul data-rows className={cn("flex flex-col divide-y rounded-lg bg-background", compact && "border")}>{children}</ul>
    </section>
  )
}

// One row: also Waiting for you in the Duet tab (duet-lines.tsx), where `wrap` shows the whole question.
export function Item({ face, text, mark, sub, action, onOpen, wrap }: { face: ReactNode; text: ReactNode; mark?: ReactNode; sub: string[]; action?: ReactNode; onOpen?: () => void; wrap?: boolean }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      {face}
      <button type="button" onClick={onOpen} disabled={!onOpen} className="group/item min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-sm">
          <span className={cn("min-w-0 group-enabled/item:group-hover/item:underline", !wrap && "truncate")}>{text}</span>
          {mark}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{sub.join(" · ")}</span>
      </button>
      {action}
    </li>
  )
}

// The teammate who asked, with the other owner tucked behind when the Duet brought them in.
export function Faces({ ids }: { ids: string[] }) {
  if (ids.length === 1) return <PersonAvatar id={ids[0]} className="size-6" />
  return (
    <span className="relative size-6 shrink-0">
      <PersonAvatar id={ids[0]} className="size-5 ring-2 ring-background" />
      <PersonAvatar id={ids[1]} className="absolute -right-1 -bottom-1 size-4 text-[8px] ring-2 ring-background" />
    </span>
  )
}
