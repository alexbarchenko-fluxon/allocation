import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

interface DataPoint {
  date: string
  value: number
}

interface AreaChartCardProps {
  title: string
  data: DataPoint[]
  standalone?: boolean // When true, renders with card wrapper for Storybook
  xAxisTicks?: string[] // Optional custom ticks for x-axis
}

export default function AreaChartCard({ title, data, standalone = false, xAxisTicks }: AreaChartCardProps) {
  const chartContent = (
    <div className="flex flex-col gap-6 p-12 pb-10">
        <div className="flex gap-2 items-center pb-3">
          <h3 className="text-lg font-normal">{title}</h3>
          <Button variant="outline" size="icon" className="h-8 w-8 shadow-xs">
            <Info className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-[235px] flex flex-col justify-end">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3e5dff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3e5dff" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="0" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
                {...(xAxisTicks && { ticks: xAxisTicks })}
              />
              <YAxis 
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                domain={[0, 'auto']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3e5dff"
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  
  if (standalone) {
    return (
      <div className="bg-card border border-border rounded-xl flex-1 min-w-0">
        {chartContent}
      </div>
    );
  }
  
  return (
    <div className="flex-1 min-w-0">
      {chartContent}
    </div>
  );
}
