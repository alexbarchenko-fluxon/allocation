import * as React from "react"
import { createPortal } from "react-dom"

import { NewDealModalShell, type DealStep, type NewDealFormData } from "./new-deal-modal-shell"

interface NewDealModalProps {
  open: boolean
  step: DealStep
  onClose: () => void
  onBack: () => void
  onCancel: () => void
  onPrimary: () => void
  onCreateDeal: (data: NewDealFormData) => void
}

/**
 * Sequential open animation:
 *   1. Backdrop fades from 0 → 40% opacity  (500ms)
 *   2. Modal slides up from +40px / 0% opacity → target / 100% opacity  (400ms)
 *
 * Sequential close animation:
 *   1. Modal slides up to -40px / 0% opacity  (350ms)
 *   2. Backdrop fades from 40% → 0% opacity  (450ms)
 */
export function NewDealModal({
  open,
  step,
  onClose,
  onBack,
  onCancel,
  onPrimary,
  onCreateDeal,
}: NewDealModalProps) {
  const [rendered, setRendered] = React.useState(false)
  const [backdropShown, setBackdropShown] = React.useState(false)
  const [modalShown, setModalShown] = React.useState(false)
  const [isExiting, setIsExiting] = React.useState(false)
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([])

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  React.useEffect(() => {
    clearAll()

    if (open) {
      setRendered(true)
      // One frame to mount, then start backdrop fade-in
      const t1 = setTimeout(() => {
        setBackdropShown(true)
        // After backdrop finishes, slide modal in
        const t2 = setTimeout(() => {
          setModalShown(true)
        }, 500)
        timers.current.push(t2)
      }, 16)
      timers.current.push(t1)
    } else {
      // Slide modal out upward
      setIsExiting(true)
      setModalShown(false)
      const t1 = setTimeout(() => {
        // Then fade backdrop out
        setBackdropShown(false)
        const t2 = setTimeout(() => {
          setRendered(false)
          setIsExiting(false)
        }, 450)
        timers.current.push(t2)
      }, 350)
      timers.current.push(t1)
    }

    return clearAll
  }, [open])

  // Escape key support
  React.useEffect(() => {
    if (!rendered) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [rendered, onClose])

  if (!rendered) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgb(var(--modal-scrim) / 0.2)`,
          opacity: backdropShown ? 1 : 0,
          transition: backdropShown
            ? "opacity 500ms ease-out"
            : "opacity 450ms ease-in",
        }}
      />

      {/* ── Modal ── */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "640px",
          height: "calc(100vh - 80px)",
          opacity: modalShown ? 1 : 0,
          transform: modalShown
            ? "translateX(-50%) translateY(-50%)"
            : isExiting
              ? "translateX(-50%) translateY(calc(-50% - 40px))"
              : "translateX(-50%) translateY(calc(-50% + 40px))",
          transition: modalShown
            ? "opacity 400ms ease-out, transform 400ms ease-out"
            : "opacity 350ms ease-in, transform 350ms ease-in",
          pointerEvents: modalShown ? "auto" : "none",
        }}
      >
        <NewDealModalShell
          step={step}
          className="h-full max-h-full"
          onClose={onClose}
          onBack={onBack}
          onCancel={onCancel}
          onCreateDeal={onCreateDeal}
          onPrimary={onPrimary}
        />
      </div>
    </div>,
    document.body,
  )
}
