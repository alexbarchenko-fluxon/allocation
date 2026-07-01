import type { Meta, StoryObj } from '@storybook/react'
import { MetricCards } from './MetricCards'
import { rollupReal, rollupNoReview, rollupHeavyBacklog } from './stories.fixtures'

const meta: Meta<typeof MetricCards> = {
  title: 'Positions/MetricCards',
  component: MetricCards,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { onNeedsReview: { action: 'needs-review' } },
  decorators: [
    (Story) => (
      <div className="w-[900px] max-w-full">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MetricCards>

/** The default rollup from seed data — filled, open, and some needing review. */
export const Default: Story = {
  args: { r: rollupReal },
}

/** Everything up to date — the Open card shows "All up to date" instead of a review link. */
export const NoNeedsReview: Story = {
  args: { r: rollupNoReview },
}

/** A large backlog — heavy past-due and no-request counts drive the review link. */
export const HeavyBacklog: Story = {
  args: { r: rollupHeavyBacklog },
}
