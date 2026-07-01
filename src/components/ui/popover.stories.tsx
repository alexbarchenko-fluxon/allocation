import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Popover>;

/**
 * A basic popover with text content.
 */
export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            This is a popover with some content inside.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * Popover aligned to the end of the trigger.
 */
export const AlignEnd: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Aligned to End</h4>
          <p className="text-sm text-muted-foreground">
            This popover is aligned to the end of the trigger button.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
