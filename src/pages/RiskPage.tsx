import { useNavigate } from 'react-router-dom';
import { RiskHistogram } from '../components/charts';
import { Kpi, KpiRow, PageHead, PageNotes, Panel, ProbBar, RiskPill, UnitLink } from '../components/ui';
import { fd } from '../lib/format';
import { isField } from '../lib/selectors';
import { riskSummary } from '../lib/summaries';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('risk');

export default function RiskPage() {
  const { units } = useApp();
  const nav = useNavigate();
  const field = units.filter(isField).sort((a, b) => b.prob - a.prob);

  return (
    <>
      <PageHead page={page} lede="Chance each field unit fails in the next 30 days. Scores are written back to the data layer daily, the same way attrition scores are." summary={riskSummary(units)} />
      <div className="banner">
        <b>Phasing</b> Years 1–2 show rule-based alerts (service overdue, repeat fault codes). Year 3 swaps in model scores without changing this page.
      </div>
      <KpiRow>
        <Kpi label="Peak" value={field.filter((u) => u.prob >= 0.65).length} sub="65% and above" tone="alert" />
        <Kpi label="Medium" value={field.filter((u) => u.prob >= 0.35 && u.prob < 0.65).length} sub="35–64%" tone="warn" />
        <Kpi label="Low" value={field.filter((u) => u.prob < 0.35).length} sub="Below 35%" tone="ok" />
        <Kpi label="Last scored" value="06:00" sub="Today · daily batch" />
      </KpiRow>
      <Panel title="Units by risk score">
        <RiskHistogram probs={field.map((u) => u.prob)} />
      </Panel>
      <Panel title="Units ranked by risk">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Serial</th><th>Client site</th><th>Probability</th><th>Level</th><th>Top drivers</th><th>Last fault</th></tr></thead>
            <tbody>
              {field.slice(0, 14).map((u) => (
                <tr key={u.serial} className="click" onClick={() => nav(`/units/${u.serial}`)}>
                  <td><UnitLink serial={u.serial} /></td>
                  <td>{u.site}</td>
                  <td><ProbBar p={u.prob} /></td>
                  <td><RiskPill p={u.prob} /></td>
                  <td>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {u.drivers.map((d) => <span key={d} className="chip">{d}</span>)}
                    </span>
                  </td>
                  <td className="small">
                    {u.faults[0] ? (
                      <><span className="mono">{u.faults[0].code}</span> · {fd(u.faults[0].date)}</>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <PageNotes page={page} />
    </>
  );
}
