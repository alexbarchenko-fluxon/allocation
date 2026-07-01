import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

/**
 * Default unchecked checkbox with a label.
 */
export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" {...args} />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

/**
 * All visual states: unchecked · checked · disabled unchecked · disabled checked.
 * Matches the Figma design system node 46:112.
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {/* Unchecked */}
      <div className="flex items-center gap-2">
        <Checkbox id="s-unchecked" />
        <Label htmlFor="s-unchecked">Unchecked</Label>
      </div>

      {/* Checked */}
      <div className="flex items-center gap-2">
        <Checkbox id="s-checked" defaultChecked />
        <Label htmlFor="s-checked">Checked</Label>
      </div>

      {/* Disabled unchecked */}
      <div className="flex items-center gap-2">
        <Checkbox id="s-dis-un" disabled />
        <Label htmlFor="s-dis-un" className="opacity-50">Disabled unchecked</Label>
      </div>

      {/* Disabled checked */}
      <div className="flex items-center gap-2">
        <Checkbox id="s-dis-ch" disabled defaultChecked />
        <Label htmlFor="s-dis-ch" className="opacity-50">Disabled checked</Label>
      </div>
    </div>
  ),
};

/**
 * Checkboxes used inside a list — typical filter menu usage.
 */
export const FilterList: Story = {
  render: () => (
    <div className="flex flex-col gap-1 min-w-[180px]">
      {["Engineer", "Designer", "Tech Lead", "Product Manager"].map((label, i) => (
        <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent">
          <Checkbox id={`fl-${i}`} defaultChecked={i < 2} />
          <Label htmlFor={`fl-${i}`} className="cursor-pointer font-normal">{label}</Label>
        </div>
      ))}
    </div>
  ),
};
