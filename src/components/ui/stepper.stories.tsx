import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./stepper";

const meta: Meta<typeof Stepper> = {
  title: "UI/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Step1Active: Story = {
  args: {
    steps: [
      { id: 1, label: "Deal info", state: "current" },
      { id: 2, label: "Staffing", state: "inactive" },
      { id: 3, label: "Scope", state: "inactive" },
    ],
  },
};

export const Step2Active: Story = {
  args: {
    steps: [
      { id: 1, label: "Deal info", state: "completed" },
      { id: 2, label: "Staffing", state: "current" },
      { id: 3, label: "Scope", state: "inactive" },
    ],
  },
};

export const Step3Active: Story = {
  args: {
    steps: [
      { id: 1, label: "Deal info", state: "completed" },
      { id: 2, label: "Staffing", state: "completed" },
      { id: 3, label: "Scope", state: "current" },
    ],
  },
};

export const AllCompleted: Story = {
  args: {
    steps: [
      { id: 1, label: "Deal info", state: "completed" },
      { id: 2, label: "Staffing", state: "completed" },
      { id: 3, label: "Scope", state: "completed" },
    ],
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ width: 560, display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Step 1 of 3</p>
        <Stepper
          steps={[
            { id: 1, label: "Deal info", state: "current" },
            { id: 2, label: "Staffing", state: "inactive" },
            { id: 3, label: "Scope", state: "inactive" },
          ]}
        />
      </div>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Step 2 of 3</p>
        <Stepper
          steps={[
            { id: 1, label: "Deal info", state: "completed" },
            { id: 2, label: "Staffing", state: "current" },
            { id: 3, label: "Scope", state: "inactive" },
          ]}
        />
      </div>
      <div>
        <p className="mb-3 text-xs text-muted-foreground">Step 3 of 3</p>
        <Stepper
          steps={[
            { id: 1, label: "Deal info", state: "completed" },
            { id: 2, label: "Staffing", state: "completed" },
            { id: 3, label: "Scope", state: "current" },
          ]}
        />
      </div>
    </div>
  ),
};
