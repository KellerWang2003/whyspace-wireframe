import { AppShell } from '@/components/app/app-shell'
import { SectionWorkspace } from '@/components/decisions/section-workspace'
import { projectSections } from '@/components/decisions/section-data'
import { PROJECTS } from '@/data'

export function SectionPlayground() {
  return <AppShell crumbs={[{ label: 'Prototype' }, { label: 'Nested sections playground' }]}>
    <SectionWorkspace project={PROJECTS[0]} initialSections={projectSections(PROJECTS[0].id)} />
  </AppShell>
}
