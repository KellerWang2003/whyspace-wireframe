import { Mic, MicOff, MonitorUp, PhoneOff, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PEOPLE_C, nameOf, type Talk } from "../data"
import { talkPhase, weekLine } from "../model"
import { setTalk, useC } from "../state"
import { Dot, Face, Faces, Why } from "../ui"
import { MAIN, Win } from "./win"

// Google Meet with Whyspace in the side panel: the brief before, captions during, the caught call at the end.
// A talk is ten minutes between the people whose calls clash; a kickoff or sync is the same panel, longer.
export function MeetWin({ talk }: { talk: Talk }) {
  const s = useC()
  const phase = talkPhase(talk, s) ?? "booked"
  const people = talk.people
  const cols = people.length > 4 ? 3 : 2
  return (
    <Win title={`${talk.title} – Google Meet`} style={MAIN} dark>
      <div className="flex min-h-0 flex-1 bg-[#202124] text-neutral-100">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={cn("grid min-h-0 flex-1 gap-3 p-4", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {people.map((p, i) => (
              <div key={p} className="relative flex items-center justify-center rounded-xl bg-[#3c4043]">
                <span className="flex size-16 items-center justify-center rounded-full bg-[#5f6368] text-2xl">{PEOPLE_C[p]?.name[0]}</span>
                <span className="absolute bottom-2 left-3 text-[12px]">{nameOf(p)}{p === s.viewer && " (You)"}</span>
                {i === 1 && <MicOff className="absolute top-2 right-2 size-3.5 text-neutral-400" />}
              </div>
            ))}
          </div>
          <div className="flex h-14 shrink-0 items-center justify-center gap-3 border-t border-white/10 text-[12px]">
            <span className="mr-auto pl-4 text-neutral-400 tabular-nums">{talk.day} {talk.time} · {talk.title.toLowerCase().replace(/\s+/g, "-")}</span>
            <Round><Mic className="size-4" /></Round>
            <Round><Video className="size-4" /></Round>
            <Round><MonitorUp className="size-4" /></Round>
            <Round red><PhoneOff className="size-4" /></Round>
            <span className="ml-auto pr-4 text-neutral-400">{people.length} people</span>
          </div>
        </div>
        <aside className="flex w-[380px] shrink-0 flex-col rounded-l-xl bg-white text-foreground">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-xs text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground font-serif text-[11px] text-background">Y</span>
            <span className="text-sm text-foreground">{talk.title}</span>
            <span className="ml-auto">{talk.minutes} min</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <TalkPanel talk={talk} phase={phase} />
          </div>
        </aside>
      </div>
    </Win>
  )
}

function Round({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return <span className={cn("flex size-9 items-center justify-center rounded-full", red ? "w-12 bg-[#ea4335]" : "bg-[#3c4043]")}>{children}</span>
}

// The compact talk, for the Meet panel and the pill.
export function TalkPanel({ talk, phase }: { talk: Talk; phase: "booked" | "live" | "done" }) {
  const s = useC()
  const me = s.viewer
  const week = talk.id === "sync" ? weekLine(s) : null
  return (
    <div className="flex flex-col gap-5 text-sm">
      {talk.reason && <p className="text-muted-foreground">{talk.reason}</p>}
      {week && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
          <span>This week</span>
          <span className="text-foreground">{week.shared} shared</span>
          <span className="text-foreground">{week.clashes} clashes caught</span>
          <span className="text-foreground">{week.talks} talks</span>
          <span className="text-foreground">{week.shipped} guesses shipped</span>
        </div>
      )}
      {talk.brief.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h3 className="type-section text-muted-foreground">Where everyone stands</h3>
          {talk.brief.map((b) => (
            <div key={b.who} className="flex items-start gap-2.5">
              <Face id={b.who} className="mt-0.5 size-5" />
              <span><span className="font-medium">{b.who === me ? "You" : nameOf(b.who)}</span> · {b.text} <Why>{b.why}</Why></span>
            </div>
          ))}
        </section>
      )}
      {phase !== "booked" && talk.captions && (
        <section className="flex flex-col gap-2.5">
          <h3 className="type-section text-muted-foreground">{phase === "live" ? "Now" : "Said"}</h3>
          {talk.captions.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Face id={c.who} className="mt-0.5 size-5" />
              <span>{c.text}</span>
            </div>
          ))}
        </section>
      )}
      {phase === "live" && talk.caught && (
        <section className="flex flex-col gap-2 rounded-lg border border-foreground px-3 py-2.5">
          <div className="flex items-start gap-2.5"><Dot mark="empty" className="mt-[7px]" /><span>{talk.caught.text} <Why>{talk.caught.why}</Why></span></div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Heard just now · backed by everyone here with one tap</span>
            <Button size="sm" onClick={() => setTalk(talk.id, "done")}>Back it</Button>
          </div>
        </section>
      )}
      {phase === "live" && !talk.caught && talk.outcome && (
        <section className="flex flex-col gap-2 rounded-lg border border-foreground px-3 py-2.5">
          <div className="flex items-start gap-2.5"><Dot mark="empty" className="mt-[7px]" /><span>{talk.outcome.text} <Why>{talk.outcome.why}</Why></span></div>
          {talk.outcome.calls && <ul className="ml-5 flex flex-col gap-1 text-[13px]">{talk.outcome.calls.map((c) => <li key={c.text} className="flex items-start gap-2"><Dot mark="empty" className="mt-[6px]" />{c.text}</li>)}</ul>}
          <div className="flex items-center justify-end"><Button size="sm" onClick={() => setTalk(talk.id, "done")}>Back it</Button></div>
        </section>
      )}
      {phase === "done" && talk.outcome && (
        <section className="flex flex-col gap-2">
          <h3 className="type-section text-muted-foreground">Settled</h3>
          <div className="flex items-start gap-2.5"><Dot mark="filled" className="mt-[7px]" /><span>{talk.outcome.text} <Why>{talk.outcome.why}</Why></span></div>
          {talk.outcome.calls && <ul className="ml-5 flex flex-col gap-1 text-[13px]">{talk.outcome.calls.map((c) => <li key={c.text} className="flex items-start gap-2"><Dot mark="filled" className="mt-[6px]" />{c.text}</li>)}</ul>}
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Faces ids={talk.outcome.backedBy} size="size-5" />{talk.outcome.backedBy.length === talk.people.length ? "Everyone here" : talk.outcome.backedBy.map(nameOf).join(", ")}</div>
          {talk.outcome.next && <p className="text-xs text-muted-foreground">Next · {talk.outcome.next}</p>}
        </section>
      )}
      {phase === "booked" && <Button size="sm" variant="outline" className="self-start" onClick={() => setTalk(talk.id, "live")}>Join</Button>}
    </div>
  )
}
