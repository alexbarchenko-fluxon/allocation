import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Users } from 'lucide-react'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
  args: {
    children: 'Badge',
    variant: 'default',
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge {...args} variant="default">Default</Badge>
      <Badge {...args} variant="secondary">Secondary</Badge>
      <Badge {...args} variant="destructive">Destructive</Badge>
      <Badge {...args} variant="outline">Outline</Badge>
    </div>
  ),
}

/**
 * The specific usage on the People page: a secondary count pill with an icon.
 * Appears in the frozen list header showing the total number of visible people.
 */
export const PeopleCount: Story = {
  render: () => (
    <Badge
      variant="secondary"
      className="gap-1 px-2 py-0.5 rounded-full border-transparent text-xs font-medium text-muted-foreground"
    >
      <Users className="h-3 w-3" />
      24
    </Badge>
  ),
}
