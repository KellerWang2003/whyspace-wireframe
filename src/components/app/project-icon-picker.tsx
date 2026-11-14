import type { ReactNode } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"
import { MARK_COLORS, MARK_HEX, MARK_WASH, MARK_WASH_INK, PROJECT_ICONS, setProjectIcon, useProjectIcon, type ProjectIcon } from "./project-icon"
import { MARK_LOOK, MarkTile } from "./project-mark"

// Color, then icon. Every project has an icon; there is no letter option (Nov 14).
export function ProjectIconPicker({ value, onChange }: { value: ProjectIcon; onChange: (next: ProjectIcon) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Color" className="flex gap-1.5 px-1">
        {MARK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value.color === c}
            aria-label={c}
            onClick={() => onChange({ ...value, color: c })}
            className={cn("size-6 rounded-full ring-offset-2 ring-offset-popover outline-none focus-visible:ring-2 focus-visible:ring-ring", value.color === c && "ring-2 ring-foreground/70")}
            style={MARK_LOOK === "wash" ? { background: MARK_WASH[c], boxShadow: `inset 0 0 0 1.5px ${MARK_HEX[c]}` } : { background: MARK_LOOK === "plain" ? MARK_WASH_INK[c] : MARK_HEX[c] }}
          />
        ))}
      </div>
      <div role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-0.5">
        {PROJECT_ICONS.map(([k, Icon]) => (
          <button key={k} type="button" role="radio" aria-checked={value.icon === k} aria-label={k} onClick={() => onChange({ ...value, icon: k })}
            className={cn("flex size-8 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring", value.icon === k ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.05]")} style={MARK_LOOK === "plain" && value.icon === k ? { color: MARK_WASH_INK[value.color] } : undefined}>
            <Icon className="size-4" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  )
}

function PickerPopover({ trigger, value, onChange }: { trigger: ReactNode; value: ProjectIcon; onChange: (next: ProjectIcon) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent data-icon-picker align="start" className="w-auto rounded-2xl p-3">
        <ProjectIconPicker value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}

// The project's mark as a button: click it to change the icon.
export function ProjectIconButton({ id, className }: { id: string; className?: string }) {
  const icon = useProjectIcon(id)
  const name = PROJECTS.find((p) => p.id === id)?.name ?? id
  return (
    <PickerPopover
      value={icon}
      onChange={(next) => setProjectIcon(id, next)}
      trigger={
        <button type="button" aria-label="Change icon" className="shrink-0 rounded-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring">
          <MarkTile id={id} name={name} icon={icon} look="tile" className={className} />
        </button>
      }
    />
  )
}

// For a project that doesn't exist yet: the icon follows the name as you type, until you pick one.
export function NewProjectIconButton({ name, value, onChange, className }: { name: string; value: ProjectIcon; onChange: (next: ProjectIcon) => void; className?: string }) {
  return (
    <PickerPopover
      value={value}
      onChange={onChange}
      trigger={
        <button type="button" aria-label="Choose icon" className="shrink-0 rounded-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring">
          <MarkTile id="new" name={name || "P"} icon={value} look="tile" className={className} />
        </button>
      }
    />
  )
}
