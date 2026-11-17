import { RETIREMENT_RATE, SALARY_BANDS, TECH_PAY } from '../data/finance';
import { payslip, sdl } from './tax/za';

/** Payroll by salary band, estimated from each band's average salary. */
export function bandPayroll() {
  return SALARY_BANDS.map((b) => {
    const p = payslip({ monthlyGross: b.avg, monthlyRetirement: b.avg * RETIREMENT_RATE, medicalMembers: 2 }, undefined, false);
    return {
      ...b,
      gross: b.avg * b.count,
      paye: p.paye * b.count,
      uifEmployee: p.uifEmployee * b.count,
      uifEmployer: p.uifEmployer * b.count,
      net: p.net * b.count,
    };
  });
}

/** EMP201 for the month: PAYE, UIF (employee + employer) and SDL. */
export function emp201() {
  const bands = bandPayroll();
  const gross = bands.reduce((a, b) => a + b.gross, 0);
  const paye = bands.reduce((a, b) => a + b.paye, 0);
  const uif = bands.reduce((a, b) => a + b.uifEmployee + b.uifEmployer, 0);
  const sdlAmt = sdl(gross);
  return { gross, paye, uif, sdl: sdlAmt, total: paye + uif + sdlAmt };
}

export const techPayslips = () =>
  TECH_PAY.map((t) => ({
    ...t,
    slip: payslip({ monthlyGross: t.gross, monthlyRetirement: t.retirement, medicalMembers: t.medicalMembers, age: t.age }),
  }));
