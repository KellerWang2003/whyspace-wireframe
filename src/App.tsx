import { useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { FlowMenu } from "@/components/app/flow-menu"
import { GlobalDialogs } from "@/components/app/global-dialogs"
import { useRoute } from "@/lib/router"
import { StoreProvider, useStore } from "@/lib/store"
import { Account } from "@/screens/account"
import { LogIn, SignUp } from "@/screens/auth"
import { AllDecisions } from "@/screens/decisions"
import { Inbox } from "@/screens/inbox"
import { LiveSession } from "@/screens/live-session"
import { MyTasks } from "@/screens/my-tasks"
import { Project } from "@/screens/project"
import { DesktopMode } from "@/screens/desktop-overlay"
import { Playground } from "@/screens/playground"
import { Projects } from "@/screens/projects"
import { WorkspaceSettings } from "@/screens/settings"
import { CreateWorkspaceStep, WorkspaceDialog } from "@/screens/welcome"

function Screen() {
  const [first, second, third, fourth] = useRoute()
  const { current } = useStore()

  if (first === "signup") return <SignUp />
  if (first === "login") return <LogIn />
  // No workspace yet (fresh sign up): create one on its own step before the app.
  if (first === "onboarding" || !current) return <CreateWorkspaceStep />
  if (first === "inbox") return <Inbox />
  if (first === "my-tasks") return <MyTasks />
  if (first === "decisions") return <AllDecisions id={second} />
  if (first === "p" && (third === "live" || (third === "sessions" && fourth))) return <LiveSession id={second} sessionId={fourth} />
  if (first === "p") return <Project id={second} section={third ?? "overview"} sub={fourth} />
  if (first === "playground") return <Playground project={second} view={third} />
  if (first === "settings") return <WorkspaceSettings tab={second ?? "general"} />
  if (first === "account") return <Account tab={second ?? "profile"} />
  return <Projects />
}

export default function App() {
  // Prototype toggle: pretend we're on Maya's desktop, outside Whyspace, with the overlay on top.
  const [desktop, setDesktop] = useState(false)
  return (
    <StoreProvider>
      <TooltipProvider>
        {desktop ? <DesktopMode /> : <Screen />}
        <GlobalDialogs />
        <WorkspaceDialog />
        <FlowMenu desktop={desktop} onDesktop={setDesktop} />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </StoreProvider>
  )
}
