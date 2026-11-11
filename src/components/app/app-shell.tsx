import { PanelLeftOpen } from "lucide-react"
import { createContext, Fragment, useContext, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ResizeHandle } from "@/components/app/resize-handle"
import { usePanelWidth } from "@/lib/use-panel-width"
import { AppSidebar } from "@/components/app/app-sidebar"
import { RailSidebar } from "@/app/rail-sidebar"
import { RailSidebarC } from "@/design-c/rail"
import { setPanelCollapsed, usePanelCollapsed } from "@/app/rail-state"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { DESIGN } from "@/lib/design"
import { LostConnection } from "@/app/rare-states"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

export type Crumb = { label: string; to?: string }

// Pages that aren't the app itself draw their own layout: sign up, the marketing site, demos, playgrounds.
const BARE = ["connect", "demo", "site", "hifi", "design-system", "signup", "login", "onboarding", "playground", "loading"]
const Hosted = createContext(false)

// One sidebar for every app page. Switching tabs swaps only the page beside it, so the rail stays
// put (and stays wide under the cursor) instead of being built again with each page.
export function ShellHost({ children }: { children: ReactNode }) {
  const [first] = useRoute()
  const { current } = useStore()
  // A shared Design C build opens on Today when the link carries no screen (see App.tsx).
  const app = !!current && ((DESIGN === "c" && !window.location.hash) || !BARE.includes(first))
  if (!app) return children
  return <Hosted value={true}><Shell>{children}</Shell></Hosted>
}

export function AppShell({ crumbs, actions, children }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode }) {
  const page = <Page crumbs={crumbs} actions={actions}>{children}</Page>
  // Under ShellHost the sidebar is already there. A page shown outside it (a playground) brings its own.
  return useContext(Hosted) ? page : <Shell>{page}</Shell>
}

function Shell({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = usePanelWidth("sidebar", 256)
  const route = useRoute()
  // Main design and C: outside a project, the Duet and Chats (or with the panel folded) the sidebar is just the rail; inside, rail plus the project panel or the list of chats.
  const folded = usePanelCollapsed()
  const rail = DESIGN === "b" || DESIGN === "c"
  const panel = route[0] === "p" || (DESIGN === "b" && (route[0] === "chats" || route[0] === "duet" || route[0] === "settings"))
  // Only a project panel folds; the Duet and Chats lists always show.
  const railOnly = rail && (!panel || (folded && route[0] === "p"))
  // Going to or from a page with the side panel swaps the panel and the page in the same frame: the
  // sidebar's width slide stays off until a frame has been drawn at the new width. Folding the panel
  // and ⌘B still slide.
  const wrap = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const sliding = Array.from(wrap.current?.querySelectorAll<HTMLElement>("[data-slot=sidebar-gap], [data-slot=sidebar-container]") ?? [])
    const slide = (on: boolean) => { for (const s of sliding) s.style.transition = on ? "" : "none" }
    slide(false)
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => slide(true)) })
    return () => { cancelAnimationFrame(frame); slide(true) }
  }, [panel])
  return (
    <SidebarProvider ref={wrap} className="h-svh overflow-hidden" style={{ "--sidebar-width": railOnly ? (DESIGN === "b" ? "var(--rail-w)" : "48px") : `${sidebarWidth}px` } as CSSProperties}>
      <CloseSheetOnNavigate />
      {DESIGN === "c" ? <RailSidebarC /> : DESIGN === "b" ? <RailSidebar /> : <AppSidebar />}
      {!railOnly && <SidebarResizer width={sidebarWidth} onWidth={setSidebarWidth} />}
      {children}
    </SidebarProvider>
  )
}

function Page({ crumbs, actions, children }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode }) {
  const rail = DESIGN === "b" || DESIGN === "c"
  // In a narrow window the sidebar is a sheet and its toggle floats top left: keep a strip for it.
  const narrow = useIsMobile()
  return (
    <SidebarInset className="relative min-h-0 min-w-0 overflow-hidden">
      {rail && <UnfoldButton />}
      {rail ? <FloatingTrigger /> : <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <Fragment key={c.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {c.to ? (
                    <BreadcrumbLink href={`#${c.to}`} onClick={(e) => { e.preventDefault(); navigate(c.to!) }}>
                      {c.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </header>}
      <div className={cn("relative flex min-h-0 flex-1 flex-col overflow-y-auto", rail && narrow && "pt-10")}><LostConnection />{children}</div>
    </SidebarInset>
  )
}

// The sidebar now outlives the page, so in a narrow window its sheet closes when you go somewhere.
function CloseSheetOnNavigate() {
  const { setOpenMobile } = useSidebar()
  useEffect(() => {
    const close = () => setOpenMobile(false)
    window.addEventListener("hashchange", close)
    return () => window.removeEventListener("hashchange", close)
  }, [setOpenMobile])
  return null
}

// The main design has no top bar: the sidebar toggle only shows once the sidebar is hidden (⌘B also toggles it).
function FloatingTrigger() {
  const { state, isMobile } = useSidebar()
  if (!isMobile && state === "expanded") return null
  return <SidebarTrigger className="absolute top-3 left-3 z-20" />
}

// A folded project panel comes back from the page's top left corner, where the panel was.
// top-3 puts its center on the rail logo's line (with and without High-fi's 8px sheet margin).
// (Clicking the open project in the rail also brings it back.)
function UnfoldButton() {
  const route = useRoute()
  const folded = usePanelCollapsed()
  const { state, isMobile } = useSidebar()
  if (DESIGN !== "b" || route[0] !== "p" || !folded || isMobile || state !== "expanded") return null
  return (
    <button onClick={() => setPanelCollapsed(false)} aria-label="Expand sidebar" className="absolute top-3 left-2 z-20 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
      <PanelLeftOpen className="size-4" />
    </button>
  )
}

// Drag the sidebar's right edge to resize it; double-click resets.
function SidebarResizer({ width, onWidth }: { width: number; onWidth: (w: number) => void }) {
  const { state, isMobile } = useSidebar()
  if (isMobile || state === "collapsed") return null
  return (
    <ResizeHandle
      edge="right"
      getWidth={() => width}
      onWidth={onWidth}
      min={200}
      max={420}
      reset={256}
      className="fixed right-auto left-[calc(var(--sidebar-width)-4px)] z-30 hidden md:block"
    />
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="type-title">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
