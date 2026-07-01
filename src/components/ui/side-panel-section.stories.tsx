import type { Meta, StoryObj } from '@storybook/react'
import { SidePanelSection } from './side-panel-section'

function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[420px] border border-border rounded-lg bg-background shadow-sm overflow-hidden">
      {children}
    </div>
  )
}

const meta: Meta<typeof SidePanelSection> = {
  title: 'UI/SidePanelSection',
  component: SidePanelSection,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <PanelWrapper>
        <Story />
      </PanelWrapper>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SidePanelSection>

// ── Stories ───────────────────────────────────────────────────────────────────

export const DefaultOpen: Story = {
  args: {
    title: 'Currently working on',
    defaultOpen: true,
    children: (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Project Alpha — Jan 01 &#39;26 - Jun 30 &#39;26 — 40/40h</p>
        <p>Project Beta — Feb 01 &#39;26 - Mar 31 &#39;26 — 20/40h</p>
      </div>
    ),
  },
}

export const DefaultClosed: Story = {
  args: {
    title: 'Past allocations (3)',
    defaultOpen: false,
    children: (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>Project Gamma — Sep 01 &#39;25 - Dec 31 &#39;25 — 40/40h</p>
      </div>
    ),
  },
}

export const TwoSections: Story = {
  render: () => (
    <PanelWrapper>
      <SidePanelSection title="Currently working on" defaultOpen>
        <div className="text-sm text-muted-foreground py-1">
          Active project content here
        </div>
      </SidePanelSection>
      <SidePanelSection title="Past allocations (5)" defaultOpen={false}>
        <div className="text-sm text-muted-foreground py-1">
          Historical allocations content here
        </div>
      </SidePanelSection>
    </PanelWrapper>
  ),
}
