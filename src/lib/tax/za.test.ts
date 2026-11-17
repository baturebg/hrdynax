import { describe, expect, it } from 'vitest';
import {
  annualIncomeTax,
  corporateTax,
  medicalCreditMonthly,
  payslip,
  retirementDeduction,
  sdl,
  taxBeforeRebates,
  uif,
  vatFromExclusive,
  vatFromInclusive,
  vatReturn,
} from './za';

describe('income tax (2025/26 tables)', () => {
  it('applies each bracket base and marginal rate', () => {
    expect(taxBeforeRebates(100_000)).toBe(18_000);
    expect(taxBeforeRebates(237_100)).toBe(42_678);
    expect(taxBeforeRebates(360_000)).toBe(74_632); // 42 678 + 26% × 122 900
    expect(taxBeforeRebates(1_000_000)).toBe(309_519); // 251 258 + 41% × 142 100
    expect(taxBeforeRebates(2_000_000)).toBe(726_839); // 644 489 + 45% × 183 000
  });

  it('pays no tax at or below the age thresholds', () => {
    expect(annualIncomeTax({ annualRemuneration: 95_750 }).tax).toBe(0);
    expect(annualIncomeTax({ annualRemuneration: 148_217, age: '65to74' }).tax).toBe(0);
    expect(annualIncomeTax({ annualRemuneration: 165_689, age: '75plus' }).tax).toBe(0);
  });

  it('limits the retirement deduction to 27.5% and R350 000', () => {
    expect(retirementDeduction(60_000, 360_000)).toBe(60_000);
    expect(retirementDeduction(200_000, 360_000)).toBe(99_000);
    expect(retirementDeduction(600_000, 3_000_000)).toBe(350_000);
  });

  it('gives medical credits of R364 for the first two members and R246 after', () => {
    expect(medicalCreditMonthly(1)).toBe(364);
    expect(medicalCreditMonthly(2)).toBe(728);
    expect(medicalCreditMonthly(4)).toBe(1_220);
  });
});

describe('payslip', () => {
  it('calculates monthly PAYE on R30 000 for an under-65 employee', () => {
    const p = payslip({ monthlyGross: 30_000 });
    // (74 632 − 17 235) / 12
    expect(p.paye).toBe(4_783.08);
    expect(p.uifEmployee).toBe(177.12);
    expect(p.uifEmployer).toBe(177.12);
    expect(p.sdl).toBe(300);
    expect(p.net).toBe(30_000 - 4_783.08 - 177.12);
  });

  it('reduces PAYE for retirement contributions and medical members', () => {
    const base = payslip({ monthlyGross: 30_000 }).paye;
    const p = payslip({ monthlyGross: 30_000, monthlyRetirement: 2_250, medicalMembers: 2 });
    expect(p.paye).toBeLessThan(base);
    // taxable 333 000 → 42 678 + 26% × 95 900 = 67 612; − 17 235 − 8 736 = 41 641 → /12
    expect(p.paye).toBe(3_470.08);
  });
});

describe('UIF and SDL', () => {
  it('caps UIF at the R17 712 monthly ceiling', () => {
    expect(uif(10_000)).toEqual({ employee: 100, employer: 100 });
    expect(uif(80_000)).toEqual({ employee: 177.12, employer: 177.12 });
  });

  it('exempts employers with annual payroll under R500 000', () => {
    expect(sdl(40_000)).toBe(0);
    expect(sdl(1_000_000)).toBe(10_000);
  });
});

describe('VAT', () => {
  it('adds 15% to exclusive amounts and extracts 15/115 from inclusive ones', () => {
    expect(vatFromExclusive(100_000)).toEqual({ exclusive: 100_000, vat: 15_000, inclusive: 115_000 });
    expect(vatFromInclusive(115_000)).toEqual({ exclusive: 100_000, vat: 15_000, inclusive: 115_000 });
  });

  it('zero-rates exports and denies input tax on entertainment', () => {
    const r = vatReturn(
      [
        { label: 'Local', amount: 1_000_000, treatment: 'standard' },
        { label: 'Export', amount: 500_000, treatment: 'zero' },
      ],
      [
        { label: 'Steel', amount: 200_000, treatment: 'standard' },
        { label: 'Client dinner', amount: 10_000, treatment: 'standard', denied: true },
        { label: 'Import VAT', amount: 0, treatment: 'standard', vatPaid: 12_000 },
      ],
    );
    expect(r.outputTax).toBe(150_000);
    expect(r.inputTax).toBe(42_000);
    expect(r.netPayable).toBe(108_000);
  });
});

describe('company tax', () => {
  it('taxes companies at 27%', () => {
    expect(corporateTax(10_000_000)).toBe(2_700_000);
    expect(corporateTax(-5)).toBe(0);
  });
});
