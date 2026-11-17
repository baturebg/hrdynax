import { useNavigate } from 'react-router-dom';
import LifeCycleWheel from '../components/LifeCycleWheel';
import { Kpi, KpiRow, PageHead, PageNotes, Panel, Pill } from '../components/ui';
import { DELIVERED, PIPE, STAGES } from '../data/sample';
import type { StageId, Unit } from '../data/types';
import { avg, pct } from '../lib/format';
import { isField, isPipe, stageCounts, stageOf } from '../lib/selectors';
import { homeSummary } from '../lib/summaries';
import { pageById, pathOf } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('lifecycle');

interface Attention {
  unit: Unit;
  tag: JSX.Element;
  why: string;
  score: number;
}

export default function LifeCyclePage() {
  const { units } = useApp();
  const nav = useNavigate();
  const counts = stageCounts(units);
  const pipe = units.filter(isPipe);
  const field = units.filter(isField);
  const uptime = avg(field.map((u) => u.uptime));

  const flags: Partial<Record<StageId, number>> = {};
  PIPE.forEach((s) => (flags[s] = units.filter((u) => u.stage === s && u.overdue).length));
  flags.fieldops = field.filter((u) => u.stage === 'fieldops' && u.prob >= 0.65).length;
  flags.compliance = field.filter((u) => u.certDue <= 7).length;

  const sub: Record<StageId, string> = {
    procurement: `${flags.procurement} late`,
    build: `${flags.build} late`,
    commissioning: `${flags.commissioning} late`,
    handover: `${flags.handover} late`,
    fieldops: `${flags.fieldops} at Peak risk`,
    maintenance: `${units.filter((u) => u.stage === 'maintenance').reduce((a, u) => a + u.dayDown, 0)} downtime h this month`,
    compliance: `${flags.compliance} due within 7 days`,
  };

  const attention: Attention[] = [
    ...pipe.filter((u) => u.overdue).map((u) => ({ unit: u, tag: <Pill tone="bad">Late</Pill>, why: `${stageOf(u.stage).name}: day ${u.daysIn} of ${u.plan} planned`, score: u.daysIn - u.plan + 50 })),
    ...field.filter((u) => u.prob >= 0.65).map((u) => ({ unit: u, tag: <Pill tone="bad">Peak risk</Pill>, why: `${pct(u.prob)}% failure risk · ${u.drivers[0]}`, score: u.prob * 100 })),
    ...field.filter((u) => u.certDue <= 14).map((u) => ({
      unit: u,
      tag: <Pill tone="warn">Permit</Pill>,
      why: u.certDue < 0 ? `Explosives vehicle permit expired ${-u.certDue} days ago` : `Explosives vehicle permit expires in ${u.certDue} days`,
      score: 60 - u.certDue,
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  return (
    <>
      <PageHead page={page} lede="Every MMU from purchase order to retirement. Pick a stage to open its page; counts follow the filters above." summary={homeSummary(units)} />

      <div className="home-grid">
        <section className="panel wheel-panel">
          <LifeCycleWheel counts={counts} flags={flags} onSelect={(s) => nav(pathOf(s.page))} />
        </section>
        <Panel title="Stages">
          <ul className="stage-list">
            {STAGES.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => nav(pathOf(s.page))}>
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="nm">
                    <b>{s.name}</b>
                    <span>{flags[s.id] ? <span style={{ color: 'var(--bad)' }}>{sub[s.id]}</span> : s.id === 'maintenance' ? sub[s.id] : s.hint}</span>
                  </span>
                  <span className="c">{counts[s.id]}</span>
                  <span className="arr">›</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <KpiRow>
        <Kpi label="In pipeline" value={pipe.length} sub={`${PIPE.map((s) => counts[s]).join(' / ')} by stage`} />
        <Kpi label="Late builds" value={pipe.filter((u) => u.overdue).length} sub="Past planned days in stage" tone={pipe.some((u) => u.overdue) ? 'alert' : undefined} />
        <Kpi label="Fleet uptime · 30 d" value={uptime.toFixed(1)} unit="%" sub="Target 95%" tone={uptime >= 95 ? 'ok' : 'warn'} />
        <Kpi label="Delivered YTD" value={DELIVERED.slice(1).reduce((a, d) => a + d.units, 0)} sub="Jan to Nov 2026" />
      </KpiRow>

      <Panel title="Needs attention">
        {attention.length ? (
          <div className="attn">
            {attention.map((a) => (
              <button key={a.unit.serial + a.why} type="button" onClick={() => nav(`/units/${a.unit.serial}`)}>
                {a.tag}
                <span>
                  <span className="mono">{a.unit.serial}</span> <span className="why">· {a.unit.site} · {a.why}</span>
                </span>
                <span className="muted">›</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Nothing needs attention for this filter.</p>
        )}
      </Panel>

      <PageNotes page={page} />
    </>
  );
}
