import type { Meta, StoryObj } from '@storybook/react'
import { PositionsFlatTable } from './PositionsFlatTable'
import { flatOpenRows } from './stories.fixtures'

const meta: Meta<typeof PositionsFlatTable> = {
  title: 'Positions/PositionsFlatTable',
  component: PositionsFlatTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { onRowClick: { action: 'row-click' } },
  decorators: [
    (Story) => (
      <div className="w-[820px] max-w-full">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PositionsFlatTable>

/** Every open role, aggregated across months and sorted oldest-first. */
export const Default: Story = {
  args: { rows: flatOpenRows },
}

/** A short, focused list. */
export const FewRoles: Story = {
  args: { rows: flatOpenRows.slice(0, 4) },
}
