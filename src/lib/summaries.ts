// AI page summaries.
// In production these are written by an LLM over the semantic model after each refresh.
// Here they are templated from the same numbers so the layout and tone can be reviewed.

import { DAYS, DELIVERED, JOBS, SITES, TESTS, onShift } from '../data/sample';
import type { Summary, Unit } from '../data/types';
import { avg, fd, pct } from './format';
import { isField, isPipe, riskLevel, stageOf } from './selectors';
import { PIPE } from '../data/sample';

export function homeSummary(units: Unit[]): Summary | null {
  if (!units.length) return null;
  const pipe = units.filter(isPipe);
  const late = pipe.filter((u) => u.overdue);
  const field = units.filter(isField);
  const top = PIPE.map((s) => [s, late.filter((u) => u.stage === s).length] as const).sort((a, b) => b[1] - a[1])[0];
  return {
    text:
      `${pipe.length} units are in the pipeline and ${late.length} are running late` +
      (late.length ? `, mostly in ${stageOf(top[0]).name.toLowerCase()}` : '') +
      `. Fleet uptime is ${field.length ? avg(field.map((u) => u.uptime)).toFixed(1) : '—'}% against a 95% target. ` +
      `${field.filter((u) => u.prob >= 0.65).length} units are at Peak failure risk and ${field.filter((u) => u.certDue <= 30).length} permits are due within 30 days.`,
    src: 'build tracker, telemetry, risk scores',
  };
}

export function pipelineSummary(units: Unit[]): Summary | null {
  const pipe = units.filter(isPipe);
  if (!pipe.length) return null;
  const late = pipe.filter((u) => u.overdue);
  const worst = [...pipe].sort((a, b) => b.daysIn - b.plan - (a.daysIn - a.plan))[0];
  return {
    text: `${late.length} of ${pipe.length} pipeline units are late. The longest delay is ${worst.serial} in ${stageOf(worst.stage).name.toLowerCase()}, ${Math.max(0, worst.daysIn - worst.plan)} days over plan. The handover forecast puts ${pipe.filter((u) => u.slip > 7).length} units more than a week behind their planned date.`,
    src: 'build tracker, project schedules, forecast model',
  };
}

export function availabilitySummary(units: Unit[]): Summary | null {
  const field = units.filter(isField);
  if (!field.length) return null;
  const worst = SITES.map((s) => {
    const xs = field.filter((u) => u.site === s.name);
    return { site: s.name, xs, up: avg(xs.map((u) => u.uptime)) };
  })
    .filter((b) => b.xs.length)
    .sort((a, b) => a.up - b.up)[0];
  const fc: Record<string, number> = {};
  worst.xs.forEach((u) => u.faults.forEach((f) => (fc[f.name] = (fc[f.name] ?? 0) + 1)));
  const topFault = Object.entries(fc).sort((a, b) => b[1] - a[1])[0];
  return {
    text:
      `Fleet uptime is ${avg(field.map((u) => u.uptime)).toFixed(1)}% over 30 days. ${worst.site} is lowest at ${worst.up.toFixed(1)}%` +
      (topFault ? `, with ${topFault[0].toLowerCase()} the most common fault there` : '') +
      `. ${field.filter((u) => u.uptime < 95).length} units are below the 95% target.`,
    src: 'SCADA/PLC telemetry, maintenance records',
  };
}

export function riskSummary(units: Unit[]): Summary | null {
  const field = units.filter(isField).sort((a, b) => b.prob - a.prob);
  if (!field.length) return null;
  const dc: Record<string, number> = {};
  field.filter((u) => u.prob >= 0.35).forEach((u) => u.drivers.forEach((d) => (dc[d] = (dc[d] ?? 0) + 1)));
  const top = Object.entries(dc).sort((a, b) => b[1] - a[1])[0];
  return {
    text:
      `${field.filter((u) => u.prob >= 0.65).length} units are at Peak risk. ${field[0].serial} at ${field[0].site} is highest at ${pct(field[0].prob)}%.` +
      (top ? ` The most common driver across Medium and Peak units is “${top[0].toLowerCase()}”.` : ''),
    src: 'failure prediction model, maintenance records',
  };
}

export function qualitySummary(units: Unit[]): Summary | null {
  const all = units.flatMap((u) => u.tests);
  if (!all.length) return null;
  const worst = TESTS.map((t) => {
    const r = all.filter((x) => x.test === t);
    return { t, rate: r.length ? r.filter((x) => x.result === 'Pass').length / r.length : 1, n: r.filter((x) => x.result !== 'Pass').length };
  }).sort((a, b) => a.rate - b.rate)[0];
  return {
    text: `First-time pass rate is ${pct(all.filter((x) => x.result === 'Pass').length / all.length)}%. ${worst.t} has the lowest pass rate at ${pct(worst.rate)}% and caused ${worst.n} retests.`,
    src: 'commissioning DB',
  };
}

export function trendsSummary(): Summary {
  const first = DELIVERED[0];
  const last = DELIVERED[DELIVERED.length - 1];
  return {
    text: `${last.units} units were handed over in November and ${DELIVERED.reduce((a, d) => a + d.units, 0)} in the last 12 months. Average cycle time dropped from ${first.cycleDays} to ${last.cycleDays} days since December.`,
    src: 'build tracker',
  };
}

export function crewSummary(): Summary {
  const gaps = DAYS.map((d, i) => ({ d, i, gap: JOBS[i] - onShift(i) }))
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
  return {
    text: gaps.length
      ? `${gaps.length} days this week have more jobs than technicians on shift. The biggest gap is ${gaps[0].d} Nov: ${JOBS[gaps[0].i]} jobs for ${onShift(gaps[0].i)} technicians. Suggested cover is listed below.`
      : 'Every day this week has enough technicians on shift for the planned jobs.',
    src: 'shift roster, leave, job plan',
  };
}

export function unitSummary(u: Unit): Summary {
  if (isField(u))
    return {
      text:
        `${u.serial} was available ${u.uptime}% of the last 30 days and had ${u.faults.length} faults in 6 months. ` +
        `Failure risk is ${riskLevel(u.prob)} (${pct(u.prob)}%), mainly “${u.drivers[0].toLowerCase()}”.` +
        (u.anomaly ? ' Pump pressure has been climbing for 4 hours.' : ''),
      src: 'telemetry, maintenance records, risk model',
    };
  return {
    text: `${u.serial} is on day ${u.daysIn} of ${u.plan} in ${stageOf(u.stage).name.toLowerCase()}. Forecast handover is ${fd(u.forecast)}, ${Math.abs(u.slip)} days ${u.slip > 0 ? 'later' : 'earlier'} than planned.`,
    src: 'build tracker, forecast model',
  };
}
