import { AppShell } from '@/components/app/app-shell'
import { SectionWorkspace } from '@/components/decisions/section-workspace'
import { SECTION_SEED } from '@/components/decisions/section-model'
import { PROJECTS } from '@/data'

export function SectionPlayground() {
  return <AppShell crumbs={[{ label: 'Prototype' }, { label: 'Nested sections playground' }]}>
    <SectionWorkspace project={PROJECTS[0]} initialSections={SECTION_SEED} />
  </AppShell>
}
