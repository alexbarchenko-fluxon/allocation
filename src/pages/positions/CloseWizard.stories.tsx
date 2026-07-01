import type { Meta, StoryObj } from '@storybook/react'
import { CloseWizard } from './CloseWizard'
import { closeRecords, closeRecordsProtected, closeProtectedFilledCount } from './stories.fixtures'

const meta: Meta<typeof CloseWizard> = {
  title: 'Positions/CloseWizard',
  component: CloseWizard,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { open: true },
  argTypes: {
    onOpenChange: { action: 'open-change' },
    onConfirm: { action: 'confirm' },
  },
}

export default meta
type Story = StoryObj<typeof CloseWizard>

/** Step 1: pick which open positions to close. */
export const Default: Story = {
  args: {
    title: 'Senior Software Engineer',
    dept: 'Engineering',
    monthLabel: 'August 2026',
    records: closeRecords,
    filledCount: 0,
  },
}

/** With filled positions present — the protected-headcount note appears. */
export const WithProtectedFilled: Story = {
  args: {
    title: 'Software Engineer',
    dept: 'Engineering',
    monthLabel: 'June 2026',
    records: closeRecordsProtected,
    filledCount: closeProtectedFilledCount,
  },
}
