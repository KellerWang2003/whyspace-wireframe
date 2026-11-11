import type { Mark } from "@/lib/marks"

// Where each part of the system stands, drawn with the product's own marks: a part that has gone
// high-fi is filled, a part still on the wireframe defaults is empty, an open question is a triangle.
// Flip a part to "hifi" when its high-fi version lands in index.css or in its component.
export type State = "hifi" | "wire" | "open"

export const STATE: Record<State, { mark: Mark; label: string }> = {
  hifi: { mark: "filled", label: "High-fi" },
  wire: { mark: "empty", label: "Wireframe" },
  open: { mark: "triangle", label: "Open question" },
}

export type SectionId =
  | "type" | "color" | "marks" | "icons" | "illustrations" | "spacing" | "radius" | "elevation"
  | "buttons" | "badges" | "inputs" | "choices" | "tabs" | "overlays" | "people" | "places" | "rail" | "rows" | "card" | "needs" | "messages" | "table" | "empty"

export const SECTIONS: { id: SectionId; label: string; group: "Foundations" | "Components"; state: State }[] = [
  { id: "type", label: "Type", group: "Foundations", state: "hifi" },
  { id: "color", label: "Color", group: "Foundations", state: "hifi" },
  { id: "marks", label: "Marks", group: "Foundations", state: "hifi" },
  { id: "icons", label: "Icons", group: "Foundations", state: "hifi" },
  { id: "illustrations", label: "Illustrations", group: "Foundations", state: "hifi" },
  { id: "spacing", label: "Spacing", group: "Foundations", state: "hifi" },
  { id: "radius", label: "Radius", group: "Foundations", state: "hifi" },
  { id: "elevation", label: "Elevation", group: "Foundations", state: "hifi" },
  { id: "buttons", label: "Buttons", group: "Components", state: "hifi" },
  { id: "badges", label: "Badges", group: "Components", state: "hifi" },
  { id: "inputs", label: "Inputs", group: "Components", state: "hifi" },
  { id: "choices", label: "Choices", group: "Components", state: "hifi" },
  { id: "tabs", label: "Tabs", group: "Components", state: "hifi" },
  { id: "overlays", label: "Menus and dialogs", group: "Components", state: "hifi" },
  { id: "people", label: "People", group: "Components", state: "hifi" },
  { id: "places", label: "Projects and threads", group: "Components", state: "hifi" },
  { id: "rail", label: "Rail", group: "Components", state: "hifi" },
  { id: "rows", label: "Rows", group: "Components", state: "hifi" },
  { id: "card", label: "Decision card", group: "Components", state: "hifi" },
  { id: "needs", label: "Needs you", group: "Components", state: "hifi" },
  { id: "messages", label: "Duet and chat messages", group: "Components", state: "hifi" },
  { id: "table", label: "Table", group: "Components", state: "hifi" },
  { id: "empty", label: "Empty states", group: "Components", state: "wire" },
]
