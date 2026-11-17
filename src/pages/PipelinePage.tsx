import { useNavigate } from 'react-router-dom';
import { ColumnChart } from '../components/charts';
import { HBars, Kpi, KpiRow, PageHead, PageNotes, Panel, StagePill, UnitLink } from '../components/ui';
import { DELIVERED, PIPE } from '../data/sample';
import { fd, signed } from '../lib/format';
import { isPipe, stageOf, techById } from '../lib/selectors';
import { pipelineSummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('pipeline');

export default function PipelinePage() {
  const { units } = useApp();
  const nav = useNavigate();
  const pipe = units.filter(isPipe).sort((a, b) => b.daysIn - b.plan - (a.daysIn - a.plan));
  const late = pipe.filter((u) => u.overdue).length;
  const max = Math.max(1, ...PIPE.map((s) => units.filter((u) => u.stage === s).length));
  const first = DELIVERED[0];
  const last = DELIVERED[DELIVERED.length - 1];

  return (
    <>
      <PageHead page={page} lede="Units being bought, built, commissioned and handed over. Late means a unit has spent longer in its stage than planned." summary={pipelineSummary(units)} />

      <KpiRow>
        <Kpi label="In pipeline" value={pipe.length} sub="Procurement to handover" />
        <Kpi label="Late" value={late} sub={`${Math.round((late / Math.max(1, pipe.length)) * 100)}% of pipeline`} tone="alert" />
        <Kpi label="Delivered YTD" value={DELIVERED.slice(1).reduce((a, d) => a + d.units, 0)} sub="Handed over to clients" />
        <Kpi label="Avg cycle time" value={last.cycleDays} unit="days" sub={`PO to handover · was ${first.cycleDays} in Dec`} tone="ok" />
      </KpiRow>

      <div className="grid2">
        <Panel title="Units by stage">
          <HBars
            max={max}
            rows={PIPE.map((s) => {
              const all = units.filter((u) => u.stage === s);
              const l = all.filter((u) => u.overdue).length;
              return { label: stageOf(s).name, value: all.length, parts: [{ v: all.length - l }, { v: l, className: 'over', title: `${l} late` }] };
            })}
          />
          <div className="legend">
            <span><i style={{ background: 'var(--accent)' }} />On plan</span>
            <span><i style={{ background: 'var(--bad)' }} />Late</span>
          </div>
        </Panel>
        <Panel title="Units delivered per month">
          <ColumnChart data={DELIVERED.map((d) => ({ label: d.label, value: d.units }))} height={190} />
        </Panel>
      </div>

      <Panel title="Units in pipeline">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Serial</th><th>Model</th><th>Client site</th><th>Stage</th><th className="r">Days in stage</th><th className="r">Planned</th>
                <th>Stage due</th><th>AI handover forecast</th><th className="r">Slip</th><th>Lead technician</th>
              </tr>
            </thead>
            <tbody>
              {pipe.length ? (
                pipe.map((u) => (
                  <tr key={u.serial} className="click" onClick={() => nav(`/units/${u.serial}`)}>
                    <td><UnitLink serial={u.serial} /></td>
                    <td>{u.model}</td>
                    <td>{u.site}</td>
                    <td><StagePill unit={u} /></td>
                    <td className="r" style={u.overdue ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>{u.daysIn}</td>
                    <td className="r">{u.plan}</td>
                    <td className="mono small">{fd(u.due)}</td>
                    <td className="mono small">{fd(u.forecast)} <span className="muted">· {u.conf}%</span></td>
                    <td className="r" style={{ color: u.slip > 7 ? 'var(--bad)' : u.slip > 0 ? 'var(--warn)' : 'var(--ok)', fontWeight: 600 }}>{signed(u.slip)} d</td>
                    <td>{techById(u.techs[0]).name}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={10} className="muted">No units in the pipeline for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <PageNotes page={page} />
    </>
  );
}
