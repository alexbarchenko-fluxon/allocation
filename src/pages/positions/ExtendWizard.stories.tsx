import type { Meta, StoryObj } from '@storybook/react'
import { ExtendWizard } from './ExtendWizard'
import { extendRecords, openReqRecords } from './stories.fixtures'

const meta: Meta<typeof ExtendWizard> = {
  title: 'Positions/ExtendWizard',
  component: ExtendWizard,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { open: true },
  argTypes: {
    onOpenChange: { action: 'open-change' },
    onConfirm: { action: 'confirm' },
  },
}

export default meta
type Story = StoryObj<typeof ExtendWizard>

/** Extend mode — move past-due positions forward to the current month. */
export const Extend: Story = {
  args: {
    title: 'Senior Software Engineer',
    dept: 'Engineering',
    monthLabel: 'May 2026',
    mode: 'extend',
    records: extendRecords,
  },
}

/** Open-request mode — raise hiring requests for no-request positions, with a target date. */
export const OpenRequest: Story = {
  args: {
    title: 'Senior Product Manager',
    dept: 'Product',
    monthLabel: 'August 2026',
    mode: 'open',
    records: openReqRecords,
  },
}
