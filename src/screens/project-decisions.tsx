import { useState } from 'react'
import type { Project } from '@/data'
import { SectionWorkspace } from '@/components/decisions/section-workspace'
import { projectSections } from '@/components/decisions/section-data'
import { navigate } from '@/lib/router'
import { buildModel } from '@/playground/model'
import { FocusView } from '@/playground/panels'

// Decisions owns an immersive canvas. Decision IDs continue to live in the
// hash route, while the outline navigates within the canvas.
export function ProjectDecisions({ project, selectedId }: { project: Project; selectedId?: string }) {
  return <DecisionsForProject key={project.id} project={project} selectedId={selectedId} />
}

function DecisionsForProject({ project, selectedId }: { project: Project; selectedId?: string }) {
  const [artifact, setArtifact] = useState<string | null>(null)
  const model = buildModel(project.id)
  const open = (id: string | null) => navigate(`/p/${project.id}/decisions${id ? `/${id}` : ''}`)
  return <>
    <SectionWorkspace project={project} initialSections={projectSections(project.id)} selectedId={selectedId} onDecisionChange={open} onArtifact={setArtifact} />
    <FocusView m={model} id={artifact} onClose={() => setArtifact(null)} onDecision={id => { setArtifact(null); open(id) }} />
  </>
}
