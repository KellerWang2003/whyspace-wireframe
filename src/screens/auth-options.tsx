import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Illo } from "@/components/brand/illo/pieces"
import { AuthForm, AuthSplit, WelcomeArt, WorkspaceArt, Wordmark } from "@/screens/auth"
import { navigate } from "@/lib/router"

// High-fi options for signing in and creating an account (#/playground/system/login, full page at
// #/playground/login/<n>). Keller picked 1, Bunting on a wash: it is the real layout in screens/auth.tsx and
// renders from there. 2 Circle on the tray and 3 Form on the tray stay for reference.

export type AuthStep = "signin" | "signup" | "workspace"
type StepProps = { step: AuthStep; onStep: (s: AuthStep) => void }

const TITLE: Record<AuthStep, string> = { signin: "Welcome back", signup: "Create your account", workspace: "Your workspace" }

export function AuthOption({ n, ...p }: StepProps & { n: number }) {
  const Layout = [Bunting, Circle, TrayForm][n - 1] ?? Bunting
  return <Layout {...p} />
}

/* ---------- 1. Bunting on a wash (picked) */

function Bunting({ step, onStep }: StepProps) {
  return (
    <AuthSplit art={step === "workspace" ? <WorkspaceArt key={step} force /> : <WelcomeArt key="welcome" force />}>
      <StepForm step={step} onStep={onStep} />
    </AuthSplit>
  )
}

/* ---------- 2. Circle on the tray: the painted welcome circle on the gray layer. */

function Circle({ step, onStep }: StepProps) {
  return (
    <div className="grid h-full gap-3 bg-background p-3 md:grid-cols-2">
      <aside className="relative hidden items-center justify-center overflow-hidden rounded-[20px] bg-(--hifi-layer) md:flex">
        {step === "workspace"
          ? <Illo key={step} name="create-workspace" force className="h-[46%]" />
          : <img src={`${import.meta.env.BASE_URL}illustrations/set/welcome.webp`} alt="Five people holding ribbons that cross in the middle" className="w-[62%] max-w-[420px] mix-blend-multiply brightness-[1.05] contrast-[1.02]" />}
        <Wordmark className="absolute top-6 left-7" />
      </aside>
      <main className="flex min-w-0 items-center justify-center px-8">
        <StepForm step={step} onStep={onStep} />
      </main>
    </div>
  )
}

/* ---------- 3. Form on the tray: the title and the bunting sit on the paper, the form in a gray tray. */

function TrayForm({ step, onStep }: StepProps) {
  return (
    <div className="grid h-full bg-background md:grid-cols-2">
      <aside className="relative hidden min-w-0 flex-col justify-center gap-8 px-14 md:flex">
        <Wordmark className="absolute top-8 left-14" />
        {step === "workspace"
          ? <Illo key={step} name="create-workspace" force className="h-40 self-start" />
          : <Illo key="welcome" name="welcome" force className="h-auto w-full max-w-[380px]" />}
        <h1 className="type-display">{TITLE[step]}</h1>
      </aside>
      <main className="flex min-w-0 items-center justify-center p-3">
        <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-(--hifi-layer) px-8">
          <StepForm step={step} onStep={onStep} title={false} />
        </div>
      </main>
    </div>
  )
}

/* ---------- The form */

function StepForm({ step, onStep, title = true }: StepProps & { title?: boolean }) {
  if (step !== "workspace") {
    return <AuthForm mode={step} title={title} onSubmit={() => (step === "signup" ? onStep("workspace") : toast("Signed in"))} onSwitch={() => onStep(step === "signin" ? "signup" : "signin")} />
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); toast("Workspace created") }} className="flex w-full max-w-[340px] flex-col gap-8">
      {title && <h1 className="type-display">{TITLE.workspace}</h1>}
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="pg-ws">Workspace name</FieldLabel>
          <Input id="pg-ws" autoComplete="organization" className="h-10" />
        </Field>
        <Button type="submit" className="h-10">Create workspace</Button>
      </FieldGroup>
    </form>
  )
}

/* ---------- One option on its own page */

export function AuthFull({ n }: { n: number }) {
  const [step, setStep] = useState<AuthStep>("signin")
  return (
    <div className="relative h-svh">
      <AuthOption n={n} step={step} onStep={setStep} />
      <button type="button" onClick={() => navigate("/playground/system/login")} className="fixed right-6 bottom-5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" />All options
      </button>
    </div>
  )
}
