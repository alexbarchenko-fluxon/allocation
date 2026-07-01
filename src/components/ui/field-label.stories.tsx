import type { Meta, StoryObj } from "@storybook/react";
import { FieldLabel } from "./field-label";
import { Input } from "./input";

const meta: Meta<typeof FieldLabel> = {
  title: "UI/FieldLabel",
  component: FieldLabel,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    hint: { control: "text" },
  },
  args: {
    children: "Deal Name",
    required: false,
  },
};

export default meta;

type Story = StoryObj<typeof FieldLabel>;

/**
 * A simple label wired to an input below it.
 */
export const Default: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2.5 w-64">
      <FieldLabel htmlFor="deal-name" {...args} />
      <Input id="deal-name" placeholder="e.g. Acme Corp Rebrand" />
    </div>
  ),
};

/**
 * Required field — asterisk is rendered after the label text.
 */
export const Required: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2.5 w-64">
      <FieldLabel htmlFor="client" required {...args}>
        Client
      </FieldLabel>
      <Input id="client" placeholder="Select client…" />
    </div>
  ),
};

/**
 * With a helper hint icon — hover the (?) icon to see the tooltip.
 */
export const WithHint: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2.5 w-64">
      <FieldLabel
        htmlFor="win-prob"
        hint="Estimated likelihood of winning this deal based on current intel."
        {...args}
      >
        Win Probability
      </FieldLabel>
      <Input id="win-prob" placeholder="Select…" />
    </div>
  ),
};

/**
 * Required + hint combined — the most common form pattern.
 */
export const RequiredWithHint: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2.5 w-64">
      <FieldLabel
        htmlFor="start-date"
        required
        hint="The date the project is expected to kick off."
        {...args}
      >
        Start Date
      </FieldLabel>
      <Input id="start-date" placeholder="MM/DD/YYYY" />
    </div>
  ),
};

/**
 * Visual audit — all variants stacked.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="f1">Plain label</FieldLabel>
        <Input id="f1" placeholder="Value…" />
      </div>
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="f2" required>
          Required field
        </FieldLabel>
        <Input id="f2" placeholder="Value…" />
      </div>
      <div className="flex flex-col gap-2.5">
        <FieldLabel
          htmlFor="f3"
          hint="Some helpful information about this field."
        >
          With hint icon
        </FieldLabel>
        <Input id="f3" placeholder="Value…" />
      </div>
      <div className="flex flex-col gap-2.5">
        <FieldLabel
          htmlFor="f4"
          required
          hint="Some helpful information about this field."
        >
          Required + hint
        </FieldLabel>
        <Input id="f4" placeholder="Value…" />
      </div>
    </div>
  ),
};
