import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

// A window on the Desk. Not Whyspace UI: the apps people already work in.
export function Win({ title, style, className, dark, children, bar }: { title: string; style?: CSSProperties; className?: string; dark?: boolean; children: ReactNode; bar?: ReactNode }) {
  return (
    <section
      aria-label={title}
      style={style}
      className={cn("absolute flex flex-col overflow-hidden rounded-xl border shadow-2xl", dark ? "border-black/40 bg-[#1e1e1e] text-neutral-100" : "border-black/10 bg-white text-neutral-900", className)}
    >
      <div className={cn("flex h-9 shrink-0 items-center gap-2 border-b px-3", dark ? "border-white/10 bg-[#2b2b2b]" : "border-black/5 bg-neutral-50")}>
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className={cn("ml-2 truncate text-[12px]", dark ? "text-neutral-300" : "text-neutral-600")}>{title}</span>
        {bar && <div className="ml-auto flex items-center gap-2">{bar}</div>}
      </div>
      <div className="relative flex min-h-0 flex-1">{children}</div>
    </section>
  )
}

export function Toast({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("absolute bottom-4 left-4 z-10 rounded-md bg-neutral-900 px-3 py-2 text-[12px] text-white shadow-lg", className)}>{children}</div>
}
