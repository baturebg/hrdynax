// Domain types for the MMU Control Tower.
// These mirror the star schema in the integration plan (FactBuild, FactCommissioningTest,
// FactTelemetry, FactMaintenance, FactShift, FactRiskScore, DimUnit, DimTechnician).

export type StageId =
  | 'procurement'
  | 'build'
  | 'commissioning'
  | 'handover'
  | 'fieldops'
  | 'maintenance'
  | 'compliance';

export type Role = 'admin' | 'exec' | 'ops' | 'finance' | 'hr';

/**
 * people  – named technicians, their certificates, risk scores and payslips
 * payroll – payroll totals and EMP201 figures (no names)
 * finance – VAT, company tax, costs and budgets
 */
export type Permission = 'people' | 'payroll' | 'finance';
export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'mute';

export interface Stage {
  id: StageId;
  name: string;
  /** id of the page the life-cycle wheel opens for this stage */
  page: string;
  /** planned days in stage (pipeline stages only, 0 otherwise) */
  plan: number;
  hint: string;
}

export interface Site {
  name: string;
  region: string;
}

export interface Cert {
  name: string;
  expiresInDays: number;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  base: string;
  certs: Cert[];
  /** first-time pass rate, % */
  ftp: number;
  /** jobs in the last 90 days */
  jobs: number;
  /** retention risk probability 0–1 (HR only) */
  risk: number;
  /** serials of units this technician appears on */
  units: string[];
}

export type TestResult = 'Pass' | 'Retest' | 'Fail';

export interface TestRecord {
  test: string;
  result: TestResult;
  date: Date;
  tech: string;
}

export interface FaultCode {
  code: string;
  name: string;
  comp: string;
}

export interface FaultRecord extends FaultCode {
  date: Date;
  hours: number;
  fix: string;
  tech: string;
}

export interface StageEntry {
  id: StageId;
  start: Date;
}

export interface Unit {
  serial: string;
  model: string;
  site: string;
  region: string;
  stage: StageId;
  techs: string[];
  hist: StageEntry[];
  // pipeline units
  daysIn: number;
  plan: number;
  overdue: boolean;
  due: Date;
  planned: Date;
  forecast: Date;
  slip: number;
  conf: number;
  // field units
  commissioned: Date;
  uptime: number;
  down: number;
  dayDown: number;
  prob: number;
  certDue: number;
  roadworthyInDays: number;
  anomaly: boolean;
  pressure: number[];
  // both
  tests: TestRecord[];
  faults: FaultRecord[];
  drivers: string[];
}

export type ShiftCode = 'D' | 'N' | 'L' | 'O';

export interface CrewRow {
  id: string;
  name: string;
  days: ShiftCode[];
}

export type Severity = 'bad' | 'warn' | 'info';

export interface Alert {
  id: string;
  sev: Severity;
  type: string;
  serial?: string;
  site: string | null;
  text: string;
  channel: string;
  automation: string;
  hoursAgo: number;
}

export interface Approval {
  id: string;
  what: string;
  value: string;
  why: string;
}

export interface Automation {
  id: string;
  kind: 'rule' | 'ai';
  name: string;
  trigger: string;
  action: string;
  tool: string;
  phase: string;
  lastRun: string;
  runs7d: number;
  approvalNote?: string;
}

export interface NoteExtraction {
  id: string;
  serial: string;
  by: string;
  text: string;
  out: { code: string; comp: string; cause: string; fix: string };
  conf: number;
}

export interface DocExtraction {
  id: string;
  file: string;
  kind: string;
  serial: string;
  fields: [string, string][];
  conf: number;
}

export interface DataFix {
  id: string;
  issue: string;
  fix: string;
  serial: string;
}

export interface Summary {
  text: string;
  src: string;
}

export interface AskResult {
  text: string;
  table?: { head: string[]; rows: (string | number)[][] };
  src: string;
  blocked?: boolean;
}

export interface ChatItem {
  q: string;
  r: AskResult;
}
