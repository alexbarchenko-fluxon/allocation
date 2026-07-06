import type { Meta, StoryObj } from '@storybook/react'
import { PositionDetailPanel } from './PositionDetailPanel'
import {
  rowReopened, recordsReopened,
  rowMixed, recordsMixed,
  rowFilled, recordsFilled,
  rowPastDue, recordsPastDue,
  rowClosed, recordsClosed,
  panelNotes,
} from './stories.fixtures'

const meta: Meta<typeof PositionDetailPanel> = {
  title: 'Positions/PositionDetailPanel',
  component: PositionDetailPanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { isOpen: true, notes: panelNotes },
  argTypes: {
    onDismiss: { action: 'dismiss' },
    onOpenRequest: { action: 'open-request' },
    onCloseRecords: { action: 'close-records' },
    onNewPosition: { action: 'new-position' },
    onAddNote: { action: 'add-note' },
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

/** MVP scope — Notes hidden while its placement is an open design question. */
export const MvpScopeNoNotes: Story = {
  args: { row: rowMixed, records: recordsMixed, showNotes: false },
}

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

/** Reopened position — the provenance line explains who left and when. */
export const Reopened: Story = {
  args: { row: rowReopened, records: recordsReopened, notes: [] },
}

/** A role-month with closed history — the collapsible Closed section appears. */
export const WithClosedRecords: Story = {
  args: { row: rowClosed, records: recordsClosed },
}
