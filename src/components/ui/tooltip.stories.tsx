import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { Button } from './button'

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>This is a tooltip</TooltipContent>
    </Tooltip>
  ),
}

export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-10 p-10">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" className="w-32 capitalize">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

/**
 * Per-avatar tooltip used in the AvatarStack component on the People page.
 * Each avatar shows the person's name on hover.
 */
export const AvatarTooltip: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan%20Chen"
          alt="Ryan Chen"
          className="h-6 w-6 rounded-full ring-2 ring-background cursor-default"
        />
      </TooltipTrigger>
      <TooltipContent side="top">Ryan Chen</TooltipContent>
    </Tooltip>
  ),
}
