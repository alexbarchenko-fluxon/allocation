import type { Meta, StoryObj } from '@storybook/react'
import { CreateDialogList } from './CreateDialogList'

const meta: Meta<typeof CreateDialogList> = {
  title: 'Positions/CreateDialogList',
  component: CreateDialogList,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { open: true },
  argTypes: {
    onOpenChange: { action: 'open-change' },
    onCreate: { action: 'create' },
  },
}

export default meta
type Story = StoryObj<typeof CreateDialogList>

/**
 * Experimental list-based create (AJ's proposal): one line per role + location + count,
 * add lines for different roles/locations, open everything in one go. Lives behind the
 * flask button next to "New position" for comparison against the classic dialog.
 */
export const Default: Story = {}

/** Prefilled with a role (e.g. launched from a grid cell). */
export const Prefilled: Story = {
  args: { defaultTitle: 'Product Designer' },
}
