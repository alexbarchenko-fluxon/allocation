import type { Meta, StoryObj } from "@storybook/react"
import { Search, Mail, Lock, Eye } from "lucide-react"
import { InputGroup } from "./input-group"

const meta: Meta<typeof InputGroup> = {
  title: "UI/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof InputGroup>

/**
 * Default InputGroup without addons — behaves like a plain input.
 */
export const Default: Story = {
  render: () => (
    <div className="w-[280px]">
      <InputGroup placeholder="Enter text…" />
    </div>
  ),
}

/**
 * Search field with trailing icon — matches the People / Search pattern
 * in Figma (node 154:12466). Used in the People page left-column search row.
 */
export const WithSearchIcon: Story = {
  render: () => (
    <div className="w-[280px]">
      <InputGroup
        placeholder="Search"
        wrapperClassName="h-9"
        rightElement={<Search className="h-4 w-4" />}
      />
    </div>
  ),
}

/**
 * Left-icon variant — e.g. email or password fields.
 */
export const WithLeftIcon: Story = {
  render: () => (
    <div className="space-y-3 w-[280px]">
      <InputGroup
        type="email"
        placeholder="name@example.com"
        leftElement={<Mail className="h-4 w-4" />}
      />
      <InputGroup
        type="password"
        placeholder="Password"
        leftElement={<Lock className="h-4 w-4" />}
        rightElement={<Eye className="h-4 w-4" />}
      />
    </div>
  ),
}

/**
 * Disabled state — pointer events blocked, opacity reduced.
 */
export const Disabled: Story = {
  render: () => (
    <div className="w-[280px]">
      <InputGroup
        placeholder="Search"
        wrapperClassName="h-9"
        rightElement={<Search className="h-4 w-4" />}
        disabled
      />
    </div>
  ),
}

/**
 * Error state — destructive border colour.
 */
export const Error: Story = {
  render: () => (
    <div className="w-[280px]">
      <InputGroup
        placeholder="Invalid value"
        error
        defaultValue="bad input"
      />
    </div>
  ),
}
