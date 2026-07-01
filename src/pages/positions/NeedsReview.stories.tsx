import type { Meta, StoryObj } from '@storybook/react'
import { NeedsReview } from './NeedsReview'
import { reviewItems, reviewNoReq, reviewPastDue } from './stories.fixtures'

const meta: Meta<typeof NeedsReview> = {
  title: 'Positions/NeedsReview',
  component: NeedsReview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    onExtend: { action: 'extend' },
    onOpenRequest: { action: 'open-request' },
    onClose: { action: 'close' },
  },
  decorators: [
    (Story) => (
      <div className="w-[900px] max-w-full">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NeedsReview>

/** The full review queue — a mix of no-request and past-due items. */
export const Default: Story = {
  args: { items: reviewItems },
}

/** Only no-request items — each offers "Open request". */
export const OnlyNoReq: Story = {
  args: { items: reviewNoReq },
}

/** Only past-due items — each offers "Extend request". */
export const OnlyPastDue: Story = {
  args: { items: reviewPastDue },
}

/** Empty queue — the reassuring "Nothing needs review" state. */
export const Empty: Story = {
  args: { items: [] },
}
