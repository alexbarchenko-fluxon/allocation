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
 * The default create flow (Figma 274-33410): one line per role + location + count,
 * "Add position" adds lines, one hiring-request switch + start date for the batch.
 */
export const Default: Story = {}

/** Prefilled with a role (e.g. launched from a grid cell). */
export const Prefilled: Story = {
  args: { defaultTitle: 'Product Designer' },
}
