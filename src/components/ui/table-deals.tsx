import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Avatar } from "./avatar"
import { Button } from "./button"
import { CircleAlert, Calendar, NotepadText, MoreVertical } from "lucide-react"
import { useRole } from "@/roles/role-context"

// Types
export type StageType = "L1" | "L2" | "L3"
export type ProbabilityScore = "High" | "Medium" | "Low" | "Unsure"
export type RoleType = "PM" | "Eng" | "UX" | "QA"
export type AlertType = "Data" | "Deadline"

export interface RoleCount {
  role: RoleType
  count: number
}

export interface DealNote {
  id: string
  author: string
  date: string
  content: string
  isNew?: boolean
}

export interface DealData {
  id: string
  name: string
  client: string
  stage: StageType
  owner: {
    name: string
    avatar?: string
  }
  startDate: string
  endDate: string
  probability: ProbabilityScore
  roles: RoleCount[]
  alerts?: AlertType[]
  notesCount?: number
  hasNewNotes?: boolean
  notes?: DealNote[]
  /** Business division — optional, free text. */
  division?: string
  /** Client-side contact email — undefined means not yet assigned. */
  dealContact?: string
  /** Contract type. undefined = never selected (field is missing). */
  dealType?: "unsure" | "tm" | "fixed"
  /** Free-text scope description for the Scope section. */
  scopeOfWork?: string
  /** High-level project brief for the Scope section. */
  projectBrief?: string
  /** Strategic priority for the Staffing section. */
  strategicPriority?: "p0" | "p1" | "p2"
  /** Staffing priority for the Staffing section. */
  staffingPriority?: "p0" | "p1" | "p2"
  /** Historical / past deals only: won or lost. */
  outcome?: "Won" | "Lost"
  /** Historical / past deals only: "Mon YYYY" e.g. "Feb 2026". */
  closeDate?: string
}

// Cell Components

interface TableCellBaseProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
}

export function TableCellText({ className, children, ...props }: TableCellBaseProps) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-3 py-2",
        className
      )}
      {...props}
    >
      <div className="flex-1 overflow-hidden text-ellipsis text-sm text-muted-foreground font-medium">
        {children}
      </div>
    </td>
  )
}

interface TableCellStageProps extends TableCellBaseProps {
  stage: StageType
}

export function TableCellStage({ stage, className, ...props }: TableCellStageProps) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-2 py-3",
        className
      )}
      {...props}
    >
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="w-[40px] px-2 py-1.5 rounded-md bg-background text-foreground justify-center"
        >
          {stage}
        </Badge>
      </div>
    </td>
  )
}

interface TableCellAvatarProps extends TableCellBaseProps {
  name: string
  avatar?: string
}

export function TableCellAvatar({ name, avatar, className, ...props }: TableCellAvatarProps) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-3 py-1.5",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <Avatar 
          src={avatar} 
          alt={name} 
          size="sm"
          fallback={name?.charAt(0)?.toUpperCase()}
        />
        <div className="flex-1 overflow-hidden text-ellipsis text-sm text-muted-foreground font-medium">
          {name}
        </div>
      </div>
    </td>
  )
}

interface TableCellProbabilityProps extends TableCellBaseProps {
  score: ProbabilityScore
}

const probabilityStyles: Record<string, string> = {
  High:   "bg-badge-error   border-badge-error-stroke   text-badge-error-fg",
  Medium: "bg-badge-warning border-badge-warning-stroke text-badge-warning-fg",
  Low:    "bg-badge-success border-badge-success-stroke text-badge-success-fg",
  Unsure: "bg-badge-neutral border-badge-neutral-stroke text-badge-neutral-fg",
}

export function TableCellProbability({ score, className, ...props }: TableCellProbabilityProps) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-3 py-3",
        className
      )}
      {...props}
    >
      <Badge
        variant="outline"
        className={cn(
          "px-2 py-1.5 rounded-md",
          probabilityStyles[score] ?? probabilityStyles.Unsure
        )}
      >
        {score}
      </Badge>
    </td>
  )
}

interface TableCellRolesProps extends TableCellBaseProps {
  roles: RoleCount[]
}

export function TableCellRoles({ roles, className, ...props }: TableCellRolesProps) {
  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-3 py-3",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-1">
        {roles.map(({ role, count }, i) => (
          <Badge
            key={`${role}-${i}`}
            variant="outline"
            className="px-2.5 py-1.5 rounded-md bg-background border-border"
          >
            {role} {count}h
          </Badge>
        ))}
      </div>
    </td>
  )
}

interface TableCellAlertsProps extends TableCellBaseProps {
  alerts?: AlertType[]
}

const alertConfig: Record<AlertType, { icon: React.ReactNode; label: string }> = {
  Data:     { icon: <CircleAlert className="h-3 w-3" />, label: "Data" },
  Deadline: { icon: <Calendar    className="h-3 w-3" />, label: "Deadline" },
}

export function TableCellAlerts({ alerts, className, ...props }: TableCellAlertsProps) {
  const visibleAlerts = alerts?.filter((a) => a !== "Data")
  if (!visibleAlerts || visibleAlerts.length === 0) {
    return (
      <td
        className={cn("h-[52px] border-t border-border px-3", className)}
        {...props}
      />
    )
  }

  return (
    <td
      className={cn("h-[52px] border-t border-border px-3 py-3", className)}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {visibleAlerts.map((alert) => {
          const { icon, label } = alertConfig[alert]
          return (
            <Badge
              key={alert}
              variant="outline"
              className="px-2 py-1.5 rounded-md gap-1 bg-badge-warning border-badge-warning-stroke text-badge-warning-fg"
            >
              {icon}
              <span>{label}</span>
            </Badge>
          )
        })}
      </div>
    </td>
  )
}

interface TableCellNotesProps extends TableCellBaseProps {
  count?: number
  hasNew?: boolean
}

export function TableCellNotes({ count, hasNew, className, ...props }: TableCellNotesProps) {
  const { role } = useRole()
  const isReadonly = role === "readonly"

  if (!count) {
    return (
      <td
        className={cn("h-[52px] border-t border-border px-2", className)}
        {...props}
      />
    )
  }

  return (
    <td
      className={cn("h-[52px] border-t border-border px-2 py-3", className)}
      {...props}
    >
      <div className="flex justify-center">
        {hasNew && !isReadonly ? (
          <div className="flex items-center gap-0.5">
            <NotepadText className="h-5 w-5 text-primary" />
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {count}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 opacity-50">
            <NotepadText className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{count}</span>
          </div>
        )}
      </div>
    </td>
  )
}

interface TableCellActionsProps extends TableCellBaseProps {
  onAction?: () => void
}

export function TableCellActions({ onAction, className, ...props }: TableCellActionsProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAction?.()
  }

  return (
    <td
      className={cn(
        "h-[52px] border-t border-border px-2 py-2",
        className
      )}
      {...props}
    >
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleClick}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </td>
  )
}

// ── Past-deal cell components ─────────────────────────────────────────────────

interface TableCellOutcomeProps extends TableCellBaseProps {
  outcome: "Won" | "Lost"
}

const outcomeStyles = {
  Won:  "bg-badge-success border-badge-success-stroke text-badge-success-fg",
  Lost: "bg-badge-error   border-badge-error-stroke   text-badge-error-fg",
} as const

export function TableCellOutcome({ outcome, className, ...props }: TableCellOutcomeProps) {
  return (
    <td
      className={cn("h-[52px] border-t border-border px-3 py-3", className)}
      {...props}
    >
      <Badge
        variant="outline"
        className={cn("px-2 py-1.5 rounded-md font-medium", outcomeStyles[outcome])}
      >
        {outcome}
      </Badge>
    </td>
  )
}

// Table Row Component

interface TableDealsRowProps {
  deal: DealData
  onAction?: () => void
  onClick?: () => void
  isFirst?: boolean
  isLast?: boolean
  visibleColumns?: Record<string, boolean>
  columnOrder?: string[]
  highlight?: boolean
  isSelected?: boolean
}

export function TableDealsRow({ deal, onAction, onClick, isFirst, isLast, visibleColumns = {}, columnOrder = ['name', 'client', 'stage', 'owner', 'startDate', 'endDate', 'probability', 'roles', 'alerts', 'notes', 'actions'], highlight = false, isSelected = false }: TableDealsRowProps) {
  const isVisible = (columnId: string) => visibleColumns[columnId] ?? true
  
  // Determine which columns are visible to properly apply border-left and border-right
  const visibleColumnIds = columnOrder.filter(isVisible)
  const firstVisibleColumn = visibleColumnIds[0]
  const lastVisibleColumn = visibleColumnIds[visibleColumnIds.length - 1]

  // Helper to render cell for a given column
  const renderCell = (columnId: string) => {
    const isFirstCol = columnId === firstVisibleColumn
    const isLastCol = columnId === lastVisibleColumn
    const baseClasses = cn(
      isFirstCol && "border-l",
      isLastCol && "border-r",
      isLast && "border-b",
      isFirst && isFirstCol && "rounded-tl-lg",
      isLast && isFirstCol && "rounded-bl-lg",
      isFirst && isLastCol && "rounded-tr-lg",
      isLast && isLastCol && "rounded-br-lg"
    )

    switch (columnId) {
      case 'name':
        return <TableCellText key={columnId} className={baseClasses}>{deal.name}</TableCellText>
      case 'client':
        return <TableCellText key={columnId} className={baseClasses}>{deal.client}</TableCellText>
      case 'stage':
        return <TableCellStage key={columnId} stage={deal.stage} className={baseClasses} />
      case 'owner':
        return <TableCellAvatar key={columnId} name={deal.owner.name} avatar={deal.owner.avatar} className={baseClasses} />
      case 'startDate':
        return <TableCellText key={columnId} className={baseClasses}>{deal.startDate}</TableCellText>
      case 'endDate':
        return <TableCellText key={columnId} className={baseClasses}>{deal.endDate}</TableCellText>
      case 'probability':
        return <TableCellProbability key={columnId} score={deal.probability} className={baseClasses} />
      case 'roles':
        return <TableCellRoles key={columnId} roles={deal.roles} className={baseClasses} />
      case 'alerts':
        return <TableCellAlerts key={columnId} alerts={deal.alerts} className={baseClasses} />
      case 'notes':
        return <TableCellNotes key={columnId} count={deal.notesCount} hasNew={deal.hasNewNotes} className={baseClasses} />
      case 'actions':
        return <TableCellActions key={columnId} onAction={onAction} className={baseClasses} />
      default:
        return null
    }
  }
  
  return (
    <tr 
      className={cn(
        "transition-colors cursor-pointer",
        highlight ? "bg-accent" : isSelected ? "bg-extended-hover" : "bg-background hover:bg-extended-hover"
      )}
      onClick={onClick}
    >
      {columnOrder.filter(isVisible).map(columnId => renderCell(columnId))}
    </tr>
  )
}
