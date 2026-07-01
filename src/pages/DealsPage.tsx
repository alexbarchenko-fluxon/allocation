import { Search, Plus, Settings2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useState, useMemo, useCallback, useRef } from 'react'
import { MOCK_PEOPLE } from '@/mocks/people'
import { useRole } from '@/roles/role-context'
import { hasPermission } from '@/roles/permissions'
import { useScrollIndicator } from '@/hooks/useScrollIndicator'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { NewDealModal } from '@/components/deals/new-deal-modal'
import { type DealStep, type NewDealFormData } from '@/components/deals/new-deal-modal-shell'
import { type DealNote } from '@/components/ui/table-deals'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { type DealData, type AlertType } from '@/components/ui/table-deals'
import { MockDataController } from '@/components/ui/mock-data-controller'
import { ColumnSettings, type ColumnConfig } from '@/components/ui/column-settings'
import { DealSidePanel } from '@/components/DealSidePanel'
import { DealsTable, type DealsTableSection } from '@/components/deals/table/DealsTable'

type SortField = 'name' | 'client' | 'stage' | 'owner' | 'startDate' | 'endDate' | 'probability' | 'alerts' | 'notes' | 'closeDate' | 'outcome' | null
type SortDirection = 'asc' | 'desc' | null

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Deal name', visible: true },
  { id: 'client', label: 'Client', visible: true },
  { id: 'stage', label: 'Stage', visible: true },
  { id: 'owner', label: 'Deal owner', visible: true },
  { id: 'startDate', label: 'Start date', visible: true },
  { id: 'endDate', label: 'End date', visible: true },
  { id: 'probability', label: 'Probability', visible: true },
  { id: 'roles', label: 'Required roles', visible: true },
  { id: 'alerts', label: 'Alerts', visible: true },
  { id: 'notes', label: 'Notes', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
]

// ── Filter option sets ────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'pm',  label: 'PM'  },
  { value: 'eng', label: 'Eng' },
  { value: 'ux',  label: 'UX'  },
  { value: 'qa',  label: 'QA'  },
]

const STAGE_OPTIONS = [
  { value: 'l1', label: 'L1' },
  { value: 'l2', label: 'L2' },
  { value: 'l3', label: 'L3' },
]

const OUTCOME_OPTIONS = [
  { value: 'won',  label: 'Won'  },
  { value: 'lost', label: 'Lost' },
]

// Column config for the historical / past deals view
const PAST_DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name',      label: 'Deal name',    visible: true },
  { id: 'client',    label: 'Client',       visible: true },
  { id: 'outcome',   label: 'Outcome',      visible: true },
  { id: 'closeDate', label: 'Close date',   visible: true },
  { id: 'owner',     label: 'Deal owner',   visible: true },
  { id: 'roles',     label: 'Roles filled', visible: true },
  { id: 'notes',     label: 'Notes',        visible: true },
  { id: 'actions',   label: 'Actions',      visible: true },
]

// Sample deal templates
const dealTemplates = {
  names: [
    "Campus Planning 2026", "Workspace Admin Revamp", "Cloud Cost Optimization",
    "Fulfillment Ops Support", "Audit Workflow Tooling", "Internal Dev Platform",
    "Store Ops Platform", "Analytics Dashboard", "Mobile App Redesign",
    "Payment Gateway Integration", "Customer Portal Upgrade", "API Modernization",
    "Security Compliance Update", "Data Migration Project", "Performance Optimization",
    "E-commerce Platform", "CRM Integration", "DevOps Pipeline", "Mobile Banking App",
    "Inventory Management", "HR Portal Redesign", "Marketing Automation",
    "Supply Chain Dashboard", "Customer Support System", "Business Intelligence Tool"
  ],
  clients: ["Google", "Stripe", "Deloitte", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"],
  owners: (() => {
    const pick = (id: number) => {
      const p = MOCK_PEOPLE.find(p => p.id === `person-${id}`)!
      return { name: p.name, avatar: p.avatar }
    }
    return [
      pick(33), // Kaiya Vaccaro   — Senior PM
      pick(35), // Skylar Dorwart  — Director of Product
      pick(34), // Brandon Lee     — Lead PM
      pick(32), // Ahmad Saris     — Senior PM
      pick(24), // Ryan Chen       — Senior Product Designer
      pick(68), // Chance Siphron  — Legal Advisor
      pick(39), // Jordan Lewis    — Lead PM
      pick(38), // Taylor Quinn    — Senior PM
    ]
  })(),
  // Stage-weighted probability tables:
  //   L1 (Exploration) → mostly Low, some Medium, rare Unsure
  //   L2 (Scoping)     → mostly Medium, some Unsure, occasional Low/High
  //   L3 (Closing)     → mostly High, some Medium, rare Unsure
  probabilitiesByStage: {
    L1: ["Low", "Low", "Low", "Low", "Medium", "Medium", "Unsure"] as const,
    L2: ["Medium", "Medium", "Medium", "Medium", "Unsure", "Unsure", "Low", "High"] as const,
    L3: ["High", "High", "High", "High", "High", "Medium", "Unsure"] as const,
  },
  roleVariants: [
    [{ role: "PM" as const, count: 40 }, { role: "Eng" as const, count: 80 }],
    [{ role: "PM" as const, count: 40 }, { role: "Eng" as const, count: 120 }, { role: "QA" as const, count: 40 }],
    [{ role: "UX" as const, count: 80 }, { role: "Eng" as const, count: 120 }],
    [{ role: "PM" as const, count: 40 }, { role: "UX" as const, count: 40 }],
    [{ role: "Eng" as const, count: 160 }, { role: "UX" as const, count: 40 }],
    [{ role: "PM" as const, count: 40 }, { role: "Eng" as const, count: 80 }, { role: "UX" as const, count: 80 }, { role: "QA" as const, count: 40 }],
    [{ role: "Eng" as const, count: 200 }],
    [{ role: "UX" as const, count: 120 }, { role: "QA" as const, count: 80 }],
    [{ role: "PM" as const, count: 80 }, { role: "Eng" as const, count: 160 }],
    [{ role: "Eng" as const, count: 80 }, { role: "QA" as const, count: 40 }],
  ],
  alerts: [undefined, ["Data" as AlertType], ["Deadline" as AlertType], ["Data" as AlertType, "Deadline" as AlertType]] as const,
  dateRanges: [
    { start: "Jan 2026", end: "Mar 2026" },
    { start: "Feb 2026", end: "Apr 2026" },
    { start: "Jan 2026", end: "Jun 2026" },
    { start: "Mar 2026", end: "May 2026" },
    { start: "Feb 2026", end: "Jul 2026" },
    { start: "Apr 2026", end: "Jun 2026" },
    { start: "Jan 2026", end: "Apr 2026" },
    { start: "Mar 2026", end: "Aug 2026" },
    { start: "May 2026", end: "Jul 2026" },
    { start: "Feb 2026", end: "May 2026" },
  ],
}

// ── Additional mock-data pools ────────────────────────────────────────────────

/** Fake client contacts keyed by client name; undefined = not yet assigned. */
const CLIENT_CONTACTS: Record<string, Array<string | undefined>> = {
  Google:    ["omar.vaccaro@google.com", "sarah.kim@google.com", undefined, "lucas.park@google.com"],
  Stripe:    ["james.chen@stripe.com", undefined, "alex.nguyen@stripe.com", "mia.ross@stripe.com"],
  Deloitte:  ["ryan.miller@deloitte.com", "anna.smith@deloitte.com", undefined, "ben.hayes@deloitte.com"],
  Amazon:    ["jessica.lee@amazon.com", undefined, "michael.wang@amazon.com", "kate.ford@amazon.com"],
  Microsoft: ["david.park@microsoft.com", "emily.jones@microsoft.com", undefined, "tom.reed@microsoft.com"],
  Meta:      ["luke.torres@meta.com", undefined, "olivia.davis@meta.com", "ella.brooks@meta.com"],
  Apple:     ["noah.wilson@apple.com", "isabella.brown@apple.com", undefined, "jack.hill@apple.com"],
  Netflix:   ["liam.taylor@netflix.com", undefined, "sophia.martinez@netflix.com", "chloe.green@netflix.com"],
}

const SCOPE_TEXTS = [
  "Deliver a fully integrated platform covering core workflow, reporting, and admin tooling. Phase 1 includes auth, data model, and basic CRUD. Phase 2 covers analytics and notifications. Excludes third-party integrations beyond the agreed API contracts.",
  "Redesign and re-implement the customer-facing portal with improved UX, performance, and accessibility. Covers design system alignment, mobile responsiveness, and handoff to the client's internal team. Out of scope: back-end data layer changes.",
  "Migrate existing on-premise data pipelines to a cloud-native architecture. Includes ETL redesign, schema mapping, and validation testing. Excludes data-quality remediation on legacy records.",
  "Build a real-time analytics dashboard with role-based access control. Scope includes data ingestion layer, visualisation components, and scheduled report export. Excludes historical data backfill beyond 12 months.",
  "Implement an automated compliance workflow covering document collection, status tracking, and audit-log generation. Scope limited to the core review cycle; excludes integration with external regulatory databases.",
  "Develop a mobile-first companion app aligned to the existing design language. Covers iOS and Android via React Native, core feature parity with the web app, and push-notification plumbing. Excludes App Store submission.",
]

const BRIEF_TEXTS = [
  "The client is modernising their internal tooling stack and needs a delivery partner to lead product engineering. They have an existing internal team that will co-own delivery; our role is to provide senior IC capacity and architecture oversight.",
  "Following a recent acquisition, the client needs to consolidate two product lines onto a single platform. The engagement is time-boxed to 6 months with a hard launch date tied to a customer communications campaign.",
  "The client is launching a new B2B product line and requires a full-stack team to accelerate the MVP. Internal engineering is focused on their core platform, so this engagement is effectively a greenfield build-out.",
  "Regulatory changes require the client to overhaul their data retention and audit capabilities. The timeline is driven by a compliance deadline, making speed and accuracy equally critical.",
  "The client's current system is showing performance degradation at scale. The brief is to diagnose bottlenecks, propose and implement architectural improvements, and hand back a stable platform to the internal team.",
  "A strategic initiative to shift customer engagement from offline to digital channels. The client needs UX research, design, and front-end implementation delivered in tight collaboration with their marketing and product teams.",
]

const STRATEGIC_PRIORITIES = ["p0", "p1", "p2", undefined] as const
const STAFFING_PRIORITIES  = ["p0", "p1", "p2", "p0", "p1"] as const

// 10 realistic project-notes templates rotated across deals.
const NOTE_CONTENT_POOL = [
  "Spoke with the client today — they're excited about the direction and want to accelerate to Q2. May need an additional Eng to hit the dates.",
  "Client confirmed budget is approved. Their VP wants a mid-point demo before full delivery. Worth noting in the scope.",
  "Check-in call done. Client is leaning toward T&M over fixed-fee. Worth revisiting scope assumptions before the L2 review.",
  "Scoping session went well. Likely need 2× Eng and 1× UX for the first sprint. Client wants us co-located two days per week.",
  "Client raised a concern about their data migration timeline overlapping with our work. Need to align dependencies before kick-off.",
  "Early discovery done. Client is between us and one other vendor — our PM-embedded model is the differentiator. Would be good to confirm a senior PM ASAP.",
  "Updated probability to Medium — client pushed back on pricing but said they have flexibility if we reduce the Eng hours.",
  "Client's internal champion is going on leave in April. We should front-load stakeholder alignment before then.",
  "Revisited scope with the team — we can cut from 3× to 2× Eng if we remove the analytics module from phase 1.",
  "Client confirmed they want to move forward. Waiting on legal to finalise the MSA. Recommend starting pre-work on the staffing plan now.",
]

const NOTE_DATES = ["20.03.2026", "15.03.2026", "08.03.2026", "28.02.2026", "21.02.2026"]

function buildNotes(
  count: number,
  hasNew: boolean,
  ownerName: string,
  seed: number
): DealNote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `note-${seed}-${i}`,
    author: ownerName,
    date: NOTE_DATES[i % NOTE_DATES.length],
    content: NOTE_CONTENT_POOL[(seed + i) % NOTE_CONTENT_POOL.length],
    // Only the first (most-recent) note gets the "new" indicator.
    isNew: hasNew && i === 0,
  }))
}

function generateMockDeals(l1Count: number, l2Count: number, l3Count: number): DealData[] {
  const deals: DealData[] = []
  let id = 1

  const probFor = (stage: "L1" | "L2" | "L3", i: number) => {
    const table = dealTemplates.probabilitiesByStage[stage]
    return table[i % table.length]
  }

  for (let i = 0; i < l1Count; i++) {
    const dateRange = dealTemplates.dateRanges[i % dealTemplates.dateRanges.length]
    const owner = dealTemplates.owners[i % dealTemplates.owners.length]
    const client = dealTemplates.clients[i % dealTemplates.clients.length]
    const notesCount = i % 3 === 0 ? (i % 4) + 1 : undefined
    const hasNewNotes = i % 5 === 2
    const dealContact = (CLIENT_CONTACTS[client] ?? [])[i % 4]
    const scopeOfWork  = i % 3 !== 0 ? SCOPE_TEXTS[i % SCOPE_TEXTS.length] : undefined
    const projectBrief = i % 4 !== 1 ? BRIEF_TEXTS[i % BRIEF_TEXTS.length] : undefined
    const strategicPriority = STRATEGIC_PRIORITIES[i % STRATEGIC_PRIORITIES.length] ?? undefined
    const staffingPriority  = STAFFING_PRIORITIES[i % STAFFING_PRIORITIES.length] as "p0" | "p1" | "p2"
    const hasDeadline = dealTemplates.alerts[i % dealTemplates.alerts.length]?.includes("Deadline") ?? false
    const prob = probFor("L1", i)
    const hasDataGap = prob === "Unsure" || !strategicPriority || !projectBrief
    const dealType = hasDataGap
      ? (i % 2 === 0 ? undefined : (["tm", "fixed"] as const)[i % 2 === 1 ? 0 : 1])
      : (["tm", "fixed"] as const)[i % 2]
    const alerts: AlertType[] = [...(hasDataGap ? (["Data"] as AlertType[]) : []), ...(hasDeadline ? (["Deadline"] as AlertType[]) : [])]
    deals.push({
      id: `${id++}`,
      name: dealTemplates.names[i % dealTemplates.names.length],
      client,
      stage: "L1",
      owner,
      startDate: dateRange.start,
      endDate: dateRange.end,
      probability: prob,
      roles: dealTemplates.roleVariants[i % dealTemplates.roleVariants.length],
      alerts: alerts.length > 0 ? alerts : undefined,
      notesCount,
      hasNewNotes,
      notes: notesCount ? buildNotes(notesCount, hasNewNotes, owner.name, i) : undefined,
      dealContact,
      dealType,
      scopeOfWork,
      projectBrief,
      strategicPriority,
      staffingPriority,
    })
  }

  for (let i = 0; i < l2Count; i++) {
    const dateRange = dealTemplates.dateRanges[(i + 3) % dealTemplates.dateRanges.length]
    const owner = dealTemplates.owners[(i + 3) % dealTemplates.owners.length]
    const client = dealTemplates.clients[(i + 2) % dealTemplates.clients.length]
    const notesCount = i % 4 === 0 ? (i % 3) + 1 : undefined
    const hasNewNotes = i % 4 === 1
    const dealContact = (CLIENT_CONTACTS[client] ?? [])[(i + 1) % 4]
    const scopeOfWork  = i % 4 !== 2 ? SCOPE_TEXTS[(i + 2) % SCOPE_TEXTS.length] : undefined
    const projectBrief = i % 3 !== 0 ? BRIEF_TEXTS[(i + 3) % BRIEF_TEXTS.length] : undefined
    const strategicPriority = STRATEGIC_PRIORITIES[(i + 1) % STRATEGIC_PRIORITIES.length] ?? undefined
    const staffingPriority  = STAFFING_PRIORITIES[(i + 2) % STAFFING_PRIORITIES.length] as "p0" | "p1" | "p2"
    const hasDeadline = dealTemplates.alerts[(i + 1) % dealTemplates.alerts.length]?.includes("Deadline") ?? false
    const prob2 = probFor("L2", i)
    const hasDataGap2 = prob2 === "Unsure" || !strategicPriority || !projectBrief
    const dealType2 = hasDataGap2
      ? (i % 2 === 0 ? undefined : (["tm", "fixed"] as const)[(i + 1) % 2])
      : (["tm", "fixed"] as const)[(i + 1) % 2]
    const alerts: AlertType[] = [...(hasDataGap2 ? (["Data"] as AlertType[]) : []), ...(hasDeadline ? (["Deadline"] as AlertType[]) : [])]
    deals.push({
      id: `${id++}`,
      name: dealTemplates.names[(i + 5) % dealTemplates.names.length],
      client,
      stage: "L2",
      owner,
      startDate: dateRange.start,
      endDate: dateRange.end,
      probability: prob2,
      roles: dealTemplates.roleVariants[(i + 4) % dealTemplates.roleVariants.length],
      alerts: alerts.length > 0 ? alerts : undefined,
      notesCount,
      hasNewNotes,
      notes: notesCount ? buildNotes(notesCount, hasNewNotes, owner.name, i + 20) : undefined,
      dealContact,
      dealType: dealType2,
      scopeOfWork,
      projectBrief,
      strategicPriority,
      staffingPriority,
    })
  }

  for (let i = 0; i < l3Count; i++) {
    const dateRange = dealTemplates.dateRanges[(i + 6) % dealTemplates.dateRanges.length]
    const owner = dealTemplates.owners[(i + 5) % dealTemplates.owners.length]
    const client = dealTemplates.clients[(i + 5) % dealTemplates.clients.length]
    const notesCount = i % 3 === 0 ? (i % 4) + 1 : undefined
    const hasNewNotes = i % 6 === 3
    const dealContact = (CLIENT_CONTACTS[client] ?? [])[(i + 2) % 4]
    const scopeOfWork  = i % 2 === 0 ? SCOPE_TEXTS[(i + 4) % SCOPE_TEXTS.length] : undefined
    const projectBrief = i % 5 !== 3 ? BRIEF_TEXTS[(i + 1) % BRIEF_TEXTS.length] : undefined
    const strategicPriority = STRATEGIC_PRIORITIES[(i + 2) % STRATEGIC_PRIORITIES.length] ?? undefined
    const staffingPriority  = STAFFING_PRIORITIES[(i + 4) % STAFFING_PRIORITIES.length] as "p0" | "p1" | "p2"
    const hasDeadline = dealTemplates.alerts[(i + 2) % dealTemplates.alerts.length]?.includes("Deadline") ?? false
    const prob3 = probFor("L3", i)
    const hasDataGap3 = prob3 === "Unsure" || !strategicPriority || !projectBrief
    const dealType3 = hasDataGap3
      ? (i % 2 === 0 ? undefined : (["tm", "fixed"] as const)[i % 2 === 1 ? 1 : 0])
      : (["tm", "fixed"] as const)[i % 2]
    const alerts: AlertType[] = [...(hasDataGap3 ? (["Data"] as AlertType[]) : []), ...(hasDeadline ? (["Deadline"] as AlertType[]) : [])]
    deals.push({
      id: `${id++}`,
      name: dealTemplates.names[(i + 10) % dealTemplates.names.length],
      client,
      stage: "L3",
      owner,
      startDate: dateRange.start,
      endDate: dateRange.end,
      probability: prob3,
      roles: dealTemplates.roleVariants[(i + 7) % dealTemplates.roleVariants.length],
      alerts: alerts.length > 0 ? alerts : undefined,
      notesCount,
      hasNewNotes,
      notes: notesCount ? buildNotes(notesCount, hasNewNotes, owner.name, i + 40) : undefined,
      dealContact,
      dealType: dealType3,
      scopeOfWork,
      projectBrief,
      strategicPriority,
      staffingPriority,
    })
  }

  return deals
}

// ── Past deals (historical Won / Lost) ───────────────────────────────────────

/** Parse "Mon YYYY" → Date at the 1st of that month. */
function parseMonthYear(s: string): Date {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const [month, yearStr] = s.split(' ')
  return new Date(parseInt(yearStr ?? '2025'), months[month ?? ''] ?? 0, 1)
}

const PAST_DEAL_NAMES = [
  'Legacy System Migration', 'Q4 2024 Automation Initiative', 'Customer Data Platform v1',
  'Internal Analytics Revamp', 'Compliance Portal 2024', 'Mobile App MVP',
  'API Gateway Modernization', 'Cloud Migration Phase 1', 'HR Portal Redesign',
  'E-commerce Replatforming', 'Data Warehouse Migration', 'Payment Processing Overhaul',
  'Customer Support System', 'DevOps Transformation', 'Security Audit Tooling',
  'Marketing Analytics Platform', 'Supply Chain Optimization', 'Digital Onboarding Flow',
  'Knowledge Base Platform', 'Reporting Dashboard v2', 'Integration Hub',
  'B2B Portal Redesign', 'Predictive Analytics MVP', 'Workforce Planning Tool',
  'Contract Management System',
]

/**
 * 100 close dates spread across 14 months so every date-range filter bucket
 * has meaningful data to test against (today = Feb 20, 2026):
 *
 *  Last 30 days  (≥ Jan 21 2026): Feb 2026 (8) + Jan 2026 (7)      = 15
 *  Last 90 days  (≥ Nov 22 2025): + Dec 2025 (8) + Nov 2025 (7)    = 30
 *  Last year     (≥ Feb 20 2025): + Oct–May 2025 (50 total)         = 80
 *  Older than 1y (< Feb 20 2025): Feb 2025 (5) + Jan 2025 (10) + Dec 2024 (5) = 20
 */
const PAST_CLOSE_DATES: string[] = [
  ...Array(8).fill('Feb 2026'), ...Array(7).fill('Jan 2026'),
  ...Array(8).fill('Dec 2025'), ...Array(7).fill('Nov 2025'),
  ...Array(10).fill('Oct 2025'), ...Array(10).fill('Sep 2025'),
  ...Array(8).fill('Aug 2025'), ...Array(7).fill('Jul 2025'),
  ...Array(8).fill('Jun 2025'), ...Array(7).fill('May 2025'),
  ...Array(5).fill('Feb 2025'), ...Array(5).fill('Jan 2025'),
  ...Array(5).fill('Dec 2024'), ...Array(5).fill('Nov 2024'),
]
// Total: 8+7+8+7+10+10+8+7+8+7+5+5+5+5 = 100 ✓

function generatePastMockDeals(): DealData[] {
  return PAST_CLOSE_DATES.map((closeDate, i) => {
    const owner = dealTemplates.owners[i % dealTemplates.owners.length]
    const client = dealTemplates.clients[i % dealTemplates.clients.length]
    // 60 % Won (i%5 < 3), 40 % Lost
    const outcome: 'Won' | 'Lost' = i % 5 < 3 ? 'Won' : 'Lost'
    // Probability that reflects the outcome retrospectively
    const probability = (
      outcome === 'Won'
        ? (['High', 'High', 'High', 'Medium'] as const)[i % 4]
        : (['Low', 'Low', 'Medium', 'Unsure'] as const)[i % 4]
    )
    const notesCount = i % 4 === 0 ? (i % 3) + 1 : undefined
    return {
      id: `past-${i + 1}`,
      name: PAST_DEAL_NAMES[i % PAST_DEAL_NAMES.length],
      client,
      stage: (['L1', 'L2', 'L3'] as const)[i % 3],
      owner,
      startDate: dealTemplates.dateRanges[(i + 2) % dealTemplates.dateRanges.length].start,
      endDate: closeDate,
      probability,
      roles: dealTemplates.roleVariants[i % dealTemplates.roleVariants.length],
      notesCount,
      hasNewNotes: false,
      notes: notesCount ? buildNotes(notesCount, false, owner.name, i + 200) : undefined,
      outcome,
      closeDate,
    }
  })
}

const PAST_PAGE_SIZE = 50

export default function DealsPage() {
  const { role } = useRole()
  // Future role-based UI: hide/show table columns → hasPermission(role, "view_all_columns")
  const canCreateDeal = hasPermission(role, "create_deal")

  const [isNewDealOpen, setIsNewDealOpen] = useState(false)
  const [newDealStep, setNewDealStep] = useState<DealStep>(1)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter,  setRoleFilter]  = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string[]>([])
  const [dealsStatus, setDealsStatus] = useState<'active' | 'past'>('active')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<DealData | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  const [l1MockCount, setL1MockCount] = useState(5)
  const [l2MockCount, setL2MockCount] = useState(5)
  const [l3MockCount, setL3MockCount] = useState(5)

  // ── Past-view state ────────────────────────────────────────────────────────
  const [pastDateRange, setPastDateRange] = useState<'30d' | '90d' | '1y' | 'custom'>('1y')
  const [pastOutcome, setPastOutcome] = useState<string[]>([])
  const [pastCustomFrom, setPastCustomFrom] = useState<Date | undefined>(undefined)
  const [pastCustomTo, setPastCustomTo] = useState<Date | undefined>(undefined)
  const [pastPage, setPastPage] = useState(1)
  const [pastColumns, setPastColumns] = useState<ColumnConfig[]>(PAST_DEFAULT_COLUMNS)

  const [manualDeals, setManualDeals] = useState<DealData[]>([])
  const [newlyCreatedDealId, setNewlyCreatedDealId] = useState<string | null>(null)
  // Per-deal field overrides written by the side panel (real-time table sync)
  const [dealOverrides, setDealOverrides] = useState<Record<string, Partial<DealData>>>({})

  const handleDealUpdate = useCallback(
    (dealId: string, updates: Partial<DealData>) => {
      setDealOverrides((prev) => ({
        ...prev,
        [dealId]: { ...prev[dealId], ...updates },
      }))
    },
    []
  )
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useScrollIndicator(scrollContainerRef, { timeoutMs: 600 })

  const sampleDeals = useMemo(
    () => generateMockDeals(l1MockCount, l2MockCount, l3MockCount),
    [l1MockCount, l2MockCount, l3MockCount]
  )

  const filterDeals = useCallback((deals: DealData[]): DealData[] => {
    let filtered = deals

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((deal) =>
        deal.name.toLowerCase().includes(query) ||
        deal.client.toLowerCase().includes(query) ||
        deal.owner.name.toLowerCase().includes(query)
      )
    }

    if (roleFilter.length > 0) {
      filtered = filtered.filter((deal) =>
        deal.roles.some((roleCount) =>
          roleFilter.includes(roleCount.role.toLowerCase())
        )
      )
    }

    if (stageFilter.length > 0) {
      filtered = filtered.filter((deal) =>
        stageFilter.includes(deal.stage.toLowerCase())
      )
    }

    return filtered
  }, [searchQuery, roleFilter, stageFilter])

  const sortDeals = useCallback((deals: DealData[]): DealData[] => {
    if (!sortField || !sortDirection) return deals

    return [...deals].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'client':
          comparison = a.client.localeCompare(b.client)
          break
        case 'owner':
          comparison = a.owner.name.localeCompare(b.owner.name)
          break
        case 'startDate':
          comparison = a.startDate.localeCompare(b.startDate)
          break
        case 'endDate':
          comparison = a.endDate.localeCompare(b.endDate)
          break
        case 'probability': {
          const probOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1, Unsure: 0 }
          comparison = (probOrder[a.probability] ?? 0) - (probOrder[b.probability] ?? 0)
          break
        }
        case 'alerts': {
          const aHasAlerts = a.alerts && a.alerts.length > 0 ? 1 : 0
          const bHasAlerts = b.alerts && b.alerts.length > 0 ? 1 : 0
          comparison = bHasAlerts - aHasAlerts
          break
        }
        case 'notes': {
          const aNotesScore = a.hasNewNotes ? 3 : (a.notesCount ? 2 : 1)
          const bNotesScore = b.hasNewNotes ? 3 : (b.notesCount ? 2 : 1)
          comparison = bNotesScore - aNotesScore
          break
        }
        case 'closeDate': {
          const aT = a.closeDate ? parseMonthYear(a.closeDate).getTime() : 0
          const bT = b.closeDate ? parseMonthYear(b.closeDate).getTime() : 0
          comparison = aT - bT
          break
        }
        case 'outcome': {
          const ord = { Won: 1, Lost: 0 } as const
          comparison = (ord[a.outcome ?? 'Lost'] ?? 0) - (ord[b.outcome ?? 'Lost'] ?? 0)
          break
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [sortField, sortDirection])

  const allDeals = useMemo(
    () =>
      [...manualDeals, ...sampleDeals].map((d) => {
        const merged = dealOverrides[d.id] ? { ...d, ...dealOverrides[d.id] } : d
        // Recompute "Data" alert from live field values so it clears when the
        // user fills in missing fields via the side panel.
        const hasDataGap =
          !merged.dealType ||
          !merged.probability || merged.probability === "Unsure" ||
          !merged.strategicPriority ||
          !merged.projectBrief?.trim()
        const otherAlerts = (merged.alerts ?? []).filter((a) => a !== "Data")
        const alerts: AlertType[] = hasDataGap ? ["Data", ...otherAlerts] : otherAlerts
        return { ...merged, alerts }
      }),
    [manualDeals, sampleDeals, dealOverrides]
  )

  const filteredDeals = useMemo(
    () => filterDeals(allDeals),
    [allDeals, filterDeals]
  )

  const l1Deals = useMemo(
    () => sortDeals(filteredDeals.filter((deal) => deal.stage === "L1")),
    [filteredDeals, sortDeals]
  )
  const l2Deals = useMemo(
    () => sortDeals(filteredDeals.filter((deal) => deal.stage === "L2")),
    [filteredDeals, sortDeals]
  )
  const l3Deals = useMemo(
    () => sortDeals(filteredDeals.filter((deal) => deal.stage === "L3")),
    [filteredDeals, sortDeals]
  )

  const sections = useMemo((): DealsTableSection[] => {
    const baseSections: DealsTableSection[] = [
      { key: 'l1', deals: l1Deals, label: 'L1: Exploration' },
      { key: 'l2', deals: l2Deals, label: 'L2: Scoping' },
      { key: 'l3', deals: l3Deals, label: 'L3: Closing' },
    ]
    if (sortField === 'stage' && sortDirection === 'desc') {
      return [...baseSections].reverse()
    }
    return baseSections
  }, [l1Deals, l2Deals, l3Deals, sortField, sortDirection])

  // ── Past deals memos ───────────────────────────────────────────────────────
  const pastDeals = useMemo(() => generatePastMockDeals(), [])

  const filteredPastDeals = useMemo(() => {
    let deals = pastDeals

    // Date-range filter
    const now = new Date()
    if (pastDateRange !== 'custom') {
      const daysMap = { '30d': 30, '90d': 90, '1y': 365 } as const
      const cutoff = new Date(now)
      cutoff.setDate(cutoff.getDate() - daysMap[pastDateRange])
      deals = deals.filter((d) =>
        d.closeDate ? parseMonthYear(d.closeDate).getTime() >= cutoff.getTime() : false
      )
    } else {
      if (pastCustomFrom) {
        const fromMs = pastCustomFrom.getTime()
        deals = deals.filter((d) =>
          d.closeDate ? parseMonthYear(d.closeDate).getTime() >= fromMs : false
        )
      }
      if (pastCustomTo) {
        const toMs = pastCustomTo.getTime()
        deals = deals.filter((d) =>
          d.closeDate ? parseMonthYear(d.closeDate).getTime() <= toMs : false
        )
      }
    }

    // Outcome filter
    if (pastOutcome.length > 0) {
      deals = deals.filter((d) => pastOutcome.includes(d.outcome?.toLowerCase() ?? ''))
    }

    // Shared search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      deals = deals.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        d.owner.name.toLowerCase().includes(q)
      )
    }

    // Shared role filter
    if (roleFilter.length > 0) {
      deals = deals.filter((d) =>
        d.roles.some((r) => roleFilter.includes(r.role.toLowerCase()))
      )
    }

    return deals
  }, [pastDeals, pastDateRange, pastOutcome, pastCustomFrom, pastCustomTo, searchQuery, roleFilter])

  const sortedPastDeals = useMemo(
    () => sortDeals(filteredPastDeals),
    [filteredPastDeals, sortDeals]
  )

  const paginatedPastDeals = useMemo(() => {
    const start = (pastPage - 1) * PAST_PAGE_SIZE
    return sortedPastDeals.slice(start, start + PAST_PAGE_SIZE)
  }, [sortedPastDeals, pastPage])

  const pastTotalPages = Math.max(1, Math.ceil(sortedPastDeals.length / PAST_PAGE_SIZE))

  const pastSections = useMemo((): DealsTableSection[] => [
    { key: 'won',  label: 'Won',  deals: paginatedPastDeals.filter((d) => d.outcome === 'Won') },
    { key: 'lost', label: 'Lost', deals: paginatedPastDeals.filter((d) => d.outcome === 'Lost') },
  ], [paginatedPastDeals])

  // ── Past-view column handlers ──────────────────────────────────────────────
  const handlePastColumnsChange = (newColumns: ColumnConfig[]) => setPastColumns(newColumns)
  const handleResetPastColumns = () => setPastColumns(PAST_DEFAULT_COLUMNS)

  const handleMockDataSave = (l1: number, l2: number, l3: number) => {
    setL1MockCount(l1)
    setL2MockCount(l2)
    setL3MockCount(l3)
  }

  const handleDealCreated = useCallback((data: NewDealFormData) => {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const roleMap: Record<string, 'PM' | 'Eng' | 'UX' | 'QA'> = {
      PM: 'PM', Eng: 'Eng', UX: 'UX', QA: 'QA',
    }
    const roles = data.roles
      .filter((row) => row.hours_per_week > 0 && row.role in roleMap)
      .map((row) => ({ role: roleMap[row.role], count: row.hours_per_week }))

    const newDeal: DealData = {
      id: `manual-${Date.now()}`,
      name: data.name,
      client: data.client,
      stage: data.stage,
      owner: {
        name: data.dealOwner,
        avatar: dealTemplates.owners.find(o => o.name.toLowerCase() === data.dealOwner.toLowerCase())?.avatar
          ?? dealTemplates.owners[0].avatar,
      },
      startDate: formatDate(data.startDate),
      endDate: formatDate(data.endDate),
      probability: 'Medium',
      roles: roles.length > 0 ? roles : [{ role: 'PM', count: 40 }],
    }

    setManualDeals((prev) => [newDeal, ...prev])
    setSortField(null)
    setSortDirection(null)

    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      setNewlyCreatedDealId(newDeal.id)
      setTimeout(() => setNewlyCreatedDealId(null), 3000)
    })
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }

  const handleResetColumns = () => {
    setColumns(DEFAULT_COLUMNS)
  }

  const handleDealClick = (deal: DealData) => {
    setSelectedDeal(deal)
    setSidePanelOpen(true)
  }

  const handleCloseSidePanel = () => {
    setSidePanelOpen(false)
    setSelectedDeal(null)
  }

  return (
    <div className="h-full p-[10px] pt-[60px] flex gap-[10px] overflow-x-auto">
      {/* Page container */}
      <div className="bg-background border border-border rounded-lg shadow-sm flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        <div ref={scrollContainerRef} className="overflow-y-auto scrollbar-minimal">
          <div className="px-5 pt-5 pb-6">
          {/* Page header */}
          <div className="flex items-center w-full mb-6">
            <h1 className="text-base font-semibold leading-none text-foreground">
              Deals ({dealsStatus === 'active' ? filteredDeals.length : filteredPastDeals.length})
            </h1>
          </div>

          {/* Filters bar */}
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <Tabs
                value={dealsStatus}
                onValueChange={(value) => {
                  setDealsStatus(value as 'active' | 'past')
                  setPastPage(1)
                  setSortField(null)
                  setSortDirection(null)
                }}
              >
                <TabsList className="w-[260px] shrink-0">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3 min-w-0">
                {/* Search — always visible */}
                <div className="relative w-[220px]">
                  <Input
                    placeholder="Search"
                    className="h-9 pr-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Active-only filters */}
                {dealsStatus === 'active' && (
                  <>
                    <FilterMultiSelect
                      label="Role"
                      options={ROLE_OPTIONS}
                      value={roleFilter}
                      onChange={setRoleFilter}
                    />

                    <FilterMultiSelect
                      label="Deal stage"
                      options={STAGE_OPTIONS}
                      value={stageFilter}
                      onChange={setStageFilter}
                    />
                  </>
                )}

                {/* Past-only filters */}
                {dealsStatus === 'past' && (
                  <>
                    <Select
                      value={pastDateRange}
                      onValueChange={(v) => {
                        const val = v as typeof pastDateRange
                        setPastDateRange(val)
                        setPastPage(1)
                        if (val !== 'custom') {
                          setPastCustomFrom(undefined)
                          setPastCustomTo(undefined)
                        }
                      }}
                    >
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30d" hideIndicator>Last 30 days</SelectItem>
                        <SelectItem value="90d" hideIndicator>Last 90 days</SelectItem>
                        <SelectItem value="1y"  hideIndicator>Last year</SelectItem>
                        <SelectItem value="custom" hideIndicator>Custom range</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Inline custom date pickers — compact, same row */}
                    {pastDateRange === 'custom' && (
                      <>
                        <DatePicker
                          id="past-from"
                          placeholder="From"
                          displayFormat="MMM d"
                          value={pastCustomFrom}
                          onChange={(date) => { setPastCustomFrom(date); setPastPage(1) }}
                          className="h-9 w-[100px]"
                        />
                        <DatePicker
                          id="past-to"
                          placeholder="To"
                          displayFormat="MMM d"
                          value={pastCustomTo}
                          onChange={(date) => { setPastCustomTo(date); setPastPage(1) }}
                          minDate={pastCustomFrom}
                          className="h-9 w-[100px]"
                        />
                      </>
                    )}

                    <FilterMultiSelect
                      label="Outcome"
                      options={OUTCOME_OPTIONS}
                      value={pastOutcome}
                      onChange={(v) => { setPastOutcome(v); setPastPage(1) }}
                    />

                    <FilterMultiSelect
                      label="Role"
                      options={ROLE_OPTIONS}
                      value={roleFilter}
                      onChange={setRoleFilter}
                    />
                  </>
                )}

                {/* Column settings — always visible */}
                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-4">
                    <ColumnSettings
                      columns={dealsStatus === 'active' ? columns : pastColumns}
                      onColumnsChange={dealsStatus === 'active' ? handleColumnsChange : handlePastColumnsChange}
                      onReset={dealsStatus === 'active' ? handleResetColumns : handleResetPastColumns}
                    />
                  </PopoverContent>
                </Popover>

                {/* Reset all — always after column settings, extra 4px gap via ml-1 */}
                {(roleFilter.length > 0 || stageFilter.length > 0 || pastOutcome.length > 0) && (
                  <button
                    type="button"
                    className="ml-1 text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                    onClick={() => { setRoleFilter([]); setStageFilter([]); setPastOutcome([]) }}
                  >
                    Reset all
                  </button>
                )}
              </div>
            </div>

            {dealsStatus === 'active' ? (
              // create_deal permission: hidden for read-only role
              canCreateDeal && (
                <Button
                  variant="secondary"
                  className="h-9 gap-2 shrink-0"
                  onClick={() => { setNewDealStep(1); setIsNewDealOpen(true) }}
                >
                  <Plus className="h-4 w-4" />
                  New Deal
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                className="h-9 gap-2 shrink-0"
                onClick={() => console.log('Export CSV')}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          </div>{/* end padded header/filters */}

          {/* Deals Table — full width, no horizontal padding */}
          {dealsStatus === 'active' ? (
            <DealsTable
              columns={columns}
              sections={sections}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onDealClick={handleDealClick}
              onDealAction={(deal) => console.log(`Action for ${deal.name}`)}
              newlyCreatedDealId={newlyCreatedDealId}
              selectedDealId={selectedDeal?.id}
            />
          ) : (
            <>
              <DealsTable
                columns={pastColumns}
                sections={pastSections}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onDealClick={handleDealClick}
                onDealAction={(deal) => console.log(`Action for ${deal.name}`)}
                selectedDealId={selectedDeal?.id}
              />

              {/* Pagination */}
              {pastTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {((pastPage - 1) * PAST_PAGE_SIZE) + 1}–{Math.min(pastPage * PAST_PAGE_SIZE, sortedPastDeals.length)} of {sortedPastDeals.length} deals
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                      disabled={pastPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-1">
                      Page {pastPage} of {pastTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPastPage((p) => Math.min(pastTotalPages, p + 1))}
                      disabled={pastPage === pastTotalPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>{/* end scroll container */}
      </div>

      {dealsStatus === 'active' && (
        <MockDataController
          l1Count={l1MockCount}
          l2Count={l2MockCount}
          l3Count={l3MockCount}
          onSave={handleMockDataSave}
        />
      )}

      <DealSidePanel
        deal={selectedDeal}
        isOpen={sidePanelOpen}
        onClose={handleCloseSidePanel}
        onDealUpdate={handleDealUpdate}
      />

      <NewDealModal
        open={isNewDealOpen}
        step={newDealStep}
        onClose={() => setIsNewDealOpen(false)}
        onBack={() => setNewDealStep(s => (s > 1 ? (s - 1) as DealStep : s))}
        onCancel={() => setIsNewDealOpen(false)}
        onCreateDeal={handleDealCreated}
        onPrimary={() => {
          if (newDealStep < 3) setNewDealStep(s => (s + 1) as DealStep)
          else setIsNewDealOpen(false)
        }}
      />
    </div>
  )
}
