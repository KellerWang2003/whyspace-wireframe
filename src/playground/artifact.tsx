import { Code, FileText, MonitorPlay, PenTool, Sheet as SheetIcon, Sparkles } from "lucide-react"
import type { Artifact, ArtifactKind } from "@/data"
import { cn } from "@/lib/utils"

export const KIND_ICON: Record<ArtifactKind, typeof FileText> = {
  Prototype: MonitorPlay,
  Figma: PenTool,
  Repo: Code,
  Doc: FileText,
  "AI output": Sparkles,
  Sheet: SheetIcon,
}

// Grayscale stand-in for what an artifact looks like. `version` nudges the drawing so
// scrubbing through versions visibly changes the artifact.
export function ArtifactPicture({ artifact: a, version: asked = 3, className }: { artifact: Artifact; version?: number; className?: string }) {
  const version = Math.min(asked, 3)
  const bar = "rounded-sm bg-muted-foreground/20"
  if (a.kind === "Prototype")
    return (
      <div className={cn("flex h-full items-center justify-center gap-3", className)}>
        {[0, 1, 2].slice(0, Math.min(3, version + 1)).map((i) => (
          <div key={i} className="flex aspect-[9/19] h-[88%] flex-col gap-1.5 rounded-[14%/7%] border-2 border-foreground/30 bg-background p-[6%]">
            <div className={cn(bar, "h-[4%] w-1/2")} />
            <div className={cn("rounded-md bg-muted-foreground/15", i === 0 ? "h-[38%]" : "h-[20%]")} />
            <div className={cn(bar, "h-[4%] w-3/4")} />
            <div className={cn(bar, "h-[4%] w-2/3")} />
            {i === 1 && <div className="mt-1 grid flex-1 grid-cols-7 gap-0.5">{Array.from({ length: 21 }, (_, k) => <div key={k} className={cn(bar, k % 5 === 0 && "bg-foreground/40")} />)}</div>}
            <div className="mt-auto h-[7%] rounded-full bg-foreground/70" />
          </div>
        ))}
      </div>
    )
  if (a.kind === "Figma")
    return (
      <div className={cn("grid h-full grid-cols-4 content-center gap-2 p-3", className)}>
        {Array.from({ length: Math.min(8, 3 + version * 2) }, (_, i) => (
          <div key={i} className="flex aspect-[3/4] flex-col gap-1 rounded border bg-background p-1.5">
            <div className={cn(bar, "h-1.5 w-1/2")} />
            <div className="flex-1 rounded-sm bg-muted-foreground/15" />
            <div className={cn(bar, "h-1.5 w-3/4")} />
          </div>
        ))}
      </div>
    )
  if (a.kind === "Repo")
    return (
      <div className={cn("flex h-full flex-col justify-center gap-1.5 p-4 font-mono text-[10px] text-muted-foreground", className)}>
        {(a.files ?? ["src/index.ts", "src/app.ts", "README.md"]).slice(0, 2 + version).map((f) => (
          <div key={f} className="flex items-center gap-2 truncate"><Code className="size-3 shrink-0" />{f}</div>
        ))}
        {a.pr && <div className="mt-1 truncate text-foreground">{a.pr}</div>}
      </div>
    )
  if (a.kind === "Sheet")
    return (
      <div className={cn("grid h-full grid-cols-5 content-center gap-px p-4", className)}>
        {Array.from({ length: 30 }, (_, i) => <div key={i} className={cn("h-3", i < 5 ? "bg-muted-foreground/35" : "bg-muted-foreground/12")} />)}
      </div>
    )
  if (a.kind === "AI output")
    return (
      <div className={cn("flex h-full flex-col justify-center gap-2 p-4", className)}>
        <div className="ml-auto h-4 w-1/2 rounded-full bg-muted-foreground/20" />
        <div className="h-10 w-4/5 rounded-xl bg-muted-foreground/12" />
        <div className="ml-auto h-4 w-1/3 rounded-full bg-muted-foreground/20" />
        <div className="h-7 w-3/4 rounded-xl bg-muted-foreground/12" />
      </div>
    )
  // Doc
  return (
    <div className={cn("flex h-full flex-col justify-center gap-1.5 p-5", className)}>
      <div className={cn(bar, "mb-1 h-2.5 w-1/2 bg-muted-foreground/35")} />
      {Array.from({ length: 3 + version }, (_, i) => <div key={i} className={cn(bar, "h-1.5", i % 4 === 3 ? "w-2/3" : "w-full")} />)}
    </div>
  )
}

export function ArtifactIcon({ artifact }: { artifact: Artifact }) {
  const Icon = KIND_ICON[artifact.kind]
  return <Icon className="mt-0.5 size-3.5 shrink-0" />
}

export function ArtifactThumb({ artifact: a, onOpen, compact }: { artifact: Artifact; onOpen: () => void; compact?: boolean }) {
  const Icon = KIND_ICON[a.kind]
  return (
    <button onClick={onOpen} className="group flex w-full flex-col overflow-hidden rounded-lg border bg-background text-left transition hover:border-foreground/40 hover:shadow-sm">
      {!compact && (
        <div className="h-24 overflow-hidden border-b bg-muted/50">
          <ArtifactPicture artifact={a} />
        </div>
      )}
      <div className="flex items-center gap-2 px-2.5 py-2">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium">{a.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{a.updated}</span>
      </div>
    </button>
  )
}
