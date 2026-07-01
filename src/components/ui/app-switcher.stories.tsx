import type { Meta, StoryObj } from "@storybook/react";
import { AppSwitcher } from "./app-switcher";

const meta: Meta<typeof AppSwitcher> = {
  title: "UI/AppSwitcher",
  component: AppSwitcher,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof AppSwitcher>;

/**
 * The app switcher button that opens a popover with available apps.
 * Click the button to see the dropdown with Lux, Fox, and Spark apps.
 */
export const Default: Story = {};

/**
 * App switcher on a sidebar background.
 */
export const OnSidebarBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-sidebar p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};
