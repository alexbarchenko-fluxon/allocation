import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Settings } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    asChild: { control: false }, // advanced pattern, not a "control" most designers need
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

/**
 * The baseline button (matches shadcn defaults, but styled by your Fluxon tokens).
 */
export const Default: Story = {};

/**
 * Quick visual coverage: variants.
 * Good for design review: “do all variants look right under current tokens?”
 */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

/**
 * Quick visual coverage: sizes.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="icon" aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Settings className="h-4 w-4" />
      Settings
    </Button>
  ),
};
