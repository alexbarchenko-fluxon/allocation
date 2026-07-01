import AreaChartCard from './AreaChartCard'
import UtilizationChartCard from './UtilizationChartCard'
import FutureDemandChartCard from './FutureDemandChartCard'
import { billableSeatsChartData, projectsChartData } from '../mockData'

export default function OverviewSection() {
  return (
    <div className="bg-card border border-border rounded-2xl w-full">
      <div className="p-10 pb-10 flex flex-col gap-5">
        <h2 className="text-2xl font-normal">Overview</h2>
        
        {/* Single bordered container with all charts */}
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Row 1: Two area charts side by side */}
          <div className="flex">
            <AreaChartCard 
              title="Billable Full-Time Seats"
              data={billableSeatsChartData}
              xAxisTicks={["Jul'23", "2024", "Jul'24", "2025", "Jul'25", "2026"]}
            />
            
            <div className="w-px bg-border" />
            
            <AreaChartCard 
              title="Projects"
              data={projectsChartData}
            />
          </div>
          
          {/* Horizontal divider */}
          <div className="h-px bg-border w-full" />
          
          {/* Row 2: Utilization chart */}
          <UtilizationChartCard />
          
          {/* Horizontal divider */}
          <div className="h-px bg-border w-full" />
          
          {/* Row 3: Future demand chart */}
          <FutureDemandChartCard />
        </div>
      </div>
    </div>
  )
}
