import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import { DECISIONS, LINKS, PEOPLE, decisionById, type Decision, type Status } from "@/data"
import { MARK_OF } from "@/lib/marks"
import { navigate } from "@/lib/router"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { dayOf } from "@/playground/model"
import { createSim, makeRoom, seat, tick, type Sim, type SimLink, type SimNode, type SimOptions } from "./graph-layout"
import { ThreadIcon } from "./thread-ui"
import { useThreads, type Thread } from "./threads"

// Decisions as a network. Each decision is a card, all one size; lines show what builds on what, and the layout
// settles like a net, so the decisions much else rests on sit where the lines meet. Decisions gather on soft areas
// of paper by thread or by who decided them, or not at all.
// Drag a decision and what it's wired to follows. Drag the background to pan; pinch or ⌘-scroll to zoom. Hover to
// see what a decision touches; click to open it.

export type MapGroup = "thread" | "person" | "none"
// Every decision is a card this size: its mark and up to three lines of its title.
const CARD = { w: 184, h: 68, round: 14 }
type Role = "main" | "linked" | "ghost"
// One area: the decisions of a thread, or of the people who decided them.
type Group = { key: string; name: string; thread?: Thread; people?: string[] }
// The room a decision takes, for where lines start and stop: a rounded box around the middle.
type Foot = { hw: number; hh: number; round: number }
// reach: about how far from the middle a line ends. box: the room it takes (left, right, top, bottom).
type Base = { id: string; r: number; reach: number; label: string; box: [number, number, number, number]; foot: Foot }
type GNode =
  | (Base & { kind: "decision"; d: Decision; role: Role; status: Status; rank: number; group?: string })
  | (Base & { kind: "anchor"; group: Group })
type EdgeKind = "builds" | "replaced" | "clash" | "home"
type Edge = { s: string; t: string; kind: EdgeKind }
type Graph = { nodes: GNode[]; edges: Edge[] }
type Point = { x: number; y: number }
type Pos = Record<string, Point>
type View = { x: number; y: number; k: number }
type Box = { l: number; r: number; t: number; b: number }

const dateOf = (d: Decision) => dayOf(d.when) ?? dayOf(d.due) ?? Infinity
// A decision's card and the room it takes.
const card = (label: string): Omit<Base, "id"> => ({
  r: 12,
  reach: (CARD.w + CARD.h) / 4,
  label,
  box: [CARD.w / 2, CARD.w / 2, CARD.h / 2, CARD.h / 2],
  foot: { hw: CARD.w / 2, hh: CARD.h / 2, round: CARD.round },
})

const byName = (name: string) => Object.values(PEOPLE).find((p) => p.name.toLowerCase() === name || p.name.split(" ")[0].toLowerCase() === name)?.id
// Who made a decision: the names in `by`, or its owner.
function deciders(d: Decision) {
  const ids = (d.by ?? "").toLowerCase().split(/,| and /).map((s) => byName(s.trim())).filter((x): x is string => !!x)
  return ids.length ? [...new Set(ids)] : [d.owner]
}
const together = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)

function buildGraph(by: MapGroup, decisions: Decision[], thread: Thread | undefined, threads: Thread[], statusOf: (d: Decision) => Status): Graph {
  const items: { d: Decision; role: Role }[] = decisions.map((d) => ({ d, role: "main" }))
  const ids = new Set(decisions.map((d) => d.id))
  // On a thread page: what it builds on, and what builds on it, in other threads.
  if (thread) {
    const other = LINKS.filter(([a, b]) => ids.has(a) !== ids.has(b)).map(([a, b]) => (ids.has(a) ? b : a))
    for (const d of DECISIONS) if (d.project === decisions[0]?.project && other.includes(d.id) && !ids.has(d.id)) items.push({ d, role: "linked" })
  }
  // What a decision replaced, faded, wired to what replaced it.
  for (const { d } of [...items]) {
    const was = d.replaces ? decisionById(d.replaces) : undefined
    if (was && !items.some((i) => i.d.id === was.id)) items.push({ d: was, role: "ghost" })
  }
  const order = (part: string) => threads.findIndex((t) => t.part === part)
  items.sort((a, b) => order(a.d.part) - order(b.d.part) || dateOf(a.d) - dateOf(b.d))
  const has = (id?: string) => !!id && items.some((i) => i.d.id === id)

  const edges: Edge[] = [
    ...LINKS.filter(([a, b]) => has(a) && has(b)).map(([a, b]) => ({ s: `d:${a}`, t: `d:${b}`, kind: "builds" as const })),
    ...items.filter((i) => has(i.d.replaces)).map((i) => ({ s: `d:${i.d.replaces}`, t: `d:${i.d.id}`, kind: "replaced" as const })),
    ...items.filter((i) => has(i.d.clashes)).map((i) => ({ s: `d:${i.d.clashes}`, t: `d:${i.d.id}`, kind: "clash" as const })),
  ]

  // Its day, as a column: always right of what it builds on. The layout leans on it to untangle.
  const days = [...new Set(items.map((i) => dateOf(i.d)))].sort((a, b) => a - b)
  const before = new Map<string, string[]>()
  for (const e of edges) before.set(e.t, [...(before.get(e.t) ?? []), e.s])
  const ranks = new Map<string, number>()
  const rankOf = (id: string, trail = new Set<string>()): number => {
    const known = ranks.get(id)
    if (known !== undefined) return known
    trail.add(id)
    let rank = days.indexOf(dateOf(items.find((i) => `d:${i.d.id}` === id)!.d))
    for (const b of before.get(id) ?? []) if (!trail.has(b)) rank = Math.max(rank, rankOf(b, trail) + 1)
    ranks.set(id, rank)
    return rank
  }

  // Its area. Without areas the net still gathers each thread's decisions a little.
  const groups = new Map<string, Group>()
  const groupOf = (d: Decision): Group | undefined => {
    if (by === "person") {
      const people = deciders(d)
      return { key: `p:${[...people].sort().join("+")}`, name: together(people.map((p) => PEOPLE[p]?.name ?? p)), people }
    }
    const t = threads.find((x) => x.part === d.part)
    return t && { key: `t:${t.part}`, name: t.name, thread: t }
  }

  const nodes: GNode[] = items.map(({ d, role }) => {
    const id = `d:${d.id}`
    const group = groupOf(d)
    if (group && !groups.has(group.key)) groups.set(group.key, group)
    return { id, kind: "decision", d, role, status: role === "ghost" ? d.status : statusOf(d), rank: rankOf(id), group: group?.key, ...card(d.title) }
  })
  // Each area pulls its decisions together through an invisible anchor.
  for (const g of groups.values()) nodes.push({ id: g.key, kind: "anchor", group: g, r: 0, reach: 0, label: g.name, box: [0, 0, 0, 0], foot: { hw: 0, hh: 0, round: 0 } })
  for (const n of [...nodes]) if (n.kind === "decision" && n.group) edges.push({ s: n.group, t: n.id, kind: "home" })
  return { nodes, edges }
}

// How the layout pulls: [length, strength] per kind of line. With areas, decisions hold to their area more than
// to each other, and areas keep apart.
const LINK: Record<"net" | "areas", Record<EdgeKind, [number, number]>> = {
  net: { builds: [185, 0.45], replaced: [160, 0.5], clash: [180, 0.35], home: [0, 0.05] },
  areas: { builds: [170, 0.08], replaced: [130, 0.2], clash: [170, 0.06], home: [0, 0.5] },
}
const FORCES: Record<"net" | "areas", SimOptions> = {
  net: { gravity: 0.045, wide: 2.8, apart: 1 },
  areas: { gravity: 0.04, wide: 1.8, apart: 2.6 },
}
const CHARGE = -1400
// One day's column, the pull that untangles the net before it relaxes: a card's width and some room.
const STEP = CARD.w + 50

const boxOf = (n: GNode): SimNode["box"] => n.box

// The sim. `start` carries positions over (a drag); `lean` turns on the pull toward each day's column; `turn` turns
// the starting spiral, so a few tries start differently.
function simOf(by: MapGroup, graph: Graph, start: Pos | null, lean: boolean, turn = 0): Sim {
  const areas = by !== "none"
  const turned = (p: Point) => ({ x: p.x * Math.cos(turn) - p.y * Math.sin(turn), y: p.x * Math.sin(turn) + p.y * Math.cos(turn) })
  const index = new Map(graph.nodes.map((n, i) => [n.id, i]))
  const ranks = graph.nodes.flatMap((n) => (n.kind === "decision" ? [n.rank] : []))
  const mid = (Math.min(...ranks) + Math.max(...ranks)) / 2
  // Decisions start along their days; an anchor starts among its decisions.
  const seats = new Map<string, Point>()
  graph.nodes.forEach((n, i) => {
    if (n.kind !== "decision") return
    const s = turned(seat(i, 34))
    seats.set(n.id, { x: (n.rank - mid) * STEP + s.x * 0.4, y: s.y })
  })
  graph.nodes.forEach((n, i) => {
    if (n.kind === "decision") return
    const near = graph.edges.filter((e) => e.s === n.id).map((e) => seats.get(e.t)).filter((p): p is Point => !!p)
    const c = near.length ? { x: near.reduce((a, p) => a + p.x, 0) / near.length, y: near.reduce((a, p) => a + p.y, 0) / near.length } : { x: 0, y: 0 }
    const s = turned(seat(i, 20))
    seats.set(n.id, { x: c.x + s.x, y: c.y * 1.4 + s.y })
  })

  const nodes: SimNode[] = graph.nodes.map((n) => {
    const p = start?.[n.id] ?? seats.get(n.id)!
    // Every node gets every field, so the sim's loops see one shape of object and stay fast.
    const node: SimNode = { x: p.x, y: p.y, vx: 0, vy: 0, fx: undefined, fy: undefined, charge: 0, tx: undefined, sx: 0, box: boxOf(n), layer: 0, group: undefined }
    // An anchor is invisible: it gathers its decisions and bumps into nothing.
    if (n.kind === "anchor") {
      node.layer = -1
      if (areas) node.group = n.id
    } else {
      node.charge = (CHARGE * n.r) / 9
      if (areas) node.group = n.group
      if (lean) { node.tx = (n.rank - mid) * STEP; node.sx = 0.2 }
    }
    return node
  })
  const links: SimLink[] = graph.edges.map((e) => {
    const [length, strength] = LINK[areas ? "areas" : "net"][e.kind]
    const s = graph.nodes[index.get(e.s)!], t = graph.nodes[index.get(e.t)!]
    return { s: index.get(e.s)!, t: index.get(e.t)!, length: length + (s.reach + t.reach) / 2, strength }
  })
  return createSim(nodes, links, FORCES[areas ? "areas" : "net"])
}

// The sim while a decision is dragged: only it and what it's wired to move, on lines that keep the length they had,
// so the net stretches around the drag instead of laying itself out again.
function stretchOf(by: MapGroup, graph: Graph, pos: Pos, id: string): Sim {
  const sim = simOf(by, graph, pos, false)
  const near = new Set([id, ...graph.edges.flatMap((e) => (e.s === id ? [e.t] : e.t === id ? [e.s] : []))])
  sim.gravity = 0
  sim.nodes.forEach((n, i) => {
    n.charge = 0
    if (!near.has(graph.nodes[i].id)) { n.fx = n.x; n.fy = n.y }
  })
  for (const l of sim.links) {
    const a = sim.nodes[l.s], b = sim.nodes[l.t]
    l.length = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
    l.strength = Math.max(l.strength, 0.3)
  }
  return sim
}

const snapshot = (graph: Graph, sim: Sim): Pos => Object.fromEntries(graph.nodes.map((n, i) => [n.id, { x: sim.nodes[i].x, y: sim.nodes[i].y }]))

// Layouts already worked out, so coming back to a view (or React drawing twice) doesn't lay it out again.
const layouts = new Map<string, Pos>()

// The first layout: untangle along the days, then let go so it relaxes into a net. It starts a few ways and keeps
// the tidiest.
function settled(by: MapGroup, graph: Graph): Pos {
  const key = `${by}|${graph.nodes.map((n) => n.id).join(",")}|${graph.edges.map((e) => `${e.kind}:${e.s}>${e.t}`).join(",")}`
  const known = layouts.get(key)
  if (known) return known
  let best: { pos: Pos; score: number } | null = null
  for (let v = 0; v < 12; v++) {
    const sim = simOf(by, graph, null, true, (v * Math.PI) / 6)
    for (let i = 0; i < 380; i++) {
      if (i === 170) for (const n of sim.nodes) n.tx = undefined
      tick(sim)
    }
    const pos = snapshot(graph, sim)
    const score = untidiness(by, graph, pos)
    if (!best || score < best.score) best = { pos, score }
  }
  layouts.set(key, best!.pos)
  if (layouts.size > 24) layouts.delete(layouts.keys().next().value!)
  return best!.pos
}

// Whether the line from a to b passes through the box.
function hits(a: Point, b: Point, l: number, r: number, t: number, bottom: number) {
  let u0 = 0, u1 = 1
  const dx = b.x - a.x, dy = b.y - a.y
  for (const [p, q] of [[-dx, a.x - l], [dx, r - a.x], [-dy, a.y - t], [dy, bottom - a.y]]) {
    if (p === 0) {
      if (q < 0) return false
      continue
    }
    const u = q / p
    if (p < 0) u0 = Math.max(u0, u)
    else u1 = Math.min(u1, u)
    if (u0 > u1) return false
  }
  return true
}

// How messy a layout reads, lower is tidier: lines that cross, lines that run under someone else's label or an
// area's name, lines that leave a decision almost together, areas that would overlap, and a shape far from the tray's.
function untidiness(by: MapGroup, graph: Graph, pos: Pos) {
  const lines = graph.edges.filter((e) => e.kind !== "home")
  const decisions = graph.nodes.flatMap((n) => (n.kind === "decision" ? [n] : []))
  let score = 0
  lines.forEach((e, i) => {
    const a = pos[e.s], b = pos[e.t]
    for (const f of lines.slice(i + 1)) {
      const shared = [f.s, f.t].find((id) => id === e.s || id === e.t)
      if (shared) {
        const o = pos[shared], p = pos[e.s === shared ? e.t : e.s], q = pos[f.s === shared ? f.t : f.s]
        const angle = Math.atan2(cross(o, p, q), (p.x - o.x) * (q.x - o.x) + (p.y - o.y) * (q.y - o.y))
        if (Math.abs(angle) < 0.25) score += 1
        continue
      }
      const c = pos[f.s], d = pos[f.t]
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) score += 1
    }
    // Along the line as drawn (bent), in a few straight steps.
    const c = controlOf(e, a, b)
    const steps = Array.from({ length: 7 }, (_, k) => {
      const u = k / 6
      return { x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y }
    })
    for (const n of decisions) {
      if (n.id === e.s || n.id === e.t) continue
      const p = pos[n.id], [bl, br, bt, bb] = boxOf(n)
      if (steps.some((m, k) => k > 0 && hits(steps[k - 1], m, p.x - bl + 6, p.x + br - 6, p.y - bt, p.y + bb))) score += 2.5
    }
  })
  if (by !== "none") {
    for (const { name } of areasOf(graph, pos)) for (const e of lines) if (hits(pos[e.s], pos[e.t], name.l, name.r, name.t - 2, name.b + 2)) score += 1.5
    decisions.forEach((n, i) => {
      for (const m of decisions.slice(i + 1)) {
        if (n.group === m.group) continue
        const p = pos[n.id], q = pos[m.id], [nl, nr, nt, nb] = boxOf(n), [ml, mr, mt, mb] = boxOf(m)
        const room = 2 * PAD + 10
        if (p.x - nl < q.x + mr + room && q.x - ml < p.x + nr + room && p.y - nt < q.y + mb + room && q.y - mt < p.y + nb + room) score += 1
      }
    })
  }
  const box = bounds(graph, pos, [])
  const w = box.r - box.l, h = box.b - box.t
  return score + 2 * Math.abs(Math.log(w / h / 1.6)) + Math.max(0, (w - 1040) / 200) + Math.max(0, (h - 620) / 150)
}

function bounds(graph: Graph, pos: Pos, areas: Area[]) {
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity
  for (const n of graph.nodes) {
    const p = pos[n.id]
    if (!p || n.kind === "anchor") continue
    const [bl, br, bt, bb] = boxOf(n)
    l = Math.min(l, p.x - bl); r = Math.max(r, p.x + br); t = Math.min(t, p.y - bt); b = Math.max(b, p.y + bb)
  }
  for (const a of areas) { l = Math.min(l, a.l); r = Math.max(r, a.r); t = Math.min(t, a.t); b = Math.max(b, a.b) }
  return { l, r, t, b }
}

function fit(size: { w: number; h: number }, b: ReturnType<typeof bounds>): View {
  const k = Math.min(1, Math.max(0.6, Math.min((size.w - 48) / (b.r - b.l), (size.h - 48) / (b.b - b.t))))
  return { k, x: size.w / 2 - (k * (b.l + b.r)) / 2, y: size.h / 2 - (k * (b.t + b.b)) / 2 }
}

// An area: a soft patch around its decisions (their outline, rounded), its name on top.
// lead: the decision right under the name; name: where the name sits.
type Area = Box & { group: Group; anchor: string; path: string; top: Point; lead: string; name: Box }
const PAD = 20
function cross(o: Point, a: Point, b: Point) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x) }
function outline(points: Point[]) {
  const ps = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const half = (list: Point[]) => {
    const out: Point[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(ps), ...half([...ps].reverse())]
}
function areasOf(graph: Graph, pos: Pos): Area[] {
  return graph.nodes.flatMap((a) => {
    if (a.kind !== "anchor") return []
    const corners: Point[] = []
    let lead = "", high = Infinity
    for (const n of graph.nodes) {
      if (n.kind !== "decision" || n.group !== a.id) continue
      const p = pos[n.id]
      const [bl, br, bt, bb] = boxOf(n)
      // Room above the top decision for the area's name.
      const l = p.x - bl - PAD, r = p.x + br + PAD, t = p.y - bt - PAD - 22, b = p.y + bb + PAD
      corners.push({ x: l, y: t }, { x: r, y: t }, { x: l, y: b }, { x: r, y: b })
      if (t < high) { high = t; lead = n.id }
    }
    const hull = outline(corners)
    // Rounded: each corner of the outline becomes a curve between the middles of its two sides, pushed out a
    // little so the curve still clears what's inside.
    const mids = hull.map((p, i) => {
      const q = hull[(i + 1) % hull.length]
      return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
    })
    const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length, cy = hull.reduce((s, p) => s + p.y, 0) / hull.length
    const out = (p: Point) => ({ x: cx + (p.x - cx) * 1.06, y: cy + (p.y - cy) * 1.06 })
    const path = mids.map((m, i) => {
      const c = out(hull[(i + 1) % hull.length]), next = mids[(i + 1) % mids.length]
      return `${i === 0 ? `M${m.x},${m.y} ` : ""}Q${c.x},${c.y} ${next.x},${next.y}`
    }).join(" ") + " Z"
    const xs = hull.map((p) => p.x), ys = hull.map((p) => p.y)
    const t = Math.min(...ys)
    const topXs = hull.filter((p) => p.y - t < 4).map((p) => p.x)
    const top = { x: (Math.min(...topXs) + Math.max(...topXs)) / 2, y: t }
    const w = 32 + Math.max(0, (a.group.people?.length ?? 1) - 1) * 12 + a.group.name.length * 6.6
    const name = { l: top.x - w / 2, r: top.x + w / 2, t: top.y + 10, b: top.y + 32 }
    return [{ group: a.group, anchor: a.id, path, top, lead, name, l: Math.min(...xs), r: Math.max(...xs), t, b: Math.max(...ys) }]
  })
}

// Where a line bends: a little to one side, so the net reads drawn. A replaced one runs straight.
const controlOf = (e: Edge, p: Point, q: Point) => {
  const bend = e.kind === "builds" || e.kind === "clash" ? 0.14 : 0
  return { x: (p.x + q.x) / 2 - (q.y - p.y) * bend, y: (p.y + q.y) / 2 + (q.x - p.x) * bend }
}

const footOf = (n: GNode): Foot => n.foot
// Inside a decision's room; the one under an area's name counts the name too, so a line into it stops at the name.
const within = (pt: Point, c: Point, f: Foot, pad: number, name?: Box) => {
  const dx = pt.x - c.x, dy = pt.y - c.y
  if (name && pt.x >= name.l - 3 && pt.x <= name.r + 3 && pt.y >= name.t - 3 && pt.y <= name.b + 3) return true
  // How far outside the rounded box the point is (negative inside).
  const qx = Math.abs(dx) - (f.hw - f.round), qy = Math.abs(dy) - (f.hh - f.round)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - f.round <= pad
}

// A line from one decision to another, with an arrowhead where one builds on the other.
function EdgeLine({ e, p, q, fp, fq, np, nq, state }: { e: Edge; p: Point; q: Point; fp: Foot; fq: Foot; np?: Box; nq?: Box; state: "lit" | "dim" | "rest" }) {
  const rest = e.kind === "clash" ? 0.8 : 0.32
  const opacity = state === "dim" ? rest * 0.25 : state === "lit" ? Math.min(0.9, rest * 2.4) : rest
  const color = e.kind === "clash" ? "var(--destructive)" : "currentColor"
  const c = controlOf(e, p, q)
  // A point on the curve from p (u = 0) to q (u = 1) through c; at (u, v) it's the control point of the piece between.
  const at = (u: number, v = u) => ({
    x: (1 - u) * (1 - v) * p.x + ((1 - u) * v + u * (1 - v)) * c.x + u * v * q.x,
    y: (1 - u) * (1 - v) * p.y + ((1 - u) * v + u * (1 - v)) * c.y + u * v * q.y,
  })
  // The curve starts where it leaves p's mark or label and ends where it meets q's, so it never runs under a label.
  const edge = (inside: (u: number) => boolean, from: number, to: number) => {
    const steps = 48
    let a = from
    for (let i = 1; i <= steps; i++) {
      const u = from + ((to - from) * i) / steps
      if (inside(u)) break
      a = u
    }
    let b = Math.min(1, Math.max(0, a + (to - from) / steps))
    for (let i = 0; i < 8; i++) {
      const m = (a + b) / 2
      if (inside(m)) b = m
      else a = m
    }
    return a
  }
  const u1 = edge((u) => within(at(u), p, fp, 4, np), 1, 0)
  const u2 = edge((u) => within(at(u), q, fq, 5, nq), 0, 1)
  if (u1 >= u2) return null
  const s = at(u1), t = at(u2), m = at(u1, u2)
  const angle = Math.atan2(t.y - m.y, t.x - m.x)
  const head = (side: number) => `${t.x - 7 * Math.cos(angle + side * 0.45)},${t.y - 7 * Math.sin(angle + side * 0.45)}`
  return (
    <g style={{ opacity, transition: "opacity 150ms" }}>
      <path d={`M${s.x},${s.y} Q${m.x},${m.y} ${t.x},${t.y}`} fill="none" stroke={color} strokeWidth={1.25} strokeDasharray={e.kind === "replaced" ? "3 3.5" : undefined} strokeLinecap="round" />
      {e.kind !== "clash" && <path d={`M${head(1)} L${t.x},${t.y} L${head(-1)}`} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  )
}

export function DecisionMap({ projectId, decisions, thread, group: by = "thread", onOpen }: { projectId: string; decisions: Decision[]; thread?: Thread; group?: MapGroup; onOpen: (d: Decision) => void }) {
  const threads = useThreads(projectId)
  const statusOf = useStatusOf()
  const graph = buildGraph(by, decisions, thread, threads, statusOf)
  const key = `${by}|${graph.nodes.map((n) => n.id).join(",")}|${graph.edges.map((e) => `${e.s}>${e.t}`).join(",")}`

  const [layout, setLayout] = useState(() => ({ key, pos: settled(by, graph), view: null as View | null }))
  if (layout.key !== key) setLayout({ key, pos: settled(by, graph), view: null })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<string | null>(null)
  const [panning, setPanning] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const live = useRef<{ sim: Sim; raf: number; id: string } | null>(null)
  const gesture = useRef<{ kind: "pan" | "node"; id?: string; x: number; y: number; off: Point; view: View; moved: boolean } | null>(null)
  const swallowClick = useRef(false)

  const pos = layout.pos
  const areas = by !== "none" ? areasOf(graph, pos) : []
  const names = new Map(areas.map((a) => [a.lead, a.name]))
  const view = layout.view ?? (size.w ? fit(size, bounds(graph, pos, areas)) : { x: 0, y: 0, k: 1 })
  const setView = (v: View) => setLayout((s) => ({ ...s, view: v }))
  const { x: vx, y: vy, k: vk } = view

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => { if (live.current) cancelAnimationFrame(live.current.raf) }, [])

  // Two-finger scroll pans; pinch (or ⌘/Ctrl + scroll) zooms around the pointer.
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const px = e.clientX - rect.left, py = e.clientY - rect.top
        const k = Math.min(2.4, Math.max(0.35, vk * Math.exp(-Math.max(-40, Math.min(40, e.deltaY)) * 0.012)))
        setLayout((s) => ({ ...s, view: { k, x: px - ((px - vx) / vk) * k, y: py - ((py - vy) / vk) * k } }))
      } else {
        setLayout((s) => ({ ...s, view: { k: vk, x: vx - e.deltaX, y: vy - e.deltaY } }))
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [vx, vy, vk])

  const world = (e: { clientX: number; clientY: number }) => {
    const rect = boxRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left - view.x) / view.k, y: (e.clientY - rect.top - view.y) / view.k }
  }

  // Dragging a decision stretches the net around it: what it's wired to follows, everything else stays put.
  const wake = (id: string) => {
    if (live.current?.id === id) return live.current
    if (live.current) cancelAnimationFrame(live.current.raf)
    const sim = stretchOf(by, graph, pos, id)
    sim.alpha = 0.3
    sim.target = 0.3
    const run = { sim, raf: 0, id }
    const loop = () => {
      tick(sim)
      setLayout((s) => ({ ...s, pos: snapshot(graph, sim) }))
      if (sim.target > 0 || sim.alpha > 0.004) run.raf = requestAnimationFrame(loop)
      else live.current = null
    }
    run.raf = requestAnimationFrame(loop)
    live.current = run
    return run
  }

  const down = (e: ReactPointerEvent, id?: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    // Where the decision sits relative to the pointer, so it moves with the hand instead of jumping to it.
    const w = world(e), p = id ? pos[id] : undefined
    gesture.current = { kind: id ? "node" : "pan", id, x: e.clientX, y: e.clientY, off: p ? { x: p.x - w.x, y: p.y - w.y } : { x: 0, y: 0 }, view, moved: false }
  }
  const move = (e: ReactPointerEvent) => {
    const g = gesture.current
    if (!g) return
    const dx = e.clientX - g.x, dy = e.clientY - g.y
    if (!g.moved && Math.hypot(dx, dy) < 4) return
    if (!g.moved) {
      g.moved = true
      // Hold the camera still while the net moves.
      if (!layout.view) setView(view)
      if (g.kind === "pan") setPanning(true)
      else setDragging(g.id ?? null)
    }
    if (g.kind === "pan") return setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy })
    const run = wake(g.id!)
    const i = graph.nodes.findIndex((n) => n.id === g.id)
    const w = world(e)
    run.sim.nodes[i].fx = w.x + g.off.x
    run.sim.nodes[i].fy = w.y + g.off.y
  }
  const up = () => {
    const g = gesture.current
    gesture.current = null
    setPanning(false)
    setDragging(null)
    if (!g?.moved || g.kind !== "node") return
    swallowClick.current = true
    const run = live.current
    if (!run) return
    // It stays where it's put; whatever it was dropped on makes room.
    makeRoom(run.sim, graph.nodes.findIndex((n) => n.id === g.id))
    run.sim.target = 0
  }
  const open = (d: Decision) => {
    if (swallowClick.current) { swallowClick.current = false; return }
    onOpen(d)
  }

  if (!decisions.length) return <div className="rounded-[22px] bg-muted py-12 text-center text-sm text-muted-foreground">No decisions yet.</div>

  const focus = dragging ?? hover
  const near = new Set(focus ? [focus, ...graph.edges.flatMap((e) => (e.s === focus ? [e.t] : e.t === focus ? [e.s] : []))] : [])
  const foots = new Map(graph.nodes.map((n) => [n.id, footOf(n)]))
  // Cards know whether they sit on an area's paper or on the tray, so they can stand out from either.
  const onArea = new Set(areas.map((a) => a.anchor))
  const tray = "var(--hifi-layer, var(--muted))"

  return (
    <div
      ref={boxRef}
      className={cn("relative h-[max(26rem,calc(100dvh-14.5rem))] touch-none overflow-hidden rounded-[22px] select-none", panning ? "cursor-grabbing" : "cursor-grab")}
      style={{ background: tray }}
      onPointerDown={(e) => down(e)}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div className={cn("absolute top-0 left-0 origin-top-left", !size.w && "invisible")} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        {areas.length > 0 && (
          <svg aria-hidden className="absolute top-0 left-0 overflow-visible" width={1} height={1}>
            {areas.map((a) => <path key={a.anchor} d={a.path} fill="var(--background)" />)}
          </svg>
        )}
        <svg aria-hidden className="absolute top-0 left-0 overflow-visible text-foreground" width={1} height={1}>
          {graph.edges.map((e) => {
            const p = pos[e.s], q = pos[e.t]
            if (!p || !q || e.kind === "home") return null
            const state = !focus ? "rest" : e.s === focus || e.t === focus ? "lit" : "dim"
            return <EdgeLine key={`${e.kind}:${e.s}>${e.t}`} e={e} p={p} q={q} fp={foots.get(e.s)!} fq={foots.get(e.t)!} np={names.get(e.s)} nq={names.get(e.t)} state={state} />
          })}
        </svg>
        {areas.map(({ anchor, group: g, top }) => {
          // A thread's name opens the thread, unless it's the page you're on.
          const opens = !!g.thread && g.thread.part !== thread?.part
          return (
            <button
              key={anchor}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => opens && navigate(`/p/${projectId}/t/${g.thread!.id}`)}
              className={cn("absolute flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-background px-1.5 py-0.5 text-[12px] font-medium whitespace-nowrap", opens ? "cursor-pointer hover:bg-muted" : "cursor-default")}
              style={{ left: top.x, top: top.y + 10 }}
            >
              {g.thread ? (
                <ThreadIcon thread={g.thread} className="size-3.5" />
              ) : (
                <span className="flex -space-x-1">{g.people?.map((p) => <PersonAvatar key={p} id={p} className="size-4 ring-2 ring-background" />)}</span>
              )}
              {g.name}
            </button>
          )
        })}
        {graph.nodes.map((n) => {
          const p = pos[n.id]
          if (!p || n.kind === "anchor") return null
          const dim = !!focus && !near.has(n.id)
          const faded = n.role !== "main" && !near.has(n.id)
          const { hw, hh, round } = n.foot
          const mark = MARK_OF[n.status]
          const ghost = n.role === "ghost"
          // A guess nobody confirmed yet is only its dotted outline; a decided one is a filled patch (gray on an
          // area's paper, paper on the tray).
          const unsure = mark === "empty"
          const onPaper = !!n.group && onArea.has(n.group)
          return (
            <button
              key={n.id}
              type="button"
              aria-label={n.label}
              onPointerDown={(e) => down(e, n.id)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              onFocus={() => setHover(n.id)}
              onBlur={() => setHover((h) => (h === n.id ? null : h))}
              onClick={() => open(n.d)}
              className={cn(
                "group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2 px-3 text-left outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                dim ? "opacity-20" : faded ? "opacity-55" : "opacity-100",
              )}
              style={{
                left: p.x,
                top: p.y,
                width: 2 * hw,
                height: 2 * hh,
                borderRadius: round,
                background: unsure || ghost ? (onPaper ? "var(--background)" : tray) : onPaper ? tray : "var(--background)",
                border: ghost
                  ? "1.25px dashed color-mix(in oklab, var(--muted-foreground) 45%, transparent)"
                  : unsure
                    ? "1.5px dotted color-mix(in oklab, var(--muted-foreground) 80%, transparent)"
                    : mark === "triangle"
                      ? "1px solid color-mix(in oklab, var(--destructive) 55%, transparent)"
                      : "1px solid transparent",
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground/[0.05] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              <MarkIcon mark={mark} className={cn("relative size-3.5 shrink-0 text-muted-foreground", ghost && "opacity-60")} />
              {/* The line height comes after the size, which would otherwise reset it. */}
              <span className={cn("relative line-clamp-3 text-[12px] leading-[16px] text-foreground/80 group-hover:text-foreground", ghost && "text-muted-foreground line-through")}>{n.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
