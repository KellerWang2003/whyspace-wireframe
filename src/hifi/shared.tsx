import type { ReactNode } from "react"

export type Page = "today" | "home"
export type StyleProps = { page: Page; go: (page: Page) => void }

// The Y mark: three bands that meet in one stem (the same geometry as the landing page's logo).
const Y_PATHS = [
  "M476.7 15.6Q495.0 0.0 495.0 24.0L495.0 173.4Q495.0 197.4 475.9 211.8L185.2 431.9Q166.1 446.4 166.1 422.4L166.1 304.7Q166.1 280.7 184.3 265.1Z",
  "M21.8 31.4Q1.2 19.0 1.0 43.0L0.2 174.5Q0.0 198.5 21.8 208.6L132.4 260.1Q154.1 270.2 172.3 254.6L245.7 191.6Q263.9 176.0 243.3 163.7Z",
  "M337.9 334.9Q356.9 320.2 356.9 344.2L356.9 483.3Q356.9 507.3 337.7 521.7L185.4 635.6Q166.2 650.0 166.2 626.0L166.2 491.3Q166.2 467.3 185.2 452.7Z",
]
export function YMark({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 495 650" className={className} aria-hidden>
      {Y_PATHS.map((d) => <path key={d} d={d} fill={color} />)}
    </svg>
  )
}

export function Scroll({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={["min-w-0 flex-1 overflow-x-hidden overflow-y-auto", className].filter(Boolean).join(" ")}>{children}</main>
}
