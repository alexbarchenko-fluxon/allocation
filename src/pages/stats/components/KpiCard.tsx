import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface KpiCardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  showInfo?: boolean
}

export default function KpiCard({ label, value, change, trend, showInfo = false }: KpiCardProps) {
  return (
    <div className="bg-muted rounded-xl p-6 flex flex-col gap-3 min-w-[220px]">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-normal text-muted-foreground">{label}</p>
        <p className="text-5xl font-extralight leading-none">{value}</p>
      </div>
      
      {(change !== undefined || showInfo) && (
        <div className="flex items-center gap-1.5">
          {change !== undefined && (
            <>
              <Badge 
                variant={trend === 'down' ? 'destructive' : 'default'}
                className={`gap-1 ${trend === 'up' ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </Badge>
              <span className="text-sm font-normal">WoW</span>
            </>
          )}
          
          {showInfo && (
            <Button variant="outline" size="icon" className="h-8 w-8 ml-auto shadow-xs">
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
