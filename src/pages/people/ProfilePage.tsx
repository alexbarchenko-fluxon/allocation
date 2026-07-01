import { useState, useMemo, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mail, BriefcaseBusiness, Dribbble, MapPin, Calendar, User, Users, TreePalm, ArrowLeft,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AccordionBody, AccordionChevron } from '@/components/ui/side-panel-section'
import { ProfileField, AvatarStack, AllocGroupBlock, SummaryRenderer, type AllocGroup } from '@/pages/PeoplePage'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MOCK_PEOPLE, PERSON_MAP, MANAGER_MAP, DIRECT_REPORTS_MAP } from '@/mocks/people'
import { ALLOCS_BY_PERSON, type Allocation } from '@/mocks/allocations'
import { PROJECT_MAP } from '@/mocks/projects'
import { cn } from '@/lib/utils'
import LinkedInLogo from '@/assets/logos/logo-linkedin.svg?react'
import SlackLogo    from '@/assets/logos/logo-slack.svg?react'
import imgBadgeMilestones5        from '@/assets/badges/meta-badge-provider-milestones-5.png'
import imgBadgeWorkedOnProjects10 from '@/assets/badges/allox-badge-provider-worked-on-projects-10.png'
import imgBadgeYearsInCompany10   from '@/assets/badges/allox-badge-provider-years-in-company-10.png'
import imgBadgeInterview25        from '@/assets/badges/interview-25.png'
import imgBadgeQaOfficeHours      from '@/assets/badges/qa-office-hours-attendee.png'
import imgBadgeSlack20            from '@/assets/badges/slack-20.png'
import imgBadgeFirstnameMatch     from '@/assets/badges/user-factoid-badge-firstname-match.png'
import imgBadgeRighthand          from '@/assets/badges/user-factoid-badge-righthand.png'
import imgBadgeScrabblePro        from '@/assets/badges/user-factoid-badge-scrabble-pro.png'
import imgBadgeUniqueFirstname    from '@/assets/badges/user-factoid-badge-unique-firstname.png'

const BADGE_IMAGES: Record<string, string> = {
  'meta-badge-provider-milestones-5':        imgBadgeMilestones5,
  'allox-badge-provider-worked-on-projects-10': imgBadgeWorkedOnProjects10,
  'allox-badge-provider-years-in-company-10':   imgBadgeYearsInCompany10,
  'interview-25':                            imgBadgeInterview25,
  'qa-office-hours-attendee':                imgBadgeQaOfficeHours,
  'slack-20':                                imgBadgeSlack20,
  'user-factoid-badge-firstname-match':      imgBadgeFirstnameMatch,
  'user-factoid-badge-righthand':            imgBadgeRighthand,
  'user-factoid-badge-scrabble-pro':         imgBadgeScrabblePro,
  'user-factoid-badge-unique-firstname':     imgBadgeUniqueFirstname,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emailFromName(name: string): string {
  const parts = name.toLowerCase().replace(/[^a-z ]/g, '').split(' ')
  return `${parts[0]}.${parts[parts.length - 1]}@fluxon.com`
}

function holidaysLabel(location: string): string {
  if (location.includes('UK') || location.includes('London') || location.includes('Dublin'))
    return 'British 🇬🇧'
  if (location.includes('USA') || location.includes('New York'))
    return 'American 🇺🇸'
  if (location.includes('PL') || location.includes('Warsaw'))
    return 'Polish 🇵🇱'
  if (location.includes('DE') || location.includes('Berlin'))
    return 'German 🇩🇪'
  if (location.includes('NL') || location.includes('Amsterdam'))
    return 'Dutch 🇳🇱'
  if (location.includes('IE'))
    return 'Irish 🇮🇪'
  return '—'
}

function fmtStartDate(s: string): string {
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildAllocGroups(allocs: Allocation[]): AllocGroup[] {
  const map = new Map<string, AllocGroup>()
  for (const a of allocs) {
    if (!map.has(a.projectId)) {
      map.set(a.projectId, {
        projectId:   a.projectId,
        projectName: PROJECT_MAP.get(a.projectId)?.name ?? a.projectId,
        rows:        [],
      })
    }
    map.get(a.projectId)!.rows.push({
      id:           a.id,
      startDate:    a.startDate,
      endDate:      a.endDate,
      hoursPerWeek: a.hoursPerWeek,
      nonBillable:  a.nonBillable ?? false,
    })
  }
  return [...map.values()]
}

// ── Primitives ────────────────────────────────────────────────────────────────

/** Rounded card container used for every section on the profile page. */
function ProfileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-background border border-border rounded-lg overflow-hidden', className)}>
      {children}
    </div>
  )
}

/**
 * Collapsible section header + animated body, designed to sit inside a
 * ProfileCard. Unlike SidePanelSection there is no border-top — the card
 * border provides the visual separation.
 */
function ProfileCardSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 h-[52px]"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium text-foreground leading-none">{title}</span>
        <AccordionChevron open={open} />
      </button>

      {children && (
        <AccordionBody open={open}>
          <div className="px-5 pb-5">{children}</div>
        </AccordionBody>
      )}
    </div>
  )
}

// ── Calendar placeholder ──────────────────────────────────────────────────────

function CalendarPlaceholder() {
  return (
    <div className="flex">
      {/* Mini calendar side */}
      <div className="border-r border-border p-5 flex flex-col gap-4 min-w-[240px]">
        <div className="flex items-center justify-between h-8">
          <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground">January 2026</span>
          <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="h-7 flex items-center justify-center text-xs text-muted-foreground font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0">
          {[
            { n: 30, prev: true }, { n: 31, prev: true },
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            { n: 10, today: true },
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
            { n: 1, next: true }, { n: 2, next: true }, { n: 3, next: true },
          ].map((day, i) => {
            const num = typeof day === 'object' ? day.n : day
            const isToday = typeof day === 'object' && (day as { today?: boolean }).today
            const isMuted = typeof day === 'object' && ((day as { prev?: boolean }).prev || (day as { next?: boolean }).next)
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  'h-7 w-full flex items-center justify-center text-xs rounded-md transition-colors',
                  isToday
                    ? 'bg-primary text-primary-foreground font-medium'
                    : isMuted
                    ? 'text-muted-foreground opacity-40'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {num}
              </button>
            )
          })}
        </div>
      </div>

      {/* Holidays list side */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        <p className="text-sm font-medium text-foreground leading-5">Holidays in January 2026</p>
        <div className="flex flex-col gap-4">
          {[
            { date: 'Jan 01', name: "New Year's Day",     flag: '🇮🇳' },
            { date: 'Jan 14', name: 'Makara Sankranti',   flag: '🇮🇳' },
            { date: 'Jan 15 – Jan 21', name: 'Time off',  icon: '🌴' },
          ].map((h) => (
            <div key={h.name} className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center text-sm flex-shrink-0">
                {h.flag ?? h.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground leading-none">{h.date}</span>
                <span className="text-sm text-foreground leading-5">{h.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { personId } = useParams<{ personId: string }>()
  const navigate = useNavigate()
  const person = MOCK_PEOPLE.find(p => p.id === personId) ?? MOCK_PEOPLE[0]

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const { manager, directReports, currentGroups, pastGroups, capacity } = useMemo(() => {
    if (!person) return { manager: null, directReports: [], currentGroups: [], pastGroups: [], capacity: 40 }

    const cap    = person.employmentType === 'PT' ? 20 : 40
    const allocs = (ALLOCS_BY_PERSON.get(person.id) ?? []).filter((a) => a.type === 'project')
    const current = allocs.filter((a) => new Date(a.endDate + 'T00:00:00') >= today)
    const past    = allocs.filter((a) => new Date(a.endDate + 'T00:00:00') <  today)

    const managerId = person.team !== 'Exec' ? MANAGER_MAP[person.id] : undefined
    const mgr       = managerId ? (PERSON_MAP.get(managerId) ?? null) : null

    const reportIds = DIRECT_REPORTS_MAP.get(person.id) ?? []
    const reports   = reportIds.map((id) => PERSON_MAP.get(id)).filter(Boolean) as typeof MOCK_PEOPLE

    return {
      manager:       mgr,
      directReports: reports,
      currentGroups: buildAllocGroups(current),
      pastGroups:    buildAllocGroups(past),
      capacity:      cap,
    }
  }, [person, today])

  if (!person) return null

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-full overflow-y-auto bg-sidebar">
        <div className="pt-[60px] px-4 pb-10">
          <div className="mx-auto max-w-[1024px]">

            {/* ── Back button ──────────────────────────────────────────────── */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              People
            </button>

            <div className="grid grid-cols-2 gap-6">

              {/* ── Left column ─────────────────────────────────────────── */}
              <div className="flex flex-col gap-6">

                {/* Profile card */}
                <ProfileCard>
                  <div className="p-5 flex flex-col gap-4">

                    {/* Hero: avatar + name + title + social */}
                    <div className="flex items-start gap-4">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="h-14 w-14 rounded-full bg-muted object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-lg font-medium text-foreground leading-none mb-1">
                          {person.name}
                        </p>
                        <p className="text-sm text-muted-foreground leading-5">
                          {person.jobTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-1">
                        <button
                          type="button"
                          aria-label="LinkedIn"
                          className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background shadow-xs hover:bg-accent transition-colors"
                        >
                          <LinkedInLogo className="block shrink-0 h-9 w-9" />
                        </button>
                        <button
                          type="button"
                          aria-label="Slack"
                          className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background shadow-xs hover:bg-accent transition-colors"
                        >
                          <SlackLogo className="block shrink-0 h-9 w-9" />
                        </button>
                      </div>
                    </div>

                    {/* Profile fields */}
                    <div className="flex flex-col gap-1">
                      <ProfileField
                        icon={Mail}
                        label="Mail"
                        value={
                          <a
                            href={`mailto:${emailFromName(person.name)}`}
                            className="text-sm font-medium text-primary leading-5 truncate hover:underline"
                          >
                            {emailFromName(person.name)}
                          </a>
                        }
                      />
                      <ProfileField
                        icon={Dribbble}
                        label="Team"
                        value={
                          <span className="text-sm font-medium text-foreground leading-5">
                            {person.team}
                          </span>
                        }
                      />
                      <ProfileField
                        icon={BriefcaseBusiness}
                        label="Status"
                        value={
                          <span className="text-sm font-medium text-foreground leading-5">
                            {person.employmentType === 'PT' ? 'Part Time' : 'Full Time'}
                          </span>
                        }
                      />
                      <ProfileField
                        icon={MapPin}
                        label="Location"
                        value={
                          <span className="text-sm font-medium text-foreground leading-5">
                            {person.location}
                          </span>
                        }
                      />
                      <ProfileField
                        icon={TreePalm}
                        label="Holidays"
                        value={
                          <span className="text-sm font-medium text-foreground leading-5">
                            {holidaysLabel(person.location)}
                          </span>
                        }
                      />
                      <ProfileField
                        icon={Calendar}
                        label="Start date"
                        value={
                          <span className="text-sm font-medium text-foreground leading-5">
                            {fmtStartDate(person.startDate)}
                          </span>
                        }
                      />
                      {manager && (
                        <ProfileField
                          icon={User}
                          label="Manager"
                          value={
                            <div className="flex items-center gap-1.5 min-w-0">
                              <img
                                src={manager.avatar}
                                alt={manager.name}
                                className="h-6 w-6 rounded-full shrink-0 bg-muted"
                              />
                              <span className="text-sm font-medium text-foreground leading-5 truncate">
                                {manager.name}
                              </span>
                            </div>
                          }
                        />
                      )}
                      {directReports.length > 0 && (
                        <ProfileField
                          icon={Users}
                          label="Direct team"
                          value={<AvatarStack people={directReports} />}
                        />
                      )}
                    </div>
                  </div>
                </ProfileCard>

                {/* Summary card */}
                <ProfileCard>
                  <ProfileCardSection title="Summary" defaultOpen>
                    <SummaryRenderer text={person.summary} />
                  </ProfileCardSection>
                </ProfileCard>

              </div>

              {/* ── Right column ────────────────────────────────────────── */}
              <div className="flex flex-col gap-6">

                {/* Calendar + Holidays — placeholder */}
                <ProfileCard>
                  <CalendarPlaceholder />
                </ProfileCard>

                {/* Currently working on */}
                <ProfileCard>
                  <ProfileCardSection title="Currently working on" defaultOpen>
                    {currentGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No active allocations</p>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {currentGroups.map((group) => (
                          <AllocGroupBlock key={group.projectId} group={group} capacity={capacity} />
                        ))}
                      </div>
                    )}
                  </ProfileCardSection>
                </ProfileCard>

                {/* Past allocations */}
                <ProfileCard>
                  <ProfileCardSection title={`Past allocations (${pastGroups.length})`} defaultOpen={false}>
                    {pastGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No past allocations</p>
                    ) : (
                      <div className="flex flex-col">
                        {pastGroups.map((group, i) => (
                          <Fragment key={group.projectId}>
                            {i > 0 && <div className="h-px bg-border my-4" />}
                            <AllocGroupBlock group={group} capacity={capacity} />
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </ProfileCardSection>
                </ProfileCard>

                {/* Badges */}
                <ProfileCard>
                  <ProfileCardSection title="Badges" defaultOpen>
                    <div className="flex flex-wrap gap-4">
                      {person.badges.map((badgeId) => {
                        const src = BADGE_IMAGES[badgeId]
                        return src ? (
                          <img key={badgeId} src={src} alt={badgeId} className="size-12 object-cover" />
                        ) : null
                      })}
                    </div>
                  </ProfileCardSection>
                </ProfileCard>

                {/* Interests and Hobbies */}
                <ProfileCard>
                  <ProfileCardSection title="Interests and Hobbies" defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {person.hobbies.map((h) => (
                        <Badge key={h} variant="outline" className="px-3 py-1.5 text-xs font-medium">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  </ProfileCardSection>
                </ProfileCard>

                {/* Growth Goals */}
                <ProfileCard>
                  <ProfileCardSection title="Growth Goals" defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {person.growthGoals.map((g) => (
                        <Badge key={g} variant="outline" className="px-3 py-1.5 text-xs font-medium">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </ProfileCardSection>
                </ProfileCard>

                {/* Skills */}
                <ProfileCard>
                  <ProfileCardSection title="Skills" defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {person.skills.map((s) => (
                        <Badge key={s} variant="outline" className="px-3 py-1.5 text-xs font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </ProfileCardSection>
                </ProfileCard>

              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
