import { PIGMENT } from "./hand"

// A painted mark's color at a given strength (the rest is paper), and the ink drawn on it.
// One ink for every pigment (Keller, Nov 14): the color lives in the tile only; per-pigment shades read poorly and looked dirty.
// Strength 45% (Keller, Nov 14): full pigment was too heavy, 70% made the ink icon hard to read, a wash too light.
export const MARK_STRENGTH = 0.45
const INK = "#2B2B27"

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
const hex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
export const mixHex = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v * t + y[i] * (1 - t))) }

export function paintTint(pigment: string, strength = MARK_STRENGTH) {
  const bg = mixHex(pigment, PIGMENT.paper, strength)
  return { bg, ink: INK }
}
