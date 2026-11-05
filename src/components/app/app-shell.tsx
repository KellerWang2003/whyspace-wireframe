import { Fragment, type ReactNode } from "react"
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
import { RailSidebar } from "@/design-b/rail-sidebar"
import { RailSidebarC } from "@/design-c/rail"
import { usePanelCollapsed } from "@/design-b/rail-state"
import { navigate, useRoute } from "@/lib/router"
import { DESIGN } from "@/lib/design"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

export type Crumb = { label: string; to?: string }

export function AppShell({ crumbs, actions, children }: { crumbs: Crumb[]; actions?: ReactNode; children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = usePanelWidth("sidebar", 256)
  const route = useRoute()
  // Design B: outside a project (or with the panel folded) the sidebar is just the rail; inside, rail plus the project panel.
  const folded = usePanelCollapsed()
  const rail = DESIGN === "b" || DESIGN === "c"
  const railOnly = rail && (route[0] !== "p" || folded)
  // In a narrow window the sidebar is a sheet and its toggle floats top left: keep a strip for it.
  const narrow = useIsMobile()
  return (
    <SidebarProvider className="h-svh overflow-hidden" style={{ "--sidebar-width": `${railOnly ? 48 : sidebarWidth}px` } as React.CSSProperties}>
      {DESIGN === "c" ? <RailSidebarC /> : DESIGN === "b" ? <RailSidebar /> : <AppSidebar />}
      {!railOnly && <SidebarResizer width={sidebarWidth} onWidth={setSidebarWidth} />}
      <SidebarInset className="relative min-h-0 min-w-0 overflow-hidden">
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
        <div className={cn("relative flex min-h-0 flex-1 flex-col overflow-y-auto", rail && narrow && "pt-10")}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Design B has no top bar: the sidebar toggle only shows once the sidebar is hidden (⌘B also toggles it).
function FloatingTrigger() {
  const { state, isMobile } = useSidebar()
  if (!isMobile && state === "expanded") return null
  return <SidebarTrigger className="absolute top-3 left-3 z-20" />
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
      className="fixed right-auto left-[calc(var(--sidebar-width)-4px)] z-20 hidden md:block"
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
