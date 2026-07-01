import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { MainNavLogo } from "./main-nav-logo";

const meta: Meta<typeof MainNavLogo> = {
  title: "UI/MainNavLogo",
  component: MainNavLogo,
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
};

export default meta;

type Story = StoryObj<typeof MainNavLogo>;

/**
 * The default Allox logo with icon and text.
 */
export const Default: Story = {};

/**
 * Logo on dark background to test contrast.
 */
export const OnDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-sidebar p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};
