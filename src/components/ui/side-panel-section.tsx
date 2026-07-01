import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/** Rotating chevron used in accordion-style side panel sections. */
export function AccordionChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className="h-4 w-4 text-muted-foreground flex-shrink-0"
      style={{
        transform:  open ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 200ms ease-in-out',
      }}
    />
  )
}

/**
 * Animated collapsible body — CSS grid-template-rows trick.
 * Overflow becomes visible only after the open animation completes so
 * descendant focus rings are never clipped mid-transition.
 */
export function AccordionBody({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) {
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
        display:           'grid',
        gridTemplateRows:  open ? '1fr' : '0fr',
        gridTemplateColumns: 'minmax(0, 1fr)',
        transition:        'grid-template-rows 200ms ease-in-out',
      }}
    >
      <div style={{ overflow: overflowVisible ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/**
 * Collapsible section shell for side panels.
 * Renders a border-top header with label + chevron, and an animated body.
 * Padding is always px-5 (20px) — no role variants.
 *
 * Used in: Person Details panel (sections 2 + 3).
 */
export function SidePanelSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border w-full px-5">
      <button
        type="button"
        className="py-4 flex items-center justify-between w-full"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium text-foreground leading-none">
          {title}
        </span>
        <AccordionChevron open={open} />
      </button>

      {children && (
        <AccordionBody open={open}>
          <div className="pb-4">{children}</div>
        </AccordionBody>
      )}
    </div>
  )
}
