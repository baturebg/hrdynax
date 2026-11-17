// SAMPLE DATA ONLY.
// Generated from a fixed seed so every reload shows the same numbers.
// Replace these exports with API / Power BI dataset calls when the Azure data layer is ready
// (see README "Connecting real data").

import { addDays } from '../lib/format';
import type {
  Alert,
  Approval,
  Automation,
  CrewRow,
  DataFix,
  DocExtraction,
  FaultCode,
  NoteExtraction,
  ShiftCode,
  Site,
  Stage,
  StageEntry,
  StageId,
  Technician,
  TestRecord,
  Unit,
} from './types';

/* ---------- seeded random ---------- */
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
const R = mulberry32(20261117);
const rnd = (a: number, b: number) => a + R() * (b - a);
const ri = (a: number, b: number) => Math.floor(rnd(a, b + 1));
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(R() * arr.length)];
}

export const TODAY = new Date(2026, 10, 17);

/* ---------- reference data ---------- */
export const STAGES: Stage[] = [
  { id: 'procurement', name: 'Procurement', page: 'cost', plan: 30, hint: 'Parts ordered, chassis allocated' },
  { id: 'build', name: 'Build', page: 'starts', plan: 35, hint: 'Fabrication and assembly' },
  { id: 'commissioning', name: 'Commissioning', page: 'quality', plan: 10, hint: 'ITP tests and sign-off' },
  { id: 'handover', name: 'Handover', page: 'pipeline', plan: 5, hint: 'Client acceptance and transport' },
  { id: 'fieldops', name: 'Field Ops', page: 'availability', plan: 0, hint: 'Charging holes on site' },
  { id: 'maintenance', name: 'Maintenance', page: 'faults', plan: 0, hint: 'In workshop or on callout' },
  { id: 'compliance', name: 'Compliance', page: 'sites', plan: 0, hint: 'Permits due in 30 days' },
];
export const PIPE: StageId[] = ['procurement', 'build', 'commissioning', 'handover'];
const planOf = (id: StageId) => STAGES.find((s) => s.id === id)!.plan;

export const SITES: Site[] = [
  { name: 'Ridgeback Open Pit', region: 'Limpopo' },
  { name: 'Kwena North', region: 'Mpumalanga' },
  { name: 'Tswelopele Quarry', region: 'Gauteng' },
  { name: 'Blue Gum Colliery', region: 'Mpumalanga' },
  { name: 'Marula East', region: 'Northern Cape' },
  { name: 'Akosua Gold', region: 'Ghana' },
];
export const MODELS = ['MMU 12t Emulsion', 'MMU 18t Emulsion', 'MMU Bulk ANFO', 'MMU 8t Underground'];
const TECH_NAMES = [
  'Thabo Mokoena', 'Lerato Dlamini', 'Pieter van Wyk', 'Nomvula Khumalo', 'Sipho Ndlovu', 'Anele Mthembu',
  'Johan Pretorius', 'Zanele Nkosi', 'Kagiso Molefe', 'Ayanda Zulu', 'Riaan Botha', 'Palesa Mahlangu',
  'Tshepo Sithole', 'Naledi Radebe', 'Musa Shabalala', 'Karabo Phiri', 'Bongani Cele', 'Refilwe Masilela',
];
const ROLES = ['Fitter & turner', 'Electrician', 'Instrumentation tech', 'Commissioning engineer', 'Hydraulics fitter'];
const CERTS = ['Explosives handling (Reg 8)', 'HV electrical', 'PLC / SCADA', 'Working at heights', 'Hydraulics L2', 'Pressure vessels'];
export const TESTS = ['Pump pressure hold', 'Emulsion flow calibration', 'Sensitiser dosing', 'E-stop & interlocks', 'PLC I/O check', 'Load cell calibration'];
export const FAULTS: FaultCode[] = [
  { code: 'P-104', name: 'Pump over-pressure', comp: 'Emulsion pump' },
  { code: 'F-210', name: 'Flow drift', comp: 'Flow meter' },
  { code: 'H-031', name: 'Hydraulic leak', comp: 'Hose reel' },
  { code: 'C-502', name: 'PLC comms loss', comp: 'Controller' },
  { code: 'S-118', name: 'Sensitiser dosing fault', comp: 'Dosing pump' },
  { code: 'G-007', name: 'GPS signal loss', comp: 'Telematics' },
];
const FIXMAP: Record<string, string[]> = {
  'P-104': ['Seal kit replaced', 'Relief valve reset', 'Pump rebuilt'],
  'F-210': ['Flow meter recalibrated', 'Strainer cleaned', 'Flow sensor replaced'],
  'H-031': ['Hose replaced', 'Fitting re-torqued', 'Reel seal replaced'],
  'C-502': ['Connector re-terminated', 'Firmware reset', 'Comms module replaced'],
  'S-118': ['Dosing line flushed', 'Dosing pump recalibrated', 'Check valve replaced'],
  'G-007': ['Antenna cable reseated', 'Antenna replaced', 'Telematics unit reset'],
};
const DRIVERS_A = ['Pump hours > 6,000', 'Rising pressure trend', '3 faults in 60 days', 'Seal kit overdue', 'High ambient temp', 'Overdue service', 'Hydraulic temp spikes'];
const DRIVERS_B = ['Rising pressure trend', 'Seal kit overdue', 'Overdue service', 'Repeat fault P-104'];

/* ---------- technicians ---------- */
export const TECHS: Technician[] = TECH_NAMES.map((name, i) => {
  const certs = CERTS.filter(() => R() < 0.55).map((c) => ({ name: c, expiresInDays: ri(-10, 420) }));
  if (!certs.length) certs.push({ name: CERTS[0], expiresInDays: ri(30, 300) });
  return {
    id: 'T-' + String(101 + i),
    name,
    role: pick(ROLES),
    base: pick(SITES).name,
    certs,
    ftp: Math.round(rnd(72, 98)),
    jobs: ri(14, 61),
    risk: +(R() ** 1.6).toFixed(2),
    units: [],
  };
});

/* ---------- units ---------- */
const WEIGHTS: [StageId, number][] = [
  ['procurement', 5], ['build', 9], ['commissioning', 5], ['handover', 3], ['fieldops', 30], ['maintenance', 4],
];
function weightedStage(): StageId {
  let x = R() * 56;
  for (const [s, w] of WEIGHTS) if ((x -= w) < 0) return s;
  return 'fieldops';
}

export const UNITS: Unit[] = [];
for (let i = 0; i < 56; i++) {
  const stage = weightedStage();
  const site = pick(SITES);
  const si = STAGES.findIndex((s) => s.id === stage);
  const field = si >= 4;
  const maint = stage === 'maintenance';
  const yr = field ? pick([23, 24, 25]) : 26;
  const techs = [...new Set([pick(TECHS), pick(TECHS), pick(TECHS)].map((t) => t.id))].slice(0, ri(2, 3));

  // stage history
  const hist: StageEntry[] = [];
  let d = field
    ? addDays(TODAY, -ri(200, 1100))
    : addDays(TODAY, -PIPE.slice(0, si).reduce((a, s) => a + planOf(s) + ri(-5, 12), 0) - ri(3, 45));
  for (let k = 0; k < 4; k++) {
    const st = STAGES[k];
    const dur = st.plan + ri(-6, 14);
    hist.push({ id: st.id, start: d });
    if (k < si || field) d = addDays(d, dur);
  }
  if (field) hist.push({ id: 'fieldops', start: d });

  const u: Unit = {
    serial: `MMU-${yr}-${String(100 + i * 4 + ri(0, 3)).padStart(3, '0')}`,
    model: pick(MODELS),
    site: site.name,
    region: site.region,
    stage,
    techs,
    hist,
    daysIn: 0, plan: 0, overdue: false, due: TODAY, planned: TODAY, forecast: TODAY, slip: 0, conf: 0,
    commissioned: TODAY, uptime: 0, down: 0, dayDown: 0, prob: 0, certDue: 999, roadworthyInDays: 0,
    anomaly: false, pressure: [], tests: [], faults: [], drivers: [],
  };

  if (!field) {
    u.daysIn = Math.round((TODAY.getTime() - hist[si].start.getTime()) / 864e5);
    u.plan = STAGES[si].plan;
    u.overdue = u.daysIn > u.plan;
    u.due = addDays(hist[si].start, u.plan);
  } else {
    u.commissioned = hist[3].start;
    u.uptime = +(maint ? rnd(70, 88) : Math.min(99.6, rnd(86, 101))).toFixed(1);
    u.down = Math.round(((100 - u.uptime) / 100) * 720);
    u.prob = +Math.min(0.97, R() ** 1.3 * (maint ? 1.3 : 1)).toFixed(2);
    u.certDue = ri(-3, 340);
    u.dayDown = Math.round(u.down * rnd(0.3, 0.6));
    u.roadworthyInDays = ri(20, 300);
  }

  if (si >= 2) {
    const tests: TestRecord[] = TESTS.map((t) => {
      const r = R();
      return { test: t, result: r < 0.8 ? 'Pass' : r < 0.93 ? 'Retest' : 'Fail', date: addDays(hist[2].start, ri(0, 8)), tech: pick(u.techs) };
    });
    u.tests = tests.slice(0, si === 2 ? ri(2, 5) : 6);
  }
  if (field) {
    u.faults = Array.from({ length: ri(0, maint ? 6 : 4) }, () => {
      const f = pick(FAULTS);
      return { ...f, date: addDays(TODAY, -ri(1, 170)), hours: +rnd(1.5, 30).toFixed(1), fix: pick(FIXMAP[f.code]), tech: pick(u.techs) };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
    if (maint && !u.faults.length) u.faults.push({ ...FAULTS[0], date: addDays(TODAY, -2), hours: 8.5, fix: 'In progress', tech: u.techs[0] });
    u.drivers = [...new Set([pick(DRIVERS_A), pick(DRIVERS_B)])];
    u.anomaly = maint || u.prob >= 0.75;
    let v = 9.5;
    for (let k = 0; k < 48; k++) {
      v += rnd(-0.35, 0.38) + (u.anomaly && k > 36 ? 0.3 : 0);
      v = Math.max(7.5, Math.min(13.6, v));
      u.pressure.push(+v.toFixed(2));
    }
  } else {
    // AI handover forecast
    const plans = PIPE.map(planOf);
    const rest = plans.slice(si + 1).reduce((a, b) => a + b, 0);
    u.planned = addDays(hist[si].start, plans.slice(si).reduce((a, b) => a + b, 0));
    u.forecast = addDays(TODAY, Math.max(u.plan - u.daysIn, 0) + (u.overdue ? ri(3, 8) : ri(-2, 4)) + rest + ri(0, 8));
    u.slip = Math.round((u.forecast.getTime() - u.planned.getTime()) / 864e5);
    u.conf = ri(68, 92);
  }

  UNITS.push(u);
  u.techs.forEach((id) => TECHS.find((t) => t.id === id)!.units.push(u.serial));
}

/* ---------- trends, availability, crew ---------- */
export const DELIVERED = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((label, i) => ({
  label,
  units: i === 11 ? 2 : ri(1, 5),
  cycleDays: ri(62, 98) - Math.round(i * 1.2),
}));

export const WEEKS = Array.from({ length: 12 }, (_, i) => {
  const d = addDays(TODAY, -7 * (11 - i));
  const start = new Date(d.getFullYear(), 0, 1);
  return `W${Math.ceil(((d.getTime() - start.getTime()) / 864e5 + 1) / 7)}`;
});
export const HEAT = SITES.map((s) => ({ site: s.name, weeks: WEEKS.map(() => +Math.min(99.8, rnd(84, 101)).toFixed(1)) }));

export const DAYS = ['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20', 'Sat 21', 'Sun 22'];
export const TODAY_INDEX = 1;
export const CREW: CrewRow[] = TECHS.map((t) => ({
  id: t.id,
  name: t.name,
  days: DAYS.map((_, i): ShiftCode => {
    const r = R();
    return r < 0.12 ? 'L' : r < (i >= 5 ? 0.55 : 0.22) ? 'O' : R() < 0.3 ? 'N' : 'D';
  }),
}));
export const onShift = (dayIdx: number) => CREW.filter((c) => c.days[dayIdx] === 'D' || c.days[dayIdx] === 'N').length;
export const JOBS = DAYS.map((_, i) => (i >= 5 ? ri(4, 8) : ri(10, 16)));
// make Wednesday and Thursday short of crew so the cover features have something to show
JOBS[2] = onShift(2) + 2;
JOBS[3] = onShift(3) + 3;

/* ---------- AI & automation ---------- */
export const FIXSTATS: Record<string, { jobs: number; fixes: { fix: string; share: number }[] }> = {};
FAULTS.forEach((f) => {
  const a = ri(48, 70);
  const b = ri(14, 100 - a - 6);
  FIXSTATS[f.code] = { jobs: ri(24, 70), fixes: FIXMAP[f.code].map((fix, i) => ({ fix, share: [a, b, 100 - a - b][i] })) };
});

const fieldU = UNITS.filter((u) => u.stage === 'fieldops' || u.stage === 'maintenance');
const pipeU = UNITS.filter((u) => PIPE.includes(u.stage));
const stageName = (id: StageId) => STAGES.find((s) => s.id === id)!.name;

export const ALERTS: Alert[] = [];
let aid = 0;
const addAlert = (a: Omit<Alert, 'id' | 'hoursAgo'>) => ALERTS.push({ id: 'a' + ++aid, hoursAgo: ri(1, 70), ...a });

UNITS.forEach((u) => {
  if (u.overdue)
    addAlert({ sev: 'bad', type: 'Late build', serial: u.serial, site: u.site, text: `${stageName(u.stage)} on day ${u.daysIn} of ${u.plan} planned`, channel: 'Teams · project lead', automation: 'late' });
  if (u.certDue <= 14)
    addAlert({
      sev: u.certDue < 0 ? 'bad' : 'warn', type: 'Permit', serial: u.serial, site: u.site,
      text: u.certDue < 0 ? `Explosives vehicle permit expired ${-u.certDue} days ago` : `Explosives vehicle permit expires in ${u.certDue} days`,
      channel: 'Email · site manager', automation: 'permit',
    });
  const bad = u.tests.find((t) => t.result !== 'Pass');
  if (u.stage === 'commissioning' && bad)
    addAlert({ sev: 'warn', type: 'Retest', serial: u.serial, site: u.site, text: `${bad.test}: ${bad.result}. Retest job booked`, channel: 'Teams · commissioning', automation: 'retest' });
  if (u.stage === 'maintenance')
    addAlert({ sev: 'info', type: 'Work order', serial: u.serial, site: u.site, text: `SAP PM order ${41007700 + ri(10, 99)} raised for ${u.faults[0].code} ${u.faults[0].name}`, channel: 'SAP PM', automation: 'wo' });
  if (u.anomaly && u.stage === 'fieldops')
    addAlert({ sev: 'bad', type: 'Anomaly', serial: u.serial, site: u.site, text: 'Pump pressure climbing about 0.3 bar/h; trip point is 14 bar', channel: 'Teams · site supervisor', automation: 'anom' });
});
DAYS.forEach((d, i) => {
  const on = onShift(i);
  if (i >= 1 && i <= 4 && JOBS[i] > on)
    addAlert({ sev: 'warn', type: 'Crew gap', site: null, text: `${d} Nov: ${JOBS[i]} jobs planned, ${on} technicians on shift`, channel: 'Teams · planner', automation: 'crew' });
});

export const NOTES: NoteExtraction[] = [
  { id: 'n1', serial: fieldU[0].serial, by: TECHS[4].id, text: 'pump running hot again, swapped seal kit, pressure back to 9.8 bar', out: { code: 'P-104', comp: 'Emulsion pump', cause: 'Worn pump seal', fix: 'Seal kit replaced' }, conf: 94 },
  { id: 'n2', serial: fieldU[3].serial, by: TECHS[9].id, text: 'gps dropping out near crusher. reseated antenna cable', out: { code: 'G-007', comp: 'Telematics', cause: 'Loose antenna connector', fix: 'Antenna cable reseated' }, conf: 88 },
  { id: 'n3', serial: fieldU[5].serial, by: TECHS[12].id, text: 'sens dosing erratic?? flushed line, calib looks ok now', out: { code: 'S-118', comp: 'Dosing pump', cause: 'Possible line blockage', fix: 'Dosing line flushed' }, conf: 61 },
  { id: 'n4', serial: fieldU[7].serial, by: TECHS[2].id, text: 'hyd leak on reel, replaced 3/4 hose', out: { code: 'H-031', comp: 'Hose reel', cause: 'Hose wear', fix: 'Hose replaced' }, conf: 91 },
];
export const DOCS: DocExtraction[] = [
  { id: 'd1', file: 'IMG_2231.jpg', kind: 'ITP sheet (photo)', serial: pipeU[0].serial, fields: [['Test', 'Pump pressure hold'], ['Result', 'Pass'], ['Signed by', TECHS[3].name], ['Date', '16 Nov 26']], conf: 90 },
  { id: 'd2', file: 'permit_renewal_scan.pdf', kind: 'Explosives vehicle permit', serial: fieldU[2].serial, fields: [['Permit no.', 'EVP-2026-08817'], ['Valid until', '30 Nov 27'], ['Issued by', 'Inspector of Explosives']], conf: 93 },
  { id: 'd3', file: 'PV_cert_0412.pdf', kind: 'Pressure vessel certificate', serial: fieldU[9].serial, fields: [['Vessel no.', 'PV-0412'], ['Test pressure', '18 bar'], ['Serial on page', 'Smudged; best match shown']], conf: 58 },
];
export const DATA_FIXES: DataFix[] = [
  { id: 'q1', issue: 'Maintenance job MJ-30418 has no technician ID', fix: `${TECHS[12].name} (${TECHS[12].id}), on shift at that site that day`, serial: fieldU[4].serial },
  { id: 'q2', issue: `Build record serial typed as “${pipeU[1].serial.replace(/-/g, ' ')}”`, fix: `Match to ${pipeU[1].serial}`, serial: pipeU[1].serial },
  { id: 'q3', issue: 'Test signed “J. Pretorius” matches two people in HR records', fix: `${TECHS[6].name} (${TECHS[6].id}), who is on this unit’s crew`, serial: pipeU[2].serial },
];
DATA_FIXES.forEach((q) =>
  addAlert({ sev: 'info', type: 'Data quality', serial: q.serial, site: UNITS.find((u) => u.serial === q.serial)!.site, text: q.issue, channel: 'Fix queue', automation: 'dq' }),
);
ALERTS.sort((a, b) => a.hoursAgo - b.hoursAgo);

const maintUnit = UNITS.find((u) => u.stage === 'maintenance') ?? fieldU[0];
const handoverUnit = pipeU.find((u) => u.stage === 'handover') ?? pipeU[0];
export const APPROVALS: Approval[] = [
  { id: 'p1', what: `SAP work order: replace emulsion pump on ${maintUnit.serial}`, value: 'R 186 400', why: 'Over the R 50 000 auto-approve limit' },
  { id: 'p2', what: `Handover notice to ${handoverUnit.site} for ${handoverUnit.serial}`, value: 'Client email', why: 'Messages to clients are sent by a person' },
  { id: 'p3', what: `Roster change: ${TECHS[4].name} to cover Wed 18 Nov at ${TECHS[4].base}`, value: 'Crew suggestion', why: 'Scheduling suggestions are approved by the planner' },
];

const count = (id: string) => ALERTS.filter((a) => a.automation === id).length;
export const AUTOMATIONS: Automation[] = [
  { id: 'late', kind: 'rule', name: 'Late-build alert', trigger: 'Unit passes its planned days in a stage', action: 'Teams message to the project lead; red flag on the wheel', tool: 'Power Automate · build tracker', phase: 'Year 1', lastRun: '06:00 today', runs7d: count('late') },
  { id: 'permit', kind: 'rule', name: 'Permit & cert expiry', trigger: 'Permit or technician cert expires in 30, 14 or 7 days', action: 'Reminder to the site manager or supervisor; renewal task created', tool: 'Power Automate · daily', phase: 'Year 1', lastRun: '06:00 today', runs7d: count('permit') + 6 },
  { id: 'retest', kind: 'rule', name: 'Retest on failed test', trigger: 'ITP test saved as Fail or Retest', action: 'Retest job booked; commissioning engineer told; due date moved', tool: 'Commissioning DB trigger', phase: 'Year 1', lastRun: 'Yesterday 14:12', runs7d: count('retest') + 2 },
  { id: 'wo', kind: 'rule', name: 'Fault to SAP work order', trigger: 'Telemetry fault code received', action: 'SAP PM work order raised with serial, fault code and GPS', tool: 'IoT Hub → Logic App → SAP', phase: 'Year 2', lastRun: 'Today 03:40', runs7d: count('wo') + 5, approvalNote: 'Orders over R 50 000 wait for approval' },
  { id: 'crew', kind: 'rule', name: 'Crew gap warning', trigger: 'Planned jobs exceed technicians on shift, 48 h ahead', action: 'Alert to the planner with certified technicians who are free', tool: 'Scheduled check · roster vs job plan', phase: 'Year 1', lastRun: '06:00 today', runs7d: count('crew') },
  { id: 'pack', kind: 'rule', name: 'Weekly executive pack', trigger: 'Monday 06:00', action: 'PDF of Pipeline, Availability and Risk emailed to sponsors', tool: 'Power BI subscription', phase: 'Year 1', lastRun: 'Mon 16 Nov 06:00', runs7d: 1 },
  { id: 'dq', kind: 'rule', name: 'Data quality checks', trigger: 'Every data load', action: 'Missing technician IDs and bad serials sent to the fix queue', tool: 'dbt tests · Fabric', phase: 'Year 1', lastRun: 'Today 06:04', runs7d: count('dq') + 34 },
  { id: 'notes', kind: 'ai', name: 'Fault-note reader', trigger: 'Technician saves a free-text job note', action: 'Pulls out fault code, component, cause and fix; under 85% sure goes to review', tool: 'LLM · hosted in SA North', phase: 'Year 1–2', lastRun: 'Today 09:31', runs7d: 58 },
  { id: 'docs', kind: 'ai', name: 'Document intake', trigger: 'Photo or PDF uploaded', action: 'Reads ITP sheets and permits; fills the commissioning DB; files certs against the serial', tool: 'Document Intelligence + LLM', phase: 'Year 1–2', lastRun: 'Today 08:15', runs7d: 84 },
  { id: 'summary', kind: 'ai', name: 'Page summaries', trigger: 'After each data refresh', action: 'Writes the summary at the top of each page and in the weekly pack', tool: 'LLM over the semantic model', phase: 'Year 2', lastRun: '06:00 today', runs7d: 7 },
  { id: 'ask', kind: 'ai', name: 'Ask the data', trigger: 'User asks a question', action: 'Answers with a table, using the user’s own row-level security', tool: 'Power BI Copilot or LLM + DAX', phase: 'Year 2', lastRun: 'On demand', runs7d: 41 },
  { id: 'fail', kind: 'ai', name: 'Failure prediction', trigger: 'Daily 06:00', action: 'Scores every field unit; replaces the rule-based alerts', tool: 'Azure ML · XGBoost', phase: 'Year 3', lastRun: '06:00 today', runs7d: 7 },
  { id: 'anom', kind: 'ai', name: 'Telemetry anomaly detection', trigger: 'Every 15 minutes', action: 'Flags unusual pressure or flow before a fault code fires', tool: 'Azure Data Explorer', phase: 'Year 3', lastRun: 'Today 10:45', runs7d: count('anom') + 3 },
  { id: 'fcst', kind: 'ai', name: 'Handover forecast', trigger: 'Daily 06:00', action: 'Predicts a handover date for every unit in the pipeline', tool: 'Azure ML', phase: 'Year 3', lastRun: '06:00 today', runs7d: 7 },
  { id: 'ret', kind: 'ai', name: 'Key-skill retention model', trigger: 'Weekly', action: 'Scores retention risk for technicians; HR only', tool: 'Azure ML · HR workspace', phase: 'Year 3', lastRun: 'Mon 16 Nov 06:00', runs7d: 1 },
  { id: 'sched', kind: 'ai', name: 'Crew scheduling suggestions', trigger: 'A day has a cover gap', action: 'Suggests who to send by certs, site, availability and pass rate; planner approves', tool: 'Optimiser + ML', phase: 'Year 4', lastRun: '06:00 today', runs7d: 4 },
  { id: 'repair', kind: 'ai', name: 'Repair suggestions', trigger: 'Fault opened on a unit', action: 'Shows the fixes that worked most often for that fault on that model', tool: 'Fault history model', phase: 'Year 4', lastRun: 'Today 03:40', runs7d: 9 },
];

export const GUARDRAILS = [
  'SCADA stays read-only. Nothing the platform does writes back to a unit; AECI IT signs off OT access.',
  'HR data never reaches operations roles, including through Ask the data or page summaries.',
  'AI services run in South Africa North, in line with POPIA.',
  'A person approves client messages, roster changes and SAP orders over R 50 000.',
  'Every AI output shows its sources, model and when it was scored.',
  'Anything AI reads with under 85% confidence goes to review before it is saved.',
];
