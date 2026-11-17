import { useNavigate, useParams } from 'react-router-dom';
import { Kpi, KpiRow, Locked, PageHead, PageNotes, Panel, Pill, RiskPill } from '../components/ui';
import { TECHS, TODAY } from '../data/sample';
import { addDays, fd } from '../lib/format';
import { can } from '../lib/selectors';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('tech');

export default function TechnicianProfilePage() {
  const { role } = useApp();
  const { id } = useParams();
  const nav = useNavigate();
  const lede = 'One technician’s certifications, sites and the work they signed off, joined to units by technician ID.';

  if (!can(role, 'people'))
    return (
      <>
        <PageHead page={page} lede={lede} />
        <Locked what="This page shows named technicians, their certifications and retention risk." />
        <PageNotes page={page} />
      </>
    );

  const t = TECHS.find((x) => x.id === id) ?? TECHS[0];
  const expiring = t.certs.filter((c) => c.expiresInDays <= 60).length;
  const picker = (
    <div className="sel-row">
      <label className="small muted" htmlFor="tech-pick">Technician</label>
      <select id="tech-pick" value={t.id} onChange={(e) => nav(`/technicians/${e.target.value}`)}>
        {TECHS.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.id}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <PageHead page={page} lede={lede} right={picker} />
      <Panel>
        <div className="unit-head">
          <div>
            <div className="serial" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30 }}>{t.name}</div>
            <div className="meta">
              <span className="mono">{t.id}</span>
              <span>{t.role}</span>
              <span>Based at {t.base}</span>
            </div>
          </div>
          <div>Retention risk <RiskPill p={t.risk} /></div>
        </div>
      </Panel>
      <KpiRow>
        <Kpi label="Jobs · 90 d" value={t.jobs} sub="Build, test and maintenance" />
        <Kpi label="First-time pass rate" value={t.ftp} unit="%" sub="Tests they signed" tone={t.ftp >= 90 ? 'ok' : 'warn'} />
        <Kpi label="Units supported" value={t.units.length} sub="Appears on unit records" />
        <Kpi label="Certs expiring · 60 d" value={expiring} sub="Renewal needed" tone={expiring ? 'warn' : undefined} />
      </KpiRow>
      <div className="grid2">
        <Panel title="Certifications">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Certificate</th><th>Expires</th><th>Status</th></tr></thead>
              <tbody>
                {t.certs.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="mono small">{fd(addDays(TODAY, c.expiresInDays))}</td>
                    <td>
                      {c.expiresInDays < 0 ? <Pill tone="bad">Expired</Pill> : c.expiresInDays <= 60 ? <Pill tone="warn">{c.expiresInDays} days</Pill> : <Pill tone="ok">Valid</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Units supported">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {t.units.length ? (
              t.units.map((s) => (
                <button key={s} type="button" className="chip mono" onClick={() => nav(`/units/${s}`)}>{s}</button>
              ))
            ) : (
              <span className="muted">None yet.</span>
            )}
          </div>
        </Panel>
      </div>
      <PageNotes page={page} />
    </>
  );
}
