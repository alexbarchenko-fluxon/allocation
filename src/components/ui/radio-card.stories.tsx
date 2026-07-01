import type { Meta, StoryObj } from "@storybook/react";
import { RadioCardGroup, RadioCardItem } from "./radio-card";

const meta: Meta<typeof RadioCardGroup> = {
  title: "UI/RadioCard",
  component: RadioCardGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof RadioCardGroup>;

/**
 * Deal Type selector — the three contract models used in Step 1.
 */
export const DealType: Story = {
  render: () => (
    <RadioCardGroup defaultValue="time-materials" className="max-w-lg">
      <RadioCardItem
        value="time-materials"
        label="Time & Materials"
        description="Billed on actual hours logged"
      />
      <RadioCardItem
        value="fixed-price"
        label="Fixed Price"
        description="Agreed scope at a fixed cost"
      />
      <RadioCardItem
        value="retainer"
        label="Retainer"
        description="Ongoing monthly engagement"
      />
    </RadioCardGroup>
  ),
};

/**
 * Win Probability selector — used in Step 1 alongside Deal Type.
 */
export const WinProbability: Story = {
  render: () => (
    <RadioCardGroup defaultValue="medium" className="max-w-lg">
      <RadioCardItem
        value="high"
        label="High"
        description="> 70% likelihood"
      />
      <RadioCardItem
        value="medium"
        label="Medium"
        description="40 – 70% likelihood"
      />
      <RadioCardItem
        value="low"
        label="Low"
        description="< 40% likelihood"
      />
    </RadioCardGroup>
  ),
};

/**
 * Unselected — no default value, all cards inactive.
 */
export const Unselected: Story = {
  render: () => (
    <RadioCardGroup className="max-w-lg">
      <RadioCardItem value="option-a" label="Option A" />
      <RadioCardItem value="option-b" label="Option B" />
      <RadioCardItem value="option-c" label="Option C" />
    </RadioCardGroup>
  ),
};

/**
 * With a disabled option.
 */
export const WithDisabled: Story = {
  render: () => (
    <RadioCardGroup defaultValue="option-a" className="max-w-lg">
      <RadioCardItem value="option-a" label="Available" />
      <RadioCardItem
        value="option-b"
        label="Unavailable"
        description="Coming soon"
        disabled
      />
      <RadioCardItem value="option-c" label="Also available" />
    </RadioCardGroup>
  ),
};

/**
 * Without description — compact single-line cards.
 */
export const CompactCards: Story = {
  render: () => (
    <RadioCardGroup defaultValue="p0" className="max-w-xs">
      <RadioCardItem value="p0" label="P0 — Critical" />
      <RadioCardItem value="p1" label="P1 — High" />
      <RadioCardItem value="p2" label="P2 — Medium" />
    </RadioCardGroup>
  ),
};

/**
 * Compact variant — Win probability selector used in the Deal details sidebar.
 * Radio circle sits on top, label text-xs below. 4-column grid layout.
 * Figma: 571:17858 (Win probability RadioGroup)
 */
export const CompactWinProbability: Story = {
  render: () => (
    <RadioCardGroup defaultValue="medium" className="grid grid-cols-4 gap-2 w-64">
      <RadioCardItem compact value="unsure" label="Unsure" />
      <RadioCardItem compact value="low" label="Low" />
      <RadioCardItem compact value="medium" label="Medium" />
      <RadioCardItem compact value="high" label="High" />
    </RadioCardGroup>
  ),
};

/**
 * Compact variant — Deal type selector used in the Deal details sidebar.
 * 3-column grid with radio on top, label below.
 * Figma: 571:17826 (Deal type RadioGroup)
 */
export const CompactDealType: Story = {
  render: () => (
    <RadioCardGroup className="grid grid-cols-3 gap-2 w-64">
      <RadioCardItem compact value="unsure" label="Unsure" />
      <RadioCardItem compact value="tm" label="T&M" />
      <RadioCardItem compact value="fixed" label="Fixed" />
    </RadioCardGroup>
  ),
};
