import { useState, type CSSProperties, type ReactNode } from "react"
import { toast } from "sonner"
import {
  Archive, ArchiveRestore, ArrowDown, ArrowUp, BookOpen, Calendar, Camera, ChartColumn, Clapperboard, Code, FlaskConical, Globe, Hash, Heart, Lightbulb,
  Megaphone, MessagesSquare, Mic, MoreHorizontal, Music, Palette, Pencil, PenTool, Presentation, Rocket, Smartphone, Sparkles, Target, Users, Wrench, type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { pigmentOf } from "./hifi-model"
import { addThread, iconOf, moveThread, nextColor, setShown, threadOf, updateThread, useHidden, useThreads, type Thread } from "./threads"

// A strand color as a small dot. Threads show their icon instead; see ThreadIcon.
export function ThreadDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />
}

// The icons a thread can wear, labelled by what they show.
const ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "hash", label: "Hash", Icon: Hash },
  { name: "flask", label: "Flask", Icon: FlaskConical },
  { name: "messages", label: "Chat", Icon: MessagesSquare },
  { name: "bulb", label: "Light bulb", Icon: Lightbulb },
  { name: "palette", label: "Palette", Icon: Palette },
  { name: "pen", label: "Pen", Icon: PenTool },
  { name: "phone", label: "Phone", Icon: Smartphone },
  { name: "code", label: "Code", Icon: Code },
  { name: "wrench", label: "Wrench", Icon: Wrench },
  { name: "megaphone", label: "Megaphone", Icon: Megaphone },
  { name: "film", label: "Clapperboard", Icon: Clapperboard },
  { name: "camera", label: "Camera", Icon: Camera },
  { name: "music", label: "Music", Icon: Music },
  { name: "mic", label: "Microphone", Icon: Mic },
  { name: "presentation", label: "Presentation", Icon: Presentation },
  { name: "book", label: "Book", Icon: BookOpen },
  { name: "users", label: "People", Icon: Users },
  { name: "chart", label: "Chart", Icon: ChartColumn },
  { name: "target", label: "Target", Icon: Target },
  { name: "rocket", label: "Rocket", Icon: Rocket },
  { name: "calendar", label: "Calendar", Icon: Calendar },
  { name: "globe", label: "Globe", Icon: Globe },
  { name: "sparkles", label: "Sparkles", Icon: Sparkles },
  { name: "heart", label: "Heart", Icon: Heart },
]
const ICON_OF: Record<string, LucideIcon> = Object.fromEntries(ICONS.map((i) => [i.name, i.Icon]))

// A thread's icon: how you spot the thread wherever it's named. It stays gray so color keeps
// meaning status (yellow is a possible misalignment), never which thread something is in.
export function ThreadIcon({ thread, className, style }: { thread: Pick<Thread, "icon" | "part">; className?: string; style?: CSSProperties }) {
  const Icon = ICON_OF[iconOf(thread)] ?? Hash
  return <Icon aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground", className)} style={style} />
}

// A thread's icon and name, for rows that span threads. Pass the data's `part`.
export function ThreadTag({ projectId, part, className, link = false }: { projectId: string; part: string; className?: string; link?: boolean }) {
  useThreads(projectId)
  const t = threadOf(projectId, part)
  const body = <><ThreadIcon thread={t} /><span className="truncate">{t.name}</span></>
  if (!link) return <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>{body}</span>
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`/p/${projectId}/t/${t.id}`) }}
      className={cn("inline-flex min-w-0 items-center gap-1.5 rounded-sm hover:underline", className)}
    >
      {body}
    </button>
  )
}

// The icon grid. Inside a menu each icon is a menu item so the keyboard reaches it; elsewhere it's a radio button.
function IconPicker({ icon, onIcon, menu = false }: { icon: string; onIcon: (icon: string) => void; menu?: boolean }) {
  return (
    <div role={menu ? "group" : "radiogroup"} aria-label="Icon" className="grid grid-cols-8 gap-1">
      {ICONS.map(({ name, label, Icon }) => {
        const look = cn("flex size-8 items-center justify-center rounded-md p-0 transition-colors", icon === name ? "bg-muted ring-1 ring-foreground/25" : "hover:bg-muted")
        const glyph = <Icon className="size-4 text-foreground" />
        return menu
          ? <DropdownMenuItem key={name} aria-label={label} title={label} onSelect={() => onIcon(name)} className={look}>{glyph}</DropdownMenuItem>
          : <button key={name} type="button" role="radio" aria-checked={icon === name} aria-label={label} title={label} onClick={() => onIcon(name)} className={look}>{glyph}</button>
      })}
    </div>
  )
}

// The icon grid in a popover; picking an icon closes it.
function IconPopover({ icon, onIcon, children }: { icon: string; onIcon: (icon: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <IconPicker icon={icon} onIcon={(i) => { onIcon(i); setOpen(false) }} />
      </PopoverContent>
    </Popover>
  )
}

// The thread's icon at the head of its page. Click it to pick another.
export function ThreadIconButton({ projectId, thread, className }: { projectId: string; thread: Thread; className?: string }) {
  const hifi = useHifi()
  return (
    <IconPopover icon={iconOf(thread)} onIcon={(icon) => updateThread(projectId, thread.id, { icon })}>
      <button type="button" aria-label="Change icon" title="Change icon" className={cn("flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted data-[state=open]:bg-muted", className)}>
        <ThreadIcon thread={thread} className="size-5" style={hifi ? { color: pigmentOf(thread) } : undefined} />
      </button>
    </IconPopover>
  )
}

// New thread: an icon and a name. Creating it opens the thread. Its strand color comes free
// (the next one unused).
export function NewThreadDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("hash")
  const close = () => { setName(""); setIcon("hash"); onOpenChange(false) }
  const create = () => {
    const t = addThread(projectId, name.trim() || "Untitled thread", nextColor(projectId), icon)
    close()
    navigate(`/p/${projectId}/t/${t.id}`)
  }
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New thread</DialogTitle>
          <DialogDescription className="sr-only">Pick an icon and name the thread.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create() }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-thread-name">Name</FieldLabel>
              <div className="flex gap-2">
                <IconPopover icon={icon} onIcon={setIcon}>
                  <Button type="button" variant="outline" size="icon" aria-label="Icon" title="Icon" className="shrink-0">
                    <ThreadIcon thread={{ icon, part: "" }} className="size-4 text-foreground" />
                  </Button>
                </IconPopover>
                <Input id="new-thread-name" placeholder="Untitled thread" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RenameDialog({ projectId, thread, open, onOpenChange }: { projectId: string; thread: Thread; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState(thread.name)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename thread</DialogTitle>
          <DialogDescription className="sr-only">Give the thread a new name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) updateThread(projectId, thread.id, { name: name.trim() }); onOpenChange(false) }}>
          <Input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus onFocus={(e) => e.currentTarget.select()} />
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// A thread's ⋯ menu: rename, icon, move (the keyboard way to reorder), archive or restore.
export function ThreadMenu({ projectId, thread, trigger, align = "start", side }: { projectId: string; thread: Thread; trigger?: ReactNode; align?: "start" | "end"; side?: "right" | "bottom" }) {
  const [renaming, setRenaming] = useState(false)
  const threads = useThreads(projectId)
  const at = threads.findIndex((t) => t.id === thread.id)
  const archive = () => {
    updateThread(projectId, thread.id, { archived: true })
    navigate(`/p/${projectId}/home`)
    toast(`${thread.name} archived`, { action: { label: "Undo", onClick: () => updateThread(projectId, thread.id, { archived: false }) } })
  }
  const restore = () => {
    updateThread(projectId, thread.id, { archived: false })
    toast(`${thread.name} restored`)
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger ?? <Button variant="ghost" size="icon-sm" aria-label={`${thread.name} options`}><MoreHorizontal /></Button>}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} side={side} className="w-44">
          <DropdownMenuItem onSelect={() => setRenaming(true)}><Pencil />Rename</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><ThreadIcon thread={thread} className="size-4" />Icon</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-2">
              <IconPicker menu icon={iconOf(thread)} onIcon={(icon) => updateThread(projectId, thread.id, { icon })} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {at >= 0 && threads.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={at === 0} onSelect={() => moveThread(projectId, thread.id, threads[at - 1]?.id)}><ArrowUp />Move up</DropdownMenuItem>
              <DropdownMenuItem disabled={at === threads.length - 1} onSelect={() => moveThread(projectId, thread.id, threads[at + 2]?.id)}><ArrowDown />Move down</DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          {thread.archived
            ? <DropdownMenuItem onSelect={restore}><ArchiveRestore />Restore</DropdownMenuItem>
            : <DropdownMenuItem onSelect={archive}><Archive />Archive</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
      {renaming && <RenameDialog projectId={projectId} thread={thread} open={renaming} onOpenChange={setRenaming} />}
    </>
  )
}

// Pick which of a project's threads you see. Hidden ones leave your sidebar and Home's list; their work stays in the rollups.
export function ShowThreadsMenu({ projectId, trigger, side, align = "end" }: { projectId: string; trigger: ReactNode; side?: "right" | "bottom"; align?: "start" | "end" }) {
  const threads = useThreads(projectId)
  const off = useHidden(projectId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Show threads</DropdownMenuLabel>
        {threads.map((t) => (
          <DropdownMenuCheckboxItem key={t.id} checked={!off.includes(t.id)} onCheckedChange={(c) => setShown(projectId, t.id, !!c)} onSelect={(e) => e.preventDefault()}>
            <ThreadIcon thread={t} /><span className="truncate">{t.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
        {off.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => off.forEach((id) => setShown(projectId, id, true))}>Show all</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
