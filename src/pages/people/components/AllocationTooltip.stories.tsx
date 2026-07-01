import type { Meta, StoryObj } from '@storybook/react'
import { AllocationTooltip } from '../../PeoplePage'
import type { AllocationTooltipRow } from '../../PeoplePage'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const singleAlloc: AllocationTooltipRow[] = [
  {
    projectName:  'Campus Planning 2026',
    hoursPerWeek: 40,
    startDate:    '2026-01-01',
    endDate:      '2026-06-30',
  },
]

const multipleAllocs: AllocationTooltipRow[] = [
  {
    projectName:  'Analytics Dashboard Revamp',
    hoursPerWeek: 24,
    startDate:    '2026-02-01',
    endDate:      '2026-05-31',
  },
  {
    projectName:  'Mobile Checkout Redesign',
    hoursPerWeek: 20,
    startDate:    '2026-02-01',
    endDate:      '2026-04-30',
  },
]

const withNBAlloc: AllocationTooltipRow[] = [
  {
    projectName:  'Internal Tooling Sprint',
    hoursPerWeek: 40,
    startDate:    '2026-01-01',
    endDate:      '2026-03-31',
    nonBillable:  true,
  },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AllocationTooltip> = {
  title: 'People/AllocationTooltip',
  component: AllocationTooltip,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#111827' }],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AllocationTooltip>

// ── Stories ───────────────────────────────────────────────────────────────────

/** Single project allocation. */
export const Default: Story = {
  args: { allocs: singleAlloc },
}

/** Two overlapping projects sharing hours in the same Gantt block. */
export const MultipleProjects: Story = {
  args: { allocs: multipleAllocs },
}

/** Non-billable project — shows the NB badge inside the project name cell. */
export const WithNonBillable: Story = {
  args: { allocs: withNBAlloc },
}

/**
 * All tooltip variants for design review.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-gray-400 mb-2">Single project</p>
        <AllocationTooltip allocs={singleAlloc} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Multiple overlapping projects</p>
        <AllocationTooltip allocs={multipleAllocs} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-2">Non-billable</p>
        <AllocationTooltip allocs={withNBAlloc} />
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
}
