import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { PEOPLE, initials } from "@/data"

export function PersonAvatar({ id, className }: { id: string; className?: string }) {
  const p = PEOPLE[id]
  return (
    <Avatar className={cn("size-6", className)}>
      <AvatarFallback className="text-[10px]">{initials(p?.name ?? id)}</AvatarFallback>
    </Avatar>
  )
}

export function AvatarStack({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const extra = ids.length - max
  return (
    <div className="flex -space-x-2 *:ring-2 *:ring-background">
      {ids.slice(0, max).map((id) => (
        <PersonAvatar key={id} id={id} className="size-7" />
      ))}
      {extra > 0 && (
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">+{extra}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
