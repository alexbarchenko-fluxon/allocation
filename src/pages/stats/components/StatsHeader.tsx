import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StatsHeader() {
  return (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-2xl font-normal text-foreground">Stats</h1>
      
      <Button variant="outline" size="sm" className="gap-2 h-9 shadow-xs">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Jan 19 '26</span>
      </Button>
    </div>
  )
}
