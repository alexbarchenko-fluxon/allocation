import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Calendar } from "./calendar";

/** Storybook's `date` control hands back a timestamp (number); normalise to Date. */
function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Story-only args. Calendar's own props are a mode-discriminated union, so we
 * expose just the data fields the Controls panel should drive. */
interface CalendarStoryArgs {
  selected?: Date | number;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
}

const meta: Meta<CalendarStoryArgs> = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Data fields — editable from the Controls panel.
    selected: { control: "date", description: "Selected date" },
    numberOfMonths: { control: { type: "number", min: 1, max: 3 }, description: "Months shown at once" },
    showOutsideDays: { control: "boolean", description: "Show days from adjacent months" },
  },
};

export default meta;
type Story = StoryObj<CalendarStoryArgs>;

/**
 * Interactive render: seeds local state from the `selected` control so clicking
 * a day updates the highlight. Editing `selected` in the Controls panel
 * re-seeds it via a `key` on this component (see the render functions).
 */
function InteractiveCalendar(args: CalendarStoryArgs) {
  const [date, setDate] = useState<Date | undefined>(toDate(args.selected));
  return (
    <Calendar
      mode="single"
      showOutsideDays={args.showOutsideDays}
      numberOfMonths={args.numberOfMonths}
      selected={date}
      onSelect={setDate}
      defaultMonth={date ?? new Date(2026, 5, 1)}
    />
  );
}

/**
 * Single-date calendar. Edit `selected` in the Controls panel to move the
 * highlighted day, or click a date directly.
 */
export const Default: Story = {
  args: {
    selected: new Date(2026, 5, 15),
    showOutsideDays: true,
    numberOfMonths: 1,
  },
  render: (args) => <InteractiveCalendar key={String(args.selected)} {...args} />,
};

/**
 * Two months side by side — set `numberOfMonths` to 2+ in Controls.
 */
export const MultipleMonths: Story = {
  args: {
    selected: new Date(2026, 5, 15),
    numberOfMonths: 2,
    showOutsideDays: true,
  },
  render: (args) => <InteractiveCalendar key={String(args.selected)} {...args} />,
};
