import type { Meta, StoryObj } from '@storybook/react'
import { ChangeLog } from './ChangeLog'
import { activity } from './stories.fixtures'

const meta: Meta<typeof ChangeLog> = {
  title: 'Positions/ChangeLog',
  component: ChangeLog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { isOpen: true },
  argTypes: { onClose: { action: 'close' } },
  // Slide-in rail — needs a tall host to render at full height.
  decorators: [
    (Story) => (
      <div className="flex h-[680px] p-6 bg-muted/30">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChangeLog>

/** The change log with seeded activity — system dots and person avatars. */
export const Default: Story = {
  args: { entries: activity },
}

/** No activity yet. */
export const Empty: Story = {
  args: { entries: [] },
}
