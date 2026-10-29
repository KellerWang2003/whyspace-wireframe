import { type Artifact, type Decision } from '@/data'
export const SECTION_LAYOUTS = [
  ['canvas', 'Section map', 'Expand sections to reveal connected branches of work.'],
] as const


// Shared section types. Project data is attached by section-data.ts
// without changing original decision or artifact IDs.
export type SectionArtifact = { id: string; name: string; kind: string; updated: string; source?: Artifact }
export type SectionDecision = { id: string; title: string; why: string; inferred?: boolean; drives: string[]; source?: Decision }
export type WorkSection = {
  id: string
  parent: string | null
  name: string
  owner: string
  summary: string
  change?: string
  action?: string
  artifacts: SectionArtifact[]
  decisions: SectionDecision[]
}

export function descendants(sections: WorkSection[], id: string): string[] {
  return sections.filter(s => s.parent === id).flatMap(s => [s.id, ...descendants(sections, s.id)])
}
export function sectionPath(sections: WorkSection[], id: string): WorkSection[] {
  const s = sections.find(s => s.id === id)
  return s ? [...(s.parent ? sectionPath(sections, s.parent) : []), s] : []
}

// A move changes the hierarchy and order together. Returning the existing array
// makes invalid drops (including into a descendant) harmless.
export function moveWorkSection(sections: WorkSection[], id: string, parent: string | null, before?: string) {
  const section = sections.find(s => s.id === id)
  if (!section || parent === id || (parent && (!sections.some(s => s.id === parent) || descendants(sections, id).includes(parent)))) return sections
  if (before === id) return sections
  const remaining = sections.filter(s => s.id !== id)
  const moved = { ...section, parent }
  const index = before ? remaining.findIndex(s => s.id === before && s.parent === parent) : -1
  remaining.splice(index >= 0 ? index : remaining.length, 0, moved)
  return remaining
}
