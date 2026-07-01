import { cn } from '@/lib/utils'
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
} from '@/components/ui/table-deals'

interface DealsTableRowProps {
  deal: DealData
  visibleColumns: string[]
  onAction?: () => void
  onClick?: () => void
  highlight?: boolean
  isSelected?: boolean
}

const COMPACT_HEIGHT = 'h-10'

export function DealsTableRow({
  deal,
  visibleColumns,
  onAction,
  onClick,
  highlight = false,
  isSelected = false,
}: DealsTableRowProps) {
  const cellClass = (idx: number) =>
    cn(COMPACT_HEIGHT, idx > 0 && 'border-l border-border')

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors border-b border-border',
        highlight ? 'bg-accent' : isSelected ? 'bg-extended-hover' : 'bg-background hover:bg-extended-hover'
      )}
    >
      {visibleColumns.map((colId, idx) => {
        const cls = cellClass(idx)
        switch (colId) {
          case 'name':
            return (
              <TableCellText key={colId} className={cls}>
                {deal.name}
              </TableCellText>
            )
          case 'client':
            return (
              <TableCellText key={colId} className={cls}>
                {deal.client}
              </TableCellText>
            )
          case 'stage':
            return <TableCellStage key={colId} stage={deal.stage} className={cls} />
          case 'owner':
            return (
              <TableCellAvatar
                key={colId}
                name={deal.owner.name}
                avatar={deal.owner.avatar}
                className={cls}
              />
            )
          case 'startDate':
            return (
              <TableCellText key={colId} className={cls}>
                {deal.startDate}
              </TableCellText>
            )
          case 'endDate':
            return (
              <TableCellText key={colId} className={cls}>
                {deal.endDate}
              </TableCellText>
            )
          case 'probability':
            return (
              <TableCellProbability key={colId} score={deal.probability} className={cls} />
            )
          case 'roles':
            return <TableCellRoles key={colId} roles={deal.roles} className={cls} />
          case 'alerts':
            return <TableCellAlerts key={colId} alerts={deal.alerts} className={cls} />
          case 'notes':
            return (
              <TableCellNotes
                key={colId}
                count={deal.notesCount}
                hasNew={deal.hasNewNotes}
                className={cls}
              />
            )
          case 'outcome':
            return deal.outcome
              ? <TableCellOutcome key={colId} outcome={deal.outcome} className={cls} />
              : <TableCellText key={colId} className={cls}>—</TableCellText>
          case 'closeDate':
            return (
              <TableCellText key={colId} className={cls}>
                {deal.closeDate ?? '—'}
              </TableCellText>
            )
          case 'actions':
            return <TableCellActions key={colId} onAction={onAction} className={cls} />
          default:
            return null
        }
      })}
    </tr>
  )
}
