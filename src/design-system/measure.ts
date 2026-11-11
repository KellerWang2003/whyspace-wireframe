import { useLayoutEffect, useRef, useState } from "react"

// The design system page never types a value in: it reads what the browser actually applies,
// so the page stays true when index.css or a component changes.

// A CSS custom property as the page sees it, e.g. cssVar("--primary") → "oklch(0.205 0 0)".
export function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// A length token in px: "0.25rem" → 4, "10px" → 10.
export function lengthPx(value: string) {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return 0
  if (value.endsWith("rem")) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}

// Any CSS color (oklch, rgb, a name) as #RRGGBB, by painting one pixel. Falls back to the raw value.
let paint: CanvasRenderingContext2D | null = null
export function toHex(color: string) {
  if (!color) return ""
  paint ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!paint) return color
  paint.clearRect(0, 0, 1, 1)
  paint.fillStyle = "#010203"
  paint.fillStyle = color
  if (paint.fillStyle === "#010203" && color.toLowerCase() !== "#010203") return color
  paint.fillRect(0, 0, 1, 1)
  const [r, g, b] = paint.getImageData(0, 0, 1, 1).data
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()
}

// How light a #RRGGBB color is, 0 to 1, for ordering swatches.
export function lightness(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  if (Number.isNaN(n)) return 0
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

// The computed styles the page shows, read from the element the ref lands on. Read again when the
// element resizes, so a web font arriving late still gives the right numbers.
const PROPS = ["fontSize", "lineHeight", "fontWeight", "letterSpacing", "fontFamily", "borderTopLeftRadius", "boxShadow", "height", "width", "webkitTextStrokeWidth"] as const
export type Computed = Record<(typeof PROPS)[number], string>

export function useComputed<E extends HTMLElement = HTMLElement>() {
  const ref = useRef<E>(null)
  const [computed, setComputed] = useState<Computed | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const s = getComputedStyle(el)
      setComputed(Object.fromEntries(PROPS.map((p) => [p, s[p]])) as Computed)
    }
    const watch = new ResizeObserver(read)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  return [ref, computed] as const
}

// "36px" → 36
export const px = (v: string) => Math.round(parseFloat(v) * 100) / 100

// Letter spacing as Figma writes it: -0.36px on a 36px font → "-1%".
export function tracking(letterSpacing: string, fontSize: string) {
  if (!letterSpacing || letterSpacing === "normal") return "0%"
  const pct = Math.round((parseFloat(letterSpacing) / parseFloat(fontSize)) * 1000) / 10
  return `${pct === 0 ? 0 : pct}%`
}

// The first family in a font stack, without quotes or the "Variable" suffix.
export const family = (stack: string) => stack.split(",")[0].replace(/["']/g, "").replace(/ Variable$/, "").trim()

// A computed box-shadow without its empty layers: "0 1px 2px 0, 5%". Tailwind stacks transparent
// ring layers in front of the shadow itself; those are dropped.
export function shadowOf(boxShadow: string) {
  if (!boxShadow || boxShadow === "none") return "none"
  const layers = boxShadow.split(/,(?![^(]*\))/).flatMap((layer) => {
    const color = layer.match(/rgba?\([^)]*\)/)?.[0] ?? ""
    const parts = color.match(/[\d.]+/g)?.map(Number) ?? []
    const alpha = parts.length > 3 ? parts[3] : 1
    if (alpha === 0) return []
    const lengths = layer.replace(color, "").trim().split(/\s+/).map((v) => (parseFloat(v) === 0 ? "0" : v))
    return [`${lengths.join(" ")}, ${Math.round(alpha * 100)}%`]
  })
  return layers.length ? layers.join(" + ") : "none"
}
