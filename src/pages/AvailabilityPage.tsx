import { useNavigate } from 'react-router-dom';
import { HBars, Kpi, KpiRow, PageHead, PageNotes, Panel, UnitLink } from '../components/ui';
import { HEAT, SITES, WEEKS } from '../data/sample';
import { avg } from '../lib/format';
import { isField } from '../lib/selectors';
import { availabilitySummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('availability');
const heatClass = (v: number) => (v >= 97 ? 'h4' : v >= 95 ? 'h3' : v >= 90 ? 'h2' : 'h1');

export default function AvailabilityPage() {
  const { units, site } = useApp();
  const nav = useNavigate();
  const field = units.filter(isField);
  const uptime = avg(field.map((u) => u.uptime));
  const heat = HEAT.filter((h) => site === 'all' || h.site === site);
  const bySite = SITES.map((s) => {
    const xs = field.filter((u) => u.site === s.name);
    return { site: s.name, n: xs.length, up: avg(xs.map((u) => u.uptime)) };
  }).filter((x) => x.n);
  const worst = [...bySite].sort((a, b) => a.up - b.up)[0];
  const down = field.reduce((a, u) => a + u.down, 0);
  const day = field.reduce((a, u) => a + u.dayDown, 0);

  return (
    <>
      <PageHead page={page} lede="Share of scheduled hours each unit was ready to charge holes, from SCADA/PLC telemetry. Target is 95%." summary={availabilitySummary(units)} />
      <KpiRow>
        <Kpi label="Fleet uptime · 30 d" value={uptime.toFixed(1)} unit="%" sub={`${field.length} units in the field`} tone={uptime >= 95 ? 'ok' : 'warn'} />
        <Kpi label="Downtime · 30 d" value={down.toLocaleString('en-ZA')} unit="h" sub={`Day ${day} h · Night ${down - day} h`} />
        <Kpi label="Units below 95%" value={field.filter((u) => u.uptime < 95).length} sub="Includes units in maintenance" tone="alert" />
        <Kpi label="Lowest site" value={worst ? worst.up.toFixed(1) : '—'} unit={worst ? '%' : undefined} sub={worst?.site} />
      </KpiRow>

      <Panel title="Weekly uptime by client site (%)">
        <div className="tbl-wrap">
          <div className="heat" style={{ gridTemplateColumns: 'auto repeat(12, minmax(34px, 1fr))' }}>
            <span />
            {WEEKS.map((w) => <span key={w} className="cl">{w}</span>)}
            {heat.map((h) => (
              <div key={h.site} style={{ display: 'contents' }}>
                <span className="rl">{h.site}</span>
                {h.weeks.map((v, i) => (
                  <span key={i} className={`cell ${heatClass(v)}`} title={`${h.site} ${WEEKS[i]}: ${v}%`}>{Math.round(v)}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="legend">
          <span><i className="h4" />97% and up</span>
          <span><i className="h3" />95–97%</span>
          <span><i className="h2" />90–95%</span>
          <span><i className="h1" />Below 90%</span>
        </div>
      </Panel>

      <div className="grid2">
        <Panel title="Uptime by site · 30 d">
          <HBars max={20} rows={bySite.map((b) => ({ label: b.site, value: `${b.up.toFixed(1)}%`, parts: [{ v: Math.max(0, b.up - 80), className: b.up >= 95 ? 'okf' : 'warnf' }] }))} />
          <p className="small muted" style={{ margin: '10px 0 0' }}>Bars start at 80% so small gaps stay visible.</p>
        </Panel>
        <Panel title="Lowest uptime units">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Serial</th><th>Site</th><th className="r">Uptime</th><th className="r">Down h</th></tr></thead>
              <tbody>
                {[...field].sort((a, b) => a.uptime - b.uptime).slice(0, 6).map((u) => (
                  <tr key={u.serial} className="click" onClick={() => nav(`/units/${u.serial}`)}>
                    <td><UnitLink serial={u.serial} /></td>
                    <td>{u.site}</td>
                    <td className="r" style={{ color: u.uptime < 90 ? 'var(--bad)' : u.uptime < 95 ? 'var(--warn)' : undefined }}>{u.uptime}%</td>
                    <td className="r">{u.down}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <PageNotes page={page} />
    </>
  );
}
