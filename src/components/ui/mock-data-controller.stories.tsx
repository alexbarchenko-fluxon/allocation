import type { Meta, StoryObj } from '@storybook/react'
import { MockDataController } from './mock-data-controller'

const meta: Meta<typeof MockDataController> = {
  title: 'UI/MockDataController',
  component: MockDataController,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MockDataController>

export const Default: Story = {
  args: {
    l1Count: 5,
    l2Count: 5,
    l3Count: 5,
    onSave: () => {},
  },
}

export const AllEmpty: Story = {
  args: {
    l1Count: 0,
    l2Count: 0,
    l3Count: 0,
    onSave: () => {},
  },
}

export const AllMax: Story = {
  args: {
    l1Count: 15,
    l2Count: 15,
    l3Count: 15,
    onSave: () => {},
  },
}

export const Mixed: Story = {
  args: {
    l1Count: 3,
    l2Count: 7,
    l3Count: 12,
    onSave: () => {},
  },
}
