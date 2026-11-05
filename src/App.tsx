import { useEffect, useState, useSyncExternalStore } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { FlowMenu } from "@/components/app/flow-menu"
import { GlobalDialogs } from "@/components/app/global-dialogs"
import { AskWhyspace } from "@/components/app/ask-whyspace"
import { DecisionSheetHost } from "@/components/decisions/decision-sheet"
import { navigate, useRoute } from "@/lib/router"
import { StoreProvider, useStore } from "@/lib/store"
import { Account } from "@/screens/account"
import { LogIn, SignUp } from "@/screens/auth"
import { Inbox } from "@/screens/inbox"
import { Landing } from "@/screens/landing"
import { Shapes } from "@/screens/shapes"
import { LiveSession } from "@/screens/live-session"
import { MyTasks } from "@/screens/my-tasks"
import { Project } from "@/screens/project"
import { ProjectB } from "@/design-b/project"
import { TodayB } from "@/design-b/today"
import { DuetPage } from "@/design-b/duet-page"
import { ProjectC, ProjectsC } from "@/design-c/project"
import { TodayC } from "@/design-c/today"
import { DeskC } from "@/design-c/desk/desk"
import { DeskB } from "@/design-b/desk/desk"
import { AppShell } from "@/components/app/app-shell"
import { DESIGN } from "@/lib/design"
import { DesktopMode } from "@/screens/desktop-overlay"
import { Playground } from "@/screens/playground"
import { Projects } from "@/screens/projects"
import { WorkspaceSettings } from "@/screens/settings"
import { CreateWorkspaceStep, WorkspaceDialog } from "@/screens/welcome"
import { Demo } from "@/demo/demo"
import { getDataVersion, subscribeData } from "@/data"
import { SCENARIO, openScenario } from "@/lib/scenario"
import { AppLink } from "@/scenarios/app-link"
import { ScenarioDesktop } from "@/scenarios/desktop"
import { IN_APP_FRAME } from "@/scenarios/frame"

function Screen() {
  const [first, second, third, fourth] = useRoute()
  const { current } = useStore()

  // Test scenarios still on their demo page, until they run on the real app. Scenario 1 does.
  if (first === "demo") return !second || second === "1" ? <OpenScenario n={1} /> : <Demo scenario={second} />
  // A shared Design C build opens on Today when the link carries no screen.
  if (DESIGN === "c" && !window.location.hash && current) return <AppShell crumbs={[{ label: "Today" }]}><TodayC /></AppShell>
  // Marketing home page, opened from the account menu.
  if (first === "site") return second === "shapes" ? <Shapes /> : <Landing />
  if (first === "signup") return <SignUp />
  if (first === "login") return <LogIn />
  // No workspace yet (fresh sign up): create one on its own step before the app.
  if (first === "onboarding" || !current) return <CreateWorkspaceStep />
  // Design C (debug menu): Today, Projects and the project's threads and talks. Nothing else.
  if (DESIGN === "c") {
    if (first === "p") return <ProjectC />
    if (first === "projects") return <ProjectsC />
    if (first === "settings") return <WorkspaceSettings tab={second ?? "general"} />
    if (first === "account") return <Account tab={second ?? "profile"} />
    // "/desk" shows the Desk on top; Today sits behind it for when it closes.
    return <AppShell crumbs={[{ label: "Today" }]}><TodayC /></AppShell>
  }
  // Design B: Today replaced Inbox and My tasks; their old links land on it.
  if (first === "today") return DESIGN === "b" ? <TodayB /> : <Projects />
  if (first === "duet") return DESIGN === "b" ? <DuetPage /> : <Projects />
  if (first === "inbox") return DESIGN === "b" ? <Redirect to="/today" /> : <Inbox />
  if (first === "my-tasks") return DESIGN === "b" ? <Redirect to="/today" /> : <MyTasks />
  // Old decision links open the decision sheet over All projects.
  if (first === "decisions") return <Projects />
  if (first === "projects") return <Projects />
  if (first === "p" && (third === "live" || (third === "sessions" && fourth))) return <LiveSession id={second} sessionId={fourth} />
  // Design B (debug menu) tests projects organized around threads.
  if (first === "p") return DESIGN === "b" ? <ProjectB /> : <Project id={second} section={third ?? "home"} sub={fourth} />
  if (first === "playground") return <Playground project={second} view={third} />
  if (first === "settings") return <WorkspaceSettings tab={second ?? "general"} />
  if (first === "account") return <Account tab={second ?? "profile"} />
  return DESIGN === "b" ? <TodayB /> : <Projects />
}

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to), [to])
  return null
}

function OpenScenario({ n }: { n: number }) {
  useEffect(() => openScenario(n), [n])
  return null
}

function PersistentAssistant({ desktop }: { desktop: boolean }) {
  const [page, , third, fourth] = useRoute()
  const { current } = useStore()
  if (desktop || !current || ["signup", "login", "onboarding", "site", "demo"].includes(page)) return null
  // Design C has no assistant in the app: the Duet lives in the profile and in people's own AI tools.
  if (DESIGN === "c") return null
  // The Duet page is the conversation itself, full width.
  if (DESIGN === "b" && page === "duet") return null
  // Inside a workshop the AI lives in the canvas's own chat bar instead.
  if (page === "p" && (third === "live" || (third === "sessions" && fourth))) return null
  return <AskWhyspace key={current.id} />
}

// Three ways in: the prototype itself; a test scenario, where the page is a desktop with Whyspace in
// one of its windows (src/scenarios); and that window's inside, the app on the scenario's data.
export default function App() {
  return IN_APP_FRAME ? <FramedApp /> : SCENARIO ? <ScenarioApp /> : <PrototypeApp />
}

// Whyspace inside the scenario desktop's window. What Claude records changes the data in place, so
// the screen starts over on each change; the store (confirmations, clashes, tasks) carries on.
function FramedApp() {
  const version = useSyncExternalStore(subscribeData, getDataVersion)
  return (
    <StoreProvider>
      <TooltipProvider>
        <div className="flex h-svh w-full overflow-hidden">
          <div className="min-w-0 flex-1"><Screen key={version} /></div>
          <PersistentAssistant desktop={false} />
        </div>
        <DecisionSheetHost key={version} />
        <GlobalDialogs />
        <WorkspaceDialog />
        <AppLink />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </StoreProvider>
  )
}

function ScenarioApp() {
  return (
    <StoreProvider>
      <TooltipProvider>
        <ScenarioDesktop />
        <FlowMenu desktop={false} onDesktop={() => {}} />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </StoreProvider>
  )
}

function PrototypeApp() {
  // Prototype toggle: pretend we're on Keller's desktop, outside Whyspace, with the overlay on top.
  // ?desk in the URL opens on the Desk (Designs B and C), so a shared link can land there.
  const [desktopOn, setDesktopOn] = useState(() => DESIGN !== "a" && new URLSearchParams(window.location.search).has("desk"))
  // #/desk opens it too, so a task's "Open Claude" and a shared link can land there.
  const [first] = useRoute()
  const desktop = desktopOn || (DESIGN !== "a" && first === "desk")
  // Leaving the Desk lands on Today.
  const exit = () => { setDesktopOn(false); if (window.location.hash.startsWith("#/desk")) navigate("/today") }
  const setDesktop = (on: boolean) => (on ? setDesktopOn(true) : exit())
  return (
    <StoreProvider>
      <TooltipProvider>
        <div className={desktop ? "hidden" : "flex h-svh w-full overflow-hidden"}>
          {!desktop && <div className="min-w-0 flex-1"><Screen /></div>}
          <PersistentAssistant desktop={desktop} />
        </div>
        <div hidden={!desktop}>{DESIGN === "c" ? desktop && <DeskC onExit={exit} /> : DESIGN === "b" ? desktop && <DeskB onExit={exit} /> : <DesktopMode onExit={exit} />}</div>
        {!desktop && <DecisionSheetHost />}
        <GlobalDialogs />
        <WorkspaceDialog />
        <FlowMenu desktop={desktop} onDesktop={setDesktop} />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </StoreProvider>
  )
}
