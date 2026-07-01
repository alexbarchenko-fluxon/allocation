import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./date-picker";

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: false },
    onChange: { action: "changed" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    placeholder: { control: "text" },
    displayFormat: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/**
 * Empty state — no date selected. Click to open the calendar popover.
 */
export const Default: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return <DatePicker {...args} value={date} onChange={setDate} />;
  },
};

/**
 * Pre-populated with a selected date.
 */
export const WithValue: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 15));
    return <DatePicker {...args} value={date} onChange={setDate} />;
  },
};

/**
 * Disabled — the trigger button is non-interactive.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: new Date(2026, 5, 15),
  },
};

/**
 * Error state — border turns destructive red to signal a validation issue.
 */
export const WithError: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return <DatePicker {...args} value={date} onChange={setDate} error />;
  },
};

/**
 * Min / max date constraints — dates outside the window are greyed out and
 * unselectable. Window is set to the current month ± 30 days.
 */
export const WithDateConstraints: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 30);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    return (
      <DatePicker
        {...args}
        value={date}
        onChange={setDate}
        minDate={minDate}
        maxDate={maxDate}
      />
    );
  },
};

/**
 * Custom display format — renders the selected date as "MMM d, yyyy"
 * (e.g. "Jun 15, 2026") instead of the default "MM/dd/yyyy".
 */
export const CustomDisplayFormat: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 15));
    return (
      <DatePicker
        {...args}
        value={date}
        onChange={setDate}
        displayFormat="MMM d, yyyy"
        placeholder="MMM D, YYYY"
      />
    );
  },
};

/**
 * All variants stacked side by side for a quick visual review.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[220px]">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Empty</p>
        <DatePicker />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">With value</p>
        <DatePicker value={new Date(2026, 5, 15)} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Error</p>
        <DatePicker error />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Disabled</p>
        <DatePicker disabled value={new Date(2026, 5, 15)} />
      </div>
    </div>
  ),
};
