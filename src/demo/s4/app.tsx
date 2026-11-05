import { Boxes, Layers, Presentation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import { ToolLogo } from "@/components/app/tool-logo"
import { cn } from "@/lib/utils"
import { ComingUp, HandledList, Lane, NeedsRow, Page, Prop, Rail, Recap, TaskDialog, Thread, Tile, Where, YMark, type HandledLine, type Upcoming } from "../kit/app"
import { CATCH_UP, MATCH_TASK, PROJECTS, PROMPT, REACH, SEEN_BY, TASK, THREADS, TODAY_LABEL, TREVOR_NEW, TREVOR_OLD, VIEWER, WORKING_NOW, type Action, type State } from "./model"

// The Whyspace app for scenario 4: Kelly's Tuesday Today with the task Whyspace made from Trevor's
// decision, the task itself (the why, what it replaced, before and after, the reach), her own task,
// and Whiskr's Home with Working now as the optional opener.

const UPCOMING: Upcoming = [
  ["Wed, Oct 28", [["10:00", "Match screen review", "whiskr"]]],
  ["Thu, Oct 29", [["11:00", "Launch call", "whiskr"], ["15:00", "Panel interviews", "panel"]]],
]
const NAMES: Record<string, string> = { MC: "Keller", TR: "Trevor", KL: "You", CH: "Christine" }
const MEMBERS: [string, string, string][] = [["CH", "Christine", "CEO"], ["TR", "Trevor", "Research and brand"], ["KL", "Kelly", "Product"], ["MC", "Keller", "Marketing"]]

export function DemoApp4({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const rows = [
    ...(!s.taskDone ? [
      <NeedsRow key="update" face={<YMark className="size-8 text-sm" />} lead="Update" title={TASK.title}
        sub={<>From Trevor’s decision, Monday<Where thread="App" /></>} onOpen={() => dispatch({ type: "task", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "task", open: true })}>Open</Button>} />,
    ] : []),
    <NeedsRow key="match" face={<PersonAvatar id="KL" className="size-8" />} lead="Do" title={MATCH_TASK.title}
      sub={<>Due Friday<Where thread="App" /></>} onOpen={() => dispatch({ type: "match", open: true })} />,
  ]
  const nav = (key: string) => {
    if (key === "today") dispatch({ type: "page", to: "today" })
    if (key === "whiskr") dispatch({ type: "page", to: "home" })
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <Rail viewer={VIEWER} projects={PROJECTS} active={s.page === "today" ? "today" : "whiskr"} badge={rows.length} onNav={nav} />
      {s.page === "today" ? (
        <Page title="Today" label={TODAY_LABEL} aside={<ComingUp days={UPCOMING} />}>
          <Lane title="Needs you" count={rows.length}><ul className="flex flex-col gap-2">{rows}</ul></Lane>
          <Lane title="Across your projects">
            <ul className="flex flex-col gap-1">
              <Recap project="whiskr" name="Whiskr" onOpen={() => dispatch({ type: "page", to: "home" })} summary={s.taskDone ? "Your prototype follows the brand guidelines again. Keller is planning the promo video." : "Trevor replaced a brand rule on Monday. Your prototype and app design follow the old one."} />
              <Recap project="panel" name="Cat owner panel" summary="Three new owners joined the panel." />
              <Recap project="android" name="Android app" summary="Nothing new this week." />
            </ul>
          </Lane>
          <Lane title="Handled"><HandledList lines={handled(s)} /></Lane>
        </Page>
      ) : (
        <Home s={s} dispatch={dispatch} />
      )}

      <TaskDialog
        open={s.taskOpen}
        onOpenChange={(o) => dispatch({ type: "task", open: o })}
        title={TASK.title}
        description={TASK.description}
        before={<Behind />}
        tool="Claude Code"
        prompt={PROMPT}
        onOpenTool={() => dispatch({ type: "surface", to: "desk" })}
        tiles={<>
          <Tile icon={<Boxes className="size-4 shrink-0 text-muted-foreground" />} label="Whiskr prototype" kind="Prototype · you · needs this update" />
          <Tile icon={<Layers className="size-4 shrink-0 text-muted-foreground" />} label="App design" kind="Figma · you · needs an update" />
          <Tile icon={<Presentation className="size-4 shrink-0 text-muted-foreground" />} label="Brand guidelines v3" kind="Figma · Trevor · Monday" />
          <Tile icon={<span className="ml-1 size-2 shrink-0 rounded-full bg-foreground" aria-hidden />} label="Brand" kind="Make Whiskr look and move the way cats respond to." />
        </>}
        props={<>
          <Prop label="Status">{s.taskDone ? "Done" : "To do"}</Prop>
          <Prop label="Assignee"><span className="flex items-center gap-2"><PersonAvatar id="KL" className="size-5" />Kelly</span></Prop>
          <Prop label="Made by"><span className="flex items-center gap-2"><YMark />Whyspace · Monday</span></Prop>
          <Prop label="Thread"><Thread name="App" /></Prop>
        </>}
      />

      <TaskDialog
        open={s.matchOpen}
        onOpenChange={(o) => dispatch({ type: "match", open: o })}
        title={MATCH_TASK.title}
        description={MATCH_TASK.description}
        tool="Claude Code"
        prompt={MATCH_TASK.prompt}
        onOpenTool={() => dispatch({ type: "surface", to: "desk" })}
        tiles={<>
          <Tile icon={<Boxes className="size-4 shrink-0 text-muted-foreground" />} label="Whiskr prototype" kind="Prototype · you" />
          <Tile icon={<Layers className="size-4 shrink-0 text-muted-foreground" />} label="App design" kind="Figma · you" />
          <Tile icon={<span className="ml-1 size-2 shrink-0 rounded-full bg-foreground" aria-hidden />} label="App" kind="Build the swipe and match screens cats and owners both get." />
        </>}
        props={<>
          <Prop label="Status">In progress</Prop>
          <Prop label="Assignee"><span className="flex items-center gap-2"><PersonAvatar id="KL" className="size-5" />Kelly</span></Prop>
          <Prop label="Due">Friday</Prop>
          <Prop label="Thread"><Thread name="App" /></Prop>
        </>}
      />
    </div>
  )
}

function handled(s: State): HandledLine[] {
  const now: HandledLine[] = s.taskDone ? [{ id: "dart", text: "Your Claude Code changed the dot’s motion to short darts, following Trevor’s decision", when: "Just now", who: "KL", agent: true }] : []
  return [
    ...now,
    { id: "y1", text: "Trevor’s decision reached your prototype: Whyspace made you an update task", when: "Yesterday 16:10", who: "TR" },
    { id: "y2", text: "You finished “Add the purr to the dot”", when: "Yesterday 11:30", who: "KL" },
    { id: "y3", text: "You confirmed “The dot purrs on a match”", when: "Yesterday 11:28", who: "KL" },
  ]
}

// The decision the task came from: the why, what it replaced, before and after, and how far it reaches.
function Behind() {
  return (
    <section aria-label="The decision behind it" className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-2 text-xs">
        <YMark />
        <span className="flex-1 font-medium">The decision behind it</span>
        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />Brand</span>
      </header>
      <div className="flex flex-col gap-5 p-4">
        <div className="flex items-start gap-2">
          <MarkIcon mark="filled" className="mt-[5px] size-3.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{TREVOR_NEW.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><PersonAvatar id="TR" className="size-4" />Trevor · {TREVOR_NEW.when} · confirmed</p>
            <p className="mt-2 text-sm leading-6">{TREVOR_NEW.why}</p>
            <p className="mt-1 text-xs text-muted-foreground">{TREVOR_NEW.evidence}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <MarkIcon mark="filled" className="mt-[5px] size-3.5 shrink-0 opacity-40" />
          <div className="min-w-0 flex-1">
            <p className="text-sm"><span className="text-xs">Replaces</span> <span className="line-through">{TREVOR_OLD.title}</span></p>
            <p className="text-xs">Trevor · {TREVOR_OLD.when} · {TREVOR_OLD.why}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Motion before />
          <Motion />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Reaches</p>
          <ul className="flex flex-col gap-1.5">
            {REACH.map((r) => (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <PersonAvatar id={r.owner} className="size-5" />
                <span className="min-w-0 flex-1 truncate">{r.name}<span className="text-muted-foreground"> · {NAMES[r.owner]}</span></span>
                <span className={cn("shrink-0 text-xs", r.state.startsWith("Needs") ? "font-medium" : "text-muted-foreground")}>{r.state}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          Seen by
          <span className="flex -space-x-1">{SEEN_BY.map((id) => <PersonAvatar key={id} id={id} className="size-5 ring-2 ring-card" />)}</span>
          {SEEN_BY.map((id) => NAMES[id]).join(", ")}
        </p>
      </div>
    </section>
  )
}

function Motion({ before }: { before?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg border p-3", before && "text-muted-foreground")}>
      <p className="text-xs">{before ? "Before" : "After"}</p>
      {before ? (
        <svg viewBox="0 0 240 80" className="h-16 w-full" aria-hidden><path d="M12 56 C 70 8, 150 8, 228 48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" /><circle cx="12" cy="56" r="5" fill="currentColor" /></svg>
      ) : (
        <svg viewBox="0 0 240 80" className="h-16 w-full" aria-hidden><path d="M12 56 L 62 24 L 110 52 L 170 18 L 228 46" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="62" cy="24" r="4" fill="currentColor" /><circle cx="110" cy="52" r="4" fill="currentColor" /><circle cx="170" cy="18" r="4" fill="currentColor" /><circle cx="228" cy="46" r="7" fill="currentColor" /></svg>
      )}
      <p className={cn("text-sm", before ? "line-through" : "font-medium")}>{before ? "A smooth glide" : "Short darts, with stops"}</p>
    </div>
  )
}

// Whiskr's Home: who is working now, the week so far, and the project's people and threads.
function Home({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  return (
    <Page title="Whiskr" label="Home" aside={<HomeAside s={s} />}>
      <Lane title="Working now">
        <ul className="divide-y rounded-lg border">
          {WORKING_NOW.map((w) => (
            <li key={w.who} className="flex items-center gap-3 px-3 py-2">
              <PersonAvatar id={w.who} className="size-7" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm">
                  <span className="truncate font-medium">{w.name}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />{w.thread}</span>
                </p>
                <p className="flex items-center gap-1.5 text-xs leading-snug"><ToolLogo tool={w.tool} className="size-3.5" />{w.tool} · {w.text}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">since {w.since}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">No one is on the App right now.</p>
      </Lane>
      <Lane title="Catch up">
        <div className="rounded-xl border bg-card p-4 text-sm leading-6">
          <p>{CATCH_UP.week}</p>
          <p className="mt-2 text-muted-foreground">{CATCH_UP.you}</p>
          {!s.taskDone && <Button size="sm" variant="outline" className="mt-3" onClick={() => dispatch({ type: "task", open: true })}>Open the update task</Button>}
        </div>
      </Lane>
    </Page>
  )
}

function HomeAside({ s }: { s: State }) {
  return (
    <section aria-label="About this project" className="flex shrink-0 flex-col gap-8 border-t p-6 sm:p-8 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-6">
      <div className="flex flex-col gap-3">
        <h2 className="type-section">Members</h2>
        <ul className="flex flex-col gap-2">
          {MEMBERS.map(([id, name, role]) => (
            <li key={id} className="flex items-center gap-2 text-sm"><PersonAvatar id={id} className="size-6" />{id === "KL" ? `${name} (you)` : name}<span className="text-xs text-muted-foreground">{role}</span></li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="type-section">Threads</h2>
        <ul className="flex flex-col gap-2.5">
          {THREADS.map((t) => (
            <li key={t.name} className="flex items-start gap-2 text-sm">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.name === "App" && !s.taskDone ? `${t.state} · 1 update waiting` : t.state}</span>
              </span>
              <PersonAvatar id={t.who} className="size-5" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
