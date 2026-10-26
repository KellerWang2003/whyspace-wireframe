import { ARTIFACTS, DECISIONS, LINKS, PART_SUMMARY, PEOPLE } from '@/data'
import { buildModel, SUBSECTIONS } from '@/playground/model'
import { SECTION_SEED, type WorkSection } from './section-model'

// Preserve the approved Platiful hierarchy, and place the existing project data
// into it so Inbox, task, and All decisions links keep their original IDs.
export function projectSections(projectId: string): WorkSection[] {
  const model = buildModel(projectId)
  let sections: WorkSection[]
  const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')
  if (projectId === 'platiful') {
    sections = SECTION_SEED.map(s => ({ ...s, artifacts: s.artifacts.filter(a => !['prototype', 'store', 'repo'].includes(a.id)), decisions: s.decisions.filter(d => d.id !== 'photo-first') }))
    sections.push(
      { id: 'research', parent: null, name: 'Research', owner: 'Priya', summary: PART_SUMMARY.Research, artifacts: [], decisions: [] },
      { id: 'schedule', parent: 'design', name: 'Weekly meal plan', owner: 'Keller', summary: 'Keep dinners flexible and make recipe swaps easy to understand.', artifacts: [], decisions: [] },
      { id: 'reminders', parent: 'engineering', name: 'Offline grocery list', owner: 'Sam', summary: 'Cache the grocery list and explain how edits sync when connectivity returns.', artifacts: [], decisions: [] },
    )
  } else {
    sections = model.parts.map(p => ({ id: slug(p.name), parent: null, name: p.name, owner: PEOPLE[p.owner]?.name.split(' ')[0] ?? p.owner, summary: PART_SUMMARY[p.name] ?? model.project.brief, artifacts: [], decisions: [] }))
    for (const s of SUBSECTIONS[projectId] ?? []) {
      const parent = s.parent.startsWith('part:') ? slug(s.parent.slice(5)) : s.parent
      sections.push({ id: s.id, parent, name: s.name, owner: sections.find(p => p.id === parent)?.owner ?? 'Keller', summary: s.id === 'quiz' ? 'Generate five practice questions from one PDF, with a supporting passage and source page.' : 'Build and evaluate the PDF extraction and question-generation pipeline.', artifacts: [], decisions: [] })
    }
  }
  const decisionPlacement: Record<string, string> = projectId === 'platiful' ? {
    five: 'research', core: 'research', digest: 'research', photo: 'design', calendar: 'schedule', type: 'schedule', empty: 'onboarding', swiftui: 'engineering', ondevice: 'plant-id', local: 'reminders', tuesday: 'marketing', screens: 'materials', freemium: 'marketing',
  } : {}
  const artifactPlacement: Record<string, string> = projectId === 'platiful' ? {
    a1: 'design', a2: 'screens', a3: 'research', a4: 'research', a5: 'research', a6: 'engineering', a7: 'engineering', a8: 'materials', a9: 'marketing', a10: 'brand',
  } : {}
  for (const subsection of SUBSECTIONS[projectId] ?? []) {
    if (projectId === 'platiful') break
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
  const shared: Record<string, string[]> = projectId === 'platiful' ? {
    a1: ['onboarding', 'schedule'], a2: ['materials'], a8: ['screens'], cut: ['editing'], 'video-brief': ['script'],
  } : { a14: ['prototype'], a15: ['concept'] }
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
