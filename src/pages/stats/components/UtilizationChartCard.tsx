import { Info, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { utilizationData } from '../mockData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'

interface UtilizationChartCardProps {
  standalone?: boolean // When true, renders with card wrapper for Storybook
}

export default function UtilizationChartCard({ standalone = false }: UtilizationChartCardProps) {
  const chartContent = (
    <div className="flex flex-col gap-6 px-12 py-10 h-[383px]">
      <div className="flex gap-2 items-center pb-3">
        <h3 className="text-lg font-normal">Utilization for</h3>
        
        <Button variant="outline" size="sm" className="gap-2 h-8 shadow-xs">
          <span className="text-xs font-medium">All teams</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon" className="h-8 w-8 shadow-xs">
          <Info className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={utilizationData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 120]}
              allowDataOverflow={false}
            />
            <Bar dataKey="billable" stackId="a" radius={[0, 0, 2, 2]}>
              {utilizationData.map((entry, index) => (
                <Cell 
                  key={`cell-billable-${index}`} 
                  fill="#3e5dff"
                  opacity={entry.isFuture ? 0.4 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="growth" stackId="a" radius={[0, 0, 0, 0]}>
              {utilizationData.map((entry, index) => (
                <Cell 
                  key={`cell-growth-${index}`} 
                  fill="#3e5dff"
                  opacity={entry.isFuture ? 0.2 : 0.5}
                />
              ))}
            </Bar>
            <Bar dataKey="overhead" stackId="a" radius={[2, 2, 0, 0]}>
              {utilizationData.map((entry, index) => (
                <Cell 
                  key={`cell-overhead-${index}`} 
                  fill="#fbbf24"
                  opacity={entry.isFuture ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  if (standalone) {
    return (
      <div className="bg-card border border-border rounded-xl w-full">
        {chartContent}
      </div>
    );
  }
  
  return chartContent;
}
