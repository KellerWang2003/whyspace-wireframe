import { Cat, Gift, Sprout, type LucideIcon } from "lucide-react"
import { PEOPLE, initials } from "@/data"

// The high-fi playground's content: the two screens Keller picked in Figma (AI Studio · Team 8,
// Week 7, frames 7887:6263 and 7945:8249), word for word. Today is Christine's at the end of the
// Whiskr week, with nothing handled yet; Decisions is Seed round's, a project with no work in it.

export type StyleId = "gesture" | "weave" | "studio"
export type Page = "today" | "decisions"

// The three style tiles in Figma (frame 7945:8444).
export const STYLES: { id: StyleId; label: string }[] = [
  { id: "gesture", label: "Shared gesture" },
  { id: "weave", label: "Open weave" },
  { id: "studio", label: "Studio" },
]

// Keller and Kelly share a first letter, so avatars use two.
const AVATAR: Record<string, string> = { MC: "Ke", KL: "Kl" }
export const initialsOf = (id: string) => AVATAR[id] ?? initials(PEOPLE[id]?.name ?? id)
export const firstName = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

export const PROJECT_ICON: Record<string, LucideIcon> = { whiskr: Cat, holiday: Gift, seed: Sprout }
// The rail's projects, with what waits in each.
export const RAIL_PROJECTS: { id: string; name: string; badge?: number }[] = [
  { id: "whiskr", name: "Whiskr (Demo project)", badge: 2 },
  { id: "holiday", name: "Holiday campaign" },
  { id: "seed", name: "Seed round" },
]

export const TODAY = {
  title: "Today",
  date: "Sunday, October 25",
  badge: 1,
  needs: [
    { id: "du8", who: "MC", lead: "Asked your Duet", title: "Keller asked whether the launch date moves", sub: "Nothing of yours covers it yet", project: "Whiskr", action: "Answer" },
  ],
  projects: [
    { id: "whiskr", name: "Whiskr (Demo project)", summary: "The brand color is now blue, but the posters are still red.", unread: 1 },
    { id: "holiday", name: "Holiday campaign", summary: "Nothing new this week.", unread: 0 },
    { id: "seed", name: "Seed round", summary: "Nothing new this week.", unread: 0 },
  ],
  views: ["All", "My open tasks", "Due this week"],
  tasks: [
    { id: "t-promo", project: "Whiskr (Demo project)", thread: "Marketing", title: "Plan the 15-second promo video", status: "In progress", people: ["MC", "CH"], due: "Mon Nov 2" },
    { id: "t-review", project: "Whiskr (Demo project)", thread: "Marketing", title: "Review the posters and video before launch", status: "To do", people: ["CH", "MC"], due: "Fri Oct 30" },
  ],
  handled: "Nothing today or yesterday.",
  upcomingProject: "Whiskr (Demo project)",
  upcoming: [
    { day: "Mon, Oct 26", events: [{ time: "9:30", title: "Weekly sync" }] },
    { day: "Thu, Oct 29", events: [{ time: "14:00", title: "App store screenshots" }] },
    { day: "Fri, Oct 30", events: [{ time: "10:00", title: "Poster and video review" }, { time: "10:30", title: "Print proof call" }, { time: "16:00", title: "Vet call about the purr" }] },
    { day: "Mon, Nov 2", events: [{ time: "9:30", title: "Weekly sync" }] },
    { day: "Mon, Nov 9", events: [{ time: "9:30", title: "Weekly sync" }] },
    { day: "Mon, Nov 16", events: [{ time: "9:30", title: "Weekly sync" }] },
  ],
}

export const DECISIONS = {
  project: { id: "seed", name: "Seed round" },
  nav: ["Home", "Tasks", "Artifacts", "Decisions"],
  title: "Decisions",
  count: 0,
  empty: "No decisions yet",
}
