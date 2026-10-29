import type { Project } from '@/data'
import { SectionWorkspace } from '@/components/decisions/section-workspace'
import { projectSections } from '@/components/decisions/section-data'
import { navigate } from '@/lib/router'

// Decisions owns an immersive canvas. Decision IDs continue to live in the
// hash route, while the outline navigates within the canvas. Artifacts open in
// the Artifacts tab, their one viewer.
export function ProjectDecisions({ project, selectedId }: { project: Project; selectedId?: string }) {
  const open = (id: string | null) => navigate(`/p/${project.id}/decisions${id ? `/${id}` : ''}`)
  return <SectionWorkspace key={project.id} project={project} initialSections={projectSections(project.id)} selectedId={selectedId} onDecisionChange={open} onArtifact={id => navigate(`/p/${project.id}/artifacts/${id}`)} />
}
