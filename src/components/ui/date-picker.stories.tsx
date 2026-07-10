import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./date-picker";

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

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Data fields — editable from the Controls panel.
    value: { control: "date", description: "Selected date" },
    minDate: { control: "date", description: "Earliest selectable date" },
    maxDate: { control: "date", description: "Latest selectable date" },
    onChange: { action: "changed" },
    // Presentation / behaviour.
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    placeholder: { control: "text" },
    displayFormat: { control: "text" },
    side: { control: "inline-radio", options: ["top", "bottom", "left", "right"] },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

type DatePickerArgs = Parameters<typeof DatePicker>[0];

/**
 * Interactive render: seeds local state from the `value` control so clicking a
 * day updates the picker and fires the action. Editing `value` in the Controls
 * panel re-seeds it via a `key` on this component (see the render functions).
 */
function InteractiveDatePicker(args: DatePickerArgs) {
  const [date, setDate] = useState<Date | undefined>(toDate(args.value));
  return (
    <DatePicker
      {...args}
      value={date}
      minDate={toDate(args.minDate)}
      maxDate={toDate(args.maxDate)}
      onChange={(d) => {
        setDate(d);
        args.onChange?.(d);
      }}
    />
  );
}

/**
 * Empty state — no date selected. Click to open the calendar popover, or set a
 * date from the `value` control.
 */
export const Default: Story = {
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
};

/**
 * Pre-populated with a selected date. Edit `value` in Controls to change it.
 */
export const WithValue: Story = {
  args: {
    value: new Date(2026, 5, 15),
  },
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
};

/**
 * Disabled — the trigger button is non-interactive.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: new Date(2026, 5, 15),
  },
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
};

/**
 * Error state — border turns destructive red to signal a validation issue.
 */
export const WithError: Story = {
  args: {
    error: true,
  },
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
};

/**
 * Min / max date constraints — dates outside the window are greyed out and
 * unselectable. Edit `minDate` / `maxDate` in Controls to move the window.
 */
export const WithDateConstraints: Story = {
  args: {
    minDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    })(),
    maxDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })(),
  },
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
};

/**
 * Custom display format — renders the selected date as "MMM d, yyyy"
 * (e.g. "Jun 15, 2026") instead of the default "MM/dd/yyyy".
 */
export const CustomDisplayFormat: Story = {
  args: {
    value: new Date(2026, 5, 15),
    displayFormat: "MMM d, yyyy",
    placeholder: "MMM D, YYYY",
  },
  render: (args) => <InteractiveDatePicker key={String(args.value)} {...args} />,
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
