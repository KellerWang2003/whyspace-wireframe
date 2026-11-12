import { useId, type ReactNode } from "react"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Illo } from "@/components/brand/illo/pieces"
import { INK } from "@/components/brand/illo/kit"
import { useHifi } from "@/lib/hifi"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { WhyspaceLockup } from "@/components/brand/logo"

// Signing in, creating an account and naming the workspace (Keller's pick, Nov 11: "Bunting on a wash" from
// #/playground/system/login). Art on the left in a leaf wash panel, the form on the right under the wordmark:
// email and password first, then small buttons for the other ways in.

/** The two halves: art on the left (hidden on narrow screens), the wordmark and the form on the right. */
export function AuthSplit({ art, children }: { art?: ReactNode; children: ReactNode }) {
  const hifi = useHifi()
  return (
    <div className="grid h-full min-h-0 gap-3 bg-background p-3 md:grid-cols-2">
      <aside className={cn("relative hidden overflow-hidden rounded-[20px] md:block", !hifi && "bg-muted")} style={hifi ? { background: INK.wash.leaf } : undefined}>
        {art}
      </aside>
      <main className="relative flex min-w-0 flex-col items-center justify-center px-8 py-24">
        <Wordmark className="absolute top-9 left-1/2 -translate-x-1/2" />
        {children}
      </main>
    </div>
  )
}

/** The Welcome bunting, strung across the top of the panel. */
export const WelcomeArt = ({ force }: { force?: boolean }) => <Illo name="welcome" force={force} className="absolute inset-x-0 top-[9%] h-auto w-full" />
/** The tied cards, in the middle of the panel. */
export const WorkspaceArt = ({ force }: { force?: boolean }) => <Illo name="create-workspace" force={force} className="absolute top-1/2 left-1/2 h-[46%] -translate-x-1/2 -translate-y-1/2" />

export type AuthMode = "signin" | "signup"

/** Email and password first, then the other ways in, then the switch to the other mode. */
export function AuthForm({ mode, onSubmit, onSwitch, title = true }: { mode: AuthMode; onSubmit: () => void; onSwitch: () => void; title?: boolean }) {
  const id = useId()
  const signin = mode === "signin"
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex w-full max-w-[340px] flex-col gap-8">
      {title && <h1 className="type-display">{signin ? "Welcome back" : "Create your account"}</h1>}
      <FieldGroup className="gap-5">
        {!signin && (
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
            <Input id={`${id}-name`} autoComplete="name" className="h-10" />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
          <Input id={`${id}-email`} type="email" autoComplete="email" className="h-10" />
        </Field>
        <Field>
          <div className="flex items-baseline">
            <FieldLabel htmlFor={`${id}-pw`}>Password</FieldLabel>
            {signin && <button type="button" className="ml-auto text-sm text-muted-foreground hover:text-foreground">Forgot?</button>}
          </div>
          <Input id={`${id}-pw`} type="password" autoComplete={signin ? "current-password" : "new-password"} className="h-10" />
        </Field>
        <Button type="submit" className="h-10">{signin ? "Sign in" : "Create account"}</Button>
        <FieldSeparator className="my-0 *:data-[slot=field-separator-content]:bg-transparent">or</FieldSeparator>
        <OtherWays onPick={onSubmit} />
      </FieldGroup>
      <p className="text-sm text-muted-foreground">
        {signin ? "New to Whyspace? " : "Have an account? "}
        <button type="button" onClick={onSwitch} className="text-foreground underline underline-offset-4">{signin ? "Create an account" : "Sign in"}</button>
      </p>
    </form>
  )
}

const WAYS: [string, ReactNode][] = [
  ["Google", <GoogleMark key="g" />],
  ["Apple", <AppleMark key="a" />],
  ["Microsoft", <MicrosoftMark key="m" />],
  ["Single sign-on", <KeyRound key="k" className="size-[18px]" />],
]

function OtherWays({ onPick }: { onPick: (name: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {WAYS.map(([name, mark]) => (
        <Tooltip key={name}>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" className="h-10" aria-label={`Continue with ${name}`} onClick={() => onPick(name)}>{mark}</Button>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

/** The Whyspace lockup: stacked over the form (the main one), or beside the name in a corner. */
export function Wordmark({ variant = "stacked", className }: { variant?: "stacked" | "beside"; className?: string }) {
  return <WhyspaceLockup variant={variant} className={cn(variant === "stacked" ? "w-24" : "w-32", className)} />
}

// Sign up is only the account form. Naming the workspace is the next step (screens/welcome.tsx).
export function SignUp() {
  const { startFresh } = useStore()
  return (
    <div className="h-svh">
      <AuthSplit art={<WelcomeArt />}>
        <AuthForm mode="signup" onSubmit={() => { startFresh(); navigate("/onboarding") }} onSwitch={() => navigate("/login")} />
      </AuthSplit>
    </div>
  )
}

export function LogIn() {
  const { joinWorkspace } = useStore()
  return (
    <div className="h-svh">
      <AuthSplit art={<WelcomeArt />}>
        <AuthForm mode="signin" onSubmit={() => { joinWorkspace(); navigate("/inbox") }} onSwitch={() => navigate("/signup")} />
      </AuthSplit>
    </div>
  )
}

/* ---------- Brand marks for the other ways in */

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[16px]" aria-hidden>
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  )
}
