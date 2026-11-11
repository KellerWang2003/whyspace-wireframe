import { Blob } from "@/components/brand/paint"
import { PIGMENT } from "@/components/brand/hand"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { pigmentOf } from "./hifi-model"
import { threadOf, useThreads } from "./threads"
import { ThreadIcon } from "./thread-ui"

// High-fi: each thread takes one of the brand's pigments, and Today gets a little paint.

// A thread's icon in its pigment, with its name.
export function ThreadChip({ projectId, part, className }: { projectId: string; part: string; className?: string }) {
  useThreads(projectId)
  const t = threadOf(projectId, part)
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)} style={{ "--thread": pigmentOf(t) } as CSSProperties}>
      <ThreadIcon thread={t} className="size-4 text-(--thread)" />
      <span className="truncate">{t.name}</span>
    </span>
  )
}

// Today's corner: the four pigments overlapping with a thread running through them, like the brand sheet.
export function TodayPaint({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative h-[132px] w-[236px] select-none", className)}>
      <Blob color={PIGMENT.leaf} seed={11} size={120} className="absolute top-2 left-0 size-[112px] mix-blend-multiply" />
      <Blob color={PIGMENT.apricot} seed={4} size={120} className="absolute top-0 left-[66px] size-[104px] mix-blend-multiply" />
      <Blob color={PIGMENT.sky} seed={7} size={120} className="absolute top-[30px] left-[128px] size-[88px] mix-blend-multiply" />
      <Blob color={PIGMENT.rose} seed={2} size={120} className="absolute top-[64px] left-[176px] size-[60px] mix-blend-multiply" />
      <svg viewBox="0 0 236 132" className="absolute inset-0 overflow-visible">
        <path d="M-6 104 C 30 128, 52 40, 92 58 S 140 120, 168 70 S 214 18, 244 34" fill="none" stroke={PIGMENT.forest} strokeWidth="2.25" strokeLinecap="round" />
      </svg>
    </div>
  )
}
