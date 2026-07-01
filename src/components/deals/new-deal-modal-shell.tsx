import * as React from "react"
import { X, Info, GripVertical, Plus, Minus } from "lucide-react"
import { useScrollIndicator } from "@/hooks/useScrollIndicator"
import * as PopoverPrimitive from "@radix-ui/react-popover"
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

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Stepper } from "@/components/ui/stepper"
import { FieldLabel } from "@/components/ui/field-label"
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card"
import { DatePicker } from "@/components/ui/date-picker"
import { InputGroup } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Step } from "@/components/ui/stepper"

const DEAL_OWNERS = ["Karl", "AJ", "Ena", "Erad", "Kenny", "Tzahi"]

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type DealStep = 1 | 2 | 3

export type DealStage = "L1" | "L2" | "L3"

export type WinProbability = "low" | "medium" | "high" | "unsure"

const WIN_PROBABILITY_BY_STAGE: Record<DealStage, WinProbability> = {
  L1: "low",
  L2: "medium",
  L3: "high",
}

export interface NewDealFormData {
  name: string
  client: string
  dealOwner: string
  stage: DealStage
  startDate: Date
  endDate: Date
  roles: RoleRow[]
}

interface NewDealModalShellProps {
  /** Which step to display. */
  step?: DealStep
  /** Called when the user clicks the × close button. */
  onClose?: () => void
  /** Called when the user clicks Back. */
  onBack?: () => void
  /** Called when the user clicks Cancel. */
  onCancel?: () => void
  /** Called when the user clicks Continue (steps 1–2) or Create Deal (step 3). */
  onPrimary?: () => void
  /** Called when the user completes all 3 steps and creates a deal. */
  onCreateDeal?: (data: NewDealFormData) => void
  className?: string
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const STEPS: Step[] = [
  { id: 1, label: "Deal info", state: "current" },
  { id: 2, label: "Staffing", state: "inactive" },
  { id: 3, label: "Scope", state: "inactive" },
]

function buildSteps(activeStep: DealStep): Step[] {
  return STEPS.map((s) => ({
    ...s,
    state:
      s.id < activeStep
        ? "completed"
        : s.id === activeStep
          ? "current"
          : "inactive",
  }))
}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

/* ─── Field error message ───────────────────────────────────────────────────── */

function FieldError({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      This field is required
    </p>
  )
}

/* ─── Step 1 ─────────────────────────────────────────────────────────────────── */

interface Step1Fields {
  projectName: string
  client: string
  dealContact: string
  startDate: Date | undefined
  endDate: Date | undefined
  dealOwner: string
  dealStage: DealStage
  winProbability: WinProbability
}

interface Step1ContentProps extends Step1Fields {
  showErrors: boolean
  onChange: <K extends keyof Step1Fields>(field: K, value: Step1Fields[K]) => void
}

function Step1Content({
  projectName,
  client,
  dealContact,
  startDate,
  endDate,
  dealOwner,
  dealStage,
  winProbability,
  showErrors,
  onChange,
}: Step1ContentProps) {
  const [ownerOpen, setOwnerOpen] = React.useState(false)
  const filteredOwners = DEAL_OWNERS.filter(
    (o) => o.toLowerCase().includes(dealOwner.toLowerCase())
  )
  return (
    <div className="flex flex-col gap-7">

      {/* Deal phase — first in form per design; changing stage auto-sets win probability */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel>Deal phase</FieldLabel>
        <RadioCardGroup
          value={dealStage}
          onValueChange={(v) => {
            const stage = v as DealStage
            onChange("dealStage", stage)
            onChange("winProbability", WIN_PROBABILITY_BY_STAGE[stage])
          }}
          className="grid grid-cols-3 gap-2"
        >
          <RadioCardItem value="L1" label="L1 - Exploration" />
          <RadioCardItem value="L2" label="L2 - Scoping" />
          <RadioCardItem value="L3" label="L3 - Closing" />
        </RadioCardGroup>
      </div>

      {/* Project name */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="project-name">Project name</FieldLabel>
        <Input
          id="project-name"
          value={projectName}
          onChange={(e) => onChange("projectName", e.target.value)}
          className={cn(showErrors && !projectName.trim() && "border-destructive focus-visible:ring-destructive")}
        />
        <FieldError show={showErrors && !projectName.trim()} />
      </div>

      {/* Client | Division (optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2.5">
          <FieldLabel htmlFor="client">Client</FieldLabel>
          <Input
            id="client"
            value={client}
            onChange={(e) => onChange("client", e.target.value)}
            className={cn(showErrors && !client.trim() && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError show={showErrors && !client.trim()} />
        </div>
        <div className="flex flex-col gap-2.5">
          <FieldLabel htmlFor="division" optional>Division</FieldLabel>
          <InputGroup
            id="division"
            rightElement={<Info className="h-4 w-4 opacity-40" aria-hidden="true" />}
          />
        </div>
      </div>

      {/* Deal contact — full width */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="deal-contact">Deal contact</FieldLabel>
        <InputGroup
          id="deal-contact"
          value={dealContact}
          onChange={(e) => onChange("dealContact", e.target.value)}
          error={showErrors && !dealContact.trim()}
          rightElement={<Info className="h-4 w-4 opacity-40" aria-hidden="true" />}
        />
        <FieldError show={showErrors && !dealContact.trim()} />
      </div>

      {/* Deal owner — text input with autocomplete dropdown */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="deal-owner">Deal owner</FieldLabel>
        <Popover open={ownerOpen && filteredOwners.length > 0} onOpenChange={setOwnerOpen}>
          <PopoverPrimitive.Anchor asChild>
            <InputGroup
              id="deal-owner"
              value={dealOwner}
              onChange={(e) => {
                onChange("dealOwner", e.target.value)
                setOwnerOpen(true)
              }}
              onFocus={() => setOwnerOpen(true)}
              onBlur={() => setTimeout(() => setOwnerOpen(false), 100)}
              error={showErrors && !dealOwner.trim()}
              rightElement={<Info className="h-4 w-4 opacity-40" aria-hidden="true" />}
            />
          </PopoverPrimitive.Anchor>
          <PopoverContent
            align="start"
            className="p-1"
            style={{ width: "var(--radix-popover-anchor-width)" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {filteredOwners.map((owner) => (
              <button
                key={owner}
                type="button"
                className="flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange("dealOwner", owner)
                  setOwnerOpen(false)
                }}
              >
                {owner}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <FieldError show={showErrors && !dealOwner.trim()} />
      </div>

      {/* Start date | End date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2.5">
          <FieldLabel htmlFor="start-date">Start date</FieldLabel>
          <DatePicker
            id="start-date"
            value={startDate}
            onChange={(date) => {
              onChange("startDate", date)
              if (date && endDate && endDate < date) onChange("endDate", undefined)
            }}
            minDate={TODAY}
            error={showErrors && !startDate}
          />
          <FieldError show={showErrors && !startDate} />
        </div>
        <div className="flex flex-col gap-2.5">
          <FieldLabel htmlFor="end-date">End date</FieldLabel>
          <DatePicker
            id="end-date"
            value={endDate}
            onChange={(date) => onChange("endDate", date)}
            minDate={startDate ?? TODAY}
            error={showErrors && !endDate}
          />
          <FieldError show={showErrors && !endDate} />
        </div>
      </div>

      {/* Win probability — auto-set by deal phase, user can override */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel>Win probability</FieldLabel>
        <RadioCardGroup
          value={winProbability}
          onValueChange={(v) => onChange("winProbability", v as WinProbability)}
          className="grid grid-cols-4 gap-2"
        >
          <RadioCardItem value="low" label="Low" />
          <RadioCardItem value="medium" label="Medium" />
          <RadioCardItem value="high" label="High" />
          <RadioCardItem value="unsure" label="Unsure" />
        </RadioCardGroup>
      </div>
    </div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────────────────────────── */

type FteRole = "TL" | "Eng" | "PM" | "TPM" | "UX" | "QA"
const FTE_ROLES: FteRole[] = ["TL", "Eng", "PM", "TPM", "UX", "QA"]

interface RoleRow {
  id: string
  role: FteRole | ""
  hours_per_week: number
}

interface Step2Fields {
  projectLead: string
  roles: RoleRow[]
}

interface Step2ContentProps extends Step2Fields {
  onChange: <K extends keyof Step2Fields>(field: K, value: Step2Fields[K]) => void
}

/* ─── Sortable role row ─────────────────────────────────────────────────────── */

const HOURS_STEP = 5
const HOURS_MAX = 200

interface SortableRoleRowProps {
  row: RoleRow
  onRoleChange: (role: FteRole | "") => void
  onHoursChange: (newHours: number) => void
  onRemove: () => void
}

function SortableRoleRow({ row, onRoleChange, onHoursChange, onRemove }: SortableRoleRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  const [inputValue, setInputValue] = React.useState<string | null>(null)
  const isEditing = inputValue !== null

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
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg bg-muted p-1"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Role select */}
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

      {/* Hours-per-week stepper */}
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
          {isEditing ? (
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

      {/* Remove row */}
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

/* ─── Step 2 ─────────────────────────────────────────────────────────────────── */

let _rowCounter = 100

function Step2Content({ projectLead, roles, onChange }: Step2ContentProps) {
  const [leadOpen, setLeadOpen] = React.useState(false)
  const filteredLeads = DEAL_OWNERS.filter(
    (o) => o.toLowerCase().includes(projectLead.toLowerCase())
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = roles.findIndex((r) => r.id === active.id)
      const newIndex = roles.findIndex((r) => r.id === over.id)
      onChange("roles", arrayMove(roles, oldIndex, newIndex))
    }
  }

  function addSeat() {
    const newRow: RoleRow = { id: String(++_rowCounter), role: "", hours_per_week: 0 }
    onChange("roles", [...roles, newRow])
  }

  function updateRole(id: string, role: FteRole | "") {
    onChange("roles", roles.map((r) => (r.id === id ? { ...r, role } : r)))
  }

  function updateHours(id: string, newHours: number) {
    onChange(
      "roles",
      roles.map((r) => (r.id === id ? { ...r, hours_per_week: newHours } : r))
    )
  }

  function removeRow(id: string) {
    onChange("roles", roles.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Required roles */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <FieldLabel>Required roles</FieldLabel>
          <Button variant="secondary" size="sm" type="button" onClick={addSeat}>
            Add seat
          </Button>
        </div>

        {roles.length === 0 ? (
          <div className="flex h-12 items-center justify-center rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">No roles added.</span>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={roles.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2.5">
                {roles.map((row) => (
                  <SortableRoleRow
                    key={row.id}
                    row={row}
                    onRoleChange={(role) => updateRole(row.id, role)}
                    onHoursChange={(hours) => updateHours(row.id, hours)}
                    onRemove={() => removeRow(row.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Strategic Priority */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel>Strategic Priority</FieldLabel>
        <RadioCardGroup defaultValue="p0" className="grid grid-cols-3 gap-2">
          <RadioCardItem value="p0" label="P0" />
          <RadioCardItem value="p1" label="P1" />
          <RadioCardItem value="p2" label="P2" />
        </RadioCardGroup>
      </div>

      {/* Staffing Priority */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel>Staffing Priority</FieldLabel>
        <RadioCardGroup defaultValue="p0" className="grid grid-cols-3 gap-2">
          <RadioCardItem value="p0" label="P0" />
          <RadioCardItem value="p1" label="P1" />
          <RadioCardItem value="p2" label="P2" />
        </RadioCardGroup>
      </div>

      {/* Project Lead — optional autocomplete */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="project-lead" optional>Project Lead</FieldLabel>
        <Popover open={leadOpen && filteredLeads.length > 0} onOpenChange={setLeadOpen}>
          <PopoverPrimitive.Anchor asChild>
            <InputGroup
              id="project-lead"
              value={projectLead}
              onChange={(e) => {
                onChange("projectLead", e.target.value)
                setLeadOpen(true)
              }}
              onFocus={() => setLeadOpen(true)}
              onBlur={() => setTimeout(() => setLeadOpen(false), 100)}
            />
          </PopoverPrimitive.Anchor>
          <PopoverContent
            align="start"
            className="p-1"
            style={{ width: "var(--radix-popover-anchor-width)" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {filteredLeads.map((name) => (
              <button
                key={name}
                type="button"
                className="flex w-full items-center rounded-sm px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange("projectLead", name)
                  setLeadOpen(false)
                }}
              >
                {name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

/* ─── Step 3 ─────────────────────────────────────────────────────────────────── */

interface Step3Fields {
  projectContact: string
  projectBrief: string
  scopeOfWork: string
}

interface Step3ContentProps extends Step3Fields {
  onChange: <K extends keyof Step3Fields>(field: K, value: Step3Fields[K]) => void
}

function Step3Content({ projectContact, projectBrief, scopeOfWork, onChange }: Step3ContentProps) {
  return (
    <div className="flex flex-col gap-7">
      {/* Project Contact — optional, (i) icon, free-text (external email) */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="project-contact" optional>
          Project Contact
        </FieldLabel>
        <InputGroup
          id="project-contact"
          placeholder=""
          value={projectContact}
          onChange={(e) => onChange("projectContact", e.target.value)}
          rightElement={<Info className="h-4 w-4 opacity-40" aria-hidden="true" />}
        />
      </div>

      {/* Project Brief — optional */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="project-brief" optional>Project Brief</FieldLabel>
        <Textarea
          id="project-brief"
          placeholder="Summarise the project goals, background, and key success metrics…"
          className="min-h-[120px] resize-none"
          value={projectBrief}
          onChange={(e) => onChange("projectBrief", e.target.value)}
        />
      </div>

      {/* Scope of Work — optional */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel htmlFor="scope-of-work" optional>Scope of Work</FieldLabel>
        <Textarea
          id="scope-of-work"
          placeholder="List the deliverables, milestones, and any explicit exclusions…"
          className="min-h-[140px] resize-none"
          value={scopeOfWork}
          onChange={(e) => onChange("scopeOfWork", e.target.value)}
        />
      </div>
    </div>
  )
}

/* ─── Scrollable step wrapper ───────────────────────────────────────────────── */

/**
 * Mounts its own ref + useScrollIndicator so the hook re-initialises each
 * time a new step is mounted (the parent uses key={step} to remount this).
 */
function ScrollableStep({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useScrollIndicator(ref, { timeoutMs: 600 })
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/* ─── Shell ─────────────────────────────────────────────────────────────────── */

/**
 * NewDealModalShell — presentational layout shell for the "New Deal"
 * 3-step modal.
 *
 * Layout tokens (all from Figma node 500:15509 / Design System):
 *   width          640px           (exact Figma frame width)
 *   radius         rounded-lg      border-radius/rounded-lg = --radius-lg = 10px
 *   shadow         shadow-lg       shadow/lg (2-layer: 10px/15px + 4px/6px)
 *   header pad     pt-10 px-10     spacing/10 = 40px
 *   title→stepper  mb-2            spacing/2 = 8px
 *   stepper→form   pb-9            spacing/9 = 36px (Figma parent gap)
 *   form side pad  px-10           spacing/10 = 40px
 *   form gap       gap-7           spacing/7 = 28px between field groups
 *   label→input    gap-2           spacing/2 = 8px
 *   footer pad     p-6             spacing/6 = 24px
 *   close icon     right/top 23px  rounded-xs, opacity-70
 */
export function NewDealModalShell({
  step = 1,
  onClose,
  onBack,
  onCancel,
  onPrimary,
  onCreateDeal,
  className,
}: NewDealModalShellProps) {
  const steps = buildSteps(step)
  const isFirstStep = step === 1
  const isLastStep = step === 3
  const primaryLabel = isLastStep ? "Create Deal" : "Continue"

  /* ── Form state ── */
  const [step1, setStep1] = React.useState<Step1Fields>({
    projectName: "",
    client: "",
    dealContact: "",
    startDate: undefined,
    endDate: undefined,
    dealOwner: "",
    dealStage: "L1",
    winProbability: "low",
  })
  const [step2, setStep2] = React.useState<Step2Fields>({
    projectLead: "",
    roles: [
      { id: "r1", role: "TL", hours_per_week: 0 },
      { id: "r2", role: "Eng", hours_per_week: 0 },
      { id: "r3", role: "PM", hours_per_week: 0 },
      { id: "r4", role: "TPM", hours_per_week: 0 },
    ],
  })
  const [step3, setStep3] = React.useState<Step3Fields>({
    projectContact: "",
    projectBrief: "",
    scopeOfWork: "",
  })

  /* showErrors is reset each time the user lands on a new step */
  const [showErrors, setShowErrors] = React.useState(false)

  function updateStep1<K extends keyof Step1Fields>(field: K, value: Step1Fields[K]) {
    setStep1((prev) => ({ ...prev, [field]: value }))
  }
  function updateStep2<K extends keyof Step2Fields>(field: K, value: Step2Fields[K]) {
    setStep2((prev) => ({ ...prev, [field]: value }))
  }
  function updateStep3<K extends keyof Step3Fields>(field: K, value: Step3Fields[K]) {
    setStep3((prev) => ({ ...prev, [field]: value }))
  }

  function validateCurrentStep(): boolean {
    // Validation temporarily disabled for development/testing
    if (step === 1) {
      return true
    }
    if (step === 2) {
      return true
    }
    if (step === 3) {
      return true
    }
    return true
  }

  function handlePrimary() {
    if (!validateCurrentStep()) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    if (isLastStep && step1.startDate && step1.endDate) {
      onCreateDeal?.({
        name: step1.projectName,
        client: step1.client,
        dealOwner: step1.dealOwner,
        stage: step1.dealStage,
        startDate: step1.startDate,
        endDate: step1.endDate,
        roles: step2.roles,
      })
    }
    onPrimary?.()
  }

  function handleBack() {
    setShowErrors(false)
    onBack?.()
  }

  /* ── Step transition animation ── */
  const [animating, setAnimating] = React.useState(false)
  const [prevStep, setPrevStep] = React.useState<DealStep | null>(null)
  const [animDir, setAnimDir] = React.useState<"forward" | "backward">("forward")
  const prevStepRef = React.useRef<DealStep>(step)

  React.useEffect(() => {
    if (step !== prevStepRef.current) {
      const dir = step > prevStepRef.current ? "forward" : "backward"
      setPrevStep(prevStepRef.current)
      setAnimDir(dir)
      setAnimating(true)
      prevStepRef.current = step
      const t = setTimeout(() => {
        setPrevStep(null)
        setAnimating(false)
      }, 340)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div
      className={cn(
        "relative flex w-full max-w-[640px] max-h-[90vh] flex-col overflow-hidden",
        "rounded-lg border border-border bg-background shadow-lg",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-deal-title"
    >
      {/* Close icon */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={cn(
          "absolute right-6 top-6 z-10",
          "rounded-xs opacity-70 text-foreground",
          "transition-opacity hover:opacity-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* ── Steps header ── */}
      <div className="flex shrink-0 flex-col gap-1.5 px-10 pt-10 pb-9">
        <div className="pb-2">
          <h2
            id="new-deal-title"
            className="text-2xl font-medium leading-8 text-foreground"
          >
            New Deal
          </h2>
        </div>
        <Stepper steps={steps} />
      </div>

      {/* ── Body ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Exiting panel — CSS class only, no hook needed (animating out) */}
        {animating && prevStep !== null && (
          <div
            className={cn(
              "absolute inset-0 overflow-y-auto scrollbar-minimal pl-10 pr-9 pb-6",
              animDir === "forward"
                ? "animate-step-exit-left"
                : "animate-step-exit-right",
            )}
          >
            {prevStep === 1 && (
              <Step1Content {...step1} showErrors={showErrors} onChange={updateStep1} />
            )}
            {prevStep === 2 && (
              <Step2Content {...step2} onChange={updateStep2} />
            )}
            {prevStep === 3 && (
              <Step3Content {...step3} onChange={updateStep3} />
            )}
          </div>
        )}

        {/* Entering / current panel — ScrollableStep remounts on key={step}, reinitialising the hook */}
        <ScrollableStep
          key={step}
          className={cn(
            "absolute inset-0 overflow-y-auto scrollbar-minimal pl-10 pr-9 pb-6",
            animating
              ? animDir === "forward"
                ? "animate-step-enter-from-right"
                : "animate-step-enter-from-left"
              : "",
          )}
        >
          {step === 1 && (
            <Step1Content {...step1} showErrors={showErrors} onChange={updateStep1} />
          )}
          {step === 2 && (
            <Step2Content {...step2} onChange={updateStep2} />
          )}
          {step === 3 && (
            <Step3Content {...step3} onChange={updateStep3} />
          )}
        </ScrollableStep>
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-between border-t border-border p-6">
        <div>
          {!isFirstStep && (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handlePrimary}>{primaryLabel}</Button>
        </div>
      </div>
    </div>
  )
}
