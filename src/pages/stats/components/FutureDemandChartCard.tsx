import { Info, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { futureDemandData } from '../mockData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'

interface FutureDemandChartCardProps {
  standalone?: boolean // When true, renders with card wrapper for Storybook
}

export default function FutureDemandChartCard({ standalone = false }: FutureDemandChartCardProps) {
  const chartContent = (
    <div className="flex flex-col gap-6 px-12 py-10 h-[383px]">
      <div className="flex gap-2 items-center pb-3">
        <h3 className="text-lg font-normal">Future demand for</h3>
        
        <Button variant="outline" size="sm" className="gap-2 h-8 shadow-xs">
          <span className="text-xs font-medium">Engineer</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon" className="h-8 w-8 shadow-xs">
          <Info className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={futureDemandData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="week" 
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              angle={0}
              dy={10}
            />
            <YAxis 
              axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, 1600]}
              allowDataOverflow={false}
            />
            <Bar dataKey="allocated" radius={[2, 2, 2, 2]} barSize={20}>
              {futureDemandData.map((_entry, index) => (
                <Cell 
                  key={`cell-allocated-${index}`}
                  fill="#f472b6"
                  opacity={index >= 5 ? 0.4 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="available" radius={[2, 2, 2, 2]} barSize={20}>
              {futureDemandData.map((_entry, index) => (
                <Cell 
                  key={`cell-available-${index}`}
                  fill="#3e5dff"
                  opacity={index >= 5 ? 0.4 : 1}
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
