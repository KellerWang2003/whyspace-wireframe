// A small force layout for the decisions map, the way network diagrams settle: nearby nodes push each other
// away, links pull their two ends together, a light pull keeps loose nodes near the middle (more up and down
// than sideways, so the net spreads wide like the canvas), and no two nodes (with their labels) overlap.
// No randomness, so the same graph always settles the same way.

export type SimNode = {
  x: number
  y: number
  vx: number
  vy: number
  // Pinned here while it's dragged.
  fx?: number
  fy?: number
  // How hard it pushes the others away.
  charge: number
  // A spot it leans toward (a day's column), and how hard.
  tx?: number
  sx?: number
  // The room the node and its label take around (x, y): left, right, top, bottom.
  box: [number, number, number, number]
  // Only nodes on the same layer bump into each other; a node on layer -1 bumps into nothing.
  layer?: number
  // Nodes in different groups (threads) push each other harder, so each group gathers on its own.
  group?: string
}
export type SimLink = { s: number; t: number; length: number; strength: number }
// gravity: the pull to the middle; wide: how much harder it pulls up and down than sideways; apart: how much
// harder nodes in different groups push.
export type SimOptions = { gravity: number; wide: number; apart: number }
export type Sim = SimOptions & { nodes: SimNode[]; links: SimLink[]; alpha: number; target: number; degree: number[] }

const DECAY = 1 - Math.pow(0.001, 1 / 300)
const KEEP = 0.6
const GAP = 18
// Nodes farther apart than this stop pushing, so a loose node drifts back instead of being shoved off the edge.
const REACH2 = 400 * 400

export function createSim(nodes: SimNode[], links: SimLink[], options: SimOptions): Sim {
  const degree = nodes.map(() => 0)
  for (const l of links) { degree[l.s]++; degree[l.t]++ }
  return { ...options, nodes, links, alpha: 1, target: 0, degree }
}

export function tick(sim: Sim) {
  const { nodes, links, degree } = sim
  sim.alpha += (sim.target - sim.alpha) * DECAY
  const a = sim.alpha

  for (const l of links) {
    const s = nodes[l.s], t = nodes[l.t]
    let dx = t.x + t.vx - s.x - s.vx, dy = t.y + t.vy - s.y - s.vy
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01
    const f = ((d - l.length) / d) * a * l.strength
    dx *= f; dy *= f
    const bias = degree[l.s] / (degree[l.s] + degree[l.t])
    t.vx -= dx * bias; t.vy -= dy * bias
    s.vx += dx * (1 - bias); s.vy += dy * (1 - bias)
  }

  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i]
    for (let j = i + 1; j < nodes.length; j++) {
      const q = nodes[j]
      const dx = q.x - p.x, dy = q.y - p.y
      const raw = dx * dx + dy * dy
      if (raw > REACH2) continue
      const d2 = Math.max(raw, 100) / (p.group !== q.group ? sim.apart : 1)
      p.vx += (dx * q.charge * a) / d2; p.vy += (dy * q.charge * a) / d2
      q.vx -= (dx * p.charge * a) / d2; q.vy -= (dy * p.charge * a) / d2
    }
  }

  for (const n of nodes) {
    if (n.tx !== undefined) n.vx += (n.tx - n.x) * (n.sx ?? 0) * a
    n.vx -= n.x * sim.gravity * a
    n.vy -= n.y * sim.gravity * sim.wide * a
    if (n.fx !== undefined && n.fy !== undefined) {
      n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0
    } else {
      n.vx *= KEEP; n.vy *= KEEP
      n.x += n.vx; n.y += n.vy
    }
  }

  // Nothing overlaps: push apart along the shorter overlap; a pinned node stays put.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i]
      if (p.layer === -1) continue
      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j]
        if ((p.layer ?? 0) !== (q.layer ?? 0)) continue
        const ox = Math.min(p.x + p.box[1], q.x + q.box[1]) - Math.max(p.x - p.box[0], q.x - q.box[0]) + GAP
        const oy = Math.min(p.y + p.box[3], q.y + q.box[3]) - Math.max(p.y - p.box[2], q.y - q.box[2]) + GAP
        if (ox <= 0 || oy <= 0) continue
        const pinP = p.fx !== undefined, pinQ = q.fx !== undefined
        if (pinP && pinQ) continue
        const share = pinP ? 0 : pinQ ? 1 : 0.5
        if (ox < oy) {
          const dir = q.x > p.x || (q.x === p.x && j % 2) ? 1 : -1
          p.x -= dir * ox * share * 0.7; q.x += dir * ox * (1 - share) * 0.7
        } else {
          const dir = q.y > p.y || (q.y === p.y && j % 2) ? 1 : -1
          p.y -= dir * oy * share * 0.7; q.y += dir * oy * (1 - share) * 0.7
        }
      }
    }
  }
}

// After a drag the dragged node stays put, and whatever it was dropped on or next to is let go so it can make room.
export function makeRoom(sim: Sim, i: number) {
  const p = sim.nodes[i]
  for (const q of sim.nodes) {
    if (q === p || q.layer === -1 || (p.layer ?? 0) !== (q.layer ?? 0)) continue
    const ox = Math.min(p.x + p.box[1], q.x + q.box[1]) - Math.max(p.x - p.box[0], q.x - q.box[0]) + GAP
    const oy = Math.min(p.y + p.box[3], q.y + q.box[3]) - Math.max(p.y - p.box[2], q.y - q.box[2]) + GAP
    if (ox > 0 && oy > 0) { q.fx = undefined; q.fy = undefined }
  }
}

// Where the n-th node starts: a sunflower spiral, so starting points never collide and never depend on chance.
export function seat(i: number, spread = 46) {
  const r = spread * Math.sqrt(0.5 + i)
  const angle = i * Math.PI * (3 - Math.sqrt(5))
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) }
}
