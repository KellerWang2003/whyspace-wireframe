import { SETTINGS_TABS } from "@/data"
import { DESIGN } from "@/lib/design"

// AI tools are connected per person (Account › My AI tools), not per project, so the main design's
// project settings drop that tab and show each member's tools beside their name. Archived Design A keeps it.
export const PROJECT_TABS = DESIGN === "b" ? SETTINGS_TABS.filter(([key]) => key !== "ai-tools") : SETTINGS_TABS
