import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { MainNavButton } from "./main-nav-button";

const meta: Meta<typeof MainNavButton> = {
  title: "UI/MainNavButton",
  component: MainNavButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    label: {
      control: "text",
    },
    isActive: {
      control: "boolean",
    },
  },
  args: {
    label: "Menu Item",
    href: "#",
    isActive: false,
  },
};

export default meta;

type Story = StoryObj<typeof MainNavButton>;

/**
 * The default navigation button state.
 */
export const Default: Story = {};

/**
 * Navigation button in active state (current page).
 */
export const Active: Story = {
  args: {
    isActive: true,
  },
};

/**
 * Multiple navigation buttons showing different states.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex gap-1 bg-sidebar p-4 rounded-lg">
      <MainNavButton label="Dashboard" href="#" isActive={true} />
      <MainNavButton label="Deals" href="#" />
      <MainNavButton label="People" href="#" />
      <MainNavButton label="Accounts" href="#" />
      <MainNavButton label="Stats" href="#" />
    </div>
  ),
};
