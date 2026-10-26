import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">Y</div>
        Whyspace
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

// Sign up is only the account form. Creating a workspace is the next step, on its own page.
export function SignUp() {
  const { startFresh } = useStore()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startFresh()
    navigate("/onboarding")
  }
  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>Keep track of why your team decided what it did.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={submit}>Continue with Google</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="su-name">Full name</FieldLabel>
                <Input id="su-name" placeholder="Keller" />
              </Field>
              <Field>
                <FieldLabel htmlFor="su-email">Work email</FieldLabel>
                <Input id="su-email" type="email" placeholder="keller@platiful.example" />
              </Field>
              <Field>
                <FieldLabel htmlFor="su-pw">Password</FieldLabel>
                <Input id="su-pw" type="password" />
                <FieldDescription>At least 8 characters.</FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Create account</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <a href="#/login" className="text-foreground underline underline-offset-4">Log in</a>
        </CardFooter>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to the Terms and Privacy policy.
      </p>
    </AuthLayout>
  )
}

export function LogIn() {
  const { joinWorkspace } = useStore()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    joinWorkspace()
    navigate("/inbox")
  }
  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Log in to your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={submit}>Continue with Google</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or</FieldSeparator>
              <Field>
                <FieldLabel htmlFor="li-email">Email</FieldLabel>
                <Input id="li-email" type="email" placeholder="keller@platiful.example" />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="li-pw">Password</FieldLabel>
                  <a href="#/login" className="ml-auto text-sm underline-offset-4 hover:underline">Forgot password?</a>
                </div>
                <Input id="li-pw" type="password" />
              </Field>
              <Field>
                <Button type="submit">Log in</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          New to Whyspace?&nbsp;
          <a href="#/signup" className="text-foreground underline underline-offset-4">Create an account</a>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
