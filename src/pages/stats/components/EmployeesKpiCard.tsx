interface EmployeesKpiCardProps {
  total: number
  segments: Array<{
    label: string
    value: number
    legendColor: string // Color for legend square
  }>
}

export default function EmployeesKpiCard({ total, segments }: EmployeesKpiCardProps) {
  // Calculate percentages from actual segment values
  const calculatedTotal = segments.reduce((sum, seg) => sum + seg.value, 0)
  const percentages = segments.map(seg => 
    Math.round((seg.value / calculatedTotal) * 100)
  )
  
  return (
    <div className="bg-muted rounded-xl p-6 flex flex-col justify-between flex-1 min-w-[420px]">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-normal text-muted-foreground">Fluxon employees</p>
        
        <div className="flex gap-4 items-end">
          <p className="text-6xl font-extralight leading-none">{total}</p>
          
          {/* Horizontal segmented bar - all segments use primary color (electric-blue/400) with different opacities */}
          <div className="flex flex-1 items-center gap-1 h-6 mb-2">
            {segments.map((segment, idx) => (
              <div
                key={idx}
                className="h-6 rounded-sm bg-primary relative"
                style={{ 
                  flexGrow: segment.value,
                  opacity: idx === 0 ? 1 : idx === 1 ? 0.5 : 0.2
                }}
              >
                {/* Show percentage if segment is large enough */}
                {percentages[idx] >= 10 && (
                  <span 
                    className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                      idx === 2 ? 'text-electric-blue-700' : 'text-white'
                    }`}
                  >
                    {percentages[idx]}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend - uses designated legend colors */}
      <div className="flex items-center justify-between pl-[110px]">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-xs opacity-40 ${segment.legendColor}`} />
            <span className="text-xs font-normal text-muted-foreground">{segment.label}</span>
            <span className="text-xs font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
