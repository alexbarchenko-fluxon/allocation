import type { Meta, StoryObj } from '@storybook/react'
import { AllocRow } from '../../PeoplePage'
import type { AllocRowData } from '../../PeoplePage'

// ── Wrapper ───────────────────────────────────────────────────────────────────

function RowWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[360px] bg-background border border-border rounded-lg px-4 py-3">
      {children}
    </div>
  )
}

// ── Fixture ───────────────────────────────────────────────────────────────────

const baseRow: AllocRowData = {
  id:           'alloc-1',
  startDate:    '2026-01-01',
  endDate:      '2026-06-30',
  hoursPerWeek: 40,
  nonBillable:  false,
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AllocRow> = {
  title: 'People/AllocRow',
  component: AllocRow,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <RowWrapper>
        <Story />
      </RowWrapper>
    ),
  ],
  args: {
    row:      baseRow,
    capacity: 40,
  },
}

export default meta
type Story = StoryObj<typeof AllocRow>

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {}

/**
 * Non-billable allocation — shows the "NB" badge between the dates and hours.
 */
export const NonBillable: Story = {
  args: { row: { ...baseRow, nonBillable: true } },
}

/**
 * Part-time person (20h/week capacity) — hours show as 20/20h.
 */
export const PartTime: Story = {
  args: {
    row:      { ...baseRow, hoursPerWeek: 20 },
    capacity: 20,
  },
}

/**
 * Under-allocated — hours are below capacity (e.g. 16/40h).
 */
export const UnderAllocated: Story = {
  args: { row: { ...baseRow, hoursPerWeek: 16 } },
}
