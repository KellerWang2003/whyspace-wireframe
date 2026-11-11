import { useState } from "react"
import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SavedView } from "@/lib/saved-views"
import { cn } from "@/lib/utils"

// Saved views as small pills, so they read as a second level under the page's tabs.
// Same behavior as Design A's view tabs: changes save into the open view, + adds one.

type Views = {
  views: SavedView<unknown>[]
  active: SavedView<unknown>
  select: (id: string) => void
  add: () => string
  duplicate: (id: string) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
}

export function ViewPills({ v }: { v: Views }) {
  const [renaming, setRenaming] = useState<string | null>(null)
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Views">
      {v.views.map((view) => {
        const selected = view.id === v.active.id
        if (renaming === view.id) {
          return (
            <form key={view.id} onSubmit={(e) => { e.preventDefault(); const name = new FormData(e.currentTarget).get("name")?.toString().trim(); if (name) v.rename(view.id, name); setRenaming(null) }}>
              <Input name="name" autoFocus defaultValue={view.name} aria-label="View name" className="h-7 w-36 rounded-full text-[13px]" onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => { const name = e.currentTarget.value.trim(); if (name) v.rename(view.id, name); setRenaming(null) }}
                onKeyDown={(e) => e.key === "Escape" && setRenaming(null)} />
            </form>
          )
        }
        return (
          <div key={view.id} className={cn("flex shrink-0 items-center rounded-full", selected && "bg-secondary")}>
            <Button variant="ghost" size="sm" role="tab" aria-selected={selected} className={cn("h-7 rounded-full px-3 text-[13px] hover:bg-transparent", !selected && "text-muted-foreground hover:text-foreground", selected && "pr-1")} onClick={() => v.select(view.id)} onDoubleClick={() => setRenaming(view.id)}>
              {view.name}
            </Button>
            {selected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" className="mr-1 rounded-full text-muted-foreground" aria-label={`${view.name} options`}><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setRenaming(view.id)}><Pencil />Rename</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => v.duplicate(view.id)}><Copy />Duplicate</DropdownMenuItem>
                  {!view.locked && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => v.remove(view.id)}><Trash2 />Delete</DropdownMenuItem></>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}
      <Button variant="ghost" size="icon-xs" className="shrink-0 rounded-full text-muted-foreground" aria-label="Add view" onClick={() => setRenaming(v.add())}><Plus /></Button>
    </div>
  )
}
