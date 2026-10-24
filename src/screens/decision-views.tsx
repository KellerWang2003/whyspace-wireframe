import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { LINKS, STATUS_LABEL, projectName, type Decision, type Status } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"

// basePath is where the views live (/decisions for everything, /p/<id>/decisions for one project).
// showProject adds the project to each row when the views span several projects.
type ViewProps = { decisions: Decision[]; basePath: string; showProject?: boolean }

const open = (basePath: string, id: string) => navigate(`${basePath}/${id}`)
const where = (d: Decision, showProject?: boolean) => (showProject ? `${projectName(d.project)} · ${d.part}` : d.part)

export function DecisionList({ decisions, basePath, showProject }: ViewProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Decision</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Part</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.map((d) => (
            <TableRow key={d.id} className="cursor-pointer" onClick={() => open(basePath, d.id)}>
              <TableCell className="font-medium">{d.title}</TableCell>
              {showProject && <TableCell className="text-muted-foreground">{projectName(d.project)}</TableCell>}
              <TableCell className="text-muted-foreground">{d.part}</TableCell>
              <TableCell><PersonAvatar id={d.owner} /></TableCell>
              <TableCell className="text-muted-foreground">{d.tool ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{d.when ?? `Due ${d.due}`}</TableCell>
              <TableCell><StatusBadge status={d.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Board: one column per status, so the "needs a person" columns sit first.
const BOARD: Status[] = ["inf", "open", "chg", "flag", "conf"]

export function DecisionBoard({ decisions, basePath, showProject }: ViewProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {BOARD.map((st) => {
        const col = decisions.filter((d) => d.status === st)
        return (
          <div key={st} className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2">
            <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
              <StatusIcon status={st} />
              {STATUS_LABEL[st]}
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{col.length}</span>
            </div>
            {col.map((d) => (
              <button
                key={d.id}
                onClick={() => open(basePath, d.id)}
                className="flex flex-col gap-2 rounded-md border bg-background p-3 text-left text-sm shadow-xs hover:bg-accent/50"
              >
                <span className="font-medium leading-snug">{d.title}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PersonAvatar id={d.owner} className="size-5" />
                  <span className="truncate">{where(d, showProject)}</span>
                </span>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Graph: groups on the left (parts inside a project, projects across the workspace),
// their decisions to the right, and dashed "builds on" links between decisions
// so you can see what a change ripples into.
const ROW = 52
const NODE_W = 380
const PART_X = 0
const PART_W = 180
const DEC_X = 260

export function DecisionGraph({ decisions, basePath, showProject }: ViewProps) {
  const pos: Record<string, { x: number; y: number }> = {}
  const parts: { name: string; y: number; h: number }[] = []
  let y = 0
  const groupOf = (d: Decision) => (showProject ? projectName(d.project) : d.part)
  const groups = [...new Set(decisions.map(groupOf))]
  for (const name of groups) {
    const ds = decisions.filter((d) => groupOf(d) === name)
    parts.push({ name, y, h: ds.length * ROW })
    ds.forEach((d, i) => (pos[d.id] = { x: DEC_X, y: y + i * ROW }))
    y += ds.length * ROW + 24
  }
  const height = y
  const links = LINKS.filter(([a, b]) => pos[a] && pos[b])
  const byId = Object.fromEntries(decisions.map((d) => [d.id, d]))

  return (
    <div className="overflow-x-auto rounded-lg border p-6">
      <div className="relative" style={{ height, width: DEC_X + NODE_W + 160 }}>
        <svg className="absolute inset-0 overflow-visible" width="100%" height={height}>
          {parts.map((p) =>
            decisions
              .filter((d) => groupOf(d) === p.name)
              .map((d) => {
                const from = { x: PART_X + PART_W, y: p.y + p.h / 2 }
                const to = { x: DEC_X, y: pos[d.id].y + 20 }
                const mid = (from.x + to.x) / 2
                return (
                  <path
                    key={d.id}
                    d={`M${from.x},${from.y} C${mid},${from.y} ${mid},${to.y} ${to.x},${to.y}`}
                    className="fill-none stroke-border"
                    strokeWidth={1.5}
                  />
                )
              }),
          )}
          {links.map(([a, b]) => {
            const from = { x: DEC_X + NODE_W, y: pos[a].y + 20 }
            const to = { x: DEC_X + NODE_W, y: pos[b].y + 20 }
            const bulge = 40 + Math.abs(to.y - from.y) / 6
            return (
              <path
                key={a + b}
                d={`M${from.x},${from.y} C${from.x + bulge},${from.y} ${to.x + bulge},${to.y} ${to.x},${to.y}`}
                className="fill-none stroke-muted-foreground"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )
          })}
        </svg>
        {parts.map((p) => (
          <div
            key={p.name}
            className="absolute flex items-center rounded-md border bg-muted px-3 text-sm font-medium"
            style={{ left: PART_X, top: p.y + p.h / 2 - 18, width: PART_W, height: 36 }}
          >
            {p.name}
          </div>
        ))}
        {Object.entries(pos).map(([id, p]) => {
          const d = byId[id]
          return (
            <button
              key={id}
              onClick={() => open(basePath, id)}
              className={cn(
                "absolute flex items-center gap-2 rounded-md border bg-background px-3 text-left text-sm hover:bg-accent",
                d.status === "inf" && "border-dashed",
              )}
              style={{ left: p.x, top: p.y, width: NODE_W, height: 40 }}
            >
              <StatusIcon status={d.status} />
              <span className="truncate">{d.title}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-px w-6 border-t border-dashed border-muted-foreground" />Builds on</span>
        <span className="flex items-center gap-2"><span className="h-4 w-6 rounded-sm border border-dashed" />Inferred, not confirmed yet</span>
      </div>
    </div>
  )
}

// Timeline: newest first, grouped by when the decision was made.
const ORDER = ["Today", "Yesterday", "Oct 22", "Oct 21", "Oct 20", "Oct 19", "Oct 17", "Oct 16", "Oct 15", "Oct 14", "Oct 12", "Oct 9"]

export function DecisionTimeline({ decisions, basePath, showProject }: ViewProps) {
  const dated = ORDER.map((when) => ({ when, ds: decisions.filter((d) => d.when === when) })).filter((g) => g.ds.length)
  const undecided = decisions.filter((d) => !d.when)
  return (
    <div className="flex max-w-3xl flex-col">
      {undecided.length > 0 && (
        <TimelineGroup label="Waiting on a decision" decisions={undecided} basePath={basePath} showProject={showProject} />
      )}
      {dated.map((g) => (
        <TimelineGroup key={g.when} label={g.when} decisions={g.ds} basePath={basePath} showProject={showProject} />
      ))}
    </div>
  )
}

function TimelineGroup({ label, decisions, basePath, showProject }: { label: string } & ViewProps) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4">
      <div className="pt-3 text-right text-sm text-muted-foreground">{label}</div>
      <div className="flex flex-col gap-2 border-l pb-6 pl-6">
        {decisions.map((d) => (
          <button
            key={d.id}
            onClick={() => open(basePath, d.id)}
            className="relative flex items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-accent/50"
          >
            <span className="absolute top-1/2 -left-[29px] size-2 -translate-y-1/2 rounded-full bg-foreground" />
            <PersonAvatar id={d.owner} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{d.title}</div>
              <div className="text-xs text-muted-foreground">{where(d, showProject)}{d.tool && ` · from ${d.tool}`}{d.due && ` · due ${d.due}`}</div>
            </div>
            <StatusBadge status={d.status} />
          </button>
        ))}
      </div>
    </div>
  )
}
