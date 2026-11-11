import { useState } from "react"
import { Dialog as D } from "radix-ui"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type Pic = { src: string; caption: string }

const CHROME = "flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 outline-none transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 [&_svg]:size-5"

// A picture that enlarges in the page when clicked (never a new tab). The others in its set are one arrow
// away; Escape, the close button or a click beside the picture puts it back.
export function ZoomImage({ pics, index, className }: { pics: Pic[]; index: number; className?: string }) {
  const [at, setAt] = useState<number | null>(null)
  const pic = pics[index]
  const shown = at === null ? null : pics[at]
  const many = pics.length > 1
  const step = (d: number) => setAt((i) => (i === null ? i : (i + d + pics.length) % pics.length))
  const close = () => setAt(null)
  return (
    <D.Root open={at !== null} onOpenChange={(o) => setAt(o ? index : null)}>
      <D.Trigger aria-label={`Enlarge ${pic.caption}`} className={cn("block w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
        <img src={pic.src} alt={pic.caption} loading="lazy" className="block w-full" />
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/75 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-16 py-10 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
          onKeyDown={(e) => {
            if (!many) return
            if (e.key === "ArrowRight") { e.preventDefault(); step(1) }
            if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
          }}
        >
          {shown && (
            <>
              <D.Title className="sr-only">{shown.caption}</D.Title>
              <img src={shown.src} alt={shown.caption} className="max-h-[calc(100vh-8rem)] max-w-full rounded-xl object-contain" />
              <p className="text-sm text-white/80">
                {shown.caption}
                {many && <span className="ml-2 tabular-nums text-white/50">{(at ?? 0) + 1} of {pics.length}</span>}
              </p>
            </>
          )}
          <D.Close aria-label="Close" className={cn(CHROME, "absolute top-4 right-4")}><X /></D.Close>
          {many && (
            <>
              <button type="button" aria-label="Previous" onClick={() => step(-1)} className={cn(CHROME, "absolute top-1/2 left-4 -translate-y-1/2")}><ChevronLeft /></button>
              <button type="button" aria-label="Next" onClick={() => step(1)} className={cn(CHROME, "absolute top-1/2 right-4 -translate-y-1/2")}><ChevronRight /></button>
            </>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
