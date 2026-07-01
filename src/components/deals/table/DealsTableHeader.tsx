import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnConfig } from '@/components/ui/column-settings'

type SortField = 'name' | 'client' | 'stage' | 'owner' | 'startDate' | 'endDate' | 'probability' | 'alerts' | 'notes' | 'closeDate' | 'outcome' | null
type SortDirection = 'asc' | 'desc' | null

const SORTABLE_COLUMNS = new Set([
  'name', 'client', 'stage', 'owner', 'startDate', 'endDate', 'probability', 'alerts', 'notes',
  'closeDate', 'outcome',
])

const CENTERED_COLUMNS = new Set(['stage', 'notes', 'actions'])

const COLUMN_LABELS: Record<string, string> = {
  name: 'Deal name',
  client: 'Client',
  stage: 'Stage',
  owner: 'Deal owner',
  startDate: 'Start date',
  endDate: 'End date',
  probability: 'Probability',
  roles: 'Required roles',
  alerts: 'Alerts',
  notes: 'Notes',
  actions: 'Actions',
  outcome: 'Outcome',
  closeDate: 'Close date',
}

interface DealsTableHeaderProps {
  columns: ColumnConfig[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}

export function DealsTableHeader({ columns, sortField, sortDirection, onSort }: DealsTableHeaderProps) {
  const getSortIcon = (colId: string) => {
    if (sortField !== colId) return <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4 shrink-0" />
    return <ChevronDown className="h-4 w-4 shrink-0" />
  }

  return (
    <thead>
      <tr>
        {columns.map((col, idx) => {
          const isSortable = SORTABLE_COLUMNS.has(col.id)
          const isCentered = CENTERED_COLUMNS.has(col.id)
          const isFirst = idx === 0
          return (
            <th
              key={col.id}
              className={cn(
                'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-t border-b border-border',
                // horizontal padding — first col gets extra left padding
                isFirst ? 'pl-4 pr-3' : 'px-3',
                // vertical dividers
                idx > 0 && 'border-l border-border',
                // alignment
                isCentered ? 'text-center' : 'text-left',
                isSortable && 'cursor-pointer select-none hover:text-foreground transition-colors'
              )}
              onClick={() => isSortable && onSort(col.id as SortField)}
            >
              <div className={cn('flex items-center gap-1.5', isCentered && 'justify-center')}>
                {COLUMN_LABELS[col.id] ?? col.label}
                {isSortable && getSortIcon(col.id)}
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
