import type { Meta, StoryObj } from '@storybook/react'
import { OpenRequestWizard } from './OpenRequestWizard'
import { openReqRecords } from './stories.fixtures'

const meta: Meta<typeof OpenRequestWizard> = {
  title: 'Positions/OpenRequestWizard',
  component: OpenRequestWizard,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { open: true },
  argTypes: {
    onOpenChange: { action: 'open-change' },
    onConfirm: { action: 'confirm' },
  },
}

export default meta
type Story = StoryObj<typeof OpenRequestWizard>

/** Raise hiring requests for no-request positions — records preselected, target date required. */
export const Default: Story = {
  args: {
    title: 'Senior Product Manager',
    dept: 'Product',
    monthLabel: 'August 2026',
    records: openReqRecords,
  },
}
