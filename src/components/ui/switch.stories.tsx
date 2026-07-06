import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Switch>

function Demo({ initial = false, disabled = false, label }: { initial?: boolean; disabled?: boolean; label: string }) {
  const [on, setOn] = useState(initial)
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-foreground">
      <Switch checked={on} onCheckedChange={setOn} disabled={disabled} />
      {label}
    </label>
  )
}

export const Off: Story = { render: () => <Demo label="Show all roles" /> }
export const On: Story = { render: () => <Demo initial label="Raise hiring requests" /> }
export const Disabled: Story = { render: () => <Demo disabled label="Unavailable option" /> }
