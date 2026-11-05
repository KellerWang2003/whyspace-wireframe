import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { navigate } from "@/lib/router"
import { DUET_ASKS, PEOPLE_C, TALKS, nameOf, threadOf } from "./data"
import { callsBackedBy } from "./model"
import { useC } from "./state"
import { Dot, Face, Why } from "./ui"

// Your Duet, in your profile: the calls you stand behind, who asked it what, and two switches.
// It answers only from these calls. When it has none, it books ten minutes.
export function DuetTab() {
  const s = useC()
  const me = PEOPLE_C[s.viewer]
  const calls = callsBackedBy(s.viewer, s)
  const asks = DUET_ASKS.filter((a) => a.duet === s.viewer)
  const [answers, setAnswers] = useState(true)
  const [books, setBooks] = useState(true)

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Answers teammates from my calls</span>
          <Switch checked={answers} onCheckedChange={setAnswers} />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Books ten minutes when it has no call to answer from</span>
          <Switch checked={books} onCheckedChange={setBooks} disabled={!answers} />
        </label>
        <p className="text-xs text-muted-foreground">Readable by {me?.ai} and your teammates’ AI tools over MCP.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="type-section text-muted-foreground">Your calls</h2>
        {calls.length === 0 && <p className="text-sm text-muted-foreground">None yet. Back a call at your next share.</p>}
        <ul className="flex flex-col gap-2.5">
          {calls.map(({ eff, handoff }) => (
            <li key={eff.call.id}>
              <button type="button" onClick={() => navigate(`/p/${handoff.project}/t/${handoff.thread}/h/${handoff.id}`)} className="flex w-full items-start gap-2.5 rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted/50">
                <Dot state={eff.state} className="mt-[7px]" />
                <span className="min-w-0 flex-1">
                  {eff.text} <Why>{eff.why}</Why>
                  <span className="block text-xs text-muted-foreground">{handoff.title} · {threadOf(handoff.thread)?.name} · {handoff.day}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="type-section text-muted-foreground">Asked</h2>
        {asks.length === 0 && <p className="text-sm text-muted-foreground">Nobody has asked yet.</p>}
        <ul className="flex flex-col gap-3">
          {asks.map((a) => {
            const talk = TALKS.find((t) => t.id === a.talk)
            return (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <Face id={a.who} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span>{nameOf(a.who)} · {a.question}</span>
                  <span className="block text-muted-foreground">
                    {a.answer ? <>{a.answer}</> : talk ? <button type="button" className="hover:underline" onClick={() => navigate(`/p/${talk.project}/talks/${talk.id}`)}>No call to answer from. Booked {talk.minutes} min, {talk.day} {talk.time}.</button> : "No call to answer from."}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
