import { SpoolsArt, UnrollArt } from "@/components/brand/ribbons"
import { useNoProjectsArt } from "@/components/brand/no-projects-pick"

// No projects yet: whichever of the two new pieces is picked (no-projects-pick.ts).
export function NoProjectsArt({ className }: { className?: string }) {
  return useNoProjectsArt() === "unroll" ? <UnrollArt className={className} /> : <SpoolsArt className={className} />
}
