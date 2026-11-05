import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, MoreHorizontal, Palette, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { THREAD_COLORS, addThread, moveThread, nextColor, setShown, threadOf, updateThread, useHidden, useThreads, type Thread } from "./threads"

// A thread's strand color, only ever as a small dot.
export function ThreadDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />
}

// A thread's dot and name, for rows that span threads. Pass the data's `part`.
export function ThreadTag({ projectId, part, className, link = false }: { projectId: string; part: string; className?: string; link?: boolean }) {
  useThreads(projectId)
  const t = threadOf(projectId, part)
  const body = <><ThreadDot color={t.color} /><span className="truncate">{t.name}</span></>
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

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {THREAD_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.name}
          title={c.name}
          onClick={() => onChange(c.value)}
          className={cn("flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition", value === c.value ? "ring-2 ring-foreground" : "hover:ring-1 hover:ring-foreground/30")}
          style={{ backgroundColor: c.value }}
        >
          {value === c.value && <Check className="size-3.5 text-white" />}
        </button>
      ))}
    </div>
  )
}

// New thread: a name and a strand color. Creating it opens the thread.
export function NewThreadDialog({ projectId, open, onOpenChange }: { projectId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState<string | null>(null)
  const picked = color ?? nextColor(projectId)
  const close = () => { setName(""); setColor(null); onOpenChange(false) }
  const create = () => {
    const t = addThread(projectId, name.trim() || "Untitled thread", picked)
    close()
    navigate(`/p/${projectId}/t/${t.id}`)
  }
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New thread</DialogTitle>
          <DialogDescription className="sr-only">Name the thread and pick its color.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); create() }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-thread-name">Name</FieldLabel>
              <Input id="new-thread-name" placeholder="Untitled thread" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <Field>
              <FieldLabel>Color</FieldLabel>
              <ColorPicker value={picked} onChange={setColor} />
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

// A thread's ⋯ menu: rename, color, move (the keyboard way to reorder), archive or restore.
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
            <DropdownMenuSubTrigger><Palette />Color</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {THREAD_COLORS.map((c) => (
                <DropdownMenuItem key={c.value} onSelect={() => updateThread(projectId, thread.id, { color: c.value })}>
                  <ThreadDot color={c.value} className="size-2.5" />{c.name}{thread.color === c.value && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
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
            <ThreadDot color={t.color} /><span className="truncate">{t.name}</span>
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
