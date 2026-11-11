import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

// One search for the page, top right in the header (left of any primary button): it narrows Tasks, Decisions and Artifacts alike,
// and the tab counts follow it, so you see where the matches are.
export function ProjectSearch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative block">
      <Search className="absolute top-3 left-2.5 size-4 text-muted-foreground" />
      <Input aria-label={label} placeholder="Search" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onChange("")} className="h-10 w-40 pr-8 pl-8 sm:w-56" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute top-2.5 right-2 flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </label>
  )
}
