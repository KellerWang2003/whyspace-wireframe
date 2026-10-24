import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Sparkles, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ProjectMark } from "@/components/app/project-mark"
import { StatusIcon } from "@/components/app/status-badge"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"

// What Whyspace looks like OUTSIDE the app: a small always-on-top overlay over whatever
// you're working in. It sits shrunk in the corner and opens on hover. The top says where
// new decisions go (project and part); below, what you said apart from what the AI
// inferred, and a why prompt with suggested reasons when one is missing. Prototype only.

type Caught = {
  id: string
  title: string
  inferred?: boolean
  why?: string
  ask?: { q: string; options: string[] }
}

const PARTS: Record<string, string[]> = {
  plantpal: ["Research", "Design", "Engineering", "Marketing"],
  studio: ["Interviews", "Concept", "Prototype", "Final crit"],
}

// Arrive one by one so the overlay feels live.
const INCOMING: Caught[] = [
  { id: "c1", title: "Empty state shows one sample plant", why: "Shows new users what a reminder looks like" },
  {
    id: "c2",
    title: "Add plant button is full width at the bottom",
    inferred: true,
    ask: { q: "Why full width at the bottom?", options: ["Easy to reach with a thumb", "It's the only action on the screen", "Matches the iOS pattern"] },
  },
  {
    id: "c3",
    title: "Sample tag is 13pt gray, top right of the card",
    ask: { q: "Why keep the Sample tag small and gray?", options: ["So nobody thinks it's their plant", "Keep focus on the Add button", "Match iOS secondary text"] },
  },
  { id: "c4", title: "Sample plant is a Monstera, due in 2 days", inferred: true },
]

export function DesktopMode() {
  const [caught, setCaught] = useState<Caught[]>(INCOMING.slice(0, 2).reverse())
  const [hover, setHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [where, setWhere] = useState({ project: "plantpal", part: "Design" })
  const open = hover || menuOpen
  const boxRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const projectName = PROJECTS.find((p) => p.id === where.project)?.name

  const said = caught.filter((d) => !d.inferred)
  const inferred = caught.filter((d) => d.inferred)
  const asking = caught.find((d) => d.ask && !d.why)

  useEffect(() => {
    const timers = INCOMING.slice(2).map((d, i) => window.setTimeout(() => setCaught((c) => [d, ...c]), 4000 * (i + 1)))
    return () => timers.forEach(window.clearTimeout)
  }, [])

  // Open right away, close after a beat so brushing past the edge doesn't flicker.
  function enter() {
    window.clearTimeout(closeTimer.current)
    setHover(true)
  }
  function leave() {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setHover(false), 250)
  }

  const update = (id: string, patch: Partial<Caught> | null) =>
    setCaught((c) => (patch ? c.map((x) => (x.id === id ? { ...x, ...patch } : x)) : c.filter((x) => x.id !== id)))

  return (
    <div className="fixed inset-0 z-40 bg-muted/50">
      <div
        ref={boxRef}
        onMouseEnter={enter}
        onMouseLeave={leave}
        className={cn(
          "fixed top-4 right-4 overflow-hidden border bg-background shadow-xl",
          "transition-[width,border-radius] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "w-[340px] rounded-xl" : "w-[176px] rounded-[20px]",
        )}
      >
        {/* Header: the same row in both states, so nothing jumps. */}
        <DropdownMenu
          modal={false}
          open={menuOpen}
          onOpenChange={(o) => {
            setMenuOpen(o)
            // The menu is portaled, so leaving it never fires mouseleave on the box.
            if (!o) window.setTimeout(() => setHover(!!boxRef.current?.matches(":hover")), 0)
          }}
        >
          <DropdownMenuTrigger
            disabled={!open}
            className="flex h-10 w-full items-center gap-2 px-2 text-left text-sm outline-none enabled:hover:bg-muted/50"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">Y</span>
            <span
              className={cn(
                "flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300",
                open ? "max-w-40 opacity-100" : "-ml-2 max-w-0 opacity-0",
              )}
            >
              <ProjectMark project={where.project} className="size-4 shrink-0" />
              <span className="truncate font-medium">{projectName}</span>
              <span className="text-muted-foreground">/</span>
            </span>
            <span className={cn("truncate", !open && "text-muted-foreground")}>{where.part}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 pr-1">
              {asking && !open && <span className="size-1.5 rounded-full bg-foreground" aria-label="A why is missing" />}
              <span className="font-medium tabular-nums">{caught.length}</span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-[width,opacity] duration-300", open ? "w-4 opacity-100" : "w-0 opacity-0")} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {Object.entries(PARTS).map(([project, parts], i) => (
              <div key={project}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ProjectMark project={project} className="size-4" />
                  {PROJECTS.find((p) => p.id === project)?.name}
                </DropdownMenuLabel>
                {parts.map((part) => (
                  <DropdownMenuItem key={part} onSelect={() => setWhere({ project, part })}>
                    {part}
                    {where.project === project && where.part === part && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Body: grows from 0 height with grid rows, which animates smoothly. */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="max-h-[70svh] w-[340px] overflow-y-auto border-t">
              {asking && <WhyPrompt key={asking.id} d={asking} onAnswer={(why) => update(asking.id, { why })} onSkip={() => update(asking.id, { ask: undefined })} />}

              <Section icon={User} label="You said" count={said.length}>
                {said.map((d) => (
                  <Row key={d.id} d={d} onRemove={() => update(d.id, null)} />
                ))}
              </Section>

              <Section icon={Sparkles} label="Inferred by AI" count={inferred.length} note="Confirm to keep">
                {inferred.map((d) => (
                  <Row key={d.id} d={d} onRemove={() => update(d.id, null)} onConfirm={() => update(d.id, { inferred: false })} />
                ))}
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, label, count, note, children }: { icon: typeof User; label: string; count: number; note?: string; children: React.ReactNode }) {
  if (!count) return null
  return (
    <div className="p-1 not-first:border-t">
      <p className="flex items-center gap-1.5 px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
        <span className="tabular-nums">{count}</span>
        {note && <span className="ml-auto font-normal">{note}</span>}
      </p>
      <ul>{children}</ul>
    </div>
  )
}

function Row({ d, onRemove, onConfirm }: { d: Caught; onRemove: () => void; onConfirm?: () => void }) {
  return (
    <li className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
      <StatusIcon status={d.inferred ? "inf" : "conf"} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="leading-snug">{d.title}</p>
        {d.why && <p className="mt-0.5 text-xs text-muted-foreground">Why: {d.why}</p>}
      </div>
      {onConfirm && (
        <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onConfirm}>
          Confirm
        </Button>
      )}
      <button aria-label="Remove" className="mt-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground" onClick={onRemove}>
        <X className="size-4" />
      </button>
    </li>
  )
}

function WhyPrompt({ d, onAnswer, onSkip }: { d: Caught; onAnswer: (why: string) => void; onSkip: () => void }) {
  const [other, setOther] = useState(false)
  const [text, setText] = useState("")
  return (
    <div className="m-2 rounded-lg bg-muted p-3">
      <p className="text-sm font-medium">{d.ask!.q}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.ask!.options.map((o) => (
          <Button key={o} size="sm" variant="outline" className="h-7 bg-background px-2 text-xs font-normal" onClick={() => onAnswer(o)}>
            {o}
          </Button>
        ))}
        {!other && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-normal" onClick={() => setOther(true)}>
            Something else
          </Button>
        )}
      </div>
      {other && (
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) onAnswer(text.trim())
          }}
        >
          <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="In a few words" className="h-7 bg-background text-xs" />
          <Button size="sm" className="h-7 px-2 text-xs" type="submit">Save</Button>
        </form>
      )}
      <button className="mt-2 text-xs text-muted-foreground hover:text-foreground" onClick={onSkip}>
        Skip
      </button>
    </div>
  )
}
