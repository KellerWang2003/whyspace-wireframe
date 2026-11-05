import { useState, type ReactNode } from 'react'
import { Copy, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { SavedView } from '@/lib/saved-views'

// Shared top of a table page: title with search on the right, then the view tabs with the page's
// own controls (the ⋯ filter menu, layout toggle, primary action) on the right.

export function TablePageHeader({ title, search, onSearch, placeholder }: { title: string; search: string; onSearch: (q: string) => void; placeholder: string }) {
  return <header className="flex flex-wrap items-center justify-between gap-3">
    <h1 className="type-title">{title}</h1>
    <label className="relative">
      <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
      <Input aria-label={placeholder} placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} className="w-64 max-w-full pl-9" />
    </label>
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
    <DropdownMenuContent align="end" className="w-56">{children}</DropdownMenuContent>
  </DropdownMenu>
}
