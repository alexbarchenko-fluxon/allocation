import type { Meta, StoryObj } from "@storybook/react";
import { NewDealModalShell } from "./new-deal-modal-shell";

/**
 * Modal overlay wrapper — matches the Figma backdrop (dark overlay, centered).
 * min-h-screen ensures the overlay fills the Storybook canvas so the modal
 * appears centred even when the form content is taller than the viewport.
 */
function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black/40 p-8">
      {children}
    </div>
  );
}

const meta: Meta<typeof NewDealModalShell> = {
  title: "Deals/NewDealModalShell",
  component: NewDealModalShell,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    step: {
      control: { type: "select" },
      options: [1, 2, 3],
      description: "Which step of the wizard to display.",
    },
    onClose: { action: "close" },
    onBack: { action: "back" },
    onCancel: { action: "cancel" },
    onPrimary: { action: "primary" },
  },
  decorators: [
    (Story) => (
      <ModalOverlay>
        <Story />
      </ModalOverlay>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NewDealModalShell>;

/**
 * Interactive — use the "step" control in the Storybook panel to
 * switch between steps. All buttons log actions to the Actions tab.
 */
export const Interactive: Story = {
  args: {
    step: 1,
  },
};

/**
 * Step 1 — Deal Info
 * Client details, dates, deal type, and win probability.
 * Check: header+stepper no divider, 40px h-padding, 28px field gaps,
 * 3-col radio grids, footer ghost Cancel.
 */
export const Step1DealInfo: Story = {
  args: {
    step: 1,
  },
};

/**
 * Step 2 — Staffing
 * FTE role tiles, priorities (RadioCard P0/P1/P2), and project lead assignment.
 * Check: Back button appears on the left, same footer baseline.
 */
export const Step2Staffing: Story = {
  args: {
    step: 2,
  },
};

/**
 * Step 3 — Scope
 * Project contact, brief, and scope of work.
 * Check: footer shows "Create Deal" primary action, Back on left.
 */
export const Step3Scope: Story = {
  args: {
    step: 3,
  },
};

/**
 * All three steps rendered side by side for a full design review.
 * Verifies consistent padding, typography, and spacing rhythm across steps.
 */
export const AllStepsSideBySide: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-16 bg-black/40 px-8 py-16">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-white/60">Step 1 — Deal Info</p>
        <NewDealModalShell step={1} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-white/60">Step 2 — Staffing</p>
        <NewDealModalShell step={2} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-white/60">Step 3 — Scope</p>
        <NewDealModalShell step={3} />
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
  },
  decorators: [],
};

/**
 * Visual QA — spacing sanity check.
 * Renders Step 1 without the overlay so spacing, padding, and grid alignment
 * can be inspected directly against a white background.
 */
export const LayoutQA: Story = {
  args: {
    step: 1,
  },
  parameters: {
    layout: "centered",
    backgrounds: { default: "light" },
  },
  decorators: [],
};
