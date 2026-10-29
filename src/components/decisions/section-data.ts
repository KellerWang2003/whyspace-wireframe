import { ARTIFACTS, DECISIONS, LINKS, PART_SUMMARY, PEOPLE } from '@/data'
import { buildModel, SUBSECTIONS } from '@/playground/model'
import { type WorkSection } from './section-model'

// Build a project's sections from its parts and mock subsections, placing the
// existing project data so Inbox, task, and All decisions links keep their original IDs.
export function projectSections(projectId: string): WorkSection[] {
  const model = buildModel(projectId)
  const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')
  const sections: WorkSection[] = model.parts.map(p => ({ id: slug(p.name), parent: null, name: p.name, owner: PEOPLE[p.owner]?.name.split(' ')[0] ?? p.owner, summary: PART_SUMMARY[p.name] ?? model.project.brief, artifacts: [], decisions: [] }))
  // Parts that have work but no decisions yet still get a section, led by the artifact's owner.
  for (const a of model.artifacts) {
    if (!sections.some(s => s.id === slug(a.part))) sections.push({ id: slug(a.part), parent: null, name: a.part, owner: PEOPLE[a.owner]?.name.split(' ')[0] ?? a.owner, summary: 'No decisions yet.', artifacts: [], decisions: [] })
  }
  for (const s of SUBSECTIONS[projectId] ?? []) {
    const parent = s.parent.startsWith('part:') ? slug(s.parent.slice(5)) : s.parent
    sections.push({ id: s.id, parent, name: s.name, owner: sections.find(p => p.id === parent)?.owner ?? 'Keller', summary: s.summary ?? '', artifacts: [], decisions: [] })
  }
  const decisionPlacement: Record<string, string> = {}
  const artifactPlacement: Record<string, string> = {}
  for (const subsection of SUBSECTIONS[projectId] ?? []) {
    for (const item of subsection.items) {
      if (item.startsWith('d:')) decisionPlacement[item.slice(2)] = subsection.id
      if (item.startsWith('a:')) artifactPlacement[item.slice(2)] = subsection.id
    }
  }
  const projectDecisions = DECISIONS.filter(d => d.project === projectId)
  for (const d of projectDecisions) decisionPlacement[d.id] ??= slug(d.part)
  for (const d of projectDecisions) {
    const section = sections.find(s => s.id === decisionPlacement[d.id])
    if (!section) continue
    const drives = LINKS.filter(([source]) => source === d.id).map(([, target]) => decisionPlacement[target]).filter((id): id is string => !!id && id !== section.id)
    section.decisions.push({ id: d.id, title: d.title, why: d.why ?? 'No rationale recorded yet.', inferred: d.status === 'inf', drives: [...new Set(drives)], source: d })
  }
  for (const a of ARTIFACTS.filter(a => a.project === projectId)) {
    const section = sections.find(s => s.id === (artifactPlacement[a.id] ?? slug(a.part)))
    section?.artifacts.push({ id: a.id, name: a.name, kind: a.kind, updated: a.updated, source: a })
  }
  // One artifact may support several areas of work. Sections reference the same
  // artifact ID; the Artifacts page deduplicates those references into one row.
  const shared: Record<string, string[]> = { w1: ['marketing'], w5: ['research'], a14: ['prototype'], a15: ['concept'] }
  for (const [artifactId, sectionIds] of Object.entries(shared)) {
    const artifact = sections.flatMap(section => section.artifacts).find(item => item.id === artifactId)
    if (!artifact) continue
    for (const sectionId of sectionIds) {
      const section = sections.find(item => item.id === sectionId)
      if (section && !section.artifacts.some(item => item.id === artifactId)) section.artifacts.push(artifact)
    }
  }
  return sections
}
