import type { Meta, StoryObj } from '@storybook/react'
import { CreateDialog } from './CreateDialog'

const meta: Meta<typeof CreateDialog> = {
  title: 'Positions/CreateDialog',
  component: CreateDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { open: true },
  argTypes: {
    onOpenChange: { action: 'open-change' },
    onCreate: { action: 'create' },
  },
}

export default meta
type Story = StoryObj<typeof CreateDialog>

/** Legacy create flow (count + location split) — replaced by CreateDialogList as the default; kept for usability-test comparison. */
export const Default: Story = {}

/** Pre-filled with a role (e.g. opened from an empty grid cell). */
export const Prefilled: Story = {
  args: { defaultTitle: 'Product Designer' },
}
