import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { listNames, nameOf, type Handoff } from "./data"
import { counts, refLabel, type Eff } from "./model"
import { backCall, finishCheck, renameCall, resolveClash, useC } from "./state"
import { Count, Dot, Face, Faces, Why } from "./ui"

// The check: right after work reaches a shared place, its calls, one line each.
// Back a call with one tap on a why. Leave the rest; they travel as guesses. Nothing here blocks the share.
export function CheckPanel({ handoff, effs, onDone, className, compact }: { handoff: Handoff; effs: Eff[]; onDone?: () => void; className?: string; compact?: boolean }) {
  const n = counts(effs)
  return (
    <div className={cn("flex flex-col", className)}>
      <ul className={cn("flex flex-col", compact ? "gap-2.5" : "gap-3")}>
        {effs.map((e) => <CheckRow key={e.call.id} handoff={handoff} eff={e} compact={compact} />)}
      </ul>
      <div className={cn("flex items-center justify-between gap-3", compact ? "mt-3" : "mt-5")}>
        <Count backed={n.backed} total={n.total} className="text-sm text-muted-foreground" />
        <Button size="sm" onClick={() => { finishCheck(handoff.id); onDone?.() }}>Done</Button>
      </div>
    </div>
  )
}

function CheckRow({ handoff, eff, compact }: { handoff: Handoff; eff: Eff; compact?: boolean }) {
  const { viewer } = useC()
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState("")
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(eff.text)
  const [when, setWhen] = useState(false)
  const c = eff.call
  const back = (why: string) => { backCall(handoff.id, c.id, why); setTyping(false); setDraft("") }
  const text = compact ? "text-[13px]" : "text-sm"
  const saveName = () => { const t = name.trim(); if (t && t !== eff.text) renameCall(c.id, t); setEditing(false) }

  return (
    <li className="flex items-start gap-2.5">
      <Dot state={eff.state} className="mt-[7px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-5", text)}>
          {eff.state === "open" && editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(eff.text); setEditing(false) } }}
              aria-label="Call"
              className="h-6 min-w-[12rem] flex-1 rounded-sm border-b border-foreground bg-transparent outline-none"
            />
          ) : eff.state === "open" ? (
            // The AI's wording is a draft: click it to correct it before you back it.
            <button type="button" onClick={() => setEditing(true)} className="rounded-sm text-left hover:bg-muted">{eff.text}</button>
          ) : (
            <span className={cn(eff.state === "took" && "text-muted-foreground line-through")}>{eff.text}</span>
          )}
          {eff.state === "took" && eff.ref && <span>{eff.ref.call.text}</span>}
          {eff.state === "backed" && (
            <button type="button" onClick={() => backCall(handoff.id, c.id, null)} className="text-left text-muted-foreground hover:text-foreground">
              {eff.why ?? "backed"}
            </button>
          )}
          {(eff.state === "precedent" || eff.state === "follows" || eff.state === "took") && eff.ref && (
            <Why>{eff.why}{eff.why && " · "}{refLabel(eff, viewer, handoff.project)}</Why>
          )}
          {eff.state === "talk" && eff.talk && (
            eff.talk.mode === "written"
              ? <Why>Written · by {eff.talk.window} · {listNames(eff.talk.people.filter((p) => p !== viewer))}</Why>
              : <Why>Talk · {eff.talk.day} {eff.talk.time} · {eff.talk.minutes} min · {listNames(eff.talk.people.filter((p) => p !== viewer))}</Why>
          )}
          {eff.state === "talk" && !eff.talk && <Why>Talk</Why>}
        </div>

        {eff.state === "open" && !typing && (
          <div className="flex flex-wrap gap-1.5">
            {(c.hints ?? []).map((h) => <Chip key={h} onClick={() => back(h)}>{h}</Chip>)}
            <Chip muted onClick={() => setTyping(true)}>Why…</Chip>
          </div>
        )}
        {eff.state === "open" && typing && (
          <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) back(draft.trim()) }}>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setTyping(false); setDraft("") } }}
              aria-label="Why"
              className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">Back it</Button>
          </form>
        )}

        {eff.state === "clash" && eff.ref && (
          <div className="flex flex-col gap-1.5">
            {eff.why && <Why className={text}>Your reason · {eff.why}</Why>}
            <div className={cn("flex items-start gap-2 text-muted-foreground", text)}>
              <Face id={eff.ref.who} className="mt-0.5 size-5" />
              <span><span className="text-foreground">{nameOf(eff.ref.who)}</span> backed {eff.ref.call.text.toLowerCase()}{eff.ref.call.why && ` · ${eff.ref.call.why}`}</span>
            </div>
            {when ? (
              // The person who picks Talk picks the window.
              <div className="flex gap-1.5">
                <Chip onClick={() => resolveClash(c.id, "talk")}>Today</Chip>
                <Chip onClick={() => resolveClash(c.id, "talk")}>Tomorrow</Chip>
                <Chip onClick={() => resolveClash(c.id, "talk")}>This week</Chip>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <Chip onClick={() => resolveClash(c.id, "took")}>Take {nameOf(eff.ref.who)}’s</Chip>
                <Chip onClick={() => setWhen(true)}>Talk</Chip>
              </div>
            )}
          </div>
        )}
      </div>
      {eff.state === "clash" && eff.ref && <Faces ids={[eff.ref.who]} className="hidden" />}
    </li>
  )
}

function Chip({ children, onClick, muted }: { children: React.ReactNode; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs leading-5 transition-colors hover:border-foreground hover:bg-muted",
        muted ? "border-dashed text-muted-foreground" : "text-foreground",
      )}
    >
      {children}
    </button>
  )
}
