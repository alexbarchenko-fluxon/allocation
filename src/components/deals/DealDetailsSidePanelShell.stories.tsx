import type { Meta, StoryObj } from "@storybook/react";
import { DealDetailsSidePanelShell } from "./DealDetailsSidePanelShell";
import type { DealNote } from "@/components/ui/table-deals";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const sampleNotes: DealNote[] = [
  {
    id: "n1",
    author: "Skylar Dorwart",
    date: "Jan 15, 2026",
    content:
      "Had a call with the client — they're leaning toward a fixed-price contract. Need to clarify scope before L2.",
  },
  {
    id: "n2",
    author: "Makenna Canter",
    date: "Jan 20, 2026",
    content:
      "Updated win probability to Medium based on competitive landscape review.",
    isNew: true,
  },
];

const sampleRoles = [
  { role: "PM", count: 40 },
  { role: "Eng", count: 120 },
  { role: "UX", count: 40 },
];

/** Wraps the panel in a fixed-height container that mimics the real layout. */
function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[700px] w-[380px] flex">
      {children}
    </div>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DealDetailsSidePanelShell> = {
  title: "Deals/DealDetailsSidePanelShell",
  component: DealDetailsSidePanelShell,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PanelWrapper>
        <Story />
      </PanelWrapper>
    ),
  ],
  argTypes: {
    onClose: { action: "close" },
    onDealUpdate: { action: "dealUpdate" },
    stage: {
      control: { type: "select" },
      options: ["L1", "L2", "L3"],
    },
    outcome: {
      control: { type: "select" },
      options: [undefined, "Won", "Lost"],
    },
    role: {
      control: { type: "select" },
      options: ["editor", "readonly"],
    },
    isContentVisible: { control: "boolean" },
    isSwitching: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof DealDetailsSidePanelShell>;

// ─── Active deal stories ──────────────────────────────────────────────────────

/**
 * L1 deal with missing required fields.
 * The footer shows the count of fields needed before moving to L2 Scoping.
 * Deal info, Staffing, and Scope sections are all collapsed by default.
 */
export const L1MissingFields: Story = {
  args: {
    dealName: "Campus Planning 2026",
    client: "Google",
    stage: "L1",
    dealOwner: "Makenna Canter",
    dealContact: "sarah.chen@google.com",
    startDate: "Jan 2026",
    endDate: "Jun 2026",
    notesCount: 0,
    isContentVisible: true,
  },
};

/**
 * L1 deal with all required fields filled in.
 * Footer shows "Ready for L2" and the Move button is enabled.
 */
export const L1ReadyToAdvance: Story = {
  args: {
    dealName: "Analytics Dashboard Revamp",
    client: "Stripe",
    stage: "L1",
    dealOwner: "Skylar Dorwart",
    dealContact: "pm@stripe.com",
    dealType: "tm",
    startDate: "Feb 2026",
    endDate: "May 2026",
    probability: "High",
    roles: sampleRoles,
    strategicPriority: "p1",
    scopeOfWork: "Full redesign of the analytics suite with new chart library.",
    projectBrief:
      "Rebuild the analytics dashboard to improve data density and load time by 40%.",
    notesCount: 0,
    isContentVisible: true,
  },
};

/**
 * L2 deal — footer CTA changes to "Move to L3 Closing".
 */
export const L2Deal: Story = {
  args: {
    dealName: "Workspace Admin Revamp",
    client: "Notion",
    stage: "L2",
    dealOwner: "Brandon Aminoff",
    dealContact: "ops@notion.so",
    dealType: "fixed",
    startDate: "Mar 2026",
    endDate: "Aug 2026",
    probability: "Medium",
    roles: [
      { role: "PM", count: 1 },
      { role: "Eng", count: 4 },
      { role: "QA", count: 2 },
    ],
    strategicPriority: "p0",
    staffingPriority: "p0",
    notesCount: 0,
    isContentVisible: true,
  },
};

/**
 * Deal with notes — the Notes accordion is open by default when there are notes.
 * The new note (blue dot) appears first.
 */
export const WithNotes: Story = {
  args: {
    dealName: "Cloud Cost Optimization",
    client: "Amazon",
    stage: "L1",
    dealOwner: "Makenna Canter",
    dealContact: "finance@amazon.com",
    startDate: "Jan 2026",
    endDate: "Apr 2026",
    notesCount: 2,
    hasNewNotes: true,
    notes: sampleNotes,
    isContentVisible: true,
  },
};

// ─── Past deal stories ────────────────────────────────────────────────────────

/**
 * Past deal — Won outcome.
 * The header shows a green "Won" badge instead of a stage badge.
 * Deal info / Staffing / Scope sections and footer are hidden;
 * only Notes are shown.
 */
export const PastDealWon: Story = {
  args: {
    dealName: "Mobile Checkout Redesign",
    client: "Shopify",
    stage: "L3",
    outcome: "Won",
    dealOwner: "Skylar Dorwart",
    notesCount: 2,
    hasNewNotes: false,
    notes: [
      {
        id: "p1",
        author: "Skylar Dorwart",
        date: "Dec 10, 2025",
        content:
          "Contract signed. Kickoff scheduled for Jan 5. Assigned PM and two engineers.",
      },
      {
        id: "p2",
        author: "Makenna Canter",
        date: "Nov 28, 2025",
        content: "Client approved final scope. Moving to contract stage.",
      },
    ],
    isContentVisible: true,
  },
};

/**
 * Past deal — Lost outcome.
 * The header shows a red "Lost" badge.
 */
export const PastDealLost: Story = {
  args: {
    dealName: "Data Platform Migration",
    client: "Salesforce",
    stage: "L2",
    outcome: "Lost",
    dealOwner: "Brandon Aminoff",
    notesCount: 1,
    hasNewNotes: false,
    notes: [
      {
        id: "p3",
        author: "Brandon Aminoff",
        date: "Oct 15, 2025",
        content:
          "Client decided to go with an in-house team. Budget constraints were the primary factor.",
      },
    ],
    isContentVisible: true,
  },
};

/**
 * Past deal with no notes.
 */
export const PastDealNoNotes: Story = {
  args: {
    dealName: "Internal Tooling Sprint",
    client: "Figma",
    stage: "L1",
    outcome: "Won",
    dealOwner: "Makenna Canter",
    notesCount: 0,
    isContentVisible: true,
  },
};

// ─── Read-only stories ────────────────────────────────────────────────────────

/**
 * Read-only mode — full L2 deal with all sections populated.
 * All fields are displayed as static label/value rows; no form inputs or footer.
 */
export const ReadonlyFull: Story = {
  args: {
    dealName: "Campus Planning 2026",
    client: "Google",
    stage: "L2",
    role: "readonly",
    dealContact: "Zain Culhane",
    dealOwner: "Kenny Leung",
    division: "Enterprise",
    dealType: "tm",
    startDate: "Apr 2026",
    endDate: "Dec 2026",
    probability: "Medium",
    roles: [
      { role: "UX", count: 1 },
      { role: "QA", count: 1 },
      { role: "PM", count: 1 },
      { role: "Eng", count: 4 },
    ],
    strategicPriority: "p0",
    staffingPriority: "p1",
    scopeOfWork:
      "Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement.",
    projectBrief:
      "Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement.",
    notesCount: 3,
    hasNewNotes: false,
    notes: [
      {
        id: "r1",
        author: "Skylar Dorwart",
        date: "20.03.2026",
        content:
          "Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement wants Eng to be local and can come into office 5 days a week...",
      },
      {
        id: "r2",
        author: "Skylar Dorwart",
        date: "20.03.2026",
        content:
          "Need for a part-time infrastructure consultant (20 hours) 1-2 month engagement for pre-launch hardening\nFocus: Kubernetes review, load testing, observability setup",
      },
      {
        id: "r3",
        author: "Skylar Dorwart",
        date: "20.03.2026",
        content:
          "Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement wants Eng to be local and can come into office 5 days a week...",
      },
    ],
    isContentVisible: true,
  },
};

/**
 * Read-only mode — sparse deal with most optional fields empty.
 */
export const ReadonlySparse: Story = {
  args: {
    dealName: "Internal Tooling Sprint",
    client: "Figma",
    stage: "L1",
    role: "readonly",
    dealOwner: "Makenna Canter",
    notesCount: 0,
    isContentVisible: true,
  },
};

// ─── State / animation stories ────────────────────────────────────────────────

/**
 * Content hidden — simulates the panel mid-transition (before content fades in).
 */
export const ContentHidden: Story = {
  args: {
    dealName: "Campus Planning 2026",
    client: "Google",
    stage: "L1",
    dealOwner: "Makenna Canter",
    notesCount: 0,
    isContentVisible: false,
  },
};

/**
 * All variants side by side for a comprehensive design review.
 */
export const AllVariantsSideBySide: Story = {
  render: () => (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">L1 — Missing fields</p>
        <div className="h-[700px] w-[380px] flex">
          <DealDetailsSidePanelShell
            onClose={() => {}}
            dealName="Campus Planning 2026"
            client="Google"
            stage="L1"
            dealOwner="Makenna Canter"
            notesCount={0}
            isContentVisible
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">Past — Won</p>
        <div className="h-[700px] w-[380px] flex">
          <DealDetailsSidePanelShell
            onClose={() => {}}
            dealName="Mobile Checkout Redesign"
            client="Shopify"
            stage="L3"
            outcome="Won"
            dealOwner="Skylar Dorwart"
            notesCount={1}
            notes={[{ id: "x1", author: "Skylar Dorwart", date: "Dec 10, 2025", content: "Contract signed." }]}
            isContentVisible
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">Past — Lost</p>
        <div className="h-[700px] w-[380px] flex">
          <DealDetailsSidePanelShell
            onClose={() => {}}
            dealName="Data Platform Migration"
            client="Salesforce"
            stage="L2"
            outcome="Lost"
            dealOwner="Brandon Aminoff"
            notesCount={0}
            isContentVisible
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
  },
  decorators: [],
};
