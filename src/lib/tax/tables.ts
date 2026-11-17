// South African tax tables.
//
// Values are the 2025/26 year of assessment (1 March 2025 – 28 February 2026), as published by SARS.
// The 2025 Budget left the personal income tax brackets and rebates unchanged from 2024/25 and
// withdrew the proposed VAT increase, so VAT stays at 15%.
//
// BEFORE GO-LIVE: confirm the tables for the current year of assessment on sars.gov.za and add them
// below as a new entry. Every calculation reads ACTIVE_TAX_YEAR, so a new year is one object.

export interface Bracket {
  /** lower bound of taxable income for this bracket (inclusive, rand) */
  from: number;
  /** tax on income up to `from` */
  base: number;
  /** marginal rate above `from` */
  rate: number;
}

export interface TaxYear {
  id: string;
  label: string;
  start: string; // ISO date
  end: string;
  /** Income Tax Act 58 of 1962 — rates for individuals */
  brackets: Bracket[];
  rebates: { primary: number; secondary: number; tertiary: number };
  thresholds: { under65: number; age65to74: number; age75plus: number };
  /** s6A medical scheme fees tax credit, per month */
  medicalCredits: { first2Each: number; additionalEach: number };
  /** s11F retirement fund contribution deduction */
  retirement: { rateOfRemuneration: number; annualCap: number };
  /** Unemployment Insurance Contributions Act 4 of 2002 */
  uif: { employeeRate: number; employerRate: number; monthlyCeiling: number };
  /** Skills Development Levies Act 9 of 1999 */
  sdl: { rate: number; annualPayrollExemption: number };
  /** Value-Added Tax Act 89 of 1991, s7(1) */
  vatRate: number;
  /** companies */
  corporateRate: number;
  /** dividends tax (withholding) */
  dividendsRate: number;
  verified: boolean;
  note: string;
}

export const TAX_YEARS: TaxYear[] = [
  {
    id: '2025/26',
    label: '2025/26 year of assessment',
    start: '2025-03-01',
    end: '2026-02-28',
    brackets: [
      { from: 0, base: 0, rate: 0.18 },
      { from: 237_100, base: 42_678, rate: 0.26 },
      { from: 370_500, base: 77_362, rate: 0.31 },
      { from: 512_800, base: 121_475, rate: 0.36 },
      { from: 673_000, base: 179_147, rate: 0.39 },
      { from: 857_900, base: 251_258, rate: 0.41 },
      { from: 1_817_000, base: 644_489, rate: 0.45 },
    ],
    rebates: { primary: 17_235, secondary: 9_444, tertiary: 3_145 },
    thresholds: { under65: 95_750, age65to74: 148_217, age75plus: 165_689 },
    medicalCredits: { first2Each: 364, additionalEach: 246 },
    retirement: { rateOfRemuneration: 0.275, annualCap: 350_000 },
    uif: { employeeRate: 0.01, employerRate: 0.01, monthlyCeiling: 17_712 },
    sdl: { rate: 0.01, annualPayrollExemption: 500_000 },
    vatRate: 0.15,
    corporateRate: 0.27,
    dividendsRate: 0.2,
    verified: true,
    note: 'SARS published rates for 2025/26. Confirm the current year before go-live.',
  },
];

export const ACTIVE_TAX_YEAR: TaxYear = TAX_YEARS[0];
