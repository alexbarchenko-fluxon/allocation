import type { Meta, StoryObj } from '@storybook/react'
import { PeopleListItem } from '../../PeoplePage'
import type { Person } from '@/mocks/people'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockPerson: Person = {
  id: 'person-24',
  name: 'Ryan Chen',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan%20Chen',
  jobTitle: 'Senior Product Designer',
  team: 'Design',
  division: 'Delivery',
  location: 'London, UK',
  employmentType: 'FTE',
  startDate: '2023-04-15',
  allocations: [],
  summary: '',
  badges: [],
  skills: [],
  growthGoals: [],
  hobbies: [],
}

const mockPersonPT: Person = {
  id: 'person-8',
  name: 'Justin Stanton',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Justin%20Stanton',
  jobTitle: 'Senior Software Engineer',
  team: 'Engineering',
  division: 'Delivery',
  location: 'New York, USA',
  employmentType: 'PT',
  startDate: '2022-09-01',
  allocations: [],
  summary: '',
  badges: [],
  skills: [],
  growthGoals: [],
  hobbies: [],
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

function ListWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[320px] border border-border rounded-lg overflow-hidden bg-background">
      {children}
    </div>
  )
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof PeopleListItem> = {
  title: 'People/PeopleListItem',
  component: PeopleListItem,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ListWrapper>
        <Story />
      </ListWrapper>
    ),
  ],
  argTypes: {
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof PeopleListItem>

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    person: mockPerson,
    isSelected: false,
  },
}

export const Selected: Story = {
  args: {
    person: mockPerson,
    isSelected: true,
  },
}

/**
 * Part-time employee — shows the "PT" badge inline next to the name.
 */
export const PartTime: Story = {
  args: {
    person: mockPersonPT,
    isSelected: false,
  },
}

/**
 * All visible states side by side for design review:
 * default, selected, and part-time.
 */
export const AllStates: Story = {
  render: () => (
    <ListWrapper>
      <PeopleListItem person={mockPerson} />
      <PeopleListItem person={mockPerson} isSelected />
      <PeopleListItem person={mockPersonPT} />
    </ListWrapper>
  ),
  decorators: [],
}
