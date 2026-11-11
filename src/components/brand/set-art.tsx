import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"

/* One painted piece from the illustration set (illustration-style.ts lists them all).
   Float pieces multiply onto the paper; tile pieces keep their own wash square.
   Only under High-fi: the wireframe stays plain. */

const ROOT = ["invite", "no-access", "tools"]

export function setArtSrc(id: string) {
  return `${import.meta.env.BASE_URL}illustrations/${ROOT.includes(id) ? "" : "set/"}${id}.webp`
}

export function SetArt({ id, className, force, alt = "" }: { id: string; className?: string; force?: boolean; alt?: string }) {
  const hifi = useHifi()
  if (!hifi && !force) return null
  return <img src={setArtSrc(id)} alt={alt} draggable={false} className={cn("pointer-events-none block w-auto select-none mix-blend-multiply", className)} />
}
