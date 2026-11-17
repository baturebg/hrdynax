// SAMPLE finance, payroll and company data (rand). Replace with SAP / payroll exports.

import type { AgeBand, VatLine } from '../lib/tax/za';
import { DELIVERED, MODELS, TECHS } from './sample';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = mulberry32(777);
const rnd = (a: number, b: number) => a + R() * (b - a);

export const CURRENT_USER = { name: 'Dr. Yusuf Ibrahim', greeting: 'Dr. Yusuf', initials: 'YI' };
export const COMPANY = { name: 'HRDYNAX', tagline: 'Mining Smarter. Growing Greater.', vatCategory: 'Category C (monthly)', financialYearEnd: 'February' };

/* ---------- monthly performance, R million ---------- */
export const PERFORMANCE = DELIVERED.map((d, i) => {
  const revenue = +(92 + i * 3.4 + rnd(-4, 4)).toFixed(1);
  const cost = +(revenue * rnd(0.6, 0.66)).toFixed(1);
  return { label: d.label, revenue, cost, ebitda: +(revenue - cost).toFixed(1) };
});
export const PRIOR_YEAR_REVENUE = PERFORMANCE.map((p) => +(p.revenue / rnd(1.14, 1.23)).toFixed(1));
export const ANNUAL_BUDGET = 1_420_000_000;
export const LTIFR = { current: 0.24, prior: 0.29 };

/* ---------- VAT201 for October 2026 (VAT-exclusive values) ---------- */
export const VAT_PERIOD = { label: 'October 2026', due: 'Mon 30 Nov 2026', dueNote: 'eFiling: last business day of the month after the period' };
const oct = PERFORMANCE[PERFORMANCE.length - 2].revenue * 1e6;
export const VAT_SUPPLIES: VatLine[] = [
  { label: 'MMU units sold to South African clients', amount: Math.round(oct * 0.34), treatment: 'standard' },
  { label: 'Emulsion and services to SA mines', amount: Math.round(oct * 0.53), treatment: 'standard' },
  { label: 'Exports to Akosua Gold, Ghana — zero-rated, s11(1)(a)', amount: Math.round(oct * 0.13), treatment: 'zero' },
];
export const VAT_ACQUISITIONS: VatLine[] = [
  { label: 'Chassis and capital equipment', amount: 21_600_000, treatment: 'standard' },
  { label: 'Steel, pumps and components', amount: 17_350_000, treatment: 'standard' },
  { label: 'Contractors and services', amount: 6_900_000, treatment: 'standard' },
  { label: 'Import VAT on PLC kits (paid to SARS Customs)', amount: 3_240_000, treatment: 'standard', vatPaid: 486_000 },
  { label: 'Client entertainment — input tax denied, s17(2)(a)', amount: 84_000, treatment: 'standard', denied: true },
];

/* ---------- company tax (financial year ending Feb 2027) ---------- */
export const CIT = {
  yearLabel: 'Year ending 28 Feb 2027',
  capitalAllowances: 96_000_000,
  firstProvisionalPaid: 98_500_000,
};

/* ---------- payroll (November 2026) ---------- */
export interface SalaryBand {
  band: string;
  count: number;
  avg: number;
}
export const SALARY_BANDS: SalaryBand[] = [
  { band: 'Up to R15 000', count: 96, avg: 12_400 },
  { band: 'R15 000 – R25 000', count: 142, avg: 19_800 },
  { band: 'R25 000 – R40 000', count: 131, avg: 31_500 },
  { band: 'R40 000 – R60 000', count: 78, avg: 48_600 },
  { band: 'R60 000 – R90 000', count: 29, avg: 72_300 },
  { band: 'Over R90 000', count: 10, avg: 118_000 },
];
export const STAFF_TOTAL = SALARY_BANDS.reduce((a, b) => a + b.count, 0);
export const RETIREMENT_RATE = 0.075;

export interface TechPay {
  id: string;
  gross: number;
  retirement: number;
  medicalMembers: number;
  age: AgeBand;
}
export const TECH_PAY: TechPay[] = TECHS.map((t) => {
  const gross = Math.round(rnd(28, 62)) * 1000;
  return { id: t.id, gross, retirement: Math.round(gross * RETIREMENT_RATE), medicalMembers: Math.floor(rnd(1, 5)), age: R() < 0.08 ? '65to74' : 'under65' };
});

/* ---------- cost per unit (VAT-exclusive, rand) ---------- */
export const COST_PARTS = ['Chassis', 'Body and tanks', 'Pump system', 'Electrical and PLC', 'Labour', 'Commissioning'] as const;
export const MODEL_COSTS = MODELS.map((model, i) => {
  const scale = [1, 1.32, 0.86, 0.74][i];
  const parts = [1_650_000, 1_120_000, 780_000, 540_000, 520_000, 190_000].map((v) => Math.round((v * scale * rnd(0.95, 1.08)) / 1000) * 1000);
  const budget = Math.round((parts.reduce((a, b) => a + b, 0) * rnd(0.94, 1.06)) / 10_000) * 10_000;
  return { model, parts, budget };
});

/* ---------- calendar ---------- */
export interface Activity {
  title: string;
  when: string;
  tag: string;
  tone: 'info' | 'warn' | 'ok' | 'mute';
  to?: string;
}
export const ACTIVITIES: Activity[] = [
  { title: 'Board meeting – Pipeline review', when: 'Today · 11:00', tag: 'Meeting', tone: 'info', to: '/pipeline' },
  { title: 'VAT201 – October 2026', when: 'Due Mon 30 Nov', tag: 'SARS', tone: 'warn', to: '/finance/tax' },
  { title: 'Site inspection – Marula East', when: 'Tomorrow · 09:00', tag: 'Inspection', tone: 'ok', to: '/compliance' },
  { title: 'EMP201 – November payroll', when: 'Due Mon 7 Dec', tag: 'SARS', tone: 'warn', to: '/hr/payroll' },
];

export interface FilingDate {
  return: string;
  what: string;
  due: string;
  status: 'Done' | 'Due' | 'Upcoming';
}
export const FILING_CALENDAR: FilingDate[] = [
  { return: 'EMP501 interim', what: 'PAYE, UIF and SDL reconciliation, Mar–Aug 2026', due: 'Sat 31 Oct 2026', status: 'Done' },
  { return: 'VAT201', what: 'VAT return for October 2026 (Category C)', due: 'Mon 30 Nov 2026', status: 'Due' },
  { return: 'EMP201', what: 'PAYE, UIF and SDL for November 2026', due: 'Mon 7 Dec 2026', status: 'Upcoming' },
  { return: 'VAT201', what: 'VAT return for November 2026', due: 'Thu 31 Dec 2026', status: 'Upcoming' },
  { return: 'IRP6 (2nd period)', what: 'Provisional company tax, year ending Feb 2027', due: 'Fri 26 Feb 2027', status: 'Upcoming' },
  { return: 'EMP501 annual', what: 'Employer reconciliation, Mar 2026–Feb 2027', due: 'Mon 31 May 2027', status: 'Upcoming' },
];

/* ---------- provinces ---------- */
export interface Province {
  code: string;
  name: string;
  col: number;
  row: number;
  span?: number;
}
export const PROVINCES: Province[] = [
  { code: 'LP', name: 'Limpopo', col: 3, row: 1 },
  { code: 'NW', name: 'North West', col: 2, row: 2 },
  { code: 'GP', name: 'Gauteng', col: 3, row: 2 },
  { code: 'MP', name: 'Mpumalanga', col: 4, row: 2 },
  { code: 'NC', name: 'Northern Cape', col: 1, row: 3 },
  { code: 'FS', name: 'Free State', col: 2, row: 3 },
  { code: 'KZN', name: 'KwaZulu-Natal', col: 4, row: 3 },
  { code: 'WC', name: 'Western Cape', col: 1, row: 4 },
  { code: 'EC', name: 'Eastern Cape', col: 2, row: 4, span: 2 },
];
export const SITE_PROVINCE: Record<string, string> = {
  'Ridgeback Open Pit': 'LP',
  'Kwena North': 'MP',
  'Tswelopele Quarry': 'GP',
  'Blue Gum Colliery': 'MP',
  'Marula East': 'NC',
  'Akosua Gold': 'GH',
};
