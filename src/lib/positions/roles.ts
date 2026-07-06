// Role taxonomy — real BambooHR titles (Jun 2026), mapped to department + seniority chip.
// Department is derived from the title in BambooHR; never set by hand in Allox.
export interface Role { title: string; label: string; chip: string | null; dept: string }

export const BASE_ROLES: Role[] = [
  { title: "Staff Software Engineer", label: "Software Engineer", chip: "Staff", dept: "Engineering" },
  { title: "Senior Software Engineer", label: "Software Engineer", chip: "Senior", dept: "Engineering" },
  { title: "Software Engineer", label: "Software Engineer", chip: "Mid", dept: "Engineering" },
  { title: "Data Engineer", label: "Data Engineer", chip: null, dept: "Engineering" },
  { title: "Engineering Manager", label: "Engineering Manager", chip: "Manager", dept: "Engineering" },
  { title: "Senior QA Engineer", label: "QA Engineer", chip: "Senior", dept: "QA" },
  { title: "Principal Product Manager", label: "Product Manager", chip: "Principal", dept: "Product" },
  { title: "Lead Product Manager", label: "Product Manager", chip: "Lead", dept: "Product" },
  { title: "Senior Product Manager", label: "Product Manager", chip: "Senior", dept: "Product" },
  { title: "Product Manager", label: "Product Manager", chip: "Mid", dept: "Product" },
  { title: "Lead Product Designer", label: "Product Designer", chip: "Lead", dept: "Design" },
  { title: "Senior Product Designer", label: "Product Designer", chip: "Senior", dept: "Design" },
  { title: "Product Designer", label: "Product Designer", chip: "Mid", dept: "Design" },
  { title: "Senior Brand Designer", label: "Brand Designer", chip: "Senior", dept: "Design" },
  { title: "Senior Technical Project Manager", label: "Technical Project Manager", chip: "Senior", dept: "Program Mgmt" },
  { title: "Lead Technical Project Manager", label: "Technical Project Manager", chip: "Lead", dept: "Program Mgmt" },
  { title: "Senior Program Manager", label: "Program Manager", chip: "Senior", dept: "Program Mgmt" },
  { title: "Lead Program Manager", label: "Program Manager", chip: "Lead", dept: "Program Mgmt" },
  { title: "Lead Talent Partner", label: "Talent Partner", chip: "Lead", dept: "People & Talent" },
  { title: "Talent Partner", label: "Talent Partner", chip: "Mid", dept: "People & Talent" },
  { title: "People Operations Manager", label: "People Operations Manager", chip: "Manager", dept: "People & Talent" },
  { title: "People Partner", label: "People Partner", chip: null, dept: "People & Talent" },
  { title: "Branding & Growth Manager", label: "Branding & Growth Manager", chip: "Manager", dept: "Marketing & Growth" },
  { title: "Partnerships & Community Manager", label: "Partnerships & Community Manager", chip: "Manager", dept: "Marketing & Growth" },
  { title: "Senior Finance Manager", label: "Finance Manager", chip: "Senior", dept: "Finance" },
  { title: "Finance Associate", label: "Finance Associate", chip: null, dept: "Finance" },
  { title: "Finance Consultant", label: "Finance Consultant", chip: null, dept: "Finance" },
  { title: "Operations Lead", label: "Operations Lead", chip: "Lead", dept: "Operations" },
  { title: "IT Operations Manager", label: "IT Operations Manager", chip: "Manager", dept: "Operations" },
  { title: "Office Executive", label: "Office Executive", chip: null, dept: "Operations" },
  { title: "Executive Admin", label: "Executive Admin", chip: null, dept: "Operations" },
  { title: "Intern", label: "Intern", chip: null, dept: "Operations" },
  { title: "SAP Fieldglass Solution Architect", label: "SAP Fieldglass Solution Architect", chip: null, dept: "Engineering" },
  { title: "CEO", label: "CEO", chip: null, dept: "Exec & Advisory" },
  { title: "COO", label: "COO", chip: null, dept: "Exec & Advisory" },
  { title: "CPO", label: "CPO", chip: null, dept: "Exec & Advisory" },
  { title: "CTO", label: "CTO", chip: null, dept: "Exec & Advisory" },
  { title: "Director of Engineering", label: "Director of Engineering", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Product Management", label: "Director of Product Management", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Design", label: "Director of Design", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Marketing", label: "Director of Marketing", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Operations", label: "Director of Operations", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Business Development", label: "Director of Business Development", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Business Operations & Finance", label: "Director of Business Operations & Finance", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Product & Partnerships", label: "Director of Product & Partnerships", chip: "Director", dept: "Exec & Advisory" },
  { title: "Director of Technical Project Management", label: "Director of Technical Project Management", chip: "Director", dept: "Exec & Advisory" },
  { title: "Strategic Advisor", label: "Strategic Advisor", chip: "Advisor", dept: "Exec & Advisory" },
  { title: "Product Advisor", label: "Product Advisor", chip: "Advisor", dept: "Exec & Advisory" },
  { title: "Design Advisor", label: "Design Advisor", chip: "Advisor", dept: "Exec & Advisory" },
  { title: "Legal Advisor", label: "Legal Advisor", chip: "Advisor", dept: "Exec & Advisory" },
  { title: "Technical Advisor", label: "Technical Advisor", chip: "Advisor", dept: "Exec & Advisory" },
  { title: "Senior Technical Advisor", label: "Technical Advisor", chip: "Advisor", dept: "Exec & Advisory" },
];

export const DEPT_ORDER = ["Engineering", "QA", "Product", "Design", "Program Mgmt", "People & Talent", "Marketing & Growth", "Finance", "Operations", "Exec & Advisory"];
export const DEPTS = ["All", ...DEPT_ORDER];
export const EXEC_DEPT = "Exec & Advisory";
export const LOCATIONS = ["India", "Europe", "North America"] as const;
export const isExecTitle = (title: string) => BASE_ROLES.find((x) => x.title === title)?.dept === EXEC_DEPT;
export const findRole = (roles: Role[], title: string) => roles.find((r) => r.title === title);
export const deptOfIn = (roles: Role[], title: string) => findRole(roles, title)?.dept ?? "Engineering";
