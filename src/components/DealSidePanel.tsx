import { useEffect, useRef, useState } from "react"
import type { DealData } from "./ui/table-deals"
import { DealDetailsSidePanelShell } from "./deals/DealDetailsSidePanelShell"
import { useRole } from "@/roles/role-context"

interface DealSidePanelProps {
  deal: DealData | null
  isOpen: boolean
  onClose: () => void
  onDealUpdate?: (dealId: string, updates: Partial<DealData>) => void
}

const EASING = "cubic-bezier(0.4, 0, 0.2, 1)"
const SLIDE_DURATION = "0.35s"
const CROSS_FADE_MS = 300

export function DealSidePanel({ deal, isOpen, onClose, onDealUpdate }: DealSidePanelProps) {
  const { role } = useRole()
  // The deal actually rendered — trails behind `deal` during a cross-fade.
  const [displayedDeal, setDisplayedDeal] = useState<DealData | null>(deal)
  // Whether the shell content should be opaque.
  const [contentVisible, setContentVisible] = useState(false)
  // When true the shell uses a faster (300ms, no-delay) transition instead of
  // the initial-open transition (500ms + 450ms slide-wait delay).
  const [isSwitching, setIsSwitching] = useState(false)

  const wasOpen = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Cancel any in-flight cross-fade timer (rapid row clicks).
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!isOpen) {
      setContentVisible(false)
      setIsSwitching(false)
      wasOpen.current = false
      return
    }

    if (!wasOpen.current) {
      // ── Panel is opening for the first time ──────────────────────────────
      // Show the deal immediately; the shell's 450ms slide-delay handles when
      // the content fades in (after the panel has slid into place).
      setIsSwitching(false)
      setDisplayedDeal(deal)
      setContentVisible(true)
      wasOpen.current = true
      return
    }

    // ── Panel already open: user clicked a different row ──────────────────
    // Phase A: fade content out (CROSS_FADE_MS).
    setIsSwitching(true)
    setContentVisible(false)

    // Phase B: after fade-out completes, swap deal and fade back in.
    timerRef.current = setTimeout(() => {
      setDisplayedDeal(deal)
      setContentVisible(true)
    }, CROSS_FADE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [deal?.id, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    /*
     * Phase 1 — slide: width 0 ↔ 420px pushes the table via flex.
     * marginLeft cancels the parent gap-[10px] when closed → zero dead space.
     */
    <div
      className="overflow-hidden flex-shrink-0 h-full"
      style={{
        width: isOpen ? 420 : 0,
        marginLeft: isOpen ? 0 : -10,
        transition: `width ${SLIDE_DURATION} ${EASING}, margin-left ${SLIDE_DURATION} ${EASING}`,
      }}
    >
      <div className="w-[420px] h-full">
        <DealDetailsSidePanelShell
          onClose={onClose}
          dealName={displayedDeal?.name ?? ""}
          client={displayedDeal?.client ?? ""}
          stage={displayedDeal?.stage ?? "L1"}
          division={displayedDeal?.division}
          dealOwner={displayedDeal?.owner.name}
          dealContact={displayedDeal?.dealContact}
          dealType={displayedDeal?.dealType}
          startDate={displayedDeal?.startDate}
          endDate={displayedDeal?.endDate}
          probability={displayedDeal?.probability}
          roles={displayedDeal?.roles}
          strategicPriority={displayedDeal?.strategicPriority}
          staffingPriority={displayedDeal?.staffingPriority}
          scopeOfWork={displayedDeal?.scopeOfWork}
          projectBrief={displayedDeal?.projectBrief}
          outcome={displayedDeal?.outcome}
          notesCount={displayedDeal?.notesCount}
          hasNewNotes={displayedDeal?.hasNewNotes}
          notes={displayedDeal?.notes}
          isContentVisible={contentVisible}
          isSwitching={isSwitching}
          role={role}
          onDealUpdate={(updates) => {
            if (displayedDeal?.id) onDealUpdate?.(displayedDeal.id, updates)
          }}
          onStageChange={(newStage) => {
            if (displayedDeal?.id) onDealUpdate?.(displayedDeal.id, { stage: newStage as import("@/components/ui/table-deals").StageType })
          }}
        />
      </div>
    </div>
  )
}
