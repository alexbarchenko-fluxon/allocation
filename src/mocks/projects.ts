// ── Project types ─────────────────────────────────────────────────────────────

export type AllocationType = 'project' | 'ooo' | 'internal'

export type ProjectContractType = 'T&M' | 'Fixed'
export type ProjectTimelineStatus = 'default' | 'soon' | 'ending'

export interface Project {
  id: string
  name: string
  /** Light background fill for the allocation block */
  color: string
  /** Foreground text colour (AAA contrast against color above) */
  textColor: string
  contractType: ProjectContractType
  startDate: string
  endDate: string
  /** Timeline alert — 'soon' = starting soon, 'ending' = ending soon, 'default' = normal */
  timelineStatus: ProjectTimelineStatus
}

// ── 20 fake projects ──────────────────────────────────────────────────────────
// Names are fictional.  Colour palette mirrors the existing system's
// blue / purple / green / amber / pink / slate tones.

export const MOCK_PROJECTS: Project[] = [
  /* 0  */ { id: 'proj-nexus',     name: 'Nexus Platform v2',       color: '#DBEAFE', textColor: '#1D4ED8', contractType: 'T&M',   startDate: '2026-02-01', endDate: '2026-08-31', timelineStatus: 'default' },
  /* 1  */ { id: 'proj-aurora',    name: 'Aurora Analytics',         color: '#EDE9FE', textColor: '#5B21B6', contractType: 'Fixed', startDate: '2026-01-15', endDate: '2026-07-15', timelineStatus: 'soon'    },
  /* 2  */ { id: 'proj-meridian',  name: 'Meridian Commerce',        color: '#D1FAE5', textColor: '#065F46', contractType: 'T&M',   startDate: '2026-03-01', endDate: '2026-09-01', timelineStatus: 'default' },
  /* 3  */ { id: 'proj-quantum',   name: 'Quantum Hub',              color: '#FFEDD5', textColor: '#9A3412', contractType: 'Fixed', startDate: '2025-12-01', endDate: '2026-06-30', timelineStatus: 'default' },
  /* 4  */ { id: 'proj-stellar',   name: 'Stellar CRM',              color: '#DBEAFE', textColor: '#1E40AF', contractType: 'T&M',   startDate: '2026-02-15', endDate: '2026-08-15', timelineStatus: 'soon'    },
  /* 5  */ { id: 'proj-vertex',    name: 'Vertex AI Integration',    color: '#FCE7F3', textColor: '#9D174D', contractType: 'Fixed', startDate: '2026-01-01', endDate: '2026-12-31', timelineStatus: 'default' },
  /* 6  */ { id: 'proj-eclipse',   name: 'Eclipse Design System',    color: '#F1F5F9', textColor: '#334155', contractType: 'T&M',   startDate: '2026-03-10', endDate: '2026-09-10', timelineStatus: 'soon'    },
  /* 7  */ { id: 'proj-orion',     name: 'Orion Mobile',             color: '#D1FAE5', textColor: '#065F46', contractType: 'Fixed', startDate: '2025-11-01', endDate: '2026-05-01', timelineStatus: 'ending'  },
  /* 8  */ { id: 'proj-cascade',   name: 'Cascade Marketing',        color: '#FCE7F3', textColor: '#9D174D', contractType: 'T&M',   startDate: '2026-04-01', endDate: '2026-10-01', timelineStatus: 'default' },
  /* 9  */ { id: 'proj-titan',     name: 'Titan ERP Migration',      color: '#FEF3C7', textColor: '#92400E', contractType: 'Fixed', startDate: '2026-02-01', endDate: '2026-11-30', timelineStatus: 'default' },
  /* 10 */ { id: 'proj-nova',      name: 'Nova Social Platform',     color: '#DBEAFE', textColor: '#1D4ED8', contractType: 'T&M',   startDate: '2026-01-20', endDate: '2026-07-20', timelineStatus: 'default' },
  /* 11 */ { id: 'proj-zenith',    name: 'Zenith Cloud Ops',         color: '#FFEDD5', textColor: '#9A3412', contractType: 'Fixed', startDate: '2026-03-01', endDate: '2026-09-30', timelineStatus: 'default' },
  /* 12 */ { id: 'proj-apex',      name: 'Apex Security Audit',      color: '#FEE2E2', textColor: '#991B1B', contractType: 'T&M',   startDate: '2025-10-01', endDate: '2026-03-31', timelineStatus: 'ending'  },
  /* 13 */ { id: 'proj-prism',     name: 'Prism Dashboard',          color: '#EDE9FE', textColor: '#5B21B6', contractType: 'Fixed', startDate: '2026-05-01', endDate: '2026-12-31', timelineStatus: 'default' },
  /* 14 */ { id: 'proj-luna',      name: 'Luna Customer Portal',     color: '#D1FAE5', textColor: '#065F46', contractType: 'T&M',   startDate: '2026-02-01', endDate: '2026-08-01', timelineStatus: 'default' },
  /* 15 */ { id: 'proj-cobalt',    name: 'Cobalt DevOps',            color: '#DBEAFE', textColor: '#1D4ED8', contractType: 'Fixed', startDate: '2026-01-01', endDate: '2026-06-30', timelineStatus: 'default' },
  /* 16 */ { id: 'proj-ember',     name: 'Ember Brand Refresh',      color: '#FCE7F3', textColor: '#9D174D', contractType: 'T&M',   startDate: '2026-04-15', endDate: '2026-10-15', timelineStatus: 'default' },
  /* 17 */ { id: 'proj-flux',      name: 'Flux Internal Tools',      color: '#F1F5F9', textColor: '#475569', contractType: 'Fixed', startDate: '2026-03-01', endDate: '2026-09-01', timelineStatus: 'default' },
  /* 18 */ { id: 'proj-vortex',    name: 'Vortex Integration Hub',   color: '#FEF3C7', textColor: '#92400E', contractType: 'T&M',   startDate: '2026-02-15', endDate: '2026-08-15', timelineStatus: 'default' },
  /* 19 */ { id: 'proj-academy',   name: "Academy: Onboarding '26",  color: '#CCFBF1', textColor: '#134E4A', contractType: 'Fixed', startDate: '2026-06-01', endDate: '2026-12-31', timelineStatus: 'default' },
]

export const PROJECT_MAP = new Map<string, Project>(
  MOCK_PROJECTS.map((p) => [p.id, p]),
)
