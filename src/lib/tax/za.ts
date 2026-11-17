// South African tax calculations: income tax / PAYE, UIF, SDL, VAT and company tax.
// Pure functions; every rate comes from the tax-year table so nothing is hard-coded here.

import { ACTIVE_TAX_YEAR, type TaxYear } from './tables';

export type AgeBand = 'under65' | '65to74' | '75plus';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Tax on annual taxable income before rebates (rates table for individuals). */
export function taxBeforeRebates(taxableIncome: number, year: TaxYear = ACTIVE_TAX_YEAR): number {
  if (taxableIncome <= 0) return 0;
  const b = [...year.brackets].reverse().find((x) => taxableIncome > x.from) ?? year.brackets[0];
  return round2(b.base + (taxableIncome - b.from) * b.rate);
}

export function rebates(age: AgeBand, year: TaxYear = ACTIVE_TAX_YEAR): number {
  const r = year.rebates;
  return r.primary + (age !== 'under65' ? r.secondary : 0) + (age === '75plus' ? r.tertiary : 0);
}

export function taxThreshold(age: AgeBand, year: TaxYear = ACTIVE_TAX_YEAR): number {
  return age === 'under65' ? year.thresholds.under65 : age === '65to74' ? year.thresholds.age65to74 : year.thresholds.age75plus;
}

/** s6A medical scheme fees tax credit per month for the given number of members on the scheme. */
export function medicalCreditMonthly(members: number, year: TaxYear = ACTIVE_TAX_YEAR): number {
  if (members <= 0) return 0;
  const m = year.medicalCredits;
  return Math.min(members, 2) * m.first2Each + Math.max(0, members - 2) * m.additionalEach;
}

/** s11F deduction: lesser of the contributions, 27.5% of remuneration, and the annual cap. */
export function retirementDeduction(annualContribution: number, annualRemuneration: number, year: TaxYear = ACTIVE_TAX_YEAR): number {
  const r = year.retirement;
  return round2(Math.max(0, Math.min(annualContribution, annualRemuneration * r.rateOfRemuneration, r.annualCap)));
}

export interface IncomeTaxResult {
  taxableIncome: number;
  taxBeforeRebates: number;
  rebates: number;
  medicalCredits: number;
  tax: number;
  effectiveRate: number;
}

/** Annual income tax payable by an individual. */
export function annualIncomeTax(
  input: { annualRemuneration: number; age?: AgeBand; annualRetirement?: number; medicalMembers?: number },
  year: TaxYear = ACTIVE_TAX_YEAR,
): IncomeTaxResult {
  const age = input.age ?? 'under65';
  const deduction = retirementDeduction(input.annualRetirement ?? 0, input.annualRemuneration, year);
  const taxableIncome = Math.max(0, input.annualRemuneration - deduction);
  const before = taxBeforeRebates(taxableIncome, year);
  const reb = Math.min(before, rebates(age, year));
  const afterRebates = before - reb;
  const med = Math.min(afterRebates, medicalCreditMonthly(input.medicalMembers ?? 0, year) * 12);
  // No tax is payable at or below the published threshold for the age band (SARS rounds thresholds,
  // so the bracket maths can leave a few cents at the boundary).
  const tax = taxableIncome <= taxThreshold(age, year) ? 0 : round2(Math.max(0, afterRebates - med));
  return {
    taxableIncome,
    taxBeforeRebates: before,
    rebates: reb,
    medicalCredits: med,
    tax,
    effectiveRate: input.annualRemuneration > 0 ? tax / input.annualRemuneration : 0,
  };
}

export interface PayslipInput {
  monthlyGross: number;
  age?: AgeBand;
  monthlyRetirement?: number;
  medicalMembers?: number;
}

export interface Payslip extends IncomeTaxResult {
  monthlyGross: number;
  paye: number;
  uifEmployee: number;
  uifEmployer: number;
  sdl: number;
  retirement: number;
  net: number;
  costToCompany: number;
}

/**
 * Monthly PAYE using the SARS averaging method for regular monthly remuneration:
 * annualise, tax the annual amount, divide by 12. (Irregular items such as bonuses are not handled.)
 */
export function payslip(input: PayslipInput, year: TaxYear = ACTIVE_TAX_YEAR, employerPaysSdl = true): Payslip {
  const gross = Math.max(0, input.monthlyGross);
  const retirement = Math.max(0, input.monthlyRetirement ?? 0);
  const annual = annualIncomeTax(
    { annualRemuneration: gross * 12, age: input.age, annualRetirement: retirement * 12, medicalMembers: input.medicalMembers },
    year,
  );
  const paye = round2(annual.tax / 12);
  const u = uif(gross, year);
  const sdlAmt = employerPaysSdl ? round2(gross * year.sdl.rate) : 0;
  return {
    ...annual,
    monthlyGross: gross,
    paye,
    uifEmployee: u.employee,
    uifEmployer: u.employer,
    sdl: sdlAmt,
    retirement,
    net: round2(gross - paye - u.employee - retirement),
    costToCompany: round2(gross + u.employer + sdlAmt),
  };
}

/** UIF: 1% employee + 1% employer on remuneration up to the monthly ceiling. */
export function uif(monthlyRemuneration: number, year: TaxYear = ACTIVE_TAX_YEAR) {
  const base = Math.min(Math.max(0, monthlyRemuneration), year.uif.monthlyCeiling);
  return { employee: round2(base * year.uif.employeeRate), employer: round2(base * year.uif.employerRate) };
}

/** SDL: 1% of the employer's total remuneration; exempt when annual payroll is under the threshold. */
export function sdl(monthlyPayroll: number, annualPayroll = monthlyPayroll * 12, year: TaxYear = ACTIVE_TAX_YEAR): number {
  if (annualPayroll < year.sdl.annualPayrollExemption) return 0;
  return round2(monthlyPayroll * year.sdl.rate);
}

/* ---------- VAT ---------- */

export interface VatAmounts {
  exclusive: number;
  vat: number;
  inclusive: number;
}

/** VAT on a VAT-exclusive amount. */
export function vatFromExclusive(amount: number, rate = ACTIVE_TAX_YEAR.vatRate): VatAmounts {
  const vat = round2(amount * rate);
  return { exclusive: round2(amount), vat, inclusive: round2(amount + vat) };
}

/** Extract VAT from a VAT-inclusive amount (tax fraction 15/115 at 15%). */
export function vatFromInclusive(amount: number, rate = ACTIVE_TAX_YEAR.vatRate): VatAmounts {
  const vat = round2((amount * rate) / (1 + rate));
  return { exclusive: round2(amount - vat), vat, inclusive: round2(amount) };
}

export type VatTreatment = 'standard' | 'zero' | 'exempt';

export interface VatLine {
  label: string;
  /** VAT-exclusive value */
  amount: number;
  treatment: VatTreatment;
  /** input tax not claimable, e.g. entertainment (s17(2)(a)) */
  denied?: boolean;
  /** import VAT paid to SARS Customs, already calculated on the customs value */
  vatPaid?: number;
}

export interface VatReturn {
  outputLines: (VatLine & { vat: number })[];
  inputLines: (VatLine & { vat: number; claimable: number })[];
  outputTax: number;
  inputTax: number;
  netPayable: number;
}

/** A simplified VAT201: output tax on supplies less claimable input tax on acquisitions. */
export function vatReturn(supplies: VatLine[], acquisitions: VatLine[], rate = ACTIVE_TAX_YEAR.vatRate): VatReturn {
  const outputLines = supplies.map((l) => ({ ...l, vat: l.treatment === 'standard' ? round2(l.amount * rate) : 0 }));
  const inputLines = acquisitions.map((l) => {
    const vat = l.vatPaid ?? (l.treatment === 'standard' ? round2(l.amount * rate) : 0);
    return { ...l, vat, claimable: l.denied ? 0 : vat };
  });
  const outputTax = round2(outputLines.reduce((a, l) => a + l.vat, 0));
  const inputTax = round2(inputLines.reduce((a, l) => a + l.claimable, 0));
  return { outputLines, inputLines, outputTax, inputTax, netPayable: round2(outputTax - inputTax) };
}

/* ---------- companies ---------- */

export function corporateTax(taxableIncome: number, year: TaxYear = ACTIVE_TAX_YEAR): number {
  return round2(Math.max(0, taxableIncome) * year.corporateRate);
}

export function dividendsTax(dividend: number, year: TaxYear = ACTIVE_TAX_YEAR): number {
  return round2(Math.max(0, dividend) * year.dividendsRate);
}
