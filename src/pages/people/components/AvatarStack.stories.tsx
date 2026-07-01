import type { Meta, StoryObj } from '@storybook/react'
import { AvatarStack } from '../../PeoplePage'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Person } from '@/mocks/people'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePerson(id: number, name: string, jobTitle: string): Person {
  return {
    id: `person-${id}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    jobTitle,
    team: 'Engineering',
    division: 'Delivery',
    location: 'London, UK',
    employmentType: 'FTE',
    startDate: '2023-01-01',
    allocations: [],
    summary: '',
    badges: [],
    skills: [],
    growthGoals: [],
    hobbies: [],
  }
}

const threePeople: Person[] = [
  makePerson(6,  'Madelyn Lipshutz', 'Senior Software Engineer'),
  makePerson(7,  'Charlie George',   'Senior Software Engineer'),
  makePerson(9,  'Lucas Reed',       'Software Engineer'),
]

const manyPeople: Person[] = [
  makePerson(6,  'Madelyn Lipshutz',  'Senior Software Engineer'),
  makePerson(7,  'Charlie George',    'Senior Software Engineer'),
  makePerson(9,  'Lucas Reed',        'Software Engineer'),
  makePerson(10, 'Olivia Brooks',     'Software Engineer'),
  makePerson(11, 'Noah Turner',       'Staff Software Engineer'),
  makePerson(13, 'Ethan Lee',         'Senior Software Engineer'),
  makePerson(15, 'Mason Brown',       'Staff Software Engineer'),
  makePerson(16, 'Isabella Johnson',  'Software Engineer'),
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AvatarStack> = {
  title: 'People/AvatarStack',
  component: AvatarStack,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="bg-background p-4 rounded-lg border border-border">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AvatarStack>

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { people: threePeople },
}

export const Single: Story = {
  args: { people: [threePeople[0]] },
}

/**
 * Eight people — exceeds the default maxVisible=6 cap.
 * Hover each avatar to see the individual name tooltip.
 */
export const Many: Story = {
  args: { people: manyPeople },
}
