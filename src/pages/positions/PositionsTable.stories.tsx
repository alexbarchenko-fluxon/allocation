import type { Meta, StoryObj } from '@storybook/react'
import { PositionsTable } from './PositionsTable'
import { tableSectionsOpen, tableSectionsAll, firstRowId } from './stories.fixtures'

const meta: Meta<typeof PositionsTable> = {
  title: 'Positions/PositionsTable',
  component: PositionsTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    onRowClick: { action: 'row-click' },
    onRowClose: { action: 'row-close' },
  },
  decorators: [
    (Story) => (
      <div className="w-[960px] max-w-full">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PositionsTable>

/** Open + past-due role-month rows, grouped by department. */
export const Default: Story = {
  args: { sections: tableSectionsOpen },
}

/** A selected row is highlighted via `selectedId`. */
export const WithSelectedRow: Story = {
  args: { sections: tableSectionsOpen, selectedId: firstRowId },
}

/** All active rows, including fully-filled ones (which show the green "Filled" badge). */
export const FilledView: Story = {
  args: { sections: tableSectionsAll },
}
