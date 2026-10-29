import { useState, type ReactNode } from "react"
import { ChevronRight, Quote, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PEOPLE, type Artifact, type Decision } from "@/data"
import { cn } from "@/lib/utils"
import { ArtifactPicture, ArtifactThumb } from "@/playground/artifact"
import { dayLabel, dayOfDecision, isAI, isNew, type Model } from "@/playground/model"

// Shared by the Decisions page, the Artifacts page and the playground: the decision sheet,
// the artifact focus view (artifact large, pinned decisions, version scrubber, decisions on the
// right).
// ---------- decision detail ----------

export function DecisionSheet({ m, id, onClose, onDecision, onArtifact }: { m: Model; id: string | null; onClose: () => void; onDecision: (id: string) => void; onArtifact: (id: string) => void }) {
  const d = id ? m.byId(id) : undefined
  return (
    <Sheet open={!!d} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] gap-0 overflow-y-auto sm:max-w-[420px]">
        {d && (
          <>
            <SheetHeader className="gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                {isNew(d) && <Badge variant="outline" className="font-normal">New since your last visit</Badge>}
              </div>
              <SheetTitle className="text-lg leading-snug">{d.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <PersonAvatar id={d.owner} className="size-5" />
                {isAI(d)
                  ? `Inferred by ${PEOPLE[d.owner]?.name.split(" ")[0]}'s ${d.tool ?? "AI"} · ${d.when}`
                  : d.by
                    ? `Said by ${d.by}${d.tool ? ` · in ${d.tool}` : ""} · ${d.when}`
                    : `Open · ${PEOPLE[d.owner]?.name} · due ${d.due}`}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              {isAI(d) && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm">
                  <Sparkles className="size-4 shrink-0" />
                  <span className="flex-1">An AI picked this up. Is it right?</span>
                  <Button size="sm" onClick={() => (toast.success("Confirmed"), onClose())}>Confirm</Button>
                </div>
              )}
              <Field label="Why">{d.why ?? <span className="text-muted-foreground">No reason yet. Whyspace will ask {PEOPLE[d.owner]?.name.split(" ")[0]}.</span>}</Field>
              {d.snippet && (
                <Field label="Where it came from">
                  <div className="flex gap-2 rounded-md bg-muted p-2.5 text-sm italic"><Quote className="size-3.5 shrink-0 text-muted-foreground" />{d.snippet}</div>
                </Field>
              )}
              {d.was && <Field label="Replaced"><span className="text-muted-foreground line-through">{d.was}</span></Field>}
              {m.conflictsOf(d).map((c) => <Field key={c} label="Conflict">{c}</Field>)}
              {m.artifactsOf(d).length > 0 && (
                <Field label="Shaped these artifacts">
                  <div className="grid grid-cols-2 gap-2">{m.artifactsOf(d).map((a) => <ArtifactThumb key={a.id} artifact={a} onOpen={() => onArtifact(a.id)} />)}</div>
                </Field>
              )}
              <Related label="Builds on" items={m.parentsOf(d)} onDecision={onDecision} />
              <Related label="Led to" items={m.childrenOf(d)} onDecision={onDecision} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function Related({ label, items, onDecision }: { label: string; items: Decision[]; onDecision: (id: string) => void }) {
  if (!items.length) return null
  return (
    <Field label={label}>
      <div className="space-y-1">
        {items.map((d) => (
          <button key={d.id} onClick={() => onDecision(d.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
            <StatusIcon status={d.status} />
            <span className="flex-1 truncate">{d.title}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </Field>
  )
}

// ---------- artifact focus view ----------

// Where pins land on the artifact picture, in order. Percent of the stage.
const PIN_SPOTS = [
  [30, 30], [62, 24], [44, 62], [74, 58], [22, 72], [56, 40],
]

export function FocusView({ m, id, onClose, onDecision }: { m: Model; id: string | null; onClose: () => void; onDecision: (id: string) => void }) {
  const a = id ? m.artifacts.find((x) => x.id === id) : undefined
  return (
    <Dialog open={!!a} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[88vh] w-[94vw] max-w-[94vw] flex-col gap-0 p-0 sm:max-w-[94vw]">
        {a && <Focus key={a.id} m={m} a={a} onDecision={onDecision} />}
      </DialogContent>
    </Dialog>
  )
}

function Focus({ m, a, onDecision }: { m: Model; a: Artifact; onDecision: (id: string) => void }) {
  // Made decisions first, oldest first, then the ones still open.
  const all = m.decisionsOf(a).sort((x, y) => Number(!x.when) - Number(!y.when) || dayOfDecision(x) - dayOfDecision(y))
  // One version per made decision that shaped it, oldest first. The last one is now.
  const ds = all.filter((d) => d.when)
  const [version, setVersion] = useState(Math.max(0, ds.length - 1))
  const [hover, setHover] = useState<string | null>(null)
  const [filter, setFilter] = useState<"version" | "all" | "look">("all")
  const shown = filter === "version" ? ds.slice(0, version + 1) : filter === "look" ? all.filter((d) => ["inf", "open", "flag"].includes(d.status)) : all
  const pinned = ds.slice(0, version + 1)

  return (
    <>
      <div className="flex items-center gap-3 border-b px-5 py-3 pr-12">
        <div>
          <DialogTitle className="text-base">{a.name}</DialogTitle>
          <DialogDescription>{a.kind} · {a.part} · {PEOPLE[a.owner]?.name} · updated {a.updated}</DialogDescription>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_380px]">
        <div className="flex min-h-0 flex-col gap-3 bg-muted/40 p-5">
          <div className="relative min-h-0 flex-1 rounded-xl border bg-background">
            <ArtifactPicture artifact={a} version={version + 1} className="p-8" />
            {pinned.map((d, i) => {
              const [x, y] = PIN_SPOTS[i % PIN_SPOTS.length]
              return (
                <button
                  key={d.id}
                  onClick={() => onDecision(d.id)}
                  onMouseEnter={() => setHover(d.id)}
                  onMouseLeave={() => setHover(null)}
                  className={cn(
                    "absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-medium text-background shadow-md transition",
                    isAI(d) && "border-dashed border-foreground bg-background text-foreground",
                    hover === d.id && "scale-125",
                  )}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          {ds.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Versions · drag through how it got here</div>
              <div className="relative flex items-center">
                <div className="absolute inset-x-3 h-0.5 bg-border" />
                {ds.map((d, i) => (
                  <button key={d.id} onClick={() => setVersion(i)} className="relative z-10 flex flex-1 flex-col items-center gap-1">
                    <span className={cn("size-3 rounded-full border-2 border-foreground bg-background", i <= version && "bg-foreground", i === version && "ring-4 ring-foreground/15")} />
                    <span className={cn("text-[11px]", i === version ? "font-medium" : "text-muted-foreground")}>v{i + 1} · {dayLabel(dayOfDecision(d))}</span>
                  </button>
                ))}
              </div>
              <div className="text-center text-xs text-muted-foreground">v{version + 1} came from “{ds[version].title}”</div>
            </div>
          )}
        </div>
        <div className="flex min-h-0 flex-col border-l">
          <div className="space-y-3 p-4 pb-2">
            <div className="text-sm font-medium">Decisions on this {a.kind === "Repo" ? "repo" : a.kind.toLowerCase()}</div>
            <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)} className="w-full">
              <ToggleGroupItem value="all" className="flex-1">All</ToggleGroupItem>
              <ToggleGroupItem value="version" className="flex-1">Up to v{version + 1}</ToggleGroupItem>
              <ToggleGroupItem value="look" className="flex-1">Needs a look</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Separator />
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {shown.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nothing here.</p>}
            {shown.map((d) => {
              const n = ds.indexOf(d) + 1 || null
              return (
                <button
                  key={d.id}
                  onClick={() => onDecision(d.id)}
                  onMouseEnter={() => setHover(d.id)}
                  onMouseLeave={() => setHover(null)}
                  className={cn("flex w-full gap-3 rounded-lg p-2.5 text-left transition hover:bg-muted", hover === d.id && "bg-muted", n && n - 1 > version && "opacity-40")}
                >
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background", isAI(d) && "border border-dashed border-foreground bg-background text-foreground", !n && "border border-foreground/40 bg-background")}>{n ?? ""}</span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium leading-snug"><StatusIcon status={d.status} className="size-3.5 shrink-0 text-muted-foreground" />{d.title}</div>
                    {d.why && <div className="line-clamp-2 text-xs text-muted-foreground">{d.why}</div>}
                    <div className="text-[11px] text-muted-foreground">{isAI(d) ? `${d.tool} inferred · needs a confirm` : d.by ? `${d.by} · ${d.when}` : `Open · due ${d.due}`}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ---------- chat: bottom-right button, floating panel or docked sidebar ----------
