import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

/**
 * A basic textarea.
 */
export const Default: Story = {
  render: (args) => <Textarea {...args} placeholder="Type your message here." />,
};

/**
 * Visual coverage of various textarea states.
 */
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="default">Default</Label>
        <Textarea id="default" placeholder="Enter your message..." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="with-value">With Value</Label>
        <Textarea 
          id="with-value" 
          defaultValue="This textarea already has some content in it."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="disabled">Disabled</Label>
        <Textarea 
          id="disabled" 
          placeholder="This textarea is disabled" 
          disabled 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="with-helper">With Helper Text</Label>
        <Textarea 
          id="with-helper" 
          placeholder="Tell us about yourself..."
        />
        <p className="text-xs text-muted-foreground">
          Your bio will be displayed on your public profile.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="custom-height">Custom Height</Label>
        <Textarea 
          id="custom-height" 
          placeholder="This textarea has custom min-height"
          className="min-h-[120px]"
        />
      </div>
    </div>
  ),
};
