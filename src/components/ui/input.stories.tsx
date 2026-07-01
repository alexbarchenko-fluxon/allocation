import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    type: "text",
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

/**
 * A basic text input.
 */
export const Default: Story = {
  render: (args) => <Input {...args} placeholder="Enter text..." />,
};

/**
 * Visual coverage of various input states.
 */
export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div>
        <Label htmlFor="default">Default</Label>
        <Input id="default" placeholder="Type something..." />
      </div>
      
      <div>
        <Label htmlFor="with-value">With Value</Label>
        <Input id="with-value" defaultValue="Hello World" />
      </div>
      
      <div>
        <Label htmlFor="disabled">Disabled</Label>
        <Input id="disabled" placeholder="Disabled input" disabled />
      </div>
      
      <div>
        <Label htmlFor="email">Email Type</Label>
        <Input id="email" type="email" placeholder="name@example.com" />
      </div>
      
      <div>
        <Label htmlFor="password">Password Type</Label>
        <Input id="password" type="password" placeholder="Enter password" />
      </div>
      
      <div>
        <Label htmlFor="file">File Type</Label>
        <Input id="file" type="file" />
      </div>
    </div>
  ),
};
