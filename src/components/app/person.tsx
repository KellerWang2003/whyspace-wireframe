import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { PEOPLE, initials } from "@/data"
import { DuetAvatar } from "@/app/duet-avatar"

// Keller and Kelly share a first letter, so avatars use two letters where one would collide.
const AVATAR: Record<string, string> = { MC: "Ke", KL: "Kl" }

// High-fi shows real faces: freely licensed portraits in public/people (credits there). The wireframe keeps initials.
const PHOTO = new Set(["MC", "CH", "TR", "KL", "JK"])
const photoOf = (id: string) => (PHOTO.has(id) ? `${import.meta.env.BASE_URL}people/${id}.jpg` : undefined)

// agent: the person's Duet. High-fi draws its own painted face (app/duet-avatar.tsx); the wireframe keeps the
// person's face with a dashed edge.
export function PersonAvatar({ id, className, agent }: { id: string; className?: string; agent?: boolean }) {
  const p = PEOPLE[id]
  const hifi = useHifi()
  const photo = hifi ? photoOf(id) : undefined
  if (agent && hifi) return <DuetAvatar owner={id} className={className} />
  if (photo) {
    return (
      <Avatar className={cn("size-6 bg-muted", agent && "outline-1 outline-offset-1 outline-dashed outline-foreground/60", className)}>
        <img src={photo} alt={p?.name ?? id} draggable={false} className={cn("size-full object-cover", agent && "opacity-80 saturate-50")} />
      </Avatar>
    )
  }
  return (
    <Avatar className={cn("size-6", className)}>
      <AvatarFallback className={cn("text-[10px]", agent && "border border-dashed border-foreground/60 bg-background")}>{AVATAR[id] ?? initials(p?.name ?? id)}</AvatarFallback>
    </Avatar>
  )
}
