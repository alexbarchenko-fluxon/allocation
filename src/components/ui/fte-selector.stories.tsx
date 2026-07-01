import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { HoursPerWeekInput } from "./fte-selector";
import { HOURS_STEP, HOURS_MAX } from "@/lib/staffingUnits";

const meta: Meta<typeof HoursPerWeekInput> = {
  title: "UI/HoursPerWeekInput",
  component: HoursPerWeekInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    role: { control: "text" },
    value: { control: { type: "number", min: 0, max: HOURS_MAX, step: HOURS_STEP } },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number", min: 1, max: 20, step: 1 } },
    disabled: { control: "boolean" },
    onChange: { action: "changed" },
  },
  args: {
    role: "Eng",
    value: 0,
    min: 0,
    max: HOURS_MAX,
    step: HOURS_STEP,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof HoursPerWeekInput>;

/**
 * Default tile — role set to 0 h/week.
 */
export const Default: Story = {};

/**
 * Interactive — wraps HoursPerWeekInput in local state so +/− buttons and
 * direct keyboard input both work in Storybook.
 */
export const Interactive: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(0);
    return <HoursPerWeekInput {...args} value={value} onChange={setValue} />;
  },
};

/**
 * Editable input — click the number to type a value directly.
 * Typed values are rounded to the nearest whole hour; +/− steps by 5.
 */
export const EditableInput: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(0);
    return (
      <div className="flex flex-col items-center gap-3">
        <HoursPerWeekInput {...args} value={value} onChange={setValue} />
        <p className="text-sm text-muted-foreground">
          Click the number to type. Press Enter or click away to confirm.
        </p>
      </div>
    );
  },
};

/**
 * With a non-zero starting value.
 */
export const WithValue: Story = {
  args: {
    role: "TL",
    value: 20,
  },
};

/**
 * Disabled state — all controls are non-interactive.
 */
export const Disabled: Story = {
  args: {
    role: "PM",
    value: 40,
    disabled: true,
  },
};

/**
 * All roles laid out in a row, matching the Staffing step grid.
 * All roles start at 0 h/week.
 */
export const StaffingRow: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [counts, setCounts] = useState<Record<string, number>>({
      TL: 0,
      Eng: 0,
      PM: 0,
      TPM: 0,
      UX: 0,
      QA: 0,
    });

    return (
      <div className="flex flex-wrap gap-3">
        {Object.entries(counts).map(([role, value]) => (
          <HoursPerWeekInput
            key={role}
            role={role}
            value={value}
            onChange={(v) => setCounts((prev) => ({ ...prev, [role]: v }))}
          />
        ))}
      </div>
    );
  },
};
