import React, { useState, useEffect, useRef } from "react"
import { useScrollIndicator } from "@/hooks/useScrollIndicator"
import {
  X, Check, NotepadText, ChevronDown, Info, FileText, GripVertical, Minus, Plus,
  Users, FileSearch, Calendar, SquarePen,
} from "lucide-react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core" 
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type DealData, type DealNote, type ProbabilityScore } from "@/components/ui/table-deals"
import { Avatar } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

interface DealDetailsSidePanelShellProps {
  onClose: () => void
  dealName: string
  client: string
  stage: string
  // ── Deal info fields ───────────────────────────────────────────────────────
  division?: string
  dealOwner?: string
  dealContact?: string
  dealType?: string
  startDate?: string
  endDate?: string
  probability?: string
  roles?: Array<{ role: string; count: number }>
  // ── Staffing fields ────────────────────────────────────────────────────────
  strategicPriority?: string
  staffingPriority?: string
  // ── Scope fields ──────────────────────────────────────────────────────────
  scopeOfWork?: string
  projectBrief?: string
  // ── Historical (past) deals ───────────────────────────────────────────────
  /** When set the panel renders in "past deal" mode: Won/Lost badge, notes only, no footer. */
  outcome?: "Won" | "Lost"
  // ── Notes ─────────────────────────────────────────────────────────────────
  notesCount?: number
  hasNewNotes?: boolean
  notes?: DealNote[]
  /** Called whenever the user edits a field that should be reflected in the main table. */
  onDealUpdate?: (updates: Partial<DealData>) => void
  /** Called when admin changes stage via the dropdown. */
  onStageChange?: (newStage: string) => void
  /** Controls whether the panel shows editable form fields or read-only display. */
  role?: "editor" | "readonly"
  /** Controls the content fade-in: 0→1 opacity with delay after the panel slide. */
  isContentVisible?: boolean
  /**
   * When true the panel is cross-fading between two deals (already open).
   * Uses a faster 300ms transition with no delay instead of the initial-open
   * 500ms + 450ms slide-wait timing.
   */
  isSwitching?: boolean
  className?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "Jan 2026" → Date(2026, 0, 1). Returns undefined for blank/invalid. */
function parseMonthDate(s?: string): Date | undefined {
  if (!s) return undefined
  const [month, yearStr] = s.split(" ")
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const m = months[month ?? ""]
  const y = parseInt(yearStr ?? "")
  if (m === undefined || isNaN(y)) return undefined
  return new Date(y, m, 1)
}

function formatDate(d?: Date): string {
  if (!d) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ── Value display map ─────────────────────────────────────────────────────────

const probabilityBadgeStyles: Record<ProbabilityScore, string> = {
  High:   "bg-badge-error   border-badge-error-stroke   text-badge-error-fg",
  Medium: "bg-badge-warning border-badge-warning-stroke text-badge-warning-fg",
  Low:    "bg-badge-success border-badge-success-stroke text-badge-success-fg",
  Unsure: "bg-badge-neutral border-badge-neutral-stroke text-badge-neutral-fg",
}

const dealTypeLabels: Record<string, string> = {
  tm:     "T&M",
  fixed:  "Fixed",
  unsure: "Unsure",
}

const priorityLabels: Record<string, string> = {
  p0: "P0",
  p1: "P1",
  p2: "P2",
}

// ── Small UI components ───────────────────────────────────────────────────────

/** Read-only stage badge. */
function StageDisplay({ stage }: { stage: string }) {
  return (
    <Badge
      variant="outline"
      className="w-[40px] px-2 py-1.5 rounded-md bg-background text-foreground justify-center"
    >
      {stage}
    </Badge>
  )
}

const STAGE_FULL: Record<string, string> = {
  L1: "L1 Exploration",
  L2: "L2 Scoping",
  L3: "L3 Closing",
}

/**
 * Admin stage trigger + dropdown.
 * Forward movement (L1→L2, L2→L3) is gated by validation.
 * Backward movement always shows a confirmation dialog first.
 */
function StageDropdown({
  stage,
  totalMissing,
  onStageChange,
}: {
  stage: string
  totalMissing: number
  onStageChange: (newStage: string) => void
}) {
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  function handleBackward(target: string) {
    setConfirmTarget(target)
  }

  function handleConfirm() {
    if (confirmTarget) onStageChange(confirmTarget)
    setConfirmTarget(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-1 pl-4 pr-[10px] py-1.5 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors focus:outline-none">
            {stage}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-max">
          <DropdownMenuLabel className="text-sm font-semibold text-foreground px-2 py-1.5">
            Change stage
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* ── Backward: closest step first ── */}
          {stage === "L2" && (
            <DropdownMenuItem onSelect={() => handleBackward("L1")} className="whitespace-nowrap">
              Move back to L1
            </DropdownMenuItem>
          )}
          {stage === "L3" && (
            <>
              <DropdownMenuItem onSelect={() => handleBackward("L2")} className="whitespace-nowrap">
                Move back to L2
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleBackward("L1")} className="whitespace-nowrap">
                Move back to L1
              </DropdownMenuItem>
            </>
          )}

          {/* ── Forward options — validation inline on same row ── */}
          {stage === "L1" && (
            <DropdownMenuItem
              onSelect={(e) => { if (totalMissing > 0) { e.preventDefault(); return } onStageChange("L2") }}
              className={cn("whitespace-nowrap gap-0", totalMissing > 0 && "cursor-not-allowed focus:bg-transparent")}
            >
              <span className={cn(totalMissing > 0 && "opacity-50")}>Move to L2</span>
              {totalMissing > 0 && (
                <span className="text-badge-warning-fg"><span className="mx-2">·</span>{totalMissing} field{totalMissing === 1 ? "" : "s"} missing</span>
              )}
            </DropdownMenuItem>
          )}
          {stage === "L2" && (
            <DropdownMenuItem
              onSelect={(e) => { if (totalMissing > 0) { e.preventDefault(); return } onStageChange("L3") }}
              className={cn("whitespace-nowrap gap-0", totalMissing > 0 && "cursor-not-allowed focus:bg-transparent")}
            >
              <span className={cn(totalMissing > 0 && "opacity-50")}>Move to L3</span>
              {totalMissing > 0 && (
                <span className="text-badge-warning-fg"><span className="mx-2">·</span>{totalMissing} field{totalMissing === 1 ? "" : "s"} missing</span>
              )}
            </DropdownMenuItem>
          )}
          {stage === "L3" && (
            <DropdownMenuItem
              onSelect={(e) => { if (totalMissing > 0) { e.preventDefault(); return } onStageChange("Project") }}
              className={cn("whitespace-nowrap gap-0", totalMissing > 0 && "cursor-not-allowed focus:bg-transparent")}
            >
              <span className={cn(totalMissing > 0 && "opacity-50")}>Convert to Project</span>
              {totalMissing > 0 && (
                <span className="text-badge-warning-fg"><span className="mx-2">·</span>{totalMissing} field{totalMissing === 1 ? "" : "s"} missing</span>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Backward-move confirmation dialog ── */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => { if (!o) setConfirmTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move deal back to {confirmTarget}?</DialogTitle>
            <DialogDescription>
              This will update the deal stage to {STAGE_FULL[confirmTarget ?? ""] ?? confirmTarget}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const outcomeBadgeStyles: Record<"Won" | "Lost", string> = {
  Won:  "bg-green-50 border-green-200 text-green-700",
  Lost: "bg-red-50   border-red-200   text-red-700",
}

function OutcomeBadge({ outcome }: { outcome: "Won" | "Lost" }) {
  return (
    <Badge
      variant="outline"
      className={cn("px-2 py-1.5 rounded-md font-medium", outcomeBadgeStyles[outcome])}
    >
      {outcome}
    </Badge>
  )
}

/**
 * Text value that truncates with ellipsis and shows the full value in a tooltip.
 * Must be used inside a container with `min-w-0` to allow flex truncation.
 */
function TruncatedValue({ value, className }: { value: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("text-sm font-medium text-foreground leading-5 truncate block max-w-full min-w-0", className)}>
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        {value}
      </TooltipContent>
    </Tooltip>
  )
}

/** Individual note card. */
function NoteCard({ note, canEdit }: { note: DealNote; canEdit?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[10px] w-full transition-colors duration-500",
        canEdit
          ? cn("p-3 rounded-md", note.isNew ? "bg-[rgba(231,235,255,0.5)]" : "bg-transparent")
          : "py-4 px-0 bg-transparent"
      )}
    >
      <div className="flex w-full items-center">
        <div className="flex flex-1 items-center gap-1 text-xs font-medium text-muted-foreground leading-none">
          <span>{note.author}</span>
          <span className="opacity-50">|</span>
          <span>{note.date}</span>
        </div>
        {canEdit && (
          <div
            className={cn(
              "h-2 w-2 rounded-full bg-primary flex-shrink-0 transition-opacity duration-500",
              note.isNew ? "opacity-100" : "opacity-0"
            )}
          />
        )}
      </div>
      <p className="text-xs font-medium text-muted-foreground leading-4 w-full">
        {note.content}
      </p>
    </div>
  )
}

/** Single chevron that rotates smoothly. */
function AccordionChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className="h-4 w-4 text-muted-foreground flex-shrink-0"
      style={{
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 200ms ease-in-out",
      }}
    />
  )
}

/**
 * Animated body wrapper — CSS grid-template-rows trick.
 * Overflow becomes visible only after open animation completes so focus rings
 * are not clipped.
 */
function AccordionBody({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [overflowVisible, setOverflowVisible] = useState(false)
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setOverflowVisible(true), 200)
      return () => clearTimeout(t)
    } else {
      setOverflowVisible(false)
    }
  }, [open])

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        gridTemplateColumns: "minmax(0, 1fr)",
        transition: "grid-template-rows 200ms ease-in-out",
      }}
    >
      <div style={{ overflow: overflowVisible ? "visible" : "hidden" }}>{children}</div>
    </div>
  )
}

// ── InlineField ───────────────────────────────────────────────────────────────

/**
 * Generic inline-editable field row.
 *
 * Figma: 703:118515 (field type reference sheet)
 *
 * States:
 *   read       (editable=false) — static h-[46px] row, label left + value right
 *   idle       (editable=true)  — same display with rounded-lg container, hover bg
 *   hover      (editable=true)  — idle + visible SquarePen icon
 *   edition    (editable=true)  — bordered card: label (xs) → editContent → ✗ ✓ buttons
 *
 * Validation:
 *   When editable=true AND isEmpty=true AND required=true,
 *   the value slot shows "Required for L2" in amber instead of "—".
 */
function InlineField({
  label,
  showInfo = false,
  value,
  isEmpty = false,
  required = false,
  editable,
  editContent,
  onSave,
  onCancel,
  variant = "row",
  fieldId,
}: {
  label: string
  showInfo?: boolean
  /** The read-state display node. Shown when !isEmpty. */
  value: React.ReactNode
  /** True when there is no meaningful value to display. */
  isEmpty?: boolean
  /** When true + isEmpty + editable → shows "Required for L2" amber text. */
  required?: boolean
  editable: boolean
  /** The edit control rendered inside the edition card. */
  editContent?: React.ReactNode
  /** Called when the user confirms the edit (✓). */
  onSave?: () => void
  /** Called when the user cancels the edit (✗) — parent should reset draft. */
  onCancel?: () => void
  /**
   * row       — fixed min-h-[46px], single-line value (default)
   * paragraph — min-h-[36px], multi-line value area
   */
  variant?: "row" | "paragraph"
  /** DOM id used for scroll-to navigation from the footer badge. */
  fieldId?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  function closeEditing(cb?: () => void) {
    setIsExiting(true)
    setTimeout(() => {
      cb?.()
      setIsEditing(false)
      setIsExiting(false)
    }, 200)
  }

  // ── Edition card ──────────────────────────────────────────────────────────
  if ((isEditing || isExiting) && editable) {
    return (
      <div id={fieldId} className={cn(
        isExiting
          ? "animate-out fade-out zoom-out-95 duration-200"
          : "animate-in fade-in zoom-in-95 duration-200",
        "flex flex-col border border-border rounded-[10px] pt-[10px] pb-2 px-2 w-full",
      )}>
        {/* Label */}
        <div className="flex items-center gap-1 mb-[10px]">
          <span className="text-xs font-medium text-foreground leading-none">{label}</span>
          {showInfo && <Info className="h-3.5 w-3.5 text-foreground opacity-50 shrink-0" />}
        </div>

        {/* Edit control */}
        <div className="w-full">{editContent}</div>

        {/* Cancel + Save buttons */}
        <div className="flex items-center justify-end gap-1 mt-2 pb-0.5">
          <button
            type="button"
            aria-label="Cancel"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-input bg-background shadow-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => closeEditing(onCancel)}
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Save"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-input bg-background shadow-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => closeEditing(onSave)}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Read / idle / hover ───────────────────────────────────────────────────
  const sharedMouseProps = {
    onMouseEnter: () => editable && setIsHovered(true),
    onMouseLeave: () => editable && setIsHovered(false),
    onClick: () => editable && setIsEditing(true),
  }

  // ── Paragraph-filled: top-bottom layout ──────────────────────────────────
  if (variant === "paragraph" && !isEmpty) {
    return (
      <div
        id={fieldId}
        className={cn(
          "flex flex-col gap-1 w-full transition-colors duration-150",
          editable
            ? "pl-[10px] pr-2 py-2 rounded-[10px] cursor-pointer"
            : "py-2 rounded-md",
          editable && isHovered ? "bg-primary-foreground" : "bg-transparent",
        )}
        {...sharedMouseProps}
      >
        {/* Label row with pencil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 opacity-50">
            <span className="text-sm font-medium text-foreground leading-5 shrink-0">{label}</span>
            {showInfo && <Info className="h-4 w-4 text-foreground shrink-0" />}
          </div>
          {editable && (
            <button
              type="button"
              aria-label={`Edit ${label}`}
              tabIndex={-1}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-opacity duration-150",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
            >
              <SquarePen className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Full-width text content */}
        <div className="w-full">{value}</div>
      </div>
    )
  }

  // ── Standard left-right row (empty paragraph or any row variant) ──────────
  const displayValue: React.ReactNode = isEmpty
    ? editable && required
      ? <span className="text-sm font-medium text-badge-warning-fg leading-5">Required for L2</span>
      : <span className="text-sm font-medium text-foreground opacity-50 leading-5">—</span>
    : value

  return (
    <div
      id={fieldId}
      className={cn(
        "flex items-center gap-2 w-full transition-colors duration-150",
        variant === "row" ? "min-h-[46px]" : "min-h-[36px]",
        editable
          ? "pl-[10px] pr-2 py-2 rounded-[10px] cursor-pointer"
          : "py-2 rounded-md",
        editable && isHovered ? "bg-primary-foreground" : "bg-transparent",
      )}
      {...sharedMouseProps}
    >
      {/* Label */}
      <div className="flex items-center gap-1 shrink-0 w-[140px] opacity-50">
        <span className="text-sm font-medium text-foreground leading-5 shrink-0">
          {label}
        </span>
        {showInfo && <Info className="h-4 w-4 text-foreground shrink-0" />}
      </div>

      {/* Value */}
      <div className="flex flex-1 items-center min-w-0">
        {displayValue}
      </div>

      {/* Pencil affordance — editors only, visible on hover */}
      {editable && (
        <div className="shrink-0">
          <button
            type="button"
            aria-label={`Edit ${label}`}
            tabIndex={-1}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-opacity duration-150",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── NotesSection ──────────────────────────────────────────────────────────────

/**
 * Notes accordion — header + collapsible note cards.
 * Figma: 703:118435 (Edit) / 703:118463 (Read)
 * Edit role uses px-4 outer; Read role uses px-5 outer.
 */
function NotesSection({
  count,
  hasNew,
  notes,
  canAddNote,
  onNotesRead,
}: {
  count: number
  hasNew: boolean
  notes?: DealNote[]
  canAddNote?: boolean
  onNotesRead?: () => void
}) {
  const [open, setOpen] = useState(true)
  const [noteText, setNoteText] = useState("")
  const [localNotes, setLocalNotes] = useState<DealNote[]>(notes ?? [])
  const [localCount, setLocalCount] = useState(count)
  const [localHasNew, setLocalHasNew] = useState(hasNew)

  const pendingNewRef = useRef(0)
  const onNotesReadRef = useRef(onNotesRead)
  useEffect(() => { onNotesReadRef.current = onNotesRead }, [onNotesRead])

  useEffect(() => {
    if (!hasNew) return
    const t = setTimeout(() => {
      setLocalNotes((prev) => prev.map((n) => ({ ...n, isNew: false })))
      setLocalHasNew(false)
      onNotesReadRef.current?.()
    }, 3000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isExpandable = localCount > 0 || canAddNote

  function handleAddNote() {
    if (!noteText.trim()) return
    const newNoteId = `note-${Date.now()}`
    const formatted = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const newNote: DealNote = {
      id: newNoteId,
      author: "You",
      date: formatted,
      content: noteText.trim(),
      isNew: true,
    }
    setLocalNotes((prev) => [newNote, ...prev])
    setLocalCount((prev) => prev + 1)
    setLocalHasNew(true)
    setNoteText("")

    pendingNewRef.current++
    setTimeout(() => {
      setLocalNotes((prev) =>
        prev.map((n) => (n.id === newNoteId ? { ...n, isNew: false } : n))
      )
      pendingNewRef.current--
      if (pendingNewRef.current === 0) {
        setLocalHasNew(false)
        onNotesReadRef.current?.()
      }
    }, 3000)
  }

  const header = (
    <div className="flex gap-2 items-center">
      <NotepadText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex gap-1.5 items-center">
        <span className="text-sm font-medium text-muted-foreground leading-5">Notes</span>
        {canAddNote && localCount > 0 && localHasNew ? (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none">
            {localCount}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground opacity-50">
            {localCount}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full px-5">
      {isExpandable ? (
        <button
          className="h-[68px] flex items-center justify-between w-full"
          onClick={() => setOpen((o) => !o)}
        >
          {header}
          <AccordionChevron open={open} />
        </button>
      ) : (
        <div className="h-[68px] flex items-center">{header}</div>
      )}

      {isExpandable && (
        <AccordionBody open={open}>
          <div className={cn("flex flex-col", canAddNote ? "gap-2 pb-3" : "pb-6")}>
            {canAddNote && (
              <div className="flex flex-col gap-2.5 pb-1">
                <Textarea
                  placeholder="Add a note…"
                  className="min-h-[64px] resize-none text-sm shadow-xs"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote()
                  }}
                />
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    disabled={!noteText.trim()}
                    onClick={handleAddNote}
                  >
                    Add note
                  </Button>
                </div>
              </div>
            )}
            {localNotes.map((note) => (
              <NoteCard key={note.id} note={note} canEdit={canAddNote} />
            ))}
          </div>
        </AccordionBody>
      )}
    </div>
  )
}

// ── ContentSection ────────────────────────────────────────────────────────────

/**
 * Collapsible section shell for Deal info / Staffing / Scope.
 * Figma: 703:118227 (sections reference)
 *
 * Edit role → px-4 outer, content pb-4, gap-0 between field rows
 * Read role → px-5 outer, content pb-6, gap-1 between field rows
 */
function ContentSection({
  title,
  icon: Icon,
  role = "editor",
  defaultOpen = false,
  children,
}: {
  title: string
  icon?: React.ElementType
  role?: "editor" | "readonly"
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isEdit = role === "editor"

  return (
    <div className={cn("border-t border-border w-full", isEdit ? "px-4" : "px-5")}>
      <button
        className="h-[68px] px-1 flex items-center justify-between w-full"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex gap-2 items-center">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
          <span className="text-sm font-medium text-muted-foreground leading-none">{title}</span>
        </div>
        <AccordionChevron open={open} />
      </button>

      {children && (
        <AccordionBody open={open}>
          <div className={cn(
            "flex flex-col",
            isEdit ? "pb-4 gap-0" : "pb-6 gap-1",
          )}>
            {children}
          </div>
        </AccordionBody>
      )}
    </div>
  )
}

// ── DealInfoFields ────────────────────────────────────────────────────────────

/**
 * Unified Deal info section content — shared by both editor and reader roles.
 * Figma: 703:118228 (Edit) / 703:118306 (Read)
 *
 * Editors see per-field inline editing and "Required for L2" on empty required fields.
 * Readers see the same layout without any edit affordances.
 */
function DealInfoFields({
  dealName: initialDealName,
  client: initialClient,
  division: initialDivision,
  dealOwner: initialDealOwner,
  dealContact: initialDealContact,
  dealType: initialDealType,
  startDate: initialStartDate,
  endDate: initialEndDate,
  probability: initialProbability,
  editable,
  onDealNameChange,
  onClientChange,
  onDivisionChange,
  onDealOwnerChange,
  onDealContactChange,
  onDealTypeChange,
  onProbabilityChange,
}: {
  dealName: string
  client: string
  division?: string
  dealOwner?: string
  dealContact?: string
  dealType?: string
  startDate?: Date
  endDate?: Date
  probability?: string
  editable: boolean
  onDealNameChange?: (v: string) => void
  onClientChange?: (v: string) => void
  onDivisionChange?: (v: string) => void
  onDealOwnerChange?: (v: string) => void
  onDealContactChange?: (v: string) => void
  onDealTypeChange?: (v: string) => void
  onProbabilityChange?: (v: string) => void
}) {
  // ── Per-field committed + draft state ───────────────────────────────────
  const [dealName, setDealName] = useState(initialDealName)
  const [dealNameDraft, setDealNameDraft] = useState(initialDealName)

  const [client, setClient] = useState(initialClient)
  const [clientDraft, setClientDraft] = useState(initialClient)

  const [division, setDivision] = useState(initialDivision ?? "")
  const [divisionDraft, setDivisionDraft] = useState(initialDivision ?? "")

  const [dealContact, setDealContact] = useState(initialDealContact ?? "")
  const [dealContactDraft, setDealContactDraft] = useState(initialDealContact ?? "")

  const [dealOwner, setDealOwner] = useState(initialDealOwner ?? "")
  const [dealOwnerDraft, setDealOwnerDraft] = useState(initialDealOwner ?? "")

  const [dealType, setDealType] = useState<string | undefined>(initialDealType)
  const [dealTypeDraft, setDealTypeDraft] = useState<string | undefined>(initialDealType)

  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate)
  const [startDateDraft, setStartDateDraft] = useState<Date | undefined>(initialStartDate)

  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate)
  const [endDateDraft, setEndDateDraft] = useState<Date | undefined>(initialEndDate)

  const [probability, setProbability] = useState<string | undefined>(
    initialProbability?.toLowerCase()
  )
  const [probabilityDraft, setProbabilityDraft] = useState<string | undefined>(
    initialProbability?.toLowerCase()
  )

  // ── Deal type field ──────────────────────────────────────────────────────
  const dealTypeIsRequired = editable && !dealType
  const dealTypeValue = dealType ? (
    <Badge variant="outline" className="px-2 py-1.5 rounded-md text-xs bg-background text-foreground border-border font-medium">
      {dealTypeLabels[dealType] ?? dealType}
    </Badge>
  ) : null

  // ── Win probability field ────────────────────────────────────────────────
  const probIsRequired = editable && (!probability || probability === "unsure")
  const probabilityDisplay = probability
    ? (probability.charAt(0).toUpperCase() + probability.slice(1)) as ProbabilityScore
    : undefined
  const probabilityValue = probabilityDisplay && probabilityDisplay !== "Unsure" ? (
    <Badge
      variant="outline"
      className={cn("px-2 py-1.5 rounded-md text-xs font-medium shrink-0", probabilityBadgeStyles[probabilityDisplay])}
    >
      {probabilityDisplay}
    </Badge>
  ) : probabilityDisplay === "Unsure" ? (
    <Badge variant="outline" className="px-2 py-1.5 rounded-md text-xs bg-background text-foreground border-border font-medium">
      Unsure
    </Badge>
  ) : null

  return (
    <>
      {/* Project name */}
      <InlineField
        label="Project name"
        value={dealName ? <TruncatedValue value={dealName} /> : null}
        isEmpty={!dealName}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={dealNameDraft}
            onChange={(e) => setDealNameDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => {
          setDealName(dealNameDraft)
          onDealNameChange?.(dealNameDraft)
        }}
        onCancel={() => setDealNameDraft(dealName)}
      />

      {/* Client */}
      <InlineField
        label="Client"
        value={client ? <TruncatedValue value={client} /> : null}
        isEmpty={!client}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={clientDraft}
            onChange={(e) => setClientDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => {
          setClient(clientDraft)
          onClientChange?.(clientDraft)
        }}
        onCancel={() => setClientDraft(client)}
      />

      {/* Division */}
      <InlineField
        label="Division"
        showInfo
        value={division ? <TruncatedValue value={division} /> : null}
        isEmpty={!division}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={divisionDraft}
            placeholder="Add division…"
            onChange={(e) => setDivisionDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => {
          setDivision(divisionDraft)
          onDivisionChange?.(divisionDraft)
        }}
        onCancel={() => setDivisionDraft(division)}
      />

      {/* Deal contact */}
      <InlineField
        label="Deal contact"
        showInfo
        value={
          dealContact ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <Avatar size="sm" alt={dealContact} className="shrink-0" />
              <TruncatedValue value={dealContact} />
            </div>
          ) : null
        }
        isEmpty={!dealContact}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={dealContactDraft}
            placeholder="Add contact…"
            onChange={(e) => setDealContactDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => {
          setDealContact(dealContactDraft)
          onDealContactChange?.(dealContactDraft)
        }}
        onCancel={() => setDealContactDraft(dealContact)}
      />

      {/* Deal owner */}
      <InlineField
        label="Deal owner"
        showInfo
        value={
          dealOwner ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <Avatar size="sm" alt={dealOwner} className="shrink-0" />
              <TruncatedValue value={dealOwner} />
            </div>
          ) : null
        }
        isEmpty={!dealOwner}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={dealOwnerDraft}
            placeholder="Add owner…"
            onChange={(e) => setDealOwnerDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => {
          setDealOwner(dealOwnerDraft)
          onDealOwnerChange?.(dealOwnerDraft)
        }}
        onCancel={() => setDealOwnerDraft(dealOwner)}
      />

      {/* Deal type */}
      <InlineField
        fieldId="field-deal-type"
        label="Deal type"
        value={dealTypeValue}
        isEmpty={!dealType}
        required={dealTypeIsRequired}
        editable={editable}
        editContent={
          <RadioCardGroup
            value={dealTypeDraft}
            onValueChange={setDealTypeDraft}
            className="grid grid-cols-3 gap-2"
          >
            <RadioCardItem compact value="unsure" label="Unsure" />
            <RadioCardItem compact value="tm" label="T&M" />
            <RadioCardItem compact value="fixed" label="Fixed" />
          </RadioCardGroup>
        }
        onSave={() => {
          setDealType(dealTypeDraft)
          if (dealTypeDraft) onDealTypeChange?.(dealTypeDraft)
        }}
        onCancel={() => setDealTypeDraft(dealType)}
      />

      {/* Start date */}
      <InlineField
        label="Start date"
        value={
          startDate ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground leading-5 shrink-0">
                {formatDate(startDate)}
              </span>
            </div>
          ) : null
        }
        isEmpty={!startDate}
        editable={editable}
        editContent={
          <DatePicker
            value={startDateDraft}
            onChange={setStartDateDraft}
          />
        }
        onSave={() => setStartDate(startDateDraft)}
        onCancel={() => setStartDateDraft(startDate)}
      />

      {/* End date */}
      <InlineField
        label="End date"
        value={
          endDate ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground leading-5 shrink-0">
                {formatDate(endDate)}
              </span>
            </div>
          ) : null
        }
        isEmpty={!endDate}
        editable={editable}
        editContent={
          <DatePicker
            value={endDateDraft}
            onChange={setEndDateDraft}
          />
        }
        onSave={() => setEndDate(endDateDraft)}
        onCancel={() => setEndDateDraft(endDate)}
      />

      {/* Win probability */}
      <InlineField
        fieldId="field-win-probability"
        label="Win probability"
        value={probabilityValue}
        isEmpty={!probability || probability === "unsure"}
        required={probIsRequired}
        editable={editable}
        editContent={
          <RadioCardGroup
            value={probabilityDraft}
            onValueChange={setProbabilityDraft}
            className="grid grid-cols-4 gap-2"
          >
            <RadioCardItem compact value="unsure" label="Unsure" />
            <RadioCardItem compact value="low" label="Low" />
            <RadioCardItem compact value="medium" label="Medium" />
            <RadioCardItem compact value="high" label="High" />
          </RadioCardGroup>
        }
        onSave={() => {
          setProbability(probabilityDraft)
          if (probabilityDraft) {
            onProbabilityChange?.(probabilityDraft)
          }
        }}
        onCancel={() => setProbabilityDraft(probability)}
      />
    </>
  )
}

// ── Roles inline field ────────────────────────────────────────────────────────

type FteRole = "TL" | "Eng" | "PM" | "TPM" | "UX" | "QA"
const FTE_ROLES: FteRole[] = ["TL", "Eng", "PM", "TPM", "UX", "QA"]

const HOURS_STEP = 5
const HOURS_MAX = 200

interface SidebarRoleRow {
  id: string
  role: FteRole | ""
  hours_per_week: number
}

let _rowCounter = 0

/** Sortable role row used inside the roles editor. */
function RoleRow({
  row,
  onRoleChange,
  onHoursChange,
  onRemove,
}: {
  row: SidebarRoleRow
  onRoleChange: (role: FteRole | "") => void
  onHoursChange: (hours: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const [inputValue, setInputValue] = React.useState<string | null>(null)
  const isEditingHours = inputValue !== null

  function commitInput(raw: string) {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10)
    const next = isNaN(parsed) ? row.hours_per_week : Math.min(HOURS_MAX, Math.max(0, Math.round(parsed)))
    setInputValue(null)
    onHoursChange(next)
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg bg-muted p-1">
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Select
        value={row.role || undefined}
        onValueChange={(v) => onRoleChange(v as FteRole)}
      >
        <SelectTrigger className="h-9 flex-1 bg-background text-sm shadow-xs">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {FTE_ROLES.map((r) => (
            <SelectItem key={r} value={r} hideIndicator>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex h-9 shrink-0 items-center rounded-md border border-input bg-background px-1.5 shadow-xs">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={() => onHoursChange(Math.max(0, row.hours_per_week - HOURS_STEP))}
          disabled={row.hours_per_week <= 0}
          aria-label="Decrease hours"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="relative flex w-16 items-center justify-center">
          {isEditingHours ? (
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={(e) => commitInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitInput(inputValue ?? "")
                if (e.key === "Escape") setInputValue(null)
                if (e.key === "ArrowUp") { e.preventDefault(); onHoursChange(Math.min(HOURS_MAX, row.hours_per_week + HOURS_STEP)); setInputValue(null) }
                if (e.key === "ArrowDown") { e.preventDefault(); onHoursChange(Math.max(0, row.hours_per_week - HOURS_STEP)); setInputValue(null) }
              }}
              className="w-full bg-transparent text-center text-sm tabular-nums outline-none"
            />
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1 text-sm tabular-nums"
              onClick={() => setInputValue(String(row.hours_per_week))}
              title="Click to type a value"
            >
              <span>{row.hours_per_week}</span>
              <span className="opacity-50">h</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          onClick={() => onHoursChange(Math.min(HOURS_MAX, row.hours_per_week + HOURS_STEP))}
          aria-label="Increase hours"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        onClick={onRemove}
        aria-label="Remove role"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Roles inline field — chip display in read/idle state, full DnD editor in
 * edition state. Follows the same visual pattern as InlineField but handles
 * its own complex state.
 * Figma: 703:132246 (Roles, Edition)
 */
function RolesField({
  roles: initialRoles,
  editable,
  onRolesChange,
}: {
  roles?: Array<{ role: string; count: number }>
  editable: boolean
  onRolesChange?: (roles: Array<{ role: string; count: number }>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const [committed, setCommitted] = useState<SidebarRoleRow[]>(
    () => initialRoles?.map((r, i) => ({ id: `init-${i}`, role: r.role as FteRole, hours_per_week: r.count })) ?? []
  )
  const [draft, setDraft] = useState<SidebarRoleRow[]>(committed)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = draft.findIndex((r) => r.id === active.id)
      const newIndex = draft.findIndex((r) => r.id === over.id)
      setDraft((prev) => arrayMove(prev, oldIndex, newIndex))
    }
  }

  function addSeat() {
    setDraft((prev) => [...prev, { id: `sr-${++_rowCounter}`, role: "", hours_per_week: 0 }])
  }

  function closeEditing(cb?: () => void) {
    setIsExiting(true)
    setTimeout(() => {
      cb?.()
      setIsEditing(false)
      setIsExiting(false)
    }, 200)
  }

  function handleSave() {
    const result = draft
      .filter((r) => r.role !== "")
      .map((r) => ({ role: r.role, count: r.hours_per_week }))
    closeEditing(() => {
      setCommitted(draft)
      onRolesChange?.(result)
    })
  }

  function handleCancel() {
    closeEditing(() => setDraft(committed))
  }

  // ── Edition card ────────────────────────────────────────────────────────
  if ((isEditing || isExiting) && editable) {
    return (
      <div className={cn(
        isExiting
          ? "animate-out fade-out zoom-out-95 duration-200"
          : "animate-in fade-in zoom-in-95 duration-200",
        "flex flex-col border border-border rounded-[10px] pt-[10px] pb-2 px-2 w-full",
      )}>
        <div className="flex items-center justify-between mb-[10px]">
          <span className="text-xs font-medium text-foreground leading-none">Required roles</span>
          <Button variant="secondary" size="sm" type="button" onClick={addSeat}>
            Add seat
          </Button>
        </div>

        {draft.length === 0 ? (
          <div className="flex h-10 items-center justify-center rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">No roles added.</span>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draft.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {draft.map((row) => (
                  <RoleRow
                    key={row.id}
                    row={row}
                    onRoleChange={(role) =>
                      setDraft((prev) => prev.map((r) => (r.id === row.id ? { ...r, role } : r)))
                    }
                    onHoursChange={(hours) =>
                      setDraft((prev) => prev.map((r) => (r.id === row.id ? { ...r, hours_per_week: hours } : r)))
                    }
                    onRemove={() =>
                      setDraft((prev) => prev.filter((r) => r.id !== row.id))
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex items-center justify-end gap-1 mt-2 pb-0.5">
          <button
            type="button"
            aria-label="Cancel"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-input bg-background shadow-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Save"
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-input bg-background shadow-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleSave}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Read / idle / hover row ────────────────────────────────────────────
  const chips = committed.filter((r) => r.role !== "")

  return (
    <div
      className={cn(
        "flex items-start gap-2 w-full transition-colors duration-150 min-h-[46px]",
        editable
          ? "pl-[10px] pr-2 py-2 rounded-[10px] cursor-pointer"
          : "py-2 rounded-md",
        editable && isHovered ? "bg-primary-foreground" : "bg-transparent",
      )}
      onMouseEnter={() => editable && setIsHovered(true)}
      onMouseLeave={() => editable && setIsHovered(false)}
      onClick={() => editable && setIsEditing(true)}
    >
      <div className="flex items-center gap-1 shrink-0 w-[140px] pt-0.5 opacity-50">
        <span className="text-sm font-medium text-foreground leading-5 shrink-0">Required roles</span>
      </div>

      <div className="flex flex-1 flex-wrap gap-[6px] min-w-0">
        {chips.length > 0 ? (
          chips.map(({ role, hours_per_week }, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-2 py-1 rounded-md text-xs font-medium bg-background text-foreground border-border"
            >
              {role} {hours_per_week}h
            </Badge>
          ))
        ) : (
          <span className="text-sm font-medium text-foreground opacity-50 leading-5">—</span>
        )}
      </div>

      {editable && (
        <div className="shrink-0">
          <button
            type="button"
            aria-label="Edit Required roles"
            tabIndex={-1}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-opacity duration-150",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <SquarePen className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── StaffingFields ────────────────────────────────────────────────────────────

/**
 * Unified Staffing section content.
 * Figma: 703:118333 (Edit) / 703:118363 (Read)
 */
function StaffingFields({
  roles: initialRoles,
  strategicPriority: initialStratPriority,
  staffingPriority: initialStaffPriority,
  projectLead: initialProjectLead,
  editable,
  onStrategicPriorityChange,
  onRolesChange,
}: {
  roles?: Array<{ role: string; count: number }>
  strategicPriority?: string
  staffingPriority?: string
  projectLead?: string
  editable: boolean
  onStrategicPriorityChange?: (v: string) => void
  onRolesChange?: (roles: Array<{ role: string; count: number }>) => void
}) {
  const [stratPriority, setStratPriority] = useState<string | undefined>(initialStratPriority)
  const [stratPriorityDraft, setStratPriorityDraft] = useState<string | undefined>(initialStratPriority)

  const [staffPriority, setStaffPriority] = useState<string | undefined>(initialStaffPriority)
  const [staffPriorityDraft, setStaffPriorityDraft] = useState<string | undefined>(initialStaffPriority)

  const [projectLead, setProjectLead] = useState(initialProjectLead ?? "")
  const [projectLeadDraft, setProjectLeadDraft] = useState(initialProjectLead ?? "")

  const stratIsRequired = editable && !stratPriority

  const priorityBadge = (value?: string) =>
    value ? (
      <Badge variant="outline" className="px-2 py-1.5 rounded-md text-xs font-medium bg-background text-foreground border-border">
        {priorityLabels[value] ?? value.toUpperCase()}
      </Badge>
    ) : null

  return (
    <>
      {/* Required roles — special DnD field */}
      <RolesField
        roles={initialRoles}
        editable={editable}
        onRolesChange={onRolesChange}
      />

      {/* Project Lead */}
      <InlineField
        label="Project Lead"
        showInfo
        value={
          projectLead ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <Avatar size="sm" alt={projectLead} className="shrink-0" />
              <TruncatedValue value={projectLead} />
            </div>
          ) : null
        }
        isEmpty={!projectLead}
        editable={editable}
        editContent={
          <Input
            autoFocus
            value={projectLeadDraft}
            placeholder="Add project lead…"
            onChange={(e) => setProjectLeadDraft(e.target.value)}
            className="h-9 shadow-xs"
          />
        }
        onSave={() => setProjectLead(projectLeadDraft)}
        onCancel={() => setProjectLeadDraft(projectLead)}
      />

      {/* Strategic Priority */}
      <InlineField
        fieldId="field-strategic-priority"
        label="Strategic Priority"
        value={priorityBadge(stratPriority)}
        isEmpty={!stratPriority}
        required={stratIsRequired}
        editable={editable}
        editContent={
          <RadioCardGroup
            value={stratPriorityDraft}
            onValueChange={setStratPriorityDraft}
            className="grid grid-cols-3 gap-2"
          >
            <RadioCardItem compact value="p0" label="P0" />
            <RadioCardItem compact value="p1" label="P1" />
            <RadioCardItem compact value="p2" label="P2" />
          </RadioCardGroup>
        }
        onSave={() => {
          setStratPriority(stratPriorityDraft)
          if (stratPriorityDraft) onStrategicPriorityChange?.(stratPriorityDraft)
        }}
        onCancel={() => setStratPriorityDraft(stratPriority)}
      />

      {/* Staffing Priority */}
      <InlineField
        label="Staffing Priority"
        value={priorityBadge(staffPriority)}
        isEmpty={!staffPriority}
        editable={editable}
        editContent={
          <RadioCardGroup
            value={staffPriorityDraft}
            onValueChange={setStaffPriorityDraft}
            className="grid grid-cols-3 gap-2"
          >
            <RadioCardItem compact value="p0" label="P0" />
            <RadioCardItem compact value="p1" label="P1" />
            <RadioCardItem compact value="p2" label="P2" />
          </RadioCardGroup>
        }
        onSave={() => setStaffPriority(staffPriorityDraft)}
        onCancel={() => setStaffPriorityDraft(staffPriority)}
      />
    </>
  )
}

// ── ScopeFields ───────────────────────────────────────────────────────────────

/**
 * Unified Scope section content.
 * Figma: 703:118392 (Edit) / 703:118404 (Read)
 *
 * Paragraph variant: label left, multi-line text right; edition card uses Textarea.
 */
function ScopeFields({
  scopeOfWork: initialScopeOfWork,
  projectBrief: initialProjectBrief,
  editable,
  onProjectBriefChange,
}: {
  scopeOfWork?: string
  projectBrief?: string
  editable: boolean
  onProjectBriefChange?: (v: string) => void
}) {
  const [scopeOfWork, setScopeOfWork] = useState(initialScopeOfWork ?? "")
  const [scopeOfWorkDraft, setScopeOfWorkDraft] = useState(initialScopeOfWork ?? "")

  const [projectBrief, setProjectBrief] = useState(initialProjectBrief ?? "")
  const [projectBriefDraft, setProjectBriefDraft] = useState(initialProjectBrief ?? "")

  const briefIsRequired = editable && !projectBrief.trim()

  const paragraphValue = (text: string) =>
    text.trim() ? (
      <p className="text-xs font-medium text-muted-foreground leading-4 whitespace-pre-wrap">
        {text}
      </p>
    ) : null

  return (
    <>
      {/* Scope of Work */}
      <InlineField
        label="Scope of Work"
        value={paragraphValue(scopeOfWork)}
        isEmpty={!scopeOfWork.trim()}
        editable={editable}
        variant="paragraph"
        editContent={
          <Textarea
            autoFocus
            value={scopeOfWorkDraft}
            placeholder="Add scope of work…"
            onChange={(e) => setScopeOfWorkDraft(e.target.value)}
            className="min-h-[96px] resize-none shadow-xs text-sm"
          />
        }
        onSave={() => setScopeOfWork(scopeOfWorkDraft)}
        onCancel={() => setScopeOfWorkDraft(scopeOfWork)}
      />

      {/* Project Brief */}
      <InlineField
        fieldId="field-project-brief"
        label="Project Brief"
        showInfo
        value={paragraphValue(projectBrief)}
        isEmpty={!projectBrief.trim()}
        required={briefIsRequired}
        editable={editable}
        variant="paragraph"
        editContent={
          <Textarea
            autoFocus
            value={projectBriefDraft}
            placeholder="Add project brief…"
            onChange={(e) => setProjectBriefDraft(e.target.value)}
            className="min-h-[96px] resize-none shadow-xs text-sm"
          />
        }
        onSave={() => {
          setProjectBrief(projectBriefDraft)
          onProjectBriefChange?.(projectBriefDraft)
        }}
        onCancel={() => setProjectBriefDraft(projectBrief)}
      />
    </>
  )
}

// ── Shell ────────────────────────────────────────────────────────────────────

export function DealDetailsSidePanelShell({
  onClose,
  dealName,
  client,
  stage,
  outcome,
  division,
  dealOwner,
  dealContact,
  dealType,
  startDate,
  endDate,
  probability,
  roles,
  strategicPriority,
  staffingPriority,
  scopeOfWork,
  projectBrief,
  notesCount,
  hasNewNotes,
  notes,
  onDealUpdate,
  onStageChange,
  isContentVisible = true,
  isSwitching = false,
  role = "editor",
  className,
}: DealDetailsSidePanelShellProps) {
  const isPastDeal = outcome !== undefined
  const isEditor = role === "editor"

  // ── Required-field state (for live missing-count + footer CTA) ──────────
  const [formDealType, setFormDealType] = useState<string | undefined>(dealType)
  const [formWinProbability, setFormWinProbability] = useState<string | undefined>(
    probability?.toLowerCase()
  )
  const [formStrategicPriority, setFormStrategicPriority] = useState<string | undefined>(
    strategicPriority
  )
  const [formProjectBrief, setFormProjectBrief] = useState<string | undefined>(projectBrief)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  useScrollIndicator(scrollAreaRef, { timeoutMs: 600 })

  useEffect(() => {
    setFormDealType(dealType)
    setFormWinProbability(probability?.toLowerCase())
    setFormStrategicPriority(strategicPriority)
    setFormProjectBrief(projectBrief)
    scrollAreaRef.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealName])

  // ── Derived missing fields + stage labels ───────────────────────────────
  const nextStageLabel = stage === "L1" ? "L2" : stage === "L2" ? "L3" : "Project"
  const movePhrase    = nextStageLabel

  const missingFields = [
    { label: "Deal type",          id: "field-deal-type",          missing: !formDealType },
    { label: "Win probability",    id: "field-win-probability",    missing: !formWinProbability || formWinProbability === "unsure" },
    { label: "Strategic Priority", id: "field-strategic-priority", missing: !formStrategicPriority },
    { label: "Project Brief",      id: "field-project-brief",      missing: !formProjectBrief?.trim() },
  ].filter((f) => f.missing)

  const totalMissing = missingFields.length

  function scrollToField(fieldId: string) {
    const el = document.getElementById(fieldId)
    const container = scrollAreaRef.current
    if (!el || !container) return
    const elTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top
    container.scrollBy({ top: elTop - 24, behavior: "smooth" })
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className={cn(
          "w-[420px] h-full bg-background border border-border rounded-lg shadow-sm flex flex-col flex-shrink-0 overflow-hidden",
          className
        )}
      >
        {/* ── Title row — always visible, never fades ───────────────────────── */}
        <div className="flex-shrink-0 relative flex items-center gap-[10px] h-[52px] px-5">
          <span className="text-base font-semibold text-foreground leading-none">
            Deal details
          </span>
          <Button
            variant="ghost"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-70"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Dynamic content — fades on row switch and on initial panel open */}
        <div
          className="flex flex-col flex-1 min-h-0"
          style={{
            opacity: isContentVisible ? 1 : 0,
            transition: `opacity ${isSwitching ? "0.3s" : "0.5s"} ease-in-out`,
            transitionDelay: isContentVisible && !isSwitching ? "450ms" : "0ms",
          }}
        >
          {/* ── Deal name / client / stage ─────────────────────────────────── */}
          <div className="flex-shrink-0 px-5 pb-4 border-b border-border">
            <div className="h-[36px] flex items-center justify-between">
              <div className="flex flex-col gap-1 font-medium items-start justify-center">
                <p className="text-sm text-foreground leading-5">{dealName}</p>
                <p className="text-xs text-muted-foreground leading-none">{client}</p>
              </div>
              {outcome ? (
                <OutcomeBadge outcome={outcome} />
              ) : isEditor ? (
                <StageDropdown
                  stage={stage}
                  totalMissing={totalMissing}
                  onStageChange={(s) => onStageChange?.(s)}
                />
              ) : (
                <StageDisplay stage={stage} />
              )}
            </div>
          </div>

          {/* ── Scrollable body ───────────────────────────────────────────── */}
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto scrollbar-panel pb-4">
            <NotesSection
              key={dealName}
              count={notesCount ?? 0}
              hasNew={!!hasNewNotes}
              notes={notes}
              canAddNote={!isPastDeal && isEditor}
              onNotesRead={() => onDealUpdate?.({ hasNewNotes: false })}
            />

            {!isPastDeal && (
              <>
                <ContentSection
                  title="Deal info"
                  icon={FileText}
                  role={role}
                  defaultOpen={true}
                >
                  <DealInfoFields
                    key={dealName}
                    dealName={dealName}
                    client={client}
                    division={division}
                    dealOwner={dealOwner}
                    dealContact={dealContact}
                    dealType={dealType}
                    startDate={parseMonthDate(startDate)}
                    endDate={parseMonthDate(endDate)}
                    probability={probability}
                    editable={isEditor}
                    onDealNameChange={(v) => onDealUpdate?.({ name: v })}
                    onClientChange={(v) => onDealUpdate?.({ client: v })}
                    onDivisionChange={(v) => onDealUpdate?.({ division: v })}
                    onDealOwnerChange={(v) => onDealUpdate?.({ owner: { name: v } })}
                    onDealContactChange={(v) => onDealUpdate?.({ dealContact: v })}
                    onDealTypeChange={(v) => {
                      setFormDealType(v)
                      onDealUpdate?.({ dealType: v as "unsure" | "tm" | "fixed" })
                    }}
                    onProbabilityChange={(v) => {
                      setFormWinProbability(v)
                      onDealUpdate?.({
                        probability: (v.charAt(0).toUpperCase() + v.slice(1)) as import("@/components/ui/table-deals").ProbabilityScore,
                      })
                    }}
                  />
                </ContentSection>

                <ContentSection
                  title="Staffing"
                  icon={Users}
                  role={role}
                  defaultOpen={true}
                >
                  <StaffingFields
                    key={dealName}
                    roles={roles}
                    strategicPriority={strategicPriority}
                    staffingPriority={staffingPriority}
                    editable={isEditor}
                    onStrategicPriorityChange={(v) => {
                      setFormStrategicPriority(v)
                      onDealUpdate?.({ strategicPriority: v as "p0" | "p1" | "p2" })
                    }}
                    onRolesChange={(r) =>
                      onDealUpdate?.({ roles: r as import("@/components/ui/table-deals").RoleCount[] })
                    }
                  />
                </ContentSection>

                <ContentSection
                  title="Scope"
                  icon={FileSearch}
                  role={role}
                  defaultOpen={true}
                >
                  <ScopeFields
                    key={dealName}
                    scopeOfWork={scopeOfWork}
                    projectBrief={projectBrief}
                    editable={isEditor}
                    onProjectBriefChange={(v) => {
                      setFormProjectBrief(v)
                      onDealUpdate?.({ projectBrief: v })
                    }}
                  />
                </ContentSection>
              </>
            )}
          </div>
        </div>

        {/* ── Sticky footer — active deals, editor role only ──────────────── */}
        {!isPastDeal && isEditor && (
          <div className="flex-shrink-0 h-[84px] border-t border-border px-6 flex items-center justify-between">
            {totalMissing === 0 ? (
              <div className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>Ready for {movePhrase}</span>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => missingFields.length > 0 && scrollToField(missingFields[0].id)}
                    className="inline-flex items-center gap-1 border border-border bg-background rounded-full pl-2 pr-3 py-1 text-sm font-medium text-badge-warning-fg cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{totalMissing} field{totalMissing === 1 ? "" : "s"} missing for {movePhrase}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-[200px]">
                  <ol className="list-none space-y-1 text-sm">
                    {missingFields.map((f, i) => (
                      <li key={f.id}>{i + 1}. {f.label}</li>
                    ))}
                  </ol>
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              disabled={totalMissing > 0}
              className={cn(totalMissing > 0 && "opacity-50")}
              onClick={() => {
                if (totalMissing === 0) {
                  const next = stage === "L1" ? "L2" : stage === "L2" ? "L3" : "Project"
                  onStageChange?.(next)
                }
              }}
            >
              {stage === "L1" ? "Move to L2"
                : stage === "L2" ? "Move to L3"
                : "Convert to Project"}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
