import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { initialsOf } from "./model"

// Small pieces every style shares. Each takes its look from the style's variables (hifi.tsx).

export function Avatar({ id, size = 28, className }: { id: string; size?: number; className?: string }) {
  return (
    <span className={cn("hf-avatar inline-flex shrink-0 items-center justify-center rounded-full font-semibold", id === "CH" ? "hf-avatar-b" : "hf-avatar-a", className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initialsOf(id)}
    </span>
  )
}

export function Button({ children, kind = "secondary", className, onClick }: { children: ReactNode; kind?: "primary" | "secondary" | "ghost"; className?: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className={cn("hf-btn", `hf-btn-${kind}`, className)}>{children}</button>
}

export function Badge({ n, className }: { n: number; className?: string }) {
  return <span className={cn("hf-badge inline-flex h-4 min-w-4 items-center justify-center px-1 text-[10px] font-semibold tabular-nums", className)}>{n}</span>
}
