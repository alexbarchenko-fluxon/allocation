import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Table, TableBody, TableRow } from "./table";
import {
  TableCellText,
  TableCellStage,
  TableCellAvatar,
  TableCellProbability,
  TableCellRoles,
  TableCellAlerts,
  TableCellNotes,
  TableCellActions,
  TableCellOutcome,
  type DealData,
} from "./table-deals";
import { DealsTable } from "@/components/deals/table/DealsTable";
import { DealsTableRow } from "@/components/deals/table/DealsTableRow";
import { DealsTableHeader } from "@/components/deals/table/DealsTableHeader";
import type { ColumnConfig } from "./column-settings";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta: Meta = {
  title: "UI/Table/Deals",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const ALL_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Deal name", visible: true },
  { id: "client", label: "Client", visible: true },
  { id: "stage", label: "Stage", visible: true },
  { id: "owner", label: "Deal owner", visible: true },
  { id: "startDate", label: "Start date", visible: true },
  { id: "endDate", label: "End date", visible: true },
  { id: "probability", label: "Probability", visible: true },
  { id: "roles", label: "Required roles", visible: true },
  { id: "alerts", label: "Alerts", visible: true },
  { id: "notes", label: "Notes", visible: true },
  { id: "actions", label: "Actions", visible: true },
];

const ALL_COLUMN_IDS = ALL_COLUMNS.map((c) => c.id);

const sampleDeals: DealData[] = [
  {
    id: "1",
    name: "Campus Planning 2026",
    client: "Google",
    stage: "L1",
    owner: {
      name: "Makenna Canter",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Makenna",
    },
    startDate: "Jan 2026",
    endDate: "Mar 2026",
    probability: "Medium",
    roles: [
      { role: "PM", count: 40 },
      { role: "Eng", count: 80 },
    ],
    notesCount: 2,
  },
  {
    id: "2",
    name: "Workspace Admin Revamp",
    client: "Stripe",
    stage: "L2",
    owner: {
      name: "Skylar Dorwart",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Skylar",
    },
    startDate: "Feb 2026",
    endDate: "Apr 2026",
    probability: "High",
    roles: [
      { role: "PM", count: 40 },
      { role: "Eng", count: 120 },
      { role: "QA", count: 40 },
    ],
    alerts: ["Data"],
    notesCount: 1,
  },
  {
    id: "3",
    name: "Cloud Cost Optimization",
    client: "Amazon",
    stage: "L3",
    owner: {
      name: "Brandon Aminoff",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brandon",
    },
    startDate: "Jan 2026",
    endDate: "Jun 2026",
    probability: "Low",
    roles: [
      { role: "UX", count: 80 },
      { role: "Eng", count: 120 },
    ],
    alerts: ["Data", "Deadline"],
    notesCount: 2,
    hasNewNotes: true,
  },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Full table with stage separator rows — the primary Deals-B layout.
 */
export const FullTable: StoryObj = {
  render: () => (
    <DealsTable
      columns={ALL_COLUMNS}
      sections={[
        { key: "l1", label: "L1: Exploration", deals: [sampleDeals[0]] },
        { key: "l2", label: "L2: Scoping", deals: [sampleDeals[1]] },
        { key: "l3", label: "L3: Closing", deals: [sampleDeals[2]] },
      ]}
      sortField={null}
      sortDirection={null}
      onSort={() => {}}
    />
  ),
};

/**
 * Multiple deals in a single section.
 */
export const MultipleRows: StoryObj = {
  render: () => (
    <DealsTable
      columns={ALL_COLUMNS}
      sections={[
        { key: "l1", label: "L1: Exploration", deals: sampleDeals },
      ]}
      sortField={null}
      sortDirection={null}
      onSort={() => {}}
    />
  ),
};

/**
 * Empty section shows the empty-state cell.
 */
export const EmptySection: StoryObj = {
  render: () => (
    <DealsTable
      columns={ALL_COLUMNS}
      sections={[
        { key: "l1", label: "L1: Exploration", deals: [] },
        { key: "l2", label: "L2: Scoping", deals: [sampleDeals[1]] },
      ]}
      sortField={null}
      sortDirection={null}
      onSort={() => {}}
    />
  ),
};

/**
 * Header row in isolation — shows sort state variants.
 */
export const HeaderOnly: StoryObj = {
  render: () => (
    <div className="border border-border rounded-2xl overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <DealsTableHeader
          columns={ALL_COLUMNS}
          sortField="name"
          sortDirection="asc"
          onSort={() => {}}
        />
      </table>
    </div>
  ),
};

/**
 * Single data row in isolation.
 */
export const SingleRow: StoryObj = {
  render: () => (
    <div className="border border-border rounded-2xl overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <DealsTableHeader
          columns={ALL_COLUMNS}
          sortField={null}
          sortDirection={null}
          onSort={() => {}}
        />
        <tbody>
          <DealsTableRow
            deal={sampleDeals[0]}
            visibleColumns={ALL_COLUMN_IDS}
            onAction={() => alert("Action clicked")}
          />
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Row highlighted as newly created.
 */
export const HighlightedRow: StoryObj = {
  render: () => (
    <div className="border border-border rounded-2xl overflow-hidden">
      <table className="w-full table-fixed border-collapse">
        <DealsTableHeader
          columns={ALL_COLUMNS}
          sortField={null}
          sortDirection={null}
          onSort={() => {}}
        />
        <tbody>
          <DealsTableRow
            deal={sampleDeals[0]}
            visibleColumns={ALL_COLUMN_IDS}
            highlight
          />
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Individual cell components in isolation — useful for iterating badge styles.
 */
export const Cells: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Text Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellText>Campus Planning 2026</TableCellText>
              <TableCellText>Google</TableCellText>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Stage Badges
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellStage stage="L1" />
              <TableCellStage stage="L2" />
              <TableCellStage stage="L3" />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Avatar Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellAvatar
                name="Makenna Canter"
                avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Makenna"
              />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Probability Indicators
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellProbability score="High" />
              <TableCellProbability score="Medium" />
              <TableCellProbability score="Low" />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Roles Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellRoles
                roles={[
                  { role: "PM", count: 40 },
                  { role: "Eng", count: 160 },
                  { role: "UX", count: 80 },
                  { role: "QA", count: 40 },
                ]}
              />
            </TableRow>
            <TableRow>
              <TableCellRoles roles={[{ role: "Eng", count: 200 }]} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Alerts Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellAlerts alerts={["Data"]} />
              <TableCellAlerts alerts={["Deadline"]} />
              <TableCellAlerts alerts={["Data", "Deadline"]} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Notes Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellNotes count={2} />
              <TableCellNotes count={5} hasNew />
              <TableCellNotes />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Actions Cell
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellActions onAction={() => alert("Action clicked")} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Outcome Cell (Past Deals)
        </h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCellOutcome outcome="Won" />
              <TableCellOutcome outcome="Lost" />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  ),
};

// ─── Past Deals table ─────────────────────────────────────────────────────────

const PAST_COLUMNS: ColumnConfig[] = [
  { id: "name",      label: "Deal name",  visible: true },
  { id: "client",    label: "Client",     visible: true },
  { id: "outcome",   label: "Outcome",    visible: true },
  { id: "closeDate", label: "Close date", visible: true },
  { id: "owner",     label: "Deal owner", visible: true },
];

const pastDeals: DealData[] = [
  {
    id: "p1",
    name: "Mobile Checkout Redesign",
    client: "Shopify",
    stage: "L3",
    owner: {
      name: "Skylar Dorwart",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Skylar",
    },
    roles: [],
    startDate: "Mar 2025",
    endDate: "Nov 2025",
    probability: "High",
    outcome: "Won",
    closeDate: "Dec 2025",
  },
  {
    id: "p2",
    name: "Data Platform Migration",
    client: "Salesforce",
    stage: "L2",
    owner: {
      name: "Brandon Aminoff",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brandon",
    },
    roles: [],
    startDate: "Jun 2025",
    endDate: "Oct 2025",
    probability: "Medium",
    outcome: "Lost",
    closeDate: "Oct 2025",
  },
  {
    id: "p3",
    name: "Internal Tooling Sprint",
    client: "Figma",
    stage: "L1",
    owner: {
      name: "Makenna Canter",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Makenna",
    },
    roles: [],
    startDate: "Jul 2025",
    endDate: "Sep 2025",
    probability: "High",
    outcome: "Won",
    closeDate: "Sep 2025",
  },
];

/**
 * Past Deals table — uses the historical column set (Outcome + Close date instead
 * of Stage, Probability, Roles, Alerts).
 * Deals are grouped by Won / Lost sections.
 */
export const PastDealsTable: StoryObj = {
  render: () => (
    <DealsTable
      columns={PAST_COLUMNS}
      sections={[
        { key: "won",  label: "Won",  deals: pastDeals.filter((d) => d.outcome === "Won") },
        { key: "lost", label: "Lost", deals: pastDeals.filter((d) => d.outcome === "Lost") },
      ]}
      sortField={null}
      sortDirection={null}
      onSort={() => {}}
    />
  ),
};

// ─── RoleFilterMultiSelect ────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "pm",  label: "PM" },
  { value: "eng", label: "Eng" },
  { value: "ux",  label: "UX" },
  { value: "qa",  label: "QA" },
];

function RoleFilterMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (role: string) =>
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);

  const label =
    value.length === 0
      ? "All roles"
      : value.length <= 2
        ? value.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r).join(", ")
        : `${value.length} roles`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[110px] justify-between gap-2 font-normal px-3"
        >
          <span className="truncate text-sm">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-1.5" align="start">
        {ROLE_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer select-none"
            onClick={() => toggle(opt.value)}
          >
            <Checkbox
              checked={value.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="pointer-events-none"
            />
            <span className="text-sm">{opt.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Role filter multiselect — a Popover + Checkbox dropdown used to filter
 * the Deals table by required role type (PM, Eng, UX, QA).
 *
 * - Default label: "All roles" when nothing is selected.
 * - 1–2 selections: shows role abbreviations joined by comma.
 * - 3+ selections: shows "{n} roles".
 */
export const RoleFilterDefault: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div className="flex flex-col gap-4">
        <RoleFilterMultiSelect value={selected} onChange={setSelected} />
        <p className="text-xs text-muted-foreground">
          Selected: {selected.length === 0 ? "none" : selected.join(", ")}
        </p>
      </div>
    );
  },
};

/**
 * Pre-seeded with two roles selected.
 */
export const RoleFilterWithSelection: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(["pm", "eng"]);
    return (
      <div className="flex flex-col gap-4">
        <RoleFilterMultiSelect value={selected} onChange={setSelected} />
        <p className="text-xs text-muted-foreground">
          Selected: {selected.join(", ")}
        </p>
      </div>
    );
  },
};

/**
 * All four roles selected — label collapses to "4 roles".
 */
export const RoleFilterAllSelected: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(["pm", "eng", "ux", "qa"]);
    return (
      <div className="flex flex-col gap-4">
        <RoleFilterMultiSelect value={selected} onChange={setSelected} />
        <p className="text-xs text-muted-foreground">
          Selected: {selected.join(", ")}
        </p>
      </div>
    );
  },
};
