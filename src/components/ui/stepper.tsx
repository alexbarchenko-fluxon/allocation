import { CircleCheck } from "lucide-react"

import { cn } from "@/lib/utils"

export type StepState = "completed" | "current" | "inactive"

export interface Step {
  id: number
  label: string
  state: StepState
}

interface StepperProps {
  steps: Step[]
  className?: string
}

const Stepper = ({ steps, className }: StepperProps) => {
  return (
    <nav
      style={{ display: "flex", width: "100%", gap: "8px" }}
      className={cn(className)}
      aria-label="Progress steps"
    >
      {steps.map((step) => (
        <div
          key={step.id}
          style={{ display: "flex", flexDirection: "column", flex: "1 0 0", minWidth: 0, gap: "6px" }}
          aria-current={step.state === "current" ? "step" : undefined}
        >
          {/* 6 px progress bar — fully inline to avoid any Tailwind/OKLCH issues */}
          <div
            style={{
              height: "6px",
              width: "100%",
              borderRadius: "9999px",
              flexShrink: 0,
              backgroundColor: "var(--primary)",
              opacity: step.state === "inactive" ? 0.2 : 1,
            }}
            aria-hidden="true"
          />

          {/* Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {step.state === "completed" && (
              <CircleCheck
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "text-sm leading-5 whitespace-nowrap",
                step.state === "current" && "font-medium text-primary",
                step.state === "completed" && "font-medium text-muted-foreground",
                step.state === "inactive" && "font-normal text-muted-foreground"
              )}
            >
              <span className="sr-only">Step {step.id}: </span>
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </nav>
  )
}

Stepper.displayName = "Stepper"

export { Stepper }
export type { StepperProps }
