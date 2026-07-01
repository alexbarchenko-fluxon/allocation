import type { Meta, StoryObj } from '@storybook/react'
import { PositionDetailPanel } from './PositionDetailPanel'
import {
  rowMixed, recordsMixed,
  rowFilled, recordsFilled,
  rowPastDue, recordsPastDue,
  rowClosed, recordsClosed,
} from './stories.fixtures'

const meta: Meta<typeof PositionDetailPanel> = {
  title: 'Positions/PositionDetailPanel',
  component: PositionDetailPanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { isOpen: true },
  argTypes: {
    onDismiss: { action: 'dismiss' },
    onExtend: { action: 'extend' },
    onOpenRequest: { action: 'open-request' },
    onCloseRecords: { action: 'close-records' },
    onPerson: { action: 'person' },
  },
  // The panel is a slide-in rail; give it a tall flex host so it renders at full height.
  decorators: [
    (Story) => (
      <div className="flex h-[680px] p-6 bg-muted/30">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PositionDetailPanel>

/** Someone on staff plus open positions — Filled and Open sections both populated. */
export const MixedStatuses: Story = {
  args: { row: rowMixed, records: recordsMixed },
}

/** A fully-filled cohort — every record is on staff. */
export const FullyFilled: Story = {
  args: { row: rowFilled, records: recordsFilled },
}

/** A month that already passed — open records read as past due. */
export const PastDue: Story = {
  args: { row: rowPastDue, records: recordsPastDue },
}

/** A role-month with closed history — the collapsible Closed section appears. */
export const WithClosedRecords: Story = {
  args: { row: rowClosed, records: recordsClosed },
}
