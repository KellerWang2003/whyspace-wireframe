import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Copy, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { SavedView } from '@/lib/saved-views'

// Shared top of a table page: title with search on the right, then the view tabs with the page's
// own controls (the ⋯ filter menu, layout toggle, primary action) on the right.

export function TablePageHeader({ title, search, onSearch, placeholder, children }: { title: string; search: string; onSearch: (q: string) => void; placeholder: string; children?: ReactNode }) {
  return <header className="flex flex-wrap items-center justify-between gap-3">
    <h1 className="type-title">{title}</h1>
    <div className="flex items-center gap-2">
      <label className="relative">
        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input aria-label={placeholder} placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="w-64 max-w-full pl-9" />
      </label>
      {children}
    </div>
  </header>
}

type Views = {
  views: SavedView<unknown>[]
  active: SavedView<unknown>
  select: (id: string) => void
  add: () => string
  duplicate: (id: string) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
}

export function ViewTabs({ v, children }: { v: Views; children?: ReactNode }) {
  const [renaming, setRenaming] = useState<string | null>(null)
  return <div className="flex items-end gap-x-3 border-b">
    <div className="-mb-px flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Views">
      {v.views.map(view => <ViewTab key={view.id} view={view} selected={view.id === v.active.id} renaming={renaming === view.id}
        onSelect={() => v.select(view.id)} onRename={() => setRenaming(view.id)}
        onRenamed={name => { if (name) v.rename(view.id, name); setRenaming(null) }}
        onDuplicate={() => v.duplicate(view.id)} onDelete={view.locked ? undefined : () => v.remove(view.id)} />)}
    </div>
    <Button variant="ghost" size="icon-sm" className="mb-1.5 -ml-2 shrink-0 text-muted-foreground" aria-label="Add view" onClick={() => setRenaming(v.add())}><Plus /></Button>
    <span className="flex-1" />
    {children && <div className="flex shrink-0 items-center gap-2 pb-1.5">{children}</div>}
  </div>
}

function ViewTab({ view, selected, renaming, onSelect, onRename, onRenamed, onDuplicate, onDelete }: {
  view: SavedView<unknown>; selected: boolean; renaming: boolean
  onSelect: () => void; onRename: () => void; onRenamed: (name: string) => void; onDuplicate: () => void; onDelete?: () => void
}) {
  if (renaming) return <form className="border-b-2 border-foreground pb-1" onSubmit={e => { e.preventDefault(); onRenamed(new FormData(e.currentTarget).get('name')?.toString().trim() ?? '') }}>
    <Input name="name" autoFocus defaultValue={view.name} aria-label="View name" className="h-8 w-40" onFocus={e => e.currentTarget.select()}
      onBlur={e => onRenamed(e.currentTarget.value.trim())} onKeyDown={e => e.key === 'Escape' && onRenamed('')} />
  </form>
  // Options sit on the open tab only, so the row stays tight.
  return <div className={cn('flex shrink-0 items-center border-b-2 pb-1', selected ? 'border-foreground' : 'border-transparent')}>
    <Button variant="ghost" size="sm" role="tab" aria-selected={selected} className={cn(!selected && 'text-muted-foreground')} onClick={onSelect} onDoubleClick={onRename}>{view.name}</Button>
    {selected && <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label={`${view.name} options`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={onRename}><Pencil />Rename</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><Copy />Duplicate</DropdownMenuItem>
        {onDelete && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 />Delete</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>}
  </div>
}

// The ⋯ menu that holds a page's filters. A dot shows when the open view filters anything.
export function FilterMenu({ active, children }: { active: boolean; children: ReactNode }) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground" aria-label="Filters and view options">
        <MoreHorizontal />
        {active && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground" />}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={e => e.preventDefault()}>{children}</DropdownMenuContent>
  </DropdownMenu>
}

/* ---------- Toolbar parts (Nov 11, tidier tasks toolbar) ---------- */

// The open view's own actions, for whichever menu holds them.
export function ViewActions({ v, onRename }: { v: Views; onRename: (id: string) => void }) {
  return <>
    <DropdownMenuItem onSelect={() => onRename(v.add())}><Plus />New view</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => onRename(v.active.id)}><Pencil />Rename view</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => v.duplicate(v.active.id)}><Copy />Duplicate view</DropdownMenuItem>
    {!v.active.locked && <DropdownMenuItem variant="destructive" onSelect={() => v.remove(v.active.id)}><Trash2 />Delete view</DropdownMenuItem>}
  </>
}

function RenameField({ name, onDone, className }: { name: string; onDone: (name: string) => void; className?: string }) {
  // Focus after the menu that opened it has closed, so the menu doesn't take focus back.
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setTimeout(() => { ref.current?.focus(); ref.current?.select() }, 0); return () => clearTimeout(t) }, [])
  return <form onSubmit={e => { e.preventDefault(); onDone(new FormData(e.currentTarget).get('name')?.toString().trim() ?? '') }}>
    <Input ref={ref} name="name" defaultValue={name} aria-label="View name" className={cn('h-8 w-40', className)}
      onBlur={e => onDone(e.currentTarget.value.trim())} onKeyDown={e => e.key === 'Escape' && onDone('')} />
  </form>
}

// Views as one segmented control: no per-view menu, no +. Double-click a view to rename it.
export function ViewSegments({ v, renaming, onRename }: { v: Views; renaming: string | null; onRename: (id: string | null) => void }) {
  return <div className="flex max-w-full min-w-0 items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5 [scrollbar-width:none]" role="tablist" aria-label="Views">
    {v.views.map(view => {
      const selected = view.id === v.active.id
      if (renaming === view.id) return <RenameField key={view.id} name={view.name} className="h-7" onDone={name => { if (name) v.rename(view.id, name); onRename(null) }} />
      return <div key={view.id} className={cn('shrink-0 rounded-md', selected && 'bg-background')}>
        <Button variant="ghost" size="sm" role="tab" aria-selected={selected} className={cn('h-7 hover:bg-transparent', !selected && 'text-muted-foreground hover:text-foreground')}
          onClick={() => v.select(view.id)} onDoubleClick={() => onRename(view.id)}>{view.name}</Button>
      </div>
    })}
  </div>
}

// Search as a magnifier that opens into a field, and folds back when left empty.
export function SearchToggle({ value, onChange, placeholder }: { value: string; onChange: (q: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false)
  if (!open && !value) return <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={placeholder} onClick={() => setOpen(true)}><Search /></Button>
  return <SearchField value={value} onChange={onChange} placeholder={placeholder} autoFocus className="w-48"
    onBlur={() => !value && setOpen(false)} onEscape={() => { onChange(''); setOpen(false) }} />
}

export function SearchField({ value, onChange, placeholder, className, autoFocus, onBlur, onEscape }: {
  value: string; onChange: (q: string) => void; placeholder: string; className?: string; autoFocus?: boolean; onBlur?: () => void; onEscape?: () => void
}) {
  return <label className={cn('relative block', className)}>
    <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
    <Input aria-label={placeholder} placeholder={placeholder} value={value} autoFocus={autoFocus} onChange={e => onChange(e.target.value)}
      onBlur={onBlur} onKeyDown={e => e.key === 'Escape' && onEscape?.()} className="h-8 w-full pl-8" />
  </label>
}
