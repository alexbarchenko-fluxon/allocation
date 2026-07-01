import React, { useState } from 'react'
import { type DealData } from '@/components/ui/table-deals'
import { type ColumnConfig } from '@/components/ui/column-settings'
import { DealsTableHeader } from './DealsTableHeader'
import { DealsTableRow } from './DealsTableRow'
import { StageSeparatorRow } from './StageSeparatorRow'

type SortField =
  | 'name'
  | 'client'
  | 'stage'
  | 'owner'
  | 'startDate'
  | 'endDate'
  | 'probability'
  | 'alerts'
  | 'notes'
  | 'closeDate'
  | 'outcome'
  | null

type SortDirection = 'asc' | 'desc' | null

export interface DealsTableSection {
  key: string
  label: string
  deals: DealData[]
}

// Only pinned columns get an explicit pixel width.
// Fluid columns have no entry — the browser distributes the remaining space automatically.
const FIXED_COLUMN_WIDTHS: Record<string, string> = {
  stage:   '85px',
  notes:   '85px',
  actions: '85px',
}

// Columns whose content (header + cells) should be horizontally centered
export const CENTERED_COLUMNS = new Set(['stage', 'notes', 'actions'])

interface DealsTableProps {
  columns: ColumnConfig[]
  sections: DealsTableSection[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onDealClick?: (deal: DealData) => void
  onDealAction?: (deal: DealData) => void
  newlyCreatedDealId?: string | null
  selectedDealId?: string | null
}

export function DealsTable({
  columns,
  sections,
  sortField,
  sortDirection,
  onSort,
  onDealClick,
  onDealAction,
  newlyCreatedDealId,
  selectedDealId,
}: DealsTableProps) {
  const visibleColumns = columns.filter((col) => col.visible)
  const visibleColumnIds = visibleColumns.map((col) => col.id)
  const visibleCount = visibleColumns.length

  // Open state per section key — all open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((s) => [s.key, true]))
  )

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="overflow-hidden">
      <table className="w-full border-collapse">
        <colgroup>
          {visibleColumns.map((col) => (
            <col
              key={col.id}
              style={FIXED_COLUMN_WIDTHS[col.id] ? { width: FIXED_COLUMN_WIDTHS[col.id] } : undefined}
            />
          ))}
        </colgroup>

        <DealsTableHeader
          columns={visibleColumns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />

        <tbody>
          {sections.map((section) => {
            const isOpen = openSections[section.key] ?? true
            return (
              <React.Fragment key={section.key}>
                <StageSeparatorRow
                  label={section.label}
                  count={section.deals.length}
                  colSpan={visibleCount}
                  open={isOpen}
                  onToggle={() => toggleSection(section.key)}
                />
                {isOpen && (
                  section.deals.length > 0 ? (
                    section.deals.map((deal) => (
                      <DealsTableRow
                        key={deal.id}
                        deal={deal}
                        visibleColumns={visibleColumnIds}
                        onClick={() => onDealClick?.(deal)}
                        onAction={() => onDealAction?.(deal)}
                        highlight={deal.id === newlyCreatedDealId}
                        isSelected={deal.id === selectedDealId}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={visibleCount}
                        className="py-10 text-center text-sm text-muted-foreground border-b border-border bg-background"
                      >
                        No deals in {section.label.toLowerCase()}
                      </td>
                    </tr>
                  )
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
