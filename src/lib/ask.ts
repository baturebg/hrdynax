// "Ask the data" — demo answer engine.
// Matches keywords against the sample data so the panel can be reviewed end to end.
// In production, replace `askData` with a call to Power BI Copilot or an LLM that writes DAX
// against the semantic model, executed with the signed-in user's row-level security.

import { VAT_ACQUISITIONS, VAT_PERIOD, VAT_SUPPLIES } from '../data/finance';
import { DAYS, DELIVERED, JOBS, SITES, TECHS, TESTS, TODAY, onShift } from '../data/sample';
import type { AskResult, Role, Unit } from '../data/types';
import { addDays, fd, parseAmount, pct, zar } from './format';
import { can, isField, isPipe, roleName, stageOf } from './selectors';
import { payslip, vatFromExclusive, vatFromInclusive, vatReturn } from './tax/za';

export const SUGGESTED_QUESTIONS = [
  'Which units are late?',
  'What VAT do we owe for October?',
  'What is the PAYE on a R35 000 salary?',
  'Which units are at Peak risk?',
  'Do we have enough crew this week?',
  'Show Thabo Mokoena’s certifications',
];

function taxAnswer(t: string, role: Role): AskResult | null {
  const amount = parseAmount(t);
  if (/\bvat\b/.test(t)) {
    if (amount != null) {
      const incl = /incl/.test(t);
      const v = incl ? vatFromInclusive(amount) : vatFromExclusive(amount);
      return {
        text: incl ? `${zar(amount)} including VAT is ${zar(v.exclusive)} plus ${zar(v.vat)} VAT (15/115).` : `VAT at 15% on ${zar(amount)} is ${zar(v.vat)}, so the total is ${zar(v.inclusive)}.`,
        table: { head: ['Excl. VAT', 'VAT 15%', 'Incl. VAT'], rows: [[zar(v.exclusive), zar(v.vat), zar(v.inclusive)]] },
        src: 'VAT Act 89 of 1991, s7(1) · 15%',
      };
    }
    if (!can(role, 'finance'))
      return { text: `Your role (${roleName(role)}) can’t see the company’s VAT return. I can still work out VAT on an amount, e.g. “VAT on R250 000”.`, src: 'Blocked by role permissions', blocked: true };
    const r = vatReturn(VAT_SUPPLIES, VAT_ACQUISITIONS);
    return {
      text: `Net VAT payable for ${VAT_PERIOD.label} is ${zar(r.netPayable)}: ${zar(r.outputTax)} output tax less ${zar(r.inputTax)} claimable input tax. The VAT201 is due ${VAT_PERIOD.due}.`,
      table: { head: ['Line', 'VAT'], rows: [['Output tax', zar(r.outputTax)], ['Input tax claimable', zar(r.inputTax)], ['Net payable', zar(r.netPayable)]] },
      src: 'VAT201 working, SAP/ERP sample',
    };
  }
  if (/paye|salary|take.?home|income tax|\buif\b|net pay/.test(t) && amount != null) {
    const p = payslip({ monthlyGross: amount });
    return {
      text: `On ${zar(amount)} a month (under 65, no retirement or medical aid), PAYE is ${zar(p.paye)} and take-home pay is ${zar(p.net)}.`,
      table: {
        head: ['Item', 'Monthly'],
        rows: [['Gross', zar(p.monthlyGross)], ['PAYE', zar(p.paye)], ['UIF (employee 1%)', zar(p.uifEmployee)], ['Net pay', zar(p.net)], ['Employer UIF + SDL', zar(p.uifEmployer + p.sdl)]],
      },
      src: 'Income Tax Act 58 of 1962, 2025/26 tables · UIF Contributions Act · SDL Act',
    };
  }
  return null;
}

interface AskContext {
  units: Unit[];
  role: Role;
}

export function askData(question: string, { units, role }: AskContext): AskResult {
  const t = question.toLowerCase();
  const field = units.filter(isField);
  const pipe = units.filter(isPipe);
  const site = SITES.find((s) => t.includes(s.name.toLowerCase().split(' ')[0]));
  const tech = TECHS.find((x) => x.name.toLowerCase().split(' ').some((w) => w.length > 3 && t.includes(w)));

  const tax = taxAnswer(t, role);
  if (tax) return tax;

  if (tech || (/technician|certif|who /.test(t) && !/permit|unit/.test(t))) {
    if (!can(role, 'people'))
      return {
        text: `Your role (${roleName(role)}) can’t see individual technician records, so I can’t answer that. I can tell you how many technicians are on shift or short of cover.`,
        src: 'Blocked by row-level security',
        blocked: true,
      };
    const x = tech ?? TECHS[0];
    return {
      text: `${x.name} (${x.id}) is a ${x.role.toLowerCase()} based at ${x.base}, with a ${x.ftp}% first-time pass rate over ${x.jobs} jobs in 90 days.`,
      table: { head: ['Certificate', 'Expires'], rows: x.certs.map((c) => [c.name, fd(addDays(TODAY, c.expiresInDays))]) },
      src: 'DimTechnician, FactCommissioningTest',
    };
  }

  if (/late|overdue|behind|delay/.test(t)) {
    const l = pipe
      .filter((u) => u.overdue && (!site || u.site === site.name))
      .sort((a, b) => b.daysIn - b.plan - (a.daysIn - a.plan));
    return {
      text: l.length ? `${l.length} units${site ? ' at ' + site.name : ''} are past their planned days in stage.` : 'No units are late for the current filters.',
      table: l.length
        ? { head: ['Unit', 'Stage', 'Days over', 'Forecast handover'], rows: l.slice(0, 8).map((u) => [u.serial, stageOf(u.stage).name, '+' + (u.daysIn - u.plan), fd(u.forecast)]) }
        : undefined,
      src: 'FactBuild, project schedules, forecast model',
    };
  }

  if (/permit|expir|cert/.test(t)) {
    const n = Number((t.match(/(\d+)\s*day/) ?? [0, 30])[1]);
    const l = field.filter((u) => u.certDue <= n && (!site || u.site === site.name)).sort((a, b) => a.certDue - b.certDue);
    const many = l.length > 1;
    return {
      text: l.length
        ? `${l.length} explosives vehicle permit${many ? 's' : ''} expire${many ? '' : 's'} within ${n} days or ${many ? 'have' : 'has'} already expired.`
        : `No permits expire within ${n} days.`,
      table: l.length
        ? { head: ['Unit', 'Site', 'Expires'], rows: l.slice(0, 10).map((u) => [u.serial, u.site, u.certDue < 0 ? 'Expired' : fd(addDays(TODAY, u.certDue))]) }
        : undefined,
      src: 'DimUnit permit register',
    };
  }

  if (/down|uptime|availab/.test(t)) {
    const n = Number((t.match(/(\d+)\s*h/) ?? [0, 0])[1]);
    const l = field.filter((u) => (!site || u.site === site.name) && u.down > n).sort((a, b) => b.down - a.down);
    return {
      text: `${l.length} ${site ? site.name + ' ' : ''}units had more than ${n} downtime hours in the last 30 days.`,
      table: l.length ? { head: ['Unit', 'Site', 'Down h', 'Uptime'], rows: l.slice(0, 10).map((u) => [u.serial, u.site, u.down, u.uptime + '%']) } : undefined,
      src: 'FactTelemetry, 30-day window',
    };
  }

  if (/risk|fail|predict|peak|breakdown/.test(t)) {
    const l = field.filter((u) => u.prob >= 0.65 && (!site || u.site === site.name)).sort((a, b) => b.prob - a.prob);
    return {
      text: l.length ? `${l.length} units are at Peak failure risk (65% or higher in the next 30 days).` : 'No units are at Peak risk for the current filters.',
      table: l.length ? { head: ['Unit', 'Site', 'Risk', 'Top driver'], rows: l.slice(0, 10).map((u) => [u.serial, u.site, pct(u.prob) + '%', u.drivers[0]]) } : undefined,
      src: 'FactRiskScore, scored 06:00 today',
    };
  }

  if (/crew|cover|shift|staff|gap|enough/.test(t)) {
    const rows = DAYS.map((d, i) => [d, onShift(i), JOBS[i], JOBS[i] - onShift(i)] as const);
    const gaps = rows.filter((r) => r[3] > 0);
    return {
      text: gaps.length ? `${gaps.length} days this week have more planned jobs than technicians on shift.` : 'Every day this week has enough technicians for the planned jobs.',
      table: { head: ['Day', 'On shift', 'Jobs', 'Short by'], rows: (gaps.length ? gaps : rows).map((r) => [r[0], r[1], r[2], r[3] > 0 ? r[3] : '—']) },
      src: 'FactShift, job plan',
    };
  }

  if (/deliver|handover|complet/.test(t)) {
    const l = [...pipe].sort((a, b) => a.forecast.getTime() - b.forecast.getTime());
    return {
      text: `${DELIVERED.slice(1).reduce((a, d) => a + d.units, 0)} units were delivered this year. These are the next handovers the forecast expects:`,
      table: { head: ['Unit', 'Stage', 'Forecast', 'Slip'], rows: l.slice(0, 8).map((u) => [u.serial, stageOf(u.stage).name, fd(u.forecast), (u.slip > 0 ? '+' : '') + u.slip + ' d']) },
      src: 'FactBuild, forecast model',
    };
  }

  if (/pass|test|itp|commission/.test(t)) {
    const all = units.flatMap((u) => u.tests);
    return {
      text: `The overall first-time pass rate is ${all.length ? pct(all.filter((x) => x.result === 'Pass').length / all.length) : 0}%.`,
      table: {
        head: ['ITP test', 'Tests', 'Pass rate'],
        rows: TESTS.map((x) => {
          const r = all.filter((z) => z.test === x);
          return [x, r.length, r.length ? pct(r.filter((z) => z.result === 'Pass').length / r.length) + '%' : '—'];
        }),
      },
      src: 'FactCommissioningTest',
    };
  }

  if (/fault|callout|code/.test(t)) {
    const c: Record<string, number> = {};
    field.forEach((u) => u.faults.forEach((f) => (c[`${f.code} ${f.name}`] = (c[`${f.code} ${f.name}`] ?? 0) + 1)));
    const rows = Object.entries(c).sort((a, b) => b[1] - a[1]);
    return {
      text: `${rows.reduce((a, x) => a + x[1], 0)} faults were logged in the last 6 months.`,
      table: { head: ['Fault', 'Count'], rows },
      src: 'FactMaintenance',
    };
  }

  return {
    text: 'In this demo I can answer questions about late builds, downtime, failure risk, permits, crew cover, deliveries, test pass rates, faults, VAT and PAYE. Try one of the suggestions above.',
    src: 'Demo answer engine over sample data',
  };
}
