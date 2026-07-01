import type { Meta, StoryObj } from '@storybook/react'
import { SearchEmpty } from './EmptyState'

const meta: Meta<typeof SearchEmpty> = {
  title: 'Positions/SearchEmpty',
  component: SearchEmpty,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[520px] max-w-full rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SearchEmpty>

/** No results for a short query. */
export const Default: Story = {
  args: { query: 'Designer' },
}

/** A long query still truncates gracefully. */
export const LongQuery: Story = {
  args: { query: 'Senior Staff Principal Engineering Manager' },
}
