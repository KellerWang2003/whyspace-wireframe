import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MY_PROJECTS, PROJECTS, WORKSHOPS } from "@/data"
import { TODAY } from "@/playground/model"
import { addEvent, dateOfDay, pad, startOfDay, updateEvent, type CalEvent } from "@/components/app/calendar/events"

// What the dialog starts from: a slot picked on the calendar, or an existing meeting to edit.
export type MeetingDraft = Partial<Pick<CalEvent, "id" | "project" | "title" | "start" | "end" | "workshop" | "people">>

// Creating a meeting is where a workshop gets linked, optionally. Workshops are never made for a meeting.
// Saving puts it on the calendar. Without a project, the dialog asks which one.
export function ScheduleMeetingDialog({ project, open, onOpenChange, draft }: { project?: string; open: boolean; onOpenChange: (o: boolean) => void; draft?: MeetingDraft }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && <MeetingForm project={project} draft={draft} close={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

const toDateInput = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const toTimeInput = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromInputs = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)
  return new Date(y, m - 1, d, h || 0, min || 0).getTime()
}

function MeetingForm({ project: fixed, draft, close }: { project?: string; draft?: MeetingDraft; close: () => void }) {
  const editing = !!draft?.id
  const start = draft?.start ?? dateOfDay(TODAY + 1, 10 * 60)
  const end = draft?.end ?? start + 60 * 60_000
  const [project, setProject] = useState(draft?.project ?? fixed ?? MY_PROJECTS[0]?.id ?? "")
  const [title, setTitle] = useState(draft?.title ?? "")
  const [date, setDate] = useState(toDateInput(start))
  const [from, setFrom] = useState(toTimeInput(start))
  const [to, setTo] = useState(toTimeInput(end))
  const [workshop, setWorkshop] = useState(draft?.workshop ?? "none")
  const workshops = WORKSHOPS.filter((w) => w.project === project)

  const save = () => {
    const s = fromInputs(date, from)
    let e = fromInputs(date, to)
    if (e <= s) e = s + 30 * 60_000
    const fields = {
      project,
      title: title.trim() || "Untitled meeting",
      start: s,
      end: e,
      workshop: workshop === "none" ? undefined : workshop,
    }
    if (editing) {
      updateEvent(draft!.id!, fields)
      toast("Meeting updated")
    } else {
      const people = draft?.people ?? PROJECTS.find((p) => p.id === project)?.members ?? []
      addEvent({ ...fields, people })
      toast(`Meeting scheduled · ${new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(startOfDay(s))}, ${from}`)
    }
    close()
  }

  return (
    <form onSubmit={(ev) => { ev.preventDefault(); save() }} className="grid gap-4">
      <DialogHeader><DialogTitle>{editing ? "Edit meeting" : "Schedule meeting"}</DialogTitle></DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="meeting-title">Title</FieldLabel>
          <Input id="meeting-title" placeholder="Untitled meeting" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        {!fixed && (
          <Field>
            <FieldLabel>Project</FieldLabel>
            <Select value={project} onValueChange={(v) => { setProject(v); setWorkshop("none") }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MY_PROJECTS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <Field>
            <FieldLabel htmlFor="meeting-date">Date</FieldLabel>
            <Input id="meeting-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="meeting-from">From</FieldLabel>
            <Input id="meeting-from" type="time" step={900} value={from} onChange={(e) => setFrom(e.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="meeting-to">To</FieldLabel>
            <Input id="meeting-to" type="time" step={900} value={to} onChange={(e) => setTo(e.target.value)} required />
          </Field>
        </div>
        <Field>
          <FieldLabel>Link a workshop</FieldLabel>
          <Select value={workshop} onValueChange={setWorkshop}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {workshops.map((w) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        <Button type="submit">{editing ? "Save" : "Schedule"}</Button>
      </DialogFooter>
    </form>
  )
}
