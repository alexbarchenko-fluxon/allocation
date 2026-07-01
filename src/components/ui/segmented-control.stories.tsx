import type { Meta, StoryObj } from "@storybook/react";
import { SegmentedControl } from "./segmented-control";

const meta: Meta<typeof SegmentedControl> = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SegmentedControl>;

const priorityOptions = [
  { value: "p0", label: "P0" },
  { value: "p1", label: "P1" },
  { value: "p2", label: "P2" },
];

/**
 * Default — P0 selected. Used for Strategic Priority and Staffing Priority.
 */
export const Default: Story = {
  args: {
    options: priorityOptions,
    defaultValue: "p0",
  },
};

/**
 * P1 selected as default.
 */
export const P1Selected: Story = {
  args: {
    options: priorityOptions,
    defaultValue: "p1",
  },
};

/**
 * No initial value — all segments appear inactive.
 */
export const Unselected: Story = {
  args: {
    options: priorityOptions,
  },
};

/**
 * With a disabled option.
 */
export const WithDisabled: Story = {
  args: {
    options: [
      { value: "p0", label: "P0" },
      { value: "p1", label: "P1" },
      { value: "p2", label: "P2", disabled: true },
    ],
    defaultValue: "p0",
  },
};

/**
 * Longer labels — verifies layout holds for wider option text.
 */
export const LongerLabels: Story = {
  args: {
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
    defaultValue: "medium",
  },
};

/**
 * Both priority pickers side-by-side, as they appear in the Staffing step.
 */
export const PriorityPair: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Strategic Priority</p>
        <SegmentedControl options={priorityOptions} defaultValue="p0" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Staffing Priority</p>
        <SegmentedControl options={priorityOptions} defaultValue="p1" />
      </div>
    </div>
  ),
};
