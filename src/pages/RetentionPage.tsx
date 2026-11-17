import { useNavigate } from 'react-router-dom';
import { Kpi, KpiRow, Locked, PageHead, PageNotes, Panel, ProbBar, RiskPill } from '../components/ui';
import { TECHS } from '../data/sample';
import { can } from '../lib/selectors';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('retention');

export default function RetentionPage() {
  const { role } = useApp();
  const nav = useNavigate();

  if (!can(role, 'people'))
    return (
      <>
        <PageHead page={page} lede="Technicians whose loss would leave units without certified cover." />
        <Locked what="This page lists named technicians with their predicted retention risk." />
        <PageNotes page={page} />
      </>
    );

  const ranked = [...TECHS].sort((a, b) => b.risk - a.risk);
  const peak = ranked.filter((t) => t.risk >= 0.65);

  return (
    <>
      <PageHead page={page} lede="Technicians whose loss would leave units without certified cover. Ranked by retention risk, weighted by how many units they support." />
      <KpiRow>
        <Kpi label="Peak risk" value={peak.length} sub="Technicians" tone="alert" />
        <Kpi label="Units exposed" value={new Set(peak.flatMap((t) => t.units)).size} sub="Supported by a Peak-risk tech" tone="warn" />
        <Kpi label="PLC / SCADA holders" value={ranked.filter((t) => t.certs.some((c) => c.name === 'PLC / SCADA')).length} sub="Across all sites" />
        <Kpi label="Model run" value="06:00" sub="Today · daily batch" />
      </KpiRow>
      <Panel title="Technicians ranked by retention risk">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Technician</th><th>Role</th><th>Probability</th><th>Level</th><th className="r">Units supported</th><th>Key certificates</th></tr></thead>
            <tbody>
              {ranked.map((t) => (
                <tr key={t.id} className="click" onClick={() => nav(`/technicians/${t.id}`)}>
                  <td>{t.name} <span className="mono small muted">{t.id}</span></td>
                  <td>{t.role}</td>
                  <td><ProbBar p={t.risk} /></td>
                  <td><RiskPill p={t.risk} /></td>
                  <td className="r">{t.units.length}</td>
                  <td>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {t.certs.slice(0, 3).map((c) => <span key={c.name} className="chip">{c.name}</span>)}
                    </span>
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
