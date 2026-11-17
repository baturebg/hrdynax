import { BadgeCheck, FileWarning, HardHat, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Kpi, KpiRow, Locked, PageHead, PageNotes, Panel, Pill, UnitLink } from '../components/ui';
import { LTIFR } from '../data/finance';
import { TECHS, TODAY } from '../data/sample';
import { addDays, fd } from '../lib/format';
import { can, isField } from '../lib/selectors';
import { pageById } from '../routes';
import { useApp } from '../state/AppContext';

const page = pageById('compliance');

export default function CompliancePage() {
  const { units, role } = useApp();
  const nav = useNavigate();
  const field = units.filter(isField).sort((a, b) => a.certDue - b.certDue);
  const certs = TECHS.flatMap((t) => t.certs.map((c) => ({ tech: t, ...c }))).sort((a, b) => a.expiresInDays - b.expiresInDays);
  const valid = field.filter((u) => u.certDue > 0).length + certs.filter((c) => c.expiresInDays > 0).length;
  const rate = (valid / Math.max(1, field.length + certs.length)) * 100;
  const due = field.filter((u) => u.certDue <= 30);
  const certsDue = certs.filter((c) => c.expiresInDays <= 60);

  return (
    <>
      <PageHead page={page} lede="Explosives vehicle permits on every field unit and the certificates technicians need to work on them, with the site safety record." />
      <KpiRow>
        <Kpi variant="purple" icon={ShieldCheck} label="Compliance rate" value={rate.toFixed(1)} unit="%" sub="Permits and certificates valid" />
        <Kpi tone={due.length ? 'alert' : 'ok'} icon={FileWarning} label="Permits due · 30 d" value={due.length} sub={`${field.filter((u) => u.certDue < 0).length} already expired`} />
        <Kpi variant="gold" icon={BadgeCheck} label="Certificates due · 60 d" value={certsDue.length} sub="Technician renewals" />
        <Kpi variant="teal" icon={HardHat} label="LTIFR" value={LTIFR.current.toFixed(2)} sub={`Was ${LTIFR.prior} last year`} />
      </KpiRow>

      <Panel title="Explosives vehicle permits" icon={FileWarning}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Serial</th><th>Client site</th><th>Model</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              {field.slice(0, 15).map((u) => (
                <tr key={u.serial} className="click" onClick={() => nav(`/units/${u.serial}`)}>
                  <td><UnitLink serial={u.serial} /></td>
                  <td>{u.site}</td>
                  <td>{u.model}</td>
                  <td className="mono small">{fd(addDays(TODAY, u.certDue))}</td>
                  <td>{u.certDue < 0 ? <Pill tone="bad">Expired</Pill> : u.certDue <= 30 ? <Pill tone="warn">{u.certDue} days</Pill> : <Pill tone="ok">Valid</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Soonest 15 shown. The permit &amp; cert expiry automation reminds site managers at 30, 14 and 7 days.</p>
      </Panel>

      {can(role, 'people') ? (
        <Panel title="Technician certificates due in 60 days" icon={BadgeCheck}>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Technician</th><th>Certificate</th><th>Expires</th><th>Status</th></tr></thead>
              <tbody>
                {certsDue.map((c) => (
                  <tr key={c.tech.id + c.name} className="click" onClick={() => nav(`/technicians/${c.tech.id}`)}>
                    <td>{c.tech.name} <span className="mono small muted">{c.tech.id}</span></td>
                    <td>{c.name}</td>
                    <td className="mono small">{fd(addDays(TODAY, c.expiresInDays))}</td>
                    <td>{c.expiresInDays < 0 ? <Pill tone="bad">Expired</Pill> : <Pill tone="warn">{c.expiresInDays} days</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Locked what={`${certsDue.length} technician certificates expire within 60 days.`} need="people" />
      )}
      <PageNotes page={page} />
    </>
  );
}
