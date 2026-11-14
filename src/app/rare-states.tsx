import { useEffect } from "react"
import { Lock, Loader2, TriangleAlert, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { AppShell } from "@/components/app/app-shell"
import { LoadingRibbon } from "@/components/brand/ribbons"
import { setOffline, useOffline } from "@/lib/connection"
import { useHifi } from "@/lib/hifi"
import { navigate } from "@/lib/router"
import { Illo } from "@/components/brand/illo/pieces"

// The rare moments that get a painted illustration under High-fi (Float: on the paper, no frame).
// The wireframe keeps a plain icon in the same spot.

// Someone else's project, opened from a link. (Nov 14: just "No access" and a way back.)
export function NoAccess() {
  const hifi = useHifi()
  return (
    <AppShell crumbs={[{ label: "No access" }]}>
      <Empty className="flex-1">
        <EmptyHeader className="max-w-md">
          {hifi ? <Illo name="no-access" className="mb-3 h-24" /> : <EmptyMedia variant="icon"><Lock /></EmptyMedia>}
          <EmptyTitle className="type-title">No access</EmptyTitle>
        </EmptyHeader>
        <EmptyContent><Button onClick={() => navigate("/today")}>Back to Today</Button></EmptyContent>
      </Empty>
    </AppShell>
  )
}

// Something went wrong, and links to things that are gone: the knotted ribbon.
export function WentWrong() {
  const hifi = useHifi()
  return (
    <AppShell crumbs={[{ label: "Something went wrong" }]}>
      <Empty className="flex-1">
        <EmptyHeader className="max-w-md">
          {hifi ? <Illo name="went-wrong" className="mb-3 h-24" /> : <EmptyMedia variant="icon"><TriangleAlert /></EmptyMedia>}
          <EmptyTitle className="type-title">Something went wrong</EmptyTitle>
        </EmptyHeader>
        <EmptyContent><Button onClick={() => navigate("/today")}>Back to Today</Button></EmptyContent>
      </Empty>
    </AppShell>
  )
}

// Opening Whyspace: the ribbon being drawn, then Today.
export function Opening() {
  const hifi = useHifi()
  useEffect(() => {
    const t = setTimeout(() => navigate("/today"), 2800)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="flex h-svh items-center justify-center bg-background" role="status" aria-label="Opening Whyspace">
      {hifi ? <LoadingRibbon className="w-64" /> : <Loader2 className="size-6 animate-spin text-muted-foreground" />}
    </div>
  )
}

// Lost connection: a strip at the top of the page. Just the thread, broken. No syncing state after.
export function LostConnection() {
  const offline = useOffline()
  const hifi = useHifi()
  if (!offline) return null
  return (
    <div role="status" className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-2 text-sm sm:px-6">
      {hifi ? <Illo name="lost-connection" className="h-7" /> : <WifiOff className="size-4 shrink-0 text-muted-foreground" />}
      <span className="min-w-0 flex-1 truncate font-medium">Lost connection</span>
      <Button size="sm" variant="outline" onClick={() => setOffline(!navigator.onLine)}>Try again</Button>
    </div>
  )
}
