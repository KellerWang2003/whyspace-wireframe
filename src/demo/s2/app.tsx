import { useState } from "react"
import { Boxes, Check, Clapperboard, Copy, FileText, Film, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import type { Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"
import { ComingUp, HandledList, Lane, NeedsRow, Page, Prop, Rail, Recap, TaskDialog, Thread, Tile, Where, YMark, type HandledLine, type Upcoming } from "../kit/app"
import { useCopy } from "../kit/hooks"
import { guesses, markOf, settled } from "../kit/model"
import { CheckList } from "../kit/pill"
import { ARTIFACTS, BRAND, DECK_PAGES, PLAN, PROJECTS, PROMPT, TASK, TODAY_LABEL, VIEWER, planCount, type Action, type ArtifactRow, type State } from "./model"

// The Whyspace app for scenario 2: Keller's Wednesday Today, the project's Artifacts with Trevor's
// brand guidelines (the deck itself and its card), and the task that starts him in Runway.

const UPCOMING: Upcoming = [
  ["Thu, Oct 29", [["14:00", "App store screenshots", "whiskr"]]],
  ["Fri, Oct 30", [["10:00", "Poster and video review", "whiskr"], ["13:00", "Final crit", "studio"]]],
]

export function DemoApp2({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const open = guesses(s.caught)
  const review = s.shared && s.checkClosed && open.length > 0
  const rows = [
    ...(review ? [
      <NeedsRow key="review" face={<PersonAvatar id="MC" className="size-8" />} lead="Review" mark={<MarkIcon mark="empty" className="size-3.5 shrink-0" />} title="Promo video"
        sub={<>{open.length} {open.length === 1 ? "guess is" : "guesses are"} still in it<Where thread="Marketing" /></>} onOpen={() => dispatch({ type: "review", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "review", open: true })}>Review</Button>} />,
    ] : []),
    ...(!s.taskDone ? [
      <NeedsRow key="do" face={<PersonAvatar id="MC" className="size-8" />} lead="Do" title={TASK.title}
        sub={<>Due Friday<Where thread="Marketing" /></>} onOpen={() => dispatch({ type: "task", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "taskDone" })}><Check />Done</Button>} />,
    ] : []),
  ]
  const n = settled(s.caught).length
  const m = s.caught.length
  const nav = (key: string) => {
    if (key === "today") dispatch({ type: "page", to: "today" })
    if (key === "whiskr") dispatch({ type: "page", to: "artifacts" })
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <Rail viewer={VIEWER} projects={PROJECTS} active={s.page === "today" ? "today" : "whiskr"} badge={rows.length} onNav={nav} />
      {s.page === "today" ? (
        <Page title="Today" label={TODAY_LABEL} aside={<ComingUp days={UPCOMING} />}>
          <Lane title="Needs you" count={rows.length}>
            {rows.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nothing waits on you.</p> : <ul className="flex flex-col gap-2">{rows}</ul>}
          </Lane>
          <Lane title="Across your projects">
            <ul className="flex flex-col gap-1">
              <Recap project="whiskr" name="Whiskr" onOpen={() => dispatch({ type: "page", to: "artifacts" })} summary={s.shared ? `You shared the promo video. ${n} of ${m} confirmed.` : "Trevor changed the brand guidelines on Monday. Your plan is confirmed; the video is next."} />
              <Recap project="studio" name="AI Studio · Recall" summary="Jordan linked the first question evaluation." />
              <Recap project="holiday" name="Holiday campaign" summary="Nothing new this week." />
            </ul>
          </Lane>
          <Lane title="Handled"><HandledList lines={handled(s)} /></Lane>
        </Page>
      ) : (
        <Artifacts s={s} dispatch={dispatch} />
      )}

      <TaskDialog
        open={s.taskOpen}
        onOpenChange={(o) => dispatch({ type: "task", open: o })}
        title={TASK.title}
        description={TASK.description}
        tool="Runway"
        prompt={PROMPT}
        onOpenTool={() => dispatch({ type: "surface", to: "desk" })}
        tiles={<>
          <Tile icon={<Layers className="size-4 shrink-0 text-muted-foreground" />} label="Brand guidelines v3" kind="Figma · Trevor · Monday" onClick={() => dispatch({ type: "deck", open: true })} marks={<Marks marks={["filled", "filled", "filled"]} />} />
          <Tile icon={<FileText className="size-4 shrink-0 text-muted-foreground" />} label="Promo video plan" kind={`Artifact · you · ${planCount()}`} marks={<Marks marks={PLAN.map((p) => p.mark)} />} />
          <Tile icon={<Film className="size-4 shrink-0 text-muted-foreground" />} label="Cat test videos" kind="Artifact · Luna, Mochi, Biscuit" />
          <Tile icon={<span className="ml-1 size-2 shrink-0 rounded-full bg-foreground" aria-hidden />} label="Marketing" kind="Get cat owners to download Whiskr at launch." />
        </>}
        props={<>
          <Prop label="Status">{s.taskDone ? "Done" : "To do"}</Prop>
          <Prop label="Assignee"><span className="flex items-center gap-2"><PersonAvatar id="MC" className="size-5" />Keller</span></Prop>
          <Prop label="Due">Friday</Prop>
          <Prop label="Thread"><Thread name="Marketing" /></Prop>
        </>}
      />

      <DeckDialog open={s.deckOpen} onOpenChange={(o) => dispatch({ type: "deck", open: o })} />

      <Dialog open={s.reviewOpen} onOpenChange={(o) => dispatch({ type: "review", open: o })}>
        <DialogContent className="gap-0 p-0 sm:max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="border-b px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-sm"><YMark />Promo video</DialogTitle>
            <DialogDescription className="sr-only">The guesses still in the cut.</DialogDescription>
          </div>
          <CheckList caught={s.caught} ids={s.checkIds} onConfirm={(id, why) => dispatch({ type: "confirm", id, why })} onDone={() => dispatch({ type: "checkDone" })} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function handled(s: State): HandledLine[] {
  const now: HandledLine[] = []
  if (s.taskDone) now.push({ id: "task", text: `You finished “${TASK.title}”`, when: "Just now", who: "MC" })
  for (const c of [...s.caught].reverse()) if (c.kind === "conf") now.push({ id: `c-${c.id}`, text: `You confirmed “${c.title}”`, when: "Just now", who: "MC" })
  return [
    ...now,
    { id: "y1", text: "You finished “Plan the promo video”", when: "Yesterday 9:40", who: "MC" },
    { id: "y2", text: "Your Duet told Trevor the promo video is 15 seconds", when: "Yesterday 9:40", who: "MC", agent: true },
    { id: "y3", text: "You took Trevor’s decision: change the brand color from red to blue", when: "Yesterday 9:22", who: "MC" },
  ]
}

function Marks({ marks }: { marks: Mark[] }) {
  return <span className="flex shrink-0 items-center gap-0.5">{marks.map((m, i) => <MarkIcon key={i} mark={m} className="size-3" />)}</span>
}

// The project's artifacts, thread by thread. The brand guidelines open as the deck they are.
function Artifacts({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const marketing = ARTIFACTS.find((t) => t.thread === "Marketing")!
  const video: ArtifactRow | null = s.shared ? { id: "w8", name: "Promo video", kind: "Runway", owner: "MC", when: "Just now", marks: s.caught.map(markOf) } : null
  return (
    <Page title="Artifacts" label="Whiskr">
      {ARTIFACTS.map((t) => (
        <Lane key={t.thread} title={t.thread}>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {(t.thread === "Marketing" && video ? [video, ...marketing.items] : t.items).map((a) => (
              <ArtifactTile key={a.id} a={a} onOpen={a.deck ? () => dispatch({ type: "deck", open: true }) : undefined} />
            ))}
          </ul>
        </Lane>
      ))}
    </Page>
  )
}

const OWNER: Record<string, string> = { MC: "You", TR: "Trevor", KL: "Kelly", CH: "Christine" }

function ArtifactTile({ a, onOpen }: { a: ArtifactRow; onOpen?: () => void }) {
  const icon = a.kind === "Figma" ? <Layers className="size-6" /> : a.kind === "Video" ? <Film className="size-6" /> : a.kind === "Runway" ? <Clapperboard className="size-6" /> : a.kind === "Prototype" ? <Boxes className="size-6" /> : a.kind === "AI output" ? <Sparkles className="size-6" /> : <FileText className="size-6" />
  const body = (
    <>
      <div className="flex h-24 items-center justify-center rounded-md bg-muted text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{a.name}</div>
        <div className="truncate text-xs text-muted-foreground">{a.kind} · {OWNER[a.owner]} · {a.when}</div>
      </div>
      {a.marks ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Marks marks={a.marks} />
          <span className="tabular-nums">{a.marks.filter((m) => m !== "empty").length} of {a.marks.length} confirmed</span>
        </div>
      ) : a.note ? <div className="text-xs text-muted-foreground">{a.note}</div> : <div className="text-xs text-muted-foreground">No decisions on it</div>}
    </>
  )
  return (
    <li>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left hover:bg-muted/60">{body}</button>
      ) : (
        <div className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left">{body}</div>
      )}
    </li>
  )
}

// Trevor's deck, page by page, with its card beside it.
function DeckDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [page, setPage] = useState(0)
  const text = ["Y · Brand guidelines v3 · 3 of 3 confirmed", ...BRAND.map((d) => `● ${d.title} — Trevor, ${d.when} — ${d.why}`)].join("\n")
  const [copied, copy] = useCopy(text)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[82vh] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-6xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid h-full min-h-0 grid-cols-[168px_1fr_300px]">
          <nav aria-label="Pages" className="flex min-h-0 flex-col gap-1 overflow-y-auto border-r bg-muted/30 p-3">
            {DECK_PAGES.map((p, i) => (
              <button key={p} type="button" onClick={() => setPage(i)} aria-current={i === page ? "page" : undefined} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted", i === page && "bg-muted font-medium")}>
                <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded border bg-background text-[9px] text-muted-foreground">{p}</span>
                <span className="truncate">{p}</span>
              </button>
            ))}
          </nav>
          <div className="flex min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-neutral-100 p-8">
            <DeckPage page={page} />
            <p className="text-xs text-muted-foreground tabular-nums">{page + 1} of {DECK_PAGES.length}</p>
          </div>
          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l p-5">
            <div>
              <DialogTitle className="flex items-center gap-2 text-sm font-medium"><Layers className="size-4 text-muted-foreground" />Brand guidelines v3</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><PersonAvatar id="TR" className="size-4" />Trevor · updated Monday · Brand</DialogDescription>
            </div>
            <section aria-label="Decisions on it" className="rounded-xl border bg-card">
              <header className="flex items-center gap-2 border-b px-3 py-2 text-xs">
                <YMark />
                <span className="flex-1 font-medium">Decisions on it</span>
                <span className="text-muted-foreground tabular-nums">3 of 3 confirmed</span>
              </header>
              <ul className="flex flex-col gap-3 p-3">
                {BRAND.map((d) => (
                  <li key={d.id} className="flex items-start gap-2">
                    <MarkIcon mark="filled" className="mt-[3px] size-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug font-medium">{d.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id="TR" className="size-3.5" />Trevor · {d.when}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{d.why}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <footer className="flex items-center gap-1.5 border-t px-3 py-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={copy}><Copy />{copied ? "Copied" : "Copy as text"}</Button>
              </footer>
            </section>
            <p className="text-xs text-muted-foreground">Nothing of yours on it.</p>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeckPage({ page }: { page: number }) {
  return (
    <div className="flex aspect-video w-full max-w-[720px] flex-col rounded-lg bg-white p-10 shadow-sm ring-1 ring-black/5">
      {page === 0 && (
        <>
          <p className="font-serif text-4xl">Whiskr brand guidelines</p>
          <p className="mt-2 text-sm text-neutral-500">v3 · Trevor · Monday</p>
          <p className="mt-auto max-w-md text-sm leading-6">Changed on Monday, after the second cat test: the brand is blue, not red, and the dot darts like prey.</p>
        </>
      )}
      {page === 1 && (
        <>
          <p className="font-serif text-2xl">Color</p>
          <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
            <Swatch tone="bg-neutral-800" label="Blue" note="The brand color" />
            <Swatch tone="bg-white ring-1 ring-black/10" label="White" note="Type on blue" />
            <Swatch tone="bg-neutral-200" label="Red" note="Retired on Monday" retired />
          </div>
          <p className="mt-6 text-sm text-neutral-600">Cats can’t see red. Blue is the color they see best.</p>
        </>
      )}
      {page === 2 && (
        <>
          <p className="font-serif text-2xl">Logo</p>
          <div className="flex flex-1 items-center justify-center"><CatMark className="h-32 w-auto" /></div>
          <p className="text-sm text-neutral-600">The swipe dot is part of the logo. Cats already know it from the app.</p>
        </>
      )}
      {page === 3 && (
        <>
          <p className="font-serif text-2xl">Motion</p>
          <div className="mt-4 grid flex-1 grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <svg viewBox="0 0 240 100" className="h-28 w-full text-neutral-400" aria-hidden><path d="M12 70 C 70 10, 150 10, 228 60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" /><circle cx="12" cy="70" r="5" fill="currentColor" /></svg>
              <p className="text-sm text-neutral-500 line-through">A smooth glide</p>
            </div>
            <div className="flex flex-col gap-2">
              <svg viewBox="0 0 240 100" className="h-28 w-full text-neutral-900" aria-hidden><path d="M12 70 L 62 30 L 110 64 L 170 22 L 228 58" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="62" cy="30" r="4" fill="currentColor" /><circle cx="110" cy="64" r="4" fill="currentColor" /><circle cx="170" cy="22" r="4" fill="currentColor" /><circle cx="228" cy="58" r="7" fill="currentColor" /></svg>
              <p className="text-sm font-medium">Short darts, with stops</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-neutral-600">In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.</p>
        </>
      )}
      {page === 4 && (
        <>
          <p className="font-serif text-2xl">Type</p>
          <p className="mt-8 font-serif text-5xl">Whiskr</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">Serif for names and headlines, the sans for everything else. Owners read the posters; cats don’t.</p>
        </>
      )}
    </div>
  )
}

function Swatch({ tone, label, note, retired }: { tone: string; label: string; note: string; retired?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("relative flex-1 rounded-md", tone)}>{retired && <span className="absolute inset-0 m-auto h-px w-full rotate-[-20deg] bg-neutral-500" aria-hidden />}</div>
      <p className={cn("text-sm font-medium", retired && "line-through text-neutral-500")}>{label}</p>
      <p className="-mt-1.5 text-xs text-neutral-500">{note}</p>
    </div>
  )
}

export function CatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-label="Whiskr logo" role="img">
      <path d="M22 70 C 10 50, 14 30, 26 14 L 42 32 L 78 32 L 94 14 C 106 30, 110 50, 98 70 C 88 84, 32 84, 22 70 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="46" cy="52" r="3" fill="currentColor" />
      <circle cx="74" cy="52" r="3" fill="currentColor" />
      <circle cx="104" cy="68" r="9" fill="currentColor" />
    </svg>
  )
}

