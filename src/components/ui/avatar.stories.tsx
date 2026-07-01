import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

/**
 * Default avatar with an image.
 */
export const Default: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    alt: "John Doe",
  },
};

/**
 * Small size avatar.
 */
export const Small: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    alt: "John Doe",
    size: "sm",
  },
};

/**
 * Medium size avatar.
 */
export const Medium: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    alt: "John Doe",
    size: "md",
  },
};

/**
 * Large size avatar.
 */
export const Large: Story = {
  args: {
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    alt: "John Doe",
    size: "lg",
  },
};

/**
 * Avatar with fallback when image fails to load.
 */
export const WithFallback: Story = {
  args: {
    src: "https://invalid-url.com/image.jpg",
    alt: "John Doe",
    fallback: "JD",
  },
};

/**
 * Avatar without image showing initials.
 */
export const InitialsOnly: Story = {
  args: {
    alt: "John Doe",
  },
};
