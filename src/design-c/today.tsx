import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { CallList, HandoffCard } from "./handoff-card"
import { dayLong, handled, needsYou, sceneOf, subject, weekLine } from "./model"
import { markShipped, useC } from "./state"
import { TalkRow } from "./talk"
import { Dot, Dots, Face, Faces, Lane, Readers, ThreadTagC } from "./ui"
import { Button } from "@/components/ui/button"

// Today: two lanes. Needs you is large, with faces. Handled is one quiet line each, today and yesterday.
export function TodayC() {
  const s = useC()
  const scene = sceneOf(s.scene)
  const rows = needsYou(s)
  const lines = handled(s)
  const week = weekLine(s)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-6 sm:p-8">
      <header className="flex items-baseline gap-3">
        <h1 className="type-title">Today</h1>
        <span className="text-sm text-muted-foreground">{dayLong(scene.day)}</span>
      </header>

      <Lane title="Needs you" count={rows.length}>
        {rows.length === 0 && (
          <p className="flex flex-wrap gap-x-3 py-6 text-sm text-muted-foreground tabular-nums">
            <span>Nothing</span>
            <span>·</span><span>{week.shared} shared this week</span>
            <span>·</span><span>{week.clashes} {week.clashes === 1 ? "clash" : "clashes"} caught</span>
            <span>·</span><span>{week.talks} {week.talks === 1 ? "talk" : "talks"}</span>
            <span>·</span><span>{week.shipped} {week.shipped === 1 ? "guess" : "guesses"} shipped</span>
          </p>
        )}
        {rows.map((r) => {
          if (r.kind === "check") return <HandoffCard key={r.handoff.id} handoff={r.handoff} showThread />
          if (r.kind === "talk") return <TalkRow key={r.talk.id} talk={r.talk} phase={r.phase} />
          if (r.kind === "stance") return <TalkRow key={r.talk.id} talk={r.talk} phase="booked" />
          if (r.kind === "built") {
            return (
              <article key={`built-${r.eff.call.id}`} className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3">
                <div className="flex items-center gap-3 text-sm">
                  <Readers readers={r.by} size="size-6" />
                  <span className="min-w-0 flex-1 truncate">{r.by.length} built on your guess in <span className="font-medium">{r.handoff.title}</span></span>
                  <ThreadTagC thread={r.handoff.thread} className="text-xs text-muted-foreground" />
                </div>
                <CallList effs={[r.eff]} handoff={r.handoff} />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => markShipped(`built:${r.eff.call.id}`)}>Fine</Button>
                </div>
              </article>
            )
          }
          return (
            <article key={r.handoff.id} className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3 text-sm">
                <Face id={r.handoff.from} />
                <span className="min-w-0 flex-1 truncate"><span className="font-medium">{r.handoff.title}</span> ships today with {r.guesses.length} {r.guesses.length === 1 ? "guess" : "guesses"}</span>
                <ThreadTagC thread={r.handoff.thread} className="text-xs text-muted-foreground" />
              </div>
              <ul className="flex flex-col gap-1.5 text-sm">
                {r.guesses.map((g) => <li key={g.call.id} className="flex items-start gap-2.5"><Dot state="guess" className="mt-[7px]" />{g.text}</li>)}
              </ul>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/p/${r.handoff.project}/t/${r.handoff.thread}/h/${r.handoff.id}`)}>Open</Button>
                <Button size="sm" variant="ghost" onClick={() => markShipped(r.handoff.id)}>Fine</Button>
              </div>
            </article>
          )
        })}
      </Lane>

      <Lane title="Handled">
        {lines.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing today or yesterday.</p>}
        <ul className="flex flex-col">
          {lines.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => l.talk ? navigate(`/p/${l.talk.project}/talks/${l.talk.id}`) : l.handoff && navigate(`/p/${l.handoff.project}/t/${l.handoff.thread}/h/${l.handoff.id}`)}
                className={cn("flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50")}
              >
                {l.face ?? l.who ? <Face id={(l.face ?? l.who)!} agent={l.agent} className="size-5" /> : l.talk ? <Faces ids={l.talk.people} max={3} size="size-5" /> : <span className="size-5" />}
                <span className="min-w-0 flex-1 truncate">
                  {l.who && <span>{subject(l.who, s.viewer)} </span>}
                  <span className={cn(l.who && "text-muted-foreground")}>{l.text}</span>
                </span>
                {l.dots && <Dots states={l.dots} className="hidden sm:inline-flex" />}
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{l.day} {l.time}</span>
              </button>
            </li>
          ))}
        </ul>
      </Lane>
    </div>
  )
}
