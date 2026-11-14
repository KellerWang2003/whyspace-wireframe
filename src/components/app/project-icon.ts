import { useSyncExternalStore } from "react"
import {
  BookOpen, Briefcase, Camera, Cat, Coffee, Code, FlaskConical, Gift, Globe, GraduationCap, Heart,
  Leaf, Lightbulb, Megaphone, Music, Palette, PenTool, Rocket, Smartphone, Sprout, Star, Target, Users, type LucideIcon,
} from "lucide-react"
import { PIGMENT } from "@/components/brand/hand"

// Project icons (Nov 11): each project's icon is drawn in one pigment, with no tile (Plain; Wash and Painted are kept in MarkTile),
// Anyone can change it from the mark in the project header. Every project has an icon: the letter option is gone (Keller, Nov 14: "so ugly").
export const PROJECT_ICONS: [string, LucideIcon][] = [
  ["cat", Cat], ["graduation", GraduationCap], ["gift", Gift], ["sprout", Sprout], ["users", Users], ["phone", Smartphone],
  ["rocket", Rocket], ["megaphone", Megaphone], ["palette", Palette], ["flask", FlaskConical], ["briefcase", Briefcase], ["book", BookOpen],
  ["camera", Camera], ["music", Music], ["heart", Heart], ["star", Star], ["leaf", Leaf], ["globe", Globe],
  ["coffee", Coffee], ["code", Code], ["pen", PenTool], ["bulb", Lightbulb], ["target", Target],
]
export const ICON_OF = Object.fromEntries(PROJECT_ICONS) as Record<string, LucideIcon>

export const MARK_COLORS = ["apricot", "rose", "sky", "leaf", "forest", "gray"] as const
export type MarkColor = (typeof MARK_COLORS)[number]
export const MARK_HEX: Record<MarkColor, string> = { apricot: PIGMENT.apricot, rose: PIGMENT.rose, sky: PIGMENT.sky, leaf: PIGMENT.leaf, forest: PIGMENT.forest, gray: "#8A8A83" }
// Ink reads on the light pigments; the deeper ones take a white icon.
export const MARK_INK: Record<MarkColor, string> = { apricot: "#2B2B27", rose: "#2B2B27", sky: PIGMENT.paper, leaf: PIGMENT.paper, forest: PIGMENT.paper, gray: PIGMENT.paper }

// Wash look: a pale tile of the pigment, with the icon in the pigment itself.
export const MARK_WASH: Record<MarkColor, string> = { apricot: PIGMENT.apricotWash, rose: PIGMENT.roseWash, sky: PIGMENT.skyWash, leaf: PIGMENT.leafWash, forest: "#E3EADB", gray: "#EDEDE8" }
export const MARK_WASH_INK: Record<MarkColor, string> = { apricot: "#D9772A", rose: "#D45A83", sky: "#4E87AB", leaf: PIGMENT.leaf, forest: PIGMENT.forest, gray: "#6B6B64" }

// `icon` can be missing in icons saved before Nov 14 (they were letters); iconOf picks one for those.
export type ProjectIcon = { icon?: string; color: MarkColor }

const START: Record<string, ProjectIcon> = {
  whiskr: { icon: "cat", color: "apricot" },
  studio: { icon: "graduation", color: "sky" },
  holiday: { icon: "gift", color: "rose" },
  seed: { icon: "sprout", color: "leaf" },
  panel: { icon: "users", color: "forest" },
  android: { icon: "phone", color: "leaf" },
}

export function hashId(s: string) {
  let h = 7
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

// A new project: an icon and a pigment picked from its id, so new projects differ before anyone changes them.
const DEFAULT_ICONS = ["star", "rocket", "target", "bulb", "globe", "book", "leaf", "heart"]
const pickIcon = (id: string) => DEFAULT_ICONS[(hashId(id) >> 3) % DEFAULT_ICONS.length]
export const defaultIcon = (id: string): ProjectIcon => ({ icon: pickIcon(id), color: (["apricot", "sky", "rose", "leaf"] as const)[hashId(id) % 4] })
// The icon to draw: the chosen one, or one picked from the id for an icon saved as a letter.
export const iconOf = (icon: ProjectIcon, id: string): LucideIcon => ICON_OF[icon.icon ?? ""] ?? ICON_OF[pickIcon(id)]
export const startIcon = (id: string): ProjectIcon => START[id] ?? defaultIcon(id)

const KEY = "whyspace-project-icons"
type Icons = Record<string, ProjectIcon>
const listeners = new Set<() => void>()

function read(): Icons {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Icons
  } catch {
    // Storage blocked or unreadable: every project keeps its starting icon.
  }
  return {}
}

let icons = read()

function save(next: Icons) {
  icons = next
  try {
    localStorage.setItem(KEY, JSON.stringify(icons))
  } catch {
    // Storage blocked: the icon lasts for this visit.
  }
  for (const listener of listeners) listener()
}

export const setProjectIcon = (id: string, next: ProjectIcon) => save({ ...icons, [id]: next })
export const resetProjectIcon = (id: string) => {
  const next = { ...icons }
  delete next[id]
  save(next)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// A project's icon, live. Read it from the hook's value so the React Compiler redraws it when it changes.
export function useProjectIcon(id: string): ProjectIcon {
  const all = useSyncExternalStore(subscribe, () => icons)
  const icon = all[id] ?? startIcon(id)
  return icon.icon ? icon : { ...icon, icon: startIcon(id).icon ?? pickIcon(id) }
}
