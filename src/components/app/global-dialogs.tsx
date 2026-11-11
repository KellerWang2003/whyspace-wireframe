import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, FileText, FolderKanban, Link2, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DECISIONS, MY_PROJECTS, PLANS, TASKS, projectName } from "@/data"
import { navigate } from "@/lib/router"
import { useStore, type Plan } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DESIGN } from "@/lib/design"
import { ReplyDialog } from "@/app/reply-dialog"
import { SearchPanel } from "@/app/search"
import { SearchC } from "@/design-c/search"
import { SpotArt } from "@/components/brand/spot-art"
import { NewProjectIconButton } from "@/components/app/project-icon-picker"
import { defaultIcon, type ProjectIcon } from "@/components/app/project-icon"

// Everything the nav opens on top of the current screen lives here,
// so Search, New project, Invite, Upgrade and (main design) replying to a teammate work from any page.
export function GlobalDialogs() {
  return (
    <>
      {DESIGN === "c" ? <SearchC /> : DESIGN === "b" ? <SearchPanel /> : <SearchDialog />}
      {DESIGN === "b" && <ReplyDialog />}
      <NewProjectDialog />
      <InviteDialog />
      <UpgradeDialog />
    </>
  )
}

function SearchDialog() {
  const { searchOpen, setSearchOpen, current, openDecision } = useStore()
  const example = current?.example ?? false

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen, setSearchOpen])

  const go = (path: string) => {
    setSearchOpen(false)
    navigate(path)
  }

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search" description="Search decisions, projects and tasks">
      <CommandInput placeholder="Search decisions, projects, tasks…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        {example && (
          <>
            <CommandGroup heading="Decisions">
              {DECISIONS.filter((d) => d.status !== "conf").slice(0, 7).map((d) => (
                <CommandItem key={d.id} onSelect={() => { setSearchOpen(false); openDecision(d.id) }}>
                  <FileText />
                  {d.title}
                  <span className="ml-auto text-xs text-muted-foreground">{projectName(d.project)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {MY_PROJECTS.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/p/${p.id}/home`)}>
                  <FolderKanban />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {TASKS.slice(0, 3).map((t) => (
                <CommandItem key={t.id} onSelect={() => go("/my-tasks")}>
                  <ListChecks />
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

function NewProjectDialog() {
  const { newProjectOpen, setNewProjectOpen } = useStore()
  const [name, setName] = useState("")
  const [icon, setIcon] = useState<ProjectIcon>(() => defaultIcon(String(Date.now())))
  return (
    <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Your team’s AI tools read the brief.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="np-name">Project name</FieldLabel>
            <div className="flex items-center gap-2">
              <NewProjectIconButton name={name || "Whiskr"} value={icon} onChange={setIcon} className="size-9" />
              <Input id="np-name" placeholder="Whiskr" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="np-brief">Brief</FieldLabel>
            <Textarea id="np-brief" rows={3} placeholder="A swipe app where cats find playdate matches." />
          </Field>
          <Field>
            <FieldLabel>Start from</FieldLabel>
            <Select defaultValue="blank">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank project</SelectItem>
                <SelectItem value="import-notion">Import from Notion</SelectItem>
                <SelectItem value="import-linear">Import from Linear</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              setNewProjectOpen(false)
              navigate("/p/whiskr/home")
              toast("Project created")
            }}
          >
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InviteDialog() {
  const { inviteOpen, setInviteOpen, current } = useStore()
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (!inviteOpen) setCopied(false) }, [inviteOpen])
  return (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader className="gap-3">
          <SpotArt name="invite" className="-ml-1 h-28 self-start" />
          <DialogTitle>Invite people to {current?.name}</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="inv-emails">Emails</FieldLabel>
            <Textarea id="inv-emails" rows={3} placeholder="trevor@whiskr.example, kelly@whiskr.example" />
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select defaultValue="member">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="sm:mr-auto sm:-ml-3"
            onClick={() => { setCopied(true); toast("Link copied") }}
          >
            {copied ? <Check /> : <Link2 />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => { setInviteOpen(false); toast("Invites sent") }}>Send invites</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UpgradeDialog() {
  const { upgradeOpen, setUpgradeOpen, current, setPlan } = useStore()
  const [choice, setChoice] = useState<Plan>("Pro")
  return (
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade {current?.name}</DialogTitle>
          <DialogDescription>This needs a paid plan.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={choice} onValueChange={(v) => setChoice(v as Plan)} className="grid grid-cols-2 gap-3">
          {PLANS.slice(1).map((p) => (
            <label
              key={p.name}
              className={cn("flex cursor-pointer flex-col gap-3 rounded-lg border p-4", choice === p.name && "border-foreground")}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <RadioGroupItem value={p.name} />
              </div>
              <div>
                <span className="text-2xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground"> {p.blurb.toLowerCase()}</span>
              </div>
              <ul className="space-y-1.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
            </label>
          ))}
        </RadioGroup>
        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
          <span>5 people × {choice === "Pro" ? "$12" : "$24"}</span>
          <span className="font-medium">{choice === "Pro" ? "$60" : "$120"} / month</span>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Not now</Button>
          </DialogClose>
          <Button
            onClick={() => {
              setPlan(choice)
              setUpgradeOpen(false)
              toast(`${current?.name} is on ${choice} now`)
            }}
          >
            Continue to payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
