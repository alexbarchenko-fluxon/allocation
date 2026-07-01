import type { Meta, StoryObj } from '@storybook/react'
import { AllocationBlock } from '../../PeoplePage'
import type { BlockType } from '../../PeoplePage'

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AllocationBlock> = {
  title: 'People/AllocationBlock',
  component: AllocationBlock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    blockType: {
      control: 'select',
      options: ['allocation', 'misallocation', 'unassigned', 'ooo'] satisfies BlockType[],
    },
    width:      { control: { type: 'range', min: 80, max: 480, step: 8 } },
    totalHours: { control: { type: 'number', min: 0, max: 80 } },
  },
  args: {
    blockType:      'allocation',
    totalHours:     40,
    projectNames:   ['Campus Planning 2026'],
    hasNonBillable: false,
    width:          240,
  },
}

export default meta
type Story = StoryObj<typeof AllocationBlock>

// ── Stories ───────────────────────────────────────────────────────────────────

/** Full allocation — all hours assigned to a single project. */
export const Assigned: Story = {
  args: {
    blockType:    'allocation',
    totalHours:   40,
    projectNames: ['Campus Planning 2026'],
  },
}

/** Over- or under-allocated — hours don't match capacity. */
export const Misallocation: Story = {
  args: {
    blockType:    'misallocation',
    totalHours:   60,
    projectNames: ['Analytics Dashboard', 'Internal Tooling'],
  },
}

/** No project assigned — future gap in the schedule. */
export const Unassigned: Story = {
  args: {
    blockType:    'unassigned',
    totalHours:   0,
    projectNames: ['No projects'],
  },
}

/** Out-of-office — shows as a misallocation block (OOO is now a sub-interval overlay in the real Gantt). */
export const OOO: Story = {
  args: {
    blockType:    'unassigned',
    totalHours:   0,
    projectNames: ['No projects'],
  },
}

/** Allocation with non-billable flag — NB badge appears after the hours count. */
export const NonBillable: Story = {
  args: {
    blockType:      'allocation',
    totalHours:     40,
    projectNames:   ['Internal Tooling Sprint'],
    hasNonBillable: true,
  },
}

/** Two projects sharing the row. */
export const MultiProject: Story = {
  args: {
    blockType:    'misallocation',
    totalHours:   60,
    projectNames: ['Analytics Dashboard', 'Mobile Checkout'],
  },
}

/**
 * All block variants for design review — shown against the timeline row background.
 */
export const AllVariants: Story = {
  render: () => (
    <div
      className="flex flex-col gap-3 p-4 rounded-lg border border-border"
      style={{ backgroundColor: 'var(--timeline-row-bg)' }}
    >
      {(
        [
          { blockType: 'allocation'    as BlockType, totalHours: 40, projectNames: ['Campus Planning 2026'] as string[],                  hasNonBillable: false, label: 'Assigned (full)' },
          { blockType: 'allocation'    as BlockType, totalHours: 40, projectNames: ['Internal Tooling'] as string[],                      hasNonBillable: true,  label: 'Assigned (NB)' },
          { blockType: 'misallocation' as BlockType, totalHours: 60, projectNames: ['Analytics Dashboard', 'Mobile Checkout'] as string[], hasNonBillable: false, label: 'Misallocation (over)' },
          { blockType: 'misallocation' as BlockType, totalHours: 16, projectNames: ['Side Project'] as string[],                          hasNonBillable: false, label: 'Misallocation (under)' },
          { blockType: 'unassigned'    as BlockType, totalHours: 0,  projectNames: ['No projects'] as string[],                           hasNonBillable: false, label: 'Unassigned' },
        ]
      ).map(({ label, ...props }) => (
        <div key={label} className="flex items-center gap-4">
          <span className="w-48 text-xs text-muted-foreground shrink-0">{label}</span>
          <AllocationBlock {...props} width={280} />
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'padded' },
}
