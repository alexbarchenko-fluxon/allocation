import type { Meta, StoryObj } from '@storybook/react'
import { PersonDetailsSidePanel } from '../../PeoplePage'
import { MOCK_PEOPLE } from '@/mocks/people'

// ── Fixtures — real people so the component can resolve manager / direct reports ──

const engineerPerson = MOCK_PEOPLE.find(p => p.id === 'person-6')!  // Madelyn Lipshutz
const managerPerson  = MOCK_PEOPLE.find(p => p.id === 'person-21')! // Oliver White (Eng Manager)
const execPerson     = MOCK_PEOPLE.find(p => p.id === 'person-1')!  // James Foster (Exec — no manager field)
const ptPerson       = MOCK_PEOPLE.find(p => p.id === 'person-8')!  // Justin Stanton (PT, 20h capacity)

// ── Wrapper ───────────────────────────────────────────────────────────────────

function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[700px] flex" style={{ width: 450 }}>
      {children}
    </div>
  )
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof PersonDetailsSidePanel> = {
  title: 'People/PersonDetailsSidePanel',
  component: PersonDetailsSidePanel,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <PanelWrapper>
        <Story />
      </PanelWrapper>
    ),
  ],
  argTypes: {
    onClose: { action: 'close' },
    isOpen:  { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof PersonDetailsSidePanel>

// ── Stories ───────────────────────────────────────────────────────────────────

/**
 * Engineer with a manager — the most common panel state.
 * All profile fields, current allocations, and past allocations are populated.
 */
export const WithEngineer: Story = {
  args: {
    person: engineerPerson,
    isOpen: true,
  },
}

/**
 * Engineering Manager — the "Direct team" field is populated with an AvatarStack.
 */
export const WithDirectReports: Story = {
  args: {
    person: managerPerson,
    isOpen: true,
  },
}

/**
 * Exec-level person — the Manager field is hidden for Exec team members.
 */
export const ExecPerson: Story = {
  args: {
    person: execPerson,
    isOpen: true,
  },
}

/**
 * Part-time person — allocation hours show as X/20h instead of X/40h.
 */
export const PartTimePerson: Story = {
  args: {
    person: ptPerson,
    isOpen: true,
  },
}

/**
 * Panel in closed state — width is 0 (slide-out animation end state).
 */
export const Closed: Story = {
  args: {
    person: engineerPerson,
    isOpen: false,
  },
}

/**
 * All key panel variants side by side for design review.
 */
export const AllVariantsSideBySide: Story = {
  render: () => (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">Engineer</p>
        <div className="h-[700px]" style={{ width: 450 }}>
          <PersonDetailsSidePanel person={engineerPerson} isOpen onClose={() => {}} />
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">Manager (direct reports)</p>
        <div className="h-[700px]" style={{ width: 450 }}>
          <PersonDetailsSidePanel person={managerPerson} isOpen onClose={() => {}} />
        </div>
      </div>
      <div className="flex flex-col gap-2 items-center">
        <p className="text-xs font-medium text-muted-foreground">Part-time (20h)</p>
        <div className="h-[700px]" style={{ width: 450 }}>
          <PersonDetailsSidePanel person={ptPerson} isOpen onClose={() => {}} />
        </div>
      </div>
    </div>
  ),
  parameters: { layout: 'padded' },
  decorators: [],
}
