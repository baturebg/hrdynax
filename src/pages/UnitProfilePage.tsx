import { useNavigate, useParams } from 'react-router-dom';
import { TelemetryChart } from '../components/charts';
import { HBars, Kpi, KpiRow, PageHead, PageNotes, Panel, Pill, RiskPill, StagePill, TechChip } from '../components/ui';
import { FIXSTATS, STAGES, TODAY, UNITS } from '../data/sample';
import type { Unit } from '../data/types';
import { addDays, fd, pct, signed } from '../lib/format';
import { isField, stageOf } from '../lib/selectors';
import { unitSummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('unit');

function Stepper({ u }: { u: Unit }) {
  const si = STAGES.findIndex((s) => s.id === u.stage);
  const field = isField(u);
  const steps = STAGES.slice(0, 6).map((s, i) => {
    const h = u.hist.find((x) => x.id === s.id);
    let cls = '';
    let when = '—';
    if (i < 4 && h) {
      if (i < si || field) {
        cls = 'done';
        when = fd(h.start);
      } else if (i === si) {
        cls = u.overdue ? 'now late' : 'now';
        when = 'since ' + fd(h.start);
      }
    } else if (s.id === 'fieldops' && field) {
      cls = u.stage === 'fieldops' ? 'now' : 'done';
      when = 'since ' + fd(u.commissioned);
    } else if (s.id === 'maintenance' && u.stage === 'maintenance') {
      cls = 'now late';
      when = 'since ' + fd(u.faults[0].date);
    }
    return { name: s.name, cls, when };
  });
  steps.push({
    name: 'Compliance',
    cls: field ? (u.certDue <= 30 ? 'now late' : 'done') : '',
    when: field ? (u.certDue < 0 ? 'permit expired' : 'permit ' + fd(addDays(TODAY, u.certDue))) : '—',
  });
  return (
    <div className="stepper" style={{ marginTop: 18 }}>
      {steps.map((s) => (
        <div key={s.name} className={`step ${s.cls}`}>
          <b>{s.name}</b>
          <span>{s.when}</span>
        </div>
      ))}
    </div>
  );
}

function RepairSuggestions({ u }: { u: Unit }) {
  const f = u.faults[0];
  const stats = FIXSTATS[f.code];
  return (
    <Panel title={`AI repair suggestions · ${f.code} ${f.name}`}>
      <p className="small muted" style={{ margin: '-6px 0 12px' }}>
        What fixed this fault on other {u.model} units, from {stats.jobs} past jobs.
      </p>
      <HBars max={100} rows={stats.fixes.map((x) => ({ label: x.fix, value: `${x.share}%`, parts: [{ v: x.share, className: 'okf' }] }))} />
    </Panel>
  );
}

export default function UnitProfilePage() {
  const { units } = useApp();
  const { serial } = useParams();
  const nav = useNavigate();
  const list = units.length ? units : UNITS;
  const u = (serial && UNITS.find((x) => x.serial === serial)) || list.find((x) => x.stage === 'maintenance') || list[0];
  const field = isField(u);

  const picker = (
    <div className="sel-row">
      <label className="small muted" htmlFor="unit-pick">Drill through to</label>
      <select id="unit-pick" value={u.serial} onChange={(e) => nav(`/units/${e.target.value}`)}>
        {!list.includes(u) && <option value={u.serial}>{u.serial} · {stageOf(u.stage).name}</option>}
        {list.map((x) => (
          <option key={x.serial} value={x.serial}>{x.serial} · {stageOf(x.stage).name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHead page={page} lede="Everything known about one unit, keyed on its serial number. Open it from any table or the wheel." right={picker} summary={unitSummary(u)} />

      <Panel>
        <div className="unit-head">
          <div>
            <div className="serial">{u.serial}</div>
            <div className="meta">
              <span>{u.model}</span>
              <span>{u.site}</span>
              <span>{u.region}</span>
              {field && <span>Commissioned {fd(u.commissioned)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StagePill unit={u} />
            {field && <RiskPill p={u.prob} />}
          </div>
        </div>
        <Stepper u={u} />
      </Panel>

      {field ? (
        <KpiRow>
          <Kpi label="Uptime · 30 d" value={u.uptime} unit="%" sub="Fleet target 95%" tone={u.uptime >= 95 ? 'ok' : 'warn'} />
          <Kpi label="Downtime · 30 d" value={u.down} unit="h" sub={`${u.dayDown} h on day shift`} />
          <Kpi label="Failure risk" value={pct(u.prob)} unit="%" sub={u.drivers.join(' · ')} tone={u.prob >= 0.65 ? 'alert' : u.prob >= 0.35 ? 'warn' : 'ok'} />
          <Kpi label="Faults · 6 mo" value={u.faults.length} sub={u.faults[0] ? 'Last: ' + u.faults[0].name : 'None'} />
        </KpiRow>
      ) : (
        <KpiRow>
          <Kpi label="AI handover forecast" value={fd(u.forecast)} sub={`${u.conf}% confidence`} />
          <Kpi label="Planned handover" value={fd(u.planned)} sub="From the project schedule" />
          <Kpi label="Forecast slip" value={signed(u.slip)} unit="days" sub={u.slip > 7 ? 'Raise with the project lead' : 'Within tolerance'} tone={u.slip > 7 ? 'alert' : u.slip > 0 ? 'warn' : 'ok'} />
          <Kpi label="Days in stage" value={u.daysIn} unit={`/ ${u.plan}`} sub={stageOf(u.stage).name} tone={u.overdue ? 'alert' : undefined} />
        </KpiRow>
      )}

      <div className="grid-2-1">
        <Panel title="Emulsion pump pressure · last 24 h (bar)" actions={u.anomaly ? <Pill tone="bad">AI: anomaly flagged 4 h ago</Pill> : <span />}>
          {field ? (
            <TelemetryChart values={u.pressure} threshold={14} unit="bar" lo={6} hi={15} marks={u.anomaly ? [40, 43, 46] : []} />
          ) : (
            <p className="muted">Telemetry starts after handover, once the unit is on site.</p>
          )}
        </Panel>
        <Panel title="Unit record">
          <dl className="dl">
            <dt>Explosives vehicle permit</dt>
            <dd>
              {!field ? 'Issued at handover' : u.certDue < 0 ? <Pill tone="bad">Expired</Pill> : u.certDue <= 30 ? <Pill tone="warn">{u.certDue} days left</Pill> : fd(addDays(TODAY, u.certDue))}
            </dd>
            <dt>Pressure vessel cert</dt>
            <dd>{field ? fd(addDays(u.commissioned, 730)) : 'Pending'}</dd>
            <dt>Roadworthy</dt>
            <dd>{field ? fd(addDays(TODAY, u.roadworthyInDays)) : 'Pending'}</dd>
            <dt>Crew on this unit</dt>
            <dd style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {u.techs.map((t) => <TechChip key={t} id={t} />)}
            </dd>
          </dl>
        </Panel>
      </div>

      <div className="grid2">
        <Panel title="Commissioning tests">
          {u.tests.length ? (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>ITP test</th><th>Result</th><th>Date</th><th>Technician</th></tr></thead>
                <tbody>
                  {u.tests.map((t) => (
                    <tr key={t.test}>
                      <td>{t.test}</td>
                      <td><Pill tone={t.result === 'Pass' ? 'ok' : t.result === 'Retest' ? 'warn' : 'bad'}>{t.result}</Pill></td>
                      <td className="mono small">{fd(t.date)}</td>
                      <td><TechChip id={t.tech} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Commissioning tests start after build sign-off.</p>
          )}
        </Panel>
        <Panel title="Fault history">
          {u.faults.length ? (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Date</th><th>Fault</th><th>Fix</th><th className="r">Down h</th><th>Technician</th></tr></thead>
                <tbody>
                  {u.faults.map((f, i) => (
                    <tr key={i}>
                      <td className="mono small">{fd(f.date)}</td>
                      <td><span className="mono small">{f.code}</span> {f.name}</td>
                      <td>{f.fix}</td>
                      <td className="r">{f.hours}</td>
                      <td><TechChip id={f.tech} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">{field ? 'No faults recorded in the last 6 months.' : 'Fault history starts once the unit is in the field.'}</p>
          )}
        </Panel>
      </div>

      {u.faults.length > 0 && <RepairSuggestions u={u} />}

      <PageNotes page={page} />
    </>
  );
}
