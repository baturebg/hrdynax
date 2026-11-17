// The HRDYNAX ecosystem: sidebar modules and every page inside them.
// `wireframe: true` pages render a layout placeholder until they are built.

import {
  BarChart3,
  BrainCircuit,
  FolderKanban,
  LayoutDashboard,
  MapPinned,
  Radar,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from './data/types';

export type ModuleId =
  | 'dashboard' | 'operations' | 'projects' | 'hr' | 'finance' | 'regions'
  | 'equipment' | 'safety' | 'reports' | 'ai' | 'automation' | 'settings';

export interface ModuleDef {
  id: ModuleId;
  name: string;
  icon: LucideIcon;
  badge?: string;
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'operations', name: 'Operations Center', icon: Radar, badge: 'New' },
  { id: 'projects', name: 'Project Management', icon: FolderKanban },
  { id: 'hr', name: 'Human Resources', icon: Users },
  { id: 'finance', name: 'Finance & Budget', icon: Wallet },
  { id: 'regions', name: 'Provincial & Regional', icon: MapPinned },
  { id: 'equipment', name: 'Equipment & Assets', icon: Truck },
  { id: 'safety', name: 'Safety & Compliance', icon: ShieldCheck },
  { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 },
  { id: 'ai', name: 'AI Intelligence', icon: BrainCircuit },
  { id: 'automation', name: 'Automation Workflows', icon: Workflow },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export interface PageDef {
  id: string;
  path: string;
  module: ModuleId;
  name: string;
  /** the HR dashboard page this one is modelled on */
  hr: string;
  measures: string[];
  sources: string[];
  wireframe?: boolean;
  /** permission needed to see the page's content */
  needs?: Permission;
  /** show the site and model filters in the page header */
  filters?: boolean;
}

export const PAGES: PageDef[] = [
  { id: 'dashboard', path: '/', module: 'dashboard', name: 'Dashboard', hr: 'Executive overview', measures: ['Projects', 'Budget', 'Staff', 'Compliance', 'LTIFR'], sources: ['All modules'] },

  { id: 'lifecycle', path: '/operations', module: 'operations', name: 'MMU Life Cycle', hr: 'Home: Employee Life Cycle wheel', measures: ['Units by stage', 'Needs attention'], sources: ['Build tracker', 'Telemetry'], filters: true },
  { id: 'availability', path: '/availability', module: 'operations', name: 'Fleet Availability', hr: 'Absenteeism', measures: ['Uptime %', 'Downtime hours', 'By site and shift'], sources: ['SCADA/PLC telemetry'], filters: true },
  { id: 'quality', path: '/quality', module: 'operations', name: 'Commissioning Quality', hr: 'Expectation Rating', measures: ['First-time pass rate', 'Retests', 'ITP sign-off'], sources: ['Commissioning DB'], filters: true },
  { id: 'faults', path: '/faults', module: 'operations', name: 'Fault Profile', hr: 'Termination Profile', measures: ['Faults by code', 'Faults by component', 'Fault cause (Sankey)'], sources: ['Telemetry', 'Maintenance records'], wireframe: true },
  { id: 'breakdowns', path: '/breakdowns', module: 'operations', name: 'Breakdown Analysis', hr: 'Attrition Analysis', measures: ['Unplanned callouts', 'Mean time between failures'], sources: ['Maintenance records'], wireframe: true },

  { id: 'pipeline', path: '/pipeline', module: 'projects', name: 'Pipeline at a Glance', hr: 'HR at a Glance', measures: ['Units by stage', 'Overdue units', 'Units delivered'], sources: ['Build tracker', 'Project schedules'], filters: true },
  { id: 'starts', path: '/build-starts', module: 'projects', name: 'Build Starts', hr: 'New Starters', measures: ['Units started', 'Starts vs completions', 'Rolling 12 months'], sources: ['Build tracker', 'Project schedules'], wireframe: true },

  { id: 'crew', path: '/crew', module: 'hr', name: 'Crew Availability', hr: 'Absenteeism + Leave', measures: ['Leave', 'Shifts', 'Cover gaps', 'Planned jobs vs available crew'], sources: ['HR leave', 'Shift roster', 'Job plan'] },
  { id: 'payroll', path: '/hr/payroll', module: 'hr', name: 'Payroll & PAYE', hr: 'Salary Analysis', measures: ['Gross payroll', 'PAYE', 'UIF', 'SDL', 'EMP201'], sources: ['Payroll system', 'SARS tax tables'], needs: 'payroll' },
  { id: 'tech', path: '/technicians', module: 'hr', name: 'Technician Profile', hr: 'Employee Profile', measures: ['Certifications', 'Sites', 'Jobs done'], sources: ['HR system', 'Technician ID on build, test & maintenance records'], needs: 'people' },
  { id: 'techquality', path: '/technician-quality', module: 'hr', name: 'Technician Quality', hr: 'Expectation Rating', measures: ['First-time pass rate by technician'], sources: ['Commissioning DB'], needs: 'people', wireframe: true },
  { id: 'retention', path: '/retention', module: 'hr', name: 'Key-skill Retention', hr: 'Attrition Prediction', measures: ['Retention risk', 'Units each at-risk technician supports'], sources: ['HR system', 'Prediction model output'], needs: 'people' },

  { id: 'tax', path: '/finance/tax', module: 'finance', name: 'Tax Centre', hr: 'New · no HR equivalent', measures: ['VAT201', 'EMP201', 'Provisional tax (IRP6)', 'Filing calendar'], sources: ['SAP/ERP', 'Payroll', 'SARS tax tables'], needs: 'finance' },
  { id: 'cost', path: '/finance/cost', module: 'finance', name: 'Cost per Unit', hr: 'Salary Analysis', measures: ['Build cost', 'Input VAT', 'Cost vs budget'], sources: ['SAP/ERP'], needs: 'finance' },

  { id: 'sites', path: '/regions', module: 'regions', name: 'Provinces & Client Sites', hr: 'Department Profile', measures: ['Units on site', 'Availability', 'Open faults', 'Permits due'], sources: ['All sources'], wireframe: true },

  { id: 'fleet', path: '/fleet', module: 'equipment', name: 'Fleet Profile', hr: 'Demographic Analysis', measures: ['Units by model', 'Units by client site', 'Units by province', 'Unit age'], sources: ['Build tracker', 'SAP'], wireframe: true },
  { id: 'unit', path: '/units', module: 'equipment', name: 'Unit Profile', hr: 'Employee Profile (drill-through)', measures: ['Build status', 'Test results', 'Certificates', 'Fault history'], sources: ['All sources'] },
  { id: 'risk', path: '/risk', module: 'equipment', name: 'Failure Risk', hr: 'Attrition Prediction', measures: ['Risk score per unit', 'Low / Medium / Peak'], sources: ['Prediction model output'], filters: true },

  { id: 'compliance', path: '/compliance', module: 'safety', name: 'Permits & Compliance', hr: 'New · no HR equivalent', measures: ['Compliance rate', 'Permits due', 'Certificates due', 'LTIFR'], sources: ['Permit register', 'HR certificates', 'SHEQ incidents'], filters: true },

  { id: 'trends', path: '/trends', module: 'reports', name: 'Delivery Trends', hr: 'Historical & Trends', measures: ['Units completed per month', 'Cycle time', 'Month-over-month change'], sources: ['Build tracker'] },

  { id: 'intake', path: '/intake', module: 'ai', name: 'AI Intake Review', hr: 'New · no HR equivalent', measures: ['Waiting for review', 'Auto-filed', 'Technician ID coverage'], sources: ['Job notes', 'Uploaded documents', 'dbt tests'] },

  { id: 'automations', path: '/automations', module: 'automation', name: 'Automations', hr: 'New · no HR equivalent', measures: ['Rules on', 'AI jobs on', 'Actions this week'], sources: ['Power Automate', 'Logic Apps', 'Azure ML'] },
  { id: 'alerts', path: '/alerts', module: 'automation', name: 'Alerts & Approvals', hr: 'New · no HR equivalent', measures: ['Open alerts', 'Critical alerts', 'Waiting for approval'], sources: ['All automations'] },

  { id: 'settings', path: '/settings', module: 'settings', name: 'Tax Tables & Access', hr: 'New · no HR equivalent', measures: ['SARS tax tables', 'Role permissions'], sources: ['SARS', 'Entra ID groups'] },
];

export const pageById = (id: string) => {
  const p = PAGES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown page: ${id}`);
  return p;
};
export const pathOf = (id: string) => pageById(id).path;
export const moduleOf = (id: ModuleId) => MODULES.find((m) => m.id === id)!;
export const pagesIn = (id: ModuleId) => PAGES.filter((p) => p.module === id);

/** The page whose route matches the current pathname. */
export const pageForPath = (pathname: string) =>
  PAGES.find((p) => p.path !== '/' && (pathname === p.path || pathname.startsWith(p.path + '/'))) ?? PAGES[0];
