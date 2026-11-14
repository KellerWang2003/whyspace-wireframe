import { FolderKanban } from "lucide-react"
import { useHifi } from "@/lib/hifi"
import { Ribbon, Scene, type P } from "@/components/brand/illo/kit"
import { MARK_COLORS, MARK_HEX, MARK_WASH, hashId, useProjectIcon } from "./project-icon"

/* A project's cover on All projects (Nov 14 2026). If the team uploaded a picture it shows that.
   Otherwise the default: a painted ribbon in the project's own color over its wash, with a thinner
   ribbon in a second pigment. The wireframe keeps its gray concept previews. */

// Pictures the team uploaded. Everyone else gets the painted default.
const UPLOADED: Record<string, string> = { whiskr: "whiskr.jpg", studio: "recall.jpg" }
const WIREFRAME: Record<string, string> = { whiskr: "whiskr.svg", studio: "recall.svg" }

const CURVES: P[][] = [
  [[-10, 62], [60, 32], [130, 62], [190, 24], [260, 44]],
  [[-10, 26], [70, 60], [140, 30], [200, 56], [260, 24]],
  [[-10, 50], [50, 22], [120, 58], [180, 36], [260, 64]],
  [[-10, 40], [55, 66], [120, 28], [185, 58], [260, 34]],
]

const src = (name: string) => `${import.meta.env.BASE_URL}projects/${name}`

export function ProjectCover({ id, name, className = "h-44" }: { id: string; name: string; className?: string }) {
  const hifi = useHifi()
  const { color } = useProjectIcon(id)
  const upload = hifi ? UPLOADED[id] : WIREFRAME[id]
  if (upload) return <img src={src(upload)} alt={`${name} cover`} className={`${className} w-full object-cover`} />
  if (!hifi) return <div className={`${className} flex items-center justify-center`}><FolderKanban className="size-10 text-muted-foreground" /></div>
  const h = hashId(id)
  const pigments = MARK_COLORS.filter((c) => c !== "gray" && c !== "forest")
  const main = color === "gray" ? "forest" : color
  const second = pigments.filter((c) => c !== main)[h % (pigments.length - 1)]
  const curve = CURVES[h % CURVES.length], thin = CURVES[(h + 1) % CURVES.length].map(([x, y]) => [x, y + 12] as P)
  return (
    <Scene viewBox="0 0 240 88" className={`${className} w-full`} style={{ background: MARK_WASH[main] }} seed={(h % 7) + 2}>
      <Ribbon pts={curve} color={MARK_HEX[main]} w={26} start="cut" end="cut" opaque />
      <Ribbon pts={thin} color={MARK_HEX[second]} w={10} start="cut" end="cut" opaque />
    </Scene>
  )
}
