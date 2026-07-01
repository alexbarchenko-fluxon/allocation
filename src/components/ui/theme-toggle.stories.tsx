import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./theme-toggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "UI/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

/**
 * The theme toggle button that switches between light and dark modes.
 */
export const Default: Story = {};

/**
 * Theme toggle on a sidebar background.
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
