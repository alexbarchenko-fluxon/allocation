import type { Meta, StoryObj } from '@storybook/react'
import { AllocGroupBlock } from '../../PeoplePage'
import type { AllocGroup } from '../../PeoplePage'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const singleRowGroup: AllocGroup = {
  projectId:   'proj-1',
  projectName: 'Campus Planning 2026',
  rows: [
    { id: 'a1', startDate: '2026-01-01', endDate: '2026-06-30', hoursPerWeek: 40, nonBillable: false },
  ],
}

const multiRowGroup: AllocGroup = {
  projectId:   'proj-2',
  projectName: 'Analytics Dashboard Revamp',
  rows: [
    { id: 'a2', startDate: '2026-03-01', endDate: '2026-06-30', hoursPerWeek: 40, nonBillable: false },
    { id: 'a3', startDate: '2025-10-01', endDate: '2026-02-28', hoursPerWeek: 32, nonBillable: true  },
    { id: 'a4', startDate: '2025-06-01', endDate: '2025-09-30', hoursPerWeek: 40, nonBillable: false },
  ],
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[380px] bg-background border border-border rounded-lg px-4 py-3">
      {children}
    </div>
  )
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AllocGroupBlock> = {
  title: 'People/AllocGroupBlock',
  component: AllocGroupBlock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <PanelWrapper>
        <Story />
      </PanelWrapper>
    ),
  ],
  args: {
    group:    singleRowGroup,
    capacity: 40,
  },
}

export default meta
type Story = StoryObj<typeof AllocGroupBlock>

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {}

/**
 * Project with multiple date-range rows — includes one non-billable entry.
 */
export const MultipleRows: Story = {
  args: { group: multiRowGroup },
}

/**
 * Two project groups stacked as they appear in the "Currently working on" section.
 */
export const TwoGroups: Story = {
  render: () => (
    <PanelWrapper>
      <div className="flex flex-col gap-5">
        <AllocGroupBlock group={singleRowGroup} capacity={40} />
        <AllocGroupBlock group={multiRowGroup}  capacity={40} />
      </div>
    </PanelWrapper>
  ),
  decorators: [],
}
