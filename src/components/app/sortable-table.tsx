import type { ReactNode } from 'react'
import type { Sort } from '@/lib/use-sort'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Sortable column header for any table. Pair it with useSort from @/lib/use-sort.

export function SortableHead<K extends string>({ id, sort, onSort, className, children }: { id: K; sort: Sort<K>; onSort: (key: K) => void; className?: string; children: ReactNode }) {
  const dir = sort?.key === id ? sort.dir : null
  const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ChevronsUpDown
  return <TableHead className={className} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}>
    <button type="button" onClick={() => onSort(id)} className={cn('group -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted hover:text-foreground', dir && 'text-foreground')}>
      {children}
      <Icon className={cn('size-3.5 shrink-0', dir ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground')} />
    </button>
  </TableHead>
}
