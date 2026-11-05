import { DAY_NAME, HANDLED, HANDOFFS, PEOPLE_C, PROJECTS_C, SCENES, TALKS, THREADS_C, callById, listNames, nameOf, type Call, type CallState, type Handoff, type Talk } from "./data"
import { useC, type Resolution } from "./state"

// What a call looks like right now, given the story and what you did in this visit.
//   open: yours to back at the check (the story's backed calls and guesses, before the check)
//   took: a clash you settled by taking the other person's call
//   talk: a clash that booked a talk, live or written, until the talk settles it
//   settled: a clash whose talk ended with one call backed by everyone in it
export type EffState = CallState | "open" | "took" | "talk" | "settled"
export type Eff = {
  call: Call
  // The call's text, with any correction made at the check. For a settled call, the outcome.
  text: string
  state: EffState
  why?: string
  // Who backed it, when it was not the sender (a receiver who built on a guess).
  by?: string
  // took / talk / clash / follows / precedent: the other call and who made it.
  ref?: { call: Call; handoff: Handoff; who: string; when: string; project?: string }
  talk?: Talk
}

// Four marks carry every state: filled (someone stands behind it), ringed (pre-filled from
// a backed call, yours or a teammate's), empty (a guess), triangle (contradicts a backed call).
export type Mark = "filled" | "ringed" | "empty" | "triangle"
export const MARK: Record<EffState, Mark> = {
  backed: "filled", settled: "filled", precedent: "ringed", follows: "ringed", took: "ringed", guess: "empty", open: "empty", clash: "triangle", talk: "triangle",
}
// The marks as characters, for a card in a tool that only has a comment box.
export const MARK_CHAR: Record<Mark, string> = { filled: "●", ringed: "◉", empty: "○", triangle: "▲" }
export const counts = (effs: Eff[]) => ({ backed: effs.filter((e) => MARK[e.state] !== "empty" && MARK[e.state] !== "triangle").length, total: effs.length })
export const guessesOf = (effs: Eff[]) => effs.filter((e) => e.state === "guess" || e.state === "open")

export type Session = {
  viewer: string
  scene: number
  backed: Record<string, Record<string, { who: string; why: string }>>
  renamed: Record<string, string>
  checked: Record<string, true>
  resolved: Record<string, Resolution>
  talks: Record<string, "live" | "done">
  shipped: Record<string, true>
  stances: Record<string, string>
}

// The sender's check is open while the share's scene is on and they have not finished it.
export const isLive = (h: Handoff, s: Session) => s.scene === h.at && s.viewer === h.from && !s.checked[h.id]

function refOf(c: Call) {
  if (!c.ref) return undefined
  const found = callById(c.ref.call)
  return found ? { call: found.call, handoff: found.handoff, who: c.ref.who, when: c.ref.when, project: c.ref.project } : undefined
}

export function effective(h: Handoff, s: Session): Eff[] {
  const live = isLive(h, s)
  const mine = s.backed[h.id] ?? {}
  // After your own check, only what you backed is backed; the rest travels as guesses.
  const yours = !!s.checked[h.id]
  return h.calls.map((c): Eff => {
    const ref = refOf(c)
    const text = s.renamed[c.id] ?? c.text
    const b = mine[c.id]
    if (b) return { call: c, text, state: "backed", why: b.why || undefined, by: b.who === h.from ? undefined : b.who, ref }
    if (c.state === "clash") {
      const r = s.resolved[c.id] ?? (live || yours ? undefined : c.resolved)
      if (r === "took") return { call: c, text, state: "took", why: ref?.call.why, ref }
      if (r === "talk") {
        const talk = TALKS.find((t) => t.id === c.talk)
        if (talk && talkPhase(talk, s) === "done" && talk.outcome && !talk.unsettled) return { call: c, text: talk.outcome.text, state: "settled", why: talk.outcome.why, ref, talk }
        return { call: c, text, state: "talk", why: c.why, ref, talk }
      }
      return { call: c, text, state: "clash", why: c.why, ref }
    }
    if (c.state === "precedent" || c.state === "follows") return { call: c, text, state: c.state, why: c.why ?? ref?.call.why, ref }
    if (live) return { call: c, text, state: "open" }
    if (yours) return { call: c, text, state: "guess" }
    if (c.state === "backed") return { call: c, text, state: "backed", why: c.why }
    return { call: c, text, state: "guess" }
  })
}

export function useEffective(h: Handoff) {
  const s = useC()
  return effective(h, s)
}

// Whose call a pre-filled or taken call points at, with the project when it is another one.
export function refLabel(e: Eff, viewer: string, project?: string) {
  if (!e.ref) return ""
  const whose = e.ref.who === viewer ? "your call" : `${nameOf(e.ref.who)}’s call`
  const other = e.ref.project && e.ref.project !== project ? PROJECTS_C.find((p) => p.id === e.ref!.project)?.name : undefined
  return `${other ? `${other} · ` : ""}${whose}, ${e.ref.when}`
}

// Who has read the card so far: people and their agents.
export const readersOf = (h: Handoff, scene: number) => (h.readers ?? []).filter((r) => r.at <= scene)

// The card as plain text, for any tool with a comment box.
export function asText(h: Handoff, effs: Eff[]) {
  const n = counts(effs)
  const lines = [`Whyspace · ${h.title} · ${n.backed} of ${n.total} backed · ${nameOf(h.from)} → ${listNames(h.to)}`]
  for (const e of effs) {
    let tail = ""
    if (e.state === "backed") tail = `${nameOf(e.by ?? h.from)}${e.why ? `: ${e.why}` : ""}`
    else if (e.state === "settled" && e.talk?.outcome) tail = `settled by ${listNames(e.talk.outcome.backedBy)}${e.why ? `: ${e.why}` : ""}`
    else if ((e.state === "precedent" || e.state === "follows" || e.state === "took") && e.ref) tail = `${nameOf(e.ref.who)}’s call, ${e.ref.when}${e.why ? `: ${e.why}` : ""}`
    else if (e.state === "talk" && e.talk) tail = e.talk.unsettled ? `unsettled · ${listNames(e.talk.people)}` : `talk · ${e.talk.mode === "written" ? `by ${e.talk.window}` : `${e.talk.day} ${e.talk.time}`} · ${listNames(e.talk.people)}`
    else if (e.state === "clash" && e.ref) tail = `clashes with ${nameOf(e.ref.who)}’s ${e.ref.call.text}`
    lines.push(`${MARK_CHAR[MARK[e.state]]} ${e.text}${tail ? ` — ${tail}` : ""}`)
  }
  return lines.join("\n")
}

// Handoffs that exist by this scene, newest first. Scene 0 is history.
export const handoffsBy = (scene: number) => HANDOFFS.filter((h) => h.at <= scene).sort((a, b) => b.at - a.at || b.time.localeCompare(a.time))
export const handoffsOfThread = (thread: string, scene: number) => handoffsBy(scene).filter((h) => h.thread === thread)
export const handoffsOfProject = (project: string, scene: number) => handoffsBy(scene).filter((h) => h.project === project)

export type TalkPhase = "booked" | "live" | "done"
export function talkPhase(t: Talk, s: { scene: number; talks: Record<string, "live" | "done"> }): TalkPhase | null {
  if (t.bookedAt > s.scene) return null
  const mine = s.talks[t.id]
  if (mine === "done") return "done"
  if (t.doneAt !== undefined && t.doneAt <= s.scene) return "done"
  if (mine === "live") return "live"
  if (t.liveAt !== undefined && t.liveAt <= s.scene) return "live"
  return "booked"
}
export const talksOfProject = (project: string, s: { scene: number; talks: Record<string, "live" | "done"> }) =>
  TALKS.filter((t) => t.project === project && talkPhase(t, s) !== null)

// Written talk: a person's stance, from the story by this scene or typed in this visit.
export const stanceOf = (t: Talk, who: string, s: Session) => {
  if (t.stances?.[who] !== undefined && t.stances[who] <= s.scene) return t.brief.find((b) => b.who === who)
  if (who === s.viewer && s.stances[t.id]) return { who, text: s.stances[t.id], why: "" }
  return undefined
}

// Today: what needs you, in the order you would do it.
export type Row =
  | { kind: "check"; handoff: Handoff; effs: Eff[] }
  | { kind: "talk"; talk: Talk; phase: "booked" | "live" }
  // A written talk waiting on your stance.
  | { kind: "stance"; talk: Talk }
  | { kind: "ships"; handoff: Handoff; guesses: Eff[] }
  // A guess of yours that others built on. Asked once.
  | { kind: "built"; handoff: Handoff; eff: Eff; by: { who: string; agent?: boolean }[] }

export function needsYou(s: Session): Row[] {
  const rows: Row[] = []
  for (const h of HANDOFFS) if (isLive(h, s)) rows.push({ kind: "check", handoff: h, effs: effective(h, s) })
  // A talk needs you when it is live or today. A written one needs you until your stance is in.
  const today = sceneOf(s.scene).day
  for (const t of TALKS) {
    const phase = talkPhase(t, s)
    if (phase === null || phase === "done" || !t.people.includes(s.viewer)) continue
    if (t.mode === "written") {
      if (!stanceOf(t, s.viewer, s)) rows.push({ kind: "stance", talk: t })
      continue
    }
    if (phase === "live" || t.day === today) rows.push({ kind: "talk", talk: t, phase })
  }
  for (const h of HANDOFFS) {
    if (h.from !== s.viewer || h.at > s.scene) continue
    const effs = effective(h, s)
    if (h.shipsAt === s.scene && !s.shipped[h.id]) {
      const guesses = guessesOf(effs)
      if (guesses.length) rows.push({ kind: "ships", handoff: h, guesses })
    }
    for (const e of effs) {
      const b = e.call.builtOn
      if (b && b.at <= s.scene && e.state === "guess" && !s.shipped[`built:${e.call.id}`]) rows.push({ kind: "built", handoff: h, eff: e, by: b.by })
    }
  }
  // Live talks first, then checks, then stances, then ships and built, then booked talks.
  const rank = (r: Row) => (r.kind === "talk" && r.phase === "live" ? 0 : r.kind === "check" ? 1 : r.kind === "stance" ? 2 : r.kind === "ships" || r.kind === "built" ? 3 : 4)
  return rows.sort((a, b) => rank(a) - rank(b))
}

// Handled: what settled without needing you, one line each, newest first. Today and yesterday;
// older lines live in the threads.
export type Line = {
  id: string
  at: number
  day: string
  time: string
  // Whose face starts the line. `who` is also named in the sentence ("Lena took…"); `face` is not.
  face?: string
  // The face is the person's agent.
  agent?: boolean
  who?: string
  // Text with the person already named, read as a sentence after their face.
  text: string
  dots?: EffState[]
  handoff?: Handoff
  talk?: Talk
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export function handled(s: Session): Line[] {
  const me = s.viewer
  const lines: Line[] = []
  for (const h of HANDOFFS) {
    if (h.at < 1 || h.at > s.scene || isLive(h, s)) continue
    if (h.from !== me && !h.to.includes(me)) continue
    const effs = effective(h, s)
    const n = counts(effs)
    lines.push({ id: `share-${h.id}`, at: h.at, day: h.day, time: h.time, who: h.from, text: `shared ${h.title} · ${n.backed} of ${n.total} backed`, dots: effs.map((e) => e.state), handoff: h })
  }
  for (const l of HANDLED) {
    if (l.at > s.scene || l.kind === "backed") continue
    const h = HANDOFFS.find((x) => x.id === l.handoff)
    const t = TALKS.find((x) => x.id === l.talk)
    const involved = l.who === me || (h && (h.from === me || h.to.includes(me))) || (t && t.people.includes(me))
    if (!involved) continue
    // Lines about a person's agent already name them ("Tom's Claude Code…"); for you they say "Your".
    const named = l.kind === "agent" || l.kind === "read"
    const text = named && l.who === me ? l.text.replace(new RegExp(`^${PEOPLE_C[me]?.name}[’']s`), "Your") : l.text
    lines.push({ id: l.id, at: l.at, day: l.day, time: l.time, face: named ? l.who : undefined, agent: named, who: named ? undefined : l.who, text, handoff: h, talk: t })
  }
  // A talk booked for later: one line, so you know it is coming.
  for (const t of TALKS) {
    if (t.bookedAt < 1 || talkPhase(t, s) !== "booked" || !t.people.includes(me) || t.mode === "written") continue
    const scene = SCENES.find((x) => x.id === t.bookedAt)
    lines.push({ id: `booked-${t.id}`, at: t.bookedAt, day: scene?.day ?? t.day, time: scene?.time ?? "", text: `${t.title} · ${t.minutes} min, ${t.day} ${t.time}${t.reason ? ` · ${t.reason}` : ""}`, talk: t })
  }
  // A written talk where your stance is in and the other's is not.
  for (const t of TALKS) {
    if (t.mode !== "written" || talkPhase(t, s) !== "done" && !stanceOf(t, me, s) || !t.people.includes(me) || talkPhase(t, s) === null) continue
    if (talkPhase(t, s) === "done") continue
    const waiting = t.people.filter((p) => !stanceOf(t, p, s))
    if (waiting.length === 0) continue
    const scene = SCENES.find((x) => x.id === t.bookedAt)
    lines.push({ id: `waiting-${t.id}`, at: t.bookedAt, day: scene?.day ?? t.day, time: scene?.time ?? "", text: `${t.title} · written · waiting on ${listNames(waiting)} · by ${t.window}`, talk: t })
  }
  for (const t of TALKS) {
    if (talkPhase(t, s) !== "done" || !t.people.includes(me)) continue
    const at = t.doneAt ?? s.scene
    const scene = SCENES.find((x) => x.id === at)
    if (t.outcome) lines.push({ id: `talk-${t.id}`, at, day: scene?.day ?? t.day, time: t.time, text: `${t.title} · ${t.outcome.text}${t.settledBy ? ` · ${nameOf(t.settledBy.who)} took ${nameOf(t.settledBy.took)}’s` : ""}`, talk: t })
    else if (t.unsettled) lines.push({ id: `talk-${t.id}`, at, day: scene?.day ?? t.day, time: t.time, text: `${t.title} · unsettled · ${listNames(t.people)}`, talk: t })
  }
  const idx = DAYS.indexOf(sceneOf(s.scene).day)
  const recent = new Set([DAYS[idx], DAYS[idx - 1]].filter(Boolean))
  return lines.filter((l) => recent.has(l.day)).sort((a, b) => b.at - a.at || b.time.localeCompare(a.time))
}

// The week so far, in four numbers. No ratio: counts belong to a piece of work, not to a person.
export function weekLine(s: Session) {
  const shared = HANDOFFS.filter((h) => h.at >= 1 && h.at <= s.scene)
  const clashes = shared.flatMap((h) => h.calls).filter((c) => c.state === "clash").length
  const talks = TALKS.filter((t) => t.bookedAt > 0 && talkPhase(t, s) === "done").length
  const shipped = HANDOFFS.filter((h) => h.shipsAt !== undefined && h.shipsAt <= s.scene).flatMap((h) => guessesOf(effective(h, s))).length
  return { shared: shared.length, clashes, talks, shipped }
}

// The sentence after a face in Handled, with "You" for the viewer.
export const subject = (who: string | undefined, me: string) => (who === undefined ? "" : who === me ? "You" : PEOPLE_C[who]?.name ?? who)

export const sceneOf = (id: number) => SCENES.find((s) => s.id === id) ?? SCENES[SCENES.length - 1]
export const dayLong = (day: string) => DAY_NAME[day] ?? day

// A thread's standing at this scene: how many calls, how many backed, across its handoffs.
export function threadStanding(thread: string, s: Session) {
  const effs = handoffsOfThread(thread, s.scene).flatMap((h) => effective(h, s))
  return { ...counts(effs), clashes: effs.filter((e) => e.state === "clash").length, handoffs: handoffsOfThread(thread, s.scene).length }
}

// Your backed calls, for the Duet: everything you stand behind, newest first.
export function callsBackedBy(who: string, s: Session) {
  const out: { eff: Eff; handoff: Handoff }[] = []
  for (const h of handoffsBy(s.scene)) {
    if (h.from !== who) continue
    for (const eff of effective(h, s)) if (eff.state === "backed" || eff.state === "precedent" || eff.state === "settled") out.push({ eff, handoff: h })
  }
  return out
}

export const threadColor = (id: string) => THREADS_C.find((t) => t.id === id)?.color ?? "#999"
