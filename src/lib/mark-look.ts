import { useHifi } from "@/lib/hifi"

// How the decision marks (● ◉ ○ ▲) are drawn: the wireframe drawing, or the high-fi one (Forest and rose,
// picked Nov 11 on the design system page) while the High-fi switch is on.
export type MarkLook = "wire" | "hifi"

export function useMarkLook(): MarkLook {
  return useHifi() ? "hifi" : "wire"
}
