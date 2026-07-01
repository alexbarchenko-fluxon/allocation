import type { Meta, StoryObj } from '@storybook/react'
import { PlanGrid } from './PlanGrid'
import {
  planGroups, planRollups, planMonths,
  planGroupsSearch, planRollupsSearch, planSearch,
} from './stories.fixtures'

const meta: Meta<typeof PlanGrid> = {
  title: 'Positions/PlanGrid',
  component: PlanGrid,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    onCellClick: { action: 'cell-click' },
    onCreate: { action: 'create' },
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PlanGrid>

/** The planning grid across a six-month window, grouped by department. */
export const Default: Story = {
  args: { groups: planGroups, rollups: planRollups, months: planMonths, search: '' },
}

/** Filtered by search ("engineer") — only matching roles remain. */
export const FilteredBySearch: Story = {
  args: { groups: planGroupsSearch, rollups: planRollupsSearch, months: planMonths, search: planSearch },
}
