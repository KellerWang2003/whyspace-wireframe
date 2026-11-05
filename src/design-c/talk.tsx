import { useState } from "react"
import { Button } from "@/components/ui/button"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { listNames, nameOf, type Talk } from "./data"
import { stanceOf, talkPhase, type TalkPhase } from "./model"
import { setStance, setTalk, useC } from "./state"
import { Dot, Face, Faces, ThreadTagC, Why } from "./ui"

// A talk is ten minutes between the people whose calls clash, briefed with each stance and its why.
// The Duet books it once; nobody writes an agenda. Live when there is an overlap, written when there
// is not. It ends settled, one call backed by everyone in it, or unsettled, both stances on record.

export function TalkRow({ talk, phase, className }: { talk: Talk; phase: TalkPhase; className?: string }) {
  const s = useC()
  const written = talk.mode === "written"
  const mine = written && phase !== "done" && !stanceOf(talk, s.viewer, s)
  return (
    <button
      type="button"
      onClick={() => navigate(`/p/${talk.project}/talks/${talk.id}`)}
      className={cn("flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-muted/40", (phase === "live" || mine) && "border-foreground", className)}
    >
      <Faces ids={talk.people} max={4} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{talk.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {phase === "done" && talk.outcome ? <>{talk.outcome.text}{talk.settledBy && <> · {nameOf(talk.settledBy.who)} took {nameOf(talk.settledBy.took)}’s</>}</>
            : phase === "done" && talk.unsettled ? <>Unsettled · {listNames(talk.people)}</>
            : mine ? <>Your stance{talk.reason && <> · {talk.reason}</>}</>
            : talk.reason ?? listNames(talk.people)}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {phase === "live" ? <span className="font-medium text-foreground">Live</span>
          : written && phase !== "done" ? <>Written · by {talk.window}</>
          : written ? <>Written · {talk.day}</>
          : <>{talk.day} {talk.time} · {talk.minutes} min</>}
      </span>
    </button>
  )
}

export function TalkPage({ talk }: { talk: Talk }) {
  const s = useC()
  const phase = talkPhase(talk, s) ?? "booked"
  const me = s.viewer
  const outcome = talk.outcome
  const others = talk.people.filter((p) => p !== me)
  const written = talk.mode === "written"
  const built = talk.builtOn && talk.builtOn.at <= s.scene ? talk.builtOn : undefined
  const allIn = written && talk.people.every((p) => stanceOf(talk, p, s))

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6 sm:p-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 flex-1 type-title">{talk.title}</h1>
          {phase === "live" ? <span className="text-sm font-medium">Live</span>
            : written ? <span className="text-sm text-muted-foreground tabular-nums">Written · by {talk.window}</span>
            : <span className="text-sm text-muted-foreground tabular-nums">{talk.day} {talk.time} · {talk.minutes} min</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Faces ids={talk.people} />
          <span>{listNames(others)}{others.length < talk.people.length && " and you"}</span>
          {talk.thread && <ThreadTagC thread={talk.thread} />}
        </div>
        {talk.reason && <p className="text-sm text-muted-foreground">{talk.reason}</p>}
      </header>

      {written ? (
        <section className="flex flex-col gap-3">
          <h2 className="type-section text-muted-foreground">Stances</h2>
          <ul className="flex flex-col gap-3">
            {talk.people.map((who) => {
              const st = stanceOf(talk, who, s)
              return (
                <li key={who} className="flex items-start gap-3 text-sm">
                  <Face id={who} className="mt-0.5" />
                  {st ? (
                    <span><span className="font-medium">{who === me ? "You" : nameOf(who)}</span> · {st.text} <Why>{st.why}</Why></span>
                  ) : who === me && phase !== "done" ? (
                    <StanceForm talk={talk} />
                  ) : (
                    <span className="text-muted-foreground"><span className="font-medium text-foreground">{nameOf(who)}</span> · by {talk.window}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {phase !== "done" && allIn && (
            <div className="flex flex-wrap gap-1.5">
              {others.map((o) => <Button key={o} size="sm" variant="outline" onClick={() => setTalk(talk.id, "done")}>Take {nameOf(o)}’s</Button>)}
            </div>
          )}
        </section>
      ) : talk.brief.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="type-section text-muted-foreground">Where everyone stands</h2>
          <ul className="flex flex-col gap-3">
            {talk.brief.map((b) => (
              <li key={b.who} className="flex items-start gap-3 text-sm">
                <Face id={b.who} className="mt-0.5" />
                <span><span className="font-medium">{b.who === me ? "You" : nameOf(b.who)}</span> · {b.text} <Why>{b.why}</Why></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase !== "booked" && !written && talk.captions && talk.captions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="type-section text-muted-foreground">{phase === "live" ? "Now" : "Said"}</h2>
          <ul className="flex flex-col gap-2.5">
            {talk.captions.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Face id={c.who} className="mt-0.5" />
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "live" && talk.caught && (
        <section className="flex items-start gap-3 rounded-lg border border-foreground px-4 py-3">
          <Dot mark="empty" className="mt-[7px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            <span>{talk.caught.text} <Why>{talk.caught.why}</Why></span>
            <span className="text-xs text-muted-foreground">Heard just now. One tap and it is backed by everyone here.</span>
          </div>
          <Button size="sm" onClick={() => setTalk(talk.id, "done")}>Back it</Button>
        </section>
      )}

      {phase === "done" && outcome && (
        <section className="flex flex-col gap-3">
          <h2 className="type-section text-muted-foreground">Settled</h2>
          <div className="flex items-start gap-3 text-sm">
            <Dot mark="filled" className="mt-[7px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span>{outcome.text} <Why>{outcome.why}</Why></span>
              {outcome.calls && (
                <ul className="mt-1 flex flex-col gap-1.5 text-[13px]">
                  {outcome.calls.map((c) => <li key={c.text} className="flex items-start gap-2"><Dot mark="filled" className="mt-[6px]" />{c.text}</li>)}
                </ul>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Faces ids={outcome.backedBy} size="size-5" />
                {talk.settledBy ? <>{nameOf(talk.settledBy.who)} took {nameOf(talk.settledBy.took)}’s</> : outcome.backedBy.length === talk.people.length ? "Everyone here" : listNames(outcome.backedBy)}
              </div>
              {outcome.next && <span className="text-xs text-muted-foreground">Next · {outcome.next}</span>}
            </div>
          </div>
        </section>
      )}

      {phase === "done" && !outcome && talk.unsettled && (
        <section className="flex flex-col gap-3">
          <h2 className="type-section text-muted-foreground">Unsettled</h2>
          <div className="flex items-start gap-3 text-sm">
            <Dot mark="triangle" className="mt-[7px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-center gap-2"><Faces ids={talk.people} size="size-5" /><span className="text-muted-foreground">Both stances on record</span></span>
              {built && <span className="flex items-start gap-2"><Face id={built.who} className="mt-0.5 size-5" /><span>{nameOf(built.who)} built on {nameOf(built.stance)}’s stance <Why>{built.why}</Why></span></span>}
            </div>
          </div>
        </section>
      )}

      {phase === "booked" && !written && (
        <div>
          <Button size="sm" variant="outline" onClick={() => setTalk(talk.id, "live")}>Join</Button>
        </div>
      )}
    </div>
  )
}

function StanceForm({ talk }: { talk: Talk }) {
  const [draft, setDraft] = useState("")
  return (
    <form className="flex min-w-0 flex-1 gap-1.5" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) setStance(talk.id, draft.trim()) }}>
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your stance" placeholder="Your stance…" className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">Send</Button>
    </form>
  )
}
