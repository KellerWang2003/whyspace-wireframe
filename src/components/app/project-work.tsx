import { ArrowUpRight, ChevronDown, CircleAlert, Sparkles } from "lucide-react"
import { ACTIVITY, INBOX, PEOPLE, type Project } from "@/data"
import { PersonAvatar } from "@/components/app/person"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function ProjectWork({ project }: { project: Project }) {
  const activity = ACTIVITY.filter((item) => item.project === project.id)

  return (
    <section aria-labelledby="project-work-title" className="space-y-2">
      <h2 id="project-work-title" className="text-xs font-medium text-muted-foreground">Who’s working on what</h2>
      <ul className="divide-y">
        {project.members.map((id) => {
          const person = PEOPLE[id]
          const work = activity.find((item) => item.who === id)
          const active = work?.state === "active"
          const doing = active ? work.doing : "No active work"
          const alerts = INBOX.filter((item) => item.project === project.name && item.kind === "alert" && item.from === id)

          return (
            <Collapsible key={`${project.id}-${id}`} asChild>
              <li>
                <CollapsibleTrigger className="group flex w-full min-w-0 items-center gap-2 rounded-sm py-2.5 text-left text-xs hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label={`${person.name} · ${doing}`}>
                  <PersonAvatar id={id} className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate"><span className="font-medium">{person.name.split(" ")[0]}</span><span className="text-muted-foreground"> · {doing}</span></span>
                  <ChevronDown aria-hidden="true" className="size-3 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pb-3 pl-7 text-xs leading-5">
                    <div>
                      <p>{active ? work.doing : work?.doing ?? "No work shared right now"}</p>
                      <p className="mt-1 text-muted-foreground">{work?.part ? `${work.part} · ` : ""}{active ? `Working for ${work.since}` : work ? `Last active ${work.since.toLowerCase()}` : "No recent activity"}</p>
                    </div>
                    {active && work.tool && (
                      <p className="flex items-start gap-1.5 text-muted-foreground"><Sparkles aria-hidden="true" className="mt-1 size-3 shrink-0" /><span><span className="font-medium">{work.tool}</span> · {work.aiDoing ?? "No AI activity shared"}</span></p>
                    )}
                    {alerts.map((alert) => (
                      <a key={alert.id} href={alert.decision ? `#/p/${project.id}/decisions/${alert.decision}` : "#/inbox"} className="flex items-start gap-1.5 text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                        <CircleAlert aria-hidden="true" className="mt-1 size-3 shrink-0" /><span className="min-w-0 flex-1">{alert.summary}</span><ArrowUpRight aria-hidden="true" className="mt-1 size-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </CollapsibleContent>
              </li>
            </Collapsible>
          )
        })}
      </ul>
    </section>
  )
}
