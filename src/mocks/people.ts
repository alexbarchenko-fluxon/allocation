import { femaleAvatars, maleAvatars } from '@/assets/avatars'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Division = 'Delivery' | 'Growth' | 'Support'
export type EmploymentType = 'FTE' | 'PT'

/**
 * A single project allocation for a person.
 * endDate = undefined means the allocation is current / ongoing.
 * Add more fields (deal link, role on project, etc.) as needed.
 */
export interface PersonAllocation {
  id: string
  projectName: string
  clientName?: string
  /** Person's role on this project (e.g. "Lead Engineer", "PM") */
  role?: string
  hoursPerWeek: number
  startDate: string  // "YYYY-MM-DD"
  endDate?: string   // undefined → current / ongoing
}

export interface Person {
  id: string
  name: string
  /** dicebear avatar URL — seed matches the name for stable results */
  avatar: string
  /** Exact value from the Job Title filter list */
  jobTitle: string
  /** Exact value from the Team filter list */
  team: string
  /** Derived from team (see TEAM_DIVISION map below) */
  division: Division
  /** "City, Country" format */
  location: string
  employmentType: EmploymentType
  /** YYYY-MM-DD — deterministic from person id; range 2022-03-01 → 2025-12-01 */
  startDate: string
  /** Starts empty; populated with past + current allocations as the feature grows */
  allocations: PersonAllocation[]
  /** One-paragraph professional summary, shared by all members of the same team. */
  summary: string
  /** Badge IDs referencing assets in src/assets/badges/. 3–10 per person. */
  badges: string[]
  /** Skills relevant to the person's team. 4–8 per person. */
  skills: string[]
  /** Career/professional growth goals, team-appropriate. 2–4 per person. */
  growthGoals: string[]
  /** Personal interests and hobbies. 2–5 per person. */
  hobbies: string[]
}

// ── Team → Division mapping ────────────────────────────────────────────────────

export const TEAM_DIVISION: Record<string, Division> = {
  'Engineering':          'Delivery',
  'Design':               'Delivery',
  'PM':                   'Delivery',
  'TPM':                  'Delivery',
  'QA':                   'Delivery',
  'Marketing':            'Growth',
  'Business Development': 'Growth',
  'Finance':              'Support',
  'Biz Ops':              'Support',
  'Legal':                'Support',
  'People Ops':           'Support',
  'Talent':               'Support',
  'General Ops':          'Support',
  'Exec':                 'Support',
}

// ── Summaries — one per team ──────────────────────────────────────────────────

const TEAM_SUMMARIES: Record<string, string> = {
  'Engineering': `Full-stack software engineer with deep expertise building scalable web applications and backend systems. Brings a strong foundation in modern JavaScript ecosystems, cloud infrastructure, and collaborative development practices.

## Professional Background
Senior engineering roles across multiple technology companies
- Experience in both individual contributor and management positions
- Background in product-focused and platform-level development
- Consistent record of delivering high-quality, maintainable code

## Technical Expertise
- JavaScript / TypeScript, React, Node.js
- Backend architecture and API design
- Cloud infrastructure (AWS / GCP / Azure)
- CI/CD pipelines and DevOps practices

## Leadership & Collaboration
- Technical mentorship for junior engineers
- Close partnership with product and design teams
- Participation in architecture planning and code reviews

## Industry Experience
- SaaS and enterprise software products
- Fintech and regulated environments
- High-growth startups and scale-up organizations`,

  'Design': `Product designer focused on delivering intuitive user experiences through research-driven design and high-quality execution. Skilled in defining and evolving design systems, and collaborating closely with engineers and product teams.

## Design Philosophy
Combines systems thinking with a deep focus on user needs
- Balances aesthetics with usability and accessibility
- Advocates for inclusive, accessible design across all touchpoints
- Iterates rapidly based on user research and qualitative feedback

## Core Competencies
- End-to-end UX and UI design
- Design system creation and governance
- User research, prototyping, and usability testing

## Tools & Process
- Figma, Sketch, Adobe Creative Suite
- Component-driven design workflows
- Rapid iteration and cross-functional collaboration

## Domain Experience
- SaaS platforms and enterprise tools
- Consumer mobile and web products
- B2B and marketplace experiences`,

  'PM': `Product manager with a track record of driving cross-functional teams to deliver impactful features on time. Skilled in translating customer needs into clear product strategy, writing detailed requirements, and aligning stakeholders.

## Product Approach
Leads with customer empathy and data-informed decision making
- Defines product vision and communicates it clearly across the organization
- Writes crisp, detailed PRDs that engineering and design can act on immediately
- Balances short-term delivery with long-term strategic positioning

## Core Strengths
- Product roadmap definition and prioritization
- Stakeholder alignment and executive communication
- OKR setting and success metric ownership

## Domain Knowledge
- B2B SaaS and enterprise workflows
- Growth and monetization product areas
- Platform and API product development

## Delivery Experience
- Shipped multiple products from 0 to 1
- Managed complex multi-team delivery programs
- Experience with agile, shape-up, and hybrid delivery models`,

  'TPM': `Technical Program Manager with experience coordinating complex, multi-team engineering initiatives. Adept at identifying dependencies, managing risk, and keeping distributed projects on track through structured communication.

## Program Management
Proven ability to orchestrate large, cross-functional programs
- Drives clarity and alignment across engineering, product, and design
- Maintains program-level visibility with clear status reporting
- Builds and sustains productive relationships with senior stakeholders

## Technical Coordination
- Translates technical constraints into business-friendly language
- Facilitates architecture and technical design reviews
- Bridges gaps between engineering teams working on shared infrastructure

## Planning & Risk Management
- Dependency mapping and critical path analysis
- Proactive risk identification with mitigation planning
- Structured change management and scope control

## Track Record
- Delivered complex platform migrations on schedule
- Coordinated programs spanning 5+ engineering squads
- Reduced time-to-delivery through improved planning practices`,

  'QA': `Quality assurance engineer with a focus on test automation, regression coverage, and continuous delivery pipelines. Committed to shipping reliable software through rigorous testing strategies and close partnership with engineering.

## Testing Philosophy
Quality is a shared responsibility, embedded throughout the SDLC
- Shifts testing left to catch issues early in the development process
- Partners with engineers to build testability into system design
- Champions a culture of quality across the entire product team

## Technical Skills
- Test automation frameworks (Playwright, Cypress, Selenium)
- API and integration testing (Postman, REST Assured)
- Performance and load testing methodologies

## Automation Approach
- Scalable, maintainable test suite architecture
- CI/CD pipeline integration with automated gate checks
- Cross-browser and cross-platform coverage strategies

## Quality Practices
- Exploratory and risk-based testing
- Bug triage and root-cause analysis
- Defect prevention through process improvement`,

  'Marketing': `Marketing and growth professional with experience building brand presence and driving acquisition through data-informed campaigns. Skilled in content strategy, performance marketing, and cross-functional collaboration.

## Marketing Approach
Data-driven strategies that connect brand narrative with measurable business outcomes
- Builds programs that scale across paid, owned, and earned channels
- Maintains deep understanding of audience segments and messaging frameworks
- Aligns marketing output tightly with sales pipeline and revenue goals

## Core Skills
- Campaign strategy and multi-channel execution
- Content creation, copywriting, and editorial planning
- Performance analytics and attribution modeling

## Channel Expertise
- Paid search and social (Google Ads, LinkedIn, Meta)
- Email marketing and lifecycle nurture programs
- Event marketing and field programs

## Analytics & Growth
- Marketing funnel analysis and conversion optimization
- A/B testing and experimentation frameworks
- CRM and marketing automation (HubSpot, Salesforce)`,

  'Business Development': `Business development leader with a strong network and proven ability to identify strategic partnerships and close high-value deals. Brings a consultative approach to client relationships and deep market knowledge.

## BD Philosophy
Builds long-term, trust-based relationships that create mutual value
- Takes a consultative, solutions-oriented approach to every engagement
- Develops deep understanding of client challenges before proposing solutions
- Balances new business development with expansion of existing accounts

## Relationship Building
- C-level and executive stakeholder engagement
- Partner ecosystem development and management
- Cross-industry network spanning technology, finance, and enterprise

## Deal Experience
- Full-cycle deal management from prospecting to close
- Complex, multi-stakeholder enterprise negotiations
- Partnership structuring including revenue-sharing and co-sell arrangements

## Market Knowledge
- SaaS and technology sectors
- Financial services and regulated industries
- Emerging markets and global expansion`,

  'Finance': `Finance professional with expertise in financial planning, analysis, and reporting. Supports business decisions through rigorous modeling, budget management, and close collaboration with operations and leadership.

## Financial Expertise
Partners with leadership to drive financial discipline and strategic clarity
- Leads FP&A processes including annual planning and quarterly forecasting
- Builds models that translate operational data into actionable business insights
- Monitors financial performance with a focus on unit economics and efficiency

## Analytical Capabilities
- Three-statement financial modeling
- Scenario planning and sensitivity analysis
- Budget variance analysis and reporting

## Business Partnership
- Cross-functional collaboration with Sales, Ops, and Engineering
- Finance business partner support for department leaders
- Board and investor reporting preparation

## Regulatory & Compliance
- GAAP and IFRS accounting standards
- SOC 2, audit preparation, and internal controls
- Experience in regulated industries including fintech and healthcare`,

  'Biz Ops': `Operations professional with a focus on process efficiency, tooling, and cross-team coordination. Brings analytical rigor and systems thinking to optimize how the business runs day to day, enabling teams to scale.

## Operational Focus
Drives efficiency and clarity across the organization through structured programs
- Identifies friction in processes and designs scalable solutions
- Bridges the gap between strategy and execution across business units
- Manages operational cadence including QBRs, planning cycles, and OKR reviews

## Systems & Tooling
- Business intelligence and data visualization (Looker, Tableau)
- Workflow automation and process tooling (Zapier, Notion, JIRA)
- ERP and CRM platform administration

## Process Improvement
- Process mapping and root-cause analysis
- Lean / Six Sigma principles in an ops context
- Change management and stakeholder buy-in strategies

## Cross-functional Impact
- Embedded partnerships with Finance, Legal, HR, and Engineering
- Program management for company-wide operational initiatives
- Data governance and reporting standardization`,

  'Legal': `Legal advisor with experience in commercial contracts, compliance, and regulatory frameworks across multiple jurisdictions. Partners closely with business teams to manage risk and ensure the company operates responsibly.

## Legal Expertise
Pragmatic counsel that balances legal rigor with business speed
- Provides clear, actionable guidance to non-legal stakeholders
- Structures agreements that protect the company while enabling growth
- Maintains awareness of evolving regulatory landscapes globally

## Contract & Commercial Law
- Drafting and negotiating enterprise SaaS and services agreements
- Vendor, partner, and channel agreement management
- IP ownership, licensing, and data protection frameworks

## Risk & Compliance Management
- GDPR, CCPA, and international data privacy compliance
- Employment law and workforce compliance
- Corporate governance and board-level advisory

## Business Partnership
- Embedded legal support for Sales and BD teams
- Cross-functional collaboration with Finance and People Ops
- M&A diligence and transaction support`,

  'People Ops': `People operations professional dedicated to building an equitable, engaging, and high-performing workplace. Focuses on talent lifecycle programs, policy development, and supporting managers and employees through growth.

## People Philosophy
Puts employees at the center of every program and policy decision
- Believes great culture is built through consistent, intentional practices
- Balances employee experience with organizational needs and compliance
- Acts as a trusted partner to managers navigating complex people challenges

## Talent Programs
- Onboarding design and continuous improvement
- Performance management cycles and calibration
- Total rewards strategy and compensation benchmarking

## Culture & Engagement
- Employee engagement surveys and action planning
- DEI program design and implementation
- Manager enablement and leadership development

## Organizational Development
- Workforce planning in partnership with Finance and leadership
- Organizational design and change management
- HRIS administration and people data reporting`,

  'Talent': `Talent acquisition professional with a strong track record of identifying and closing exceptional candidates across technical and non-technical roles. Brings a data-driven approach to sourcing and strategic workforce planning.

## Talent Acquisition Philosophy
Champions candidate experience as a direct reflection of company culture
- Builds authentic, trusted relationships with candidates at every stage
- Partners deeply with hiring managers to understand real role requirements
- Advocates for consistent, bias-aware interviewing practices

## Sourcing & Assessment
- Boolean search, LinkedIn Recruiter, and talent community building
- Structured interview design and scorecard frameworks
- Technical and competency-based assessment methodologies

## Candidate Experience
- Transparent, timely communication at every stage of the process
- Employer brand storytelling and employee value proposition
- Offer negotiation and close strategies for competitive markets

## Workforce Planning
- Headcount forecasting and pipeline capacity management
- Time-to-fill and quality-of-hire analytics
- Diversity sourcing strategies and inclusive hiring programs`,

  'General Ops': `Operations leader with broad experience managing facilities, vendor relationships, and organizational processes at scale. Ensures the business runs smoothly and efficiently so teams can focus on delivering their best work.

## Operations Management
Oversees day-to-day business operations with a focus on reliability and cost efficiency
- Manages office environments and distributed workplace programs
- Coordinates vendor and contractor relationships across multiple categories
- Develops and enforces operational policies and procedures

## Process Efficiency
- Business process documentation and standardization
- Continuous improvement and operational review cycles
- Automation of manual and repetitive workflows

## Vendor & Facilities Management
- RFP processes, contract negotiation, and vendor performance management
- Facility planning, real estate, and workplace experience
- IT procurement and asset lifecycle management

## Strategic Planning
- Annual operational planning and budget management
- Cross-functional collaboration on company-wide programs
- Metrics tracking and reporting to senior leadership`,

  'Exec': `Senior executive with a history of scaling technology companies and building high-performing, diverse teams. Combines long-term strategic vision with operational discipline to drive sustainable growth and strong culture.

## Strategic Leadership
Sets direction for the organization and aligns the leadership team around shared priorities
- Translates market signals and customer insight into clear company strategy
- Makes high-stakes decisions with incomplete information and tight timelines
- Builds conviction and momentum around ambitious long-term goals

## Business Growth
- P&L ownership and revenue growth accountability
- Go-to-market strategy and commercial model development
- Market expansion, partnerships, and M&A evaluation

## Team Building
- Hiring and developing executive-level leadership teams
- Fostering a culture of ownership, inclusion, and continuous improvement
- Organizational design and scaling through periods of rapid growth

## Industry & Investor Relations
- Board management and investor communication
- Industry thought leadership and external representation
- Experience operating in venture-backed and PE-backed environments`,
}

// ── Skills pools — per team ───────────────────────────────────────────────────

const TEAM_SKILLS_POOL: Record<string, string[]> = {
  'Engineering': [
    'JavaScript', 'TypeScript', 'React.js', 'PostgreSQL', 'Python', 'Docker',
    'AWS', 'Java', 'Next.js', 'MySQL', 'MongoDB', 'Express.js', 'GCP', 'NestJS',
    'React Native', 'C++', 'PHP', 'Vue.js', 'Golang', 'Spring', 'Big Data',
    'K8s', 'SQLite', 'Web3', 'Flutter', 'Kotlin', '.NET', 'Azure', 'C#',
    'Swift', 'Dart', 'Electron', 'Rust', 'Scala', 'Security', 'IoT', 'AI',
    'Firebase', 'Angular', 'Blockchain', 'Postman', 'Haskell', 'Ruby', 'C',
    'Objective-C', 'Playwright', 'Cypress', 'JUnit', 'Selenium',
  ],
  'Design': [
    'AI', 'Social Networks', 'Media and Entertainment', 'AR/VR', 'Gaming',
    'Marketing', 'SaaS', 'Presentation skills', 'Stakeholders management',
    'Crypto', 'NFT', 'Unity', 'Healthcare', 'Retail and E-commerce',
  ],
  'PM': [
    'Stakeholders management', 'Presentation skills', 'SaaS', 'Team Leadership',
    'Mentorship', 'Negotiation skills', 'AI', 'Tech Leadership', 'Big Data',
    'Healthcare', 'Finance', 'Retail and E-commerce', 'Non-profits',
    'Transport & Logistics', 'Social Networks',
  ],
  'TPM': [
    'Team Leadership', 'Stakeholders management', 'Presentation skills',
    'Tech Leadership', 'Mentorship', 'Negotiation skills', 'K8s', 'Big Data',
    'SaaS', 'AI', 'Docker', 'Security', 'Supply Chain Management',
  ],
  'QA': [
    'Selenium', 'Playwright', 'Cypress', 'Appium', 'JUnit', 'TestComplete',
    'Robot', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Postman',
    'K8s', 'Docker', 'Security',
  ],
  'Marketing': [
    'Marketing', 'Social Networks', 'SaaS', 'Presentation skills',
    'Negotiation skills', 'Media and Entertainment', 'Healthcare',
    'Retail and E-commerce', 'Non-profits', 'AI', 'Crypto',
    'Stakeholders management', 'Tech Leadership',
  ],
  'Business Development': [
    'Negotiation skills', 'SaaS', 'Finance', 'Stakeholders management',
    'Presentation skills', 'Marketing', 'Social Networks', 'Healthcare',
    'Retail and E-commerce', 'Non-profits', 'Transport & Logistics',
    'Crypto', 'Insurance', 'Supply Chain Management',
  ],
  'Finance': [
    'Finance', 'Big Data', 'SaaS', 'Supply Chain Management',
    'Negotiation skills', 'Python', 'PostgreSQL', 'MySQL', 'Crypto',
    'Stakeholders management', 'SQLite',
  ],
  'Biz Ops': [
    'Supply Chain Management', 'Finance', 'SaaS', 'AI', 'Big Data',
    'Docker', 'Python', 'K8s', 'Security', 'Negotiation skills',
    'Stakeholders management', 'Identity Access Management',
  ],
  'Legal': [
    'Negotiation skills', 'Finance', 'Real Estate', 'Insurance', 'Non-profits',
    'Healthcare', 'Transport & Logistics', 'Stakeholders management',
    'Presentation skills', 'Crypto',
  ],
  'People Ops': [
    'Mentorship', 'Presentation skills', 'Team Leadership', 'Negotiation skills',
    'SaaS', 'Non-profits', 'Stakeholders management', 'Healthcare', 'Marketing',
  ],
  'Talent': [
    'Mentorship', 'Team Leadership', 'Negotiation skills', 'Presentation skills',
    'SaaS', 'Stakeholders management', 'Non-profits', 'Marketing',
    'Social Networks', 'Tech Leadership',
  ],
  'General Ops': [
    'Supply Chain Management', 'Finance', 'Negotiation skills', 'SaaS',
    'Team Leadership', 'Stakeholders management', 'Big Data',
    'Transport & Logistics', 'Healthcare',
  ],
  'Exec': [
    'Tech Leadership', 'Team Leadership', 'Stakeholders management', 'Mentorship',
    'SaaS', 'Finance', 'Presentation skills', 'Negotiation skills', 'AI',
    'Big Data', 'Healthcare', 'Crypto', 'Supply Chain Management',
  ],
}

// ── Growth goal pools — per team ─────────────────────────────────────────────

const TEAM_GOALS_POOL: Record<string, string[]> = {
  'Engineering': [
    'AI / ML', 'Cloud Architecture', 'Distributed Systems', 'Infrastructure Development',
    'DevOps', 'Security Engineering', 'System Design', 'Mobile Development',
    'Data Engineering', 'Open Source Leadership', 'Blockchain', 'Low-code',
  ],
  'Design': [
    'Design Leadership', 'UX Research', 'Motion Design', 'Product Strategy',
    'Brand Strategy', '3D Design', 'AR / VR Design', 'Design Systems',
    'AI-driven Design', 'Accessibility',
  ],
  'PM': [
    'Product Leadership', 'Data Analytics', 'AI / ML', 'User Research',
    'Technical PM', 'Business Strategy', 'Platform Thinking', 'Monetisation',
    'Go-to-market', 'OKR Frameworks',
  ],
  'TPM': [
    'Engineering Management', 'Agile Transformation', 'AI Ops', 'Cloud Architecture',
    'Process Innovation', 'Risk Management', 'Portfolio Management', 'OKR Frameworks',
  ],
  'QA': [
    'Test Automation', 'Performance Engineering', 'Security Testing',
    'AI-driven QA', 'DevOps', 'Chaos Engineering', 'Accessibility Testing',
  ],
  'Marketing': [
    'Growth Marketing', 'Content Strategy', 'Brand Building', 'Data-driven Marketing',
    'AI Marketing', 'Community Building', 'Video & Podcast', 'Partnership Marketing',
  ],
  'Business Development': [
    'Strategic Partnerships', 'M&A', 'Market Expansion', 'Revenue Leadership',
    'Enterprise Sales', 'Channel Strategy', 'International Growth', 'Investor Relations',
  ],
  'Finance': [
    'Financial Modelling', 'FP&A', 'Risk Management', 'CFO Track',
    'Data Finance', 'M&A Due Diligence', 'ESG Reporting',
  ],
  'Biz Ops': [
    'Process Automation', 'Digital Transformation', 'Data Analytics',
    'Systems Integration', 'Operational Excellence', 'AI Ops',
  ],
  'Legal': [
    'IP Law', 'International Law', 'M&A Advisory', 'Compliance Leadership',
    'Privacy & Data', 'Employment Law', 'Regulatory Affairs',
  ],
  'People Ops': [
    'People Analytics', 'DEI Leadership', 'Learning & Development',
    'Organisational Design', 'Executive Coaching', 'Remote Culture',
  ],
  'Talent': [
    'Employer Branding', 'Technical Recruiting', 'Executive Search',
    'Talent Analytics', 'Workforce Planning', 'DEI in Hiring',
  ],
  'General Ops': [
    'Digital Transformation', 'Supply Chain Optimisation', 'Operational Excellence',
    'Facilities & Real Estate', 'Vendor Management', 'Sustainability',
  ],
  'Exec': [
    'Company Scaling', 'M&A', 'Board Relations', 'International Expansion',
    'Organisational Design', 'Investor Relations', 'ESG Leadership',
  ],
}

// ── Shared hobbies pool ───────────────────────────────────────────────────────

const ALL_HOBBIES: string[] = [
  'Badminton', 'Table tennis', 'Tennis', 'Basketball', 'Football', 'Running',
  'Cycling', 'Swimming', 'Yoga', 'Rock climbing', 'Hiking', 'Surfing', 'Skiing',
  'Photography', 'Drawing', 'Painting', 'Music', 'Guitar', 'Piano', 'Writing',
  'Gaming', '3D Printing', 'Open Source', 'Drone Racing', 'AR / VR',
  'Travel', 'Reading', 'Cooking', 'Anime', 'Manga', 'Podcasts', 'Film',
  'Chess', 'Board games', 'Dungeons & Dragons', 'Poetry', 'Bouldering', 'Sailing',
]

// ── All available badge IDs ───────────────────────────────────────────────────

export const ALL_BADGE_IDS: string[] = [
  'meta-badge-provider-milestones-5',
  'allox-badge-provider-worked-on-projects-10',
  'allox-badge-provider-years-in-company-10',
  'interview-25',
  'qa-office-hours-attendee',
  'slack-20',
  'user-factoid-badge-firstname-match',
  'user-factoid-badge-righthand',
  'user-factoid-badge-scrabble-pro',
  'user-factoid-badge-unique-firstname',
]

// ── Seeded pseudo-random helpers ──────────────────────────────────────────────

/** Deterministic integer in [min, max] from a seed. */
function seededInt(min: number, max: number, seed: number): number {
  const s = ((seed * 1664525) + 1013904223) >>> 0
  return min + (s % (max - min + 1))
}

/** Deterministic selection of `count` unique items from `items` using `seed`. */
function seededSample<T>(items: T[], count: number, seed: number): T[] {
  const pool = [...items]
  const result: T[] = []
  let s = (seed * 2654435761) >>> 0
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = ((s * 1664525) + 1013904223) >>> 0
    const idx = s % pool.length
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

// ── Helper ────────────────────────────────────────────────────────────────────

// Female person IDs — clear female names + gender-neutral names assigned female
// (Skylar, Morgan, Riley, Harper, Alex)
const FEMALE_IDS: readonly number[] = [
  2, 4, 6, 10, 12, 14, 16, 18, 20, 22, 25, 27, 29, 31, 33,
  35, 36, 40, 41, 42, 44, 46, 47, 49, 51, 53, 55, 57, 59,
  61, 63, 65, 67, 69, 71, 73, 75, 77, 79,
]

// Male person IDs — clear male names + gender-neutral names assigned male
// (Peyton, Taylor, Jordan, Casey, Drew, Sam, Jordan)
const MALE_IDS: readonly number[] = [
  1, 3, 5, 7, 8, 9, 11, 13, 15, 17, 19, 21, 23, 24, 26, 28, 30, 32, 34,
  37, 38, 39, 43, 45, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70,
  72, 74, 76, 78, 80,
]

function avatar(id: number): string {
  const fi = FEMALE_IDS.indexOf(id)
  if (fi !== -1) return femaleAvatars[fi]
  const mi = MALE_IDS.indexOf(id)
  if (mi !== -1) return maleAvatars[mi]
  return femaleAvatars[0]
}

/**
 * Deterministic start date from person id.
 * Spreads 1–80 across 2022-03-01 → 2025-12-01 (≈ 1371 days) using
 * Knuth's multiplicative hash for a natural-looking distribution.
 */
function startDate(id: number): string {
  const rangeStartMs = 1646092800000 // 2022-03-01 UTC
  const rangeDays    = 1371
  const hash = ((id * 2654435761) >>> 0) % rangeDays
  return new Date(rangeStartMs + hash * 86_400_000).toISOString().slice(0, 10)
}

function person(
  id: number,
  name: string,
  jobTitle: string,
  team: string,
  location: string,
  employmentType: EmploymentType = 'FTE',
): Person {
  const skillPool = TEAM_SKILLS_POOL[team]   ?? TEAM_SKILLS_POOL['Exec']
  const goalPool  = TEAM_GOALS_POOL[team]    ?? TEAM_GOALS_POOL['Exec']
  const badgeCount = seededInt(3, 10, id * 7  + 1)
  const skillCount = seededInt(4, 8,  id * 11 + 3)
  const goalCount  = seededInt(2, 4,  id * 19 + 9)
  const hobbyCount = seededInt(2, 5,  id * 23 + 11)

  return {
    id: `person-${id}`,
    name,
    avatar: avatar(id),
    jobTitle,
    team,
    division: TEAM_DIVISION[team] ?? 'Support',
    location,
    employmentType,
    startDate: startDate(id),
    allocations: [],
    summary:     TEAM_SUMMARIES[team] ?? '',
    badges:      seededSample(ALL_BADGE_IDS, badgeCount, id * 13 + 5),
    skills:      seededSample(skillPool,     skillCount, id * 17 + 7),
    growthGoals: seededSample(goalPool,      goalCount,  id * 29 + 13),
    hobbies:     seededSample(ALL_HOBBIES,   hobbyCount, id * 31 + 17),
  }
}

// ── Mock data — 80 employees ───────────────────────────────────────────────────
// Distribution: 64 FTE (80 %) · 16 PT (20 %)
// Teams covered: Engineering · Design · PM · TPM · QA ·
//                Marketing · Business Development · Finance ·
//                Biz Ops · Legal · People Ops · Talent · General Ops · Exec

export const MOCK_PEOPLE: Person[] = [
  // ── Exec (5) ────────────────────────────────────────────────────────────────
  person(1,  'James Foster',     'CEO',                                   'Exec',                 'London, UK'),
  person(2,  'Sarah Kim',        'COO',                                   'Exec',                 'New York, USA'),
  person(3,  'David Park',       'CTO',                                   'Exec',                 'London, UK'),
  person(4,  'Emma Walsh',       'CPO',                                   'Exec',                 'Amsterdam, NL'),
  person(5,  'Tom Bradley',      'Director of Engineering',               'Exec',                 'Berlin, DE'),

  // ── Engineering (18) ────────────────────────────────────────────────────────
  person(6,  'Madelyn Lipshutz', 'Senior Software Engineer',              'Engineering',          'London, UK'),
  person(7,  'Charlie George',   'Senior Software Engineer',              'Engineering',          'London, UK'),
  person(8,  'Justin Stanton',   'Senior Software Engineer',              'Engineering',          'New York, USA',  'PT'),
  person(9,  'Lucas Reed',       'Software Engineer',                     'Engineering',          'Berlin, DE'),
  person(10, 'Olivia Brooks',    'Software Engineer',                     'Engineering',          'Warsaw, PL'),
  person(11, 'Noah Turner',      'Staff Software Engineer',               'Engineering',          'Amsterdam, NL'),
  person(12, 'Sofia Martinez',   'Software Engineer',                     'Engineering',          'Remote'),
  person(13, 'Ethan Lee',        'Senior Software Engineer',              'Engineering',          'London, UK'),
  person(14, 'Ava Wilson',       'Software Engineer',                     'Engineering',          'Dublin, IE',     'PT'),
  person(15, 'Mason Brown',      'Staff Software Engineer',               'Engineering',          'Berlin, DE'),
  person(16, 'Isabella Johnson', 'Software Engineer',                     'Engineering',          'London, UK'),
  person(17, 'Logan Davis',      'Data Engineer',                         'Engineering',          'Amsterdam, NL',  'PT'),
  person(18, 'Mia Thomas',       'Senior Software Engineer',              'Engineering',          'New York, USA'),
  person(19, 'Liam Anderson',    'Software Engineer',                     'Engineering',          'Warsaw, PL',     'PT'),
  person(20, 'Ella Jackson',     'Software Engineer',                     'Engineering',          'Remote',         'PT'),
  person(21, 'Oliver White',     'Engineering Manager',                   'Engineering',          'London, UK'),
  person(22, 'Charlotte Harris', 'Senior Software Engineer',              'Engineering',          'Dublin, IE'),
  person(23, 'James Clark',      'Software Engineer',                     'Engineering',          'Berlin, DE'),

  // ── Design (8) ──────────────────────────────────────────────────────────────
  person(24, 'Ryan Chen',        'Senior Product Designer',               'Design',               'London, UK'),
  person(25, 'Natalie Vance',    'Lead Product Designer',                 'Design',               'Amsterdam, NL'),
  person(26, 'Daniel Foster',    'Product Designer',                      'Design',               'Berlin, DE'),
  person(27, 'Zoe Harper',       'Senior Brand Designer',                 'Design',               'New York, USA'),
  person(28, 'Kyle Morris',      'Product Designer',                      'Design',               'London, UK',     'PT'),
  person(29, 'Hailey Brooks',    'Senior Product Designer',               'Design',               'Warsaw, PL'),
  person(30, 'Aaron Webb',       'Director of Design',                    'Design',               'London, UK'),
  person(31, 'Chloe Park',       'Product Designer',                      'Design',               'Remote'),

  // ── PM (8) ──────────────────────────────────────────────────────────────────
  person(32, 'Ahmad Saris',      'Senior Product Manager',                'PM',                   'London, UK'),
  person(33, 'Kaiya Vaccaro',    'Senior Product Manager',                'PM',                   'New York, USA'),
  person(34, 'Brandon Lee',      'Lead Product Manager',                  'PM',                   'London, UK'),
  person(35, 'Skylar Dorwart',   'Director of Product & Partnerships',    'PM',                   'Amsterdam, NL'),
  person(36, 'Morgan Ellis',     'Senior Product Manager',                'PM',                   'Berlin, DE',     'PT'),
  person(37, 'Peyton Adams',     'Lead Product Manager',                  'PM',                   'Warsaw, PL'),
  person(38, 'Taylor Quinn',     'Senior Product Manager',                'PM',                   'Dublin, IE'),
  person(39, 'Jordan Lewis',     'Lead Product Manager',                  'PM',                   'Remote'),

  // ── TPM (7) ─────────────────────────────────────────────────────────────────
  person(40, 'Tatiana Westervelt','Senior Technical Project Manager',     'TPM',                  'London, UK'),
  person(41, 'Anika Lipshutz',   'Senior Technical Project Manager',     'TPM',                  'London, UK'),
  person(42, 'Ashlynn Donin',    'Senior Technical Project Manager',     'TPM',                  'New York, USA'),
  person(43, 'Casey Morgan',     'Lead Technical Project Manager',       'TPM',                  'Berlin, DE'),
  person(44, 'Riley Thompson',   'Senior Technical Advisor',             'TPM',                  'Amsterdam, NL',  'PT'),
  person(45, 'Drew Foster',      'Lead Program Manager',                 'TPM',                  'London, UK'),
  person(46, 'Harper Collins',   'Director of Technical Project Management', 'TPM',              'Remote'),

  // ── QA (4) ──────────────────────────────────────────────────────────────────
  person(47, 'Makenna Geidt',    'Senior QA Engineer',                   'QA',                   'London, UK'),
  person(48, 'Sam Wilson',       'Senior QA Engineer',                   'QA',                   'Berlin, DE'),
  person(49, 'Alex Rivera',      'Senior QA Engineer',                   'QA',                   'New York, USA',  'PT'),
  person(50, 'Jordan Kim',       'Senior QA Engineer',                   'QA',                   'Warsaw, PL'),

  // ── Marketing (5) ───────────────────────────────────────────────────────────
  person(51, 'Lauren Taylor',    'Branding & Growth Manager',            'Marketing',             'London, UK'),
  person(52, 'Chris Evans',      'Growth Advisor',                       'Marketing',             'New York, USA'),
  person(53, 'Rebecca Moore',    'Senior Brand Designer',                'Marketing',             'Amsterdam, NL'),
  person(54, 'Tyler Scott',      'Branding & Growth Manager',            'Marketing',             'Berlin, DE',     'PT'),
  person(55, 'Amanda Green',     'Growth Advisor',                       'Marketing',             'Remote'),

  // ── Business Development (4) ────────────────────────────────────────────────
  person(56, 'Jake Harrison',    'Director of Business Development',     'Business Development',  'London, UK'),
  person(57, 'Emily Rose',       'Strategic Advisor',                    'Business Development',  'New York, USA'),
  person(58, 'Nathan Cruz',      'Director of Business Development',     'Business Development',  'Amsterdam, NL'),
  person(59, 'Victoria Lang',    'Strategic Advisor',                    'Business Development',  'Berlin, DE',     'PT'),

  // ── Finance (4) ─────────────────────────────────────────────────────────────
  person(60, 'Mark Johnson',     'Senior Finance Manager',               'Finance',               'London, UK'),
  person(61, 'Lisa Chen',        'Finance Associate',                    'Finance',               'New York, USA'),
  person(62, 'Peter Watson',     'Finance Consultant',                   'Finance',               'Amsterdam, NL'),
  person(63, 'Sandra Lee',       'Finance Associate',                    'Finance',               'Berlin, DE',     'PT'),

  // ── Biz Ops (4) ─────────────────────────────────────────────────────────────
  person(64, 'Michael Torres',   'Director of Business Operations & Finance', 'Biz Ops',         'London, UK'),
  person(65, 'Rachel Green',     'IT Operations Manager',                'Biz Ops',               'New York, USA'),
  person(66, 'Jason Park',       'SAP Fieldglass Solution Architect',    'Biz Ops',               'Amsterdam, NL'),
  person(67, 'Diana Ross',       'IT Operations Manager',                'Biz Ops',               'Berlin, DE',     'PT'),

  // ── Legal (3) ───────────────────────────────────────────────────────────────
  person(68, 'Chance Siphron',   'Legal Advisor',                        'Legal',                 'London, UK'),
  person(69, 'Patricia Stone',   'Legal Advisor',                        'Legal',                 'New York, USA'),
  person(70, 'Robert King',      'Legal Advisor',                        'Legal',                 'Amsterdam, NL'),

  // ── People Ops (4) ──────────────────────────────────────────────────────────
  person(71, 'Jennifer Walsh',   'Talent Partner',                       'People Ops',            'London, UK'),
  person(72, 'Marcus Bennett',   'Lead Talent Partner',                  'People Ops',            'New York, USA'),
  person(73, 'Angela Foster',    'Talent Partner',                       'People Ops',            'Berlin, DE'),
  person(74, 'Dennis Kim',       'Intern',                               'People Ops',            'Warsaw, PL',     'PT'),

  // ── Talent (3) ──────────────────────────────────────────────────────────────
  person(75, 'Mira Culhane',     'Lead Talent Partner',                  'Talent',                'London, UK'),
  person(76, 'Brian Cole',       'Talent Partner',                       'Talent',                'New York, USA'),
  person(77, 'Stephanie Ray',    'Talent Partner',                       'Talent',                'Amsterdam, NL',  'PT'),

  // ── General Ops (3) ─────────────────────────────────────────────────────────
  person(78, 'George Miller',    'Director of Operations',               'General Ops',           'London, UK'),
  person(79, 'Karen Lewis',      'Executive Admin',                      'General Ops',           'New York, USA'),
  person(80, 'Henry Phillips',   'Director of Operations',               'General Ops',           'Berlin, DE',     'PT'),
]

// Convenience: sorted alphabetically by name (matches Figma A→Z default)
export const MOCK_PEOPLE_SORTED = [...MOCK_PEOPLE].sort((a, b) =>
  a.name.localeCompare(b.name)
)

// Fast lookup: id → Person
export const PERSON_MAP: Map<string, Person> = new Map(
  MOCK_PEOPLE.map((p) => [p.id, p])
)

/**
 * Manager assignments — person-N → person-M means person-N reports to person-M.
 *
 * Exec team (persons 1–5) are intentionally omitted so their Manager field
 * renders "—" in the side panel.
 *
 * Hierarchy overview:
 *   CEO (#1)
 *   ├── COO (#2) → Biz Dev (#56), Biz Ops (#64), Marketing (#51),
 *   │              Legal (#68,69,70), People Ops (#72), Gen Ops (#78)
 *   ├── CTO (#3) → Dir Eng (#5), Dir TPM (#46)
 *   │              #5  → Eng Mgr (#21) → all 17 Engineers
 *   │              #5  → QA lead (#47) → QA ICs
 *   └── CPO (#4) → Dir Design (#30), Dir Product (#35)
 *                  #30 → all 7 Designers
 *                  #35 → Lead PMs (#34, #39) → PM ICs
 */
export const MANAGER_MAP: Record<string, string> = {
  // ── L1 → CEO ────────────────────────────────────────────────────────────────
  'person-2': 'person-1',   // Sarah Kim (COO)
  'person-3': 'person-1',   // David Park (CTO)
  'person-4': 'person-1',   // Emma Walsh (CPO)

  // ── L2 Engineering → CTO → Dir Eng ─────────────────────────────────────────
  'person-5':  'person-3',  // Tom Bradley (Dir. Eng) → CTO
  'person-21': 'person-5',  // Oliver White (Eng. Mgr) → Dir. Eng

  // All engineers → Oliver White (Eng. Mgr)
  'person-6':  'person-21',
  'person-7':  'person-21',
  'person-8':  'person-21',
  'person-9':  'person-21',
  'person-10': 'person-21',
  'person-11': 'person-21',
  'person-12': 'person-21',
  'person-13': 'person-21',
  'person-14': 'person-21',
  'person-15': 'person-21',
  'person-16': 'person-21',
  'person-17': 'person-21',
  'person-18': 'person-21',
  'person-19': 'person-21',
  'person-20': 'person-21',
  'person-22': 'person-21',
  'person-23': 'person-21',

  // QA → Dir. Eng, QA ICs → QA lead
  'person-47': 'person-5',   // Makenna Geidt (QA lead) → Tom Bradley
  'person-48': 'person-47',  // Sam Wilson
  'person-49': 'person-47',  // Alex Rivera
  'person-50': 'person-47',  // Jordan Kim

  // ── L2 TPM → CTO ────────────────────────────────────────────────────────────
  'person-46': 'person-3',  // Harper Collins (Dir. TPM) → CTO

  'person-40': 'person-46',  // Tatiana Westervelt
  'person-41': 'person-46',  // Anika Lipshutz
  'person-42': 'person-46',  // Ashlynn Donin
  'person-43': 'person-46',  // Casey Morgan
  'person-44': 'person-46',  // Riley Thompson
  'person-45': 'person-46',  // Drew Foster

  // ── L2 Design → CPO ─────────────────────────────────────────────────────────
  'person-30': 'person-4',  // Aaron Webb (Dir. Design) → CPO

  'person-24': 'person-30',  // Ryan Chen
  'person-25': 'person-30',  // Natalie Vance
  'person-26': 'person-30',  // Daniel Foster
  'person-27': 'person-30',  // Zoe Harper
  'person-28': 'person-30',  // Kyle Morris
  'person-29': 'person-30',  // Hailey Brooks
  'person-31': 'person-30',  // Chloe Park

  // ── L2 Product → CPO ────────────────────────────────────────────────────────
  'person-35': 'person-4',  // Skylar Dorwart (Dir. Product) → CPO

  'person-34': 'person-35',  // Brandon Lee (Lead PM) → Skylar
  'person-39': 'person-35',  // Jordan Lewis (Lead PM) → Skylar
  'person-36': 'person-35',  // Morgan Ellis → Skylar
  'person-37': 'person-35',  // Peyton Adams → Skylar

  'person-32': 'person-34',  // Ahmad Saris → Brandon Lee
  'person-33': 'person-34',  // Kaiya Vaccaro → Brandon Lee
  'person-38': 'person-39',  // Taylor Quinn → Jordan Lewis

  // ── L2 COO reports ──────────────────────────────────────────────────────────
  // Marketing
  'person-51': 'person-2',   // Lauren Taylor (Marketing Mgr) → COO
  'person-52': 'person-51',  // Chris Evans
  'person-53': 'person-51',  // Rebecca Moore
  'person-54': 'person-51',  // Tyler Scott
  'person-55': 'person-51',  // Amanda Green

  // Biz Dev
  'person-56': 'person-2',   // Jake Harrison (Dir. Biz Dev) → COO
  'person-57': 'person-56',  // Emily Rose
  'person-58': 'person-56',  // Nathan Cruz
  'person-59': 'person-56',  // Victoria Lang

  // Biz Ops & Finance (all under Michael Torres)
  'person-64': 'person-2',   // Michael Torres (Dir. Biz Ops & Finance) → COO
  'person-65': 'person-64',  // Rachel Green
  'person-66': 'person-64',  // Jason Park
  'person-67': 'person-64',  // Diana Ross
  'person-60': 'person-64',  // Mark Johnson (Finance)
  'person-61': 'person-64',  // Lisa Chen
  'person-62': 'person-64',  // Peter Watson
  'person-63': 'person-64',  // Sandra Lee

  // Legal → COO
  'person-68': 'person-2',
  'person-69': 'person-2',
  'person-70': 'person-2',

  // People Ops → Marcus Bennett (Lead)
  'person-72': 'person-2',   // Marcus Bennett → COO
  'person-71': 'person-72',  // Jennifer Walsh
  'person-73': 'person-72',  // Angela Foster
  'person-74': 'person-72',  // Dennis Kim

  // Talent → Mira Culhane → Marcus Bennett
  'person-75': 'person-72',  // Mira Culhane (Lead Talent) → Marcus
  'person-76': 'person-75',  // Brian Cole
  'person-77': 'person-75',  // Stephanie Ray

  // General Ops → COO
  'person-78': 'person-2',   // George Miller (Dir. Ops) → COO
  'person-79': 'person-78',  // Karen Lewis
  'person-80': 'person-78',  // Henry Phillips
}

/** Fast lookup: managerId → array of direct-report IDs */
export const DIRECT_REPORTS_MAP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>()
  for (const [reportId, managerId] of Object.entries(MANAGER_MAP)) {
    const arr = map.get(managerId) ?? []
    arr.push(reportId)
    map.set(managerId, arr)
  }
  return map
})()
