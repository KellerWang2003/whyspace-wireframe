import { useState, type ReactNode } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { cn } from "@/lib/utils"
import { caughtHere, checkRows, countsHere, firstName, markOfCaught, needsYou, otherOf, type Caught, type CaughtActions, type Layout } from "./overlay-model"

// The expanded pill, one hierarchy: line one says where you are (the overlay passes it as `header`);
// Needs you shows at most three rows, clashes first, one line and one or two actions each; Caught
// folds under it. The three layouts differ only in how a row carries its actions, so you can pick.

type Where = { project: string; part: string }
const MAX = 3

export function ExpandedPanel({ layout, all, act, where, header, check, onCheckDone, className }: {
  layout: Layout
  all: Caught[]
  act: CaughtActions
  where: Where
  header?: ReactNode
  // The check when you share: the ids it opened with, so rows stay while you tap them.
  check?: string[] | null
  onCheckDone?: () => void
  className?: string
}) {
  const [more, setMore] = useState(false)
  const [caughtOpen, setCaughtOpen] = useState(false)
  const needs = needsYou(all, where)
  const shown = more ? needs : needs.slice(0, MAX)
  const caught = caughtHere(all, where)

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {check ? (
          <CheckPanel ids={check} all={all} act={act} where={where} onDone={onCheckDone} />
        ) : (
          <>
            <section aria-label="Needs you">
              {needs.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Nothing needs you here.</p>}
              <ul className="flex flex-col gap-0.5">
                {shown.map((c) => <NeedsRow key={c.id} layout={layout} c={c} act={act} />)}
              </ul>
              {needs.length > MAX && (
                <button type="button" onClick={() => setMore((v) => !v)} className="mt-0.5 w-full rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
                  {more ? "Fewer" : `${needs.length - MAX} more`}
                </button>
              )}
            </section>

            <section aria-label="Caught this session" className="mt-2">
              <button type="button" aria-expanded={caughtOpen} onClick={() => setCaughtOpen((v) => !v)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex-1 text-left font-medium">Caught</span>
                <span className="tabular-nums text-muted-foreground">{caught.length}</span>
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", caughtOpen && "rotate-180")} />
              </button>
              <div inert={!caughtOpen} className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]", caughtOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="min-h-0 overflow-hidden">
                  {caught.length ? <ul className="flex flex-col gap-0.5 pb-1">{caught.map((c) => <CaughtRow key={c.id} c={c} act={act} />)}</ul> : <p className="px-2 pb-2 text-xs text-muted-foreground">Nothing yet</p>}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// One line, one or two actions. Tap the line to read the other person's why, or where a guess came from.
function NeedsRow({ layout, c, act }: { layout: Layout; c: Caught; act: CaughtActions }) {
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState<"why" | "reason" | null>(null)
  const other = otherOf(c)
  const who = other ? firstName(other.owner) : ""
  const mark = <MarkIcon mark={markOfCaught(c)} className="size-3.5 shrink-0" />
  const take = () => act.takeTheirs(c.id)
  const chips = c.kind === "clash"
    ? [<Act key="take" primary onClick={take}>Take {who}’s</Act>, <Act key="keep" onClick={() => setTyping("reason")}>Keep mine</Act>]
    : [...(layout === "right" ? (c.hints ?? []).slice(0, 1) : c.hints ?? []).map((h) => <Act key={h} onClick={() => act.confirm(c.id, h)}>{h}</Act>), <Act key="why" muted onClick={() => setTyping("why")}>Why{layout === "right" ? "" : "…"}</Act>]
  const detail = other
    ? <><span className="text-foreground">{who}</span> confirmed “{other.title}”{other.why ? ` · ${other.why}` : ""}</>
    : c.source
  const input = typing && (
    <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const v = String(f.get("v") ?? "").trim(); if (!v) return; if (typing === "why") act.confirm(c.id, v); else act.keepMine(c.id, v); setTyping(null) }}>
      <Input autoFocus name="v" aria-label={typing === "why" ? "Why" : "Why keep yours"} placeholder={typing === "why" ? "Why?" : "Why keep yours?"} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(null) } }} className="h-7 min-w-0 flex-1 text-xs" />
      <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
    </form>
  )

  if (layout === "panes") {
    return (
      <li className="overflow-hidden rounded-lg border bg-background text-xs">
        <div className="grid grid-cols-2">
          <div className="flex flex-col gap-1 p-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{mark}You</span>
            <p className="leading-snug font-medium">{c.title}</p>
          </div>
          <div className="flex flex-col gap-1 border-l bg-muted/50 p-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {other ? <><PersonAvatar id={other.owner} className="size-3.5" />{who}</> : "Heard"}
            </span>
            {other ? <>
              <p className="leading-snug">{other.title}</p>
              {other.why && <p className="leading-snug text-muted-foreground">{other.why}</p>}
            </> : <p className="leading-snug text-muted-foreground">{c.source}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-t p-1.5">{input ?? chips}</div>
      </li>
    )
  }

  if (layout === "inline") {
    return (
      <li className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-foreground/5">
        <span className="mt-[3px]">{mark}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-left text-xs leading-snug font-medium">{c.title}</button>
          {open && <p className="text-[11px] leading-snug text-muted-foreground">{detail}</p>}
          {input ?? <div className="flex flex-wrap gap-1">{chips}</div>}
        </div>
      </li>
    )
  }

  return (
    <li className="rounded-md px-2 py-1.5 hover:bg-foreground/5">
      <div className="flex items-center gap-2">
        {mark}
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 truncate text-left text-xs font-medium" title={c.title}>{c.title}</button>
        {!input && <span className="flex shrink-0 gap-1">{chips}</span>}
      </div>
      {open && <p className="mt-1 pl-[22px] text-[11px] leading-snug text-muted-foreground">{detail}</p>}
      {input && <div className="mt-1.5 pl-[22px]">{input}</div>}
    </li>
  )
}

// A decision caught this session: its mark, your words, your why. Tap a why-less one to add a why.
function CaughtRow({ c, act }: { c: Caught; act: CaughtActions }) {
  const [typing, setTyping] = useState(false)
  return (
    <li className="group rounded-md px-2 py-1.5 hover:bg-foreground/5">
      <div className="flex items-center gap-2">
        <MarkIcon mark={markOfCaught(c)} className="size-3.5 shrink-0" />
        <button type="button" onClick={() => !c.why && !c.reason && setTyping(true)} className="min-w-0 flex-1 truncate text-left text-xs" title={c.title}>
          {c.title}{(c.why || c.reason) && <span className="text-muted-foreground"> · {c.reason ?? c.why}</span>}
        </button>
        <button type="button" aria-label={`Remove: ${c.title}`} onClick={() => act.remove(c.id)} className="rounded-sm p-0.5 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"><X className="size-3" /></button>
      </div>
      {typing && (
        <form className="mt-1.5 flex items-center gap-1 pl-[22px]" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) act.addWhy(c.id, v); setTyping(false) }}>
          <Input autoFocus name="v" aria-label="Why" placeholder="Why?" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(false) } }} className="h-7 min-w-0 flex-1 text-xs" />
          <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
        </form>
      )}
    </li>
  )
}

// The check when you share: the guesses still in the work, your words as chips. Nothing blocks.
export function CheckPanel({ ids, all, act, where, onDone }: { ids: string[]; all: Caught[]; act: CaughtActions; where: Where; onDone?: () => void }) {
  const rows = ids.map((id) => all.find((c) => c.id === id)).filter((c): c is Caught => !!c)
  const { n, m } = countsHere(all, where)
  const fresh = checkRows(all, where).length
  return (
    <section aria-label="Check" className="flex flex-col gap-3 p-2">
      <p className="text-xs text-muted-foreground">{rows.length ? `${fresh} ${fresh === 1 ? "guess is" : "guesses are"} still in it. Tap your words to confirm one.` : "Nothing new since your last share."}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((c) => <CheckRow key={c.id} c={c} act={act} />)}
      </ul>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">{n} of {m} confirmed</span>
        <Button size="sm" className="h-7 text-xs" onClick={() => { act.finishCheck(ids); onDone?.() }}>Done</Button>
      </div>
    </section>
  )
}

function CheckRow({ c, act }: { c: Caught; act: CaughtActions }) {
  const [typing, setTyping] = useState(false)
  const done = c.kind === "conf"
  return (
    <li className="flex items-start gap-2">
      <MarkIcon mark={markOfCaught(c)} className="mt-[3px] size-3.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-xs leading-snug font-medium">{c.title}</p>
        {done ? <p className="text-[11px] text-muted-foreground">{c.why}</p> : typing ? (
          <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) act.confirm(c.id, v); setTyping(false) }}>
            <Input autoFocus name="v" aria-label="Why" placeholder="Why?" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(false) } }} className="h-7 min-w-0 flex-1 text-xs" />
            <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(c.hints ?? []).map((h) => <Act key={h} onClick={() => act.confirm(c.id, h)}>{h}</Act>)}
            <Act muted onClick={() => setTyping(true)}>Why…</Act>
          </div>
        )}
      </div>
    </li>
  )
}

// A small action: a chip in your words, a Take/Keep button, or a muted "Why".
function Act({ primary, muted, onClick, children }: { primary?: boolean; muted?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] leading-4 transition-colors",
        primary ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : muted ? "border-dashed text-muted-foreground hover:border-foreground hover:text-foreground" : "hover:border-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
