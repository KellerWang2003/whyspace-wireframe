import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"

/* Keller's painted spot illustrations, placed the Float way: the art sits straight on the paper,
   multiplied in, with no frame. Pieces painted on a tinted tile fade out at their edges.
   Only for rare moments (inviting, no access, nothing connected yet), and only under High-fi:
   the wireframe stays plain. */

const SPOT = {
  invite: { src: `${import.meta.env.BASE_URL}illustrations/invite.webp`, tile: false },
  tools: { src: `${import.meta.env.BASE_URL}illustrations/tools.webp`, tile: false },
  "no-access": { src: `${import.meta.env.BASE_URL}illustrations/no-access.webp`, tile: true },
} as const

type SpotName = keyof typeof SPOT

const FADE = "radial-gradient(ellipse 70% 70% at 50% 50%, #000 55%, transparent 100%)"

export function SpotArt({ name, className, force }: { name: SpotName; className?: string; force?: boolean }) {
  const hifi = useHifi()
  if (!hifi && !force) return null
  const s = SPOT[name]
  return (
    <img
      src={s.src}
      alt=""
      draggable={false}
      className={cn("pointer-events-none block w-auto select-none mix-blend-multiply", className)}
      style={s.tile ? { maskImage: FADE, WebkitMaskImage: FADE } : undefined}
    />
  )
}

/** Painted art drawn in code (ribbons.tsx) follows the same rule: only under High-fi. */
export function HifiOnly({ children, force }: { children: React.ReactNode; force?: boolean }) {
  return useHifi() || force ? <>{children}</> : null
}
