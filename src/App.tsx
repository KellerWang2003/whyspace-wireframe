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
import { MyTasks } from "@/screens/my-tasks"
import { Project } from "@/screens/project"
import { ProjectPage } from "@/app/project"
import { Today } from "@/app/today"
import { DuetListener, DuetPage } from "@/app/duet-page"
import { ChatsPage, lastChat } from "@/app/chats"
import { ProjectC, ProjectsC } from "@/design-c/project"
import { TodayC } from "@/design-c/today"
import { DeskC } from "@/design-c/desk/desk"
import { Desk } from "@/app/desk/desk"
import { AppShell, ShellHost } from "@/components/app/app-shell"
import { DESIGN } from "@/lib/design"
import { DesktopMode } from "@/screens/desktop-overlay"
import { Playground } from "@/screens/playground"
import { Projects } from "@/screens/projects"
import { NoAccess, Opening, WentWrong } from "@/app/rare-states"
import { WorkspaceSettings } from "@/screens/settings"
import { SettingsPage, settingsPath } from "@/screens/settings-page"
import { CreateWorkspaceStep, WorkspaceDialog } from "@/screens/welcome"
import { Demo } from "@/demo/demo"
import { HiFi } from "@/hifi/hifi"
import { DesignSystem } from "@/design-system/design-system"
import { ConnectFlow } from "@/app/connect/connect-flow"
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
  // High-fi playground: Today and Whiskr's Home in three brand styles.
  if (first === "hifi") return <HiFi style={second} page={third} />
  // Design system: the high-fi foundations and components, rendered from the real tokens and components.
  if (first === "design-system") return <DesignSystem section={second} />
  // Connecting an AI tool: the tool's tab in a browser, with Whyspace's consent page in the middle.
  if (first === "connect") return <ConnectFlow tool={second?.split("?")[0]} step={third?.split("?")[0]} />
  // Opening Whyspace: the loading ribbon, then Today.
  if (first === "loading") return <Opening />
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
  // Today replaced Inbox and My tasks (archived Design A keeps them); their old links land on it.
  if (first === "today") return DESIGN === "b" ? <Today /> : <Projects />
  // The Duet has its own tab. Chats is a separate tab for DMs and groups, and opens on the chat you had open last.
  if (first === "duet") return DESIGN === "b" ? <DuetPage /> : <Projects />
  if (first === "chats") return DESIGN !== "b" ? <Projects /> : second === "duet" ? <Redirect to="/duet" /> : !second && lastChat() ? <Redirect to={`/chats/${lastChat()}`} /> : <ChatsPage id={second} item={third} />
  if (first === "inbox") return DESIGN === "b" ? <Redirect to="/today" /> : <Inbox />
  if (first === "my-tasks") return DESIGN === "b" ? <Redirect to="/today" /> : <MyTasks />
  // Old decision links open the decision sheet over All projects.
  if (first === "decisions") return <Projects />
  if (first === "projects") return <Projects empty={second === "empty"} />
  // A link to a project you're not in.
  if (first === "no-access") return <NoAccess />
  if (first === "went-wrong") return <WentWrong />
  // The main design organizes a project around threads; archived Design A keeps project-wide pages.
  if (first === "p") return DESIGN === "b" ? <ProjectPage /> : <Project id={second} section={third ?? "home"} sub={fourth} />
  if (first === "playground") return <Playground project={second} view={third} />
  // The main design has one Settings page for your account and the workspace; old Account links land in it.
  if (DESIGN === "b" && first === "settings") return <SettingsPage tab={second} none={third === "none"} />
  if (DESIGN === "b" && first === "account") return <Redirect to={`${settingsPath(second)}${third === "none" ? "/none" : ""}`} />
  if (first === "settings") return <WorkspaceSettings tab={second ?? "general"} />
  if (first === "account") return <Account tab={second ?? "profile"} none={third === "none"} />
  return DESIGN === "b" ? <Today /> : <Projects />
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
  const [page] = useRoute()
  const { current } = useStore()
  if (desktop || !current || ["signup", "login", "onboarding", "site", "demo", "hifi", "connect"].includes(page)) return null
  // Archived Design C has no assistant in the app: the Duet lives in the profile and in people's own AI tools.
  if (DESIGN === "c") return null
  // The main design has no corner panel: the Duet has its own tab. Asks from anywhere else open it,
  // and the Duet page itself listens while it's open.
  if (DESIGN === "b") return page === "duet" ? null : <DuetListener key={current.id} />
  // Archived Design A keeps the corner panel, Ask Whyspace.
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
          <div className="min-w-0 flex-1"><ShellHost key={version}><Screen /></ShellHost></div>
          <PersistentAssistant desktop={false} />
        </div>
        <DecisionSheetHost key={version} />
        <GlobalDialogs />
        <WorkspaceDialog />
        <AppLink />
        <Toaster position="bottom-right" />
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
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </StoreProvider>
  )
}

function PrototypeApp() {
  // Prototype toggle: pretend we're on Keller's desktop, outside Whyspace, with the overlay on top.
  // ?desk in the URL opens on the Desk (main design and C), so a shared link can land there.
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
          {!desktop && <div className="min-w-0 flex-1"><ShellHost><Screen /></ShellHost></div>}
          <PersistentAssistant desktop={desktop} />
        </div>
        <div hidden={!desktop}>{DESIGN === "c" ? desktop && <DeskC onExit={exit} /> : DESIGN === "b" ? desktop && <Desk onExit={exit} /> : <DesktopMode onExit={exit} />}</div>
        {!desktop && <DecisionSheetHost />}
        <GlobalDialogs />
        <WorkspaceDialog />
        <FlowMenu desktop={desktop} onDesktop={setDesktop} />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </StoreProvider>
  )
}
