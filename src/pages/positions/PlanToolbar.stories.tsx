import type { Meta, StoryObj } from '@storybook/react'
import { PlanToolbar } from './PlanToolbar'
import { TIMELINE, IDX_NOW } from '@/lib/positions/time'

const WIN = 6
const lastStart = TIMELINE.length - WIN

const label = (startIdx: number) => {
  const a = TIMELINE[startIdx]
  const b = TIMELINE[Math.min(startIdx + WIN - 1, TIMELINE.length - 1)]
  return a.year === b.year ? `${a.label} – ${b.label} ${b.year}` : `${a.label} ${a.year} – ${b.label} ${b.year}`
}

const meta: Meta<typeof PlanToolbar> = {
  title: 'Positions/PlanToolbar',
  component: PlanToolbar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { winLen: WIN, dept: 'All' },
  argTypes: {
    onShift: { action: 'shift' },
    onApply: { action: 'apply' },
    onDept: { action: 'dept' },
  },
}

export default meta
type Story = StoryObj<typeof PlanToolbar>

/** Mid-timeline — both arrows enabled. */
export const Default: Story = {
  args: { rangeLabel: label(IDX_NOW), startIdx: IDX_NOW, canLeft: true, canRight: true },
}

/** At the earliest window — the "earlier" arrow is disabled. */
export const AtRangeStart: Story = {
  args: { rangeLabel: label(0), startIdx: 0, canLeft: false, canRight: true },
}

/** At the latest window — the "later" arrow is disabled. */
export const AtRangeEnd: Story = {
  args: { rangeLabel: label(lastStart), startIdx: lastStart, canLeft: true, canRight: false },
}
