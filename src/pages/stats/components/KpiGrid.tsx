import type { ReactNode } from 'react'

interface KpiGridProps {
  children: ReactNode
}

export default function KpiGrid({ children }: KpiGridProps) {
  return (
    <div className="flex gap-6 w-full">
      {children}
    </div>
  )
}
