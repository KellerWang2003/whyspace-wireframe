import { useState } from "react"
import { toast } from "sonner"
import { Archive, ArrowDown, ArrowUp, Check, Kanban, LayoutList, MessageCircle, MoreHorizontal, PanelLeft, Pencil, Plus, Spline, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PersonAvatar } from "@/components/app/person"
import { MarkTile, ProjectLabel, ProjectMark } from "@/components/app/project-mark"
import { MARK_COLORS } from "@/components/app/project-icon"
import { ProjectIconButton } from "@/components/app/project-icon-picker"
import { MarkIcon, StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { MiniStack } from "@/components/app/tasks"
import { DecisionCard } from "@/app/card"
import { decisionsOf } from "@/app/card-model"
import { CaughtForYou, Faces, Item } from "@/app/caught"
import { ConfirmedCount, ThreadCount } from "@/app/confirmed"
import { pigmentOf } from "@/app/hifi-model"
import { useHifi } from "@/lib/hifi"
import { LEVELS } from "@/app/duet-state"
import { DuetFaceMaker } from "@/app/duet-avatar"
import { EmptyStart } from "@/app/empty-start"
import { Count } from "@/app/home"
import { ProjectSearch } from "@/app/project-search"
import { TaskList } from "@/app/task-list"
import { ThreadIcon, ThreadTag } from "@/app/thread-ui"
import { intentOf, summaryOf, threadOf, useThreads } from "@/app/threads"
import { ViewPills } from "@/app/view-pills"
import { ARTIFACTS, DECISIONS, PEOPLE, PROJECTS, TASKS, TASK_STATUS_LABEL, decisionById, type Status, type TaskStatus } from "@/data"
import { useSavedViews, type SavedView } from "@/lib/saved-views"
import { useStore } from "@/lib/store"
import { useTasks } from "@/lib/work"
import { Group, Row, Specimen } from "./kit"
import { CountBadge, NeedsDot } from "@/components/app/count-badge"
import { px, useComputed } from "./measure"

// Every specimen here is the component the app renders, with Whiskr's own content.
const WHISKR = PROJECTS.find((p) => p.id === "whiskr")!
const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

/* ---------- Buttons ---------- */

type Variant = "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"
type Size = "xs" | "sm" | "default" | "lg"
type IconSize = "icon-xs" | "icon-sm" | "icon" | "icon-lg"

const VARIANTS: { v: Variant; label: string; Icon?: typeof Check }[] = [
  { v: "default", label: "Confirm", Icon: Check },
  { v: "outline", label: "Talk it over" },
  { v: "secondary", label: "Reply" },
  { v: "ghost", label: "Open in Duet", Icon: MessageCircle },
  { v: "link", label: "Copy as text" },
  { v: "destructive", label: "Delete", Icon: Trash2 },
]

function SizedButton({ size }: { size: Size }) {
  const [ref, c] = useComputed<HTMLButtonElement>()
  return (
    <Specimen name={size} note={c && `${px(c.height)}px`}>
      <Button ref={ref} size={size}><Plus />New thread</Button>
    </Specimen>
  )
}

function IconButton({ size }: { size: IconSize }) {
  const [ref, c] = useComputed<HTMLButtonElement>()
  return (
    <Specimen name={size} note={c && `${px(c.height)}px`}>
      <Button ref={ref} size={size} variant="outline" aria-label="New thread"><Plus /></Button>
    </Specimen>
  )
}

export function ButtonsSection() {
  return (
    <>
      <Group title="Variants">
        <Row className="gap-x-8">{VARIANTS.map(({ v, label, Icon }) => <Specimen key={v} name={v}><Button variant={v}>{Icon && <Icon />}{label}</Button></Specimen>)}</Row>
      </Group>
      <Group title="Primary" note="High-fi draws every labeled primary button at one size">
        <Row className="items-end">
          <Specimen name="Page"><Button><Plus />New project</Button></Specimen>
          <Specimen name="Dialog"><Button>Create</Button></Specimen>
          <Specimen name="Delete"><Button variant="destructive"><Trash2 />Delete</Button></Specimen>
        </Row>
      </Group>
      <Group title="Sizes" note="Under High-fi, sm and lg match default; xs stays for actions inside rows">
        <Row className="items-end">{(["xs", "sm", "default", "lg"] as const).map((s) => <SizedButton key={s} size={s} />)}</Row>
      </Group>
      <Group title="Icon only">
        <Row className="items-end">{(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => <IconButton key={s} size={s} />)}</Row>
      </Group>
      <Group title="Disabled">
        <Row>
          <Specimen name="default"><Button disabled><Check />Confirm</Button></Specimen>
          <Specimen name="outline"><Button variant="outline" disabled>Talk it over</Button></Specimen>
        </Row>
      </Group>
    </>
  )
}

/* ---------- Badges ---------- */

const STATES: Status[] = ["conf", "prec", "inf", "flag"]

export function BadgesSection() {
  return (
    <>
      <Group title="Variants">
        <Row>
          <Specimen name="default"><Badge>New</Badge></Specimen>
          <Specimen name="secondary"><Badge variant="secondary">Pro</Badge></Specimen>
          <Specimen name="outline"><Badge variant="outline">Archived</Badge></Specimen>
        </Row>
      </Group>
      <Group title="Decision state">
        <Row>{STATES.map((s) => <Specimen key={s} name={s}><StatusBadge status={s} /></Specimen>)}</Row>
      </Group>
      <Group title="Count badge" note="A painted pebble, 20px tall, in ink with a paper number. Used on the rail (projects show their count too), in Chats, Waiting for you and Today.">
        <Row>
          <Specimen name="CountBadge"><CountBadge n={3} size="md" /></Specimen>
          <Specimen name="CountBadge"><CountBadge n={12} size="md" /></Specimen>
          <Specimen name='suffix="new"'><CountBadge n={2} suffix="new" size="md" /></Specimen>
          <Specimen name="NeedsDot"><NeedsDot /></Specimen>
        </Row>
      </Group>
      <Group title="Count">
        <Row><Specimen name="Count"><span className="flex items-center gap-1.5 text-sm font-medium">Tasks<Count n={3} /></span></Specimen></Row>
      </Group>
    </>
  )
}

/* ---------- Inputs ---------- */

export function InputsSection() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TaskStatus>("prog")
  return (
    <>
      <Group title="Text">
        <div className="flex max-w-sm flex-col gap-6">
          <Field>
            <FieldLabel htmlFor="ds-thread-name">Name</FieldLabel>
            <Input id="ds-thread-name" placeholder="Untitled thread" />
          </Field>
          <Field>
            <FieldLabel htmlFor="ds-thread-intent">What is it for?</FieldLabel>
            <Textarea id="ds-thread-intent" placeholder="What is this thread for?" />
          </Field>
        </div>
      </Group>
      <Group title="Search">
        <Row>
          <Specimen name="ProjectSearch"><ProjectSearch value={search} onChange={setSearch} label="Search Whiskr" /></Specimen>
          <Specimen name="Kbd"><Kbd>⌘K</Kbd></Specimen>
        </Row>
      </Group>
      <Group title="Select">
        <Specimen name="Select">
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger className="w-44" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_LABEL) as [TaskStatus, string][]).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Specimen>
      </Group>
    </>
  )
}

/* ---------- Choices ---------- */

export function ChoicesSection() {
  const tasks = TASKS.filter((t) => t.project === WHISKR.name).slice(0, 2)
  return (
    <>
      <Group title="Checkbox">
        <div className="flex flex-col gap-3">
          {tasks.map((t, i) => (
            <label key={t.id} className="flex items-center gap-2.5 text-sm"><Checkbox defaultChecked={i === 1} />{t.title}</label>
          ))}
        </div>
      </Group>
      <Group title="Radio">
        <RadioGroup defaultValue={LEVELS[0].value} aria-label="When teammates ask your Duet" className="gap-3">
          {LEVELS.map((l) => (
            <label key={l.value} className="flex items-center gap-2.5 text-sm"><RadioGroupItem value={l.value} />{l.label}</label>
          ))}
        </RadioGroup>
      </Group>
      <Group title="Switch">
        <label className="flex items-center gap-3 text-sm"><Switch defaultChecked />Answer in Slack</label>
      </Group>
      <Group title="Toggle group">
        <ToggleGroup type="single" variant="outline" size="sm" defaultValue="week" aria-label="Calendar view">
          <ToggleGroupItem value="day" className="px-3">Day</ToggleGroupItem>
          <ToggleGroupItem value="week" className="px-3">Week</ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-3">Month</ToggleGroupItem>
        </ToggleGroup>
      </Group>
    </>
  )
}

/* ---------- Tabs ---------- */

// The saved views Home's task list starts with. These are the page's own copies, kept apart from Home's.
type NoFilters = Record<string, never>
const VIEW_SEED: SavedView<NoFilters>[] = [
  { id: "all", name: "All", filters: {}, sort: null, locked: true },
  { id: "mine", name: "My open tasks", filters: {}, sort: null },
  { id: "week", name: "Due this week", filters: {}, sort: null },
]

export function TabsSection() {
  const views = useSavedViews<NoFilters>("design-system", VIEW_SEED, {})
  const marketing = threadOf(WHISKR.id, "Marketing")
  const n = {
    tasks: TASKS.filter((t) => t.project === WHISKR.name && t.part === marketing.part && t.status !== "done").length,
    decisions: DECISIONS.filter((d) => d.project === WHISKR.id && d.part === marketing.part).length,
    artifacts: ARTIFACTS.filter((a) => a.project === WHISKR.id && a.part === marketing.part).length,
  }
  return (
    <>
      <Group title="Segmented">
        <Tabs defaultValue="list">
          <TabsList className="h-8 [&_button]:text-xs">
            <TabsTrigger value="list"><LayoutList />Table</TabsTrigger>
            <TabsTrigger value="board"><Kanban />Board</TabsTrigger>
          </TabsList>
        </Tabs>
      </Group>
      <Group title="Line">
        <Tabs defaultValue="tasks">
          <div className="border-b pb-1.5">
            <TabsList variant="line" className="-ml-2 [&>button]:after:!bottom-[-11px]">
              <TabsTrigger value="tasks">Tasks<Count n={n.tasks} /></TabsTrigger>
              <TabsTrigger value="decisions">Decisions<Count n={n.decisions} /></TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts<Count n={n.artifacts} /></TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </Group>
      <Group title="Saved views"><ViewPills v={views} /></Group>
    </>
  )
}

/* ---------- Menus and dialogs ---------- */

export function OverlaysSection() {
  const { openDecision } = useStore()
  const threads = useThreads(WHISKR.id)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Group title="Menus">
        <Row>
          <Specimen name="DropdownMenu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="icon-sm" aria-label="Marketing options"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem><Pencil />Rename</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><ArrowUp />Move up</DropdownMenuItem>
                <DropdownMenuItem><ArrowDown />Move down</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Archive />Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Specimen>
          <Specimen name="Popover">
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" size="sm">Threads</Button></PopoverTrigger>
              <PopoverContent align="start" className="flex w-52 flex-col gap-2.5 text-sm">
                {threads.map((t) => <ThreadTag key={t.id} projectId={WHISKR.id} part={t.part} />)}
              </PopoverContent>
            </Popover>
          </Specimen>
          <Specimen name="Tooltip">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="outline" size="icon-sm" aria-label="Collapse sidebar"><PanelLeft /></Button></TooltipTrigger>
              <TooltipContent>Collapse sidebar</TooltipContent>
            </Tooltip>
          </Specimen>
        </Row>
      </Group>
      <Group title="Dialogs">
        <Row>
          <Specimen name="Dialog">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus />New thread</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>New thread</DialogTitle></DialogHeader>
                <Field>
                  <FieldLabel htmlFor="ds-dialog-name">Name</FieldLabel>
                  <Input id="ds-dialog-name" placeholder="Untitled thread" autoFocus />
                </Field>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => setOpen(false)}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Specimen>
          <Specimen name="Decision sheet">
            <Button variant="outline" size="sm" onClick={() => openDecision("nored")}>Open a decision</Button>
          </Specimen>
        </Row>
      </Group>
      <Group title="Toast">
        <Specimen name="toast">
          <Button variant="outline" size="sm" onClick={() => toast("Decision confirmed")}>Show a toast</Button>
        </Specimen>
      </Group>
    </>
  )
}

/* ---------- People ---------- */

const AVATAR_SIZES = ["size-4", "size-5", "size-6", "size-8", "size-14"]

export function PeopleSection() {
  return (
    <>
      <Group title="Avatars">
        <Row>{Object.values(PEOPLE).map((p) => <Specimen key={p.id} name={p.id} note={p.name}><PersonAvatar id={p.id} /></Specimen>)}</Row>
      </Group>
      <Group title="Sizes">
        <Row className="items-end">{AVATAR_SIZES.map((s) => <Specimen key={s} name={s}><PersonAvatar id="MC" className={s} /></Specimen>)}</Row>
      </Group>
      <Group title="Duet" note="Every Duet is a painted pebble at 45% pigment, the same paint as the rail's project tiles. A teammate's Duet carries their photo. Hover one: it hops and grins.">
        <div className="flex flex-col gap-8">
        <Row className="items-end">
          {["size-5", "size-6", "size-8", "size-14"].map((s) => <Specimen key={s} name={s} note={s === "size-5" ? "Your Duet" : undefined}><PersonAvatar id="MC" agent className={s} /></Specimen>)}
        </Row>
        <Row>{["TR", "CH", "KL", "JK"].map((id) => <Specimen key={id} name={id} note={`${first(id)}’s Duet`}><PersonAvatar id={id} agent className="size-8" /></Specimen>)}</Row>
        <Row><Specimen name="DuetFaceMaker" note="Your Duet, from the Duet list"><DuetFaceMaker /></Specimen></Row>
        </div>
      </Group>
      <Group title="No photo">
        <Row><Specimen name="initials" note="Someone new"><PersonAvatar id="Sam Lee" /></Specimen></Row>
      </Group>
      <Group title="Together">
        <Row>
          <Specimen name="Faces" note="Asked, with who else"><Faces ids={["CH", "TR"]} /></Specimen>
          <Specimen name="MiniStack" note="On a task"><MiniStack ids={["MC", "CH", "KL"]} /></Specimen>
        </Row>
      </Group>
    </>
  )
}

/* ---------- Projects and threads ---------- */

export function PlacesSection() {
  const threads = useThreads(WHISKR.id)
  const hifi = useHifi()
  const decisions = DECISIONS.filter((d) => d.project === WHISKR.id)
  return (
    <>
      <Group title="Project marks" note="In the rail, the project header and the New project dialog, a hand-cut painted tile at 45% pigment with an ink icon; the rail's open tab follows its outline. In rows, the icon alone in its pigment. A new project starts with an icon and a pigment picked for it; there are no letter marks.">
        <div className="flex flex-col gap-8">
          <Row>
            <Specimen name="16px" note="In rows"><ProjectMark project={WHISKR.id} className="size-4" /></Specimen>
            <Specimen name="30px tile" note="Rail"><ProjectMark project={WHISKR.id} look="tile" className="size-[30px]" /></Specimen>
            <Specimen name="36px" note="Project header, Today"><ProjectMark project={WHISKR.id} className="size-9" /></Specimen>
            <Specimen name="Change it" note="Click the header mark"><ProjectIconButton id={WHISKR.id} className="size-9 rounded-lg" /></Specimen>
          </Row>
          <Row className="gap-x-8">
            {MARK_COLORS.map((c) => (
              <Specimen key={c} name={c}>
                <span className="flex items-center gap-3">
                  <MarkTile id={`ds-${c}`} name="Whiskr" icon={{ icon: "cat", color: c }} className="size-6" />
                </span>
              </Specimen>
            ))}
          </Row>
        </div>
      </Group>
      <Group title="Projects">
        <ul className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">{PROJECTS.map((p) => <li key={p.id} className="min-w-0"><ProjectLabel project={p.id} /></li>)}</ul>
      </Group>
      <Group title="Thread tiles" note="On a project's home: the thread's icon in its pigment, its confirmed decisions, and what it is for">
        <ul className="flex max-w-md flex-col gap-1.5">
          {threads.slice(0, 4).map((t) => {
            const summary = intentOf(t) ?? summaryOf(WHISKR.id, t.part)
            return (
              <li key={t.id}>
                <button type="button" data-tile className="flex w-full flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2 text-left transition-colors hover:bg-muted">
                  <span className="flex w-full items-center gap-2 text-sm">
                    <ThreadIcon thread={t} style={hifi ? { color: pigmentOf(t) } : undefined} />
                    <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                    <ConfirmedCount decisions={decisions.filter((d) => d.part === t.part)} />
                  </span>
                  {summary && <span className="line-clamp-2 pl-[22px] text-xs leading-relaxed text-muted-foreground">{summary}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </Group>
      <Group title="Thread tags" note="Where a task, decision or chat belongs, with its count">
        <ul className="flex max-w-sm flex-col gap-3 text-sm">
          {threads.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <ThreadTag projectId={WHISKR.id} part={t.part} className="min-w-0 flex-1" />
              <ThreadCount projectId={WHISKR.id} part={t.part} />
            </li>
          ))}
        </ul>
      </Group>
    </>
  )
}

/* ---------- Rows ---------- */

export function RowsSection() {
  const { openDecision } = useStore()
  const clash = decisionById("redcard")
  const theirs = decisionById(clash?.clashes)
  const done = decisionById("purr")
  return (
    <Group title="While you were away">
      <div className="mb-6 max-w-2xl @container"><CaughtForYou project={WHISKR} /></div>
      <ul data-rows className="flex max-w-2xl flex-col divide-y rounded-lg border bg-background">
        {clash && theirs && (
          <Item face={<span className="flex size-6 items-center justify-center"><MarkIcon mark="triangle" className="size-3.5" /></span>}
            text={<>Your “{clash.title}” clashes with {first(theirs.owner)}’s decision</>}
            sub={[`${first(theirs.owner)} confirmed “${theirs.title}”`]}
            onOpen={() => openDecision(clash.id)}
            action={<Button size="xs" variant="outline" onClick={() => openDecision(clash.id)}>Talk it over</Button>} />
        )}
        <Item face={<Faces ids={["CH"]} />}
          text={<><span className="font-medium">Christine</span> asked whether the launch date moves</>}
          sub={["Nothing of yours covers it yet"]}
          action={<Button size="xs" variant="outline">Reply</Button>} />
        {done && (
          <Item face={<PersonAvatar id={done.owner} className="size-6" />}
            text={done.title} mark={<StatusIcon status={done.status} className="size-3 shrink-0 text-muted-foreground" />}
            sub={[done.by ?? first(done.owner), ...(done.tool ? [done.tool] : []), ...(done.when ? [done.when] : [])]}
            onOpen={() => openDecision(done.id)} />
        )}
      </ul>
    </Group>
  )
}

/* ---------- Decision card ---------- */

export function CardSection() {
  const promo = ARTIFACTS.find((a) => a.id === "w7")
  if (!promo) return null
  return (
    <Group title={promo.name}>
      <DecisionCard artifact={promo} decisions={decisionsOf(promo, TASKS)} title={promo.name} className="max-w-2xl" />
    </Group>
  )
}

/* ---------- Table ---------- */

export function TableSection() {
  const marketing = threadOf(WHISKR.id, "Marketing")
  const tasks = useTasks().filter((t) => t.project === WHISKR.name && t.part === marketing.part)
  return (
    <div className="@container">
      <TaskList projectId={WHISKR.id} tasks={tasks} thread={marketing} />
    </div>
  )
}

/* ---------- Empty states ---------- */

export function EmptySection() {
  return (
    <Group title="No threads yet">
      <Specimen name="EmptyStart" className="block w-full max-w-xl">
        <EmptyStart icon={Spline} title="Start with a thread" action={<Button size="sm"><Plus />New thread</Button>} />
      </Specimen>
    </Group>
  )
}
