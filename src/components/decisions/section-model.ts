import { type Artifact, type Decision } from '@/data'
export const SECTION_LAYOUTS = [
  ['canvas', 'Section map', 'Expand sections to reveal connected branches of work.'],
] as const


// Shared section types and the Platiful example hierarchy. Project data is
// attached by section-data.ts without changing original decision or artifact IDs.
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

export const SECTION_SEED: WorkSection[] = [
  { id: 'marketing', parent: null, name: 'Marketing', owner: 'Ana', summary: 'Introduce Platiful through three dinners becoming one useful grocery list.', change: 'The campaign now leads with the product. Video and Beta onboarding materials are being updated together.', action: 'Remove the paid-trial offer before sending beta invitations.', artifacts: [{ id: 'brief', name: 'Launch brief.md', kind: 'Brief', updated: 'Today' }], decisions: [{ id: 'promise', title: 'Lead with three dinners and one grocery list', why: 'It makes the value tangible before we ask someone to sign up.', drives: ['video', 'materials', 'onboarding'] }] },
  { id: 'video', parent: 'marketing', name: 'Marketing video', owner: 'Ana', summary: 'A 30-second product demonstration using real footage and the latest app screens.', change: 'Ana shared rough cut v3. The opening now shows the product immediately.', action: 'Choose a closing call to action.', artifacts: [{ id: 'cut', name: 'Rough cut v3', kind: 'Video', updated: '2h ago' }, { id: 'video-brief', name: 'Creative brief.md', kind: 'Document', updated: 'Yesterday' }], decisions: [{ id: 'footage', title: 'Use real product footage', why: 'The animation was attractive, but viewers could not explain what the app did.', drives: ['editing', 'screens'] }] },
  { id: 'script', parent: 'video', name: 'Script', owner: 'Leo', summary: 'Show dinner selection, a recipe swap, and the resulting grocery list.', change: 'Leo shortened the opening and removed the feature list.', artifacts: [{ id: 'script-doc', name: 'Script v2.md', kind: 'Script', updated: 'Today' }], decisions: [{ id: 'voice', title: 'Tell the story through captions', why: 'The video needs to work when people watch without sound.', inferred: true, drives: ['editing', 'brand'] }] },
  { id: 'editing', parent: 'video', name: 'Editing', owner: 'Ana', summary: 'A short, quiet cut with room to read each caption.', artifacts: [{ id: 'edit', name: 'Edit timeline', kind: 'Video project', updated: 'Yesterday' }], decisions: [{ id: 'length', title: 'Keep the final cut under 30 seconds', why: 'The launch page should communicate the core loop in one glance.', drives: ['materials'] }] },
  { id: 'materials', parent: 'marketing', name: 'Marketing materials', owner: 'Ana', summary: 'Beta onboarding screenshots and launch assets share the same product story.', change: 'New screenshots show planning, swapping a dinner, and shopping.', artifacts: [{ id: 'store', name: 'Beta onboarding screenshots', kind: 'Design', updated: 'Today' }, { id: 'launch', name: 'Launch checklist.md', kind: 'Document', updated: 'Oct 19' }], decisions: [] },
  { id: 'brand', parent: 'marketing', name: 'Brand guidelines', owner: 'Leo', summary: 'Readable recipe cards, direct language, and real food photography.', artifacts: [{ id: 'brand-doc', name: 'Platiful brand guide', kind: 'Design', updated: 'Oct 18' }], decisions: [{ id: 'tone', title: 'Keep the language friendly and direct', why: 'Weekly meal planning already feels like another chore.', drives: ['script', 'onboarding'] }] },
  { id: 'design', parent: null, name: 'Design', owner: 'Keller', summary: 'Help people choose three dinners, swap meals, and shop from one list.', change: 'The dinner-swap flow is ready for review. Time and servings stay visible on recipe cards.', artifacts: [{ id: 'prototype', name: 'Platiful prototype', kind: 'Prototype', updated: 'Today' }], decisions: [{ id: 'photo-first', title: 'Choose dinners before creating an account', why: 'Four of six testers wanted to see useful recipes before signing up.', drives: ['onboarding', 'video', 'materials'] }] },
  { id: 'onboarding', parent: 'design', name: 'Choose dinners', owner: 'Keller', summary: 'Choose three dinners, then offer an account to save the plan.', action: 'Test suggested dinners against an empty first plan.', artifacts: [{ id: 'flow', name: 'Choose dinners flow', kind: 'Design', updated: 'Today' }], decisions: [{ id: 'fallback', title: 'Keep dietary preferences editable', why: 'People need to exclude ingredients without restarting their plan.', drives: ['plant-id'] }] },
  { id: 'screens', parent: 'design', name: 'Product screens', owner: 'Keller', summary: 'Capture the current iPhone screens for the video and beta launch.', artifacts: [{ id: 'screen-kit', name: 'Recording-ready screens', kind: 'Design', updated: 'Yesterday' }], decisions: [] },
  { id: 'engineering', parent: null, name: 'Engineering', owner: 'Sam', summary: 'The existing React Native app, with reliable grocery merging and offline list access.', change: 'Grocery merging now keeps incompatible units separate.', artifacts: [{ id: 'repo', name: 'platiful-mobile', kind: 'Repository', updated: '1h ago' }], decisions: [{ id: 'offline', title: 'Keep the grocery list available offline', why: 'Supermarket connectivity should not prevent people from reading their shopping list.', drives: ['plant-id', 'onboarding'] }] },
  { id: 'plant-id', parent: 'engineering', name: 'Grocery merging', owner: 'Sam', summary: 'Merge matching ingredients and units; keep unsupported conversions separate.', artifacts: [{ id: 'model', name: 'Grocery unit test cases.md', kind: 'Document', updated: 'Today' }], decisions: [] },
]

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
