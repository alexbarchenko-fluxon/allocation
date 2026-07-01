import type { Meta, StoryObj } from "@storybook/react";
import { DateInput } from "./date-input";

const meta: Meta<typeof DateInput> = {
  title: "UI/DateInput",
  component: DateInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    error: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    error: false,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof DateInput>;

/**
 * Default empty state with placeholder.
 */
export const Default: Story = {
  render: (args) => (
    <div className="w-48">
      <DateInput {...args} />
    </div>
  ),
};

/**
 * With a pre-filled date value.
 */
export const WithValue: Story = {
  render: (args) => (
    <div className="w-48">
      <DateInput {...args} defaultValue="09/01/2025" />
    </div>
  ),
};

/**
 * Error state — border turns destructive red.
 */
export const Error: Story = {
  render: (args) => (
    <div className="w-48">
      <DateInput {...args} error defaultValue="13/99/2025" />
    </div>
  ),
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: (args) => (
    <div className="w-48">
      <DateInput {...args} disabled defaultValue="12/31/2025" />
    </div>
  ),
};

/**
 * Two date inputs side by side, as shown in the Deal info step.
 */
export const DateRange: Story = {
  render: () => (
    <div className="flex gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="start-date" className="text-sm font-medium">
          Start Date
        </label>
        <DateInput id="start-date" defaultValue="09/01/2025" className="w-44" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="end-date" className="text-sm font-medium">
          End Date
        </label>
        <DateInput id="end-date" defaultValue="12/31/2025" className="w-44" />
      </div>
    </div>
  ),
};
