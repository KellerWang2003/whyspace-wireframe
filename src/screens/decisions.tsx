import { useState } from "react"
import { toast } from "sonner"
import { List, Network, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/app/status-badge"
import { DecisionList } from "@/screens/decision-views"
import { DecisionCanvas } from "@/screens/decision-canvas"
import { DECISIONS, PEOPLE, PROJECTS, STATUS_LABEL, partsOf, projectName, type Decision, type Status } from "@/data"
import { navigate } from "@/lib/router"

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

// Decision detail opens over the current view as a sheet, so the view stays in place.
export function DecisionSheet({ basePath, id }: { basePath: string; id?: string }) {
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
