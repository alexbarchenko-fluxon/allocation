import type { Meta, StoryObj } from '@storybook/react'
import { PositionsTableIndividual } from './PositionsTableIndividual'
import { individualRows } from './lib'
import { makeSeedCells } from '@/lib/positions/seed'

const cells = makeSeedCells()

const meta: Meta<typeof PositionsTableIndividual> = {
  title: 'Positions/PositionsTableIndividual',
  component: PositionsTableIndividual,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "AJ's proposal, behind the third scope pill (MVP / Full / AJ): the Positions list at individual grain — one row per position record instead of role-month aggregates. Because rows are individual, 'Open for' and 'Person' are exact per row; Plan keeps the month-grain summary. Row click opens the parent cell's detail panel; no-request rows get a zap (open request) action, all non-filled rows get close.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRowClick: { action: 'row-click' },
    onClose: { action: 'close' },
    onOpenRequest: { action: 'open-request' },
  },
}

export default meta
type Story = StoryObj<typeof PositionsTableIndividual>

/** Every active position record, flat. */
export const AllRecords: Story = {
  args: { rows: individualRows(cells, '', 'All', 'all') },
}

/** Only open records — Brandon's "all open positions with age" view. */
export const OpenOnly: Story = {
  args: { rows: individualRows(cells, '', 'All', 'open') },
}

/** Filled records show the person on the placement. */
export const FilledOnly: Story = {
  args: { rows: individualRows(cells, '', 'All', 'filled') },
}

/** No-request records carry the zap action and the Reopened provenance badge. */
export const NoRequest: Story = {
  args: { rows: individualRows(cells, '', 'All', 'noreq') },
}

/** Scoped to one department, as the toolbar filter would. */
export const EngineeringOnly: Story = {
  args: { rows: individualRows(cells, '', 'Engineering', 'all') },
}
