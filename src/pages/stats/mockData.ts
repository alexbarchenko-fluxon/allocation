// Mock data for Stats page

export const kpiData = {
  fluxonEmployees: {
    total: 182,
    segments: [
      { label: 'Delivery', value: 149, legendColor: 'bg-[#3e5dff]' },
      { label: 'Growth', value: 5, legendColor: 'bg-[#3e5dff]' },
      { label: 'Support', value: 28, legendColor: 'bg-[#3e5dff]' },
    ],
  },
  upcomingProjects: 3,
  allocationOnProjects: {
    value: 82,
    change: -1.5,
    trend: 'down' as const,
  },
  billableSeats: {
    value: 119.4,
    change: 4.5,
    trend: 'up' as const,
  },
}

export const billableSeatsChartData = [
  { date: "Jul'23", value: 38 },
  { date: "Aug'23", value: 20 },
  { date: "Sep'23", value: 25 },
  { date: "Oct'23", value: 28 },
  { date: "Nov'23", value: 32 },
  { date: "Dec'23", value: 35 },
  { date: '2024', value: 37 },
  { date: "Feb'24", value: 38 },
  { date: "Mar'24", value: 40 },
  { date: "Apr'24", value: 48 },
  { date: "May'24", value: 44 },
  { date: "Jun'24", value: 38 },
  { date: "Jul'24", value: 42 },
  { date: "Aug'24", value: 47 },
  { date: "Sep'24", value: 50 },
  { date: "Oct'24", value: 55 },
  { date: "Nov'24", value: 58 },
  { date: "Dec'24", value: 62 },
  { date: '2025', value: 60 },
  { date: "Feb'25", value: 64 },
  { date: "Mar'25", value: 66 },
  { date: "Apr'25", value: 68 },
  { date: "May'25", value: 72 },
  { date: "Jun'25", value: 75 },
  { date: "Jul'25", value: 80 },
  { date: "Aug'25", value: 78 },
  { date: "Sep'25", value: 82 },
  { date: "Oct'25", value: 85 },
  { date: "Nov'25", value: 88 },
  { date: "Dec'25", value: 92 },
  { date: '2026', value: 95 },
  { date: "Feb'26", value: 100 },
  { date: "Mar'26", value: 98 },
  { date: "Apr'26", value: 102 },
  { date: "May'26", value: 108 },
  { date: "Jun'26", value: 115 },
  { date: "Jul'26", value: 120 },
]

export const projectsChartData = [
  { date: 'Dec 8', value: 30 },
  { date: 'Dec 15', value: 28 },
  { date: 'Dec 29', value: 26 },
  { date: 'Jan 5', value: 27 },
  { date: 'Jan 29', value: 29 },
  { date: 'Feb 2', value: 30 },
  { date: 'Feb 15', value: 28 },
  { date: 'Feb 29', value: 26 },
  { date: 'Mar 2', value: 27 },
  { date: 'Mar 15', value: 30 },
]

export const utilizationData = Array.from({ length: 18 }, (_, i) => ({
  month: 'Jun',
  billable: i < 11 ? 70 + Math.random() * 10 : 65 + Math.random() * 5,
  growth: i < 11 ? 5 + Math.random() * 5 : 3 + Math.random() * 2,
  overhead: i < 11 ? 15 + Math.random() * 5 : 10 + Math.random() * 5,
  isFuture: i >= 11,
}))

export const futureDemandData = [
  { week: 'Jan 5', allocated: 100, available: 250 },
  { week: 'Jan 12', allocated: 150, available: 300 },
  { week: 'Jan 19', allocated: 200, available: 400 },
  { week: 'Jan 26', allocated: 300, available: 500 },
  { week: 'Feb 2', allocated: 350, available: 550 },
  { week: 'Feb 9', allocated: 350, available: 600 },
  { week: 'Feb 16', allocated: 400, available: 650 },
  { week: 'Feb 23', allocated: 550, available: 700 },
  { week: 'Mar 2', allocated: 600, available: 750 },
  { week: 'Mar 9', allocated: 550, available: 900 },
  { week: 'Mar 16', allocated: 400, available: 800 },
  { week: 'Mar 23', allocated: 350, available: 750 },
  { week: 'Mar 30', allocated: 300, available: 750 },
  { week: 'Apr 6', allocated: 250, available: 1000 },
]
