import { useState } from "react"
import { toast } from "sonner"
import { List, Network, Plus, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { DecisionList } from "@/screens/decision-views"
import { DecisionCanvas } from "@/screens/decision-canvas"
import { DECISIONS, ME, PEOPLE, PROJECTS, PROJECT_DECISION_SUMMARY, STATUS_LABEL, WEEK_SUMMARY, partsOf, projectName, type Decision, type Status } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"

const VIEWS = [
  ["canvas", "Canvas", Network],
  ["list", "List", List],
] as const
type View = (typeof VIEWS)[number][0]

const STATUSES: Status[] = ["inf", "open", "chg", "flag", "conf"]

// One decisions screen, two scopes: every project from the main nav,
// or one project from its sidebar entry. Same views, same filters.
export function DecisionsExplorer({ decisions, basePath, acrossProjects, selectedId }: { decisions: Decision[]; basePath: string; acrossProjects: boolean; selectedId?: string }) {
  const [view, setView] = useState<View>("canvas")
  const [scope, setScope] = useState("all")
  const [status, setStatus] = useState("all")
  const [q, setQ] = useState("")
  const parts = partsOf(decisions)
  const list = decisions.filter(
    (d) =>
      (scope === "all" || (acrossProjects ? d.project : d.part) === scope) &&
      (status === "all" || d.status === status) &&
      d.title.toLowerCase().includes(q.toLowerCase()),
  )
  const toReview = list.filter((d) => d.status === "inf").length

  const tabs = (
    <Tabs value={view} onValueChange={(v) => setView(v as View)}>
      <TabsList>
        {VIEWS.map(([v, label, Icon]) => (
          <TabsTrigger key={v} value={v}><Icon />{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
  const filters = (
    <>
      <Select value={scope} onValueChange={setScope}>
        <SelectTrigger size="sm" className="w-36 bg-background"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{acrossProjects ? "All projects" : "All parts"}</SelectItem>
          {acrossProjects
            ? PROJECTS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
            : parts.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger size="sm" className="w-32 bg-background"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
        </SelectContent>
      </Select>
      <InputGroup className="h-8 w-44 bg-background">
        <InputGroupInput placeholder="Filter decisions" value={q} onChange={(e) => setQ(e.target.value)} />
        <InputGroupAddon><Search /></InputGroupAddon>
      </InputGroup>
    </>
  )
  const summary = (
    <>
      {list.length} decisions{acrossProjects && ` across ${new Set(list.map((d) => d.project)).size} projects`}
      {toReview > 0 && ` · ${toReview} waiting for a person to confirm`}
    </>
  )
  const addButton = <Button size="sm" onClick={() => toast("Add a missed decision")}><Plus />Add decision</Button>

  // The canvas takes over the whole content area, FigJam style, with everything else floating on it.
  if (view === "canvas") {
    return (
      <>
        <DecisionCanvas
          all={decisions}
          visible={list}
          basePath={basePath}
          acrossProjects={acrossProjects}
          scopeName={acrossProjects ? "all projects" : projectName(decisions[0]?.project ?? "")}
          title={
            <>
              <div className="pr-1 leading-tight">
                <div className="font-semibold">Decisions</div>
                <div className="text-xs text-muted-foreground">{list.length} decisions{toReview > 0 && ` · ${toReview} to confirm`}</div>
              </div>
              {tabs}
            </>
          }
          filters={
            <>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="w-32 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <InputGroup className="h-8 w-44 bg-background">
                <InputGroupInput placeholder="Filter" value={q} onChange={(e) => setQ(e.target.value)} />
                <InputGroupAddon><Search /></InputGroupAddon>
              </InputGroup>
            </>
          }
          onAddDecision={() => toast("Add a missed decision")}
        />
        <DecisionSheet basePath={basePath} id={selectedId} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
        {addButton}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {tabs}
        <div className="ml-auto flex items-center gap-2">{filters}</div>
      </div>
      {view === "list" && <DecisionList decisions={list} basePath={basePath} showProject={acrossProjects} />}
      <DecisionSheet basePath={basePath} id={selectedId} />
    </div>
  )
}

// Main nav "Decisions" is not a canvas: canvases belong to a project and its team.
// This page is the overview across projects, mostly AI summaries of what changed,
// so you can catch up on everything without opening each project.
const THIS_WEEK = ["Today", "Yesterday", "Oct 22", "Oct 21", "Oct 20", "Oct 19"]

export function AllDecisions({ id }: { id?: string }) {
  const { current } = useStore()
  const [tab, setTab] = useState("summary")
  const week = DECISIONS.filter((d) => THIS_WEEK.includes(d.when ?? ""))
  const toConfirm = DECISIONS.filter((d) => d.status === "inf")
  const mine = toConfirm.filter((d) => d.owner === ME.id)
  const changed = DECISIONS.filter((d) => d.status === "chg")
  const open = DECISIONS.filter((d) => d.status === "open")

  return (
    <AppShell crumbs={[{ label: current?.name ?? "" }, { label: "Decisions" }]}>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
            <p className="text-sm text-muted-foreground">What your teams decided across {PROJECTS.length} projects, summarized by Whyspace.</p>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="summary"><Sparkles />Summary</TabsTrigger>
              <TabsTrigger value="all"><List />All decisions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {tab === "summary" ? (
          <>
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5"><Sparkles className="size-3.5" />This week, across everything</CardDescription>
                <CardTitle className="text-lg leading-snug font-medium">
                  {week.length} decisions moved this week. The biggest change: PlantPal's plant ID now runs on the phone. {toConfirm.length} decisions came in from AI tools and are waiting for a person, {mine.length} of them yours.
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                {[
                  ["New this week", week.length, "conf" as Status],
                  ["To confirm", toConfirm.length, "inf" as Status],
                  ["Changed", changed.length, "chg" as Status],
                  ["Still open", open.length, "open" as Status],
                ].map(([label, n, st]) => (
                  <div key={label as string} className="rounded-lg border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><StatusIcon status={st as Status} className="size-3.5" />{label}</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">{n}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {PROJECTS.map((p) => {
              const ds = DECISIONS.filter((d) => d.project === p.id)
              const recent = ds.filter((d) => THIS_WEEK.includes(d.when ?? "") || d.status === "open").slice(0, 5)
              const waiting = ds.filter((d) => d.status === "inf").length
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ProjectMark project={p.id} className="size-6" />{p.name}</CardTitle>
                    <CardDescription>
                      {ds.filter((d) => THIS_WEEK.includes(d.when ?? "")).length} decisions this week{waiting > 0 && ` · ${waiting} to confirm`}
                    </CardDescription>
                    <CardAction><Button size="sm" variant="outline" onClick={() => navigate(`/p/${p.id}/decisions`)}><Network />Open canvas</Button></CardAction>
                  </CardHeader>
                  <CardContent className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5" />What changed</div>
                        <p className="text-sm leading-relaxed">{WEEK_SUMMARY[p.id]}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Where it stands</div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{PROJECT_DECISION_SUMMARY[p.id]}</p>
                      </div>
                    </div>
                    <div className="divide-y self-start rounded-lg border">
                      {recent.map((d) => (
                        <button key={d.id} className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted" onClick={() => navigate(`/decisions/${d.id}`)}>
                          <StatusIcon status={d.status} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm">{d.title}</span>
                            <span className="block text-xs text-muted-foreground">
                              {STATUS_LABEL[d.status]} · {d.part} · {d.when ?? `due ${d.due}`}{d.tool && ` · from ${d.tool}`}
                            </span>
                          </span>
                          <PersonAvatar id={d.owner} />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : (
          <DecisionList decisions={DECISIONS} basePath="/decisions" showProject />
        )}
      </div>
      <DecisionSheet basePath="/decisions" id={id} />
    </AppShell>
  )
}

// Decision detail opens over the current view as a sheet, so the view stays in place.
function DecisionSheet({ basePath, id }: { basePath: string; id?: string }) {
  const d = DECISIONS.find((x) => x.id === id)
  return (
    <Sheet open={!!d} onOpenChange={(o) => !o && navigate(basePath)}>
      <SheetContent className="w-[480px] sm:max-w-[480px]">
        {d && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2"><StatusBadge status={d.status} /><span className="text-xs text-muted-foreground">{projectName(d.project)} · {d.part}</span></div>
              <SheetTitle className="text-lg">{d.title}</SheetTitle>
              <SheetDescription>{d.by ? `Decided by ${d.by}` : `Owner ${PEOPLE[d.owner].name}`}{d.when && ` · ${d.when}`}{d.tool && ` · from ${d.tool}`}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4">
              {d.was && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Was</div>
                  <p className="text-sm line-through">{d.was}</p>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Why</div>
                <p className="text-sm">{d.why ?? <span className="text-muted-foreground">No reason recorded yet.</span>}</p>
              </div>
              {d.snippet && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Source</div>
                  <blockquote className="rounded-md bg-muted p-3 text-sm">“{d.snippet}”</blockquote>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">History</div>
                <ol className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>{STATUS_LABEL[d.status]}</span><span className="text-muted-foreground">{d.when ?? "—"}</span></li>
                  <li className="flex justify-between"><span>Logged {d.tool ? `by ${d.tool}` : "by hand"}</span><span className="text-muted-foreground">{d.when ?? "—"}</span></li>
                </ol>
              </div>
            </div>
            <SheetFooter className="flex-row">
              {d.status === "inf" && <Button onClick={() => toast("Confirmed")}>Confirm</Button>}
              {d.status === "open" && <Button onClick={() => toast("Decide")}>Decide</Button>}
              <Button variant="outline" onClick={() => toast("Ask why")}>Ask why</Button>
              <Button variant="outline" onClick={() => toast("Flagged")}>Flag</Button>
              <Button variant="ghost" className="ml-auto" onClick={() => toast("Handoff")}>Hand off</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
