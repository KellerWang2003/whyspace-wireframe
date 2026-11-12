import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToolLogo } from "@/components/app/tool-logo"
import { ME } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { MCP_URL, PROVIDERS, disconnect, useConnections, type ProviderId } from "./connections"
import { WhyspaceIcon } from "@/components/brand/logo"

// Whyspace's app icon, beside the tools' own logos.
export function WhyspaceTile({ className }: { className?: string }) {
  return <WhyspaceIcon className={cn("size-10", className)} />
}

export function ProviderTile({ id, className }: { id: ProviderId; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border bg-white", className)}>
      <ToolLogo tool={PROVIDERS[id].name} className={cn("size-5", id === "chatgpt" && "fill-neutral-900")} />
    </span>
  )
}

// The two marks with a thread between them: Whyspace on one end, the tool on the other.
export function Pair({ id, className }: { id: ProviderId; className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <ProviderTile id={id} />
      <span aria-hidden className="mx-2 w-10 border-t-2 border-dotted border-muted-foreground/40" />
      <WhyspaceTile />
    </div>
  )
}

// Connect, from My AI tools: open the tool's page for Whyspace, or paste the server URL yourself.
export function ConnectDialog({ id, onOpenChange }: { id: ProviderId | null; onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = useState(false)
  const p = id ? PROVIDERS[id] : null
  const copy = () => {
    navigator.clipboard?.writeText(MCP_URL).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {id && p && (
          <>
            <DialogHeader className="items-center gap-5 pt-2 text-center sm:text-center">
              <Pair id={id} />
              <DialogTitle className="type-heading">Connect {p.name}</DialogTitle>
            </DialogHeader>
            <Button className="w-full" onClick={() => { onOpenChange(false); navigate(`/connect/${id}`) }}>Continue in {p.name}</Button>
            <div className="space-y-1.5 border-t pt-4">
              <div className="type-caption text-muted-foreground">Or add it in {p.custom}</div>
              <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 py-1 pr-1 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{MCP_URL}</code>
                <Button size="icon" variant="ghost" className="size-7" aria-label="Copy URL" onClick={copy}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Manage, once connected: whose account, since when, and disconnect. It reaches all your projects.
export function ManageDialog({ id, onOpenChange }: { id: ProviderId | null; onOpenChange: (open: boolean) => void }) {
  const conns = useConnections()
  const p = id ? PROVIDERS[id] : null
  const at = id ? conns[id]?.at : undefined
  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {id && p && (
          <>
            <DialogHeader className="flex-row items-center gap-3 text-left">
              <ProviderTile id={id} />
              <DialogTitle className="type-heading">{p.name}</DialogTitle>
            </DialogHeader>
            <dl className="divide-y rounded-lg border text-sm">
              <Row label="Account">{ME.email}</Row>
              <Row label="Connected">{at ? new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Earlier"}</Row>
            </dl>
            <DialogFooter>
              <Button variant="outline" onClick={() => { disconnect(id); onOpenChange(false); toast(`${p.name} disconnected`) }}>Disconnect</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  )
}
